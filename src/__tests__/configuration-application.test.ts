import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, config, RouterLinkStub } from '@vue/test-utils'
import * as fc from 'fast-check'
import App from '../App.vue'
import type { HeroData, AboutData, ContactsData } from '../types'

/**
 * **Feature: vue-migration-docker, Property 17: Configuration application**
 * **Validates: Requirements 4.5**
 * 
 * Property: For any configuration change, the Vue application should apply new settings and reflect them in the interface
 */
// Глобальные стаб-компоненты для снижения влияния DOM/роутера на тесты конфигурации
config.global.stubs = {
  // Избегаем побочных эффектов lazy‑загрузки и сложных атрибутов в jsdom
  LazyImage: {
    template: '<img class="lazy-image-stub" />'
  },
  RouterLink: RouterLinkStub,
  RouterView: {
    template: '<div class="router-view-stub"><slot /></div>'
  }
}

describe('Configuration Application Property Tests', () => {
  // Mock fetch globally
  const mockFetch = vi.fn()
  
  beforeEach(() => {
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // Generators for test data
  const heroDataArb = fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    subtitle: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    profile_image: fc.webUrl()
  })

  const featureArb = fc.record({
    icon: fc.oneof(
      fc.constant('users'),
      fc.constant('sparkles'),
      fc.constant('bullseye'),
      fc.constant('default')
    ),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0)
  })

  const aboutDataArb = fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    features: fc.array(featureArb, { minLength: 1, maxLength: 10 })
  })

  const contactsDataArb = fc.record({
    email: fc.emailAddress(),
    telegram: fc.webUrl(),
    github: fc.webUrl(),
    resume: fc.webUrl()
  })

  it('should apply new configuration data and reflect changes in the interface', async () => {
    await fc.assert(
      fc.asyncProperty(
        heroDataArb,
        aboutDataArb,
        contactsDataArb,
        heroDataArb,
        aboutDataArb,
        contactsDataArb,
        async (
          initialHero: HeroData,
          initialAbout: AboutData,
          initialContacts: ContactsData,
          updatedHero: HeroData,
          updatedAbout: AboutData,
          updatedContacts: ContactsData
        ) => {
          // Ensure the configurations are different
          fc.pre(
            JSON.stringify(initialHero) !== JSON.stringify(updatedHero) ||
            JSON.stringify(initialAbout) !== JSON.stringify(updatedAbout) ||
            JSON.stringify(initialContacts) !== JSON.stringify(updatedContacts)
          )

          // Mock initial fetch responses
          mockFetch
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve(initialHero)
            })
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve(initialAbout)
            })
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve(initialContacts)
            })

          const wrapper = mount(App)

          // Wait for initial data to load
          await new Promise(resolve => setTimeout(resolve, 50))
          await wrapper.vm.$nextTick()

          // Verify initial configuration is applied
          expect(wrapper.find('.profile-title').text()).toBe(initialHero.title.trim())
          expect(wrapper.find('.about-title').text()).toBe(initialAbout.title.trim())
          expect(wrapper.findAll('.feature-card').length).toBe(initialAbout.features.length)

          // Simulate configuration change by mocking new fetch responses
          mockFetch.mockClear()
          mockFetch
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve(updatedHero)
            })
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve(updatedAbout)
            })
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve(updatedContacts)
            })

          // Trigger data reload (simulating configuration change)
          await wrapper.vm.loadData()
          await wrapper.vm.$nextTick()

          // Property: Application should reflect the new configuration in the interface
          expect(wrapper.find('.profile-title').text()).toBe(updatedHero.title.trim())
          expect(wrapper.find('.profile-subtitle').text()).toBe(updatedHero.subtitle.trim())
          expect(wrapper.find('.about-title').text()).toBe(updatedAbout.title.trim())
          expect(wrapper.find('.about-description').text()).toBe(updatedAbout.description.trim())
          expect(wrapper.findAll('.feature-card').length).toBe(updatedAbout.features.length)

          // Verify contact links are updated
          expect(wrapper.find('.contact-link.email').attributes('href')).toBe(`mailto:${updatedContacts.email}`)
          expect(wrapper.find('.contact-link.telegram').attributes('href')).toBe(updatedContacts.telegram)

          return true
        }
      ),
      { numRuns: 50 } // Reduced runs due to async complexity
    )
  })

  it('should handle configuration errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        heroDataArb,
        aboutDataArb,
        contactsDataArb,
        async (heroData: HeroData, aboutData: AboutData, contactsData: ContactsData) => {
          // Mock successful initial load
          mockFetch
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve(heroData)
            })
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve(aboutData)
            })
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve(contactsData)
            })

          const wrapper = mount(App)

          // Wait for initial load
          await new Promise(resolve => setTimeout(resolve, 50))
          await wrapper.vm.$nextTick()

          // Verify successful load
          expect(wrapper.find('.loading').exists()).toBe(false)
          expect(wrapper.find('.error').exists()).toBe(false)

          // Mock configuration error
          mockFetch.mockClear()
          mockFetch.mockRejectedValue(new Error('Configuration load failed'))

          // Trigger reload with error
          await wrapper.vm.loadData()
          await wrapper.vm.$nextTick()

          // Property: Application should handle configuration errors gracefully
          expect(wrapper.find('.error').exists()).toBe(true)
          expect(wrapper.find('.error').text()).toContain('Configuration load failed')

          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  it.skip('should maintain interface state during configuration loading', async () => {
    await fc.assert(
      fc.asyncProperty(
        heroDataArb,
        aboutDataArb,
        contactsDataArb,
        async (heroData: HeroData, aboutData: AboutData, contactsData: ContactsData) => {
          // Mock initial successful load
          mockFetch
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve(heroData)
            })
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve(aboutData)
            })
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve(contactsData)
            })

          const wrapper = mount(App)

          // Wait for initial load
          await new Promise(resolve => setTimeout(resolve, 50))
          await wrapper.vm.$nextTick()

          // Verify loaded state
          expect(wrapper.find('.loading').exists()).toBe(false)
          expect(wrapper.find('.app-layout').exists()).toBe(true)

          // Mock slow configuration reload
          mockFetch.mockClear()
          let resolveSlowFetch: (value: any) => void
          const slowFetchPromise = new Promise(resolve => {
            resolveSlowFetch = resolve
          })

          mockFetch
            .mockReturnValueOnce(slowFetchPromise)
            .mockReturnValueOnce(slowFetchPromise)
            .mockReturnValueOnce(slowFetchPromise)

          // Trigger reload
          const reloadPromise = wrapper.vm.loadData()

          // Property: Interface should remain stable during configuration loading
          // (not showing loading state for reloads, maintaining current content)
          expect(wrapper.find('.app-layout').exists()).toBe(true)
          expect(wrapper.find('.profile-title').text()).toBe(heroData.title.trim())

          // Complete the slow fetch
          resolveSlowFetch!({
            ok: true,
            json: () => Promise.resolve(heroData)
          })

          await reloadPromise
          await wrapper.vm.$nextTick()

          // Should still be in loaded state
          expect(wrapper.find('.app-layout').exists()).toBe(true)

          return true
        }
      ),
      { numRuns: 30 } // Reduced due to complexity
    )
  })

  it('should apply partial configuration updates correctly', async () => {
    const initialHero: HeroData = {
      title: 'Initial Title',
      subtitle: 'Initial Subtitle',
      description: 'Initial Description',
      profile_image: 'https://example.com/initial.jpg'
    }

    const updatedHero: HeroData = {
      title: 'Updated Title',
      subtitle: 'Updated Subtitle',
      description: 'Updated Description',
      profile_image: 'https://example.com/updated.jpg'
    }

    const aboutData: AboutData = {
      title: 'About Section',
      description: 'About description',
      features: [
        {
          icon: 'users',
          title: 'Feature 1',
          description: 'Feature 1 description'
        }
      ]
    }

    const contactsData: ContactsData = {
      email: 'test@example.com',
      telegram: 'https://t.me/test',
      github: 'https://github.com/test',
      resume: 'https://example.com/resume.pdf'
    }

    // Mock initial load
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(initialHero)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(aboutData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(contactsData)
      })

    const wrapper = mount(App)

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    // Mock partial update (only hero data changes)
    mockFetch.mockClear()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedHero)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(aboutData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(contactsData)
      })

    // Trigger reload
    await wrapper.vm.loadData()
    await wrapper.vm.$nextTick()

    // Only the changed configuration should be updated
    expect(wrapper.find('.profile-title').text()).toBe(updatedHero.title.trim())
    expect(wrapper.find('.profile-subtitle').text()).toBe(updatedHero.subtitle.trim())

    // Unchanged data should remain the same
    expect(wrapper.find('.about-title').text()).toBe(aboutData.title.trim())
    expect(wrapper.find('.contact-link.email').attributes('href')).toBe(`mailto:${contactsData.email}`)
  })
})