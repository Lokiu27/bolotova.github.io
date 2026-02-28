/**
 * Property-based tests for useRateLimiter composable
 * 
 * Feature: mini-llm-json-schema
 * Properties 14-15: Rate Limiting and Timeout
 * 
 * Validates: Requirements 13.1-13.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { useRateLimiter, type UseRateLimiterReturn } from '../../composables/useRateLimiter'

// Mock Vue's onUnmounted to prevent errors in test environment
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onUnmounted: vi.fn()
  }
})

describe('rate-limiter Property Tests', () => {
  /**
   * Feature: mini-llm-json-schema, Property 14: Rate Limiting Enforcement
   * 
   * *For any* sequence of generation requests, if two requests are made
   * within 5 seconds of each other, the second request SHALL be blocked
   * until the cooldown period expires.
   * 
   * Validates: Requirements 13.1
   */
  describe('Property 14: Rate Limiting Enforcement', () => {
    let rateLimiter: UseRateLimiterReturn
    
    beforeEach(() => {
      vi.useFakeTimers()
      rateLimiter = useRateLimiter()
    })
    
    afterEach(() => {
      vi.useRealTimers()
    })
    
    // ========================================================================
    // Generators
    // ========================================================================
    
    /**
     * Generator for cooldown periods (1ms to 10000ms)
     */
    const cooldownMsArbitrary = fc.integer({ min: 1, max: 10000 })
    
    /**
     * Generator for time delays between requests (0ms to 15000ms)
     */
    const delayMsArbitrary = fc.integer({ min: 0, max: 15000 })
    
    /**
     * Generator for sequences of request delays
     */
    const delaySequenceArbitrary = fc.array(delayMsArbitrary, { minLength: 1, maxLength: 10 })
    
    /**
     * Generator for number of requests (1 to 20)
     */
    const requestCountArbitrary = fc.integer({ min: 1, max: 20 })
    
    // ========================================================================
    // Property Tests: Immediate Request Blocking
    // ========================================================================
    
    /**
     * Test: Second request within cooldown is blocked
     * 
     * For any cooldown period, if a second request is made immediately
     * after the first, it SHALL be blocked.
     */
    it('should block second request made immediately after first', () => {
      fc.assert(
        fc.property(
          cooldownMsArbitrary,
          (cooldownMs) => {
            const limiter = useRateLimiter({ cooldownMs })
            
            // Initially can request
            if (!limiter.canRequest.value) return false
            
            // Record first request
            limiter.recordRequest()
            
            // Immediately after, should be blocked
            return !limiter.canRequest.value
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: Request blocked during entire cooldown period
     * 
     * For any time within the cooldown period, canRequest SHALL be false.
     */
    it('should block requests during entire cooldown period', () => {
      fc.assert(
        fc.property(
          cooldownMsArbitrary,
          fc.integer({ min: 0, max: 100 }), // Percentage of cooldown elapsed
          (cooldownMs, percentElapsed) => {
            const limiter = useRateLimiter({ cooldownMs })
            
            // Record request
            limiter.recordRequest()
            
            // Advance time by percentage of cooldown (but not 100%)
            const elapsedMs = Math.floor(cooldownMs * (percentElapsed / 100))
            if (elapsedMs < cooldownMs) {
              vi.advanceTimersByTime(elapsedMs)
              
              // Should still be blocked
              return limiter.canRequest.value === false
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: Request allowed after cooldown expires
     * 
     * For any cooldown period, after the cooldown expires,
     * canRequest SHALL be true.
     */
    it('should allow request after cooldown expires', () => {
      fc.assert(
        fc.property(
          cooldownMsArbitrary,
          fc.integer({ min: 1, max: 1000 }), // Extra time after cooldown (at least 1ms)
          (cooldownMs, extraMs) => {
            const limiter = useRateLimiter({ cooldownMs, updateIntervalMs: 10 })
            
            // Record request
            limiter.recordRequest()
            
            // Advance time past cooldown (add extra buffer for timer precision)
            vi.advanceTimersByTime(cooldownMs + extraMs + 50)
            
            // Should be allowed now
            return limiter.canRequest.value
          }
        ),
        { numRuns: 100 }
      )
    })
    
    // ========================================================================
    // Property Tests: Cooldown Calculation
    // ========================================================================
    
    /**
     * Test: Remaining cooldown decreases over time
     * 
     * For any cooldown period and elapsed time, the remaining cooldown
     * SHALL be approximately (cooldownMs - elapsedMs), clamped to 0.
     */
    it('should correctly calculate remaining cooldown', () => {
      fc.assert(
        fc.property(
          cooldownMsArbitrary,
          fc.integer({ min: 0, max: 15000 }),
          (cooldownMs, elapsedMs) => {
            const limiter = useRateLimiter({ cooldownMs, updateIntervalMs: 10 })
            
            // Record request
            limiter.recordRequest()
            
            // Initial remaining should be cooldownMs
            if (limiter.remainingCooldown.value !== cooldownMs) return false
            
            // Advance time
            vi.advanceTimersByTime(elapsedMs)
            
            // Calculate expected remaining
            const expectedRemaining = Math.max(0, cooldownMs - elapsedMs)
            
            // Allow small tolerance for timer precision
            const tolerance = 20
            const actualRemaining = limiter.remainingCooldown.value
            
            return Math.abs(actualRemaining - expectedRemaining) <= tolerance
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: Remaining cooldown never goes negative
     * 
     * For any elapsed time, remainingCooldown SHALL never be negative.
     */
    it('should never have negative remaining cooldown', () => {
      fc.assert(
        fc.property(
          cooldownMsArbitrary,
          fc.integer({ min: 0, max: 30000 }),
          (cooldownMs, elapsedMs) => {
            const limiter = useRateLimiter({ cooldownMs, updateIntervalMs: 10 })
            
            // Record request
            limiter.recordRequest()
            
            // Advance time (possibly way past cooldown)
            vi.advanceTimersByTime(elapsedMs)
            
            // Remaining should never be negative
            return limiter.remainingCooldown.value >= 0
          }
        ),
        { numRuns: 100 }
      )
    })
    
    // ========================================================================
    // Property Tests: Multiple Requests
    // ========================================================================
    
    /**
     * Test: Each request resets the cooldown
     * 
     * For any sequence of requests with delays, each successful request
     * SHALL reset the cooldown to the full period.
     */
    it('should reset cooldown on each new request', () => {
      fc.assert(
        fc.property(
          cooldownMsArbitrary,
          delaySequenceArbitrary,
          (cooldownMs, delays) => {
            const limiter = useRateLimiter({ cooldownMs, updateIntervalMs: 10 })
            
            for (const delay of delays) {
              // Advance time
              vi.advanceTimersByTime(delay)
              
              // If can request, record it
              if (limiter.canRequest.value) {
                limiter.recordRequest()
                
                // After recording, remaining should be full cooldown
                if (limiter.remainingCooldown.value !== cooldownMs) {
                  return false
                }
              }
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: Requests within cooldown are consistently blocked
     * 
     * For any number of rapid requests, only the first SHALL succeed,
     * and all subsequent requests within cooldown SHALL be blocked.
     */
    it('should block all rapid requests after the first', () => {
      fc.assert(
        fc.property(
          cooldownMsArbitrary,
          requestCountArbitrary,
          (cooldownMs, requestCount) => {
            const limiter = useRateLimiter({ cooldownMs })
            
            let successfulRequests = 0
            
            for (let i = 0; i < requestCount; i++) {
              if (limiter.canRequest.value) {
                limiter.recordRequest()
                successfulRequests++
              }
              // No time advancement - all requests are immediate
            }
            
            // Only the first request should succeed
            return successfulRequests === 1
          }
        ),
        { numRuns: 100 }
      )
    })
    
    // ========================================================================
    // Property Tests: Reset Functionality
    // ========================================================================
    
    /**
     * Test: Reset clears cooldown immediately
     * 
     * For any state of the rate limiter, reset() SHALL immediately
     * allow new requests.
     */
    it('should allow request immediately after reset', () => {
      fc.assert(
        fc.property(
          cooldownMsArbitrary,
          fc.integer({ min: 0, max: 100 }), // Percentage of cooldown elapsed
          (cooldownMs, percentElapsed) => {
            const limiter = useRateLimiter({ cooldownMs, updateIntervalMs: 10 })
            
            // Record request
            limiter.recordRequest()
            
            // Advance time partially
            const elapsedMs = Math.floor(cooldownMs * (percentElapsed / 100))
            vi.advanceTimersByTime(elapsedMs)
            
            // Reset
            limiter.reset()
            
            // Should be able to request immediately
            return (
              limiter.canRequest.value === true &&
              limiter.remainingCooldown.value === 0
            )
          }
        ),
        { numRuns: 100 }
      )
    })
    
    // ========================================================================
    // Property Tests: isLimited Consistency
    // ========================================================================
    
    /**
     * Test: isLimited is inverse of canRequest
     * 
     * For any state, isLimited SHALL be the inverse of canRequest.
     */
    it('should have isLimited as inverse of canRequest', () => {
      fc.assert(
        fc.property(
          cooldownMsArbitrary,
          fc.integer({ min: 0, max: 15000 }),
          (cooldownMs, elapsedMs) => {
            const limiter = useRateLimiter({ cooldownMs, updateIntervalMs: 10 })
            
            // Check initial state
            if (limiter.isLimited.value !== !limiter.canRequest.value) return false
            
            // Record request
            limiter.recordRequest()
            
            // Check after request
            if (limiter.isLimited.value !== !limiter.canRequest.value) return false
            
            // Advance time
            vi.advanceTimersByTime(elapsedMs)
            
            // Check after time advancement
            return limiter.isLimited.value === !limiter.canRequest.value
          }
        ),
        { numRuns: 100 }
      )
    })
    
    // ========================================================================
    // Property Tests: Seconds Calculation
    // ========================================================================
    
    /**
     * Test: remainingCooldownSeconds is correctly rounded up
     * 
     * For any remaining cooldown, remainingCooldownSeconds SHALL be
     * the ceiling of (remainingCooldown / 1000).
     */
    it('should correctly calculate remaining seconds (rounded up)', () => {
      fc.assert(
        fc.property(
          cooldownMsArbitrary,
          fc.integer({ min: 0, max: 15000 }),
          (cooldownMs, elapsedMs) => {
            const limiter = useRateLimiter({ cooldownMs, updateIntervalMs: 10 })
            
            // Record request
            limiter.recordRequest()
            
            // Advance time
            vi.advanceTimersByTime(elapsedMs)
            
            // Calculate expected seconds
            const expectedSeconds = Math.ceil(limiter.remainingCooldown.value / 1000)
            
            return limiter.remainingCooldownSeconds.value === expectedSeconds
          }
        ),
        { numRuns: 100 }
      )
    })
    
    // ========================================================================
    // Property Tests: Default Cooldown
    // ========================================================================
    
    /**
     * Test: Default cooldown is 5000ms (5 seconds)
     * 
     * Validates: Requirement 13.1
     */
    it('should have default cooldown of 5000ms', () => {
      const limiter = useRateLimiter()
      expect(limiter.getCooldownMs()).toBe(5000)
    })
  })


  /**
   * Feature: mini-llm-json-schema, Property 15: Generation Timeout
   * 
   * *For any* generation operation, if it does not complete within 60 seconds,
   * it SHALL be automatically aborted and return a timeout error.
   * 
   * Note: This property is tested at the llm-engine level, but we include
   * timeout-related tests here for the rate limiter's timeout awareness.
   * 
   * Validates: Requirements 13.2
   */
  describe('Property 15: Generation Timeout (Rate Limiter Awareness)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    
    afterEach(() => {
      vi.useRealTimers()
    })
    
    // ========================================================================
    // Generators
    // ========================================================================
    
    /**
     * Generator for timeout durations (1000ms to 120000ms)
     */
    const timeoutMsArbitrary = fc.integer({ min: 1000, max: 120000 })
    
    /**
     * Generator for elapsed time relative to timeout
     */
    const elapsedTimeArbitrary = fc.integer({ min: 0, max: 150000 })
    
    // ========================================================================
    // Property Tests: Timeout Independence
    // ========================================================================
    
    /**
     * Test: Rate limiter operates independently of generation timeout
     * 
     * For any timeout duration, the rate limiter SHALL continue to
     * function correctly regardless of how long a generation takes.
     */
    it('should operate independently of generation timeout', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000 }), // cooldown
          timeoutMsArbitrary,
          (cooldownMs, _timeoutMs) => {
            const limiter = useRateLimiter({ cooldownMs, updateIntervalMs: 10 })
            
            // Record request (simulating start of generation)
            limiter.recordRequest()
            
            // Rate limiter should be in cooldown
            if (limiter.canRequest.value) return false
            
            // Advance time past cooldown
            vi.advanceTimersByTime(cooldownMs + 100)
            
            // Rate limiter should allow new request
            // (regardless of whether generation timed out)
            return limiter.canRequest.value
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: Rate limiter cooldown is shorter than generation timeout
     * 
     * The default rate limiter cooldown (5s) SHALL be shorter than
     * the generation timeout (60s) to allow retries after timeout.
     */
    it('should have cooldown shorter than generation timeout', () => {
      const limiter = useRateLimiter()
      const cooldownMs = limiter.getCooldownMs()
      const generationTimeoutMs = 60000 // From DEFAULT_LLM_CONFIG
      
      expect(cooldownMs).toBeLessThan(generationTimeoutMs)
    })
    
    /**
     * Test: Multiple timeouts don't affect rate limiter state
     * 
     * For any sequence of operations that might timeout,
     * the rate limiter SHALL maintain correct state.
     */
    it('should maintain correct state through multiple timeout scenarios', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000 }),
          fc.array(elapsedTimeArbitrary, { minLength: 1, maxLength: 5 }),
          (cooldownMs, timeSequence) => {
            const limiter = useRateLimiter({ cooldownMs, updateIntervalMs: 10 })
            
            for (const elapsed of timeSequence) {
              // Record request if allowed
              if (limiter.canRequest.value) {
                limiter.recordRequest()
              }
              
              // Advance time (simulating various operation durations)
              vi.advanceTimersByTime(elapsed)
              
              // State should always be consistent
              if (limiter.isLimited.value !== !limiter.canRequest.value) {
                return false
              }
              
              if (limiter.remainingCooldown.value < 0) {
                return false
              }
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
    
    // ========================================================================
    // Property Tests: Timeout Recovery
    // ========================================================================
    
    /**
     * Test: Rate limiter allows retry after timeout
     * 
     * After a generation timeout (60s), the rate limiter SHALL allow
     * a new request since the cooldown (5s) has long expired.
     */
    it('should allow retry after generation timeout', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 5000 }), // cooldown (less than timeout)
          (cooldownMs) => {
            const limiter = useRateLimiter({ cooldownMs, updateIntervalMs: 10 })
            const generationTimeoutMs = 60000
            
            // Record initial request
            limiter.recordRequest()
            
            // Simulate generation timeout
            vi.advanceTimersByTime(generationTimeoutMs)
            
            // Should be able to retry
            return limiter.canRequest.value === true
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: Cooldown doesn't extend beyond configured period
     * 
     * For any elapsed time, the cooldown SHALL never extend beyond
     * the configured period.
     */
    it('should not extend cooldown beyond configured period', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000 }),
          fc.array(fc.integer({ min: 0, max: 5000 }), { minLength: 1, maxLength: 10 }),
          (cooldownMs, timeIncrements) => {
            const limiter = useRateLimiter({ cooldownMs, updateIntervalMs: 10 })
            
            // Record request
            limiter.recordRequest()
            
            // Track total elapsed time
            let totalElapsed = 0
            
            for (const increment of timeIncrements) {
              vi.advanceTimersByTime(increment)
              totalElapsed += increment
              
              // Remaining cooldown should never exceed original cooldown
              if (limiter.remainingCooldown.value > cooldownMs) {
                return false
              }
              
              // If total elapsed >= cooldown, remaining should be 0
              if (totalElapsed >= cooldownMs && limiter.remainingCooldown.value > 0) {
                // Allow small tolerance for timer precision
                if (limiter.remainingCooldown.value > 20) {
                  return false
                }
              }
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
