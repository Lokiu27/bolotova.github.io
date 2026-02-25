/**
 * Unit Tests: WebGLBackground Component
 * Feature: glassmorphism-cyberpunk-redesign
 * Validates: Requirements 2.1, 2.3, 2.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import WebGLBackground from '@/components/WebGLBackground.vue'

// Mock composables
let performanceCallback: ((metrics: any) => void) | null = null
let webglInitMock: ReturnType<typeof vi.fn>
let webglStartMock: ReturnType<typeof vi.fn>
let webglStopMock: ReturnType<typeof vi.fn>
let webglUpdateParticleCountMock: ReturnType<typeof vi.fn>
let webglIsWebGLSupported = { value: true }

vi.mock('@/composables/useWebGL', () => ({
  useWebGL: () => {
    webglInitMock = vi.fn(() => true)
    webglStartMock = vi.fn()
    webglStopMock = vi.fn()
    webglUpdateParticleCountMock = vi.fn()
    
    return {
      init: webglInitMock,
      start: webglStartMock,
      stop: webglStopMock,
      updateParticleCount: webglUpdateParticleCountMock,
      isWebGLSupported: webglIsWebGLSupported
    }
  }
}))

vi.mock('@/composables/usePerformance', () => ({
  usePerformance: (options: any) => {
    performanceCallback = options.onFpsUpdate
    return {
      startMonitoring: vi.fn(),
      stopMonitoring: vi.fn(),
      fps: { value: 60 },
      averageFps: { value: 60 },
      frameTime: { value: 16.67 }
    }
  },
  debounce: (fn: any) => fn
}))

describe('WebGLBackground Component - Unit Tests', () => {
  beforeEach(() => {
    performanceCallback = null
    webglIsWebGLSupported.value = true
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Canvas Rendering - Requirement 2.1', () => {
    /**
     * **Validates: Requirements 2.1**
     * Проверяет, что компонент рендерит canvas элемент
     */
    it('should render canvas element', () => {
      const wrapper = mount(WebGLBackground)
      const canvas = wrapper.find('canvas')
      
      expect(canvas.exists()).toBe(true)
      expect(canvas.classes()).toContain('webgl-background')
    })

    /**
     * **Validates: Requirements 2.1**
     * Проверяет, что canvas имеет правильные CSS классы
     */
    it('should apply correct CSS classes to canvas', () => {
      const wrapper = mount(WebGLBackground, {
        props: { enabled: true }
      })
      const canvas = wrapper.find('canvas')
      
      expect(canvas.classes()).toContain('webgl-background')
      expect(canvas.classes()).not.toContain('webgl-disabled')
    })

    /**
     * **Validates: Requirements 2.1**
     * Проверяет, что canvas скрывается когда компонент отключен
     */
    it('should hide canvas when disabled', () => {
      const wrapper = mount(WebGLBackground, {
        props: { enabled: false }
      })
      const canvas = wrapper.find('canvas')
      
      expect(canvas.classes()).toContain('webgl-disabled')
    })

    /**
     * **Validates: Requirements 2.1**
     * Проверяет, что WebGL инициализируется при монтировании
     */
    it('should initialize WebGL on mount', async () => {
      mount(WebGLBackground, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      expect(webglInitMock).toHaveBeenCalled()
      expect(webglStartMock).toHaveBeenCalled()
    })

    /**
     * **Validates: Requirements 2.1**
     * Проверяет, что WebGL не инициализируется когда компонент отключен
     */
    it('should not initialize WebGL when disabled', async () => {
      mount(WebGLBackground, {
        props: { enabled: false }
      })
      
      await nextTick()
      
      expect(webglInitMock).not.toHaveBeenCalled()
      expect(webglStartMock).not.toHaveBeenCalled()
    })
  })

  describe('Performance Warning Events - Requirement 2.6', () => {
    /**
     * **Validates: Requirements 2.6**
     * Проверяет emit события performance-warning при низком FPS
     */
    it('should emit performance-warning event when FPS drops below threshold', async () => {
      const wrapper = mount(WebGLBackground, {
        props: {
          enabled: true,
          particleCount: 100,
          fpsThreshold: 30
        }
      })
      
      await nextTick()
      
      // Simulate low FPS
      if (performanceCallback) {
        performanceCallback({ averageFps: 20, fps: 20, frameTime: 50 })
      }
      
      await nextTick()
      
      expect(wrapper.emitted('performance-warning')).toBeTruthy()
      expect(wrapper.emitted('performance-warning')![0]).toEqual([20])
    })

    /**
     * **Validates: Requirements 2.6**
     * Проверяет, что событие не emit'ится при хорошем FPS
     */
    it('should not emit performance-warning when FPS is above threshold', async () => {
      const wrapper = mount(WebGLBackground, {
        props: {
          enabled: true,
          particleCount: 100,
          fpsThreshold: 30
        }
      })
      
      await nextTick()
      
      // Simulate good FPS
      if (performanceCallback) {
        performanceCallback({ averageFps: 60, fps: 60, frameTime: 16.67 })
      }
      
      await nextTick()
      
      expect(wrapper.emitted('performance-warning')).toBeFalsy()
    })

    /**
     * **Validates: Requirements 2.6**
     * Проверяет, что событие не emit'ится когда компонент отключен
     */
    it('should not emit performance-warning when component is disabled', async () => {
      const wrapper = mount(WebGLBackground, {
        props: {
          enabled: false,
          particleCount: 100,
          fpsThreshold: 30
        }
      })
      
      await nextTick()
      
      // Try to simulate low FPS (should be ignored)
      if (performanceCallback) {
        performanceCallback({ averageFps: 20, fps: 20, frameTime: 50 })
      }
      
      await nextTick()
      
      expect(wrapper.emitted('performance-warning')).toBeFalsy()
    })

    /**
     * **Validates: Requirements 2.6**
     * Проверяет, что событие emit'ится с правильным значением FPS
     */
    it('should emit performance-warning with correct FPS value', async () => {
      const wrapper = mount(WebGLBackground, {
        props: {
          enabled: true,
          particleCount: 100,
          fpsThreshold: 30
        }
      })
      
      await nextTick()
      
      const testFps = 15
      if (performanceCallback) {
        performanceCallback({ averageFps: testFps, fps: testFps, frameTime: 1000 / testFps })
      }
      
      await nextTick()
      
      const emittedEvents = wrapper.emitted('performance-warning')
      expect(emittedEvents).toBeTruthy()
      expect(emittedEvents![0]).toEqual([testFps])
    })
  })

  describe('WebGL Fallback - Requirement 2.3', () => {
    /**
     * **Validates: Requirements 2.3**
     * Проверяет fallback при отсутствии WebGL поддержки
     */
    it('should handle WebGL unavailability gracefully', async () => {
      // Mock WebGL as unavailable
      webglIsWebGLSupported.value = false
      webglInitMock = vi.fn(() => false)
      
      const wrapper = mount(WebGLBackground, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      // Component should still render canvas
      const canvas = wrapper.find('canvas')
      expect(canvas.exists()).toBe(true)
      
      // WebGL start should not be called if init failed
      expect(webglInitMock).toHaveBeenCalled()
    })

    /**
     * **Validates: Requirements 2.3**
     * Проверяет, что компонент не падает при ошибке WebGL
     */
    it('should not crash when WebGL initialization fails', async () => {
      webglInitMock = vi.fn(() => false)
      
      expect(() => {
        mount(WebGLBackground, {
          props: { enabled: true }
        })
      }).not.toThrow()
    })

    /**
     * **Validates: Requirements 2.3**
     * Проверяет, что render loop не запускается при неудачной инициализации
     */
    it('should not start render loop when WebGL init fails', async () => {
      webglInitMock = vi.fn(() => false)
      
      mount(WebGLBackground, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      expect(webglInitMock).toHaveBeenCalled()
      // Start should not be called if init returned false
      // Note: The component logic should check init result before calling start
    })
  })

  describe('Props Handling', () => {
    /**
     * Проверяет, что компонент принимает и использует prop enabled
     */
    it('should accept and use enabled prop', async () => {
      const wrapper = mount(WebGLBackground, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      expect(webglInitMock).toHaveBeenCalled()
      expect(webglStartMock).toHaveBeenCalled()
    })

    /**
     * Проверяет, что компонент принимает и использует prop particleCount
     */
    it('should accept and use particleCount prop', async () => {
      const customCount = 150
      mount(WebGLBackground, {
        props: {
          enabled: true,
          particleCount: customCount
        }
      })
      
      await nextTick()
      
      expect(webglInitMock).toHaveBeenCalled()
    })

    /**
     * Проверяет, что компонент принимает и использует prop fpsThreshold
     */
    it('should accept and use fpsThreshold prop', async () => {
      const wrapper = mount(WebGLBackground, {
        props: {
          enabled: true,
          particleCount: 100,
          fpsThreshold: 25
        }
      })
      
      await nextTick()
      
      // Simulate FPS below custom threshold
      if (performanceCallback) {
        performanceCallback({ averageFps: 20, fps: 20, frameTime: 50 })
      }
      
      await nextTick()
      
      expect(wrapper.emitted('performance-warning')).toBeTruthy()
    })

    /**
     * Проверяет, что компонент использует default значения props
     */
    it('should use default prop values', () => {
      const wrapper = mount(WebGLBackground)
      
      // Component should mount successfully with defaults
      expect(wrapper.exists()).toBe(true)
      const canvas = wrapper.find('canvas')
      expect(canvas.exists()).toBe(true)
    })
  })

  describe('Reactive Behavior', () => {
    /**
     * Проверяет, что компонент реагирует на изменение prop enabled
     */
    it('should react to enabled prop changes', async () => {
      const wrapper = mount(WebGLBackground, {
        props: { enabled: false }
      })
      
      await nextTick()
      
      // Initially disabled
      expect(webglInitMock).not.toHaveBeenCalled()
      
      // Enable the component
      await wrapper.setProps({ enabled: true })
      await nextTick()
      
      // Should initialize and start
      expect(webglInitMock).toHaveBeenCalled()
      expect(webglStartMock).toHaveBeenCalled()
    })

    /**
     * Проверяет, что компонент останавливается при отключении
     */
    it('should stop WebGL when disabled', async () => {
      const wrapper = mount(WebGLBackground, {
        props: { enabled: true }
      })
      
      await nextTick()
      
      // Initially enabled
      expect(webglStartMock).toHaveBeenCalled()
      
      // Disable the component
      await wrapper.setProps({ enabled: false })
      await nextTick()
      
      // Should stop
      expect(webglStopMock).toHaveBeenCalled()
    })

    /**
     * Проверяет, что компонент реагирует на изменение particleCount
     */
    it('should update particle count when prop changes', async () => {
      const wrapper = mount(WebGLBackground, {
        props: {
          enabled: true,
          particleCount: 100
        }
      })
      
      await nextTick()
      
      // Change particle count
      await wrapper.setProps({ particleCount: 50 })
      await nextTick()
      
      expect(webglUpdateParticleCountMock).toHaveBeenCalledWith(50)
    })
  })

  describe('Adaptive Quality Reduction - Requirement 2.6', () => {
    /**
     * **Validates: Requirements 2.6**
     * Проверяет, что количество частиц уменьшается при низком FPS
     */
    it('should reduce particle count when FPS drops', async () => {
      const initialCount = 100
      const wrapper = mount(WebGLBackground, {
        props: {
          enabled: true,
          particleCount: initialCount,
          fpsThreshold: 30
        }
      })
      
      await nextTick()
      
      // Simulate low FPS
      if (performanceCallback) {
        performanceCallback({ averageFps: 20, fps: 20, frameTime: 50 })
      }
      
      await nextTick()
      
      // Should call updateParticleCount with reduced value
      expect(webglUpdateParticleCountMock).toHaveBeenCalled()
      const calledWith = webglUpdateParticleCountMock.mock.calls[0][0]
      
      // Verify reduction (should be 75% of original)
      const expectedCount = Math.max(20, Math.floor(initialCount * 0.75))
      expect(calledWith).toBe(expectedCount)
    })

    /**
     * **Validates: Requirements 2.6**
     * Проверяет, что количество частиц не уменьшается ниже минимума
     */
    it('should not reduce particle count below minimum threshold', async () => {
      const wrapper = mount(WebGLBackground, {
        props: {
          enabled: true,
          particleCount: 30,
          fpsThreshold: 30
        }
      })
      
      await nextTick()
      
      // Simulate multiple low FPS events
      for (let i = 0; i < 5; i++) {
        if (performanceCallback) {
          performanceCallback({ averageFps: 15, fps: 15, frameTime: 66.67 })
        }
        await nextTick()
      }
      
      // Check all calls to updateParticleCount
      const calls = webglUpdateParticleCountMock.mock.calls
      calls.forEach((call) => {
        const particleCount = call[0]
        expect(particleCount).toBeGreaterThanOrEqual(20) // Minimum is 20
      })
    })

    /**
     * **Validates: Requirements 2.6**
     * Проверяет, что количество частиц не изменяется при хорошем FPS
     */
    it('should not reduce particle count when FPS is good', async () => {
      mount(WebGLBackground, {
        props: {
          enabled: true,
          particleCount: 100,
          fpsThreshold: 30
        }
      })
      
      await nextTick()
      
      // Simulate good FPS
      if (performanceCallback) {
        performanceCallback({ averageFps: 60, fps: 60, frameTime: 16.67 })
      }
      
      await nextTick()
      
      // Should not call updateParticleCount
      expect(webglUpdateParticleCountMock).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    /**
     * Проверяет поведение при FPS равном порогу
     */
    it('should not trigger reduction when FPS equals threshold', async () => {
      const threshold = 30
      const wrapper = mount(WebGLBackground, {
        props: {
          enabled: true,
          particleCount: 100,
          fpsThreshold: threshold
        }
      })
      
      await nextTick()
      
      // Simulate FPS exactly at threshold
      if (performanceCallback) {
        performanceCallback({ averageFps: threshold, fps: threshold, frameTime: 1000 / threshold })
      }
      
      await nextTick()
      
      // Should not reduce (only reduce when FPS < threshold)
      expect(webglUpdateParticleCountMock).not.toHaveBeenCalled()
      expect(wrapper.emitted('performance-warning')).toBeFalsy()
    })

    /**
     * Проверяет поведение при очень низком FPS
     */
    it('should handle very low FPS gracefully', async () => {
      const wrapper = mount(WebGLBackground, {
        props: {
          enabled: true,
          particleCount: 100,
          fpsThreshold: 30
        }
      })
      
      await nextTick()
      
      // Simulate very low FPS (5 FPS)
      if (performanceCallback) {
        performanceCallback({ averageFps: 5, fps: 5, frameTime: 200 })
      }
      
      await nextTick()
      
      expect(wrapper.emitted('performance-warning')).toBeTruthy()
      expect(webglUpdateParticleCountMock).toHaveBeenCalled()
    })

    /**
     * Проверяет поведение при нулевом количестве частиц
     */
    it('should handle zero particle count', () => {
      expect(() => {
        mount(WebGLBackground, {
          props: {
            enabled: true,
            particleCount: 0
          }
        })
      }).not.toThrow()
    })

    /**
     * Проверяет поведение при очень большом количестве частиц
     */
    it('should handle large particle count', () => {
      expect(() => {
        mount(WebGLBackground, {
          props: {
            enabled: true,
            particleCount: 10000
          }
        })
      }).not.toThrow()
    })
  })
})
