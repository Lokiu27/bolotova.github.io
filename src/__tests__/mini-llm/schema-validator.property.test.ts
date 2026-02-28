/**
 * Property-based tests for schema-validator module
 * 
 * Feature: mini-llm-json-schema, Property 10: JSON Schema Draft-07 Validation
 * 
 * *For any* JSON object, the validator SHALL correctly determine whether it conforms
 * to JSON Schema Draft-07 specification, returning validation errors for non-conforming schemas.
 * 
 * Validates: Requirements 11.1
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { validateDraft07 } from '../../workers/schema-validator'

describe('schema-validator Property Tests', () => {
  /**
   * Feature: mini-llm-json-schema, Property 10: JSON Schema Draft-07 Validation
   * 
   * *For any* JSON object, the validator SHALL correctly determine whether it conforms
   * to JSON Schema Draft-07 specification, returning validation errors for non-conforming schemas.
   * 
   * Validates: Requirements 11.1
   */
  describe('Property 10: JSON Schema Draft-07 Validation', () => {
    // Valid JSON Schema Draft-07 types
    const validSchemaTypes = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'] as const
    const validSchemaTypeArbitrary = fc.constantFrom(...validSchemaTypes)
    
    // Generator for valid property names (alphanumeric, starting with letter)
    const propertyNameArbitrary = fc.string({ minLength: 1, maxLength: 20 })
      .filter(name => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name))
    
    // Generator for valid string formats in Draft-07
    const validStringFormats = [
      'date-time', 'date', 'time', 'email', 'idn-email', 'hostname',
      'idn-hostname', 'ipv4', 'ipv6', 'uri', 'uri-reference', 'iri',
      'iri-reference', 'uri-template', 'json-pointer', 'relative-json-pointer', 'regex'
    ] as const
    const stringFormatArbitrary = fc.constantFrom(...validStringFormats)

    /**
     * Generator for minimal valid JSON Schema
     */
    const minimalValidSchemaArbitrary = fc.record({
      type: validSchemaTypeArbitrary
    })

    /**
     * Generator for valid JSON Schema with properties
     */
    const validObjectSchemaArbitrary = fc.record({
      type: fc.constant('object' as const),
      properties: fc.dictionary(
        propertyNameArbitrary,
        fc.record({ type: validSchemaTypeArbitrary }),
        { minKeys: 1, maxKeys: 5 }
      ),
      additionalProperties: fc.boolean()
    })

    /**
     * Generator for valid JSON Schema with required fields
     * Note: required array must have unique values
     */
    const validSchemaWithRequiredArbitrary = fc.uniqueArray(
      propertyNameArbitrary,
      { minLength: 1, maxLength: 3 }
    ).chain((propNames) => {
      const properties: Record<string, { type: string }> = {}
      for (const name of propNames) {
        properties[name] = { type: 'string' }
      }
      return fc.constant({
        type: 'object' as const,
        properties,
        required: propNames
      })
    })

    /**
     * Generator for valid array schema
     */
    const validArraySchemaArbitrary = fc.record({
      type: fc.constant('array' as const),
      items: fc.record({ type: validSchemaTypeArbitrary })
    })

    /**
     * Generator for valid enum schema
     * Note: enum values must match the declared type for strict validation
     * Note: enum values must be unique
     */
    const validEnumSchemaArbitrary = fc.oneof(
      // String enum (unique values)
      fc.record({
        type: fc.constant('string' as const),
        enum: fc.uniqueArray(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 })
      }),
      // Number enum (unique values)
      fc.record({
        type: fc.constant('number' as const),
        enum: fc.uniqueArray(fc.integer({ min: -1000, max: 1000 }), { minLength: 1, maxLength: 5 })
      }),
      // Integer enum (unique values)
      fc.record({
        type: fc.constant('integer' as const),
        enum: fc.uniqueArray(fc.integer({ min: -1000, max: 1000 }), { minLength: 1, maxLength: 5 })
      }),
      // Boolean enum (unique values - only true, false, or both)
      fc.constantFrom(
        { type: 'boolean' as const, enum: [true] },
        { type: 'boolean' as const, enum: [false] },
        { type: 'boolean' as const, enum: [true, false] }
      ),
      // Null enum (only one null value)
      fc.constant({ type: 'null' as const, enum: [null] }),
      // Enum without type (any unique values allowed)
      fc.record({
        enum: fc.uniqueArray(
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.integer({ min: -1000, max: 1000 })
          ),
          { minLength: 1, maxLength: 5 }
        )
      })
    )

    /**
     * Test: Valid minimal schemas should pass validation
     */
    it('should return valid: true for minimal valid JSON Schemas', () => {
      fc.assert(
        fc.property(
          minimalValidSchemaArbitrary,
          (schema) => {
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Valid object schemas with properties should pass validation
     */
    it('should return valid: true for object schemas with properties', () => {
      fc.assert(
        fc.property(
          validObjectSchemaArbitrary,
          (schema) => {
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Valid schemas with required fields should pass validation
     */
    it('should return valid: true for schemas with required fields', () => {
      fc.assert(
        fc.property(
          validSchemaWithRequiredArbitrary,
          (schema) => {
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Valid array schemas should pass validation
     */
    it('should return valid: true for valid array schemas', () => {
      fc.assert(
        fc.property(
          validArraySchemaArbitrary,
          (schema) => {
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Valid enum schemas should pass validation
     */
    it('should return valid: true for valid enum schemas', () => {
      fc.assert(
        fc.property(
          validEnumSchemaArbitrary,
          (schema) => {
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with invalid type values should fail validation
     */
    it('should return valid: false for schemas with invalid type values', () => {
      // Invalid type values that are not in Draft-07 spec
      const invalidTypeArbitrary = fc.string({ minLength: 1, maxLength: 20 })
        .filter(t => !validSchemaTypes.includes(t as typeof validSchemaTypes[number]))
        .filter(t => /^[a-zA-Z]+$/.test(t)) // Only alphabetic to avoid edge cases
      
      fc.assert(
        fc.property(
          invalidTypeArbitrary,
          (invalidType) => {
            const schema = { type: invalidType }
            const result = validateDraft07(schema)
            return result.valid === false && result.errors !== undefined && result.errors.length > 0
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Empty objects should be valid (boolean schema equivalent)
     */
    it('should return valid: true for empty objects (permissive schema)', () => {
      const result = validateDraft07({})
      expect(result.valid).toBe(true)
    })

    /**
     * Test: Arrays should fail validation (not valid JSON Schema root)
     */
    it('should return valid: false for arrays', () => {
      fc.assert(
        fc.property(
          fc.array(fc.anything(), { minLength: 0, maxLength: 5 }),
          (arr) => {
            const result = validateDraft07(arr as unknown as object)
            return result.valid === false && result.errors !== undefined && result.errors.length > 0
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: null should fail validation
     */
    it('should return valid: false for null', () => {
      const result = validateDraft07(null as unknown as object)
      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    /**
     * Test: Primitives should fail validation
     */
    it('should return valid: false for primitive values', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.double({ noNaN: true }),
            fc.boolean()
          ),
          (primitive) => {
            const result = validateDraft07(primitive as unknown as object)
            return result.valid === false && result.errors !== undefined && result.errors.length > 0
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with invalid keyword values should fail validation
     * (e.g., minLength as string instead of number)
     */
    it('should return valid: false for schemas with invalid keyword value types', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          (invalidMinLength) => {
            const schema = {
              type: 'string',
              minLength: invalidMinLength // Should be a number
            }
            const result = validateDraft07(schema)
            return result.valid === false && result.errors !== undefined && result.errors.length > 0
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with negative minLength should fail validation
     */
    it('should return valid: false for schemas with negative minLength', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: -1 }),
          (negativeValue) => {
            const schema = {
              type: 'string',
              minLength: negativeValue
            }
            const result = validateDraft07(schema)
            return result.valid === false && result.errors !== undefined && result.errors.length > 0
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with valid string constraints should pass validation
     */
    it('should return valid: true for schemas with valid string constraints', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 })
          ).filter(([min, max]) => min <= max),
          ([minLength, maxLength]) => {
            const schema = {
              type: 'string',
              minLength,
              maxLength
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with valid number constraints should pass validation
     */
    it('should return valid: true for schemas with valid number constraints', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.double({ noNaN: true, noDefaultInfinity: true, min: -1000, max: 1000 }),
            fc.double({ noNaN: true, noDefaultInfinity: true, min: -1000, max: 1000 })
          ).filter(([min, max]) => min <= max),
          ([minimum, maximum]) => {
            const schema = {
              type: 'number',
              minimum,
              maximum
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with valid array constraints should pass validation
     */
    it('should return valid: true for schemas with valid array constraints', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 50 }),
            fc.integer({ min: 0, max: 100 })
          ).filter(([min, max]) => min <= max),
          ([minItems, maxItems]) => {
            const schema = {
              type: 'array',
              items: { type: 'string' },
              minItems,
              maxItems
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with uniqueItems should pass validation
     */
    it('should return valid: true for schemas with uniqueItems', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (uniqueItems) => {
            const schema = {
              type: 'array',
              items: { type: 'string' },
              uniqueItems
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with pattern should pass validation for valid regex
     */
    it('should return valid: true for schemas with valid regex patterns', () => {
      // Use simple, known-valid regex patterns
      const validPatterns = [
        '^[a-z]+$',
        '\\d+',
        '[A-Z][a-z]*',
        '^\\w+@\\w+\\.\\w+$',
        '.*'
      ]
      
      fc.assert(
        fc.property(
          fc.constantFrom(...validPatterns),
          (pattern) => {
            const schema = {
              type: 'string',
              pattern
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with $schema declaration should pass validation
     */
    it('should return valid: true for schemas with $schema declaration', () => {
      fc.assert(
        fc.property(
          validSchemaTypeArbitrary,
          (type) => {
            const schema = {
              $schema: 'http://json-schema.org/draft-07/schema#',
              type
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with title and description should pass validation
     */
    it('should return valid: true for schemas with title and description', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.string({ minLength: 1, maxLength: 200 }),
            validSchemaTypeArbitrary
          ),
          ([title, description, type]) => {
            const schema = {
              title,
              description,
              type
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with default values should pass validation
     */
    it('should return valid: true for schemas with default values', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({ type: fc.constant('string' as const), default: fc.string() }),
            fc.record({ type: fc.constant('number' as const), default: fc.double({ noNaN: true, noDefaultInfinity: true }) }),
            fc.record({ type: fc.constant('boolean' as const), default: fc.boolean() }),
            fc.record({ type: fc.constant('integer' as const), default: fc.integer() })
          ),
          (schema) => {
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Nested object schemas should pass validation
     */
    it('should return valid: true for nested object schemas', () => {
      fc.assert(
        fc.property(
          fc.tuple(propertyNameArbitrary, propertyNameArbitrary),
          ([outerProp, innerProp]) => {
            const schema = {
              type: 'object',
              properties: {
                [outerProp]: {
                  type: 'object',
                  properties: {
                    [innerProp]: { type: 'string' }
                  }
                }
              }
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Validation errors should be returned for invalid schemas
     */
    it('should return errors array for invalid schemas', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 })
            .filter(t => !validSchemaTypes.includes(t as typeof validSchemaTypes[number]))
            .filter(t => /^[a-zA-Z]+$/.test(t)),
          (invalidType) => {
            const schema = { type: invalidType }
            const result = validateDraft07(schema)
            return (
              result.valid === false &&
              result.errors !== undefined &&
              Array.isArray(result.errors) &&
              result.errors.length > 0 &&
              result.errors.every(e => typeof e === 'string')
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Valid schemas should not have errors
     */
    it('should not return errors for valid schemas', () => {
      fc.assert(
        fc.property(
          minimalValidSchemaArbitrary,
          (schema) => {
            const result = validateDraft07(schema)
            return result.valid === true && result.errors === undefined
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with oneOf should pass validation
     */
    it('should return valid: true for schemas with oneOf', () => {
      fc.assert(
        fc.property(
          fc.array(validSchemaTypeArbitrary, { minLength: 2, maxLength: 4 }),
          (types) => {
            const schema = {
              oneOf: types.map(type => ({ type }))
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with anyOf should pass validation
     */
    it('should return valid: true for schemas with anyOf', () => {
      fc.assert(
        fc.property(
          fc.array(validSchemaTypeArbitrary, { minLength: 2, maxLength: 4 }),
          (types) => {
            const schema = {
              anyOf: types.map(type => ({ type }))
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with allOf should pass validation
     * Note: In strict mode, properties require type to be specified
     */
    it('should return valid: true for schemas with allOf', () => {
      const schema = {
        allOf: [
          { type: 'object', properties: { id: { type: 'integer' } } },
          { type: 'object', properties: { name: { type: 'string' } } }
        ]
      }
      const result = validateDraft07(schema)
      expect(result.valid).toBe(true)
    })

    /**
     * Test: Schemas with not should pass validation
     */
    it('should return valid: true for schemas with not', () => {
      fc.assert(
        fc.property(
          validSchemaTypeArbitrary,
          (type) => {
            const schema = {
              not: { type }
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with if/then/else should pass validation (Draft-07 feature)
     */
    it('should return valid: true for schemas with if/then/else (Draft-07 feature)', () => {
      const schema = {
        type: 'object',
        if: {
          properties: { kind: { const: 'a' } }
        },
        then: {
          properties: { value: { type: 'string' } }
        },
        else: {
          properties: { value: { type: 'number' } }
        }
      }
      const result = validateDraft07(schema)
      expect(result.valid).toBe(true)
    })

    /**
     * Test: Schemas with const should pass validation (Draft-07 feature)
     */
    it('should return valid: true for schemas with const (Draft-07 feature)', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ maxLength: 20 }),
            fc.integer(),
            fc.boolean(),
            fc.constant(null)
          ),
          (constValue) => {
            const schema = { const: constValue }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with contentMediaType should pass validation (Draft-07 feature)
     */
    it('should return valid: true for schemas with contentMediaType (Draft-07 feature)', () => {
      const mediaTypes = ['application/json', 'text/plain', 'text/html', 'application/xml']
      
      fc.assert(
        fc.property(
          fc.constantFrom(...mediaTypes),
          (mediaType) => {
            const schema = {
              type: 'string',
              contentMediaType: mediaType
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Schemas with propertyNames should pass validation
     */
    it('should return valid: true for schemas with propertyNames', () => {
      const schema = {
        type: 'object',
        propertyNames: {
          pattern: '^[a-z]+$'
        }
      }
      const result = validateDraft07(schema)
      expect(result.valid).toBe(true)
    })

    /**
     * Test: Schemas with contains should pass validation (Draft-07 feature)
     */
    it('should return valid: true for schemas with contains (Draft-07 feature)', () => {
      fc.assert(
        fc.property(
          validSchemaTypeArbitrary,
          (type) => {
            const schema = {
              type: 'array',
              contains: { type }
            }
            const result = validateDraft07(schema)
            return result.valid === true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
