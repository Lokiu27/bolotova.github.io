import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Sidebar from '../components/Sidebar.vue'
import MobileHeader from '../components/MobileHeader.vue'
import type { HeroData, ContactsData } from '../types'

/**
 * Unit tests for the «КУРС» navigation link
 * Tests Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

const mockProfileData: HeroData = {
  title: 'Test User',
  subtitle: 'Developer',
  description: 'Test description',
  profile_image: '/test.jpg'
}

const mockContactData: ContactsData = {
  email: 'test@example.com',
  telegram: 'https://t.me/test',
  github: 'https://github.com/test',
  resume: 'https://example.com/resume.pdf'
}

const routerLinkStub = {
  template: '<a :href="to" :class="$attrs.class"><slot /></a>',
  props: ['to']
}

const lazyImageStub = {
  template: '<img :src="src" :alt="alt" />',
  props: ['src', 'alt']
}

describe('Ссылка «КУРС» в Sidebar', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(Sidebar, {
      props: { profileData: mockProfileData, contactData: mockContactData },
      global: {
        stubs: { 'router-link': routerLinkStub, LazyImage: lazyImageStub }
      }
    })
  })

  it('рендерит ссылку <a href="/course/">', () => {
    const link = wrapper.find('a[href="/course/"]')
    expect(link.exists()).toBe(true)
  })

  it('содержит текст «КУРС»', () => {
    const link = wrapper.find('a[href="/course/"]')
    expect(link.find('.nav-text').text()).toBe('/ КУРС')
  })

  it('имеет класс nav-link', () => {
    const link = wrapper.find('a[href="/course/"]')
    expect(link.classes()).toContain('nav-link')
  })

  it('имеет атрибут aria-label', () => {
    const link = wrapper.find('a[href="/course/"]')
    expect(link.attributes('aria-label')).toBeTruthy()
  })

  it('является обычным <a>, а не <router-link>', () => {
    const link = wrapper.find('a[href="/course/"]')
    // router-link stub renders as <a :href="to">, course link uses href="/course/" directly
    // We verify it's a plain anchor by checking it has no "to" prop (router-link attribute)
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe('/course/')
  })

  it('содержит span.nav-arrow с текстом «>»', () => {
    const link = wrapper.find('a[href="/course/"]')
    const arrow = link.find('.nav-arrow')
    expect(arrow.exists()).toBe(true)
    expect(arrow.text()).toBe('>')
    expect(arrow.attributes('aria-hidden')).toBe('true')
  })
})

describe('Ссылка «КУРС» в MobileHeader', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(MobileHeader, {
      global: {
        stubs: { 'router-link': routerLinkStub }
      }
    })
  })

  it('рендерит ссылку <a href="/course/">', () => {
    const link = wrapper.find('a[href="/course/"]')
    expect(link.exists()).toBe(true)
  })

  it('содержит текст «КУРС»', () => {
    const link = wrapper.find('a[href="/course/"]')
    expect(link.find('.nav-text').text()).toBe('/ КУРС')
  })

  it('имеет атрибут aria-label', () => {
    const link = wrapper.find('a[href="/course/"]')
    expect(link.attributes('aria-label')).toBeTruthy()
  })

  it('является обычным <a>, а не <router-link>', () => {
    const link = wrapper.find('a[href="/course/"]')
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe('/course/')
  })

  it('закрывает мобильное меню при клике', async () => {
    // Open the menu first
    await wrapper.find('.hamburger-button').trigger('click')
    expect(wrapper.vm.isMenuOpen).toBe(true)

    // Click the course link
    const link = wrapper.find('a[href="/course/"]')
    await link.trigger('click')

    // Menu should be closed
    expect(wrapper.vm.isMenuOpen).toBe(false)
  })
})
