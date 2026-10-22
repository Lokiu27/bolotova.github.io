import { watch } from 'vue'
import { useCookieConsent } from './useCookieConsent'

const METRIKA_COUNTER_ID = 107027118
const METRIKA_SCRIPT_SRC = `https://mc.webvisor.org/metrika/tag_ww.js?id=${METRIKA_COUNTER_ID}`

type YmFunction = ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number }

declare global {
  interface Window {
    ym?: YmFunction
  }
}

let loadStarted = false

/**
 * Инжектит скрипт Яндекс Метрики и инициализирует счётчик.
 * Вызывать только после согласия пользователя: пока функция не вызвана,
 * код Метрики не загружается и данные не собираются.
 */
export function loadYandexMetrica(): void {
  if (loadStarted) {
    return
  }
  for (const script of Array.from(document.scripts)) {
    if (script.src === METRIKA_SCRIPT_SRC) {
      loadStarted = true
      return
    }
  }
  loadStarted = true

  // Заглушка как в официальном сниппете: копит вызовы ym(),
  // пока tag_ww.js не загрузится и не перехватит очередь
  window.ym = window.ym || function (...args: unknown[]) {
    const ym = window.ym as YmFunction
    ym.a = ym.a || []
    ym.a.push(args)
  }
  window.ym.l = Date.now()

  const script = document.createElement('script')
  script.async = true
  script.src = METRIKA_SCRIPT_SRC
  document.head.appendChild(script)

  window.ym(METRIKA_COUNTER_ID, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true
  })
}

/**
 * Удаляет cookies Метрики (_ym_*), например при отзыве согласия.
 */
export function clearYandexMetricaCookies(): void {
  try {
    const entries = document.cookie ? document.cookie.split('; ') : []
    for (const entry of entries) {
      const name = entry.split('=')[0]
      if (name.startsWith('_ym_')) {
        document.cookie = `${name}=; Max-Age=0; path=/`
      }
    }
  } catch (err) {
    console.warn('[useYandexMetrica] Failed to clear Metrika cookies:', err)
  }
}

/**
 * Загружает Метрику, если согласие дано, и следит за его появлением.
 * Вызывается один раз из App.vue.
 */
export function useConsentGate(): void {
  const { consent } = useCookieConsent()

  const sync = (): void => {
    if (consent.value === 'granted') {
      loadYandexMetrica()
    }
  }

  sync()
  watch(consent, sync)
}
