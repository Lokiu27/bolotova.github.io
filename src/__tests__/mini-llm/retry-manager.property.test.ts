/**
 * Property-based tests for retry-manager module
 * 
 * Feature: mini-llm-json-schema, Property 9: Retry Count Invariant
 * 
 * *For any* generation session, the number of attempts SHALL never exceed 3.
 * Additionally, *for any* new generation request, the attempt counter SHALL reset to 1.
 * 
 * Validates: Requirements 10.2, 10.5
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { 
  RetryManager, 
  createRetryManager, 
  MAX_ATTEMPTS,
  type AttemptResult 
} from '../../workers/retry-manager'

describe('retry-manager Property Tests', () => {
  /**
   * Feature: mini-llm-json-schema, Property 9: Retry Count Invariant
   * 
   * *For any* generation session, the number of attempts SHALL never exceed 3.
   * Additionally, *for any* new generation request, the attempt counter SHALL reset to 1.
   * 
   * Validates: Requirements 10.2, 10.5
   */
  describe('Property 9: Retry Count Invariant', () => {
    let retryManager: RetryManager
    
    beforeEach(() => {
      retryManager = createRetryManager()
    })
    
    // ========================================================================
    // Generators
    // ========================================================================
    
    /**
     * Generator for attempt results (success or various failure reasons)
     */
    const attemptResultArbitrary = fc.oneof(
      fc.record({
        success: fc.constant(true as const),
        value: fc.string({ minLength: 1, maxLength: 100 })
      }),
      fc.record({
        success: fc.constant(false as const),
        reason: fc.constantFrom(
          'generation_failed' as const,
          'security_violation' as const,
          'evaluation_failed' as const,
          'validation_failed' as const
        )
      })
    ) as fc.Arbitrary<AttemptResult>
    
    /**
     * Generator for sequences of attempt results
     * Generates 1 to 10 results to test various scenarios
     */
    const attemptSequenceArbitrary = fc.array(attemptResultArbitrary, { minLength: 1, maxLength: 10 })
    
    /**
     * Generator for number of manual increment calls (0 to 10)
     */
    const incrementCountArbitrary = fc.integer({ min: 0, max: 10 })
    
    /**
     * Generator for number of sessions to run sequentially
     */
    const sessionCountArbitrary = fc.integer({ min: 1, max: 5 })
    
    // ========================================================================
    // Property Tests: Attempt Count Never Exceeds MAX_ATTEMPTS
    // ========================================================================
    
    /**
     * Test: Attempt count never exceeds MAX_ATTEMPTS during executeWithRetry
     * 
     * For any sequence of attempt results, the final attempt count
     * SHALL never exceed MAX_ATTEMPTS (3).
     */
    it('should never exceed MAX_ATTEMPTS during executeWithRetry', async () => {
      await fc.assert(
        fc.asyncProperty(
          attemptSequenceArbitrary,
          async (attemptResults) => {
            const manager = createRetryManager()
            let attemptIndex = 0
            let maxObservedAttempt = 0
            
            const attemptFn = async (): Promise<AttemptResult> => {
              // Return results in sequence, cycling if needed
              const result = attemptResults[attemptIndex % attemptResults.length]
              attemptIndex++
              return result
            }
            
            const onAttempt = (current: number, _max: number) => {
              maxObservedAttempt = Math.max(maxObservedAttempt, current)
            }
            
            const result = await manager.executeWithRetry(attemptFn, onAttempt)
            
            // Invariant: attempts never exceed MAX_ATTEMPTS
            return (
              result.attempts <= MAX_ATTEMPTS &&
              maxObservedAttempt <= MAX_ATTEMPTS
            )
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: Manual incrementAttempt never allows exceeding MAX_ATTEMPTS
     * 
     * For any number of increment calls, the attempt count
     * SHALL never exceed MAX_ATTEMPTS.
     */
    it('should throw error when trying to exceed MAX_ATTEMPTS via incrementAttempt', () => {
      fc.assert(
        fc.property(
          incrementCountArbitrary,
          (incrementCount) => {
            const manager = createRetryManager()
            manager.startSession()
            
            let successfulIncrements = 0
            let threwError = false
            
            for (let i = 0; i < incrementCount; i++) {
              try {
                manager.incrementAttempt()
                successfulIncrements++
              } catch {
                threwError = true
                break
              }
            }
            
            manager.endSession()
            
            // Invariant: successful increments never exceed MAX_ATTEMPTS
            // If we tried more than MAX_ATTEMPTS, an error should have been thrown
            return (
              successfulIncrements <= MAX_ATTEMPTS &&
              (incrementCount <= MAX_ATTEMPTS || threwError)
            )
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: canRetry returns false when at MAX_ATTEMPTS
     */
    it('should return canRetry=false when at MAX_ATTEMPTS', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: MAX_ATTEMPTS }),
          (targetAttempts) => {
            const manager = createRetryManager()
            manager.startSession()
            
            // Increment to target
            for (let i = 0; i < targetAttempts; i++) {
              manager.incrementAttempt()
            }
            
            const canRetry = manager.canRetry()
            manager.endSession()
            
            // canRetry should be false only when at MAX_ATTEMPTS
            return canRetry === (targetAttempts < MAX_ATTEMPTS)
          }
        ),
        { numRuns: 100 }
      )
    })
    
    // ========================================================================
    // Property Tests: Counter Resets for New Requests
    // ========================================================================
    
    /**
     * Test: Counter resets to 0 when starting a new session
     * 
     * For any sequence of sessions, each new session SHALL start
     * with attempt counter at 0 (first increment brings it to 1).
     */
    it('should reset counter to 0 when starting new session', () => {
      fc.assert(
        fc.property(
          sessionCountArbitrary,
          fc.array(fc.integer({ min: 1, max: MAX_ATTEMPTS }), { minLength: 1, maxLength: 5 }),
          (sessionCount, incrementsPerSession) => {
            const manager = createRetryManager()
            
            for (let session = 0; session < sessionCount; session++) {
              manager.startSession()
              
              // Verify counter starts at 0
              const initialAttempt = manager.getCurrentAttempt()
              if (initialAttempt !== 0) {
                manager.endSession()
                return false
              }
              
              // Do some increments
              const increments = incrementsPerSession[session % incrementsPerSession.length]
              for (let i = 0; i < increments; i++) {
                manager.incrementAttempt()
              }
              
              manager.endSession()
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: First increment in any session brings counter to 1
     * 
     * For any new generation request, the first attempt SHALL be numbered 1.
     */
    it('should have first attempt numbered 1 in any session', async () => {
      await fc.assert(
        fc.asyncProperty(
          sessionCountArbitrary,
          async (sessionCount) => {
            const manager = createRetryManager()
            
            for (let session = 0; session < sessionCount; session++) {
              let firstAttemptNumber = -1
              
              const attemptFn = async (): Promise<AttemptResult> => {
                // Always succeed on first attempt
                return { success: true, value: 'test' }
              }
              
              const onAttempt = (current: number, _max: number) => {
                if (firstAttemptNumber === -1) {
                  firstAttemptNumber = current
                }
              }
              
              await manager.executeWithRetry(attemptFn, onAttempt)
              
              // First attempt should always be 1
              if (firstAttemptNumber !== 1) {
                return false
              }
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: executeWithRetry resets counter between calls
     */
    it('should reset counter between executeWithRetry calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(attemptSequenceArbitrary, { minLength: 2, maxLength: 5 }),
          async (sessionAttempts) => {
            const manager = createRetryManager()
            
            for (const attemptResults of sessionAttempts) {
              let attemptIndex = 0
              const observedAttempts: number[] = []
              
              const attemptFn = async (): Promise<AttemptResult> => {
                const result = attemptResults[attemptIndex % attemptResults.length]
                attemptIndex++
                return result
              }
              
              const onAttempt = (current: number, _max: number) => {
                observedAttempts.push(current)
              }
              
              await manager.executeWithRetry(attemptFn, onAttempt)
              
              // First observed attempt should always be 1
              if (observedAttempts.length > 0 && observedAttempts[0] !== 1) {
                return false
              }
              
              // Attempts should be sequential starting from 1
              for (let i = 0; i < observedAttempts.length; i++) {
                if (observedAttempts[i] !== i + 1) {
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
    
    // ========================================================================
    // Property Tests: Attempt Sequence Correctness
    // ========================================================================
    
    /**
     * Test: Attempts are sequential (1, 2, 3)
     */
    it('should produce sequential attempt numbers', async () => {
      await fc.assert(
        fc.asyncProperty(
          attemptSequenceArbitrary.filter(seq => seq.every(r => !r.success)), // All failures to force max retries
          async (attemptResults) => {
            const manager = createRetryManager()
            let attemptIndex = 0
            const observedAttempts: number[] = []
            
            const attemptFn = async (): Promise<AttemptResult> => {
              const result = attemptResults[attemptIndex % attemptResults.length]
              attemptIndex++
              return result
            }
            
            const onAttempt = (current: number, _max: number) => {
              observedAttempts.push(current)
            }
            
            await manager.executeWithRetry(attemptFn, onAttempt)
            
            // Should have exactly MAX_ATTEMPTS attempts
            if (observedAttempts.length !== MAX_ATTEMPTS) {
              return false
            }
            
            // Attempts should be 1, 2, 3
            for (let i = 0; i < observedAttempts.length; i++) {
              if (observedAttempts[i] !== i + 1) {
                return false
              }
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: Success on any attempt stops retrying
     */
    it('should stop retrying on success', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: MAX_ATTEMPTS }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (successOnAttempt, successValue) => {
            const manager = createRetryManager()
            let attemptIndex = 0
            
            const attemptFn = async (): Promise<AttemptResult> => {
              attemptIndex++
              if (attemptIndex === successOnAttempt) {
                return { success: true, value: successValue }
              }
              return { success: false, reason: 'generation_failed' }
            }
            
            const result = await manager.executeWithRetry(attemptFn)
            
            // Should succeed with correct attempt count
            return (
              result.success === true &&
              result.attempts === successOnAttempt &&
              result.value === successValue
            )
          }
        ),
        { numRuns: 100 }
      )
    })
    
    // ========================================================================
    // Property Tests: Cancellation Handling
    // ========================================================================
    
    /**
     * Test: Cancellation stops retrying immediately
     */
    it('should stop retrying when cancelled', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: MAX_ATTEMPTS }),
          async (cancelOnAttempt) => {
            const manager = createRetryManager()
            let attemptIndex = 0
            
            const attemptFn = async (): Promise<AttemptResult> => {
              attemptIndex++
              if (attemptIndex === cancelOnAttempt) {
                manager.cancel()
              }
              return { success: false, reason: 'generation_failed' }
            }
            
            const result = await manager.executeWithRetry(attemptFn)
            
            // Should fail with cancellation and correct attempt count
            return (
              result.success === false &&
              result.attempts === cancelOnAttempt &&
              result.error === 'Генерация отменена'
            )
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: canRetry returns false when cancelled
     */
    it('should return canRetry=false when cancelled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: MAX_ATTEMPTS - 1 }),
          (attemptsBeforeCancel) => {
            const manager = createRetryManager()
            manager.startSession()
            
            // Do some increments
            for (let i = 0; i < attemptsBeforeCancel; i++) {
              manager.incrementAttempt()
            }
            
            // Should be able to retry before cancel
            const canRetryBefore = manager.canRetry()
            
            // Cancel
            manager.cancel()
            
            // Should not be able to retry after cancel
            const canRetryAfter = manager.canRetry()
            
            manager.endSession()
            
            return canRetryBefore === true && canRetryAfter === false
          }
        ),
        { numRuns: 100 }
      )
    })
    
    // ========================================================================
    // Property Tests: Error Handling
    // ========================================================================
    
    /**
     * Test: All failures result in max attempts exhausted error
     */
    it('should return exhausted error after MAX_ATTEMPTS failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              success: fc.constant(false as const),
              reason: fc.constantFrom(
                'generation_failed' as const,
                'security_violation' as const,
                'evaluation_failed' as const,
                'validation_failed' as const
              )
            }),
            { minLength: MAX_ATTEMPTS, maxLength: MAX_ATTEMPTS + 5 }
          ),
          async (failureResults) => {
            const manager = createRetryManager()
            let attemptIndex = 0
            
            const attemptFn = async (): Promise<AttemptResult> => {
              const result = failureResults[attemptIndex % failureResults.length]
              attemptIndex++
              return result
            }
            
            const result = await manager.executeWithRetry(attemptFn)
            
            // Should fail with max attempts and correct error message
            return (
              result.success === false &&
              result.attempts === MAX_ATTEMPTS &&
              result.error?.includes('3 попыток')
            )
          }
        ),
        { numRuns: 100 }
      )
    })
    
    // ========================================================================
    // Property Tests: State Management
    // ========================================================================
    
    /**
     * Test: Cannot start session while another is active
     */
    it('should throw error when starting session while another is active', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: MAX_ATTEMPTS }),
          (incrementsBeforeSecondStart) => {
            const manager = createRetryManager()
            manager.startSession()
            
            // Do some increments
            for (let i = 0; i < incrementsBeforeSecondStart; i++) {
              try {
                manager.incrementAttempt()
              } catch {
                break
              }
            }
            
            // Try to start another session
            let threwError = false
            try {
              manager.startSession()
            } catch {
              threwError = true
            }
            
            manager.endSession()
            
            return threwError === true
          }
        ),
        { numRuns: 100 }
      )
    })
    
    /**
     * Test: Cannot increment without active session
     */
    it('should throw error when incrementing without active session', () => {
      const manager = createRetryManager()
      
      let threwError = false
      try {
        manager.incrementAttempt()
      } catch {
        threwError = true
      }
      
      expect(threwError).toBe(true)
    })
    
    /**
     * Test: Session state is correctly tracked
     */
    it('should correctly track session state', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (shouldEnd) => {
            const manager = createRetryManager()
            
            // Initially not active
            if (manager.isSessionActive()) return false
            
            manager.startSession()
            
            // Should be active after start
            if (!manager.isSessionActive()) return false
            
            if (shouldEnd) {
              manager.endSession()
              // Should not be active after end
              if (manager.isSessionActive()) return false
            } else {
              manager.endSession()
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
    
    // ========================================================================
    // Property Tests: MAX_ATTEMPTS Constant
    // ========================================================================
    
    /**
     * Test: MAX_ATTEMPTS is exactly 3
     */
    it('should have MAX_ATTEMPTS equal to 3', () => {
      expect(MAX_ATTEMPTS).toBe(3)
    })
    
    /**
     * Test: getMaxAttempts returns MAX_ATTEMPTS
     */
    it('should return MAX_ATTEMPTS from getMaxAttempts', () => {
      const manager = createRetryManager()
      expect(manager.getMaxAttempts()).toBe(MAX_ATTEMPTS)
      expect(manager.getMaxAttempts()).toBe(3)
    })
  })
})
