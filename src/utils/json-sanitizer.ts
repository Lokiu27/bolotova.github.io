/**
 * JSON Sanitizer Module
 * 
 * Provides protection against prototype pollution attacks by:
 * - Safe JSON parsing that prevents dangerous key injection
 * - Detection of dangerous keys (__proto__, constructor, prototype)
 * - Sanitization of objects by removing dangerous keys
 * 
 * Validates: Requirements 14.1-14.2
 */

/**
 * Interface for the JsonSanitizer module
 */
export interface JsonSanitizer {
  parse(jsonString: string): object | null
  containsDangerousKeys(obj: object): boolean
  sanitize(obj: object): object
}

/**
 * Dangerous keys that can lead to prototype pollution
 * These keys should never be present in parsed JSON objects
 */
const DANGEROUS_KEYS: ReadonlySet<string> = new Set([
  '__proto__',
  'constructor',
  'prototype'
])

/**
 * Check if a key is dangerous (could lead to prototype pollution)
 * 
 * @param key - The key to check
 * @returns true if the key is dangerous, false otherwise
 */
function isDangerousKey(key: string): boolean {
  return DANGEROUS_KEYS.has(key)
}

/**
 * Recursively check if an object contains any dangerous keys
 * 
 * This function traverses the entire object tree to detect
 * prototype pollution attempts at any nesting level.
 * 
 * @param obj - The object to check
 * @returns true if any dangerous keys are found, false otherwise
 * 
 * Validates: Requirement 14.1
 */
export function containsDangerousKeys(obj: object): boolean {
  if (obj === null || typeof obj !== 'object') {
    return false
  }

  // Handle arrays - check each element
  if (Array.isArray(obj)) {
    return obj.some(item => 
      item !== null && typeof item === 'object' && containsDangerousKeys(item)
    )
  }

  // Check object keys
  for (const key of Object.keys(obj)) {
    // Check if current key is dangerous
    if (isDangerousKey(key)) {
      return true
    }

    // Recursively check nested objects
    const value = (obj as Record<string, unknown>)[key]
    if (value !== null && typeof value === 'object') {
      if (containsDangerousKeys(value as object)) {
        return true
      }
    }
  }

  return false
}

/**
 * Recursively sanitize an object by removing dangerous keys
 * 
 * Creates a new object without any dangerous keys, preserving
 * all safe properties and their values.
 * 
 * @param obj - The object to sanitize
 * @returns A new object with dangerous keys removed
 * 
 * Validates: Requirement 14.2
 */
export function sanitize(obj: object): object {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // Handle arrays - sanitize each element
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (item !== null && typeof item === 'object') {
        return sanitize(item)
      }
      return item
    })
  }

  // Create new object without dangerous keys
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(obj)) {
    // Skip dangerous keys
    if (isDangerousKey(key)) {
      continue
    }

    const value = (obj as Record<string, unknown>)[key]

    // Recursively sanitize nested objects
    if (value !== null && typeof value === 'object') {
      result[key] = sanitize(value as object)
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Custom JSON reviver that rejects dangerous keys during parsing
 * 
 * This reviver is used with JSON.parse to prevent prototype pollution
 * at parse time, before the dangerous keys can affect the object.
 * 
 * @param key - The current key being parsed
 * @param value - The current value being parsed
 * @returns The value if safe, undefined to skip dangerous keys
 */
function safeReviver(key: string, value: unknown): unknown {
  // Skip dangerous keys entirely
  if (isDangerousKey(key)) {
    return undefined
  }
  return value
}

/**
 * Safely parse a JSON string, preventing prototype pollution
 * 
 * This function uses a custom reviver to reject dangerous keys
 * during the parsing process, ensuring the resulting object
 * cannot be used for prototype pollution attacks.
 * 
 * @param jsonString - The JSON string to parse
 * @returns The parsed object if valid, null if parsing fails
 * 
 * Validates: Requirements 14.1, 14.2
 */
export function parse(jsonString: string): object | null {
  if (!jsonString || typeof jsonString !== 'string') {
    return null
  }

  try {
    // Use safe reviver to filter dangerous keys during parsing
    const parsed = JSON.parse(jsonString, safeReviver)

    // Ensure we got an object (not a primitive)
    if (parsed === null || typeof parsed !== 'object') {
      return null
    }

    return parsed as object
  } catch {
    // Return null for invalid JSON
    return null
  }
}

/**
 * Create a JsonSanitizer instance with all protection methods
 * 
 * @returns JsonSanitizer interface implementation
 */
export function createJsonSanitizer(): JsonSanitizer {
  return {
    parse,
    containsDangerousKeys,
    sanitize
  }
}

/**
 * Default export for convenience
 */
export default createJsonSanitizer
