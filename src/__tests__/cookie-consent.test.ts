/**
 * Тесты cookie-согласия для Яндекс Метрики (требование 152-ФЗ):
 * баннер, хранение решения, условная загрузка счётчика, отзыв согласия.
 *
 * Модули импортируются динамически после vi.resetModules(), потому что
 * состояние согласия и признак загрузки Метрики живут на уровне модуля.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

const routerLinkStub = {
  template: '<a :href="to" :class="$attrs.class"><slot /></a>',
  props: ['to']
}

type ConsentModule = typeof import('../composables/useCookieConsent')
type MetricaModule = typeof import('../composables/useYandexMetrica')

let consentModule: ConsentModule
let metricaModule: MetricaModule
let CookieConsent: typeof import('../components/CookieConsent.vue')['default']
let Footer: typeof import('../components/Footer.vue')['default']

const metrikaScripts = (): NodeListOf<HTMLScriptElement> =>
  document.querySelectorAll('script[src*="mc.webvisor.org"]')

// В vitest+jsdom на этом Node глобальный localStorage отдаёт undefined
// (Node experimental webstorage), поэтому подменяем его простой реализацией
class LocalStorageMock {
  private store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  clear(): void {
    this.store.clear()
  }
}

// Даём завершиться transition-таймерам (jsdom не отрабатывает CSS-переходы)
const settle = async (): Promise<void> => {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 20))
  await nextTick()
}

beforeEach(async () => {
  vi.resetModules()
  vi.stubGlobal('localStorage', new LocalStorageMock())
  metrikaScripts().forEach((script) => script.remove())
  document.cookie = ''
  delete window.ym

  consentModule = await import('../composables/useCookieConsent')
  metricaModule = await import('../composables/useYandexMetrica')
  CookieConsent = (await import('../components/CookieConsent.vue')).default
  Footer = (await import('../components/Footer.vue')).default
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useCookieConsent', () => {
  it('нет решения, пока пользователь не выбрал', () => {
    expect(consentModule.useCookieConsent().consent.value).toBeNull()
  })

  it('grantConsent сохраняет granted', () => {
    consentModule.useCookieConsent().grantConsent()
    expect(localStorage.getItem('cookie-consent')).toBe('granted')
    expect(consentModule.useCookieConsent().consent.value).toBe('granted')
  })

  it('denyConsent сохраняет denied', () => {
    consentModule.useCookieConsent().denyConsent()
    expect(localStorage.getItem('cookie-consent')).toBe('denied')
    expect(consentModule.useCookieConsent().consent.value).toBe('denied')
  })

  it('resetConsent очищает решение', () => {
    const { grantConsent, resetConsent, consent } = consentModule.useCookieConsent()
    grantConsent()
    resetConsent()
    expect(consent.value).toBeNull()
    expect(localStorage.getItem('cookie-consent')).toBeNull()
  })

  it('подхватывает сохранённое согласие при загрузке страницы', async () => {
    localStorage.setItem('cookie-consent', 'granted')
    vi.resetModules()
    const fresh = await import('../composables/useCookieConsent')
    expect(fresh.useCookieConsent().consent.value).toBe('granted')
  })

  it('игнорирует неизвестные значения хранилища', async () => {
    localStorage.setItem('cookie-consent', 'мусор')
    vi.resetModules()
    const fresh = await import('../composables/useCookieConsent')
    expect(fresh.useCookieConsent().consent.value).toBeNull()
  })
})

describe('Баннер CookieConsent', () => {
  const mountBanner = () =>
    mount(CookieConsent, {
      global: {
        stubs: { 'router-link': routerLinkStub, RouterLink: routerLinkStub }
      }
    })

  it('виден, когда решения нет', () => {
    const wrapper = mountBanner()
    expect(wrapper.find('.cookie-consent').exists()).toBe(true)
  })

  it('скрыт, когда согласие уже дано', () => {
    consentModule.useCookieConsent().grantConsent()
    const wrapper = mountBanner()
    expect(wrapper.find('.cookie-consent').exists()).toBe(false)
  })

  it('скрыт, когда согласие отклонено', () => {
    consentModule.useCookieConsent().denyConsent()
    const wrapper = mountBanner()
    expect(wrapper.find('.cookie-consent').exists()).toBe(false)
  })

  it('содержит ссылку на политику обработки данных', () => {
    const wrapper = mountBanner()
    const link = wrapper.find('a[href="/privacy"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Политике')
  })

  it('«Принять» сохраняет granted и скрывает баннер', async () => {
    const wrapper = mountBanner()
    await wrapper.find('.consent-accept').trigger('click')
    await settle()
    expect(localStorage.getItem('cookie-consent')).toBe('granted')
    expect(wrapper.find('.cookie-consent').exists()).toBe(false)
  })

  it('«Отклонить» сохраняет denied, скрывает баннер и не грузит Метрику', async () => {
    const wrapper = mountBanner()
    await wrapper.find('.consent-deny').trigger('click')
    await settle()
    expect(localStorage.getItem('cookie-consent')).toBe('denied')
    expect(wrapper.find('.cookie-consent').exists()).toBe(false)
    expect(metrikaScripts()).toHaveLength(0)
  })
})

describe('useYandexMetrica', () => {
  it('loadYandexMetrica инжектит скрипт и ставит вызов init в очередь', () => {
    metricaModule.loadYandexMetrica()
    const scripts = metrikaScripts()
    expect(scripts).toHaveLength(1)
    expect(scripts[0].src).toBe('https://mc.webvisor.org/metrika/tag_ww.js?id=107027118')
    expect(window.ym).toBeDefined()
    expect(window.ym?.a?.length).toBeGreaterThan(0)
  })

  it('повторный вызов не дублирует скрипт', () => {
    metricaModule.loadYandexMetrica()
    metricaModule.loadYandexMetrica()
    expect(metrikaScripts()).toHaveLength(1)
  })

  it('clearYandexMetricaCookies удаляет только _ym_* cookies', () => {
    document.cookie = '_ym_uid=111; path=/'
    document.cookie = '_ym_debug=1; path=/'
    document.cookie = 'other=keep; path=/'
    metricaModule.clearYandexMetricaCookies()
    expect(document.cookie).toContain('other=keep')
    expect(document.cookie).not.toContain('_ym_uid')
    expect(document.cookie).not.toContain('_ym_debug')
  })
})

describe('useConsentGate (загрузка Метрики по согласию)', () => {
  it('не грузит Метрику без согласия; грузит после «Принять»', async () => {
    metricaModule.useConsentGate()
    await settle()
    expect(metrikaScripts()).toHaveLength(0)

    consentModule.useCookieConsent().grantConsent()
    await settle()
    expect(metrikaScripts()).toHaveLength(1)
  })

  it('сразу грузит Метрику, если согласие было дано раньше', async () => {
    localStorage.setItem('cookie-consent', 'granted')
    vi.resetModules()
    const freshConsent = await import('../composables/useCookieConsent')
    const freshMetrica = await import('../composables/useYandexMetrica')
    expect(freshConsent.useCookieConsent().consent.value).toBe('granted')

    freshMetrica.useConsentGate()
    expect(metrikaScripts()).toHaveLength(1)
  })

  it('сценарий целиком: баннер + gate + клик «Принять» загружает счётчик', async () => {
    metricaModule.useConsentGate()
    const wrapper = mount(CookieConsent, {
      global: { stubs: { 'router-link': routerLinkStub, RouterLink: routerLinkStub } }
    })
    expect(metrikaScripts()).toHaveLength(0)

    await wrapper.find('.consent-accept').trigger('click')
    await settle()
    expect(localStorage.getItem('cookie-consent')).toBe('granted')
    expect(metrikaScripts()).toHaveLength(1)
  })
})

describe('Footer «Настройки cookies»', () => {
  const mountFooter = () =>
    mount(Footer, {
      global: {
        stubs: { 'router-link': routerLinkStub, RouterLink: routerLinkStub }
      }
    })

  it('содержит кнопку «Настройки cookies»', () => {
    const wrapper = mountFooter()
    const button = wrapper.find('button.cookie-settings')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Настройки cookies')
  })

  it('сбрасывает отклонённое согласие без перезагрузки страницы', async () => {
    consentModule.useCookieConsent().denyConsent()
    const wrapper = mountFooter()
    await wrapper.find('button.cookie-settings').trigger('click')
    await nextTick()
    expect(localStorage.getItem('cookie-consent')).toBeNull()
    expect(consentModule.useCookieConsent().consent.value).toBeNull()
  })

  it('при отзыве данного согласия удаляет cookies Метрики и перезагружает страницу', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { reload, href: 'http://localhost/' })

    consentModule.useCookieConsent().grantConsent()
    document.cookie = '_ym_uid=222; path=/'
    const wrapper = mountFooter()
    await wrapper.find('button.cookie-settings').trigger('click')
    await nextTick()

    expect(localStorage.getItem('cookie-consent')).toBeNull()
    expect(document.cookie).not.toContain('_ym_uid')
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
