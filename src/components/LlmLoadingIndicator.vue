<script setup lang="ts">
/**
 * LlmLoadingIndicator Component
 * 
 * Displays loading progress for LLM model loading and generation.
 * Features:
 * - Progress bar with percentage
 * - Current attempt number display
 * - Cancel button (appears after 5 seconds)
 * - ARIA live region for screen readers
 * 
 * Validates: Requirements 3.2, 4.2, 6.3, 8.2, 10.3
 */
import { ref, computed, watch, onUnmounted } from 'vue'

/**
 * Props for LlmLoadingIndicator component
 */
interface LlmLoadingIndicatorProps {
  /** Whether loading is in progress */
  isLoading: boolean
  /** Loading progress (0-100) */
  progress: number
  /** Current progress message */
  message: string
  /** Current attempt number (1-3) */
  currentAttempt: number
  /** Maximum attempts allowed */
  maxAttempts: number
  /** Whether to show cancel button */
  showCancel?: boolean
  /** Delay before showing cancel button (ms) */
  cancelDelay?: number
}

const props = withDefaults(defineProps<LlmLoadingIndicatorProps>(), {
  showCancel: true,
  cancelDelay: 5000
})

/**
 * Emits for LlmLoadingIndicator component
 */
const emit = defineEmits<{
  /** Cancel generation */
  'cancel': []
}>()

// Local state
const canShowCancel = ref(false)
let cancelTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Progress bar width style
 */
const progressStyle = computed(() => ({
  width: `${Math.min(100, Math.max(0, props.progress))}%`
}))

/**
 * Progress text for screen readers
 */
const progressText = computed(() => {
  if (props.progress < 100) {
    return `${Math.round(props.progress)}% завершено`
  }
  return 'Завершено'
})

/**
 * Attempt text display
 */
const attemptText = computed(() => {
  if (props.currentAttempt > 0 && props.maxAttempts > 1) {
    return `Попытка ${props.currentAttempt} из ${props.maxAttempts}`
  }
  return ''
})

/**
 * Handle cancel button click
 */
const handleCancel = () => {
  emit('cancel')
}

/**
 * Start cancel button timer
 */
const startCancelTimer = () => {
  if (cancelTimer) {
    clearTimeout(cancelTimer)
  }
  
  canShowCancel.value = false
  
  if (props.showCancel && props.cancelDelay > 0) {
    cancelTimer = setTimeout(() => {
      canShowCancel.value = true
    }, props.cancelDelay)
  } else if (props.showCancel && props.cancelDelay === 0) {
    canShowCancel.value = true
  }
}

/**
 * Clear cancel button timer
 */
const clearCancelTimer = () => {
  if (cancelTimer) {
    clearTimeout(cancelTimer)
    cancelTimer = null
  }
  canShowCancel.value = false
}

// Watch loading state to manage cancel timer
watch(() => props.isLoading, (isLoading) => {
  if (isLoading) {
    startCancelTimer()
  } else {
    clearCancelTimer()
  }
}, { immediate: true })

// Cleanup on unmount
onUnmounted(() => {
  clearCancelTimer()
})
</script>

<template>
  <div 
    v-if="isLoading"
    class="llm-loading-indicator"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <!-- Progress section -->
    <div class="progress-section">
      <!-- Progress bar -->
      <div 
        class="progress-bar-container"
        role="progressbar"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuetext="progressText"
      >
        <div 
          class="progress-bar-fill"
          :style="progressStyle"
        >
          <div class="progress-bar-glow"></div>
        </div>
      </div>
      
      <!-- Progress percentage -->
      <span class="progress-percent" aria-hidden="true">
        {{ Math.round(progress) }}%
      </span>
    </div>
    
    <!-- Message and attempt info -->
    <div class="info-section">
      <!-- Loading message -->
      <p class="loading-message">
        {{ message }}
      </p>
      
      <!-- Attempt counter -->
      <span 
        v-if="attemptText"
        class="attempt-counter"
        aria-live="polite"
      >
        {{ attemptText }}
      </span>
    </div>
    
    <!-- Cancel button -->
    <Transition name="fade-slide">
      <button
        v-if="canShowCancel"
        type="button"
        class="cancel-button"
        @click="handleCancel"
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
          aria-hidden="true"
        >
          <path 
            d="M12 4L4 12M4 4L12 12" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round"
          />
        </svg>
        <span>Отменить</span>
      </button>
    </Transition>
    
    <!-- Screen reader announcement -->
    <span class="sr-only" aria-live="assertive">
      {{ message }}. {{ progressText }}. {{ attemptText }}
    </span>
  </div>
</template>

<style scoped>
.llm-loading-indicator {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  
  background: rgba(14, 17, 22, 0.8);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  
  backdrop-filter: blur(var(--glass-blur));
}

/* Progress section */
.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar-container {
  flex: 1;
  height: 8px;
  
  background: rgba(35, 39, 48, 0.8);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-cyan), #00d4ff);
  border-radius: 4px;
  
  position: relative;
  transition: width 0.3s ease-out;
}

.progress-bar-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 50px;
  height: 100%;
  
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-percent {
  min-width: 48px;
  
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--accent-cyan);
  text-align: right;
}

/* Info section */
.info-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.loading-message {
  margin: 0;
  
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.attempt-counter {
  flex-shrink: 0;
  padding: 4px 8px;
  
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: var(--radius-sm);
}

/* Cancel button */
.cancel-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  padding: 10px 16px;
  
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  background: transparent;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  
  transition: all var(--transition-fast);
}

.cancel-button:hover {
  color: #ff4444;
  border-color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
}

.cancel-button:focus-visible {
  outline: 2px solid var(--accent-cyan);
  outline-offset: 2px;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all var(--transition-normal);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .progress-bar-glow {
    animation: none;
  }
  
  .progress-bar-fill {
    transition: none;
  }
}

/* Responsive styles */
@media (max-width: 767px) {
  .llm-loading-indicator {
    padding: 16px;
    gap: 12px;
  }
  
  .info-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .cancel-button {
    width: 100%;
  }
}
</style>
