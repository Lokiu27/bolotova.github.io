/**
 * Schema Generator Module
 * 
 * Handles prompt construction and response parsing for JSON Schema generation.
 * 
 * Features:
 * - Build generation prompts with system instructions and user input delimiters
 * - Build evaluation prompts for self-assessment
 * - Extract JSON Schema from LLM responses (handles markdown, text wrapping)
 * - Parse evaluation responses for "соответствует" / "не соответствует"
 * - Detect and reject executable code in generated schemas
 * 
 * Validates: Requirements 4.1, 4.3, 9.2-9.3, 12.1-12.2, 12.4
 */

import { sanitizeUserInput, wrapUserInput } from '../utils/prompt-guard'

/**
 * Interface for the SchemaGenerator module
 */
export interface SchemaGenerator {
  buildGenerationPrompt(userInput: string): string
  buildEvaluationPrompt(userInput: string, schema: string): string
  extractSchema(llmResponse: string): string | null
  parseEvaluation(llmResponse: string): boolean
}

/**
 * System prompt for JSON Schema generation
 * Provides clear instructions to the LLM about the task
 * 
 * Validates: Requirements 4.1, 12.1
 */
const GENERATION_SYSTEM_PROMPT = `Ты — эксперт по JSON Schema. Твоя задача — создать JSON Schema Draft-07 на основе описания объекта от пользователя.

ПРАВИЛА:
1. Создай ТОЛЬКО валидную JSON Schema Draft-07
2. Используй "$schema": "http://json-schema.org/draft-07/schema#"
3. Определи типы данных на основе описания
4. Добавь описания (description) для свойств, если это уместно
5. Укажи обязательные поля в массиве "required"
6. НЕ включай исполняемый код, JavaScript или HTML
7. Ответ должен содержать ТОЛЬКО JSON Schema, без пояснений

ФОРМАТ ОТВЕТА:
\`\`\`json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": { ... },
  "required": [ ... ]
}
\`\`\``

/**
 * System prompt for self-evaluation
 * Asks LLM to assess if generated schema matches user description
 * 
 * Validates: Requirement 9.2
 */
const EVALUATION_SYSTEM_PROMPT = `Ты — эксперт по JSON Schema. Оцени, соответствует ли предоставленная JSON Schema описанию объекта от пользователя.

КРИТЕРИИ ОЦЕНКИ:
1. Схема должна описывать все ключевые сущности из описания
2. Типы данных должны быть логичными для описанных свойств
3. Обязательные поля должны быть корректно определены
4. Схема должна быть валидной JSON Schema Draft-07

ФОРМАТ ОТВЕТА:
Ответь ТОЛЬКО одним словом: "соответствует" или "не соответствует"`

/**
 * Patterns for detecting executable code in JSON Schema
 * These patterns indicate potentially malicious content
 * 
 * Validates: Requirement 12.4
 */
const EXECUTABLE_CODE_PATTERNS: RegExp[] = [
  // JavaScript code patterns
  /\bfunction\s*\(/gi,
  /\beval\s*\(/gi,
  /\bnew\s+Function\s*\(/gi,
  /\bsetTimeout\s*\(/gi,
  /\bsetInterval\s*\(/gi,
  /\bdocument\./gi,
  /\bwindow\./gi,
  /\balert\s*\(/gi,
  /\bconsole\./gi,
  /\brequire\s*\(/gi,
  /\bimport\s*\(/gi,
  /\bexport\s+/gi,
  
  // Arrow functions
  /=>\s*{/g,
  /=>\s*[^{]/g,
  
  // HTML script tags
  /<script[\s>]/gi,
  /<\/script>/gi,
  
  // HTML event handlers
  /\bon\w+\s*=/gi,
  /javascript:/gi,
  /data:text\/html/gi,
  /data:application\/javascript/gi,
  
  // Iframe and object tags
  /<iframe[\s>]/gi,
  /<object[\s>]/gi,
  /<embed[\s>]/gi,
  
  // SVG with scripts
  /<svg[\s>].*?<script/gi,
]

/**
 * Build a generation prompt with system instructions and wrapped user input
 * 
 * The prompt structure ensures clear separation between:
 * 1. System instructions (how to generate)
 * 2. User input (what to generate for)
 * 
 * @param userInput - The user's description of the object
 * @returns Complete prompt for LLM generation
 * 
 * Validates: Requirements 4.1, 12.1, 12.2
 */
export function buildGenerationPrompt(userInput: string): string {
  if (!userInput) {
    return GENERATION_SYSTEM_PROMPT + '\n\n' + wrapUserInput('')
  }
  
  // Sanitize user input to prevent prompt injection
  const sanitizedInput = sanitizeUserInput(userInput)
  
  // Wrap in delimiters for clear separation
  const wrappedInput = wrapUserInput(sanitizedInput)
  
  // Combine system prompt with wrapped user input
  return `${GENERATION_SYSTEM_PROMPT}

Описание объекта от пользователя:
${wrappedInput}`
}

/**
 * Build an evaluation prompt for self-assessment
 * 
 * Provides the LLM with both the original description and generated schema
 * to assess if they match.
 * 
 * @param userInput - The original user description
 * @param schema - The generated JSON Schema to evaluate
 * @returns Complete prompt for LLM evaluation
 * 
 * Validates: Requirement 9.2
 */
export function buildEvaluationPrompt(userInput: string, schema: string): string {
  if (!userInput || !schema) {
    return EVALUATION_SYSTEM_PROMPT
  }
  
  // Sanitize user input
  const sanitizedInput = sanitizeUserInput(userInput)
  const wrappedInput = wrapUserInput(sanitizedInput)
  
  return `${EVALUATION_SYSTEM_PROMPT}

Описание объекта от пользователя:
${wrappedInput}

Сгенерированная JSON Schema:
\`\`\`json
${schema}
\`\`\``
}

/**
 * Extract JSON Schema from LLM response
 * 
 * Handles various response formats:
 * - JSON wrapped in markdown code blocks (```json ... ```)
 * - JSON wrapped in generic code blocks (``` ... ```)
 * - Raw JSON object
 * - JSON surrounded by explanatory text
 * 
 * Also performs post-processing to fix common LLM errors:
 * - Corrupted $schema URLs
 * 
 * @param llmResponse - Raw response from LLM
 * @returns Extracted JSON Schema string, or null if not found
 * 
 * Validates: Requirement 4.3
 */
export function extractSchema(llmResponse: string): string | null {
  if (!llmResponse || typeof llmResponse !== 'string') {
    return null
  }
  
  const trimmedResponse = llmResponse.trim()
  
  // Try to extract from markdown code blocks first
  // Pattern: ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmedResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch && codeBlockMatch[1]) {
    const extracted = codeBlockMatch[1].trim()
    const fixed = fixCommonSchemaErrors(extracted)
    if (isValidJsonObject(fixed)) {
      return fixed
    }
  }
  
  // Try to find JSON object directly (starts with { and ends with })
  const jsonMatch = trimmedResponse.match(/(\{[\s\S]*\})/)
  if (jsonMatch && jsonMatch[1]) {
    const extracted = jsonMatch[1].trim()
    const fixed = fixCommonSchemaErrors(extracted)
    if (isValidJsonObject(fixed)) {
      return fixed
    }
  }
  
  // Try the entire response as JSON
  const fixedResponse = fixCommonSchemaErrors(trimmedResponse)
  if (isValidJsonObject(fixedResponse)) {
    return fixedResponse
  }
  
  return null
}

/**
 * Fix common LLM errors in generated JSON Schema
 * 
 * Common issues:
 * - Corrupted $schema URL (e.g., "json-schema.orgujf.org" instead of "json-schema.org")
 * - Missing or malformed draft version
 * - Trailing commas in JSON (invalid but common LLM mistake)
 * 
 * @param schema - Raw schema string
 * @returns Fixed schema string
 */
function fixCommonSchemaErrors(schema: string): string {
  if (!schema) return schema
  
  let fixed = schema
  
  // Fix trailing commas in JSON (common LLM mistake)
  // Pattern: ,} or ,] - remove the comma
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1')
  
  // Fix corrupted $schema URLs
  // Pattern: "http://json-schema.org[garbage]" -> "http://json-schema.org/draft-07/schema#"
  const schemaUrlPattern = /"?\$schema"?\s*:\s*"http:\/\/json-schema\.org[^"]*"/gi
  const correctSchemaUrl = '"$schema": "http://json-schema.org/draft-07/schema#"'
  
  // Check if $schema exists but is malformed
  if (schemaUrlPattern.test(fixed)) {
    // Reset lastIndex after test
    schemaUrlPattern.lastIndex = 0
    fixed = fixed.replace(schemaUrlPattern, correctSchemaUrl)
  }
  
  return fixed
}

/**
 * Check if a string is a valid JSON object
 * 
 * @param str - String to validate
 * @returns true if valid JSON object, false otherwise
 */
function isValidJsonObject(str: string): boolean {
  if (!str || !str.startsWith('{') || !str.endsWith('}')) {
    return false
  }
  
  try {
    const parsed = JSON.parse(str)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
  } catch {
    return false
  }
}

/**
 * Parse evaluation response to determine if schema matches description
 * 
 * Looks for "соответствует" (matches) or "не соответствует" (doesn't match)
 * in the LLM response, handling various formats and case variations.
 * 
 * @param llmResponse - Raw evaluation response from LLM
 * @returns true if "соответствует", false if "не соответствует" or unclear
 * 
 * Validates: Requirement 9.3
 */
export function parseEvaluation(llmResponse: string): boolean {
  if (!llmResponse || typeof llmResponse !== 'string') {
    return false
  }
  
  const normalizedResponse = llmResponse.toLowerCase().trim()
  
  // Check for negative response first (more specific)
  // "не соответствует" should return false
  if (normalizedResponse.includes('не соответствует') || 
      normalizedResponse.includes('не_соответствует') ||
      normalizedResponse.includes('несоответствует')) {
    return false
  }
  
  // Check for positive response
  // "соответствует" should return true
  if (normalizedResponse.includes('соответствует')) {
    return true
  }
  
  // Handle English variations (in case LLM responds in English)
  if (normalizedResponse.includes('does not match') ||
      normalizedResponse.includes('doesn\'t match') ||
      normalizedResponse.includes('not match') ||
      normalizedResponse.includes('invalid') ||
      normalizedResponse.includes('incorrect')) {
    return false
  }
  
  if (normalizedResponse.includes('matches') ||
      normalizedResponse.includes('valid') ||
      normalizedResponse.includes('correct')) {
    return true
  }
  
  // Default to false if unclear
  return false
}

/**
 * Detect if a schema contains executable code
 * 
 * Checks for JavaScript, HTML scripts, event handlers, and other
 * potentially dangerous executable content in the schema string.
 * 
 * @param schema - JSON Schema string to check
 * @returns true if executable code detected, false otherwise
 * 
 * Validates: Requirement 12.4
 */
export function containsExecutableCode(schema: string): boolean {
  if (!schema || typeof schema !== 'string') {
    return false
  }
  
  // Check against all executable code patterns
  for (const pattern of EXECUTABLE_CODE_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0
    if (pattern.test(schema)) {
      return true
    }
  }
  
  return false
}

/**
 * Validate schema for security (no executable code)
 * 
 * This is the inverse of containsExecutableCode - returns true if safe.
 * Used by Self_Evaluator to reject results with executable code.
 * 
 * @param schema - JSON Schema string to validate
 * @returns true if schema is safe (no executable code), false otherwise
 * 
 * Validates: Requirement 12.4
 */
export function isSchemaSecure(schema: string): boolean {
  return !containsExecutableCode(schema)
}

/**
 * Create a SchemaGenerator instance with all methods
 * 
 * @returns SchemaGenerator interface implementation
 */
export function createSchemaGenerator(): SchemaGenerator {
  return {
    buildGenerationPrompt,
    buildEvaluationPrompt,
    extractSchema,
    parseEvaluation
  }
}

/**
 * Default export for convenience
 */
export default createSchemaGenerator
