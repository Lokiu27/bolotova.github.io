/**
 * Property-based tests for useInputSanitizer composable
 * 
 * Feature: mini-llm-json-schema
 * 
 * Tests Properties 1-4 from the design document:
 * - Property 1: Input Length Truncation
 * - Property 2: Input Sanitization Removes Dangerous Content
 * - Property 3: Clipboard Paste Extracts Text Only
 * - Property 4: Unicode Normalization
 * 
 * Validates: Requirements 2.2-2.5, 7.1, 15.1-15.4
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { useInputSanitizer } from '../../composables/useInputSanitizer'

describe('useInputSanitizer Property Tests', () => {
  const { sanitize, sanitizeClipboard, validateLength } = useInputSanitizer()

  // Helper to generate alphanumeric strings (safe characters that won't be sanitized)
  const safeStringArbitrary = (minLength: number, maxLength: number) =>
    fc.stringMatching(/^[a-zA-Z0-9 ]*$/, { minLength, maxLength })

  // Helper to create mock ClipboardEvent without DataTransfer dependency
  const createMockClipboardEvent = (data: Record<string, string>): ClipboardEvent => {
    const clipboardData = {
      getData: (type: string) => data[type] || '',
      types: Object.keys(data),
      items: null,
      files: { length: 0 } as FileList,
      setData: () => {},
      clearData: () => {}
    } as unknown as DataTransfer

    return {
      clipboardData,
      type: 'paste',
      bubbles: true,
      cancelable: true,
      composed: true
    } as unknown as ClipboardEvent
  }

  /**
   * Feature: mini-llm-json-schema, Property 1: Input Length Truncation
   * 
   * *For any* input string with length greater than 2000 characters, 
   * the sanitized output SHALL have length exactly 2000 characters, 
   * and the first 2000 characters SHALL be preserved.
   * 
   * Validates: Requirements 2.3, 2.4
   */
  describe('Property 1: Input Length Truncation', () => {
    it('should truncate input longer than 2000 characters to at most 2000', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2001, maxLength: 10000 }),
          (input) => {
            const result = sanitize(input)
            return result.length <= 2000
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve the first 2000 characters when truncating plain alphanumeric text', () => {
      fc.assert(
        fc.property(
          safeStringArbitrary(2001, 5000),
          (input) => {
            const result = sanitize(input)
            const expected = input.slice(0, 2000)
            return result === expected
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not truncate input with 2000 or fewer characters (plain text)', () => {
      fc.assert(
        fc.property(
          safeStringArbitrary(0, 2000),
          (input) => {
            const result = sanitize(input)
            return result === input
          }
        ),
        { numRuns: 100 }
      )
    })

    it('validateLength should correctly report truncation status', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 5000 }),
          (input) => {
            const result = validateLength(input, 2000)
            
            // originalLength should match input length
            if (result.originalLength !== input.length) return false
            
            // truncated should be true only if original > maxLength
            if (result.truncated !== (input.length > 2000)) return false
            
            // sanitizedValue should never exceed maxLength
            if (result.sanitizedValue.length > 2000) return false
            
            // isValid should be true when sanitized length is within limit
            if (result.isValid !== (result.sanitizedValue.length <= 2000)) return false
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Feature: mini-llm-json-schema, Property 2: Input Sanitization Removes Dangerous Content
   * 
   * *For any* input string containing HTML tags (`<script>`, `<iframe>`, `<img onerror>`, etc.) 
   * or JavaScript event handlers, the sanitized output SHALL NOT contain any executable 
   * HTML or JavaScript constructs.
   * 
   * Validates: Requirements 2.5, 7.1
   */
  describe('Property 2: Input Sanitization Removes Dangerous Content', () => {
    // Generator for dangerous HTML tags
    const dangerousTagArbitrary = fc.oneof(
      fc.constant('<script>alert("xss")</script>'),
      fc.constant('<script src="evil.js"></script>'),
      fc.constant('<iframe src="evil.com"></iframe>'),
      fc.constant('<img src="x" onerror="alert(1)">'),
      fc.constant('<img onerror=alert(1) src=x>'),
      fc.constant('<svg onload="alert(1)">'),
      fc.constant('<body onload="alert(1)">'),
      fc.constant('<div onclick="alert(1)">click</div>'),
      fc.constant('<a href="javascript:alert(1)">link</a>'),
      fc.constant('<input onfocus="alert(1)" autofocus>'),
      fc.constant('<marquee onstart="alert(1)">'),
      fc.constant('<video><source onerror="alert(1)">'),
      fc.constant('<object data="javascript:alert(1)">'),
      fc.constant('<embed src="javascript:alert(1)">'),
      fc.constant('<form action="javascript:alert(1)">'),
      fc.constant('<base href="javascript:alert(1)">'),
      fc.constant('<link rel="import" href="evil.html">'),
      fc.constant('<meta http-equiv="refresh" content="0;url=javascript:alert(1)">')
    )

    it('should remove script tags from input', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 0, maxLength: 100 }),
            dangerousTagArbitrary,
            fc.string({ minLength: 0, maxLength: 100 })
          ),
          ([prefix, dangerousTag, suffix]) => {
            const input = prefix + dangerousTag + suffix
            const result = sanitize(input)
            
            // Result should not contain script tags
            const hasScript = /<script[\s>]/i.test(result)
            return !hasScript
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should remove iframe tags from input', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 0, maxLength: 100 }),
            fc.constant('<iframe src="http://evil.com"></iframe>'),
            fc.string({ minLength: 0, maxLength: 100 })
          ),
          ([prefix, iframe, suffix]) => {
            const input = prefix + iframe + suffix
            const result = sanitize(input)
            
            // Result should not contain iframe tags
            const hasIframe = /<iframe[\s>]/i.test(result)
            return !hasIframe
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should remove event handlers from input', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('onclick'),
            fc.constant('onerror'),
            fc.constant('onload'),
            fc.constant('onmouseover'),
            fc.constant('onfocus'),
            fc.constant('onblur'),
            fc.constant('onsubmit'),
            fc.constant('onkeydown'),
            fc.constant('onkeyup'),
            fc.constant('onchange')
          ),
          (eventHandler) => {
            const input = `<div ${eventHandler}="alert(1)">content</div>`
            const result = sanitize(input)
            
            // Result should not contain the event handler
            const hasEventHandler = new RegExp(`${eventHandler}\\s*=`, 'i').test(result)
            return !hasEventHandler
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should remove javascript: URLs from input', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('<a href="javascript:alert(1)">link</a>'),
            fc.constant('<a href="JAVASCRIPT:alert(1)">link</a>'),
            fc.constant('<a href="  javascript:alert(1)">link</a>'),
            fc.constant('<form action="javascript:void(0)">'),
            fc.constant('<iframe src="javascript:alert(1)">')
          ),
          (input) => {
            const result = sanitize(input)
            
            // Result should not contain javascript: protocol
            const hasJsProtocol = /javascript:/i.test(result)
            return !hasJsProtocol
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle mixed safe and dangerous content', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            safeStringArbitrary(1, 50),
            dangerousTagArbitrary,
            safeStringArbitrary(1, 50)
          ),
          ([safePrefix, dangerous, safeSuffix]) => {
            const input = safePrefix + dangerous + safeSuffix
            const result = sanitize(input)
            
            // Dangerous content should be removed
            const hasDangerousPatterns = 
              /<script/i.test(result) ||
              /<iframe/i.test(result) ||
              /on\w+\s*=/i.test(result) ||
              /javascript:/i.test(result)
            
            return !hasDangerousPatterns
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Feature: mini-llm-json-schema, Property 3: Clipboard Paste Extracts Text Only
   * 
   * *For any* clipboard paste event containing multiple MIME types (text/plain, text/html, text/rtf), 
   * the handler SHALL extract ONLY the text/plain content, ignoring all other formats.
   * 
   * Validates: Requirements 2.2, 15.1, 15.2
   */
  describe('Property 3: Clipboard Paste Extracts Text Only', () => {
    it('should extract only text/plain content from clipboard', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            // Plain text content (safe characters)
            safeStringArbitrary(1, 500),
            // HTML content (should be ignored)
            fc.constant('<div><b>Bold</b> <script>alert(1)</script></div>'),
            // RTF content (should be ignored)
            fc.constant('{\\rtf1\\ansi{\\fonttbl\\f0\\fswiss Helvetica;}\\f0 Hello}')
          ),
          ([plainText, htmlContent, rtfContent]) => {
            const event = createMockClipboardEvent({
              'text/plain': plainText,
              'text/html': htmlContent,
              'text/rtf': rtfContent
            })
            
            const result = sanitizeClipboard(event)
            
            // Result should be based on plain text, not HTML or RTF
            // It should not contain HTML tags from the HTML content
            const hasHtmlTags = /<div>|<b>|<script>/i.test(result)
            const hasRtfMarkers = /\\rtf|\\ansi|\\fonttbl/i.test(result)
            
            return !hasHtmlTags && !hasRtfMarkers
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should ignore HTML content even when text/plain is empty', () => {
      fc.assert(
        fc.property(
          fc.constant('<div><script>alert("xss")</script>Dangerous HTML</div>'),
          (htmlContent) => {
            const event = createMockClipboardEvent({
              'text/html': htmlContent
              // No text/plain provided
            })
            
            const result = sanitizeClipboard(event)
            
            // Result should be empty since there's no text/plain
            return result === ''
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle clipboard with only text/plain', () => {
      fc.assert(
        fc.property(
          safeStringArbitrary(1, 500),
          (plainText) => {
            const event = createMockClipboardEvent({
              'text/plain': plainText
            })
            
            const result = sanitizeClipboard(event)
            
            // Result should match the plain text (after sanitization)
            return result === plainText
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty string when clipboardData is null', () => {
      const event = {
        clipboardData: null,
        type: 'paste'
      } as unknown as ClipboardEvent
      
      const result = sanitizeClipboard(event)
      expect(result).toBe('')
    })

    it('should apply full sanitization to clipboard content', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            safeStringArbitrary(1, 100),
            fc.constant('<script>alert(1)</script>'),
            safeStringArbitrary(1, 100)
          ),
          ([prefix, dangerous, suffix]) => {
            // Even if text/plain contains dangerous content, it should be sanitized
            const plainText = prefix + dangerous + suffix
            const event = createMockClipboardEvent({
              'text/plain': plainText
            })
            
            const result = sanitizeClipboard(event)
            
            // Dangerous content should be removed
            const hasDangerousPatterns = /<script/i.test(result)
            return !hasDangerousPatterns
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Feature: mini-llm-json-schema, Property 4: Unicode Normalization
   * 
   * *For any* input string containing invisible Unicode characters (zero-width spaces U+200B, 
   * RTL/LTR marks U+200E/U+200F, etc.) or Windows line endings (\r\n), the sanitized output 
   * SHALL have all invisible characters removed and all line endings normalized to \n, 
   * while preserving tab characters (\t).
   * 
   * Validates: Requirements 15.3, 15.4
   */
  describe('Property 4: Unicode Normalization', () => {
    // Generator for invisible Unicode characters
    const invisibleCharArbitrary = fc.oneof(
      fc.constant('\u200B'), // Zero-width space
      fc.constant('\u200C'), // Zero-width non-joiner
      fc.constant('\u200D'), // Zero-width joiner
      fc.constant('\u200E'), // Left-to-right mark
      fc.constant('\u200F'), // Right-to-left mark
      fc.constant('\u2028'), // Line separator
      fc.constant('\u2029'), // Paragraph separator
      fc.constant('\u202A'), // Left-to-right embedding
      fc.constant('\u202B'), // Right-to-left embedding
      fc.constant('\u202C'), // Pop directional formatting
      fc.constant('\u202D'), // Left-to-right override
      fc.constant('\u202E'), // Right-to-left override
      fc.constant('\u2060'), // Word joiner
      fc.constant('\u2061'), // Function application
      fc.constant('\u2062'), // Invisible times
      fc.constant('\u2063'), // Invisible separator
      fc.constant('\u2064'), // Invisible plus
      fc.constant('\uFEFF'), // Zero-width no-break space / BOM
      fc.constant('\u00AD')  // Soft hyphen
    )

    it('should remove zero-width space characters', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            safeStringArbitrary(1, 50),
            safeStringArbitrary(1, 50)
          ),
          ([prefix, suffix]) => {
            const input = prefix + '\u200B' + suffix
            const result = sanitize(input)
            
            // Zero-width space should be removed
            const hasZeroWidthSpace = result.includes('\u200B')
            return !hasZeroWidthSpace && result === prefix + suffix
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should remove all invisible Unicode characters', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            safeStringArbitrary(1, 50),
            invisibleCharArbitrary,
            safeStringArbitrary(1, 50)
          ),
          ([prefix, invisibleChar, suffix]) => {
            const input = prefix + invisibleChar + suffix
            const result = sanitize(input)
            
            // Invisible character should be removed
            const hasInvisibleChar = result.includes(invisibleChar)
            return !hasInvisibleChar
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should remove multiple invisible characters scattered throughout input', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              safeStringArbitrary(1, 20),
              invisibleCharArbitrary
            ),
            { minLength: 3, maxLength: 10 }
          ),
          (parts) => {
            const input = parts.join('')
            const result = sanitize(input)
            
            // All invisible characters should be removed
            const invisibleChars = [
              '\u200B', '\u200C', '\u200D', '\u200E', '\u200F',
              '\u2028', '\u2029', '\u202A', '\u202B', '\u202C', '\u202D', '\u202E',
              '\u2060', '\u2061', '\u2062', '\u2063', '\u2064',
              '\uFEFF', '\u00AD'
            ]
            
            const hasAnyInvisible = invisibleChars.some(char => result.includes(char))
            return !hasAnyInvisible
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should normalize Windows line endings (\\r\\n) to Unix (\\n)', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            safeStringArbitrary(1, 50),
            safeStringArbitrary(1, 50),
            safeStringArbitrary(1, 50)
          ),
          ([line1, line2, line3]) => {
            const input = line1 + '\r\n' + line2 + '\r\n' + line3
            const result = sanitize(input)
            
            // Windows line endings should be converted to Unix
            const hasWindowsLineEndings = result.includes('\r\n')
            const hasUnixLineEndings = result.includes('\n')
            
            return !hasWindowsLineEndings && hasUnixLineEndings
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should normalize standalone carriage returns (\\r) to newlines (\\n)', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            safeStringArbitrary(1, 50),
            safeStringArbitrary(1, 50)
          ),
          ([line1, line2]) => {
            const input = line1 + '\r' + line2
            const result = sanitize(input)
            
            // Standalone carriage returns should be converted to newlines
            const hasCarriageReturn = result.includes('\r')
            return !hasCarriageReturn
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve tab characters for table data support', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            safeStringArbitrary(1, 50),
            safeStringArbitrary(1, 50),
            safeStringArbitrary(1, 50)
          ),
          ([col1, col2, col3]) => {
            const input = col1 + '\t' + col2 + '\t' + col3
            const result = sanitize(input)
            
            // Tab characters should be preserved
            const tabCount = (result.match(/\t/g) || []).length
            return tabCount === 2 && result === input
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve newlines while removing invisible characters', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            safeStringArbitrary(1, 30),
            safeStringArbitrary(1, 30)
          ),
          ([line1, line2]) => {
            // Input with invisible chars and newlines
            const input = line1 + '\u200B\n' + line2
            const result = sanitize(input)
            
            // Newline should be preserved, invisible char removed
            const hasNewline = result.includes('\n')
            const hasInvisible = result.includes('\u200B')
            
            return hasNewline && !hasInvisible
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle mixed invisible characters and line endings', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            safeStringArbitrary(1, 30),
            safeStringArbitrary(1, 30),
            safeStringArbitrary(1, 30)
          ),
          ([part1, part2, part3]) => {
            // Complex input with various invisible chars and Windows line endings
            const input = part1 + '\u200B\r\n' + part2 + '\uFEFF\t' + part3 + '\u200E'
            const result = sanitize(input)
            
            // Check all conditions
            const hasWindowsLineEndings = result.includes('\r\n')
            const hasInvisibleChars = /[\u200B\uFEFF\u200E]/.test(result)
            const hasTab = result.includes('\t')
            const hasNewline = result.includes('\n')
            
            return !hasWindowsLineEndings && !hasInvisibleChars && hasTab && hasNewline
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
