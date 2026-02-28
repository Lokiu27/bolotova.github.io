/**
 * Retry Manager - Manages retry logic for LLM generation
 * 
 * Provides a testable abstraction for retry logic:
 * - Tracks attempt count per generation session
 * - Enforces maximum attempts limit (3)
 * - Resets counter for new generation requests
 * 
 * Validates: Requirements 10.2, 10.5
 */

import { DEFAULT_LLM_CONFIG } from './llm-engine'

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum number of generation attempts
 * Validates: Requirement 10.2
 */
export const MAX_ATTEMPTS = DEFAULT_LLM_CONFIG.maxAttempts // 3

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a single generation attempt
 */
export type AttemptResult = 
  | { success: true; value: string }
  | { success: false; reason: 'generation_failed' | 'security_violation' | 'evaluation_failed' | 'validation_failed' | 'cancelled' }

/**
 * Final result of the retry session
 */
export interface RetrySessionResult {
  success: boolean
  value?: string
  attempts: number
  error?: string
}

/**
 * Callback for attempt notifications
 */
export type AttemptCallback = (current: number, max: number) => void

/**
 * Async function that performs a single generation attempt
 */
export type AttemptFunction = () => Promise<AttemptResult>

// ============================================================================
// Retry Manager Class
// ============================================================================

/**
 * Manages retry logic for generation sessions
 * 
 * Key invariants:
 * - Attempt count never exceeds MAX_ATTEMPTS (3)
 * - Counter resets to 0 when starting a new session
 * 
 * Validates: Requirements 10.2, 10.5
 */
export class RetryManager {
  private currentAttempt: number = 0
  private isActive: boolean = false
  private isCancelled: boolean = false
  
  /**
   * Get current attempt number (1-indexed for display)
   */
  getCurrentAttempt(): number {
    return this.currentAttempt
  }
  
  /**
   * Get maximum allowed attempts
   */
  getMaxAttempts(): number {
    return MAX_ATTEMPTS
  }
  
  /**
   * Check if a session is currently active
   */
  isSessionActive(): boolean {
    return this.isActive
  }
  
  /**
   * Check if the current session has been cancelled
   */
  isSessionCancelled(): boolean {
    return this.isCancelled
  }
  
  /**
   * Cancel the current session
   */
  cancel(): void {
    this.isCancelled = true
  }
  
  /**
   * Start a new retry session
   * 
   * Resets the attempt counter to 0 (will be incremented to 1 on first attempt).
   * 
   * Validates: Requirement 10.5
   * 
   * @throws Error if a session is already active
   */
  startSession(): void {
    if (this.isActive) {
      throw new Error('A session is already active')
    }
    
    // Reset counter for new request
    // Validates: Requirement 10.5
    this.currentAttempt = 0
    this.isActive = true
    this.isCancelled = false
  }
  
  /**
   * End the current session
   */
  endSession(): void {
    this.isActive = false
  }
  
  /**
   * Check if more attempts are allowed
   * 
   * Validates: Requirement 10.2
   */
  canRetry(): boolean {
    return this.currentAttempt < MAX_ATTEMPTS && !this.isCancelled
  }
  
  /**
   * Increment attempt counter
   * 
   * @returns Current attempt number (1-indexed)
   * @throws Error if max attempts exceeded or session not active
   * 
   * Validates: Requirement 10.2
   */
  incrementAttempt(): number {
    if (!this.isActive) {
      throw new Error('No active session')
    }
    
    if (this.currentAttempt >= MAX_ATTEMPTS) {
      throw new Error(`Maximum attempts (${MAX_ATTEMPTS}) exceeded`)
    }
    
    this.currentAttempt++
    return this.currentAttempt
  }
  
  /**
   * Execute a retry session with the given attempt function
   * 
   * This is the main entry point for running a generation with retries.
   * 
   * @param attemptFn - Async function that performs a single attempt
   * @param onAttempt - Optional callback for attempt notifications
   * @returns Final result of the session
   * 
   * Validates: Requirements 10.2, 10.5
   */
  async executeWithRetry(
    attemptFn: AttemptFunction,
    onAttempt?: AttemptCallback
  ): Promise<RetrySessionResult> {
    this.startSession()
    
    try {
      while (this.canRetry()) {
        const attemptNumber = this.incrementAttempt()
        
        // Notify about current attempt
        if (onAttempt) {
          onAttempt(attemptNumber, MAX_ATTEMPTS)
        }
        
        // Check for cancellation
        if (this.isCancelled) {
          return {
            success: false,
            attempts: attemptNumber,
            error: 'Генерация отменена'
          }
        }
        
        // Execute attempt
        const result = await attemptFn()
        
        // Check for cancellation after attempt
        if (this.isCancelled) {
          return {
            success: false,
            attempts: attemptNumber,
            error: 'Генерация отменена'
          }
        }
        
        if (result.success) {
          return {
            success: true,
            value: result.value,
            attempts: attemptNumber
          }
        }
        
        // If cancelled during attempt, return immediately
        if (result.reason === 'cancelled') {
          return {
            success: false,
            attempts: attemptNumber,
            error: 'Генерация отменена'
          }
        }
        
        // Continue to next attempt if not at max
      }
      
      // All attempts exhausted
      // Validates: Requirement 10.4
      return {
        success: false,
        attempts: this.currentAttempt,
        error: 'Не удалось сгенерировать корректную схему после 3 попыток. Попробуйте изменить или уточнить описание.'
      }
      
    } finally {
      this.endSession()
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new RetryManager instance
 */
export function createRetryManager(): RetryManager {
  return new RetryManager()
}
