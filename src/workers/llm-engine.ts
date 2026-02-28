/**
 * LLM Engine Module
 * 
 * Manages loading and inference of the Phi-3.5-mini model via transformers.js v3.
 * Designed to run in a Web Worker for non-blocking inference.
 * Uses WebGPU for accelerated inference when available.
 * 
 * Features:
 * - Load model from trusted Hugging Face CDN
 * - Cache model in memory after loading
 * - Generate text with configurable options
 * - Abort ongoing generation
 * - Check browser memory before loading
 * 
 * Validates: Requirements 3.1, 3.3, 6.1, 7.3, 13.2, 13.5
 */

import { pipeline, env, type TextGenerationPipeline } from '@huggingface/transformers'

/**
 * Generation options for LLM inference
 */
export interface GenerateOptions {
  maxNewTokens: number
  temperature: number
  doSample: boolean
  topP: number
}

/**
 * Memory status result
 */
export interface MemoryStatus {
  available: boolean
  estimatedFreeMemory: number
  warning?: string
}

/**
 * Progress callback for model loading
 */
export type ProgressCallback = (progress: { percent: number; message: string }) => void

/**
 * LLM Engine interface
 */
export interface LlmEngine {
  loadModel(onProgress?: ProgressCallback): Promise<void>
  generate(prompt: string, options: GenerateOptions): Promise<string>
  isLoaded(): boolean
  abort(): void
}

/**
 * Default LLM configuration
 * Using onnx-community/Phi-3.5-mini-instruct-onnx-web for WebGPU support
 * Validates: Requirements 3.1, 13.2, 13.5
 */
export const DEFAULT_LLM_CONFIG = {
  modelId: 'onnx-community/Phi-3.5-mini-instruct-onnx-web',
  maxInputLength: 2000,
  maxNewTokens: 1024,
  temperature: 0.3,
  topP: 0.9,
  generationTimeoutMs: 120000, // 2 minutes for larger model
  maxAttempts: 3,
  rateLimitMs: 5000,
  minMemoryMb: 2048, // 2GB minimum - model is ~1.5GB quantized
} as const

/**
 * Trusted model source - Hugging Face CDN
 * Validates: Requirement 7.3
 */
const TRUSTED_MODEL_SOURCE = 'huggingface.co'

/**
 * Validate that model ID is from trusted source
 * @param modelId - Model identifier to validate
 * @returns true if model is from trusted source
 */
function isFromTrustedSource(modelId: string): boolean {
  // Model IDs from Hugging Face follow the pattern: organization/model-name
  // transformers.js loads from huggingface.co by default
  // We only allow models that will be loaded from Hugging Face CDN
  return modelId.includes('/') && !modelId.includes('://') || 
         modelId.includes(TRUSTED_MODEL_SOURCE)
}

// Module-level state for singleton pattern
let generatorPipeline: TextGenerationPipeline | null = null
let isModelLoaded = false
let abortController: AbortController | null = null

/**
 * Configure transformers.js environment for browser usage
 * - Disable local model caching (use browser cache instead)
 * - Allow remote models from Hugging Face CDN
 */
function configureEnvironment(): void {
  // Allow remote models from Hugging Face
  env.allowRemoteModels = true
  // Use browser cache for model files
  env.useBrowserCache = true
  // Disable local file system access (not available in browser)
  env.allowLocalModels = false
}

/**
 * Check if WebGPU is available in the browser
 * @returns true if WebGPU is supported
 */
async function isWebGPUAvailable(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false
  if (!('gpu' in navigator)) return false
  
  try {
    // @ts-expect-error - WebGPU types may not be available
    const adapter = await navigator.gpu.requestAdapter()
    return adapter !== null
  } catch {
    return false
  }
}

/**
 * Check available browser memory
 * Uses Performance API when available, falls back to estimation
 * 
 * @returns Memory status with availability and warnings
 * 
 * Validates: Requirement 13.5
 */
export async function checkMemory(): Promise<MemoryStatus> {
  const minMemoryMb = DEFAULT_LLM_CONFIG.minMemoryMb
  
  // Try to use Performance Memory API (Chrome only)
  // @ts-expect-error - memory is a non-standard Chrome extension
  const memory = performance.memory
  
  if (memory) {
    const usedHeapMb = memory.usedJSHeapSize / (1024 * 1024)
    const totalHeapMb = memory.jsHeapSizeLimit / (1024 * 1024)
    const freeMb = totalHeapMb - usedHeapMb
    
    if (freeMb < minMemoryMb) {
      return {
        available: false,
        estimatedFreeMemory: Math.round(freeMb),
        warning: `Недостаточно памяти: доступно ${Math.round(freeMb)} MB, требуется минимум ${minMemoryMb} MB. Закройте другие вкладки для освобождения памяти.`
      }
    }
    
    return {
      available: true,
      estimatedFreeMemory: Math.round(freeMb)
    }
  }
  
  // Fallback: try navigator.deviceMemory (approximate device RAM)
  // @ts-expect-error - deviceMemory is not in all browsers
  const deviceMemory = navigator.deviceMemory
  
  if (deviceMemory) {
    // deviceMemory returns RAM in GB, convert to MB
    // Note: browsers cap this value (usually at 8GB) for privacy
    const estimatedFreeMb = deviceMemory * 1024 * 0.5 // Assume 50% available
    
    // Only warn, don't block - deviceMemory is unreliable
    if (estimatedFreeMb < minMemoryMb) {
      return {
        available: true, // Allow to proceed anyway
        estimatedFreeMemory: Math.round(estimatedFreeMb),
        warning: `Устройство может иметь недостаточно памяти. Рекомендуется минимум ${minMemoryMb} MB свободной памяти.`
      }
    }
    
    return {
      available: true,
      estimatedFreeMemory: Math.round(estimatedFreeMb)
    }
  }
  
  // No memory API available - assume sufficient memory with warning
  return {
    available: true,
    estimatedFreeMemory: -1,
    warning: 'Не удалось определить доступную память. Если загрузка модели не удастся, попробуйте закрыть другие вкладки.'
  }
}

/**
 * Load the Phi-3.5-mini model via transformers.js v3
 * 
 * - Loads from trusted Hugging Face CDN only
 * - Uses WebGPU for acceleration when available
 * - Caches model in browser memory after loading
 * - Reports progress via callback
 * 
 * @param onProgress - Optional callback for loading progress
 * @throws Error if model loading fails
 * 
 * Validates: Requirements 3.1, 3.3, 7.3
 */
export async function loadModel(onProgress?: ProgressCallback): Promise<void> {
  // Return early if model is already loaded (cached in memory)
  // Validates: Requirement 3.3
  if (isModelLoaded && generatorPipeline) {
    onProgress?.({ percent: 100, message: 'Модель уже загружена' })
    return
  }
  
  // Configure environment for browser usage
  configureEnvironment()
  
  // Validate model is from trusted source
  // Validates: Requirement 7.3
  if (!isFromTrustedSource(DEFAULT_LLM_CONFIG.modelId)) {
    throw new Error('Модель должна загружаться только из доверенного источника (Hugging Face)')
  }
  
  // Check memory before loading
  const memoryStatus = await checkMemory()
  if (!memoryStatus.available) {
    throw new Error(memoryStatus.warning || 'Недостаточно памяти для загрузки модели')
  }
  
  if (memoryStatus.warning) {
    onProgress?.({ percent: 0, message: memoryStatus.warning })
  }
  
  onProgress?.({ percent: 5, message: 'Проверка поддержки WebGPU...' })
  
  // Check WebGPU availability
  const webgpuAvailable = await isWebGPUAvailable()
  
  if (!webgpuAvailable) {
    throw new Error('WebGPU не поддерживается в вашем браузере. Требуется Chrome 113+, Edge 113+ или Safari с включённым WebGPU.')
  }
  
  onProgress?.({ percent: 10, message: 'Инициализация загрузки модели с WebGPU...' })
  
  try {
    // Load the text generation pipeline with WebGPU
    // Model is loaded from Hugging Face CDN (trusted source)
    // Validates: Requirement 7.3
    // @ts-expect-error - transformers.js v3 pipeline options type is complex
    generatorPipeline = await pipeline(
      'text-generation',
      DEFAULT_LLM_CONFIG.modelId,
      {
        device: 'webgpu',
        progress_callback: (progress: { status: string; progress?: number; file?: string }) => {
          if (progress.status === 'progress' && progress.progress !== undefined) {
            // Scale progress from 10% to 95% (leaving room for init and finalization)
            const scaledPercent = 10 + Math.round(progress.progress * 0.85)
            const fileName = progress.file ? ` (${progress.file})` : ''
            onProgress?.({ 
              percent: scaledPercent, 
              message: `Загрузка модели${fileName}...` 
            })
          } else if (progress.status === 'done') {
            onProgress?.({ percent: 95, message: 'Финализация загрузки...' })
          }
        }
      }
    )
    
    isModelLoaded = true
    onProgress?.({ percent: 100, message: 'Модель успешно загружена (WebGPU)' })
    
  } catch (error) {
    isModelLoaded = false
    generatorPipeline = null
    
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
    
    // Provide helpful error messages
    if (errorMessage.includes('WebGPU') || errorMessage.includes('GPU')) {
      throw new Error(`Ошибка WebGPU: ${errorMessage}. Убедитесь, что ваш браузер поддерживает WebGPU и GPU драйверы обновлены.`)
    }
    
    throw new Error(`Не удалось загрузить модель: ${errorMessage}. Попробуйте обновить страницу.`)
  }
}

/**
 * Generate text using the loaded model
 * 
 * - Applies generation timeout (60 seconds)
 * - Supports abort via AbortController
 * 
 * @param prompt - Input prompt for generation
 * @param options - Generation options (temperature, maxNewTokens, etc.)
 * @returns Generated text
 * @throws Error if model not loaded, generation fails, or timeout
 * 
 * Validates: Requirements 3.1, 6.1, 13.2
 */
export async function generate(prompt: string, options: GenerateOptions): Promise<string> {
  if (!isModelLoaded || !generatorPipeline) {
    throw new Error('Модель не загружена. Вызовите loadModel() перед генерацией.')
  }
  
  // Create new abort controller for this generation
  abortController = new AbortController()
  const signal = abortController.signal
  
  // Set up timeout
  // Validates: Requirement 13.2
  const timeoutId = setTimeout(() => {
    abortController?.abort()
  }, DEFAULT_LLM_CONFIG.generationTimeoutMs)
  
  try {
    // Check if already aborted
    if (signal.aborted) {
      throw new Error('Генерация отменена')
    }
    
    // Run generation with options
    const result = await generatorPipeline(prompt, {
      max_new_tokens: options.maxNewTokens,
      temperature: options.temperature,
      do_sample: options.doSample,
      top_p: options.topP,
      return_full_text: false
    })
    
    // Check if aborted during generation
    if (signal.aborted) {
      throw new Error('Генерация отменена')
    }
    
    // Extract generated text from result
    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0]
      if (typeof firstResult === 'object' && 'generated_text' in firstResult) {
        return String(firstResult.generated_text)
      }
    }
    
    throw new Error('Неожиданный формат ответа модели')
    
  } catch (error) {
    if (signal.aborted) {
      throw new Error('Генерация отменена')
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
    
    // Check for timeout
    if (errorMessage.includes('timeout') || errorMessage.includes('отменена')) {
      throw new Error('Генерация заняла слишком много времени. Попробуйте упростить описание.')
    }
    
    throw new Error(`Ошибка генерации: ${errorMessage}`)
    
  } finally {
    clearTimeout(timeoutId)
    abortController = null
  }
}

/**
 * Check if the model is currently loaded
 * 
 * @returns true if model is loaded and ready for generation
 */
export function isLoaded(): boolean {
  return isModelLoaded && generatorPipeline !== null
}

/**
 * Abort the current generation
 * 
 * Signals the abort controller to cancel ongoing generation.
 * Safe to call even if no generation is in progress.
 * 
 * Validates: Requirement 6.4
 */
export function abort(): void {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

/**
 * Create an LlmEngine instance with all methods
 * 
 * @returns LlmEngine interface implementation
 */
export function createLlmEngine(): LlmEngine {
  return {
    loadModel,
    generate,
    isLoaded,
    abort
  }
}

/**
 * Default export for convenience
 */
export default createLlmEngine
