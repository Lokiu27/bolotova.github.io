/**
 * Integration Tests for Mini LLM JSON Schema Generator
 * 
 * Tests the full flow from input to result, including:
 * - Input → generation → result flow
 * - Retry mechanism on failures
 * - Cancellation handling
 * 
 * Validates: Requirements 4.1-4.3, 9.1-9.4, 10.1-10.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

// Import modules under test
import { buildGenerationPrompt, buildEvaluationPrompt, extractSchema, parseEvaluation, isSchemaSecure } from '../../workers/schema-generator'
import { validateDraft07 } from '../../workers/schema-validator'
import { parse as safeJsonParse, containsDangerousKeys } from '../../utils/json-sanitizer'
import { createRetryManager, MAX_ATTEMPTS, type AttemptResult } from '../../workers/retry-manager'
import { useInputSanitizer } from '../../composables/useInputSanitizer'

// Get sanitization functions from composable
const { sanitize, sanitizeClipboard, validateLength } = useInputSanitizer()

// ============================================================================
// Mock Types
// ============================================================================

interface MockGenerationResult {
  success: boolean
  schema?: string
  value?: string
  error?: string
  attempts: number
}


// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a valid JSON Schema for testing
 */
function createValidSchema(properties: Record<string, { type: string; description?: string }>): string {
  return JSON.stringify({
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties,
    required: Object.keys(properties)
  }, null, 2)
}

/**
 * Simulate LLM response with JSON Schema
 */
function createLlmResponse(schema: string): string {
  return `Here is the JSON Schema for your description:

\`\`\`json
${schema}
\`\`\`

This schema defines the structure of the object you described.`
}

/**
 * Simulate evaluation response
 */
function createEvaluationResponse(matches: boolean): string {
  return matches 
    ? 'После анализа, схема соответствует описанию пользователя.'
    : 'Схема не соответствует описанию, так как отсутствуют некоторые поля.'
}

// ============================================================================
// Integration Tests: Full Generation Flow
// ============================================================================

describe('Integration Tests: Full Generation Flow', () => {
  /**
   * Test: Complete flow from user input to valid JSON Schema
   * 
   * Validates: Requirements 4.1-4.3, 9.1-9.4
   */
  describe('Input → Generation → Result Flow', () => {
    it('should generate valid JSON Schema from user description', () => {
      // Step 1: User provides description
      const userInput = 'Пользователь с именем, email и возрастом'
      
      // Step 2: Build generation prompt
      const generationPrompt = buildGenerationPrompt(userInput)
      
      // Verify prompt structure (Requirement 4.1, 12.1, 12.2)
      expect(generationPrompt).toContain('JSON Schema')
      expect(generationPrompt).toContain(userInput)
      expect(generationPrompt).toContain('```user_input')
      
      // Step 3: Simulate LLM response
      const schema = createValidSchema({
        name: { type: 'string', description: 'Имя пользователя' },
        email: { type: 'string', description: 'Email адрес' },
        age: { type: 'integer', description: 'Возраст пользователя' }
      })
      const llmResponse = createLlmResponse(schema)
      
      // Step 4: Extract schema from response (Requirement 4.3)
      const extractedSchema = extractSchema(llmResponse)
      expect(extractedSchema).not.toBeNull()
      
      // Step 5: Validate schema security
      expect(isSchemaSecure(extractedSchema!)).toBe(true)
      
      const parsed = safeJsonParse(extractedSchema!)
      expect(parsed).not.toBeNull()
      expect(containsDangerousKeys(parsed!)).toBe(false)
      
      // Step 6: Build evaluation prompt (Requirement 9.2)
      const evaluationPrompt = buildEvaluationPrompt(userInput, extractedSchema!)
      expect(evaluationPrompt).toContain(userInput)
      expect(evaluationPrompt).toContain(extractedSchema!)
      
      // Step 7: Simulate positive evaluation (Requirement 9.3)
      const evaluationResponse = createEvaluationResponse(true)
      const evaluationPassed = parseEvaluation(evaluationResponse)
      expect(evaluationPassed).toBe(true)
      
      // Step 8: Validate Draft-07 format (Requirement 9.4, 11.1)
      const validationResult = validateDraft07(parsed!)
      expect(validationResult.valid).toBe(true)
    })


    it('should handle complex nested object descriptions', () => {
      const userInput = 'Заказ с товарами, каждый товар имеет название, цену и количество'
      
      const generationPrompt = buildGenerationPrompt(userInput)
      expect(generationPrompt).toContain(userInput)
      
      // Simulate nested schema
      const schema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                price: { type: 'number' },
                quantity: { type: 'integer' }
              },
              required: ['name', 'price', 'quantity']
            }
          }
        },
        required: ['orderId', 'items']
      }, null, 2)
      
      const llmResponse = createLlmResponse(schema)
      const extractedSchema = extractSchema(llmResponse)
      
      expect(extractedSchema).not.toBeNull()
      
      const parsed = safeJsonParse(extractedSchema!)
      expect(parsed).not.toBeNull()
      
      const validationResult = validateDraft07(parsed!)
      expect(validationResult.valid).toBe(true)
    })

    it('should sanitize user input before processing', () => {
      // Test with potentially dangerous input
      const dangerousInput = '<script>alert("xss")</script>Описание объекта'
      
      // Sanitize input
      const sanitizedInput = sanitize(dangerousInput)
      
      // Should remove script tags
      expect(sanitizedInput).not.toContain('<script>')
      expect(sanitizedInput).not.toContain('</script>')
      expect(sanitizedInput).toContain('Описание объекта')
      
      // Build prompt with sanitized input
      const prompt = buildGenerationPrompt(sanitizedInput)
      expect(prompt).not.toContain('<script>')
    })

    it('should enforce input length limits', () => {
      // Create input exceeding 2000 characters
      const longInput = 'A'.repeat(2500)
      
      const result = validateLength(longInput, 2000)
      
      expect(result.truncated).toBe(true)
      expect(result.sanitizedValue.length).toBe(2000)
      expect(result.originalLength).toBe(2500)
    })
  })


  // ============================================================================
  // Integration Tests: Retry Mechanism
  // ============================================================================

  /**
   * Test: Retry mechanism on generation failures
   * 
   * Validates: Requirements 10.1-10.5
   */
  describe('Retry Mechanism', () => {
    it('should retry on failed self-evaluation up to MAX_ATTEMPTS', async () => {
      const retryManager = createRetryManager()
      const attemptResults: number[] = []
      
      // Simulate failures followed by success on attempt 3
      let attemptCount = 0
      const attemptFn = async (): Promise<AttemptResult> => {
        attemptCount++
        attemptResults.push(attemptCount)
        
        if (attemptCount < 3) {
          return { success: false, reason: 'evaluation_failed' }
        }
        return { success: true, value: '{"type": "object"}' }
      }
      
      const result = await retryManager.executeWithRetry(attemptFn)
      
      // Should succeed on attempt 3
      expect(result.success).toBe(true)
      expect(result.attempts).toBe(3)
      expect(attemptResults).toEqual([1, 2, 3])
    })

    it('should fail after exhausting all attempts', async () => {
      const retryManager = createRetryManager()
      
      // All attempts fail
      const attemptFn = async (): Promise<AttemptResult> => {
        return { success: false, reason: 'validation_failed' }
      }
      
      const result = await retryManager.executeWithRetry(attemptFn)
      
      // Should fail with max attempts exhausted (Requirement 10.4)
      expect(result.success).toBe(false)
      expect(result.attempts).toBe(MAX_ATTEMPTS)
      expect(result.error).toContain('3 попыток')
    })

    it('should reset attempt counter for new requests', async () => {
      const retryManager = createRetryManager()
      
      // First request - fails all attempts
      let firstRequestAttempts = 0
      await retryManager.executeWithRetry(async () => {
        firstRequestAttempts++
        return { success: false, reason: 'generation_failed' }
      })
      
      expect(firstRequestAttempts).toBe(MAX_ATTEMPTS)
      
      // Second request - should start fresh (Requirement 10.5)
      let secondRequestAttempts = 0
      const observedAttempts: number[] = []
      
      await retryManager.executeWithRetry(
        async () => {
          secondRequestAttempts++
          return { success: true, value: 'test' }
        },
        (current) => {
          observedAttempts.push(current)
        }
      )
      
      // Should start from attempt 1
      expect(observedAttempts[0]).toBe(1)
      expect(secondRequestAttempts).toBe(1)
    })


    it('should retry on security violations', async () => {
      const retryManager = createRetryManager()
      const attempts: string[] = []
      
      // First attempt returns schema with dangerous keys
      // Second attempt returns clean schema
      let attemptCount = 0
      const attemptFn = async (): Promise<AttemptResult> => {
        attemptCount++
        
        if (attemptCount === 1) {
          // Simulate security violation
          attempts.push('security_violation')
          return { success: false, reason: 'security_violation' }
        }
        
        attempts.push('success')
        return { success: true, value: '{"type": "object"}' }
      }
      
      const result = await retryManager.executeWithRetry(attemptFn)
      
      expect(result.success).toBe(true)
      expect(result.attempts).toBe(2)
      expect(attempts).toEqual(['security_violation', 'success'])
    })

    it('should retry on Draft-07 validation failures', async () => {
      const retryManager = createRetryManager()
      
      // First two attempts return invalid schema, third returns valid
      let attemptCount = 0
      const attemptFn = async (): Promise<AttemptResult> => {
        attemptCount++
        
        if (attemptCount < 3) {
          return { success: false, reason: 'validation_failed' }
        }
        
        return { 
          success: true, 
          value: JSON.stringify({
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object'
          })
        }
      }
      
      const result = await retryManager.executeWithRetry(attemptFn)
      
      expect(result.success).toBe(true)
      expect(result.attempts).toBe(3)
    })

    it('should track attempt numbers correctly during retries', async () => {
      const retryManager = createRetryManager()
      const observedAttempts: Array<{ current: number; max: number }> = []
      
      const attemptFn = async (): Promise<AttemptResult> => {
        return { success: false, reason: 'generation_failed' }
      }
      
      const onAttempt = (current: number, max: number) => {
        observedAttempts.push({ current, max })
      }
      
      await retryManager.executeWithRetry(attemptFn, onAttempt)
      
      // Should have exactly MAX_ATTEMPTS observations (Requirement 10.3)
      expect(observedAttempts.length).toBe(MAX_ATTEMPTS)
      expect(observedAttempts[0]).toEqual({ current: 1, max: MAX_ATTEMPTS })
      expect(observedAttempts[1]).toEqual({ current: 2, max: MAX_ATTEMPTS })
      expect(observedAttempts[2]).toEqual({ current: 3, max: MAX_ATTEMPTS })
    })
  })


  // ============================================================================
  // Integration Tests: Cancellation
  // ============================================================================

  /**
   * Test: Cancellation handling during generation
   * 
   * Validates: Requirements 6.3, 6.4
   */
  describe('Cancellation Handling', () => {
    it('should stop generation when cancelled', async () => {
      const retryManager = createRetryManager()
      let attemptCount = 0
      
      const attemptFn = async (): Promise<AttemptResult> => {
        attemptCount++
        
        // Cancel on second attempt
        if (attemptCount === 2) {
          retryManager.cancel()
        }
        
        return { success: false, reason: 'generation_failed' }
      }
      
      const result = await retryManager.executeWithRetry(attemptFn)
      
      // Should stop at attempt 2 due to cancellation
      expect(result.success).toBe(false)
      expect(result.attempts).toBe(2)
      expect(result.error).toContain('отменена')
    })

    it('should return cancelled error message when cancelled during attempt', async () => {
      const retryManager = createRetryManager()
      
      // Cancel during first attempt
      const attemptFn = async (): Promise<AttemptResult> => {
        retryManager.cancel()
        return { success: false, reason: 'generation_failed' }
      }
      
      const result = await retryManager.executeWithRetry(attemptFn)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Генерация отменена')
    })

    it('should allow new generation after cancellation', async () => {
      const retryManager = createRetryManager()
      
      // First request - cancelled during attempt
      let firstAttemptCount = 0
      const firstResult = await retryManager.executeWithRetry(async () => {
        firstAttemptCount++
        if (firstAttemptCount === 1) {
          retryManager.cancel()
        }
        return { success: false, reason: 'generation_failed' }
      })
      
      expect(firstResult.success).toBe(false)
      expect(firstResult.error).toContain('отменена')
      
      // Second request - should work normally
      const secondResult = await retryManager.executeWithRetry(async () => {
        return { success: true, value: 'test schema' }
      })
      
      expect(secondResult.success).toBe(true)
      expect(secondResult.value).toBe('test schema')
    })

    it('should not allow retry after cancellation within same session', () => {
      const retryManager = createRetryManager()
      
      retryManager.startSession()
      retryManager.incrementAttempt()
      
      // Should be able to retry before cancel
      expect(retryManager.canRetry()).toBe(true)
      
      // Cancel
      retryManager.cancel()
      
      // Should not be able to retry after cancel
      expect(retryManager.canRetry()).toBe(false)
      
      retryManager.endSession()
    })
  })


  // ============================================================================
  // Integration Tests: Self-Evaluation Flow
  // ============================================================================

  /**
   * Test: Self-evaluation integration
   * 
   * Validates: Requirements 9.1-9.4
   */
  describe('Self-Evaluation Flow', () => {
    it('should pass evaluation for matching schema', () => {
      const userInput = 'Продукт с названием и ценой'
      const schema = createValidSchema({
        name: { type: 'string', description: 'Название продукта' },
        price: { type: 'number', description: 'Цена продукта' }
      })
      
      // Build evaluation prompt (Requirement 9.2)
      const evaluationPrompt = buildEvaluationPrompt(userInput, schema)
      
      // Verify prompt contains both input and schema
      expect(evaluationPrompt).toContain(userInput)
      expect(evaluationPrompt).toContain('name')
      expect(evaluationPrompt).toContain('price')
      
      // Simulate positive evaluation
      const response = createEvaluationResponse(true)
      const result = parseEvaluation(response)
      
      expect(result).toBe(true)
    })

    it('should fail evaluation for non-matching schema', () => {
      const userInput = 'Пользователь с именем, email и телефоном'
      const schema = createValidSchema({
        name: { type: 'string' }
        // Missing email and phone
      })
      
      const evaluationPrompt = buildEvaluationPrompt(userInput, schema)
      expect(evaluationPrompt).toContain(userInput)
      
      // Simulate negative evaluation
      const response = createEvaluationResponse(false)
      const result = parseEvaluation(response)
      
      expect(result).toBe(false)
    })

    it('should reject schema with executable code', () => {
      const schemaWithCode = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          name: { 
            type: 'string',
            description: '<script>alert("xss")</script>'
          }
        }
      })
      
      // Security check should fail (Requirement 12.4)
      expect(isSchemaSecure(schemaWithCode)).toBe(false)
    })

    it('should reject schema with prototype pollution keys using raw JSON.parse', () => {
      const dangerousSchema = '{"__proto__": {"admin": true}, "type": "object"}'
      
      // Using standard JSON.parse (not safe parse) to verify the dangerous keys exist
      const rawParsed = JSON.parse(dangerousSchema)
      
      // The raw parsed object should have the dangerous key
      expect(Object.keys(rawParsed)).toContain('__proto__')
      
      // Safe parse should remove the dangerous keys
      const safeParsed = safeJsonParse(dangerousSchema)
      expect(safeParsed).not.toBeNull()
      
      // After safe parsing, dangerous keys should be removed
      expect(Object.keys(safeParsed!)).not.toContain('__proto__')
      
      // containsDangerousKeys should return false because safe parse already removed them
      expect(containsDangerousKeys(safeParsed!)).toBe(false)
    })
  })


  // ============================================================================
  // Integration Tests: Schema Validation Flow
  // ============================================================================

  /**
   * Test: JSON Schema Draft-07 validation integration
   * 
   * Validates: Requirements 11.1, 11.2
   */
  describe('Schema Validation Flow', () => {
    it('should validate correct Draft-07 schema', () => {
      const validSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          active: { type: 'boolean' }
        },
        required: ['id', 'name']
      }
      
      const result = validateDraft07(validSchema)
      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should reject invalid Draft-07 schema', () => {
      const invalidSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'invalid_type', // Invalid type
        properties: {}
      }
      
      const result = validateDraft07(invalidSchema)
      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should validate schema with array items', () => {
      const schemaWithArray = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
      
      const result = validateDraft07(schemaWithArray)
      expect(result.valid).toBe(true)
    })

    it('should validate schema with nested objects', () => {
      const nestedSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              zip: { type: 'string' }
            },
            required: ['street', 'city']
          }
        }
      }
      
      const result = validateDraft07(nestedSchema)
      expect(result.valid).toBe(true)
    })

    it('should validate schema with enum values', () => {
      const enumSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending']
          }
        }
      }
      
      const result = validateDraft07(enumSchema)
      expect(result.valid).toBe(true)
    })
  })


  // ============================================================================
  // Integration Tests: End-to-End Simulation
  // ============================================================================

  /**
   * Test: End-to-end generation simulation
   * 
   * Simulates the complete flow without actual LLM calls
   */
  describe('End-to-End Simulation', () => {
    /**
     * Simulate the complete generation flow
     */
    async function simulateGeneration(
      userInput: string,
      mockLlmResponses: {
        generation: string
        evaluation: string
      }[]
    ): Promise<MockGenerationResult> {
      const retryManager = createRetryManager()
      let responseIndex = 0
      
      const attemptFn = async (): Promise<AttemptResult> => {
        const responses = mockLlmResponses[responseIndex % mockLlmResponses.length]
        responseIndex++
        
        // Step 1: Extract schema from generation response
        const schema = extractSchema(responses.generation)
        if (!schema) {
          return { success: false, reason: 'generation_failed' }
        }
        
        // Step 2: Check security
        if (!isSchemaSecure(schema)) {
          return { success: false, reason: 'security_violation' }
        }
        
        const parsed = safeJsonParse(schema)
        if (!parsed || containsDangerousKeys(parsed)) {
          return { success: false, reason: 'security_violation' }
        }
        
        // Step 3: Parse evaluation
        const evaluationPassed = parseEvaluation(responses.evaluation)
        if (!evaluationPassed) {
          return { success: false, reason: 'evaluation_failed' }
        }
        
        // Step 4: Validate Draft-07
        const validationResult = validateDraft07(parsed)
        if (!validationResult.valid) {
          return { success: false, reason: 'validation_failed' }
        }
        
        return { success: true, value: schema }
      }
      
      return retryManager.executeWithRetry(attemptFn)
    }

    it('should complete successful generation on first attempt', async () => {
      const userInput = 'Книга с названием и автором'
      const schema = createValidSchema({
        title: { type: 'string' },
        author: { type: 'string' }
      })
      
      const result = await simulateGeneration(userInput, [{
        generation: createLlmResponse(schema),
        evaluation: createEvaluationResponse(true)
      }])
      
      expect(result.success).toBe(true)
      expect(result.attempts).toBe(1)
      expect(result.value).toBeDefined()
    })


    it('should succeed after retry when first evaluation fails', async () => {
      const userInput = 'Автомобиль с маркой и моделью'
      const schema = createValidSchema({
        brand: { type: 'string' },
        model: { type: 'string' }
      })
      
      const result = await simulateGeneration(userInput, [
        // First attempt - evaluation fails
        {
          generation: createLlmResponse(schema),
          evaluation: createEvaluationResponse(false)
        },
        // Second attempt - succeeds
        {
          generation: createLlmResponse(schema),
          evaluation: createEvaluationResponse(true)
        }
      ])
      
      expect(result.success).toBe(true)
      expect(result.attempts).toBe(2)
    })

    it('should fail after all retries exhausted', async () => {
      const userInput = 'Сложный объект'
      const schema = createValidSchema({ field: { type: 'string' } })
      
      // All attempts fail evaluation
      const result = await simulateGeneration(userInput, [{
        generation: createLlmResponse(schema),
        evaluation: createEvaluationResponse(false)
      }])
      
      expect(result.success).toBe(false)
      expect(result.attempts).toBe(MAX_ATTEMPTS)
    })

    it('should handle generation failure gracefully', async () => {
      const userInput = 'Тестовый объект'
      
      // LLM returns invalid response (no JSON)
      const result = await simulateGeneration(userInput, [{
        generation: 'This is not a valid JSON response',
        evaluation: createEvaluationResponse(true)
      }])
      
      expect(result.success).toBe(false)
      expect(result.attempts).toBe(MAX_ATTEMPTS)
    })

    it('should handle mixed success/failure scenarios', async () => {
      const userInput = 'Товар с ценой'
      const validSchema = createValidSchema({
        name: { type: 'string' },
        price: { type: 'number' }
      })
      
      const result = await simulateGeneration(userInput, [
        // Attempt 1: Invalid JSON
        {
          generation: 'Invalid response',
          evaluation: createEvaluationResponse(true)
        },
        // Attempt 2: Evaluation fails
        {
          generation: createLlmResponse(validSchema),
          evaluation: createEvaluationResponse(false)
        },
        // Attempt 3: Success
        {
          generation: createLlmResponse(validSchema),
          evaluation: createEvaluationResponse(true)
        }
      ])
      
      expect(result.success).toBe(true)
      expect(result.attempts).toBe(3)
    })
  })
})
