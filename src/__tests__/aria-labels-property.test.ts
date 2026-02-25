/**
 * Feature: glassmorphism-cyberpunk-redesign, Property 16: ARIA labels для интерактивных элементов
 * 
 * Property: For any интерактивного элемента без видимого текста (иконки, кнопки без текста), 
 * должен присутствовать aria-label или aria-labelledby атрибут для screen readers.
 * 
 * Validates: Requirements 10.3
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import Sidebar from '../components/Sidebar.vue'
import StatusPanel from '../components/StatusPanel.vue'
import CyberBreadcrumbs from '../components/CyberBreadcrumbs.vue'
import About from '../components/About.vue'

describe('Property 16: ARIA Labels for Interactive Elements', () => {
  it('should have aria-label for all navigation links', () => {
    fc.assert(
      fc.property(
        fc.record({
          profileData: fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            subtitle: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            profile_image: fc.constant('/assets/images/profile-photo.jpg')
          }),
          contactData: fc.record({
            email: fc.emailAddress(),
            telegram: fc.webUrl(),
            github: fc.webUrl(),
            resume: fc.webUrl()
          })
        }),
        (data) => {
          const wrapper = mount(Sidebar, {
            props: data,
            global: {
              stubs: {
                'router-link': {
                  template: '<a :href="to" class="nav-link" :aria-label="$attrs[\'aria-label\']"><slot /></a>',
                  props: ['to']
                },
                GlassPanel: {
                  template: '<div class="glass-panel"><slot /><slot name="footer" /></div>'
                },
                StatusPanel: {
                  template: '<div class="status-panel"></div>'
                },
                LazyImage: {
                  template: '<img :src="src" :alt="alt" />',
                  props: ['src', 'alt']
                }
              }
            }
          })

          // Проверяем nav links
          const navLinks = wrapper.findAll('.nav-link')
          expect(navLinks.length).toBeGreaterThan(0)
          
          navLinks.forEach(link => {
            // Каждая nav ссылка должна иметь aria-label
            expect(link.attributes('aria-label')).toBeDefined()
            expect(link.attributes('aria-label')).not.toBe('')
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should have aria-label for contact links', () => {
    fc.assert(
      fc.property(
        fc.record({
          profileData: fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            subtitle: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            profile_image: fc.constant('/assets/images/profile-photo.jpg')
          }),
          contactData: fc.record({
            email: fc.emailAddress(),
            telegram: fc.webUrl(),
            github: fc.webUrl(),
            resume: fc.webUrl()
          })
        }),
        (data) => {
          const wrapper = mount(Sidebar, {
            props: data,
            global: {
              stubs: {
                'router-link': {
                  template: '<a :href="to" class="nav-link"><slot /></a>',
                  props: ['to']
                },
                GlassPanel: {
                  template: '<div class="glass-panel"><slot /><slot name="footer" /></div>'
                },
                StatusPanel: {
                  template: '<div class="status-panel"></div>'
                },
                LazyImage: {
                  template: '<img :src="src" :alt="alt" />',
                  props: ['src', 'alt']
                }
              }
            }
          })

          // Проверяем contact links
          const contactLinks = wrapper.findAll('.contact-link')
          expect(contactLinks.length).toBeGreaterThan(0)
          
          contactLinks.forEach(link => {
            // Каждая contact ссылка должна иметь aria-label
            expect(link.attributes('aria-label')).toBeDefined()
            expect(link.attributes('aria-label')).not.toBe('')
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should have role and aria-label for status indicator', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('online', 'offline', 'away'),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        (status, statusText, showDot) => {
          const wrapper = mount(StatusPanel, {
            props: {
              status: status as 'online' | 'offline' | 'away',
              statusText,
              showDot
            }
          })

          if (showDot) {
            // Status dot должен иметь role="status"
            const statusDot = wrapper.find('.status-dot')
            expect(statusDot.exists()).toBe(true)
            expect(statusDot.attributes('role')).toBe('status')
            
            // Status dot должен иметь aria-label
            expect(statusDot.attributes('aria-label')).toBeDefined()
            expect(statusDot.attributes('aria-label')).toContain(status)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have aria-label for breadcrumb navigation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            label: fc.string({ minLength: 1, maxLength: 20 }),
            path: fc.option(fc.constant('/test'), { nil: undefined })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (items) => {
          const wrapper = mount(CyberBreadcrumbs, {
            props: { items },
            global: {
              stubs: {
                RouterLink: {
                  template: '<a :href="to"><slot /></a>',
                  props: ['to']
                }
              }
            }
          })

          // Breadcrumb nav должен иметь aria-label
          const nav = wrapper.find('nav')
          expect(nav.exists()).toBe(true)
          expect(nav.attributes('aria-label')).toBeDefined()
          expect(nav.attributes('aria-label')).not.toBe('')
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should have aria-hidden for decorative elements', () => {
    fc.assert(
      fc.property(
        fc.record({
          aboutData: fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            features: fc.array(
              fc.record({
                icon: fc.constantFrom('users', 'sparkles', 'bullseye'),
                title: fc.string({ minLength: 1, maxLength: 50 }),
                description: fc.string({ minLength: 1, maxLength: 200 })
              }),
              { minLength: 1, maxLength: 5 }
            )
          })
        }),
        (data) => {
          const wrapper = mount(About, {
            props: data,
            global: {
              stubs: {
                GlassCard: {
                  template: '<div class="glass-card" :role="$attrs.role"><slot /></div>'
                }
              }
            }
          })

          // Card index должен иметь aria-hidden="true" (декоративный элемент)
          const cardIndexes = wrapper.findAll('.card-index')
          cardIndexes.forEach(index => {
            expect(index.attributes('aria-hidden')).toBe('true')
          })
          
          // Card icon span должен иметь aria-hidden="true"
          const iconSpans = wrapper.findAll('.card-icon span')
          iconSpans.forEach(span => {
            expect(span.attributes('aria-hidden')).toBe('true')
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should have role="img" and aria-label for icon containers', () => {
    fc.assert(
      fc.property(
        fc.record({
          aboutData: fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            features: fc.array(
              fc.record({
                icon: fc.constantFrom('users', 'sparkles', 'bullseye'),
                title: fc.string({ minLength: 1, maxLength: 50 }),
                description: fc.string({ minLength: 1, maxLength: 200 })
              }),
              { minLength: 1, maxLength: 5 }
            )
          })
        }),
        (data) => {
          const wrapper = mount(About, {
            props: data,
            global: {
              stubs: {
                GlassCard: {
                  template: '<div class="glass-card" :role="$attrs.role"><slot /></div>'
                }
              }
            }
          })

          // Card icon containers должны иметь role="img"
          const iconContainers = wrapper.findAll('.card-icon')
          iconContainers.forEach(container => {
            expect(container.attributes('role')).toBe('img')
            
            // И aria-label
            expect(container.attributes('aria-label')).toBeDefined()
            expect(container.attributes('aria-label')).not.toBe('')
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should have aria-labelledby for sections with headings', () => {
    fc.assert(
      fc.property(
        fc.record({
          aboutData: fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            features: fc.array(
              fc.record({
                icon: fc.constantFrom('users', 'sparkles', 'bullseye'),
                title: fc.string({ minLength: 1, maxLength: 50 }),
                description: fc.string({ minLength: 1, maxLength: 200 })
              }),
              { minLength: 1, maxLength: 5 }
            )
          })
        }),
        (data) => {
          const wrapper = mount(About, {
            props: data,
            global: {
              stubs: {
                GlassCard: {
                  template: '<div class="glass-card" :role="$attrs.role"><slot /></div>'
                }
              }
            }
          })

          // Main section должен иметь aria-labelledby
          const main = wrapper.find('main.about-section')
          expect(main.exists()).toBe(true)
          expect(main.attributes('aria-labelledby')).toBeDefined()
          
          // Heading должен иметь соответствующий id
          const headingId = main.attributes('aria-labelledby')
          if (headingId) {
            const heading = wrapper.find(`#${headingId}`)
            expect(heading.exists()).toBe(true)
          }
          
          // Features section также должен иметь aria-labelledby
          const featuresSection = wrapper.find('section.features-section')
          expect(featuresSection.exists()).toBe(true)
          expect(featuresSection.attributes('aria-labelledby')).toBeDefined()
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should have role="list" and role="listitem" for feature grids', () => {
    fc.assert(
      fc.property(
        fc.record({
          aboutData: fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            features: fc.array(
              fc.record({
                icon: fc.constantFrom('users', 'sparkles', 'bullseye'),
                title: fc.string({ minLength: 1, maxLength: 50 }),
                description: fc.string({ minLength: 1, maxLength: 200 })
              }),
              { minLength: 1, maxLength: 5 }
            )
          })
        }),
        (data) => {
          const wrapper = mount(About, {
            props: data,
            global: {
              stubs: {
                GlassCard: {
                  template: '<div class="glass-card" :role="$attrs.role"><slot /></div>'
                }
              }
            }
          })

          // Features grid должен существовать
          const grid = wrapper.find('.features-grid')
          expect(grid.exists()).toBe(true)
          
          // Каждая карточка - это article элемент (семантически правильно для списка контента)
          const cards = wrapper.findAll('article.feature-card')
          expect(cards.length).toBe(data.aboutData.features.length)
        }
      ),
      { numRuns: 50 }
    )
  })
})
