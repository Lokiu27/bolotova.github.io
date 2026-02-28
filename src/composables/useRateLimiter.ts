/**
 * useRateLimiter Composable
 * 
 * Provides rate limiting functionality to prevent DoS and browser overload.
 * Limits requests to 1 per 5 seconds by default.
 * 
 * Features:
 * - Configurable cooldown period
 * - Reactive state: canRequest, remainingCooldown
 * - Automatic countdown timer
 * - Manual reset capability
 * 
 * Validates: Requirements 13.1, 13.4
 */

import { ref, computed, onUnmounted, type Ref, type ComputedRef } from 'vue'

/**
 * Configuration options for rate limiter
 */
export interface RateLimiterOptions {
  /** Cooldown period in milliseconds (default: 5000) */
  cooldownMs?: number
  /** Update interval for countdown in milliseconds (default: 100) */
  updateIntervalMs?: number
}

/**
 * Return type for useRateLimiter composable
 */
export interface UseRateLimiterReturn {
  /** Whether a new request can be made */
  canRequest: ComputedRef<boolean>
  /** Remaining cooldown time in milliseconds */
  remainingCooldown: Ref<number>
  /** Remaining cooldown time in seconds (rounded up) */
  remainingCooldownSeconds: ComputedRef<number>
  /** Whether rate limiter is currently active (in cooldown) */
  isLimited: ComputedRef<boolean>
  /** Record a new request (starts cooldown) */
  recordRequest: () => void
  /** Reset the rate limiter (clears cooldown) */
  reset: () => void
  /** Get the cooldown period in milliseconds */
  getCooldownMs: () => number
}

/**
 * Default cooldown period: 5 seconds
 * Validates: Requirement 13.1
 */
const DEFAULT_COOLDOWN_MS = 5000

/**
 * Default update interval: 100ms for smooth countdown
 */
const DEFAULT_UPDATE_INTERVAL_MS = 100

/**
 * Composable for rate limiting requests
 * 
 * @param options - Configuration options
 * @returns Rate limiter utilities and reactive state
 * 
 * Validates: Requirements 13.1, 13.4
 */
export function useRateLimiter(options: RateLimiterOptions = {}): UseRateLimiterReturn {
  const {
    cooldownMs = DEFAULT_COOLDOWN_MS,
    updateIntervalMs = DEFAULT_UPDATE_INTERVAL_MS
  } = options
  
  // Timestamp of last request
  const lastRequestTime = ref<number>(0)
  
  // Remaining cooldown in milliseconds
  const remainingCooldown = ref<number>(0)
  
  // Interval ID for countdown timer
  let countdownInterval: ReturnType<typeof setInterval> | null = null
  
  /**
   * Whether a new request can be made
   * True if cooldown has expired
   * 
   * Validates: Requirement 13.1
   */
  const canRequest = computed<boolean>(() => {
    return remainingCooldown.value <= 0
  })
  
  /**
   * Whether rate limiter is currently active (in cooldown)
   */
  const isLimited = computed<boolean>(() => {
    return remainingCooldown.value > 0
  })
  
  /**
   * Remaining cooldown time in seconds (rounded up)
   * Useful for displaying to users
   */
  const remainingCooldownSeconds = computed<number>(() => {
    return Math.ceil(remainingCooldown.value / 1000)
  })
  
  /**
   * Update remaining cooldown based on elapsed time
   */
  const updateCooldown = (): void => {
    if (lastRequestTime.value === 0) {
      remainingCooldown.value = 0
      return
    }
    
    const elapsed = Date.now() - lastRequestTime.value
    const remaining = Math.max(0, cooldownMs - elapsed)
    
    remainingCooldown.value = remaining
    
    // Stop interval when cooldown expires
    if (remaining <= 0 && countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }
  
  /**
   * Start countdown timer
   */
  const startCountdown = (): void => {
    // Clear existing interval if any
    if (countdownInterval) {
      clearInterval(countdownInterval)
    }
    
    // Start new interval
    countdownInterval = setInterval(updateCooldown, updateIntervalMs)
  }
  
  /**
   * Record a new request
   * Starts the cooldown period
   * 
   * Validates: Requirement 13.4
   */
  const recordRequest = (): void => {
    lastRequestTime.value = Date.now()
    remainingCooldown.value = cooldownMs
    startCountdown()
  }
  
  /**
   * Reset the rate limiter
   * Clears cooldown and allows immediate request
   */
  const reset = (): void => {
    lastRequestTime.value = 0
    remainingCooldown.value = 0
    
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }
  
  /**
   * Get the cooldown period in milliseconds
   * 
   * @returns Cooldown period in ms
   */
  const getCooldownMs = (): number => {
    return cooldownMs
  }
  
  // Cleanup on component unmount
  onUnmounted(() => {
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  })
  
  return {
    canRequest,
    remainingCooldown,
    remainingCooldownSeconds,
    isLimited,
    recordRequest,
    reset,
    getCooldownMs
  }
}

/**
 * Default export for convenience
 */
export default useRateLimiter
