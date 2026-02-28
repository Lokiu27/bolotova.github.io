/**
 * useLlmWorker Composable
 * 
 * Manages Web Worker for LLM inference with reactive state.
 * Provides methods for schema generation, cancellation, and memory checking.
 * 
 * Features:
 * - Web Worker management for non-blocking inference
 * - Reactive state: isReady, isLoading, progress, error
 * - Methods: generateSchema, cancelGeneration, checkMemory
 * - Automatic cleanup on component unmount
 * 
 * Validates: Requirements 3.2, 3.4, 6.1-6.4
 */

import { ref, shallowRef, onUnmounted, type Ref, type ShallowRef } from 'vue'
import type { 
  WorkerInMessage, 
  WorkerOutMessage, 
  GenerationResult 
} from '../workers/llm-worker'

/**
 * Memory status from worker
 */
export interface MemoryStatus {
  available: boolean
  estimatedFreeMemory: number
  warning?: string
}

/**
 * Return type for useLlmWorker composable
 */
export interface UseLlmWorkerReturn {
  /** Whether the worker is ready to accept requests */
  isReady: Ref<boolean>
  /** Whether generation is in progress */
  isLoading: Ref<boolean>
  /** Loading/generation progress (0-100) */
  progress: Ref<number>
  /** Current progress message */
  progressMessage: Ref<string>
  /** Current attempt number (1-3) */
  currentAttempt: Ref<number>
  /** Maximum attempts allowed */
  maxAttempts: Ref<number>
  /** Error message if any */
  error: Ref<string | null>
  /** Worker instance reference */
  worker: ShallowRef<Worker | null>
  
  /** Generate JSON Schema from user input */
  generateSchema: (input: string) => Promise<GenerationResult>
  /** Cancel ongoing generation */
  cancelGeneration: () => void
  /** Check browser memory status */
  checkMemory: () => Promise<MemoryStatus>
  /** Terminate worker and cleanup */
  terminate: () => void
}

/**
 * Default generation result for errors
 */
const DEFAULT_ERROR_RESULT: GenerationResult = {
  success: false,
  error: 'Неизвестная ошибка',
  attempts: 0
}

/**
 * Composable for managing LLM Web Worker
 * 
 * @returns Worker management utilities and reactive state
 * 
 * Validates: Requirements 3.2, 3.4, 6.1-6.4
 */
export function useLlmWorker(): UseLlmWorkerReturn {
  // Reactive state
  const isReady = ref(false)
  const isLoading = ref(false)
  const progress = ref(0)
  const progressMessage = ref('')
  const currentAttempt = ref(0)
  const maxAttempts = ref(3)
  const error = ref<string | null>(null)
  
  // Worker instance (shallowRef to avoid deep reactivity)
  const worker = shallowRef<Worker | null>(null)
  
  // Promise resolvers for async operations
  let generateResolver: ((result: GenerationResult) => void) | null = null
  let memoryResolver: ((status: MemoryStatus) => void) | null = null

  /**
   * Initialize the Web Worker
   * Creates worker instance and sets up message handlers
   * 
   * Validates: Requirement 6.1
   */
  const initWorker = (): void => {
    if (worker.value) return
    
    try {
      // Create worker from llm-worker module
      worker.value = new Worker(
        new URL('../workers/llm-worker.ts', import.meta.url),
        { type: 'module' }
      )
      
      // Set up message handler
      worker.value.onmessage = handleWorkerMessage
      
      // Set up error handler
      worker.value.onerror = handleWorkerError
      
      isReady.value = true
      error.value = null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось создать Web Worker'
      error.value = errorMessage
      isReady.value = false
    }
  }
  
  /**
   * Handle messages from the worker
   * Routes messages to appropriate handlers
   * 
   * @param event - MessageEvent from worker
   */
  const handleWorkerMessage = (event: MessageEvent<WorkerOutMessage>): void => {
    const message = event.data
    
    switch (message.type) {
      case 'progress':
        handleProgress(message.payload)
        break
        
      case 'attempt':
        handleAttempt(message.payload)
        break
        
      case 'result':
        handleResult(message.payload)
        break
        
      case 'memory':
        handleMemory(message.payload)
        break
        
      case 'error':
        handleError(message.payload)
        break
    }
  }
  
  /**
   * Handle worker errors
   * 
   * @param event - ErrorEvent from worker
   */
  const handleWorkerError = (event: ErrorEvent): void => {
    const errorMessage = event.message || 'Ошибка Web Worker'
    error.value = errorMessage
    isLoading.value = false
    
    // Reject pending promises
    if (generateResolver) {
      generateResolver({ ...DEFAULT_ERROR_RESULT, error: errorMessage })
      generateResolver = null
    }
    
    if (memoryResolver) {
      memoryResolver({
        available: false,
        estimatedFreeMemory: -1,
        warning: errorMessage
      })
      memoryResolver = null
    }
  }
  
  /**
   * Handle progress updates from worker
   * Updates reactive progress state
   * 
   * @param payload - Progress data
   * 
   * Validates: Requirement 3.2
   */
  const handleProgress = (payload: { percent: number; message: string }): void => {
    progress.value = payload.percent
    progressMessage.value = payload.message
  }
  
  /**
   * Handle attempt updates from worker
   * Updates current attempt counter
   * 
   * @param payload - Attempt data
   * 
   * Validates: Requirement 10.3
   */
  const handleAttempt = (payload: { current: number; max: number }): void => {
    currentAttempt.value = payload.current
    maxAttempts.value = payload.max
  }
  
  /**
   * Handle generation result from worker
   * Resolves pending promise and updates state
   * 
   * @param payload - Generation result
   */
  const handleResult = (payload: GenerationResult): void => {
    isLoading.value = false
    
    if (!payload.success && payload.error) {
      error.value = payload.error
    } else {
      error.value = null
    }
    
    if (generateResolver) {
      generateResolver(payload)
      generateResolver = null
    }
  }
  
  /**
   * Handle memory status from worker
   * Resolves pending memory check promise
   * 
   * @param payload - Memory status
   * 
   * Validates: Requirement 13.5
   */
  const handleMemory = (payload: MemoryStatus): void => {
    if (memoryResolver) {
      memoryResolver(payload)
      memoryResolver = null
    }
  }
  
  /**
   * Handle error messages from worker
   * Updates error state and rejects pending promises
   * 
   * @param payload - Error data
   * 
   * Validates: Requirement 3.4
   */
  const handleError = (payload: { message: string }): void => {
    error.value = payload.message
    isLoading.value = false
    
    if (generateResolver) {
      generateResolver({ ...DEFAULT_ERROR_RESULT, error: payload.message })
      generateResolver = null
    }
  }

  /**
   * Send a message to the worker
   * 
   * @param message - Message to send
   */
  const postMessage = (message: WorkerInMessage): void => {
    if (!worker.value) {
      initWorker()
    }
    
    if (worker.value) {
      worker.value.postMessage(message)
    }
  }
  
  /**
   * Generate JSON Schema from user input
   * 
   * Sends generation request to worker and returns promise
   * that resolves when generation completes.
   * 
   * @param input - User's description of the object
   * @returns Promise resolving to generation result
   * 
   * Validates: Requirements 6.1, 6.2
   */
  const generateSchema = (input: string): Promise<GenerationResult> => {
    return new Promise((resolve) => {
      // Initialize worker if needed
      if (!worker.value) {
        initWorker()
      }
      
      if (!worker.value) {
        resolve({
          success: false,
          error: 'Web Worker недоступен',
          attempts: 0
        })
        return
      }
      
      // Reset state
      isLoading.value = true
      progress.value = 0
      progressMessage.value = 'Инициализация...'
      currentAttempt.value = 0
      error.value = null
      
      // Store resolver for later
      generateResolver = resolve
      
      // Send generation request
      postMessage({ type: 'generate', payload: { input } })
    })
  }
  
  /**
   * Cancel ongoing generation
   * 
   * Sends cancel request to worker to abort current generation.
   * 
   * Validates: Requirements 6.3, 6.4
   */
  const cancelGeneration = (): void => {
    if (!worker.value) return
    
    postMessage({ type: 'cancel' })
    
    // Update state immediately for responsive UI
    progressMessage.value = 'Отмена генерации...'
  }
  
  /**
   * Check browser memory status
   * 
   * Sends memory check request to worker and returns promise
   * that resolves with memory status.
   * 
   * @returns Promise resolving to memory status
   * 
   * Validates: Requirement 13.5
   */
  const checkMemory = (): Promise<MemoryStatus> => {
    return new Promise((resolve) => {
      // Initialize worker if needed
      if (!worker.value) {
        initWorker()
      }
      
      if (!worker.value) {
        resolve({
          available: false,
          estimatedFreeMemory: -1,
          warning: 'Web Worker недоступен'
        })
        return
      }
      
      // Store resolver for later
      memoryResolver = resolve
      
      // Send memory check request
      postMessage({ type: 'checkMemory' })
    })
  }
  
  /**
   * Terminate worker and cleanup
   * 
   * Terminates the worker and resets all state.
   * Called automatically on component unmount.
   */
  const terminate = (): void => {
    if (worker.value) {
      worker.value.terminate()
      worker.value = null
    }
    
    isReady.value = false
    isLoading.value = false
    progress.value = 0
    progressMessage.value = ''
    currentAttempt.value = 0
    error.value = null
    
    // Clear pending resolvers
    if (generateResolver) {
      generateResolver({
        success: false,
        error: 'Worker terminated',
        attempts: 0
      })
      generateResolver = null
    }
    
    if (memoryResolver) {
      memoryResolver({
        available: false,
        estimatedFreeMemory: -1,
        warning: 'Worker terminated'
      })
      memoryResolver = null
    }
  }
  
  // Initialize worker on composable creation
  initWorker()
  
  // Cleanup on component unmount
  onUnmounted(() => {
    terminate()
  })
  
  return {
    // Reactive state
    isReady,
    isLoading,
    progress,
    progressMessage,
    currentAttempt,
    maxAttempts,
    error,
    worker,
    
    // Methods
    generateSchema,
    cancelGeneration,
    checkMemory,
    terminate
  }
}

/**
 * Default export for convenience
 */
export default useLlmWorker
