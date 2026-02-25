import { ref } from 'vue'
import { useMarkdownParser } from './useMarkdownParser'

/**
 * Cache data structure for storing parsed resume HTML
 */
interface CachedResumeData {
  html: string
  timestamp: number
  version: string
  path: string
}

/**
 * Composable for fetching, parsing, and caching resume data
 * 
 * Features:
 * - Fetches markdown files from /data/ directory
 * - Caches parsed HTML in sessionStorage with 1-hour TTL
 * - Integrates with useMarkdownParser for content processing
 * - Error handling with Russian messages
 */
export function useResumeData() {
  const parsedHtml = ref<string>('')
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  
  const { parse } = useMarkdownParser()
  
  // Cache TTL: 1 hour in milliseconds
  const CACHE_TTL = 3600000

  /**
   * Get cached resume data from sessionStorage
   * 
   * @param path - Path to the resume markdown file
   * @returns Cached HTML or null if cache miss/expired
   */
  const getCachedResumeData = (path: string): string | null => {
    try {
      const cacheKey = `resume_cache_${path}`
      const cached = sessionStorage.getItem(cacheKey)
      
      if (!cached) return null
      
      const data: CachedResumeData = JSON.parse(cached)
      
      // Validate cache age (1 hour TTL)
      const age = Date.now() - data.timestamp
      if (age > CACHE_TTL) {
        sessionStorage.removeItem(cacheKey)
        return null
      }
      
      return data.html
    } catch (err) {
      // Corrupted cache data
      console.warn('Failed to read cache:', err)
      try {
        sessionStorage.removeItem(`resume_cache_${path}`)
      } catch {
        // Ignore if removal fails
      }
      return null
    }
  }

  /**
   * Cache parsed resume data in sessionStorage
   * 
   * @param path - Path to the resume markdown file
   * @param html - Parsed HTML content
   */
  const cacheResumeData = (path: string, html: string): void => {
    try {
      const cacheData: CachedResumeData = {
        html,
        timestamp: Date.now(),
        version: '1.0.0',
        path
      }
      
      const cacheKey = `resume_cache_${path}`
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (err) {
      // Quota exceeded or storage disabled
      console.warn('Failed to cache resume data:', err)
      // Continue without caching - not critical
    }
  }

  /**
   * Load and parse resume from markdown file
   * 
   * @param path - Path to the resume markdown file (e.g., '/data/resume.md')
   */
  const loadResume = async (path: string): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      // Check cache first
      const cached = getCachedResumeData(path)
      if (cached) {
        parsedHtml.value = cached
        loading.value = false
        return
      }
      
      // Fetch markdown file
      const response = await fetch(path)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Файл резюме не найден')
        }
        throw new Error(`Ошибка загрузки: ${response.status}`)
      }
      
      const markdown = await response.text()
      
      if (!markdown || markdown.trim().length === 0) {
        throw new Error('Файл резюме пуст')
      }
      
      // Parse markdown to HTML
      const html = parse(markdown)
      
      // Cache the result
      cacheResumeData(path, html)
      
      // Update state
      parsedHtml.value = html
    } catch (err) {
      if (err instanceof TypeError) {
        // Network error
        error.value = 'Ошибка сети. Проверьте подключение к интернету.'
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Не удалось загрузить резюме'
      }
      console.error('Resume loading error:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear cached resume data
   */
  const clearCache = (): void => {
    try {
      // Clear all resume cache entries
      const keys = Object.keys(sessionStorage)
      keys.forEach(key => {
        if (key.startsWith('resume_cache_')) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (err) {
      console.warn('Failed to clear cache:', err)
    }
  }

  return {
    parsedHtml,
    loading,
    error,
    loadResume,
    clearCache
  }
}
