import { ref, type Ref } from 'vue'
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
 * Return type for useResumeData composable
 */
export interface UseResumeDataReturn {
  parsedHtml: Ref<string>
  loading: Ref<boolean>
  error: Ref<string | null>
  loadResume: (path: string) => Promise<void>
  clearCache: () => void
}

/**
 * Composable for fetching, parsing, and caching resume data
 * 
 * Features:
 * - Fetches markdown files from /data/ directory
 * - Caches parsed HTML in sessionStorage with 1-hour TTL
 * - Integrates with useMarkdownParser for content processing
 * - Error handling with Russian messages
 * 
 * @returns Object with resume data state and control methods
 */
export function useResumeData(): UseResumeDataReturn {
  const parsedHtml = ref<string>('')
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  
  const { parse } = useMarkdownParser()
  
  // Cache TTL: 1 hour in milliseconds
  const CACHE_TTL = 3600000

  /**
   * Get cache key for a given path
   */
  const getCacheKey = (path: string): string => `resume_cache_${path}`

  /**
   * Get cached resume data from sessionStorage
   * 
   * @param path - Path to the resume markdown file
   * @returns Cached HTML or null if cache miss/expired
   */
  const getCachedResumeData = (path: string): string | null => {
    try {
      const cacheKey = getCacheKey(path)
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
        sessionStorage.removeItem(getCacheKey(path))
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
        version: '1.0',
        path
      }
      sessionStorage.setItem(getCacheKey(path), JSON.stringify(cacheData))
    } catch (err) {
      // Ignore cache errors
      console.warn('[useResumeData] Failed to cache resume data:', err)
    }
  }

  /**
   * Load and parse resume from markdown file
   * 
   * @param path - Path to the resume markdown file (e.g., '/data/resume.md')
   */
  const loadResume = async (path: string): Promise<void> => {
    console.log('[useResumeData] loadResume called with path:', path)
    loading.value = true
    error.value = null
    
    console.log('[useResumeData] Loading state set to true')
    
    try {
      // Check cache first
      console.log('[useResumeData] Checking cache...')
      const cached = getCachedResumeData(path)
      if (cached) {
        console.log('[useResumeData] Cache hit! Using cached data')
        parsedHtml.value = cached
        loading.value = false
        return
      }
      
      console.log('[useResumeData] Cache miss, fetching from server...')
      
      // Fetch markdown file
      const response = await fetch(path)
      
      console.log('[useResumeData] Fetch response:', response.status, response.ok)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Файл резюме не найден')
        }
        throw new Error(`Ошибка загрузки: ${response.status}`)
      }
      
      const markdown = await response.text()
      
      console.log('[useResumeData] Markdown loaded, length:', markdown.length)
      console.log('[useResumeData] Markdown preview:', markdown.substring(0, 100))
      
      if (!markdown || markdown.trim().length === 0) {
        throw new Error('Файл резюме пуст')
      }
      
      // Parse markdown to HTML
      console.log('[useResumeData] Parsing markdown...')
      const html = parse(markdown)
      
      console.log('[useResumeData] HTML parsed, length:', html.length)
      console.log('[useResumeData] HTML preview:', html.substring(0, 100))
      
      // Cache the result
      cacheResumeData(path, html)
      
      // Update state
      parsedHtml.value = html
      
      console.log('[useResumeData] Resume loaded successfully!')
    } catch (err) {
      console.error('[useResumeData] Error occurred:', err)
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
      console.log('[useResumeData] Loading complete, loading state:', loading.value)
    }
  }

  /**
   * Clear all cached resume data from sessionStorage
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
