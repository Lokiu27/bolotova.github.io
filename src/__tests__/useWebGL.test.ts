import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useWebGL } from '@/composables/useWebGL'

describe('useWebGL Composable', () => {
  let canvas: HTMLCanvasElement
  let mockContext: Partial<WebGLRenderingContext>

  beforeEach(() => {
    // Create a real canvas element
    canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600

    // Create mock WebGL context
    mockContext = {
      createShader: vi.fn(() => ({} as WebGLShader)),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn(() => true),
      getShaderInfoLog: vi.fn(() => ''),
      deleteShader: vi.fn(),
      createProgram: vi.fn(() => ({} as WebGLProgram)),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn(() => true),
      getProgramInfoLog: vi.fn(() => ''),
      deleteProgram: vi.fn(),
      createBuffer: vi.fn(() => ({} as WebGLBuffer)),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      viewport: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      useProgram: vi.fn(),
      getUniformLocation: vi.fn(() => ({} as WebGLUniformLocation)),
      uniform2f: vi.fn(),
      uniform4f: vi.fn(),
      getAttribLocation: vi.fn(() => 0),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      drawArrays: vi.fn(),
      deleteBuffer: vi.fn(),
      getExtension: vi.fn((name: string) => {
        if (name === 'WEBGL_lose_context') {
          return {
            loseContext: vi.fn()
          }
        }
        return null
      }),
      VERTEX_SHADER: 35633,
      FRAGMENT_SHADER: 35632,
      COMPILE_STATUS: 35713,
      LINK_STATUS: 35714,
      ARRAY_BUFFER: 34962,
      DYNAMIC_DRAW: 35048,
      COLOR_BUFFER_BIT: 16384,
      FLOAT: 5126,
      POINTS: 0
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('WebGL Context Initialization', () => {
    it('should initialize WebGL2 context when available', () => {
      // Mock WebGL2 support
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockImplementation((contextType: string) => {
        if (contextType === 'webgl2') {
          return mockContext as WebGL2RenderingContext
        }
        return null
      })

      const { init, isWebGLSupported } = useWebGL()
      const result = init(canvas)

      expect(result).toBe(true)
      expect(isWebGLSupported.value).toBe(true)
      expect(getContextSpy).toHaveBeenCalledWith('webgl2')
    })

    it('should fallback to WebGL1 when WebGL2 is not available', () => {
      // Mock WebGL1 support only
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockImplementation((contextType: string) => {
        if (contextType === 'webgl') {
          return mockContext as WebGLRenderingContext
        }
        return null
      })

      const { init, isWebGLSupported } = useWebGL()
      const result = init(canvas)

      expect(result).toBe(true)
      expect(isWebGLSupported.value).toBe(true)
      expect(getContextSpy).toHaveBeenCalledWith('webgl2')
      expect(getContextSpy).toHaveBeenCalledWith('webgl')
    })

    it('should return false and set isWebGLSupported to false when WebGL is not available', () => {
      // Mock no WebGL support
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(null)

      const { init, isWebGLSupported } = useWebGL()
      const result = init(canvas)

      expect(result).toBe(false)
      expect(isWebGLSupported.value).toBe(false)
    })

    it('should apply fallback background when WebGL is not available', () => {
      // Mock no WebGL support
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(null)

      const { init } = useWebGL()
      init(canvas)

      expect(canvas.style.background).toContain('radial-gradient')
      expect(canvas.style.background).toContain('#151921')
      expect(canvas.style.background).toContain('#090a0d')
    })
  })

  describe('Error Handling', () => {
    it('should handle getContext errors gracefully', () => {
      // Mock getContext throwing an error
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockImplementation(() => {
        throw new Error('WebGL context creation failed')
      })

      const onErrorMock = vi.fn()
      const { init, isWebGLSupported } = useWebGL({ onError: onErrorMock })
      const result = init(canvas)

      expect(result).toBe(false)
      expect(isWebGLSupported.value).toBe(false)
      expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle shader compilation errors', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      const failingContext = {
        ...mockContext,
        getShaderParameter: vi.fn(() => false), // Shader compilation failed
        getShaderInfoLog: vi.fn(() => 'Shader compilation error')
      }
      getContextSpy.mockReturnValue(failingContext as WebGLRenderingContext)

      const { init } = useWebGL()
      const result = init(canvas)

      expect(result).toBe(false)
    })

    it('should handle program linking errors', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      const failingContext = {
        ...mockContext,
        getProgramParameter: vi.fn(() => false), // Program linking failed
        getProgramInfoLog: vi.fn(() => 'Program linking error')
      }
      getContextSpy.mockReturnValue(failingContext as WebGLRenderingContext)

      const { init } = useWebGL()
      const result = init(canvas)

      expect(result).toBe(false)
    })

    it('should handle buffer creation failure', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      const failingContext = {
        ...mockContext,
        createBuffer: vi.fn(() => null) // Buffer creation failed
      }
      getContextSpy.mockReturnValue(failingContext as WebGLRenderingContext)

      const { init } = useWebGL()
      const result = init(canvas)

      expect(result).toBe(false)
    })
  })

  describe('Particle System', () => {
    it('should initialize with default particle count', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(mockContext as WebGLRenderingContext)

      const { init, particleCount } = useWebGL()
      init(canvas)

      expect(particleCount.value).toBe(100) // Default value
    })

    it('should initialize with custom particle count', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(mockContext as WebGLRenderingContext)

      const { init, particleCount } = useWebGL({ particleCount: 50 })
      init(canvas)

      expect(particleCount.value).toBe(50)
    })

    it('should update particle count dynamically', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(mockContext as WebGLRenderingContext)

      const { init, particleCount, updateParticleCount } = useWebGL()
      init(canvas)

      expect(particleCount.value).toBe(100)

      updateParticleCount(75)
      expect(particleCount.value).toBe(75)
    })
  })

  describe('Render Loop Control', () => {
    it('should start render loop', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(mockContext as WebGLRenderingContext)

      const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame')
      requestAnimationFrameSpy.mockReturnValue(1)

      const { init, start } = useWebGL()
      init(canvas)
      start()

      expect(requestAnimationFrameSpy).toHaveBeenCalled()
    })

    it('should stop render loop', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(mockContext as WebGLRenderingContext)

      const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame')
      requestAnimationFrameSpy.mockReturnValue(1)
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame')

      const { init, start, stop } = useWebGL()
      init(canvas)
      start()
      stop()

      expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(1)
    })

    it('should not start render loop if WebGL is not initialized', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(null)

      const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame')

      const { init, start } = useWebGL()
      init(canvas)
      start()

      expect(requestAnimationFrameSpy).not.toHaveBeenCalled()
    })
  })

  describe('Resource Cleanup', () => {
    it('should clean up WebGL resources on destroy', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(mockContext as WebGLRenderingContext)

      const { init, destroy } = useWebGL()
      init(canvas)
      destroy()

      expect(mockContext.deleteBuffer).toHaveBeenCalled()
      expect(mockContext.deleteProgram).toHaveBeenCalled()
    })

    it('should stop render loop on destroy', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(mockContext as WebGLRenderingContext)

      const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame')
      requestAnimationFrameSpy.mockReturnValue(1)
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame')

      const { init, start, destroy } = useWebGL()
      init(canvas)
      start()
      destroy()

      expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(1)
    })

    it('should reset canvas reference on destroy', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(mockContext as WebGLRenderingContext)

      const { init, destroy, canvas: canvasRef } = useWebGL()
      init(canvas)
      
      expect(canvasRef.value).not.toBeNull()
      
      destroy()
      
      expect(canvasRef.value).toBeNull()
    })
  })

  describe('Configuration Options', () => {
    it('should use custom particle speed', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(mockContext as WebGLRenderingContext)

      const { init } = useWebGL({ particleSpeed: 2.0 })
      const result = init(canvas)

      expect(result).toBe(true)
    })

    it('should use custom particle color', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockReturnValue(mockContext as WebGLRenderingContext)

      const { init } = useWebGL({ particleColor: '#ff00ff' })
      const result = init(canvas)

      expect(result).toBe(true)
    })

    it('should call onError callback when provided', () => {
      const getContextSpy = vi.spyOn(canvas, 'getContext')
      getContextSpy.mockImplementation(() => {
        throw new Error('Test error')
      })

      const onErrorMock = vi.fn()
      const { init } = useWebGL({ onError: onErrorMock })
      init(canvas)

      expect(onErrorMock).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Test error'
      }))
    })
  })
})
