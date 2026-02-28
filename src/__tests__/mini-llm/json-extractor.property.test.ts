/**
 * Property-based tests for JSON extraction from LLM responses
 * 
 * Feature: mini-llm-json-schema, Property 5: JSON Extraction from LLM Response
 * 
 * *For any* LLM response string containing a valid JSON object (possibly surrounded 
 * by markdown code blocks or explanatory text), the extraction function SHALL return 
 * the JSON object. For responses without valid JSON, it SHALL return null.
 * 
 * Validates: Requirements 4.3
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { extractSchema } from '../../workers/schema-generator'

describe('JSON Extractor Property Tests', () => {
  /**
   * Feature: mini-llm-json-schema, Property 5: JSON Extraction from LLM Response
   * 
   * Validates: Requirements 4.3
   */
  describe('Property 5: JSON Extraction from LLM Response', () => {
    // Generator for valid JSON Schema objects
    const validJsonSchemaArbitrary = fc.record({
      $schema: fc.constant('http://json-schema.org/draft-07/schema#'),
      type: fc.constant('object'),
      properties: fc.dictionary(
        fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]*$/, { minLength: 1, maxLength: 20 }),
        fc.record({
          type: fc.constantFrom('string', 'number', 'boolean', 'integer', 'array', 'object'),
          description: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
        }),
        { minKeys: 1, maxKeys: 5 }
      ),
      required: fc.option(
        fc.array(fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]*$/, { minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 3 }),
        { nil: undefined }
      )
    })

    // Generator for simple valid JSON objects
    const simpleJsonObjectArbitrary = fc.record({
      key: fc.string({ minLength: 1, maxLength: 20 }),
      value: fc.oneof(fc.string(), fc.integer(), fc.boolean())
    })

    // Generator for explanatory text (safe characters only)
    const explanatoryTextArbitrary = fc.stringMatching(/^[a-zA-Z0-9 .,!?\n]*$/, { minLength: 0, maxLength: 100 })

    it('should extract JSON from markdown code blocks with json tag', () => {
      fc.assert(
        fc.property(
          validJsonSchemaArbitrary,
          (schema) => {
            const jsonString = JSON.stringify(schema, null, 2)
            const response = `\`\`\`json\n${jsonString}\n\`\`\``
            
            const result = extractSchema(response)
            
            expect(result).not.toBeNull()
            // Verify the extracted JSON is valid and matches original
            const parsed = JSON.parse(result!)
            expect(parsed.$schema).toBe(schema.$schema)
            expect(parsed.type).toBe(schema.type)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should extract JSON from generic markdown code blocks', () => {
      fc.assert(
        fc.property(
          validJsonSchemaArbitrary,
          (schema) => {
            const jsonString = JSON.stringify(schema, null, 2)
            const response = `\`\`\`\n${jsonString}\n\`\`\``
            
            const result = extractSchema(response)
            
            expect(result).not.toBeNull()
            const parsed = JSON.parse(result!)
            expect(parsed.$schema).toBe(schema.$schema)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should extract raw JSON objects without code blocks', () => {
      fc.assert(
        fc.property(
          validJsonSchemaArbitrary,
          (schema) => {
            const jsonString = JSON.stringify(schema, null, 2)
            
            const result = extractSchema(jsonString)
            
            expect(result).not.toBeNull()
            const parsed = JSON.parse(result!)
            expect(parsed.$schema).toBe(schema.$schema)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should extract JSON surrounded by explanatory text', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            explanatoryTextArbitrary,
            validJsonSchemaArbitrary,
            explanatoryTextArbitrary
          ),
          ([prefix, schema, suffix]) => {
            const jsonString = JSON.stringify(schema)
            const response = `${prefix}\n${jsonString}\n${suffix}`
            
            const result = extractSchema(response)
            
            expect(result).not.toBeNull()
            const parsed = JSON.parse(result!)
            expect(parsed.$schema).toBe(schema.$schema)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should extract JSON from code block with surrounding text', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            explanatoryTextArbitrary,
            validJsonSchemaArbitrary,
            explanatoryTextArbitrary
          ),
          ([prefix, schema, suffix]) => {
            const jsonString = JSON.stringify(schema, null, 2)
            const response = `${prefix}\n\`\`\`json\n${jsonString}\n\`\`\`\n${suffix}`
            
            const result = extractSchema(response)
            
            expect(result).not.toBeNull()
            const parsed = JSON.parse(result!)
            expect(parsed.$schema).toBe(schema.$schema)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return null for responses without valid JSON', () => {
      fc.assert(
        fc.property(
          // Generate strings that don't contain valid JSON objects
          fc.stringMatching(/^[a-zA-Z .,!?\n]+$/, { minLength: 1, maxLength: 200 }),
          (response) => {
            // Ensure the response doesn't accidentally contain a valid JSON object
            if (response.includes('{') && response.includes('}')) {
              return true // Skip this case
            }
            
            const result = extractSchema(response)
            return result === null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return null for empty or invalid inputs', () => {
      expect(extractSchema('')).toBeNull()
      expect(extractSchema(null as unknown as string)).toBeNull()
      expect(extractSchema(undefined as unknown as string)).toBeNull()
      expect(extractSchema('   ')).toBeNull()
      expect(extractSchema('not json at all')).toBeNull()
    })

    it('should return null for JSON arrays (not objects)', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 1, maxLength: 5 }),
          (arr) => {
            const jsonString = JSON.stringify(arr)
            const result = extractSchema(jsonString)
            return result === null
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should return null for primitive JSON values', () => {
      expect(extractSchema('"string"')).toBeNull()
      expect(extractSchema('123')).toBeNull()
      expect(extractSchema('true')).toBeNull()
      expect(extractSchema('null')).toBeNull()
    })

    it('should handle malformed JSON gracefully', () => {
      const malformedJsonExamples = [
        '{ "key": }',
        '{ key: "value" }',
        '{ "key": "value", }',
        '{ "key": undefined }',
        '{ "key": NaN }',
        '{"unclosed": "brace"',
        '"key": "value" }',
      ]
      
      for (const malformed of malformedJsonExamples) {
        const result = extractSchema(malformed)
        expect(result).toBeNull()
      }
    })

    it('should extract JSON object from response with multiple braces', () => {
      // The function extracts the largest valid JSON object it can find
      // This is expected behavior - it uses greedy matching
      const testCases = [
        {
          response: '```json\n{"$schema":"http://json-schema.org/draft-07/schema#","type":"object"}\n```',
          shouldExtract: true
        },
        {
          response: 'Here is the schema: {"type":"object","properties":{"name":{"type":"string"}}}',
          shouldExtract: true
        },
        {
          response: 'The result is {"valid": true}',
          shouldExtract: true
        }
      ]
      
      for (const { response, shouldExtract } of testCases) {
        const result = extractSchema(response)
        if (shouldExtract) {
          expect(result).not.toBeNull()
          // Verify it's valid JSON
          expect(() => JSON.parse(result!)).not.toThrow()
        }
      }
    })

    it('should preserve JSON structure exactly', () => {
      fc.assert(
        fc.property(
          validJsonSchemaArbitrary,
          (schema) => {
            const jsonString = JSON.stringify(schema)
            const response = `\`\`\`json\n${jsonString}\n\`\`\``
            
            const result = extractSchema(response)
            
            expect(result).not.toBeNull()
            // Parse both and compare structure
            const original = JSON.parse(jsonString)
            const extracted = JSON.parse(result!)
            
            expect(extracted).toEqual(original)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
