import DOMPurify from 'dompurify'

/**
 * Validation result for input length checking
 */
export interface ValidationResult {
  isValid: boolean
  truncated: boolean
  sanitizedValue: string
  originalLength: number
}

/**
 * Return type for useInputSanitizer composable
 */
export interface UseInputSanitizerReturn {
  sanitize: (input: string) => string
  sanitizeClipboard: (event: ClipboardEvent) => string
  validateLength: (input: string, maxLength: number) => ValidationResult
}

/**
 * Default maximum input length
 */
const DEFAULT_MAX_LENGTH = 2000

/**
 * Invisible Unicode characters to remove
 * - Zero-width space (U+200B)
 * - Zero-width non-joiner (U+200C)
 * - Zero-width joiner (U+200D)
 * - Left-to-right mark (U+200E)
 * - Right-to-left mark (U+200F)
 * - Word joiner (U+2060)
 * - Zero-width no-break space / BOM (U+FEFF)
 * - Soft hyphen (U+00AD)
 * - Various other invisible formatting characters
 */
const INVISIBLE_UNICODE_REGEX = /[\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\u00AD]/g

/**
 * Composable for sanitizing user input
 * 
 * Features:
 * - Sanitizes HTML/JS content using DOMPurify
 * - Limits input length to prevent model overload
 * - Handles clipboard paste (text/plain only)
 * - Removes invisible Unicode characters
 * - Normalizes line endings (\r\n → \n)
 * 
 * @returns Sanitization utilities
 * 
 * Validates: Requirements 2.3-2.5, 7.1, 15.1-15.4
 */
export function useInputSanitizer(): UseInputSanitizerReturn {
  /**
   * Remove invisible Unicode characters from input
   * Preserves tabs for table data support
   * 
   * @param input - Raw input string
   * @returns String with invisible characters removed
   * 
   * Validates: Requirement 15.3
   */
  const removeInvisibleUnicode = (input: string): string => {
    return input.replace(INVISIBLE_UNICODE_REGEX, '')
  }

  /**
   * Normalize line endings from Windows (\r\n) to Unix (\n)
   * 
   * @param input - Input string with mixed line endings
   * @returns String with normalized line endings
   * 
   * Validates: Requirement 15.4
   */
  const normalizeLineEndings = (input: string): string => {
    return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  }

  /**
   * Sanitize HTML/JS content from input
   * Removes potentially dangerous tags and scripts
   * 
   * @param input - Raw input string
   * @returns Sanitized string with HTML/JS removed
   * 
   * Validates: Requirements 2.5, 7.1
   */
  const sanitizeHtml = (input: string): string => {
    // Use DOMPurify with strict settings - only allow plain text
    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true // Keep text content
    })
    return sanitized
  }

  /**
   * Main sanitization function
   * Applies all sanitization steps in order:
   * 1. Remove invisible Unicode characters
   * 2. Normalize line endings
   * 3. Sanitize HTML/JS content
   * 4. Truncate to max length
   * 
   * @param input - Raw user input
   * @returns Fully sanitized string
   * 
   * Validates: Requirements 2.3-2.5, 7.1, 15.3-15.4
   */
  const sanitize = (input: string): string => {
    if (!input) return ''

    // Step 1: Remove invisible Unicode characters
    let result = removeInvisibleUnicode(input)

    // Step 2: Normalize line endings
    result = normalizeLineEndings(result)

    // Step 3: Sanitize HTML/JS content
    result = sanitizeHtml(result)

    // Step 4: Truncate to max length
    if (result.length > DEFAULT_MAX_LENGTH) {
      result = result.slice(0, DEFAULT_MAX_LENGTH)
    }

    return result
  }

  /**
   * Sanitize clipboard paste event
   * Extracts only text/plain content, ignoring HTML and Rich Text
   * 
   * @param event - ClipboardEvent from paste handler
   * @returns Sanitized text content from clipboard
   * 
   * Validates: Requirements 15.1-15.4
   */
  const sanitizeClipboard = (event: ClipboardEvent): string => {
    const clipboardData = event.clipboardData

    if (!clipboardData) {
      return ''
    }

    // Extract only text/plain content, ignoring HTML and Rich Text
    // Validates: Requirements 15.1, 15.2
    const textContent = clipboardData.getData('text/plain')

    if (!textContent) {
      return ''
    }

    // Apply full sanitization to clipboard content
    return sanitize(textContent)
  }

  /**
   * Validate input length and return detailed result
   * 
   * @param input - Input string to validate
   * @param maxLength - Maximum allowed length (default: 2000)
   * @returns Validation result with sanitized value
   * 
   * Validates: Requirements 2.3, 2.4
   */
  const validateLength = (
    input: string,
    maxLength: number = DEFAULT_MAX_LENGTH
  ): ValidationResult => {
    const originalLength = input.length
    const sanitizedValue = sanitize(input)
    const truncated = originalLength > maxLength

    return {
      isValid: sanitizedValue.length <= maxLength,
      truncated,
      sanitizedValue,
      originalLength
    }
  }

  return {
    sanitize,
    sanitizeClipboard,
    validateLength
  }
}
