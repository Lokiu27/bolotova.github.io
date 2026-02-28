<script setup lang="ts">
/**
 * SchemaResultDisplay Component
 * 
 * Displays generated JSON Schema with syntax highlighting.
 * Features:
 * - JSON syntax highlighting
 * - Formatted output with indentation
 * - Copy to clipboard functionality
 * - DOM escaping for security
 * - ARIA live region for accessibility
 * 
 * Validates: Requirements 5.1-5.4, 7.2, 8.4, 14.3
 */
import { ref, computed, watch } from 'vue'

/**
 * Props for SchemaResultDisplay component
 */
interface SchemaResultDisplayProps {
  /** JSON Schema string to display */
  schema: string | null
  /** Whether generation is in progress */
  isLoading?: boolean
}

const props = withDefaults(defineProps<SchemaResultDisplayProps>(), {
  isLoading: false
})

/**
 * Emits for SchemaResultDisplay component
 */
const emit = defineEmits<{
  /** Copy button clicked */
  'copy': []
}>()

// Local state
const copySuccess = ref(false)
const copyError = ref(false)
let copyTimeout: ReturnType<typeof setTimeout> | null = null

/**
 * Escape HTML special characters to prevent XSS
 * @param str - String to escape
 * @returns Escaped string safe for DOM insertion
 * 
 * Validates: Requirement 7.2
 */
const escapeHtml = (str: string): string => {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char])
}

/**
 * Format JSON with proper indentation
 * @param jsonStr - JSON string to format
 * @returns Formatted JSON string
 * 
 * Validates: Requirement 5.4
 */
const formatJson = (jsonStr: string): string => {
  try {
    const parsed = JSON.parse(jsonStr)
    return JSON.stringify(parsed, null, 2)
  } catch {
    // Return original if parsing fails
    return jsonStr
  }
}

/**
 * Apply syntax highlighting to JSON
 * @param json - JSON string to highlight
 * @returns HTML string with syntax highlighting
 * 
 * Validates: Requirement 5.1
 */
const highlightJson = (json: string): string => {
  // First escape HTML to prevent XSS
  const escaped = escapeHtml(json)
  
  // Apply syntax highlighting with regex
  return escaped
    // Highlight keys (property names)
    .replace(
      /("(?:[^"\\]|\\.)*")(\s*:)/g,
      '<span class="json-key">$1</span>$2'
    )
    // Highlight string values (after colon)
    .replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      ': <span class="json-string">$1</span>'
    )
    // Highlight numbers
    .replace(
      /:\s*(-?\d+\.?\d*)/g,
      ': <span class="json-number">$1</span>'
    )
    // Highlight booleans
    .replace(
      /:\s*(true|false)/g,
      ': <span class="json-boolean">$1</span>'
    )
    // Highlight null
    .replace(
      /:\s*(null)/g,
      ': <span class="json-null">$1</span>'
    )
}

/**
 * Formatted and highlighted schema HTML
 */
const highlightedSchema = computed(() => {
  if (!props.schema) return ''
  
  const formatted = formatJson(props.schema)
  return highlightJson(formatted)
})

/**
 * Plain formatted schema for copying
 */
const formattedSchema = computed(() => {
  if (!props.schema) return ''
  return formatJson(props.schema)
})

/**
 * Whether schema is available to display
 */
const hasSchema = computed(() => {
  return props.schema !== null && props.schema.trim() !== ''
})

/**
 * Copy schema to clipboard
 * 
 * Validates: Requirement 5.2, 5.3
 */
const copyToClipboard = async () => {
  if (!formattedSchema.value) return
  
  // Clear previous timeout
  if (copyTimeout) {
    clearTimeout(copyTimeout)
  }
  
  try {
    await navigator.clipboard.writeText(formattedSchema.value)
    copySuccess.value = true
    copyError.value = false
    emit('copy')
    
    // Reset after 2 seconds
    copyTimeout = setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch {
    copyError.value = true
    copySuccess.value = false
    
    // Reset after 2 seconds
    copyTimeout = setTimeout(() => {
      copyError.value = false
    }, 2000)
  }
}

/**
 * Copy button text based on state
 */
const copyButtonText = computed(() => {
  if (copySuccess.value) return 'Скопировано!'
  if (copyError.value) return 'Ошибка'
  return 'Копировать'
})

// Reset copy state when schema changes
watch(() => props.schema, () => {
  copySuccess.value = false
  copyError.value = false
})
</script>

<template>
  <div 
    class="schema-result-display"
    :class="{ 'has-schema': hasSchema, 'is-loading': isLoading }"
  >
    <!-- Header with title and copy button -->
    <div class="result-header">
      <h3 class="result-title">
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
          aria-hidden="true"
        >
          <path 
            d="M2 4L8 1L14 4V12L8 15L2 12V4Z" 
            stroke="currentColor" 
            stroke-width="1.5"
          />
          <path 
            d="M8 1V15M2 4L14 4M2 12L8 8L14 12" 
            stroke="currentColor" 
            stroke-width="1.5"
            stroke-opacity="0.5"
          />
        </svg>
        <span>JSON Schema</span>
      </h3>
      
      <button
        v-if="hasSchema"
        type="button"
        class="copy-button"
        :class="{ 
          'is-success': copySuccess, 
          'is-error': copyError 
        }"
        :disabled="isLoading"
        :aria-label="copySuccess ? 'Схема скопирована в буфер обмена' : 'Копировать схему в буфер обмена'"
        @click="copyToClipboard"
      >
        <!-- Copy icon -->
        <svg 
          v-if="!copySuccess && !copyError"
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
          aria-hidden="true"
        >
          <rect 
            x="5" 
            y="5" 
            width="9" 
            height="9" 
            rx="1" 
            stroke="currentColor" 
            stroke-width="1.5"
          />
          <path 
            d="M11 5V3C11 2.44772 10.5523 2 10 2H3C2.44772 2 2 2.44772 2 3V10C2 10.5523 2.44772 11 3 11H5" 
            stroke="currentColor" 
            stroke-width="1.5"
          />
        </svg>
        
        <!-- Success icon -->
        <svg 
          v-else-if="copySuccess"
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
          aria-hidden="true"
        >
          <path 
            d="M3 8L6 11L13 4" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          />
        </svg>
        
        <!-- Error icon -->
        <svg 
          v-else
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
        
        <span>{{ copyButtonText }}</span>
      </button>
    </div>
    
    <!-- Schema content -->
    <div 
      class="result-content"
      :aria-live="hasSchema ? 'polite' : 'off'"
      :aria-busy="isLoading"
    >
      <!-- Empty state -->
      <div v-if="!hasSchema && !isLoading" class="empty-state">
        <p>Здесь появится сгенерированная JSON Schema</p>
      </div>
      
      <!-- Loading state -->
      <div v-else-if="isLoading" class="loading-state">
        <div class="loading-skeleton">
          <div class="skeleton-line" style="width: 60%"></div>
          <div class="skeleton-line" style="width: 80%"></div>
          <div class="skeleton-line" style="width: 40%"></div>
          <div class="skeleton-line" style="width: 70%"></div>
          <div class="skeleton-line" style="width: 50%"></div>
        </div>
      </div>
      
      <!-- Schema display -->
      <pre 
        v-else
        class="schema-code"
        tabindex="0"
        role="region"
        aria-label="Сгенерированная JSON Schema"
      ><code v-html="highlightedSchema"></code></pre>
    </div>
    
    <!-- Screen reader announcement -->
    <div 
      v-if="hasSchema && !isLoading"
      class="sr-only"
      role="status"
      aria-live="assertive"
    >
      JSON Schema успешно сгенерирована. Используйте кнопку копирования для копирования в буфер обмена.
    </div>
  </div>
</template>

<style scoped>
.schema-result-display {
  display: flex;
  flex-direction: column;
  
  background: rgba(14, 17, 22, 0.6);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.schema-result-display.has-schema {
  border-color: var(--border-bright);
}

/* Header */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  
  background: rgba(14, 17, 22, 0.8);
  border-bottom: 1px solid var(--border-dim);
}

.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.result-title svg {
  color: var(--accent-cyan);
}

/* Copy button */
.copy-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  background: transparent;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  
  transition: all var(--transition-fast);
}

.copy-button:hover:not(:disabled) {
  color: var(--accent-cyan);
  border-color: var(--accent-cyan);
  background: var(--accent-cyan-dim);
}

.copy-button:focus-visible {
  outline: 2px solid var(--accent-cyan);
  outline-offset: 2px;
}

.copy-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.copy-button.is-success {
  color: #00ff88;
  border-color: #00ff88;
  background: rgba(0, 255, 136, 0.1);
}

.copy-button.is-error {
  color: #ff4444;
  border-color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
}

/* Content area */
.result-content {
  min-height: 200px;
  max-height: 500px;
  overflow: auto;
}

/* Empty state */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 24px;
}

.empty-state p {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  text-align: center;
}

/* Loading state */
.loading-state {
  padding: 24px;
}

.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 16px;
  background: linear-gradient(
    90deg,
    rgba(35, 39, 48, 0.5) 25%,
    rgba(61, 68, 80, 0.5) 50%,
    rgba(35, 39, 48, 0.5) 75%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Schema code display */
.schema-code {
  margin: 0;
  padding: 16px;
  
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--text-primary);
  
  white-space: pre;
  overflow-x: auto;
}

.schema-code:focus {
  outline: none;
  background: rgba(0, 240, 255, 0.05);
}

.schema-code:focus-visible {
  outline: 2px solid var(--accent-cyan);
  outline-offset: -2px;
}

/* JSON syntax highlighting */
:deep(.json-key) {
  color: #7dd3fc; /* Light blue for keys */
}

:deep(.json-string) {
  color: #86efac; /* Light green for strings */
}

:deep(.json-number) {
  color: #fcd34d; /* Yellow for numbers */
}

:deep(.json-boolean) {
  color: #f472b6; /* Pink for booleans */
}

:deep(.json-null) {
  color: #a78bfa; /* Purple for null */
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

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .skeleton-line {
    animation: none;
  }
}

/* Responsive styles */
@media (max-width: 767px) {
  .result-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .copy-button {
    width: 100%;
    justify-content: center;
  }
  
  .result-content {
    max-height: 300px;
  }
  
  .schema-code {
    padding: 12px;
    font-size: var(--font-size-xs);
  }
}
</style>
