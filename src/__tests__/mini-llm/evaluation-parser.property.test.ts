/**
 * Property-based tests for self-evaluation response parsing
 * 
 * Feature: mini-llm-json-schema, Property 8: Self-Evaluation Response Parsing
 * 
 * *For any* LLM evaluation response, the parser SHALL correctly classify it as 
 * either "соответствует" (true) or "не соответствует" (false), handling variations 
 * in formatting, case, and surrounding text.
 * 
 * Validates: Requirements 9.3
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { parseEvaluation } from '../../workers/schema-generator'

describe('Evaluation Parser Property Tests', () => {
  /**
   * Feature: mini-llm-json-schema, Property 8: Self-Evaluation Response Parsing
   * 
   * Validates: Requirements 9.3
   */
  describe('Property 8: Self-Evaluation Response Parsing', () => {
    // Generator for positive response variations
    const positiveResponseArbitrary = fc.oneof(
      fc.constant('соответствует'),
      fc.constant('Соответствует'),
      fc.constant('СООТВЕТСТВУЕТ'),
      fc.constant('СоОтВеТсТвУеТ'),
      fc.constant('matches'),
      fc.constant('Matches'),
      fc.constant('MATCHES'),
      fc.constant('valid'),
      fc.constant('Valid'),
      fc.constant('VALID'),
      fc.constant('correct'),
      fc.constant('Correct'),
      fc.constant('CORRECT')
    )

    // Generator for negative response variations
    const negativeResponseArbitrary = fc.oneof(
      fc.constant('не соответствует'),
      fc.constant('Не соответствует'),
      fc.constant('НЕ СООТВЕТСТВУЕТ'),
      fc.constant('Не Соответствует'),
      fc.constant('не_соответствует'),
      fc.constant('несоответствует'),
      fc.constant('does not match'),
      fc.constant('Does not match'),
      fc.constant('DOES NOT MATCH'),
      fc.constant("doesn't match"),
      fc.constant("Doesn't match"),
      fc.constant('not match'),
      fc.constant('invalid'),
      fc.constant('Invalid'),
      fc.constant('INVALID'),
      fc.constant('incorrect'),
      fc.constant('Incorrect'),
      fc.constant('INCORRECT')
    )

    // Generator for surrounding text (safe characters)
    const surroundingTextArbitrary = fc.stringMatching(/^[a-zA-Z0-9 .,!?\n:]*$/, { minLength: 0, maxLength: 50 })

    // Generator for whitespace variations
    const whitespaceArbitrary = fc.array(
      fc.constantFrom(' ', '\t', '\n', '\r\n'),
      { minLength: 0, maxLength: 5 }
    ).map(arr => arr.join(''))

    it('should return true for positive responses (соответствует)', () => {
      fc.assert(
        fc.property(
          positiveResponseArbitrary,
          (response) => {
            // Skip responses that also contain negative patterns
            if (response.toLowerCase().includes('не') || 
                response.toLowerCase().includes('not') ||
                response.toLowerCase().includes('invalid') ||
                response.toLowerCase().includes('incorrect')) {
              return true
            }
            
            const result = parseEvaluation(response)
            return result === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return false for negative responses (не соответствует)', () => {
      fc.assert(
        fc.property(
          negativeResponseArbitrary,
          (response) => {
            const result = parseEvaluation(response)
            return result === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle positive responses with surrounding text', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            surroundingTextArbitrary,
            fc.constantFrom('соответствует', 'Соответствует', 'matches', 'valid', 'correct'),
            surroundingTextArbitrary
          ),
          ([prefix, keyword, suffix]) => {
            const response = `${prefix} ${keyword} ${suffix}`
            const result = parseEvaluation(response)
            return result === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle negative responses with surrounding text', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            surroundingTextArbitrary,
            fc.constantFrom('не соответствует', 'Не соответствует', 'does not match', 'invalid', 'incorrect'),
            surroundingTextArbitrary
          ),
          ([prefix, keyword, suffix]) => {
            const response = `${prefix} ${keyword} ${suffix}`
            const result = parseEvaluation(response)
            return result === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle responses with leading/trailing whitespace', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            whitespaceArbitrary,
            fc.constantFrom('соответствует', 'не соответствует'),
            whitespaceArbitrary
          ),
          ([leadingWs, keyword, trailingWs]) => {
            const response = `${leadingWs}${keyword}${trailingWs}`
            const result = parseEvaluation(response)
            
            if (keyword.includes('не')) {
              return result === false
            }
            return result === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should prioritize negative over positive when both present', () => {
      // "не соответствует" contains "соответствует", so negative should win
      fc.assert(
        fc.property(
          fc.constantFrom(
            'не соответствует',
            'Не соответствует',
            'НЕ СООТВЕТСТВУЕТ',
            'Схема не соответствует описанию',
            'Результат не соответствует требованиям'
          ),
          (response) => {
            const result = parseEvaluation(response)
            return result === false
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should return false for empty or invalid inputs', () => {
      expect(parseEvaluation('')).toBe(false)
      expect(parseEvaluation(null as unknown as string)).toBe(false)
      expect(parseEvaluation(undefined as unknown as string)).toBe(false)
      expect(parseEvaluation('   ')).toBe(false)
    })

    it('should return false for unclear/ambiguous responses', () => {
      const ambiguousResponses = [
        'maybe',
        'possibly',
        'I think so',
        'not sure',
        'could be',
        'perhaps',
        'unknown',
        '???',
        'да',
        'нет',
        'yes',
        'no'
      ]
      
      for (const response of ambiguousResponses) {
        const result = parseEvaluation(response)
        expect(result).toBe(false)
      }
    })

    it('should handle mixed case variations correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'СоОтВеТсТвУеТ',
            'соОТВЕТСТВУЕТ',
            'СООТВЕТСТВУЕТ',
            'Соответствует',
            'соответствует'
          ),
          (response) => {
            const result = parseEvaluation(response)
            return result === true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle responses in sentence context', () => {
      const sentenceContexts = [
        { text: 'Схема соответствует описанию пользователя.', expected: true },
        { text: 'Данная JSON Schema соответствует входным данным.', expected: true },
        { text: 'Результат соответствует требованиям.', expected: true },
        { text: 'Схема не соответствует описанию.', expected: false },
        { text: 'JSON Schema не соответствует входным данным.', expected: false },
        { text: 'Результат не соответствует требованиям пользователя.', expected: false },
        { text: 'The schema matches the description.', expected: true },
        { text: 'The schema does not match the description.', expected: false },
        { text: 'This is valid JSON Schema.', expected: true },
        { text: 'This is invalid JSON Schema.', expected: false }
      ]
      
      for (const { text, expected } of sentenceContexts) {
        const result = parseEvaluation(text)
        expect(result).toBe(expected)
      }
    })

    it('should handle underscore and no-space variations', () => {
      expect(parseEvaluation('не_соответствует')).toBe(false)
      expect(parseEvaluation('несоответствует')).toBe(false)
      expect(parseEvaluation('НЕ_СООТВЕТСТВУЕТ')).toBe(false)
    })

    it('should handle English variations correctly', () => {
      const englishPositive = ['matches', 'valid', 'correct', 'Matches', 'Valid', 'Correct']
      const englishNegative = ['does not match', "doesn't match", 'not match', 'invalid', 'incorrect']
      
      for (const response of englishPositive) {
        expect(parseEvaluation(response)).toBe(true)
      }
      
      for (const response of englishNegative) {
        expect(parseEvaluation(response)).toBe(false)
      }
    })

    it('should be case-insensitive for all keywords', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.constantFrom('соответствует', 'matches', 'valid', 'correct'),
            fc.func(fc.boolean())
          ),
          ([keyword]) => {
            const upperCase = parseEvaluation(keyword.toUpperCase())
            const lowerCase = parseEvaluation(keyword.toLowerCase())
            const mixedCase = parseEvaluation(
              keyword.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('')
            )
            
            // All case variations should return the same result
            return upperCase === lowerCase && lowerCase === mixedCase
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle multiline responses', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            surroundingTextArbitrary,
            fc.constantFrom('соответствует', 'не соответствует'),
            surroundingTextArbitrary
          ),
          ([line1, keyword, line2]) => {
            const response = `${line1}\n${keyword}\n${line2}`
            const result = parseEvaluation(response)
            
            if (keyword.includes('не')) {
              return result === false
            }
            return result === true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
