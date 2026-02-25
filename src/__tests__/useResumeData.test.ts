import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useResumeData } from '@/composables/useResumeData'

// Mock fetch
global.fetch = vi.fn()

describe('useResumeData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('should fetch and parse resume markdown', async () => {
    const mockMarkdown = '## Test Resume\n\nContent here'
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockMarkdown)
    })

    const { loadResume, parsedHtml, loading, error } = useResumeData()
    
    expect(loading.value).toBe(false)
    
    await loadResume('/data/test.md')
    
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(parsedHtml.value).toContain('Test Resume')
  })

  it('should handle 404 errors', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    const { loadResume, error } = useResumeData()
    
    await loadResume('/data/missing.md')
    
    expect(error.value).toBe('Файл резюме не найден')
  })

  it('should handle network errors', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new TypeError('Network error'))

    const { loadResume, error } = useResumeData()
    
    await loadResume('/data/test.md')
    
    expect(error.value).toBe('Ошибка сети. Проверьте подключение к интернету.')
  })

  it('should cache parsed resume data', async () => {
    const mockMarkdown = '## Cached Resume'
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockMarkdown)
    })

    const { loadResume, parsedHtml } = useResumeData()
    
    await loadResume('/data/test.md')
    
    // Check that data is cached
    const cacheKey = 'resume_cache_/data/test.md'
    const cached = sessionStorage.getItem(cacheKey)
    
    expect(cached).toBeTruthy()
    expect(parsedHtml.value).toContain('Cached Resume')
  })

  it('should use cached data on subsequent calls', async () => {
    const mockMarkdown = '## Cached Resume'
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockMarkdown)
    })

    const { loadResume, parsedHtml } = useResumeData()
    
    // First call - should fetch
    await loadResume('/data/test.md')
    expect(global.fetch).toHaveBeenCalledTimes(1)
    
    // Second call - should use cache
    await loadResume('/data/test.md')
    expect(global.fetch).toHaveBeenCalledTimes(1) // Still 1, not called again
    expect(parsedHtml.value).toContain('Cached Resume')
  })

  it('should clear cache', async () => {
    const mockMarkdown = '## Test'
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockMarkdown)
    })

    const { loadResume, clearCache } = useResumeData()
    
    await loadResume('/data/test.md')
    
    // Verify cache exists
    const cacheKey = 'resume_cache_/data/test.md'
    expect(sessionStorage.getItem(cacheKey)).toBeTruthy()
    
    // Clear cache
    clearCache()
    
    // Verify cache is cleared
    expect(sessionStorage.getItem(cacheKey)).toBe(null)
  })

  it('should handle empty markdown files', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('')
    })

    const { loadResume, error } = useResumeData()
    
    await loadResume('/data/empty.md')
    
    expect(error.value).toBe('Файл резюме пуст')
  })
})
