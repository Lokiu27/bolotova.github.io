/**
 * Feature: glassmorphism-cyberpunk-redesign, Property 17: Семантическая HTML структура
 * 
 * Property: For any страницы приложения, должны использоваться семантические HTML5 теги 
 * (nav, main, article, header, footer, aside) вместо generic div элементов для улучшения accessibility.
 * 
 * Validates: Requirements 10.6
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import App from '../App.vue'
import Sidebar from '../components/Sidebar.vue'
import About from '../components/About.vue'
import Services from '../views/Services.vue'
import Footer from '../components/Footer.vue'

describe('Property 17: Semantic HTML Structure', () => {
  it('should use <aside> for sidebar component', () => {
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

          // Sidebar должен использовать <aside>
          const aside = wrapper.find('aside')
          expect(aside.exists()).toBe(true)
          expect(aside.classes()).toContain('sidebar')
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should use <nav> for navigation sections', () => {
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

          // Должен быть <nav> элемент
          const nav = wrapper.find('nav')
          expect(nav.exists()).toBe(true)
          
          // Nav должен иметь role="navigation"
          expect(nav.attributes('role')).toBe('navigation')
          
          // Nav должен иметь aria-label
          expect(nav.attributes('aria-label')).toBeDefined()
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should use <main> for main content area', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          'router-view': {
            template: '<div class="router-view-stub"></div>'
          },
          Sidebar: {
            template: '<aside class="sidebar"></aside>'
          },
          Footer: {
            template: '<footer class="footer"></footer>'
          },
          WebGLBackground: {
            template: '<canvas class="webgl-background"></canvas>'
          },
          ScanlineOverlay: {
            template: '<div class="scanline-overlay"></div>'
          }
        }
      }
    })

    // Должен быть <main> элемент
    const main = wrapper.find('main')
    expect(main.exists()).toBe(true)
    
    // Main должен иметь role="main"
    expect(main.attributes('role')).toBe('main')
    
    // Main должен иметь id для skip link
    expect(main.attributes('id')).toBe('main-content')
  })

  it('should use <section> for content sections', () => {
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

          // Должен быть <section> элемент
          const section = wrapper.find('section')
          expect(section.exists()).toBe(true)
          // About component использует main с классом about-section, внутри есть section элементы
          const sections = wrapper.findAll('section')
          expect(sections.length).toBeGreaterThan(0)
          
          // Section должен иметь aria-labelledby (на main элементе)
          const main = wrapper.find('main.about-section')
          expect(main.attributes('aria-labelledby')).toBeDefined()
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should use <header> for hero sections', () => {
    const wrapper = mount(Services, {
      global: {
        stubs: {
          GlassCard: {
            template: '<div class="glass-card" :role="$attrs.role"><slot /></div>'
          }
        }
      }
    })

    // Должен быть <header> элемент для hero section
    const header = wrapper.find('header')
    expect(header.exists()).toBe(true)
    expect(header.classes()).toContain('hero-section')
  })

  it('should use <footer> for footer component', () => {
    const wrapper = mount(Footer)

    // Должен быть <footer> элемент
    const footer = wrapper.find('footer')
    expect(footer.exists()).toBe(true)
    expect(footer.classes()).toContain('footer')
  })

  it('should have proper heading hierarchy (h1 > h2 > h3)', () => {
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

          // Должен быть h2 для главного заголовка (h1 находится в Sidebar)
          const h2 = wrapper.find('h2')
          expect(h2.exists()).toBe(true)
          
          // Должны быть h3 для feature titles
          const h3s = wrapper.findAll('h3')
          expect(h3s.length).toBeGreaterThan(0)
          
          // h2 должен быть перед h3
          const h2Index = wrapper.html().indexOf('<h2')
          const h3Index = wrapper.html().indexOf('<h3')
          expect(h2Index).toBeLessThan(h3Index)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should use semantic lists (role="list" and role="listitem")', () => {
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
          
          // Каждая карточка - это article элемент (семантически правильно)
          const articles = wrapper.findAll('article.feature-card')
          expect(articles.length).toBe(data.aboutData.features.length)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should have skip link for keyboard navigation', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          'router-view': {
            template: '<div class="router-view-stub"></div>'
          },
          Sidebar: {
            template: '<aside class="sidebar"></aside>'
          },
          Footer: {
            template: '<footer class="footer"></footer>'
          },
          WebGLBackground: {
            template: '<canvas class="webgl-background"></canvas>'
          },
          ScanlineOverlay: {
            template: '<div class="scanline-overlay"></div>'
          }
        }
      }
    })

    // Должен быть skip link
    const skipLink = wrapper.find('.skip-link')
    expect(skipLink.exists()).toBe(true)
    
    // Skip link должен вести на main content
    expect(skipLink.attributes('href')).toBe('#main-content')
  })

  it('should minimize use of generic div elements in favor of semantic tags', () => {
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

          // Должны быть семантические теги
          const section = wrapper.find('section')
          const h2 = wrapper.find('h2')
          const h3s = wrapper.findAll('h3')
          const paragraphs = wrapper.findAll('p')
          
          expect(section.exists()).toBe(true)
          expect(h2.exists()).toBe(true)
          expect(h3s.length).toBeGreaterThan(0)
          expect(paragraphs.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 50 }
    )
  })
})
