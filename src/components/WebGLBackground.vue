<script setup lang="ts">
/**
 * WebGLBackground Component
 * 
 * Renders an animated WebGL particle system as a background layer.
 * Features adaptive quality reduction based on FPS monitoring and
 * automatic pause when not visible in viewport.
 * 
 * @component
 * @example
 * ```vue
 * <WebGLBackground 
 *   :enabled="true"
 *   :particle-count="150"
 *   :particle-speed="0.8"
 *   :fps-threshold="30"
 *   @performance-warning="handleLowFps"
 * />
 * ```
 */
import { ref, onMounted, watch } from 'vue'
import { useWebGL } from '@/composables/useWebGL'
import { usePerformance, debounce } from '@/composables/usePerformance'
import { useIntersectionObserver } from '@/composables/useIntersectionObserver'

/**
 * Props for the WebGLBackground component
 */
interface WebGLBackgroundProps {
  /** Enable/disable WebGL rendering (default: true) */
  enabled?: boolean
  /** Number of particles to render (default: 100) */
  particleCount?: number
  /** Particle movement speed multiplier (default: 0.5) */
  particleSpeed?: number
  /** Particle color in hex format (default: '#00f0ff') */
  particleColor?: string
  /** FPS threshold for quality reduction (default: 30) */
  fpsThreshold?: number
}

/**
 * Emits for the WebGLBackground component
 */
interface WebGLBackgroundEmits {
  /** Emitted when FPS drops below threshold with current FPS value */
  (e: 'performance-warning', fps: number): void
}

const props = withDefaults(defineProps<WebGLBackgroundProps>(), {
  enabled: true,
  particleCount: 100,
  particleSpeed: 0.5,
  particleColor: '#00f0ff',
  fpsThreshold: 30
})

const emit = defineEmits<WebGLBackgroundEmits>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const currentParticleCount = ref(props.particleCount)
const minParticleCount = 20
const isAnimationPaused = ref(false)

// Initialize Intersection Observer to pause animations when not visible
const { isIntersecting } = useIntersectionObserver(canvasRef, {
  threshold: 0,
  onIntersect: (intersecting) => {
    if (!props.enabled) return
    
    if (intersecting && isAnimationPaused.value) {
      // Resume animations when component becomes visible
      webgl.start()
      performance.startMonitoring()
      isAnimationPaused.value = false
    } else if (!intersecting && !isAnimationPaused.value) {
      // Pause animations when component is not visible
      webgl.stop()
      performance.stopMonitoring()
      isAnimationPaused.value = true
    }
  }
})

// Initialize composables
const webgl = useWebGL({
  particleCount: props.particleCount,
  particleSpeed: props.particleSpeed,
  particleColor: props.particleColor,
  onError: (error) => {
    console.warn('WebGL initialization error:', error)
  }
})

const performance = usePerformance({
  sampleSize: 60,
  onFpsUpdate: (metrics) => {
    handlePerformanceUpdate(metrics.averageFps)
  }
})

/**
 * Handle performance updates and adaptive quality reduction
 */
function handlePerformanceUpdate(avgFps: number) {
  if (!props.enabled) return

  // If FPS drops below threshold, reduce particle count
  if (avgFps < props.fpsThreshold && currentParticleCount.value > minParticleCount) {
    const newCount = Math.max(minParticleCount, Math.floor(currentParticleCount.value * 0.75))
    currentParticleCount.value = newCount
    webgl.updateParticleCount(newCount)
    
    // Emit performance warning
    emit('performance-warning', avgFps)
    
    console.warn(`Performance degradation detected (${avgFps} FPS). Reducing particles to ${newCount}`)
  }
}

/**
 * Resize canvas to match window size
 */
function resizeCanvas() {
  if (!canvasRef.value) return

  const dpr = window.devicePixelRatio || 1
  canvasRef.value.width = window.innerWidth * dpr
  canvasRef.value.height = window.innerHeight * dpr
  canvasRef.value.style.width = `${window.innerWidth}px`
  canvasRef.value.style.height = `${window.innerHeight}px`
}

/**
 * Initialize WebGL background
 */
function initializeWebGL() {
  if (!canvasRef.value || !props.enabled) return

  resizeCanvas()

  const success = webgl.init(canvasRef.value)
  
  if (success) {
    webgl.start()
    performance.startMonitoring()
  }
}

// Debounced resize handler
const debouncedResize = debounce(() => {
  if (props.enabled && webgl.isWebGLSupported.value) {
    webgl.stop()
    performance.stopMonitoring()
    initializeWebGL()
  }
}, 300)

onMounted(() => {
  initializeWebGL()
  window.addEventListener('resize', debouncedResize)
})

// Watch enabled prop to start/stop rendering
watch(() => props.enabled, (newValue) => {
  if (newValue) {
    initializeWebGL()
  } else {
    webgl.stop()
    performance.stopMonitoring()
  }
})

// Watch particle count prop changes
watch(() => props.particleCount, (newCount) => {
  currentParticleCount.value = newCount
  webgl.updateParticleCount(newCount)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="webgl-background"
    :class="{ 'webgl-disabled': !enabled }"
    role="presentation"
    aria-hidden="true"
  />
</template>

<style scoped>
.webgl-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.webgl-disabled {
  display: none;
}
</style>
