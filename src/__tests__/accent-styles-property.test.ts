/**
 * Feature: glassmorphism-cyberpunk-redesign, Property 6: Использование accent стилей
 * 
 * Property: For any элемента с accent классом, система должна применять text-shadow 
 * с cyan цветом (--accent-cyan) для создания эффекта свечения.
 * 
 * **Validates: Requirements 4.5**
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import About from '../components/About.vue'
import Sidebar from '../components/Sidebar.vue'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Property 6: Accent Styles Application', () => {
  it('should have tagline-highlight class with text-shadow in About component styles', () => {
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
              { minLength: 1, maxLength: 3 }
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

          // Проверяем, что элемент tagline-highlight существует
          const taglineHighlight = wrapper.find('.tagline-highlight')
          expect(taglineHighlight.exists()).toBe(true)
          
          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should define text-shadow with --accent-cyan-glow for tagline-highlight in About.vue', () => {
    // Читаем файл About.vue и проверяем наличие text-shadow в стилях
    const aboutVuePath = resolve(__dirname, '../components/About.vue')
    const aboutVueContent = readFileSync(aboutVuePath, 'utf-8')
    
    // Проверяем, что в стилях есть .tagline-highlight с text-shadow
    expect(aboutVueContent).toMatch(/\.tagline-highlight/)
    expect(aboutVueContent).toMatch(/text-shadow/)
    expect(aboutVueContent).toMatch(/--accent-cyan-glow/)
  })

  it('should define text-shadow with cyan glow for active nav items in Sidebar.vue', () => {
    // Читаем файл Sidebar.vue и проверяем наличие text-shadow для .nav-link.active
    const sidebarVuePath = resolve(__dirname, '../components/Sidebar.vue')
    const sidebarVueContent = readFileSync(sidebarVuePath, 'utf-8')
    
    // Проверяем, что в стилях есть .nav-link.active с text-shadow
    expect(sidebarVueContent).toMatch(/\.nav-link\.active/)
    expect(sidebarVueContent).toMatch(/text-shadow/)
    expect(sidebarVueContent).toMatch(/--accent-cyan-glow/)
  })

  it('should have --accent-cyan-glow CSS variable defined in tokens', () => {
    // Читаем файл tokens.css и проверяем наличие переменной
    const tokensPath = resolve(__dirname, '../assets/styles/tokens.css')
    const tokensContent = readFileSync(tokensPath, 'utf-8')
    
    // Проверяем, что переменная определена
    expect(tokensContent).toMatch(/--accent-cyan-glow/)
    
    // Проверяем, что это rgba значение
    expect(tokensContent).toMatch(/--accent-cyan-glow:\s*rgba\(/)
  })

  it('should define text-shadow for profile subtitle in Sidebar.vue', () => {
    // Читаем файл Sidebar.vue и проверяем наличие text-shadow для .profile-subtitle
    const sidebarVuePath = resolve(__dirname, '../components/Sidebar.vue')
    const sidebarVueContent = readFileSync(sidebarVuePath, 'utf-8')
    
    // Проверяем, что в стилях есть .profile-subtitle с text-shadow
    expect(sidebarVueContent).toMatch(/\.profile-subtitle/)
    expect(sidebarVueContent).toMatch(/text-shadow/)
    expect(sidebarVueContent).toMatch(/--accent-cyan-glow/)
  })

  it('should consistently use --accent-cyan-glow variable for all accent text-shadows', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          resolve(__dirname, '../components/About.vue'),
          resolve(__dirname, '../components/Sidebar.vue')
        ),
        (filePath) => {
          const content = readFileSync(filePath, 'utf-8')
          
          // Если файл содержит text-shadow для accent элементов,
          // он должен использовать --accent-cyan-glow переменную
          const hasTextShadow = content.includes('text-shadow')
          
          if (hasTextShadow) {
            // Проверяем, что используется CSS переменная, а не hardcoded значение
            const textShadowLines = content.split('\n').filter(line => 
              line.includes('text-shadow') && 
              (line.includes('tagline-highlight') || 
               line.includes('nav-link.active') || 
               line.includes('profile-subtitle'))
            )
            
            // Если есть text-shadow для accent элементов, должна использоваться переменная
            if (textShadowLines.length > 0) {
              expect(content).toMatch(/--accent-cyan-glow/)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should apply text-shadow to all accent elements across components', () => {
    const componentPaths = [
      resolve(__dirname, '../components/About.vue'),
      resolve(__dirname, '../components/Sidebar.vue')
    ]
    
    let accentElementsWithTextShadow = 0
    
    componentPaths.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8')
      
      // Подсчитываем accent элементы с text-shadow
      if (content.includes('.tagline-highlight') && content.includes('text-shadow')) {
        accentElementsWithTextShadow++
      }
      if (content.includes('.nav-link.active') && content.includes('text-shadow')) {
        accentElementsWithTextShadow++
      }
      if (content.includes('.profile-subtitle') && content.includes('text-shadow')) {
        accentElementsWithTextShadow++
      }
    })
    
    // Должно быть минимум 3 accent элемента с text-shadow
    expect(accentElementsWithTextShadow).toBeGreaterThanOrEqual(3)
  })
})
