import { ref, type Ref } from 'vue'

export type CookieConsentValue = 'granted' | 'denied'

const STORAGE_KEY = 'cookie-consent'

function readStoredConsent(): CookieConsentValue | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'granted' || stored === 'denied' ? stored : null
  } catch (err) {
    // localStorage может быть недоступен (приватный режим, блокировка cookies)
    console.warn('[useCookieConsent] Failed to read stored consent:', err)
    return null
  }
}

// Состояние на уровне модуля: баннер и ссылка «Настройки cookies» в футере
// работают с одним и тем же значением
const consent = ref<CookieConsentValue | null>(readStoredConsent())

export interface UseCookieConsentReturn {
  consent: Ref<CookieConsentValue | null>
  grantConsent: () => void
  denyConsent: () => void
  resetConsent: () => void
}

export function useCookieConsent(): UseCookieConsentReturn {
  const store = (value: CookieConsentValue): void => {
    consent.value = value
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch (err) {
      console.warn('[useCookieConsent] Failed to persist consent:', err)
    }
  }

  const grantConsent = (): void => store('granted')

  const denyConsent = (): void => store('denied')

  const resetConsent = (): void => {
    consent.value = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.warn('[useCookieConsent] Failed to clear consent:', err)
    }
  }

  return { consent, grantConsent, denyConsent, resetConsent }
}
