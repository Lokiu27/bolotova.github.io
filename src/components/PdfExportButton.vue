<template>
  <button 
    class="pdf-export-btn"
    :disabled="isLoading"
    @click="emit('generate')"
    :aria-label="ariaLabel"
  >
    <span v-if="!isLoading" class="button-content">
      <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="text">Скачать PDF</span>
    </span>
    <span v-else class="button-content loading">
      <svg class="icon spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/>
        <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span class="text">Генерация...</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * PdfExportButton Component
 * 
 * Provides UI for PDF download with loading state and accessibility support.
 * Emits generate event when clicked.
 * 
 * Requirements: 3.1, 8.4
 */

interface Props {
  isLoading: boolean
  filename: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  generate: []
}>()

const ariaLabel = computed(() => {
  if (props.isLoading) {
    return `Генерация PDF файла ${props.filename}`
  }
  return `Скачать резюме в формате PDF как ${props.filename}`
})
</script>

<style scoped>
.pdf-export-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: var(--accent-cyan, #00f0ff);
  border: 2px solid var(--accent-cyan, #00f0ff);
  border-radius: 4px;
  font-family: var(--font-mono, monospace);
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.pdf-export-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: var(--accent-cyan, #00f0ff);
  opacity: 0.1;
  transition: left 0.3s ease;
}

.pdf-export-btn:hover:not(:disabled)::before {
  left: 0;
}

.pdf-export-btn:hover:not(:disabled) {
  background: var(--accent-cyan-dim, rgba(0, 240, 255, 0.1));
  box-shadow: 0 0 20px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
  transform: translateY(-2px);
}

.pdf-export-btn:active:not(:disabled) {
  transform: translateY(0);
}

.pdf-export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: var(--border-dim, #333);
  color: var(--text-secondary, #888);
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
}

.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.spinner {
  animation: spin 1s linear infinite;
}

.text {
  line-height: 1;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Focus styles for accessibility */
.pdf-export-btn:focus-visible {
  outline: 2px solid var(--accent-cyan, #00f0ff);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 240, 255, 0.2);
}

/* Responsive design */
@media (max-width: 768px) {
  .pdf-export-btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.75rem;
  }
  
  .icon {
    width: 18px;
    height: 18px;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .pdf-export-btn,
  .pdf-export-btn::before {
    transition: none;
  }
  
  .pdf-export-btn:hover:not(:disabled) {
    transform: none;
  }
  
  .spinner {
    animation: none;
  }
}
</style>
