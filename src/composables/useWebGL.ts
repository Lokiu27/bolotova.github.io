import { ref, onUnmounted } from 'vue'

/**
 * Represents a single particle in the WebGL system
 */
export interface Particle {
  /** X position */
  x: number
  /** Y position */
  y: number
  /** X velocity */
  vx: number
  /** Y velocity */
  vy: number
}

/**
 * Configuration options for useWebGL composable
 */
export interface UseWebGLOptions {
  /** Initial number of particles (default: 100) */
  particleCount?: number
  /** Particle movement speed multiplier (default: 0.5) */
  particleSpeed?: number
  /** Particle color in hex format (default: '#00f0ff') */
  particleColor?: string
  /** Error callback function */
  onError?: (error: Error) => void
}

/**
 * Return type for useWebGL composable
 */
export interface UseWebGLReturn {
  /** Canvas element reference */
  canvas: ReturnType<typeof ref<HTMLCanvasElement | null>>
  /** Whether WebGL is supported in the browser */
  isWebGLSupported: ReturnType<typeof ref<boolean>>
  /** Current particle count */
  particleCount: ReturnType<typeof ref<number>>
  /** Initialize WebGL context with canvas element */
  init: (canvasElement: HTMLCanvasElement) => boolean
  /** Start rendering loop */
  start: () => void
  /** Stop rendering loop */
  stop: () => void
  /** Update particle count dynamically */
  updateParticleCount: (count: number) => void
  /** Clean up resources */
  destroy: () => void
}

/**
 * Composable for WebGL particle system rendering
 * 
 * Provides a complete WebGL particle system with automatic fallback,
 * performance monitoring, and resource cleanup.
 * 
 * @param options - Configuration options for the WebGL system
 * @returns WebGL rendering utilities and state
 * 
 * @example
 * ```ts
 * const webgl = useWebGL({
 *   particleCount: 150,
 *   particleSpeed: 0.8,
 *   particleColor: '#00f0ff',
 *   onError: (err) => console.error(err)
 * })
 * 
 * webgl.init(canvasElement)
 * webgl.start()
 * ```
 */
export function useWebGL(options: UseWebGLOptions = {}): UseWebGLReturn {
  const {
    particleCount: initialParticleCount = 100,
    particleSpeed = 0.5,
    particleColor = '#00f0ff',
    onError
  } = options

  const canvas = ref<HTMLCanvasElement | null>(null)
  const isWebGLSupported = ref(false)
  const particleCount = ref(initialParticleCount)

  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
  let animationFrameId: number | null = null
  let particles: Particle[] = []
  let vertexBuffer: WebGLBuffer | null = null
  let program: WebGLProgram | null = null

  /**
   * Initialize WebGL context with fallback strategy
   */
  function initWebGLContext(canvasElement: HTMLCanvasElement): WebGLRenderingContext | WebGL2RenderingContext | null {
    try {
      // Try WebGL2 first
      let context = canvasElement.getContext('webgl2') as WebGL2RenderingContext | null
      
      if (context) {
        isWebGLSupported.value = true
        return context
      }

      // Fallback to WebGL1
      context = canvasElement.getContext('webgl') as WebGL2RenderingContext | null
      
      if (context) {
        isWebGLSupported.value = true
        return context
      }

      // No WebGL support
      isWebGLSupported.value = false
      return null
    } catch (error) {
      isWebGLSupported.value = false
      if (onError) {
        onError(error as Error)
      }
      return null
    }
  }

  /**
   * Compile shader from source
   */
  function compileShader(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    source: string,
    type: number
  ): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) return null

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }

    return shader
  }

  /**
   * Create and link shader program
   */
  function createProgram(
    gl: WebGLRenderingContext | WebGL2RenderingContext
  ): WebGLProgram | null {
    const vertexShaderSource = `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      
      void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        gl_PointSize = 2.0;
      }
    `

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec4 u_color;
      
      void main() {
        gl_FragColor = u_color;
      }
    `

    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER)
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER)

    if (!vertexShader || !fragmentShader) {
      return null
    }

    const shaderProgram = gl.createProgram()
    if (!shaderProgram) return null

    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(shaderProgram))
      gl.deleteProgram(shaderProgram)
      return null
    }

    // Shaders can be deleted after linking as they are no longer needed
    // The program retains the compiled shader code
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    return shaderProgram
  }

  /**
   * Initialize particle system
   */
  function initParticles(count: number, width: number, height: number) {
    particles = []
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * particleSpeed,
        vy: (Math.random() - 0.5) * particleSpeed
      })
    }
  }

  /**
   * Update particle positions
   */
  function updateParticles(width: number, height: number) {
    for (const particle of particles) {
      particle.x += particle.vx
      particle.y += particle.vy

      // Wrap around screen edges
      if (particle.x < 0) particle.x = width
      if (particle.x > width) particle.x = 0
      if (particle.y < 0) particle.y = height
      if (particle.y > height) particle.y = 0
    }
  }

  /**
   * Render particles
   */
  function render() {
    if (!gl || !canvas.value || !program) return

    const width = canvas.value.width
    const height = canvas.value.height

    // Update particle positions
    updateParticles(width, height)

    // Clear canvas
    gl.viewport(0, 0, width, height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Use shader program
    gl.useProgram(program)

    // Set uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    gl.uniform2f(resolutionLocation, width, height)

    const colorLocation = gl.getUniformLocation(program, 'u_color')
    // Parse hex color to rgba
    const r = parseInt(particleColor.slice(1, 3), 16) / 255
    const g = parseInt(particleColor.slice(3, 5), 16) / 255
    const b = parseInt(particleColor.slice(5, 7), 16) / 255
    gl.uniform4f(colorLocation, r, g, b, 0.6)

    // Update vertex buffer with particle positions
    const positions = new Float32Array(particles.flatMap(p => [p.x, p.y]))
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW)

    // Set up attribute
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    // Draw particles
    gl.drawArrays(gl.POINTS, 0, particles.length)

    // Continue render loop
    animationFrameId = requestAnimationFrame(render)
  }

  /**
   * Initialize WebGL and particle system
   */
  function init(canvasElement: HTMLCanvasElement): boolean {
    canvas.value = canvasElement

    // Initialize WebGL context
    gl = initWebGLContext(canvasElement)
    if (!gl) {
      // Apply fallback background
      canvasElement.style.background = 'radial-gradient(circle at 50% 50%, #151921 0%, #090a0d 100%)'
      return false
    }

    // Create shader program
    program = createProgram(gl)
    if (!program) {
      console.error('Failed to create shader program')
      return false
    }

    // Create vertex buffer
    vertexBuffer = gl.createBuffer()
    if (!vertexBuffer) {
      console.error('Failed to create vertex buffer')
      return false
    }

    // Initialize particles
    initParticles(particleCount.value, canvasElement.width, canvasElement.height)

    return true
  }

  /**
   * Start render loop
   */
  function start() {
    if (animationFrameId === null && gl) {
      animationFrameId = requestAnimationFrame(render)
    }
  }

  /**
   * Stop render loop
   */
  function stop() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  /**
   * Update particle count dynamically
   */
  function updateParticleCount(count: number) {
    particleCount.value = count
    if (canvas.value) {
      initParticles(count, canvas.value.width, canvas.value.height)
    }
  }

  /**
   * Clean up resources
   */
  function destroy() {
    stop()

    if (gl && vertexBuffer) {
      gl.deleteBuffer(vertexBuffer)
      vertexBuffer = null
    }

    if (gl && program) {
      gl.deleteProgram(program)
      program = null
    }

    // Force WebGL context release
    if (gl) {
      const loseContextExt = gl.getExtension('WEBGL_lose_context')
      if (loseContextExt) {
        loseContextExt.loseContext()
      }
      gl = null
    }

    canvas.value = null
    particles = []
  }

  onUnmounted(() => {
    destroy()
  })

  return {
    canvas,
    isWebGLSupported,
    particleCount,
    init,
    start,
    stop,
    updateParticleCount,
    destroy
  }
}
