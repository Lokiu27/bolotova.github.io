/**
 * Schema Validator Module
 * 
 * Validates JSON Schema against Draft-07 specification using Ajv library.
 * 
 * Features:
 * - Validate JSON Schema Draft-07 conformance
 * - Return detailed validation errors for non-conforming schemas
 * 
 * Validates: Requirements 11.1
 */

import Ajv from 'ajv'

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Schema Validator interface
 */
export interface SchemaValidator {
  validateDraft07(schema: object): ValidationResult
}

/**
 * Create Ajv instance configured for Draft-07 validation
 * 
 * Ajv is configured to validate schemas against the JSON Schema Draft-07 meta-schema.
 * This ensures that the provided schema conforms to the Draft-07 specification.
 */
function createAjvInstance(): Ajv {
  return new Ajv({
    strict: true,
    validateSchema: true,
    allErrors: true
  })
}

/**
 * Validate a JSON Schema against Draft-07 specification
 * 
 * Uses Ajv to compile the schema, which validates it against the meta-schema.
 * If compilation fails, the schema is not valid Draft-07.
 * 
 * @param schema - JSON object to validate as JSON Schema Draft-07
 * @returns ValidationResult with valid flag and optional errors
 * 
 * Validates: Requirement 11.1
 */
export function validateDraft07(schema: object): ValidationResult {
  // Handle null/undefined
  if (!schema || typeof schema !== 'object') {
    return {
      valid: false,
      errors: ['Schema must be a non-null object']
    }
  }

  // Handle arrays (not valid JSON Schema root)
  if (Array.isArray(schema)) {
    return {
      valid: false,
      errors: ['Schema must be an object, not an array']
    }
  }

  const ajv = createAjvInstance()

  try {
    // Ajv.compile validates the schema against the meta-schema
    // If the schema is invalid, it throws an error
    ajv.compile(schema)
    return { valid: true }
  } catch (error) {
    // Extract error messages from Ajv validation errors
    const errors: string[] = []

    if (error instanceof Error) {
      // Parse Ajv error message
      errors.push(error.message)
    }

    // Also check ajv.errors for detailed validation errors
    if (ajv.errors && ajv.errors.length > 0) {
      for (const err of ajv.errors) {
        const path = err.instancePath || err.schemaPath || ''
        const message = err.message || 'Unknown validation error'
        errors.push(path ? `${path}: ${message}` : message)
      }
    }

    // Ensure we have at least one error message
    if (errors.length === 0) {
      errors.push('Schema validation failed')
    }

    return {
      valid: false,
      errors
    }
  }
}

/**
 * Create a SchemaValidator instance
 * 
 * @returns SchemaValidator interface implementation
 */
export function createSchemaValidator(): SchemaValidator {
  return {
    validateDraft07
  }
}

/**
 * Default export for convenience
 */
export default createSchemaValidator
