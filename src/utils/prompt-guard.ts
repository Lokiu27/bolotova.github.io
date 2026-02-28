/**
 * Prompt Guard Module
 * 
 * Provides protection against prompt injection attacks by:
 * - Sanitizing user input to neutralize injection patterns
 * - Wrapping user input in special delimiters
 * - Detecting known prompt injection patterns
 * 
 * Validates: Requirements 12.1-12.3
 */

/**
 * Interface for the PromptGuard module
 */
export interface PromptGuard {
  sanitizeUserInput(input: string): string
  wrapUserInput(input: string): string
  detectInjectionPatterns(input: string): boolean
}

/**
 * Known prompt injection patterns to detect and neutralize
 * These patterns attempt to manipulate LLM behavior
 */
const INJECTION_PATTERNS: RegExp[] = [
  // Instruction override attempts
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
  /forget\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
  /override\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
  
  // Role/context manipulation
  /^system\s*:/gim,
  /^assistant\s*:/gim,
  /^user\s*:/gim,
  /^human\s*:/gim,
  /^ai\s*:/gim,
  
  // Delimiter escape attempts (backticks used for user input wrapping)
  /```/g,
  
  // Jailbreak attempts
  /you\s+are\s+(now\s+)?(?:a|an)\s+(?:different|new|evil|unrestricted)/gi,
  /pretend\s+(you\s+are|to\s+be)\s+(?:a|an)/gi,
  /act\s+as\s+(?:a|an|if)/gi,
  /roleplay\s+as/gi,
  /simulate\s+(?:a|an|being)/gi,
  
  // Prompt leaking attempts
  /what\s+(are|is)\s+(your|the)\s+(instructions?|prompts?|rules?|system)/gi,
  /show\s+(me\s+)?(your|the)\s+(instructions?|prompts?|rules?|system)/gi,
  /reveal\s+(your|the)\s+(instructions?|prompts?|rules?|system)/gi,
  /print\s+(your|the)\s+(instructions?|prompts?|rules?|system)/gi,
  
  // Output manipulation
  /respond\s+(only\s+)?with/gi,
  /output\s+(only\s+)?the\s+following/gi,
  /say\s+(only\s+)?the\s+following/gi,
  
  // Developer mode / DAN attempts
  /developer\s+mode/gi,
  /\bdan\b/gi,
  /do\s+anything\s+now/gi,
  /jailbreak/gi,
  /bypass\s+(safety|filter|restriction)/gi
]

/**
 * Patterns that should be escaped rather than removed
 * to preserve user intent while neutralizing injection potential
 */
const ESCAPE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Escape backticks to prevent delimiter breaking
  { pattern: /```/g, replacement: '\\`\\`\\`' },
  // Escape role markers at line start
  { pattern: /^(system|assistant|user|human|ai)\s*:/gim, replacement: '[$1]:' }
]

/**
 * User input delimiter for clear separation from system instructions
 * Uses triple backticks with a unique marker
 */
const USER_INPUT_DELIMITER_START = '```user_input'
const USER_INPUT_DELIMITER_END = '```'

/**
 * Sanitize user input by neutralizing prompt injection patterns
 * 
 * This function:
 * 1. Escapes delimiter characters to prevent breaking out of user input section
 * 2. Neutralizes role markers (system:, assistant:, etc.)
 * 3. Removes or escapes known injection patterns
 * 
 * @param input - Raw user input string
 * @returns Sanitized string safe for inclusion in LLM prompt
 * 
 * Validates: Requirement 12.3
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return ''
  
  let result = input
  
  // Step 1: Escape backticks to prevent delimiter breaking
  // Replace ``` with escaped version
  result = result.replace(/```/g, '\\`\\`\\`')
  
  // Step 2: Neutralize role markers at line start
  // Transform "system:" to "[system]:" to prevent role injection
  result = result.replace(/^(system)\s*:/gim, '[system]:')
  result = result.replace(/^(assistant)\s*:/gim, '[assistant]:')
  result = result.replace(/^(user)\s*:/gim, '[user]:')
  result = result.replace(/^(human)\s*:/gim, '[human]:')
  result = result.replace(/^(ai)\s*:/gim, '[ai]:')
  
  // Step 3: Neutralize instruction override patterns
  // Replace with bracketed versions to preserve readability while neutralizing
  result = result.replace(
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
    '[ignore $1$2 $3]'
  )
  result = result.replace(
    /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
    '[disregard $1$2 $3]'
  )
  result = result.replace(
    /forget\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
    '[forget $1$2 $3]'
  )
  result = result.replace(
    /override\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
    '[override $1$2 $3]'
  )
  
  return result
}

/**
 * Wrap user input in special delimiters for clear separation
 * from system instructions
 * 
 * The delimiters create a clear boundary that helps the LLM
 * distinguish between instructions and user-provided data
 * 
 * @param input - User input (should be pre-sanitized)
 * @returns Input wrapped in delimiters
 * 
 * Validates: Requirements 12.1, 12.2
 */
export function wrapUserInput(input: string): string {
  if (!input) return `${USER_INPUT_DELIMITER_START}\n${USER_INPUT_DELIMITER_END}`
  
  return `${USER_INPUT_DELIMITER_START}\n${input}\n${USER_INPUT_DELIMITER_END}`
}

/**
 * Detect if input contains known prompt injection patterns
 * 
 * This is a detection-only function that returns true if any
 * injection patterns are found. Use sanitizeUserInput to
 * neutralize detected patterns.
 * 
 * @param input - User input to check
 * @returns true if injection patterns detected, false otherwise
 * 
 * Validates: Requirement 12.3
 */
export function detectInjectionPatterns(input: string): boolean {
  if (!input) return false
  
  // Check against all known injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0
    if (pattern.test(input)) {
      return true
    }
  }
  
  return false
}

/**
 * Create a PromptGuard instance with all protection methods
 * 
 * @returns PromptGuard interface implementation
 */
export function createPromptGuard(): PromptGuard {
  return {
    sanitizeUserInput,
    wrapUserInput,
    detectInjectionPatterns
  }
}

/**
 * Default export for convenience
 */
export default createPromptGuard
