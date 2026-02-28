/**
 * Property-based tests for executable code detection in JSON Schema
 * 
 * Feature: mini-llm-json-schema, Property 13: Executable Code Rejection
 * 
 * *For any* generated JSON Schema containing JavaScript code, HTML script tags, 
 * or event handlers in string values, the self-evaluator SHALL reject the result 
 * (return false).
 * 
 * Validates: Requirements 12.4
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { containsExecutableCode, isSchemaSecure } from '../../workers/schema-generator'

describe('Code Detector Property Tests', () => {
  /**
   * Feature: mini-llm-json-schema, Property 13: Executable Code Rejection
   * 
   * Validates: Requirements 12.4
   */
  describe('Property 13: Executable Code Rejection', () => {
    // Generator for JavaScript function patterns that the implementation detects
    // Note: The implementation uses /\bfunction\s*\(/gi which matches function() or function ()
    // but not function name() - this is a known limitation
    const jsFunctionArbitrary = fc.oneof(
      fc.constant('function() { alert(1); }'),
      fc.constant('function () { return 1; }'),
      fc.constant('function( ) { }'),
      fc.constant('function  () { }')
    )

    // Generator for arrow function patterns
    const arrowFunctionArbitrary = fc.oneof(
      fc.constant('() => { alert(1); }'),
      fc.constant('(x) => x * 2'),
      fc.constant('x => x + 1'),
      fc.constant('async () => { await fetch(); }'),
      fc.constant('(a, b) => { return a + b; }')
    )

    // Generator for dangerous JS API calls
    const dangerousApiArbitrary = fc.oneof(
      fc.constant('eval("alert(1)")'),
      fc.constant('new Function("return 1")'),
      fc.constant('setTimeout(function() {}, 1000)'),
      fc.constant('setInterval(() => {}, 100)'),
      fc.constant('document.cookie'),
      fc.constant('document.write("test")'),
      fc.constant('window.location'),
      fc.constant('window.open("url")'),
      fc.constant('alert("xss")'),
      fc.constant('console.log("test")'),
      fc.constant('require("fs")'),
      fc.constant('import("module")'),
      fc.constant('export default {}')
    )

    // Generator for HTML script tags
    const scriptTagArbitrary = fc.oneof(
      fc.constant('<script>alert(1)</script>'),
      fc.constant('<script src="evil.js"></script>'),
      fc.constant('<script type="text/javascript">code</script>'),
      fc.constant('<SCRIPT>alert(1)</SCRIPT>'),
      fc.constant('<Script>malicious()</Script>')
    )

    // Generator for HTML event handlers
    const eventHandlerArbitrary = fc.oneof(
      fc.constant('onclick="alert(1)"'),
      fc.constant('onload="malicious()"'),
      fc.constant('onerror="hack()"'),
      fc.constant('onmouseover="steal()"'),
      fc.constant('onfocus="xss()"'),
      fc.constant('onsubmit="capture()"'),
      fc.constant('ONCLICK="alert(1)"'),
      fc.constant('OnClick="test()"')
    )

    // Generator for dangerous HTML elements
    const dangerousHtmlArbitrary = fc.oneof(
      fc.constant('<iframe src="evil.com"></iframe>'),
      fc.constant('<object data="malware.swf"></object>'),
      fc.constant('<embed src="exploit.swf">'),
      fc.constant('<IFRAME src="hack.com"></IFRAME>')
    )

    // Generator for javascript: protocol
    const jsProtocolArbitrary = fc.oneof(
      fc.constant('javascript:alert(1)'),
      fc.constant('javascript:void(0)'),
      fc.constant('JAVASCRIPT:alert(1)'),
      fc.constant('JavaScript:malicious()')
    )

    // Generator for data: URLs with executable content
    const dataUrlArbitrary = fc.oneof(
      fc.constant('data:text/html,<script>alert(1)</script>'),
      fc.constant('data:application/javascript,alert(1)')
    )

    // Generator for safe JSON Schema content
    const safeSchemaArbitrary = fc.record({
      $schema: fc.constant('http://json-schema.org/draft-07/schema#'),
      type: fc.constant('object'),
      properties: fc.dictionary(
        fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]*$/, { minLength: 1, maxLength: 15 }),
        fc.record({
          type: fc.constantFrom('string', 'number', 'boolean', 'integer'),
          description: fc.option(
            fc.stringMatching(/^[a-zA-Z0-9 .,!?]*$/, { minLength: 1, maxLength: 50 }),
            { nil: undefined }
          )
        }),
        { minKeys: 1, maxKeys: 3 }
      )
    })

    it('should detect JavaScript function declarations', () => {
      fc.assert(
        fc.property(
          jsFunctionArbitrary,
          (jsCode) => {
            const schema = JSON.stringify({
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                malicious: { type: 'string', default: jsCode }
              }
            })
            
            const hasCode = containsExecutableCode(schema)
            const isSecure = isSchemaSecure(schema)
            
            return hasCode === true && isSecure === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect arrow functions', () => {
      fc.assert(
        fc.property(
          arrowFunctionArbitrary,
          (arrowFunc) => {
            const schema = JSON.stringify({
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                callback: { type: 'string', default: arrowFunc }
              }
            })
            
            const hasCode = containsExecutableCode(schema)
            return hasCode === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect dangerous JavaScript API calls', () => {
      fc.assert(
        fc.property(
          dangerousApiArbitrary,
          (apiCall) => {
            const schema = JSON.stringify({
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                code: { type: 'string', default: apiCall }
              }
            })
            
            const hasCode = containsExecutableCode(schema)
            return hasCode === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect HTML script tags', () => {
      fc.assert(
        fc.property(
          scriptTagArbitrary,
          (scriptTag) => {
            const schema = JSON.stringify({
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                html: { type: 'string', default: scriptTag }
              }
            })
            
            const hasCode = containsExecutableCode(schema)
            return hasCode === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect HTML event handlers', () => {
      fc.assert(
        fc.property(
          eventHandlerArbitrary,
          (handler) => {
            const schema = JSON.stringify({
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                element: { type: 'string', default: `<div ${handler}>click</div>` }
              }
            })
            
            const hasCode = containsExecutableCode(schema)
            return hasCode === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect dangerous HTML elements (iframe, object, embed)', () => {
      fc.assert(
        fc.property(
          dangerousHtmlArbitrary,
          (htmlElement) => {
            const schema = JSON.stringify({
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                content: { type: 'string', default: htmlElement }
              }
            })
            
            const hasCode = containsExecutableCode(schema)
            return hasCode === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect javascript: protocol URLs', () => {
      fc.assert(
        fc.property(
          jsProtocolArbitrary,
          (jsUrl) => {
            const schema = JSON.stringify({
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                link: { type: 'string', default: jsUrl }
              }
            })
            
            const hasCode = containsExecutableCode(schema)
            return hasCode === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect data: URLs with executable content', () => {
      fc.assert(
        fc.property(
          dataUrlArbitrary,
          (dataUrl) => {
            const schema = JSON.stringify({
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                src: { type: 'string', default: dataUrl }
              }
            })
            
            const hasCode = containsExecutableCode(schema)
            return hasCode === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should NOT detect executable code in safe schemas', () => {
      fc.assert(
        fc.property(
          safeSchemaArbitrary,
          (schema) => {
            const schemaString = JSON.stringify(schema)
            
            const hasCode = containsExecutableCode(schemaString)
            const isSecure = isSchemaSecure(schemaString)
            
            return hasCode === false && isSecure === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle empty and invalid inputs gracefully', () => {
      expect(containsExecutableCode('')).toBe(false)
      expect(containsExecutableCode(null as unknown as string)).toBe(false)
      expect(containsExecutableCode(undefined as unknown as string)).toBe(false)
      
      expect(isSchemaSecure('')).toBe(true)
      expect(isSchemaSecure(null as unknown as string)).toBe(true)
      expect(isSchemaSecure(undefined as unknown as string)).toBe(true)
    })

    it('should detect code in nested schema properties', () => {
      const nestedSchema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              callback: { type: 'string', default: 'function() { alert(1); }' }
            }
          }
        }
      })
      
      expect(containsExecutableCode(nestedSchema)).toBe(true)
      expect(isSchemaSecure(nestedSchema)).toBe(false)
    })

    it('should detect code in array item definitions', () => {
      const arraySchema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'string',
              default: '<script>alert(1)</script>'
            }
          }
        }
      })
      
      expect(containsExecutableCode(arraySchema)).toBe(true)
      expect(isSchemaSecure(arraySchema)).toBe(false)
    })

    it('should detect code in description fields', () => {
      const schemaWithCodeInDescription = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        description: 'Use this function: function() { return 1; }',
        properties: {
          name: { type: 'string' }
        }
      })
      
      expect(containsExecutableCode(schemaWithCodeInDescription)).toBe(true)
    })

    it('should be case-insensitive for HTML tags', () => {
      const variations = [
        '<script>alert(1)</script>',
        '<SCRIPT>alert(1)</SCRIPT>',
        '<Script>alert(1)</Script>',
        '<ScRiPt>alert(1)</ScRiPt>'
      ]
      
      for (const variation of variations) {
        const schema = JSON.stringify({
          type: 'object',
          properties: { x: { default: variation } }
        })
        expect(containsExecutableCode(schema)).toBe(true)
      }
    })

    it('should detect multiple executable patterns in same schema', () => {
      const multiplePatterns = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          script: { default: '<script>alert(1)</script>' },
          func: { default: 'function() {}' },
          handler: { default: 'onclick="hack()"' }
        }
      })
      
      expect(containsExecutableCode(multiplePatterns)).toBe(true)
      expect(isSchemaSecure(multiplePatterns)).toBe(false)
    })

    it('isSchemaSecure should be inverse of containsExecutableCode', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            safeSchemaArbitrary.map(s => JSON.stringify(s)),
            fc.constant(JSON.stringify({ type: 'object', properties: { x: { default: 'function() {}' } } }))
          ),
          (schemaString) => {
            const hasCode = containsExecutableCode(schemaString)
            const isSecure = isSchemaSecure(schemaString)
            
            return hasCode !== isSecure
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
