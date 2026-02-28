<script setup lang="ts">
/**
 * SchemaInputField Component
 * 
 * Text input field for entering object descriptions to generate JSON Schema.
 * Features:
 * - v-model support for two-way binding
 * - Clipboard paste handling with sanitization
 * - Character limit warning (2000 chars)
 * - ARIA attributes for accessibility
 * - Keyboard navigation support
 * 
 * Validates: Requirements 2.1-2.5, 8.1, 8.3, 15.1-15.4
 */
import { ref, computed, watch } from 'vue'
import { useInputSanitizer } from '../composables/useInputSanitizer'

/**
 * Props for SchemaInputField component
 */
interface SchemaInputFieldProps {
  /** Current input value (v-model) */
  modelValue: string
  /** Maximum allowed characters (default: 2000) */
  maxLength?: number
  /** Whether the input is disabled */
  disabled?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Unique ID for the input (for label association) */
  inputId?: string
}

const props = withDefaults(defineProps<SchemaInputFieldProps>(), {
  maxLength: 2000,
  disabled: false,
  placeholder: 'Опишите объект, для которого нужно сгенерировать JSON Schema...',
  inputId: 'schema-input'
})

/**
 * Emits for SchemaInputField component
 */
const emit = defineEmits<{
  /** Update model value */
  'update:modelValue': [value: string]
  /** Submit input (Enter key or button) */
  'submit': []
}>()

// Composables
const { sanitize, sanitizeClipboard, validateLength } = useInputSanitizer()

// Local state
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isFocused = ref(false)
const showLimitWarning = ref(false)
const wasTruncated = ref(false)

/**
 * Current character count
 */
const charCount = computed(() => props.modelValue.length)

/**
 * Whether character limit is approaching (>80%)
 */
const isApproachingLimit = computed(() => {
  return charCount.value > props.maxLength * 0.8
})

/**
 * Whether character limit is exceeded
 */
const isOverLimit = computed(() => {
  return charCount.value >= props.maxLength
})

/**
 * Character count display text
 */
const charCountText = computed(() => {
  return `${charCount.value} / ${props.maxLength}`
})

/**
 * Handle input changes with sanitization
 * @param event - Input event
 * 
 * Validates: Requirements 2.3-2.5
 */
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  const rawValue = target.value
  
  // Validate and sanitize
  const result = validateLength(rawValue, props.maxLength)
  
  // Track if truncation occurred
  if (result.truncated) {
    wasTruncated.value = true
    showLimitWarning.value = true
    
    // Auto-hide warning after 3 seconds
    setTimeout(() => {
      showLimitWarning.value = false
    }, 3000)
  }
  
  emit('update:modelValue', result.sanitizedValue)
}

/**
 * Handle paste events with clipboard sanitization
 * @param event - ClipboardEvent
 * 
 * Validates: Requirements 15.1-15.4
 */
const handlePaste = (event: ClipboardEvent) => {
  // Prevent default paste behavior
  event.preventDefault()
  
  // Get sanitized clipboard content
  const pastedText = sanitizeClipboard(event)
  
  if (!pastedText) return
  
  // Get current selection
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const currentValue = props.modelValue
  
  // Insert pasted text at cursor position
  const newValue = currentValue.slice(0, start) + pastedText + currentValue.slice(end)
  
  // Validate and emit
  const result = validateLength(newValue, props.maxLength)
  
  if (result.truncated) {
    wasTruncated.value = true
    showLimitWarning.value = true
    setTimeout(() => {
      showLimitWarning.value = false
    }, 3000)
  }
  
  emit('update:modelValue', result.sanitizedValue)
  
  // Restore cursor position after paste
  requestAnimationFrame(() => {
    if (textarea) {
      const newCursorPos = Math.min(start + pastedText.length, result.sanitizedValue.length)
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }
  })
}

/**
 * Handle keyboard events for accessibility
 * @param event - KeyboardEvent
 * 
 * Validates: Requirement 8.1
 */
const handleKeydown = (event: KeyboardEvent) => {
  // Submit on Ctrl+Enter or Cmd+Enter
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    if (!props.disabled) {
      emit('submit')
    }
  }
}

/**
 * Handle focus events
 */
const handleFocus = () => {
  isFocused.value = true
}

const handleBlur = () => {
  isFocused.value = false
}

/**
 * Clear input
 */
const clearInput = () => {
  emit('update:modelValue', '')
  wasTruncated.value = false
  showLimitWarning.value = false
  textareaRef.value?.focus()
}

// Watch for external value changes
watch(() => props.modelValue, (newValue) => {
  // Re-sanitize if value changed externally
  const sanitized = sanitize(newValue)
  if (sanitized !== newValue) {
    emit('update:modelValue', sanitized)
  }
})
</script>

<template>
  <div 
    class="schema-input-field"
    :class="{ 
      'is-focused': isFocused, 
      'is-disabled': disabled,
      'is-warning': isApproachingLimit,
      'is-error': isOverLimit
    }"
  >
    <!-- Label for accessibility -->
    <label 
      :for="inputId"
      class="input-label"
    >
      <span class="label-text">Описание объекта</span>
      <span class="label-hint">(Ctrl+Enter для генерации)</span>
    </label>
    
    <!-- Textarea container -->
    <div class="textarea-container">
      <textarea
        :id="inputId"
        ref="textareaRef"
        :value="modelValue"
        :disabled="disabled"
        :placeholder="placeholder"
        :maxlength="maxLength"
        :aria-describedby="`${inputId}-hint ${inputId}-count`"
        :aria-invalid="isOverLimit"
        class="input-textarea"
        rows="6"
        @input="handleInput"
        @paste="handlePaste"
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      
      <!-- Clear button -->
      <button
        v-if="modelValue && !disabled"
        type="button"
        class="clear-button"
        aria-label="Очистить поле ввода"
        @click="clearInput"
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
      </button>
    </div>
    
    <!-- Footer with character count and warnings -->
    <div class="input-footer">
      <!-- Character count -->
      <span 
        :id="`${inputId}-count`"
        class="char-count"
        :class="{ 
          'is-warning': isApproachingLimit && !isOverLimit,
          'is-error': isOverLimit 
        }"
        role="status"
        aria-live="polite"
      >
        {{ charCountText }}
      </span>
      
      <!-- Limit warning message -->
      <Transition name="fade">
        <span 
          v-if="showLimitWarning"
          :id="`${inputId}-hint`"
          class="limit-warning"
          role="alert"
          aria-live="assertive"
        >
          Текст обрезан до {{ maxLength }} символов
        </span>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.schema-input-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Label styles */
.input-label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.label-text {
  color: var(--text-secondary);
}

.label-hint {
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}

/* Textarea container */
.textarea-container {
  position: relative;
}

.input-textarea {
  width: 100%;
  min-height: 150px;
  padding: 16px;
  padding-right: 40px;
  
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: var(--text-primary);
  
  background: rgba(14, 17, 22, 0.6);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  
  resize: vertical;
  transition: all var(--transition-fast);
}

.input-textarea::placeholder {
  color: var(--text-tertiary);
}

.input-textarea:hover:not(:disabled) {
  border-color: var(--border-bright);
}

.input-textarea:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px var(--accent-cyan-dim);
}

.input-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(14, 17, 22, 0.3);
}

/* Warning/Error states */
.schema-input-field.is-warning .input-textarea {
  border-color: #f0a000;
}

.schema-input-field.is-error .input-textarea {
  border-color: #ff4444;
}

/* Clear button */
.clear-button {
  position: absolute;
  top: 12px;
  right: 12px;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  width: 24px;
  height: 24px;
  padding: 0;
  
  color: var(--text-tertiary);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  
  transition: all var(--transition-fast);
}

.clear-button:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
}

.clear-button:focus-visible {
  outline: 2px solid var(--accent-cyan);
  outline-offset: 2px;
}

/* Footer */
.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.char-count {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  transition: color var(--transition-fast);
}

.char-count.is-warning {
  color: #f0a000;
}

.char-count.is-error {
  color: #ff4444;
}

.limit-warning {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: #f0a000;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive styles */
@media (max-width: 767px) {
  .input-label {
    flex-direction: column;
    gap: 4px;
  }
  
  .input-textarea {
    min-height: 120px;
    padding: 12px;
    padding-right: 36px;
  }
}
</style>
