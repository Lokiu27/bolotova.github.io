/**
 * Performance monitoring utilities for the Vue application
 * Implements performance measurement as required by Requirements 5.1
 */

export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactiveTime: number
  resourceLoadTime: number
}

export class PerformanceMonitor {
  private startTime: number
  private metrics: Partial<PerformanceMetrics> = {}

  constructor() {
    this.startTime = performance.now()
    this.setupPerformanceObserver()
  }

  /**
   * Mark the start of application loading
   */
  markLoadStart(): void {
    this.startTime = performance.now()
    performance.mark('app-load-start')
  }

  /**
   * Mark when the application has finished loading
   */
  markLoadEnd(): void {
    performance.mark('app-load-end')
    performance.measure('app-load-time', 'app-load-start', 'app-load-end')
    
    const loadMeasure = performance.getEntriesByName('app-load-time')[0]
    this.metrics.loadTime = loadMeasure.duration
  }

  /**
   * Mark when the application has finished rendering
   */
  markRenderComplete(): void {
    performance.mark('app-render-complete')
    performance.measure('app-render-time', 'app-load-start', 'app-render-complete')
    
    const renderMeasure = performance.getEntriesByName('app-render-time')[0]
    this.metrics.renderTime = renderMeasure.duration
  }

  /**
   * Mark when the application becomes interactive
   */
  markInteractive(): void {
    performance.mark('app-interactive')
    performance.measure('app-interactive-time', 'app-load-start', 'app-interactive')
    
    const interactiveMeasure = performance.getEntriesByName('app-interactive-time')[0]
    this.metrics.interactiveTime = interactiveMeasure.duration
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      loadTime: this.metrics.loadTime || 0,
      renderTime: this.metrics.renderTime || 0,
      interactiveTime: this.metrics.interactiveTime || 0,
      resourceLoadTime: this.metrics.resourceLoadTime || 0
    }
  }

  /**
   * Check if performance meets requirements (< 3 seconds load time)
   */
  meetsPerformanceRequirements(): boolean {
    const metrics = this.getMetrics()
    return metrics.loadTime < 3000 // Requirements 5.1: under 3 seconds
  }

  /**
   * Log performance metrics to console (development only)
   */
  logMetrics(): void {
    if (import.meta.env.DEV) {
      const metrics = this.getMetrics()
      console.group('🚀 Performance Metrics')
      console.log(`Load Time: ${metrics.loadTime.toFixed(2)}ms`)
      console.log(`Render Time: ${metrics.renderTime.toFixed(2)}ms`)
      console.log(`Interactive Time: ${metrics.interactiveTime.toFixed(2)}ms`)
      console.log(`Resource Load Time: ${metrics.resourceLoadTime.toFixed(2)}ms`)
      console.log(`Meets Requirements: ${this.meetsPerformanceRequirements() ? '✅' : '❌'}`)
      console.groupEnd()
    }
  }

  /**
   * Setup Performance Observer to monitor resource loading
   */
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        let totalResourceTime = 0

        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            totalResourceTime += entry.duration
          }
        })

        if (totalResourceTime > 0) {
          this.metrics.resourceLoadTime = totalResourceTime
        }
      })

      observer.observe({ entryTypes: ['resource', 'navigation'] })
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Lazy loading utility for images
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null

  constructor() {
    this.setupIntersectionObserver()
  }

  /**
   * Setup intersection observer for lazy loading
   */
  private setupIntersectionObserver(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement
              if (img.dataset.src) {
                img.src = img.dataset.src
                img.classList.remove('lazy')
                img.classList.add('loaded')
                this.observer?.unobserve(img)
              }
            }
          })
        },
        {
          rootMargin: '50px 0px', // Start loading 50px before the image enters viewport
          threshold: 0.1
        }
      )
    }
  }

  /**
   * Observe an image for lazy loading
   */
  observe(img: HTMLImageElement): void {
    if (this.observer) {
      img.classList.add('lazy')
      this.observer.observe(img)
    } else {
      // Fallback for browsers without IntersectionObserver
      if (img.dataset.src) {
        img.src = img.dataset.src
      }
    }
  }

  /**
   * Disconnect the observer
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// Global lazy image loader instance
export const lazyImageLoader = new LazyImageLoader()