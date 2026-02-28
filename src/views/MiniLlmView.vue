<script setup lang="ts">
/**
 * MiniLlmView - Страница "Мини LLM в браузере"
 * 
 * Main page for JSON Schema generation using Phi-3-mini model in browser.
 * Features:
 * - Integration of all mini-llm components
 * - Breadcrumbs navigation
 * - Cyberpunk glassmorphism styling
 * - State coordination between components
 * - Error display and handling
 * 
 * Validates: Requirements 1.2-1.3, 3.4, 6.2, 10.4, 11.4, 13.3
 */
import { ref, computed, onMounted } from 'vue'
import CyberBreadcrumbs from '../components/CyberBreadcrumbs.vue'
import SchemaInputField from '../components/SchemaInputField.vue'
import LlmLoadingIndicator from '../components/LlmLoadingIndicator.vue'
import SchemaResultDisplay from '../components/SchemaResultDisplay.vue'
import GlassCard from '../components/GlassCard.vue'
import { useLlmWorker } from '../composables/useLlmWorker'
import { useRateLimiter } from '../composables/useRateLimiter'
import { useInputSanitizer } from '../composables/useInputSanitizer'

// Composables
const {
  isReady,
  isLoading,
  progress,
  progressMessage,
  currentAttempt,
  maxAttempts,
  error: workerError,
  generateSchema,
  cancelGeneration,
  checkMemory
} = useLlmWorker()

const {
  canRequest,
  remainingCooldownSeconds,
  isLimited,
  recordRequest
} = useRateLimiter()

const { sanitize } = useInputSanitizer()

// Local state
const userInput = ref('')
const generatedSchema = ref<string | null>(null)
const localError = ref<string | null>(null)
const memoryWarning = ref<string | null>(null)
const showCancelButton = ref(false)

/**
 * Breadcrumb items for navigation
 * Validates: Requirement 1.3
 */
const breadcrumbItems = [
  { label: 'Главная', path: '/' },
  { label: 'Проекты', path: '/projects' },
  { label: 'Мини LLM' }
]

/**
 * Combined error message from worker or local errors
 */
const errorMessage = computed(() => {
  return localError.value || workerError.value
})

/**
 * Whether the generate button should be disabled
 * Validates: Requirement 13.4
 */
const isGenerateDisabled = computed(() => {
  return (
    !userInput.value.trim() ||
    isLoading.value ||
    !canRequest.value ||
    !isReady.value
  )
})

/**
 * Generate button text based on state
 */
const generateButtonText = computed(() => {
  if (isLoading.value) {
    return 'Генерация...'
  }
  if (isLimited.value) {
    return `Подождите ${remainingCooldownSeconds.value}с`
  }
  return 'Сгенерировать'
})

/**
 * Handle form submission
 * Validates: Requirements 4.1, 6.2, 13.1
 */
const handleSubmit = async () => {
  if (isGenerateDisabled.value) return
  
  // Clear previous state
  localError.value = null
  generatedSchema.value = null
  showCancelButton.value = false
  
  // Sanitize input
  const sanitizedInput = sanitize(userInput.value)
  
  if (!sanitizedInput.trim()) {
    localError.value = 'Пожалуйста, введите описание объекта'
    return
  }
  
  // Record request for rate limiting
  recordRequest()
  
  // Show cancel button after delay
  setTimeout(() => {
    if (isLoading.value) {
      showCancelButton.value = true
    }
  }, 5000)
  
  try {
    const result = await generateSchema(sanitizedInput)
    
    if (result.success && result.schema) {
      generatedSchema.value = result.schema
      localError.value = null
    } else if (result.error) {
      localError.value = result.error
    }
  } catch (err) {
    localError.value = err instanceof Error ? err.message : 'Произошла неизвестная ошибка'
  } finally {
    showCancelButton.value = false
  }
}

/**
 * Handle generation cancellation
 * Validates: Requirements 6.3, 6.4
 */
const handleCancel = () => {
  cancelGeneration()
  showCancelButton.value = false
  localError.value = 'Генерация отменена'
}

/**
 * Handle copy event from result display
 */
const handleCopy = () => {
  // Could add analytics or notification here
}

/**
 * Check memory on mount
 * Validates: Requirement 13.5
 */
onMounted(async () => {
  try {
    const memoryStatus = await checkMemory()
    if (memoryStatus.warning) {
      memoryWarning.value = memoryStatus.warning
    }
  } catch {
    // Memory check failed, but not critical
  }
})
</script>

<template>
  <div class="mini-llm-view">
    <!-- Background decoration -->
    <div class="cyber-grid-bg" aria-hidden="true"></div>
    
    <!-- Main content -->
    <div class="content-container">
      <!-- Breadcrumbs navigation -->
      <CyberBreadcrumbs 
        :items="breadcrumbItems" 
        class="breadcrumbs"
      />
      
      <!-- Page header -->
      <header class="page-header">
        <h1 class="page-title">Мини LLM в браузере</h1>
        <p class="page-description">
          Генерация JSON Schema с использованием языковой модели Phi-3-mini, 
          работающей полностью в вашем браузере
        </p>
      </header>
      
      <!-- Memory warning -->
      <Transition name="fade">
        <div 
          v-if="memoryWarning" 
          class="memory-warning"
          role="alert"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
            aria-hidden="true"
          >
            <path 
              d="M8 1L15 14H1L8 1Z" 
              stroke="currentColor" 
              stroke-width="1.5"
            />
            <path 
              d="M8 6V9M8 11V12" 
              stroke="currentColor" 
              stroke-width="1.5" 
              stroke-linecap="round"
            />
          </svg>
          <span>{{ memoryWarning }}</span>
          <button 
            type="button"
            class="warning-close"
            aria-label="Закрыть предупреждение"
            @click="memoryWarning = null"
          >
            ×
          </button>
        </div>
      </Transition>
      
      <!-- Main form card -->
      <GlassCard class="main-card" :blur="12" :opacity="0.15">
        <!-- Input section -->
        <section class="input-section">
          <SchemaInputField
            v-model="userInput"
            :disabled="isLoading"
            input-id="schema-description"
            @submit="handleSubmit"
          />
          
          <!-- Generate button -->
          <button
            type="button"
            class="generate-button"
            :class="{ 'is-loading': isLoading, 'is-limited': isLimited }"
            :disabled="isGenerateDisabled"
            @click="handleSubmit"
          >
            <span class="button-text">{{ generateButtonText }}</span>
          </button>
        </section>
        
        <!-- Loading indicator -->
        <Transition name="slide-fade">
          <LlmLoadingIndicator
            v-if="isLoading"
            :is-loading="isLoading"
            :progress="progress"
            :message="progressMessage"
            :current-attempt="currentAttempt"
            :max-attempts="maxAttempts"
            :show-cancel="showCancelButton"
            class="loading-section"
            @cancel="handleCancel"
          />
        </Transition>
        
        <!-- Error display -->
        <Transition name="fade">
          <div 
            v-if="errorMessage && !isLoading" 
            class="error-message"
            role="alert"
            aria-live="assertive"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 4V9M8 11V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </Transition>
        
        <!-- Result section -->
        <section class="result-section">
          <SchemaResultDisplay
            :schema="generatedSchema"
            :is-loading="isLoading"
            @copy="handleCopy"
          />
        </section>
      </GlassCard>
      
      <!-- Info section -->
      <aside class="info-section">
        <GlassCard :blur="8" :opacity="0.1" :glow-on-hover="false">
          <h3 class="info-title">Как это работает</h3>
          <ul class="info-list">
            <li>
              <span class="info-icon" aria-hidden="true">1</span>
              <span>Опишите объект или вставьте данные из буфера обмена</span>
            </li>
            <li>
              <span class="info-icon" aria-hidden="true">2</span>
              <span>Модель Phi-3-mini загружается и работает в вашем браузере</span>
            </li>
            <li>
              <span class="info-icon" aria-hidden="true">3</span>
              <span>LLM генерирует JSON Schema и проверяет её качество</span>
            </li>
            <li>
              <span class="info-icon" aria-hidden="true">4</span>
              <span>Скопируйте готовую схему для использования в проекте</span>
            </li>
          </ul>
          <p class="info-note">
            Все данные обрабатываются локально — ничего не отправляется на сервер.
          </p>
        </GlassCard>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.mini-llm-view {
  min-height: 100vh;
  padding: 2rem;
  position: relative;
  overflow-x: hidden;
}

/* Cyber grid background */
.cyber-grid-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(var(--border-dim) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-dim) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.3;
  pointer-events: none;
  z-index: -1;
}

/* Content container */
.content-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Breadcrumbs */
.breadcrumbs {
  margin-bottom: 8px;
}

/* Page header */
.page-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-bright, rgba(0, 240, 255, 0.3));
  position: relative;
}

.page-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100px;
  height: 2px;
  background: var(--accent-cyan, #00f0ff);
  box-shadow: 0 0 10px var(--accent-cyan-glow, rgba(0, 240, 255, 0.5));
}

.page-title {
  font-family: var(--font-mono, monospace);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--accent-cyan, #00f0ff);
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 20px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
}

.page-description {
  font-size: var(--font-size-lg, 16px);
  line-height: 1.8;
  color: var(--text-secondary, #858b99);
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  margin: 0;
}

/* Memory warning */
.memory-warning {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  
  background: rgba(240, 160, 0, 0.1);
  border: 1px solid rgba(240, 160, 0, 0.3);
  border-radius: var(--radius-md);
  
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: #f0a000;
}

.memory-warning svg {
  flex-shrink: 0;
}

.warning-close {
  margin-left: auto;
  padding: 4px 8px;
  
  font-size: var(--font-size-lg);
  color: #f0a000;
  
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  
  transition: all var(--transition-fast);
}

.warning-close:hover {
  background: rgba(240, 160, 0, 0.2);
}

/* Main card */
.main-card {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Input section */
.input-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Generate button */
.generate-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  padding: 14px 24px;
  
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--bg-void);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  
  background: var(--accent-cyan, #00f0ff);
  border: none;
  border-radius: var(--radius-md);
  
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.generate-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.generate-button:hover:not(:disabled)::before {
  left: 100%;
}

.generate-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 20px var(--accent-cyan-glow, rgba(0, 240, 255, 0.5));
}

.generate-button:focus-visible {
  outline: 2px solid var(--accent-cyan);
  outline-offset: 4px;
}

.generate-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--border-bright);
  color: var(--text-tertiary);
}

.generate-button.is-loading {
  background: var(--border-bright);
}

.generate-button.is-limited {
  background: var(--border-dim);
}

/* Loading section */
.loading-section {
  margin-top: 8px;
}

/* Error message */
.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: var(--radius-md);
  
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: #ff4444;
}

.error-message svg {
  flex-shrink: 0;
}

/* Result section */
.result-section {
  margin-top: 8px;
}

/* Info section */
.info-section {
  margin-top: 1rem;
}

.info-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--accent-cyan, #00f0ff);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 16px 0;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.info-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--accent-cyan);
  
  background: var(--accent-cyan-dim);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 50%;
}

.info-note {
  margin: 16px 0 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--border-dim);
  
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-style: italic;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all var(--transition-normal);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .generate-button::before {
    display: none;
  }
  
  .generate-button:hover:not(:disabled) {
    transform: none;
  }
}

/* Responsive styles */
@media (max-width: 767px) {
  .mini-llm-view {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .page-description {
    font-size: var(--font-size-sm);
  }
  
  .generate-button {
    padding: 12px 20px;
    font-size: var(--font-size-sm);
  }
  
  .cyber-grid-bg {
    background-size: 30px 30px;
  }
}
</style>
