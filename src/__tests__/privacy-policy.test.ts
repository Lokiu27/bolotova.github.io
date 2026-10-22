import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, VueWrapper } from '@vue/test-utils'
import Footer from '../components/Footer.vue'
import PrivacyPolicy from '../views/PrivacyPolicy.vue'
import { routeSeoConfig } from '../config/seo'

/**
 * Unit tests для страницы «Политика обработки персональных данных» (/privacy)
 * и ссылки на неё в подвале сайта (требование 152-ФЗ).
 */

const routerLinkStub = {
  template: '<a :href="to" :class="$attrs.class"><slot /></a>',
  props: ['to']
}

const policyMarkdown = [
  '**Дата публикации:** 22.10.2026',
  '',
  '## 1. Общие положения',
  '',
  '1.1. Тестовый текст политики обработки персональных данных.'
].join('\n')

describe('Ссылка на политику в Footer', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(Footer, {
      global: {
        stubs: { 'router-link': routerLinkStub, RouterLink: routerLinkStub }
      }
    })
  })

  it('рендерит ссылку <a href="/privacy">', () => {
    const link = wrapper.find('a[href="/privacy"]')
    expect(link.exists()).toBe(true)
  })

  it('содержит текст «Политика обработки персональных данных»', () => {
    const link = wrapper.find('a[href="/privacy"]')
    expect(link.text()).toBe('Политика обработки персональных данных')
  })

  it('имеет класс footer-link', () => {
    const link = wrapper.find('a[href="/privacy"]')
    expect(link.classes()).toContain('footer-link')
  })
})

describe('Страница PrivacyPolicy', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(policyMarkdown)
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('загружает markdown политики и отрисовывает текст документа', async () => {
    wrapper = mount(PrivacyPolicy)
    await flushPromises()

    expect(global.fetch).toHaveBeenCalledWith('/data/privacy-policy.md')

    const content = wrapper.find('.policy-content')
    expect(content.exists()).toBe(true)
    expect(content.text()).toContain('Общие положения')
    expect(content.text()).toContain('Тестовый текст политики')
    expect(content.find('h2').exists()).toBe(true)
  })

  it('показывает постоянную ссылку на документ', async () => {
    wrapper = mount(PrivacyPolicy)
    await flushPromises()

    const permalink = wrapper.find('.permalink-link')
    expect(permalink.exists()).toBe(true)
    expect(permalink.attributes('href')).toBe('https://bolotova.online/privacy')
    expect(permalink.text()).toBe('https://bolotova.online/privacy')
  })

  it('содержит ссылку для скачивания PDF с атрибутом download', async () => {
    wrapper = mount(PrivacyPolicy)
    await flushPromises()

    const pdfLink = wrapper.find('a[href="/privacy-policy.pdf"]')
    expect(pdfLink.exists()).toBe(true)
    expect(pdfLink.attributes('download')).toBeTruthy()
    expect(pdfLink.classes()).toContain('pdf-download-btn')
  })

  it('показывает ошибку при недоступном файле', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('')
    })
    vi.stubGlobal('fetch', fetchMock)

    wrapper = mount(PrivacyPolicy)
    await flushPromises()

    const errorBox = wrapper.find('.error-container')
    expect(errorBox.exists()).toBe(true)
    expect(errorBox.text()).toContain('Файл политики не найден')
  })
})

describe('SEO-конфигурация /privacy', () => {
  it('содержит запись в routeSeoConfig', () => {
    const seo = routeSeoConfig['/privacy']
    expect(seo).toBeDefined()
    expect(seo.title).toContain('Политика обработки персональных данных')
    expect(seo.description.length).toBeGreaterThan(0)
  })
})
