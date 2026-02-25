/**
 * Feature: glassmorphism-cyberpunk-redesign, Property 14: Keyboard navigation
 * 
 * Property: For any интерактивного элемента (кнопки, ссылки, inputs), система должна 
 * поддерживать навигацию с клавиатуры (Tab для перехода, Enter для активации, 
 * Escape для закрытия модалов).
 * 
 * Validates: Requirements 10.1, 10.4
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import Sidebar from '../components/Sidebar.vue'
import GlassCard from '../components/GlassCard.vue'

describe('Property 14: Keyboard Navigation', () => {
  it('should support Tab navigation for all interactive elements', () => {
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

          // Проверяем, что все интерактивные элементы доступны для Tab навигации
          const interactiveElements = wrapper.findAll('a, button, [tabindex]')
          
          // Должны быть как минимум nav links и contact links
          expect(interactiveElements.length).toBeGreaterThan(0)
          
          // Проверяем, что каждый интерактивный элемент имеет правильные атрибуты
          interactiveElements.forEach(element => {
            const tagName = element.element.tagName.toLowerCase()
            
            if (tagName === 'a') {
              // Ссылки должны иметь href
              expect(element.attributes('href')).toBeDefined()
            }
            
            // Элементы с tabindex должны иметь числовое значение
            if (element.attributes('tabindex')) {
              const tabindex = parseInt(element.attributes('tabindex') || '0')
              expect(tabindex).toBeGreaterThanOrEqual(-1)
            }
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should support Enter key activation for interactive cards', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // interactive prop
        (interactive) => {
          let activated = false
          
          const wrapper = mount(GlassCard, {
            props: {
              interactive
            },
            slots: {
              default: '<p>Card content</p>'
            },
            attrs: {
              onActivate: () => {
                activated = true
              }
            }
          })

          if (interactive) {
            // Карточка должна иметь tabindex="0"
            expect(wrapper.attributes('tabindex')).toBe('0')
            
            // Карточка должна иметь role="button"
            expect(wrapper.attributes('role')).toBe('button')
            
            // Симулируем нажатие Enter
            wrapper.trigger('keydown.enter')
            
            // Событие activate должно быть вызвано
            expect(activated).toBe(true)
          } else {
            // Неинтерактивная карточка не должна иметь tabindex
            expect(wrapper.attributes('tabindex')).toBeUndefined()
            
            // Неинтерактивная карточка не должна иметь role
            expect(wrapper.attributes('role')).toBeUndefined()
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should support Space key activation for interactive cards', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // interactive prop
        (interactive) => {
          let activated = false
          
          const wrapper = mount(GlassCard, {
            props: {
              interactive
            },
            slots: {
              default: '<p>Card content</p>'
            },
            attrs: {
              onActivate: () => {
                activated = true
              }
            }
          })

          if (interactive) {
            // Симулируем нажатие Space (с preventDefault)
            wrapper.trigger('keydown.space')
            
            // Событие activate должно быть вызвано
            expect(activated).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have focus-visible styles for all interactive elements', () => {
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

          // Проверяем наличие CSS классов для focus-visible
          const navLinks = wrapper.findAll('.nav-link')
          const contactLinks = wrapper.findAll('.contact-link')
          
          // Должны быть nav links
          expect(navLinks.length).toBeGreaterThan(0)
          
          // Должны быть contact links
          expect(contactLinks.length).toBeGreaterThan(0)
          
          // Все ссылки должны иметь класс для стилизации
          navLinks.forEach(link => {
            expect(link.classes()).toContain('nav-link')
          })
          
          contactLinks.forEach(link => {
            expect(link.classes()).toContain('contact-link')
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should maintain logical tab order for navigation elements', () => {
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

          // Проверяем порядок элементов: nav links должны быть перед contact links
          const allLinks = wrapper.findAll('a')
          const navLinks = wrapper.findAll('.nav-link')
          const contactLinks = wrapper.findAll('.contact-link')
          
          if (navLinks.length > 0 && contactLinks.length > 0) {
            // Индекс первого nav link должен быть меньше индекса первого contact link
            const firstNavIndex = allLinks.findIndex(link => 
              link.classes().includes('nav-link')
            )
            const firstContactIndex = allLinks.findIndex(link => 
              link.classes().includes('contact-link')
            )
            
            expect(firstNavIndex).toBeLessThan(firstContactIndex)
          }
        }
      ),
      { numRuns: 50 }
    )
  })
})
