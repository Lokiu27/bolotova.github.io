<template>
  <main class="resume-page">
    <LoadingSpinner v-if="loading" message="Загрузка резюме..." />
    
    <div v-else-if="error" class="error-container" role="alert">
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <p class="error-text">{{ error }}</p>
        <button @click="retry" class="retry-button">
          Попробовать снова
        </button>
      </div>
    </div>
    
    <article v-else class="resume-container">
      <header class="resume-header">
        <h1 class="page-title">Резюме</h1>
        <PdfExportButton 
          :is-loading="pdfGenerating"
          :filename="pdfFilename"
          @generate="handlePdfGeneration"
        />
      </header>
      
      <ResumeContent :html-content="parsedHtml" />
    </article>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useResumeData } from '@/composables/useResumeData'
import { usePdfGenerator } from '@/composables/usePdfGenerator'
import ResumeContent from '@/components/ResumeContent.vue'
import PdfExportButton from '@/components/PdfExportButton.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

/**
 * Resume View
 * 
 * Main resume page that displays markdown-formatted resume content
 * and provides PDF export functionality.
 * 
 * Features:
 * - Semantic HTML structure (main, article, header)
 * - Loading states and error handling
 * - Integration with useResumeData and usePdfGenerator composables
 * - Loads resume from /data/Болотова Ксения Борисовна.md
 * 
 * Requirements: 1.1, 1.2, 3.1, 8.4
 */

console.log('[Resume.vue] Initializing composables...')

const { parsedHtml, loading, error, loadResume } = useResumeData()
const { generatePdf, isGenerating: pdfGenerating } = usePdfGenerator()

console.log('[Resume.vue] Composables initialized:', { 
  hasLoadResume: typeof loadResume === 'function',
  loadingValue: loading.value,
  errorValue: error.value,
  parsedHtmlLength: parsedHtml.value.length
})

const pdfFilename = computed(() => 'Resume_Bolotova_Ksenia.pdf')

/**
 * Handle PDF generation button click
 * Finds the resume content element and passes it to the PDF generator
 */
const handlePdfGeneration = async () => {
  const element = document.querySelector('.resume-content')
  if (element) {
    await generatePdf(element as HTMLElement, pdfFilename.value)
  }
}

/**
 * Retry loading the resume after an error
 */
const retry = () => {
  console.log('[Resume.vue] Retry button clicked')
  loadResume('/data/Болотова Ксения Борисовна.md')
}

// Load resume on component mount
onMounted(() => {
  console.log('[Resume.vue] Component mounted, loading resume...')
  console.log('[Resume.vue] loadResume type:', typeof loadResume)
  try {
    loadResume('/data/Болотова Ксения Борисовна.md')
    console.log('[Resume.vue] loadResume called successfully')
  } catch (err) {
    console.error('[Resume.vue] Error calling loadResume:', err)
  }
})
</script>

<style scoped>
.resume-page {
  min-height: 100vh;
  padding: 2rem;
  background: var(--bg-void, #000);
  /* Grid background pattern 40x40px */
  background-image: 
    linear-gradient(var(--border-dim) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-dim) 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: 0 0, 0 0;
}

.resume-container {
  max-width: 1200px;
  margin: 0 auto;
}

.resume-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-bright, rgba(0, 240, 255, 0.3));
  position: relative;
}

.resume-header::after {
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
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 20px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
}

/* Error container styles */
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  padding: 2rem;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 2px solid var(--color-error, #ef4444);
  max-width: 500px;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  line-height: 1;
}

.error-text {
  font-size: 1.125rem;
  color: var(--text-primary, #fff);
  margin: 0;
  font-family: var(--font-mono, monospace);
}

.retry-button {
  padding: 0.625rem 1.25rem;
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
}

.retry-button:hover {
  background: var(--accent-cyan-dim, rgba(0, 240, 255, 0.1));
  box-shadow: 0 0 20px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
  transform: translateY(-2px);
}

.retry-button:active {
  transform: translateY(0);
}

.retry-button:focus-visible {
  outline: 2px solid var(--accent-cyan, #00f0ff);
  outline-offset: 2px;
}

/* Responsive design */
@media (max-width: 768px) {
  .resume-page {
    padding: 1rem;
  }
  
  .resume-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .error-container {
    padding: 1rem;
  }
  
  .error-message {
    padding: 1.5rem;
  }
}

/* Tablet breakpoint */
@media (min-width: 769px) and (max-width: 1024px) {
  .resume-page {
    padding: 1.5rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .retry-button {
    transition: none;
  }
  
  .retry-button:hover {
    transform: none;
  }
}
</style>
