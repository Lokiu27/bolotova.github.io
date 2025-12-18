import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import * as fc from 'fast-check'
import App from '../App.vue'
import Home from '../views/Home.vue'
import Services from '../views/Services.vue'

/**
 * Feature: vue-migration-docker, Property 20: SPA navigation
 * Validates: Requirements 5.3
 * 
 * Property: For any navigation action within the application, 
 * content should update without triggering a full page reload
 */

describe('SPA Navigation Property Tests', () => {
  let router: any

  beforeEach(() => {
    // Mock fetch globally
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const mockData: Record<string, any> = {
        '/data/hero.json': {
          title: 'Test Title',
          subtitle: 'Test Subtitle',
          description: 'Test Description',
          profile_image: '/test.jpg'
        },
        '/data/about.json': {
          title: 'About',
          description: 'About description',
          features: [
            { icon: 'users', title: 'Feature 1', description: 'Description 1' }
          ]
        },
        '/data/contacts.json': {
          email: 'test@test.com',
          telegram: 'https://t.me/test',
          github: 'https://github.com/test',
          resume: '/resume.pdf'
        }
      }
      
      return Promise.resolve({
        ok: true,
        json: async () => mockData[url] || {}
      } as Response)
    })

    // Create a fresh router for each test
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Home', component: Home },
        { path: '/projects', name: 'Projects', component: Services }
      ]
    })
  })

  it('should navigate without page reload', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('/', '/projects'),
        fc.constantFrom('/', '/projects'),
        async (fromRoute, toRoute) => {
          // Skip if routes are the same
          if (fromRoute === toRoute) return

          const wrapper = mount(App, {
            global: {
              plugins: [router],
              stubs: {
                LazyImage: {
                  template: '<img :src="src" :alt="alt" />',
                  props: ['src', 'alt']
                }
              }
            }
          })

          // Navigate to initial route
          await router.push(fromRoute)
          await router.isReady()
          await wrapper.vm.$nextTick()

          // Track if page reload occurs (in real browser, this would be window.location changes)
          const initialLocation = router.currentRoute.value.path
          
          // Navigate to target route
          await router.push(toRoute)
          await router.isReady()
          await wrapper.vm.$nextTick()

          // Verify navigation occurred without page reload
          expect(router.currentRoute.value.path).toBe(toRoute)
          expect(router.currentRoute.value.path).not.toBe(initialLocation)

          // Verify the component is mounted and functional (no page reload)
          expect(wrapper.vm).toBeDefined()
          expect(wrapper.exists()).toBe(true)

          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  }, 10000)

  it('should maintain application state during navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom('/', '/projects'), { minLength: 2, maxLength: 4 }),
        async (routes) => {
          const wrapper = mount(App, {
            global: {
              plugins: [router],
              stubs: {
                LazyImage: {
                  template: '<img :src="src" :alt="alt" />',
                  props: ['src', 'alt']
                }
              }
            }
          })

          // Wait for initial load
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 10))

          let previousComponentInstance = wrapper.vm

          // Navigate through all routes
          for (const route of routes) {
            await router.push(route)
            await router.isReady()
            await wrapper.vm.$nextTick()

            // Verify the app component instance is maintained (no page reload)
            expect(wrapper.vm).toBe(previousComponentInstance)
            expect(wrapper.exists()).toBe(true)
            
            // Verify route changed
            expect(router.currentRoute.value.path).toBe(route)
          }

          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  }, 10000)

  it('should update content without full page reload', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('/', '/projects'),
        async (route) => {
          const wrapper = mount(App, {
            global: {
              plugins: [router],
              stubs: {
                LazyImage: {
                  template: '<img :src="src" :alt="alt" />',
                  props: ['src', 'alt']
                }
              }
            }
          })

          // Start at home
          await router.push('/')
          await router.isReady()
          await wrapper.vm.$nextTick()

          const initialHTML = wrapper.html()

          // Navigate to target route
          await router.push(route)
          await router.isReady()
          await wrapper.vm.$nextTick()

          const newHTML = wrapper.html()

          // Content should change when navigating to different routes
          if (route !== '/') {
            expect(newHTML).not.toBe(initialHTML)
          }

          // But the wrapper should still exist (no page reload)
          expect(wrapper.exists()).toBe(true)
          expect(wrapper.vm).toBeDefined()

          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  }, 10000)

  it('should handle programmatic navigation changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('/', '/projects'),
        fc.constantFrom('/', '/projects'),
        async (route1, route2) => {
          // Skip if routes are the same
          if (route1 === route2) return

          const wrapper = mount(App, {
            global: {
              plugins: [router],
              stubs: {
                LazyImage: {
                  template: '<img :src="src" :alt="alt" />',
                  props: ['src', 'alt']
                }
              }
            }
          })

          // Navigate to first route
          await router.push(route1)
          await router.isReady()
          await wrapper.vm.$nextTick()

          expect(router.currentRoute.value.path).toBe(route1)

          // Navigate to second route
          await router.push(route2)
          await router.isReady()
          await wrapper.vm.$nextTick()

          expect(router.currentRoute.value.path).toBe(route2)

          // Navigate back to first route using replace (simulates SPA navigation)
          await router.replace(route1)
          await router.isReady()
          await wrapper.vm.$nextTick()

          expect(router.currentRoute.value.path).toBe(route1)

          // Verify app is still functional (no page reload)
          expect(wrapper.exists()).toBe(true)
          expect(wrapper.vm).toBeDefined()

          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  }, 10000)
})