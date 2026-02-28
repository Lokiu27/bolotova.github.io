/**
 * Property-based tests for json-sanitizer module
 * 
 * Feature: mini-llm-json-schema, Property 16: Prototype Pollution Protection
 * 
 * *For any* JSON string containing dangerous keys (`__proto__`, `constructor`, `prototype`),
 * the safe parser SHALL either reject the JSON or sanitize it by removing/renaming dangerous keys,
 * preventing prototype pollution attacks.
 * 
 * Validates: Requirements 14.1-14.2
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { parse, containsDangerousKeys, sanitize } from '../../utils/json-sanitizer'

describe('json-sanitizer Property Tests', () => {
  /**
   * Feature: mini-llm-json-schema, Property 16: Prototype Pollution Protection
   * 
   * *For any* JSON string containing dangerous keys (`__proto__`, `constructor`, `prototype`),
   * the safe parser SHALL either reject the JSON or sanitize it by removing/renaming dangerous keys,
   * preventing prototype pollution attacks.
   * 
   * Validates: Requirements 14.1-14.2
   */
  describe('Property 16: Prototype Pollution Protection', () => {
    // Dangerous keys that can lead to prototype pollution
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'] as const
    
    // Generator for dangerous key
    const dangerousKeyArbitrary = fc.constantFrom(...dangerousKeys)
    
    // Generator for safe keys (alphanumeric, no dangerous keys)
    const safeKeyArbitrary = fc.string({ minLength: 1, maxLength: 20 })
      .filter(key => !dangerousKeys.includes(key as typeof dangerousKeys[number]))
      .filter(key => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key))
    
    // Generator for JSON-safe primitive values
    const jsonPrimitiveArbitrary = fc.oneof(
      fc.string({ maxLength: 50 }),
      fc.integer(),
      fc.double({ noNaN: true, noDefaultInfinity: true }),
      fc.boolean(),
      fc.constant(null)
    )

    // Generator for simple safe object (no nested objects)
    const safeObjectArbitrary = fc.dictionary(safeKeyArbitrary, jsonPrimitiveArbitrary, { minKeys: 1, maxKeys: 5 })

    /**
     * Helper function to check if an object has a dangerous key as own property
     * Using Object.keys() because `in` operator doesn't work correctly for __proto__
     */
    const hasOwnDangerousKey = (obj: object, key: string): boolean => {
      return Object.keys(obj).includes(key)
    }

    /**
     * Test: parse() should remove dangerous keys from parsed JSON
     */
    it('parse() should remove dangerous keys from JSON strings', () => {
      fc.assert(
        fc.property(
          fc.tuple(dangerousKeyArbitrary, jsonPrimitiveArbitrary),
          ([dangerousKey, value]) => {
            const jsonString = JSON.stringify({ [dangerousKey]: value, safeKey: 'safeValue' })
            const result = parse(jsonString)
            
            // Result should not be null (valid JSON)
            if (result === null) return false
            
            // Result should not contain the dangerous key as own property
            return !hasOwnDangerousKey(result, dangerousKey)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: parse() should preserve safe keys while removing dangerous ones
     */
    it('parse() should preserve safe keys while removing dangerous keys', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            dangerousKeyArbitrary,
            safeKeyArbitrary,
            jsonPrimitiveArbitrary,
            jsonPrimitiveArbitrary
          ),
          ([dangerousKey, safeKey, dangerousValue, safeValue]) => {
            const obj = { [dangerousKey]: dangerousValue, [safeKey]: safeValue }
            const jsonString = JSON.stringify(obj)
            const result = parse(jsonString)
            
            if (result === null) return false
            
            // Dangerous key should be removed
            const hasDangerousKey = hasOwnDangerousKey(result, dangerousKey)
            // Safe key should be preserved
            const hasSafeKey = hasOwnDangerousKey(result, safeKey)
            
            return !hasDangerousKey && hasSafeKey
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: containsDangerousKeys() should detect dangerous keys at root level
     * 
     * Note: We need to use JSON.parse to create objects with __proto__ as own property,
     * because object literals with __proto__ set the prototype instead of creating a property.
     */
    it('containsDangerousKeys() should detect dangerous keys at root level', () => {
      fc.assert(
        fc.property(
          fc.tuple(dangerousKeyArbitrary, jsonPrimitiveArbitrary),
          ([dangerousKey, value]) => {
            // Use JSON.parse to create object with dangerous key as own property
            const jsonString = JSON.stringify({ [dangerousKey]: value })
            const obj = JSON.parse(jsonString)
            return containsDangerousKeys(obj) === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: containsDangerousKeys() should detect dangerous keys in nested objects
     */
    it('containsDangerousKeys() should detect dangerous keys in nested objects', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            safeKeyArbitrary,
            dangerousKeyArbitrary,
            jsonPrimitiveArbitrary
          ),
          ([safeKey, dangerousKey, value]) => {
            // Use JSON.parse to create nested object with dangerous key
            const jsonString = JSON.stringify({
              [safeKey]: {
                [dangerousKey]: value
              }
            })
            const obj = JSON.parse(jsonString)
            return containsDangerousKeys(obj) === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: containsDangerousKeys() should detect dangerous keys in arrays
     */
    it('containsDangerousKeys() should detect dangerous keys in array elements', () => {
      fc.assert(
        fc.property(
          fc.tuple(dangerousKeyArbitrary, jsonPrimitiveArbitrary),
          ([dangerousKey, value]) => {
            // Use JSON.parse to create array with object containing dangerous key
            const jsonString = JSON.stringify({
              items: [
                { safe: 'value' },
                { [dangerousKey]: value }
              ]
            })
            const obj = JSON.parse(jsonString)
            return containsDangerousKeys(obj) === true
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: containsDangerousKeys() should return false for safe objects
     */
    it('containsDangerousKeys() should return false for objects without dangerous keys', () => {
      fc.assert(
        fc.property(
          safeObjectArbitrary,
          (obj) => {
            return containsDangerousKeys(obj) === false
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: sanitize() should remove dangerous keys from objects
     */
    it('sanitize() should remove dangerous keys from objects', () => {
      fc.assert(
        fc.property(
          fc.tuple(dangerousKeyArbitrary, jsonPrimitiveArbitrary),
          ([dangerousKey, value]) => {
            // Use JSON.parse to create object with dangerous key as own property
            const jsonString = JSON.stringify({ [dangerousKey]: value, safeKey: 'safeValue' })
            const obj = JSON.parse(jsonString)
            const result = sanitize(obj)
            
            // Dangerous key should be removed
            return !hasOwnDangerousKey(result, dangerousKey)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: sanitize() should preserve safe keys
     */
    it('sanitize() should preserve safe keys while removing dangerous ones', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            dangerousKeyArbitrary,
            safeKeyArbitrary,
            jsonPrimitiveArbitrary,
            jsonPrimitiveArbitrary
          ),
          ([dangerousKey, safeKey, dangerousValue, safeValue]) => {
            // Use JSON.parse to create object with dangerous key as own property
            const jsonString = JSON.stringify({ [dangerousKey]: dangerousValue, [safeKey]: safeValue })
            const obj = JSON.parse(jsonString)
            const result = sanitize(obj) as Record<string, unknown>
            
            // Dangerous key should be removed
            const hasDangerousKey = hasOwnDangerousKey(result, dangerousKey)
            // Safe key should be preserved with correct value
            const hasSafeKey = hasOwnDangerousKey(result, safeKey) && result[safeKey] === safeValue
            
            return !hasDangerousKey && hasSafeKey
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: sanitize() should recursively remove dangerous keys from nested objects
     */
    it('sanitize() should recursively remove dangerous keys from nested objects', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            safeKeyArbitrary,
            dangerousKeyArbitrary,
            jsonPrimitiveArbitrary
          ),
          ([safeKey, dangerousKey, value]) => {
            // Use JSON.parse to create nested object with dangerous key
            const jsonString = JSON.stringify({
              [safeKey]: {
                [dangerousKey]: value,
                nested: 'safe'
              }
            })
            const obj = JSON.parse(jsonString)
            const result = sanitize(obj) as Record<string, Record<string, unknown>>
            
            // Nested dangerous key should be removed
            const nestedObj = result[safeKey]
            return nestedObj && !hasOwnDangerousKey(nestedObj, dangerousKey) && nestedObj.nested === 'safe'
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: sanitize() should handle arrays with objects containing dangerous keys
     */
    it('sanitize() should remove dangerous keys from objects inside arrays', () => {
      fc.assert(
        fc.property(
          fc.tuple(dangerousKeyArbitrary, jsonPrimitiveArbitrary),
          ([dangerousKey, value]) => {
            // Use JSON.parse to create array with object containing dangerous key
            const jsonString = JSON.stringify({
              items: [
                { safe: 'value1' },
                { [dangerousKey]: value, safe: 'value2' }
              ]
            })
            const obj = JSON.parse(jsonString)
            const result = sanitize(obj) as { items: Array<Record<string, unknown>> }
            
            // Check that dangerous key is removed from array element
            const secondItem = result.items[1]
            return secondItem && !hasOwnDangerousKey(secondItem, dangerousKey) && secondItem.safe === 'value2'
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: sanitized objects should not have dangerous keys (invariant)
     */
    it('sanitized objects should never contain dangerous keys', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            dangerousKeyArbitrary,
            safeObjectArbitrary
          ),
          ([dangerousKey, safeObj]) => {
            // Use JSON.parse to add dangerous key to safe object
            const jsonString = JSON.stringify({ ...safeObj, [dangerousKey]: 'malicious' })
            const obj = JSON.parse(jsonString)
            const result = sanitize(obj)
            
            // After sanitization, no dangerous keys should exist
            return !containsDangerousKeys(result)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: parse() should return null for invalid JSON
     */
    it('parse() should return null for invalid JSON strings', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('{invalid json}'),
            fc.constant('{"unclosed": '),
            fc.constant('not json at all'),
            fc.constant(''),
            fc.constant('undefined'),
            fc.constant('{key: "no quotes on key"}')
          ),
          (invalidJson) => {
            const result = parse(invalidJson)
            return result === null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: parse() should return null for JSON primitives (not objects)
     */
    it('parse() should return null for JSON primitives (non-objects)', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('"string"'),
            fc.constant('123'),
            fc.constant('true'),
            fc.constant('false'),
            fc.constant('null')
          ),
          (primitiveJson) => {
            const result = parse(primitiveJson)
            // parse() should return null for primitives since they're not objects
            return result === null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: parse() should handle deeply nested dangerous keys
     */
    it('parse() should remove dangerous keys at any nesting depth', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            dangerousKeyArbitrary,
            fc.integer({ min: 1, max: 5 })
          ),
          ([dangerousKey, depth]) => {
            // Build nested object with dangerous key at specified depth
            let innerObj: Record<string, unknown> = { [dangerousKey]: 'malicious', safe: 'value' }
            for (let i = 0; i < depth; i++) {
              innerObj = { nested: innerObj }
            }
            
            const jsonString = JSON.stringify(innerObj)
            const result = parse(jsonString)
            
            if (result === null) return false
            
            // Verify no dangerous keys exist at any level
            return !containsDangerousKeys(result)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: Multiple dangerous keys should all be removed
     */
    it('parse() should remove all dangerous keys when multiple are present', () => {
      fc.assert(
        fc.property(
          jsonPrimitiveArbitrary,
          (value) => {
            const obj = {
              '__proto__': value,
              'constructor': value,
              'prototype': value,
              'safeKey': 'preserved'
            }
            const jsonString = JSON.stringify(obj)
            const result = parse(jsonString) as Record<string, unknown> | null
            
            if (result === null) return false
            
            // All dangerous keys should be removed
            const hasProto = hasOwnDangerousKey(result, '__proto__')
            const hasConstructor = hasOwnDangerousKey(result, 'constructor')
            const hasPrototype = hasOwnDangerousKey(result, 'prototype')
            // Safe key should be preserved
            const hasSafeKey = result.safeKey === 'preserved'
            
            return !hasProto && !hasConstructor && !hasPrototype && hasSafeKey
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test: parse() should handle arrays at root level
     */
    it('parse() should sanitize arrays containing objects with dangerous keys', () => {
      fc.assert(
        fc.property(
          fc.tuple(dangerousKeyArbitrary, jsonPrimitiveArbitrary),
          ([dangerousKey, value]) => {
            const arr = [
              { safe: 'value1' },
              { [dangerousKey]: value, safe: 'value2' }
            ]
            const jsonString = JSON.stringify(arr)
            const result = parse(jsonString) as Array<Record<string, unknown>> | null
            
            if (result === null || !Array.isArray(result)) return false
            
            // Check that dangerous key is removed from array element
            const secondItem = result[1]
            return secondItem && !hasOwnDangerousKey(secondItem, dangerousKey) && secondItem.safe === 'value2'
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
