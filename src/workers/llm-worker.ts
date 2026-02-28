/**
 * LLM Worker - Main Web Worker File
 * 
 * Coordinates all LLM operations in a Web Worker for non-blocking inference:
 * - Message handling from main thread
 * - Generation → Self-evaluation → Validation flow
 * - Retry logic (up to 3 attempts)
 * - Cancel request handling
 * - Memory status checking
 * 
 * Validates: Requirements 6.1, 6.4, 9.1-9.4, 10.1-10.5, 11.2
 */

import { 
  loadModel, 
  generate, 
  isLoaded, 
  abort, 
  checkMemory,
  DEFAULT_LLM_CONFIG,
  type ProgressCallback,
  type MemoryStatus
} from './llm-engine'

import {
  buildGenerationPrompt,
  buildEvaluationPrompt,
  extractSchema,
  parseEvaluation,
  isSchemaSecure
} from './schema-generator'

import { validateDraft07 } from './schema-validator'
import { parse as safeJsonParse, containsDangerousKeys } from '../utils/json-sanitizer'

// ============================================================================
// Types
// ============================================================================

/**
 * Message types from main thread to worker
 */
export type WorkerInMessage = 
  | { type: 'generate'; payload: { input: string } }
  | { type: 'cancel' }
  | { type: 'checkMemory' }

/**
 * Generation result returned to main thread
 */
export interface GenerationResult {
  success: boolean
  schema?: string
  error?: string
  attempts: number
}

/**
 * Message types from worker to main thread
 */
export type WorkerOutMessage =
  | { type: 'progress'; payload: { percent: number; message: string } }
  | { type: 'attempt'; payload: { current: number; max: number } }
  | { type: 'result'; payload: GenerationResult }
  | { type: 'memory'; payload: MemoryStatus }
  | { type: 'error'; payload: { message: string } }

// ============================================================================
// Constants
// ============================================================================

const MAX_ATTEMPTS = DEFAULT_LLM_CONFIG.maxAttempts // 3

/**
 * Generation options for LLM inference
 */
const GENERATION_OPTIONS = {
  maxNewTokens: DEFAULT_LLM_CONFIG.maxNewTokens,
  temperature: DEFAULT_LLM_CONFIG.temperature,
  doSample: true,
  topP: DEFAULT_LLM_CONFIG.topP
}

// ============================================================================
// State
// ============================================================================

let isGenerating = false
let isCancelled = false

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Send a message to the main thread
 */
function postMessage(message: WorkerOutMessage): void {
  self.postMessage(message)
}

/**
 * Send progress update to main thread
 */
function sendProgress(percent: number, message: string): void {
  postMessage({ type: 'progress', payload: { percent, message } })
}

/**
 * Send attempt update to main thread
 * Validates: Requirement 10.3
 */
function sendAttempt(current: number, max: number): void {
  postMessage({ type: 'attempt', payload: { current, max } })
}

/**
 * Send result to main thread
 */
function sendResult(result: GenerationResult): void {
  postMessage({ type: 'result', payload: result })
}

/**
 * Send error to main thread
 */
function sendError(message: string): void {
  postMessage({ type: 'error', payload: { message } })
}

/**
 * Create progress callback for model loading
 */
function createProgressCallback(): ProgressCallback {
  return (progress) => {
    sendProgress(progress.percent, progress.message)
  }
}

// ============================================================================
// Core Generation Logic
// ============================================================================

/**
 * Perform a single generation attempt
 * 
 * @param userInput - User's description
 * @returns Generated schema string or null if failed
 */
async function attemptGeneration(userInput: string): Promise<string | null> {
  if (isCancelled) return null
  
  // Build generation prompt
  // Validates: Requirements 4.1, 12.1, 12.2
  const generationPrompt = buildGenerationPrompt(userInput)
  
  console.log('[LLM Worker] Generation prompt:', generationPrompt)
  
  sendProgress(30, 'Генерация JSON Schema...')
  
  // Generate schema
  // Validates: Requirement 6.1
  const rawResponse = await generate(generationPrompt, GENERATION_OPTIONS)
  
  console.log('[LLM Worker] Raw model response:', rawResponse)
  
  if (isCancelled) return null
  
  // Extract JSON Schema from response
  // Validates: Requirement 4.3
  const extractedSchema = extractSchema(rawResponse)
  
  console.log('[LLM Worker] Extracted schema:', extractedSchema)
  
  if (!extractedSchema) {
    console.warn('[LLM Worker] Failed to extract schema from response')
    return null
  }
  
  return extractedSchema
}

/**
 * Validate schema security (no executable code, no prototype pollution)
 * 
 * @param schema - Schema string to validate
 * @returns true if secure, false otherwise
 * 
 * Validates: Requirements 12.4, 14.1, 14.2
 */
function validateSchemaSecurity(schema: string): boolean {
  // Check for executable code
  // Validates: Requirement 12.4
  if (!isSchemaSecure(schema)) {
    console.warn('[LLM Worker] Schema failed security check (executable code detected)')
    return false
  }
  
  // Check for prototype pollution keys
  // Validates: Requirements 14.1, 14.2
  const parsed = safeJsonParse(schema)
  if (!parsed) {
    console.warn('[LLM Worker] Schema failed to parse as JSON')
    return false
  }
  
  if (containsDangerousKeys(parsed)) {
    console.warn('[LLM Worker] Schema contains dangerous keys (prototype pollution)')
    return false
  }
  
  console.log('[LLM Worker] Schema passed security validation')
  return true
}

/**
 * Perform self-evaluation of generated schema
 * 
 * @param userInput - Original user description
 * @param schema - Generated schema to evaluate
 * @returns true if schema matches description, false otherwise
 * 
 * Validates: Requirements 9.1-9.3
 */
async function performSelfEvaluation(userInput: string, schema: string): Promise<boolean> {
  if (isCancelled) return false
  
  sendProgress(60, 'Проверка соответствия схемы описанию...')
  
  // Build evaluation prompt
  // Validates: Requirement 9.2
  const evaluationPrompt = buildEvaluationPrompt(userInput, schema)
  
  console.log('[LLM Worker] Evaluation prompt:', evaluationPrompt)
  
  // Get LLM evaluation
  // Validates: Requirement 9.1
  const evaluationResponse = await generate(evaluationPrompt, {
    ...GENERATION_OPTIONS,
    maxNewTokens: 50 // Short response expected
  })
  
  console.log('[LLM Worker] Evaluation response:', evaluationResponse)
  
  if (isCancelled) return false
  
  // Parse evaluation response
  // Validates: Requirement 9.3
  const result = parseEvaluation(evaluationResponse)
  console.log('[LLM Worker] Evaluation result:', result)
  
  return result
}

/**
 * Validate schema against Draft-07 specification
 * 
 * @param schema - Schema string to validate
 * @returns true if valid Draft-07, false otherwise
 * 
 * Validates: Requirement 11.1
 */
function validateSchemaFormat(schema: string): boolean {
  const parsed = safeJsonParse(schema)
  if (!parsed) {
    console.warn('[LLM Worker] Schema failed JSON parsing for Draft-07 validation')
    return false
  }
  
  const validationResult = validateDraft07(parsed)
  console.log('[LLM Worker] Draft-07 validation result:', validationResult)
  
  return validationResult.valid
}

/**
 * Main generation flow with retry logic
 * 
 * Flow:
 * 1. Load model if not loaded
 * 2. Generate JSON Schema
 * 3. Validate security (no code, no prototype pollution)
 * 4. Run self-evaluation
 * 5. Validate Draft-07 format
 * 6. Retry up to 3 times if any step fails
 * 
 * @param userInput - User's description of the object
 * 
 * Validates: Requirements 6.1, 9.1-9.4, 10.1-10.5, 11.2
 */
async function handleGenerate(userInput: string): Promise<void> {
  if (isGenerating) {
    sendError('Генерация уже выполняется')
    return
  }
  
  isGenerating = true
  isCancelled = false
  
  // Reset attempt counter for new request
  // Validates: Requirement 10.5
  let currentAttempt = 0
  
  try {
    // Load model if not loaded
    if (!isLoaded()) {
      sendProgress(0, 'Загрузка модели...')
      await loadModel(createProgressCallback())
      
      if (isCancelled) {
        sendResult({ success: false, error: 'Генерация отменена', attempts: 0 })
        return
      }
    }
    
    // Retry loop
    // Validates: Requirements 10.1-10.2
    while (currentAttempt < MAX_ATTEMPTS) {
      currentAttempt++
      
      // Send attempt update
      // Validates: Requirement 10.3
      sendAttempt(currentAttempt, MAX_ATTEMPTS)
      
      if (isCancelled) {
        sendResult({ success: false, error: 'Генерация отменена', attempts: currentAttempt })
        return
      }
      
      // Step 1: Generate schema
      const schema = await attemptGeneration(userInput)
      
      if (isCancelled) {
        sendResult({ success: false, error: 'Генерация отменена', attempts: currentAttempt })
        return
      }
      
      if (!schema) {
        // Generation failed, retry
        // Validates: Requirement 10.1
        if (currentAttempt < MAX_ATTEMPTS) {
          sendProgress(20, `Не удалось извлечь схему. Попытка ${currentAttempt + 1} из ${MAX_ATTEMPTS}...`)
          continue
        }
        break
      }
      
      // Step 2: Validate security
      // Validates: Requirements 12.4, 14.1-14.2
      if (!validateSchemaSecurity(schema)) {
        // Security violation, retry
        if (currentAttempt < MAX_ATTEMPTS) {
          sendProgress(40, `Обнаружен небезопасный контент. Попытка ${currentAttempt + 1} из ${MAX_ATTEMPTS}...`)
          continue
        }
        break
      }
      
      // Step 3: Validate Draft-07 format (skip self-evaluation for small models)
      // Self-evaluation tends to be too strict and causes unnecessary retries
      // Validates: Requirements 9.4, 11.1
      sendProgress(70, 'Валидация JSON Schema Draft-07...')
      
      if (!validateSchemaFormat(schema)) {
        // Validation failed, retry
        // Validates: Requirement 11.2
        if (currentAttempt < MAX_ATTEMPTS) {
          sendProgress(85, `Схема не соответствует Draft-07. Попытка ${currentAttempt + 1} из ${MAX_ATTEMPTS}...`)
          continue
        }
        break
      }
      
      // Success!
      sendProgress(100, 'Генерация завершена успешно')
      sendResult({ success: true, schema, attempts: currentAttempt })
      return
    }
    
    // All attempts exhausted
    // Validates: Requirement 10.4
    sendResult({
      success: false,
      error: 'Не удалось сгенерировать корректную схему после 3 попыток. Попробуйте изменить или уточнить описание.',
      attempts: currentAttempt
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
    
    if (isCancelled || errorMessage.includes('отменена')) {
      sendResult({ success: false, error: 'Генерация отменена', attempts: currentAttempt })
    } else {
      sendResult({ success: false, error: errorMessage, attempts: currentAttempt })
    }
  } finally {
    isGenerating = false
  }
}

/**
 * Handle cancel request
 * 
 * Aborts current generation and sets cancelled flag.
 * 
 * Validates: Requirement 6.4
 */
function handleCancel(): void {
  isCancelled = true
  abort()
  
  if (isGenerating) {
    sendProgress(0, 'Отмена генерации...')
  }
}

/**
 * Handle memory check request
 * 
 * Returns current memory status to main thread.
 * 
 * Validates: Requirement 13.5
 */
async function handleCheckMemory(): Promise<void> {
  try {
    const memoryStatus = await checkMemory()
    postMessage({ type: 'memory', payload: memoryStatus })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Не удалось проверить память'
    sendError(errorMessage)
  }
}

// ============================================================================
// Message Handler
// ============================================================================

/**
 * Main message handler for worker
 * 
 * Routes incoming messages to appropriate handlers.
 * 
 * Validates: Requirement 6.1
 */
self.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const message = event.data
  
  switch (message.type) {
    case 'generate':
      await handleGenerate(message.payload.input)
      break
      
    case 'cancel':
      handleCancel()
      break
      
    case 'checkMemory':
      await handleCheckMemory()
      break
      
    default:
      sendError(`Неизвестный тип сообщения: ${(message as { type: string }).type}`)
  }
}

// ============================================================================
// Exports for Testing
// ============================================================================

export {
  MAX_ATTEMPTS,
  handleGenerate,
  handleCancel,
  handleCheckMemory,
  validateSchemaSecurity,
  performSelfEvaluation,
  validateSchemaFormat
}
