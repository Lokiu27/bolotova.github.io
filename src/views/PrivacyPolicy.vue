<template>
  <main class="policy-page">
    <LoadingSpinner v-if="loading" message="Загрузка документа..." />

    <div v-else-if="error" class="error-container" role="alert">
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <p class="error-text">{{ error }}</p>
        <button @click="loadPolicy" class="retry-button">
          Попробовать снова
        </button>
      </div>
    </div>

    <article v-else class="policy-container">
      <header class="policy-header">
        <h1 class="page-title">Политика обработки персональных данных</h1>

        <div class="policy-actions">
          <div class="permalink-box">
            <span class="permalink-label">Постоянная ссылка на документ</span>
            <div class="permalink-row">
              <a :href="PERMALINK" class="permalink-link">{{ PERMALINK }}</a>
              <button
                v-if="clipboardAvailable"
                class="copy-button"
                :class="{ copied }"
                @click="copyPermalink"
                :aria-label="copied ? 'Ссылка скопирована' : 'Скопировать постоянную ссылку'"
              >
                {{ copied ? 'Скопировано ✓' : 'Скопировать' }}
              </button>
            </div>
          </div>

          <a
            class="pdf-download-btn"
            href="/privacy-policy.pdf"
            download="Политика_обработки_персональных_данных.pdf"
            aria-label="Скачать политику обработки персональных данных в формате PDF"
          >
            <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="text">Скачать PDF</span>
          </a>
        </div>
      </header>

      <div class="policy-content" v-html="parsedHtml"></div>
    </article>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

/**
 * PrivacyPolicy View
 *
 * Страница «Политика обработки персональных данных» (152-ФЗ).
 * Отображает текст документа из /data/privacy-policy.md,
 * постоянную ссылку на страницу и ссылку для скачивания PDF.
 */

const PERMALINK = 'https://bolotova.online/privacy'
const POLICY_SOURCE = '/data/privacy-policy.md'

const parsedHtml = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const copied = ref(false)

const clipboardAvailable =
  typeof navigator !== 'undefined' &&
  typeof navigator.clipboard !== 'undefined' &&
  typeof navigator.clipboard.writeText === 'function'

let copiedTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Загрузить и отрисовать текст политики из markdown-файла
 */
const loadPolicy = async (): Promise<void> => {
  loading.value = true
  error.value = null

  try {
    const response = await fetch(POLICY_SOURCE)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Файл политики не найден')
      }
      throw new Error(`Ошибка загрузки: ${response.status}`)
    }

    const markdown = await response.text()

    if (!markdown || markdown.trim().length === 0) {
      throw new Error('Документ пуст')
    }

    const rawHtml = await marked.parse(markdown, { gfm: true, breaks: true })

    parsedHtml.value = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'br'
      ],
      ALLOWED_ATTR: ['href', 'class', 'id', 'rel', 'role']
    })
  } catch (err) {
    if (err instanceof TypeError) {
      error.value = 'Ошибка сети. Проверьте подключение к интернету.'
    } else if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Не удалось загрузить документ'
    }
  } finally {
    loading.value = false
  }
}

/**
 * Скопировать постоянную ссылку в буфер обмена
 */
const copyPermalink = async (): Promise<void> => {
  if (!clipboardAvailable) return

  try {
    await navigator.clipboard.writeText(PERMALINK)
    markCopied()
  } catch {
    // Фолбэк для браузеров, где Clipboard API ограничен политиками
    try {
      const textarea = document.createElement('textarea')
      textarea.value = PERMALINK
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const copiedViaFallback = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (copiedViaFallback) {
        markCopied()
      }
    } catch {
      // Буфер обмена недоступен — постоянная ссылка остаётся видимой как текст
    }
  }
}

/**
 * Показать индикатор «Скопировано» на 2 секунды
 */
const markCopied = (): void => {
  copied.value = true

  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 2000)
}

onMounted(loadPolicy)
</script>

<style scoped>
.policy-page {
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

.policy-container {
  max-width: 1200px;
  margin: 0 auto;
}

.policy-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-bright, rgba(0, 240, 255, 0.3));
  position: relative;
}

.policy-header::after {
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
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-cyan, #00f0ff);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  line-height: 1.3;
  text-shadow: 0 0 20px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
}

.policy-actions {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Постоянная ссылка */
.permalink-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.375rem;
  min-width: 0;
}

.permalink-label {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary, #7a8290);
}

.permalink-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.permalink-link {
  font-family: var(--font-mono, monospace);
  font-size: 0.875rem;
  color: var(--text-primary, #e0e0e0);
  text-decoration: none;
  border-bottom: 1px dashed var(--border-bright, #3d4450);
  padding-bottom: 2px;
  overflow-wrap: anywhere;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.permalink-link:hover {
  color: var(--accent-cyan, #00f0ff);
  border-bottom-color: var(--accent-cyan, #00f0ff);
}

.permalink-link:focus-visible,
.copy-button:focus-visible,
.pdf-download-btn:focus-visible {
  outline: 2px solid var(--accent-cyan, #00f0ff);
  outline-offset: 2px;
}

.copy-button {
  padding: 0.375rem 0.875rem;
  background: transparent;
  color: var(--accent-cyan, #00f0ff);
  border: 1px solid var(--accent-cyan, #00f0ff);
  border-radius: 4px;
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background: var(--accent-cyan-dim, rgba(0, 240, 255, 0.1));
  box-shadow: 0 0 15px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
}

.copy-button.copied {
  color: var(--text-primary, #e0e0e0);
  border-color: var(--border-bright, #3d4450);
  box-shadow: none;
}

/* Кнопка скачивания PDF */
.pdf-download-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pdf-download-btn:hover {
  background: var(--accent-cyan-dim, rgba(0, 240, 255, 0.1));
  box-shadow: 0 0 20px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
  transform: translateY(-2px);
}

.pdf-download-btn:active {
  transform: translateY(0);
}

.pdf-download-btn .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Текст документа — стеклянная панель, как у резюме */
.policy-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2.5rem;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(0, 240, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 240, 255, 0.1);
  line-height: 1.7;
  position: relative;
  color: #e0e0e0;
}

.policy-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg,
    transparent 0%,
    #00f0ff 50%,
    transparent 100%);
  border-radius: 12px 12px 0 0;
  opacity: 0.8;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.policy-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2.5rem;
  margin-bottom: 1.25rem;
  color: #00f0ff;
  border-bottom: 2px solid rgba(0, 240, 255, 0.3);
  padding-bottom: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
}

.policy-content :deep(h2::after) {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: #00f0ff;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.policy-content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.75rem;
  margin-bottom: 0.875rem;
  color: #ffffff;
}

.policy-content :deep(p) {
  margin-bottom: 1.125rem;
  color: #e0e0e0;
  font-size: 1rem;
}

.policy-content :deep(strong) {
  font-weight: 600;
  color: #ffffff;
}

.policy-content :deep(ul) {
  list-style-type: none;
  margin-bottom: 1.25rem;
  padding-left: 1.75rem;
}

.policy-content :deep(ol) {
  list-style-type: decimal;
  margin-bottom: 1.25rem;
  padding-left: 1.75rem;
}

.policy-content :deep(li) {
  margin-bottom: 0.625rem;
  color: #e0e0e0;
  line-height: 1.6;
}

.policy-content :deep(ul li) {
  position: relative;
  padding-left: 0.5rem;
}

.policy-content :deep(ul li::before) {
  content: '▹';
  position: absolute;
  left: -1.25rem;
  color: #00f0ff;
  font-weight: bold;
}

.policy-content :deep(a) {
  color: #00f0ff;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  font-weight: 500;
}

.policy-content :deep(a:hover) {
  color: #5dfdff;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
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

/* Responsive design - Mobile (<768px) */
@media (max-width: 768px) {
  .policy-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .policy-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .pdf-download-btn {
    width: 100%;
  }

  .policy-content {
    padding: 1.5rem;
    border-radius: 8px;
  }

  .policy-content :deep(h2) {
    font-size: 1.25rem;
    margin-top: 2rem;
  }

  .policy-content :deep(p) {
    font-size: 0.9375rem;
  }
}

/* Tablet breakpoint */
@media (min-width: 769px) and (max-width: 1024px) {
  .policy-page {
    padding: 1.5rem;
  }

  .page-title {
    font-size: 1.75rem;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .copy-button,
  .pdf-download-btn,
  .retry-button,
  .policy-content :deep(a) {
    transition: none;
  }

  .pdf-download-btn:hover,
  .retry-button:hover {
    transform: none;
  }
}
</style>
