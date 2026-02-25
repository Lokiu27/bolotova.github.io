import { describe, it, expect } from 'vitest'
import { useMarkdownParser } from '@/composables/useMarkdownParser'

describe('useMarkdownParser', () => {
  it('should parse markdown headings to HTML', () => {
    const { parse } = useMarkdownParser()
    const result = parse('## Test Heading')
    
    expect(result).toContain('<h2')
    expect(result).toContain('Test Heading')
  })

  it('should sanitize script tags', () => {
    const { parse } = useMarkdownParser()
    const result = parse('<script>alert("xss")</script>')
    
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
  })

  it('should preserve Cyrillic characters', () => {
    const { parse } = useMarkdownParser()
    const result = parse('## Образование')
    
    expect(result).toContain('Образование')
  })

  it('should add rel="noopener noreferrer" to email links', () => {
    const { parse } = useMarkdownParser()
    const result = parse('[email](mailto:test@example.com)')
    
    expect(result).toContain('mailto:test@example.com')
    expect(result).toContain('rel="noopener noreferrer"')
  })

  it('should wrap content in semantic HTML structure', () => {
    const { parse } = useMarkdownParser()
    const result = parse('## Section\n\nContent here')
    
    expect(result).toContain('<article class="resume-content">')
    expect(result).toContain('<section class="resume-section">')
  })

  it('should handle empty markdown', () => {
    const { parse } = useMarkdownParser()
    const result = parse('')
    
    expect(result).toContain('Ошибка обработки содержимого резюме')
  })

  it('should be ready immediately', () => {
    const { isReady } = useMarkdownParser()
    
    expect(isReady.value).toBe(true)
  })
})
