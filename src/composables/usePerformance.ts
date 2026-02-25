import { ref, onUnmounted } from 'vue'

/**
 * Performance metrics data structure
 */
export interface PerformanceMetrics {
  /** Current frames per second */
  fps: number
  /** Average FPS over sample window */
  averageFps: number
  /** Frame time in milliseconds */
  frameTime: number
}

/**
 * Configuration options for usePerformance composable
 */
export interface UsePerformanceOptions {
  /** Number of frames to average (default: 60) */
  sampleSize?: number
  /** Callback invoked on FPS updates */
  onFpsUpdate?: (metrics: PerformanceMetrics) => void
}

/**
 * Return type for usePerformance composable
 */
export interface UsePerformanceReturn {
  /** Current FPS (readonly) */
  fps: Readonly<ReturnType<typeof ref<number>>>
  /** Average FPS over sample window (readonly) */
  averageFps: Readonly<ReturnType<typeof ref<number>>>
  /** Frame time in milliseconds (readonly) */
  frameTime: Readonly<ReturnType<typeof ref<number>>>
  /** Start FPS monitoring */
  startMonitoring: () => void
  /** Stop FPS monitoring */
  stopMonitoring: () => void
}

/**
 * Composable for monitoring FPS and performance metrics
 * 
 * Tracks frames per second using requestAnimationFrame and provides
 * real-time and averaged FPS metrics for performance monitoring.
 * 
 * @param options - Configuration options for performance monitoring
 * @returns Performance monitoring utilities and metrics
 * 
 * @example
 * ```ts
 * const performance = usePerformance({
 *   sampleSize: 60,
 *   onFpsUpdate: (metrics) => {
 *     if (metrics.averageFps < 30) {
 *       console.warn('Low FPS detected:', metrics.averageFps)
 *     }
 *   }
 * })
 * 
 * performance.startMonitoring()
 * ```
 */
export function usePerformance(options: UsePerformanceOptions = {}): UsePerformanceReturn {
  const { sampleSize = 60, onFpsUpdate } = options

  const fps = ref(60)
  const averageFps = ref(60)
  const frameTime = ref(16.67)

  let animationFrameId: number | null = null
  let lastFrameTime = performance.now()
  let frameTimes: number[] = []

  function measureFrame(currentTime: number) {
    const delta = currentTime - lastFrameTime
    lastFrameTime = currentTime

    // Calculate current FPS
    const currentFps = 1000 / delta
    fps.value = Math.round(currentFps)
    frameTime.value = delta

    // Track frame times for average calculation
    frameTimes.push(delta)
    if (frameTimes.length > sampleSize) {
      frameTimes.shift()
    }

    // Calculate average FPS
    const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length
    averageFps.value = Math.round(1000 / avgFrameTime)

    // Notify callback if provided
    if (onFpsUpdate) {
      onFpsUpdate({
        fps: fps.value,
        averageFps: averageFps.value,
        frameTime: frameTime.value
      })
    }

    animationFrameId = requestAnimationFrame(measureFrame)
  }

  function startMonitoring() {
    if (animationFrameId !== null) return
    lastFrameTime = performance.now()
    frameTimes = []
    animationFrameId = requestAnimationFrame(measureFrame)
  }

  function stopMonitoring() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    fps,
    averageFps,
    frameTime,
    startMonitoring,
    stopMonitoring
  }
}

/**
 * Debounce function for limiting event handler execution
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}
