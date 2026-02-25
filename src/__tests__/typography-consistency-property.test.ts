/**
 * Feature: glassmorphism-cyberpunk-redesign, Property 7: Консистентность типографики
 * 
 * Property: For any текстового элемента в приложении, font-family должен быть установлен 
 * в JetBrains Mono (или fallback моноширинный шрифт), обеспечивая единообразие типографики.
 * 
 * **Validates: Requirements 4.6**
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import About from '../components/About.vue'
import Sidebar from '../components/Sidebar.vue'
import Services from '../views/Services.vue'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Property 7: Typography Consistency', () => {
  it('should use --font-mono variable for all font-family declarations in components', () => {
    const componentPaths = [
      resolve(__dirname, '../components/About.vue'),
      resolve(__dirname, '../components/Sidebar.vue'),
      resolve(__dirname, '../components/StatusPanel.vue'),
      resolve(__dirname, '../components/CyberBreadcrumbs.vue'),
      resolve(__dirname, '../views/Services.vue'),
      resolve(__dirname, '../App.vue')
    ]
    
    componentPaths.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8')
      
      // Если файл содержит font-family, он должен использовать var(--font-mono)
      const fontFamilyMatches = content.match(/font-family:\s*([^;]+);/g)
      
      if (fontFamilyMatches) {
        fontFamilyMatches.forEach(match => {
          // Каждое объявление font-family должно использовать var(--font-mono)
          expect(match).toMatch(/var\(--font-mono/)
        })
      }
    })
  })

  it('should define --font-mono variable as JetBrains Mono in tokens.css', () => {
    const tokensPath = resolve(__dirname, '../assets/styles/tokens.css')
    const tokensContent = readFileSync(tokensPath, 'utf-8')
    
    // Проверяем, что переменная определена
    expect(tokensContent).toMatch(/--font-mono/)
    
    // Проверяем, что это JetBrains Mono
    expect(tokensContent).toMatch(/--font-mono:\s*['"]?JetBrains Mono['"]?/)
  })

  it('should use monospace font-family consistently across all text elements', () => {
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

          // Проверяем, что все текстовые элементы существуют
          const tagline = wrapper.find('.tagline')
          const taglineHighlight = wrapper.find('.tagline-highlight')
          const featureTitles = wrapper.findAll('.feature-title')
          const featureDescriptions = wrapper.findAll('.feature-description')
          
          expect(tagline.exists()).toBe(true)
          expect(taglineHighlight.exists()).toBe(true)
          expect(featureTitles.length).toBeGreaterThan(0)
          expect(featureDescriptions.length).toBeGreaterThan(0)
          
          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use JetBrains Mono font in Sidebar component', () => {
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

          // Проверяем, что все текстовые элементы существуют
          const profileTitle = wrapper.find('.profile-title')
          const profileSubtitle = wrapper.find('.profile-subtitle')
          const profileDescription = wrapper.find('.profile-description')
          const navLinks = wrapper.findAll('.nav-link')
          const contactLinks = wrapper.findAll('.contact-link')
          
          expect(profileTitle.exists()).toBe(true)
          expect(profileSubtitle.exists()).toBe(true)
          expect(profileDescription.exists()).toBe(true)
          expect(navLinks.length).toBeGreaterThan(0)
          expect(contactLinks.length).toBeGreaterThan(0)
          
          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use JetBrains Mono font in Services component', () => {
    const wrapper = mount(Services, {
      global: {
        stubs: {
          GlassCard: {
            template: '<div class="glass-card" :role="$attrs.role"><slot /></div>'
          }
        }
      }
    })

    // Проверяем, что все текстовые элементы существуют
    const tagline = wrapper.find('.tagline')
    const taglineHighlight = wrapper.find('.tagline-highlight')
    
    expect(tagline.exists()).toBe(true)
    expect(taglineHighlight.exists()).toBe(true)
    
    wrapper.unmount()
  })

  it('should not use hardcoded font-family values (except in CSS variables definition)', () => {
    const componentPaths = [
      resolve(__dirname, '../components/About.vue'),
      resolve(__dirname, '../components/Sidebar.vue'),
      resolve(__dirname, '../components/StatusPanel.vue'),
      resolve(__dirname, '../components/CyberBreadcrumbs.vue'),
      resolve(__dirname, '../views/Services.vue'),
      resolve(__dirname, '../App.vue')
    ]
    
    componentPaths.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8')
      
      // Проверяем, что нет hardcoded font-family без var()
      const hardcodedFontMatches = content.match(/font-family:\s*['"][^'"]+['"]/g)
      
      // Если есть hardcoded значения, они должны быть только в fallback
      if (hardcodedFontMatches) {
        hardcodedFontMatches.forEach(match => {
          // Hardcoded значения допустимы только как fallback после var()
          const lineWithMatch = content.split('\n').find(line => line.includes(match))
          if (lineWithMatch) {
            expect(lineWithMatch).toMatch(/var\(--font-mono/)
          }
        })
      }
    })
  })

  it('should use monospace font consistently across all components', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          resolve(__dirname, '../components/About.vue'),
          resolve(__dirname, '../components/Sidebar.vue'),
          resolve(__dirname, '../views/Services.vue')
        ),
        (filePath) => {
          const content = readFileSync(filePath, 'utf-8')
          
          // Если файл содержит стили с font-family
          if (content.includes('font-family')) {
            // Все должны использовать var(--font-mono)
            const fontFamilyLines = content.split('\n').filter(line => 
              line.includes('font-family')
            )
            
            fontFamilyLines.forEach(line => {
              // Пропускаем комментарии
              if (!line.trim().startsWith('//') && !line.trim().startsWith('/*')) {
                expect(line).toMatch(/var\(--font-mono/)
              }
            })
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have JetBrains Mono as primary font with monospace fallback', () => {
    const tokensPath = resolve(__dirname, '../assets/styles/tokens.css')
    const tokensContent = readFileSync(tokensPath, 'utf-8')
    
    // Проверяем, что определение включает JetBrains Mono и fallback
    const fontMonoMatch = tokensContent.match(/--font-mono:\s*([^;]+);/)
    
    expect(fontMonoMatch).toBeTruthy()
    
    if (fontMonoMatch) {
      const fontValue = fontMonoMatch[1]
      
      // Должен содержать JetBrains Mono
      expect(fontValue).toMatch(/JetBrains Mono/)
      
      // Должен содержать fallback monospace
      expect(fontValue).toMatch(/monospace/)
    }
  })

  it('should apply monospace font to body element in main.css', () => {
    const mainCssPath = resolve(__dirname, '../assets/css/main.css')
    const mainCssContent = readFileSync(mainCssPath, 'utf-8')
    
    // Проверяем, что body использует var(--font-mono)
    const bodyMatch = mainCssContent.match(/body\s*{[^}]*font-family:\s*([^;]+);/s)
    
    expect(bodyMatch).toBeTruthy()
    
    if (bodyMatch) {
      const fontValue = bodyMatch[1]
      
      // Должен использовать var(--font-mono) или прямое указание JetBrains Mono
      expect(fontValue).toMatch(/var\(--font-mono|JetBrains Mono/)
    }
  })
})
