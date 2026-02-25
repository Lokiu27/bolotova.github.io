/**
 * Unit Tests: ScanlineOverlay Component
 * Feature: glassmorphism-cyberpunk-redesign
 * Validates: Requirements 4.1, 10.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ScanlineOverlay from '@/components/ScanlineOverlay.vue'

describe('ScanlineOverlay Component - Unit Tests', () => {
  let matchMediaMock: any

  beforeEach(() => {
    // Mock window.matchMedia
    matchMediaMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
    
    vi.stubGlobal('matchMedia', vi.fn(() => matchMediaMock))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  describe('Overlay Rendering - Requirement 4.1', () => {
    /**
     * **Validates: Requirements 4.1**
     * Проверяет, что компонент рендерит overlay элемент
     */
    it('should render overlay element when enabled', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(true)
    })

    /**
     * **Validates: Requirements 4.1**
     * Проверяет, что overlay имеет правильные CSS классы
     */
    it('should apply correct CSS class to overlay', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.classes()).toContain('scanline-overlay')
    })

    /**
     * **Validates: Requirements 4.1**
     * Проверяет, что overlay имеет aria-hidden атрибут
     */
    it('should have aria-hidden attribute for accessibility', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.attributes('aria-hidden')).toBe('true')
    })

    /**
     * **Validates: Requirements 4.1**
     * Проверяет, что overlay не рендерится когда отключен
     */
    it('should not render overlay when disabled', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: false }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(false)
    })

    /**
     * **Validates: Requirements 4.1**
     * Проверяет, что overlay имеет правильную структуру
     */
    it('should have correct DOM structure', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(true)
      expect(overlay.element.tagName).toBe('DIV')
    })
  })

  describe('Opacity Prop - Requirement 4.1', () => {
    /**
     * **Validates: Requirements 4.1**
     * Проверяет применение opacity prop
     */
    it('should apply opacity prop to overlay', async () => {
      const customOpacity = 0.5
      const wrapper = mount(ScanlineOverlay, {
        props: {
          enabled: true,
          opacity: customOpacity
        }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      const element = overlay.element as HTMLElement
      
      expect(element.style.opacity).toBe(String(customOpacity))
    })

    /**
     * **Validates: Requirements 4.1**
     * Проверяет default значение opacity
     */
    it('should use default opacity value of 0.3', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      const element = overlay.element as HTMLElement
      
      expect(element.style.opacity).toBe('0.3')
    })

    /**
     * **Validates: Requirements 4.1**
     * Проверяет минимальное значение opacity (0)
     */
    it('should handle minimum opacity value of 0', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: {
          enabled: true,
          opacity: 0
        }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      const element = overlay.element as HTMLElement
      
      expect(element.style.opacity).toBe('0')
    })

    /**
     * **Validates: Requirements 4.1**
     * Проверяет максимальное значение opacity (1)
     */
    it('should handle maximum opacity value of 1', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: {
          enabled: true,
          opacity: 1
        }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      const element = overlay.element as HTMLElement
      
      expect(element.style.opacity).toBe('1')
    })

    /**
     * **Validates: Requirements 4.1**
     * Проверяет реактивность opacity prop
     */
    it('should react to opacity prop changes', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: {
          enabled: true,
          opacity: 0.3
        }
      })
      
      await nextTick()
      
      let overlay = wrapper.find('.scanline-overlay')
      let element = overlay.element as HTMLElement
      expect(element.style.opacity).toBe('0.3')
      
      // Change opacity
      await wrapper.setProps({ opacity: 0.7 })
      await nextTick()
      
      overlay = wrapper.find('.scanline-overlay')
      element = overlay.element as HTMLElement
      expect(element.style.opacity).toBe('0.7')
    })
  })

  describe('Line Height Prop - Requirement 4.1', () => {
    /**
     * **Validates: Requirements 4.1**
     * Проверяет применение lineHeight prop
     */
    it('should apply lineHeight prop to background-size', async () => {
      const customLineHeight = 8
      const wrapper = mount(ScanlineOverlay, {
        props: {
          enabled: true,
          lineHeight: customLineHeight
        }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      const element = overlay.element as HTMLElement
      
      expect(element.style.backgroundSize).toBe(`100% ${customLineHeight}px`)
    })

    /**
     * **Validates: Requirements 4.1**
     * Проверяет default значение lineHeight
     */
    it('should use default lineHeight value of 4px', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      const element = overlay.element as HTMLElement
      
      expect(element.style.backgroundSize).toBe('100% 4px')
    })

    /**
     * **Validates: Requirements 4.1**
     * Проверяет различные значения lineHeight
     */
    it('should handle different lineHeight values', async () => {
      const testValues = [2, 4, 6, 8, 10]
      
      for (const lineHeight of testValues) {
        const wrapper = mount(ScanlineOverlay, {
          props: {
            enabled: true,
            lineHeight
          }
        })
        
        await nextTick()
        
        const overlay = wrapper.find('.scanline-overlay')
        const element = overlay.element as HTMLElement
        
        expect(element.style.backgroundSize).toBe(`100% ${lineHeight}px`)
      }
    })

    /**
     * **Validates: Requirements 4.1**
     * Проверяет реактивность lineHeight prop
     */
    it('should react to lineHeight prop changes', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: {
          enabled: true,
          lineHeight: 4
        }
      })
      
      await nextTick()
      
      let overlay = wrapper.find('.scanline-overlay')
      let element = overlay.element as HTMLElement
      expect(element.style.backgroundSize).toBe('100% 4px')
      
      // Change lineHeight
      await wrapper.setProps({ lineHeight: 8 })
      await nextTick()
      
      overlay = wrapper.find('.scanline-overlay')
      element = overlay.element as HTMLElement
      expect(element.style.backgroundSize).toBe('100% 8px')
    })
  })

  describe('Prefers Reduced Motion - Requirement 10.5', () => {
    /**
     * **Validates: Requirements 10.5**
     * Проверяет скрытие overlay при prefers-reduced-motion
     */
    it('should hide overlay when prefers-reduced-motion is enabled', async () => {
      // Set matchMedia to return true for prefers-reduced-motion
      matchMediaMock.matches = true
      
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(false)
    })

    /**
     * **Validates: Requirements 10.5**
     * Проверяет отображение overlay когда prefers-reduced-motion отключен
     */
    it('should show overlay when prefers-reduced-motion is disabled', async () => {
      // Set matchMedia to return false for prefers-reduced-motion
      matchMediaMock.matches = false
      
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(true)
    })

    /**
     * **Validates: Requirements 10.5**
     * Проверяет, что компонент слушает изменения prefers-reduced-motion
     */
    it('should listen to prefers-reduced-motion changes', async () => {
      matchMediaMock.matches = false
      
      mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      // Verify addEventListener was called
      expect(matchMediaMock.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    /**
     * **Validates: Requirements 10.5**
     * Проверяет реактивность на изменение prefers-reduced-motion
     */
    it('should react to prefers-reduced-motion changes', async () => {
      matchMediaMock.matches = false
      
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      // Initially visible
      let overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(true)
      
      // Get the change handler
      const changeHandler = matchMediaMock.addEventListener.mock.calls[0][1]
      
      // Simulate prefers-reduced-motion being enabled
      changeHandler({ matches: true })
      await nextTick()
      
      // Should be hidden now
      overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(false)
    })

    /**
     * **Validates: Requirements 10.5**
     * Проверяет, что компонент очищает event listener при unmount
     */
    it('should cleanup event listener on unmount', async () => {
      matchMediaMock.matches = false
      
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      // Unmount the component
      wrapper.unmount()
      
      // Verify removeEventListener was called
      expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    /**
     * **Validates: Requirements 10.5**
     * Проверяет приоритет prefers-reduced-motion над enabled prop
     */
    it('should prioritize prefers-reduced-motion over enabled prop', async () => {
      matchMediaMock.matches = true
      
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      // Should be hidden despite enabled=true
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(false)
    })
  })

  describe('Props Handling', () => {
    /**
     * Проверяет, что компонент использует default значения props
     */
    it('should use default prop values', async () => {
      const wrapper = mount(ScanlineOverlay)
      
      await nextTick()
      
      // Component should mount successfully with defaults
      expect(wrapper.exists()).toBe(true)
      
      // Should be visible by default (enabled=true, prefers-reduced-motion=false)
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(true)
    })

    /**
     * Проверяет, что компонент принимает все props одновременно
     */
    it('should accept all props simultaneously', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: {
          enabled: true,
          opacity: 0.5,
          lineHeight: 6
        }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(true)
      
      const element = overlay.element as HTMLElement
      expect(element.style.opacity).toBe('0.5')
      expect(element.style.backgroundSize).toBe('100% 6px')
    })
  })

  describe('Reactive Behavior', () => {
    /**
     * Проверяет, что компонент реагирует на изменение enabled prop
     */
    it('should react to enabled prop changes', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: false }
      })
      
      await nextTick()
      
      // Initially hidden
      let overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(false)
      
      // Enable the component
      await wrapper.setProps({ enabled: true })
      await nextTick()
      
      // Should be visible now
      overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(true)
    })

    /**
     * Проверяет, что компонент скрывается при отключении
     */
    it('should hide when disabled', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      // Initially visible
      let overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(true)
      
      // Disable the component
      await wrapper.setProps({ enabled: false })
      await nextTick()
      
      // Should be hidden now
      overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(false)
    })

    /**
     * Проверяет, что компонент реагирует на множественные изменения props
     */
    it('should handle multiple prop changes', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: {
          enabled: true,
          opacity: 0.3,
          lineHeight: 4
        }
      })
      
      await nextTick()
      
      // Change all props
      await wrapper.setProps({
        enabled: true,
        opacity: 0.8,
        lineHeight: 10
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      const element = overlay.element as HTMLElement
      
      expect(element.style.opacity).toBe('0.8')
      expect(element.style.backgroundSize).toBe('100% 10px')
    })
  })

  describe('Edge Cases', () => {
    /**
     * Проверяет поведение при очень малом значении opacity
     */
    it('should handle very small opacity values', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: {
          enabled: true,
          opacity: 0.01
        }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(true)
      
      const element = overlay.element as HTMLElement
      expect(element.style.opacity).toBe('0.01')
    })

    /**
     * Проверяет поведение при очень большом значении lineHeight
     */
    it('should handle large lineHeight values', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: {
          enabled: true,
          lineHeight: 100
        }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      const element = overlay.element as HTMLElement
      
      expect(element.style.backgroundSize).toBe('100% 100px')
    })

    /**
     * Проверяет поведение при lineHeight равном 1
     */
    it('should handle minimum lineHeight value of 1', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: {
          enabled: true,
          lineHeight: 1
        }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      const element = overlay.element as HTMLElement
      
      expect(element.style.backgroundSize).toBe('100% 1px')
    })

    /**
     * Проверяет, что компонент обрабатывает отсутствие matchMedia
     */
    it('should handle missing matchMedia gracefully', async () => {
      // Remove matchMedia mock
      vi.unstubAllGlobals()
      
      // Mock matchMedia as undefined
      const originalMatchMedia = window.matchMedia
      // @ts-ignore
      delete window.matchMedia
      
      expect(() => {
        mount(ScanlineOverlay, {
          props: { enabled: true }
        })
      }).not.toThrow()
      
      // Restore
      window.matchMedia = originalMatchMedia
    })
  })

  describe('CSS Styles', () => {
    /**
     * Проверяет, что overlay имеет правильные inline стили
     */
    it('should apply inline styles for opacity and background-size', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: {
          enabled: true,
          opacity: 0.5,
          lineHeight: 8
        }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      const element = overlay.element as HTMLElement
      
      expect(element.style.opacity).toBe('0.5')
      expect(element.style.backgroundSize).toBe('100% 8px')
    })

    /**
     * Проверяет, что overlay имеет класс scanline-overlay
     */
    it('should have scanline-overlay class with scoped styles', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.exists()).toBe(true)
      expect(overlay.classes()).toContain('scanline-overlay')
    })

    /**
     * Проверяет, что overlay является div элементом
     */
    it('should render as a div element', async () => {
      const wrapper = mount(ScanlineOverlay, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      const overlay = wrapper.find('.scanline-overlay')
      expect(overlay.element.tagName).toBe('DIV')
    })
  })
})
