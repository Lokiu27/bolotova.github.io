import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface GlassEffectOptions {
  blur?: number
  opacity?: number
  borderOpacity?: number
  glowOnHover?: boolean
  cyberCorners?: boolean
}

export interface GlassEffectStyles {
  background: string
  backdropFilter: string
  border: string
  boxShadow?: string
}

export interface UseGlassEffectReturn {
  isHovered: Ref<boolean>
  glassStyles: ComputedRef<GlassEffectStyles>
  hoverStyles: ComputedRef<GlassEffectStyles>
  handleMouseEnter: () => void
  handleMouseLeave: () => void
  getRgbaBackground: (opacity: number) => string
}

/**
 * Composable for glass effect styling and hover interactions
 * @param options - Configuration options
 * @returns Glass effect utilities and styles
 */
export function useGlassEffect(options: GlassEffectOptions = {}): UseGlassEffectReturn {
  const {
    blur = 10,
    opacity = 0.1,
    borderOpacity = 0.2,
    glowOnHover = true,
    cyberCorners = true
  } = options

  const isHovered = ref(false)

  /**
   * Convert opacity value to rgba background color
   * @param opacity - Opacity value between 0 and 1
   * @returns rgba color string
   */
  function getRgbaBackground(opacity: number): string {
    // Base color: #0e1116 (14, 17, 22)
    const r = 14
    const g = 17
    const b = 22
    const clampedOpacity = Math.max(0, Math.min(1, opacity))
    return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`
  }

  /**
   * Base glass styles (always applied)
   */
  const glassStyles = computed<GlassEffectStyles>(() => ({
    background: getRgbaBackground(opacity),
    backdropFilter: `blur(${blur}px)`,
    border: `1px solid rgba(61, 68, 80, ${borderOpacity})`
  }))

  /**
   * Hover-specific styles (applied when hovered)
   */
  const hoverStyles = computed<GlassEffectStyles>(() => {
    const styles: GlassEffectStyles = {
      background: getRgbaBackground(opacity),
      backdropFilter: `blur(${blur}px)`,
      border: '1px solid var(--accent-cyan, #00f0ff)'
    }

    if (glowOnHover && isHovered.value) {
      styles.boxShadow = '0 0 20px rgba(0, 240, 255, 0.3)'
    }

    return styles
  })

  /**
   * Handle mouse enter event
   */
  function handleMouseEnter() {
    isHovered.value = true
  }

  /**
   * Handle mouse leave event
   */
  function handleMouseLeave() {
    isHovered.value = false
  }

  return {
    isHovered,
    glassStyles,
    hoverStyles,
    handleMouseEnter,
    handleMouseLeave,
    getRgbaBackground
  }
}

/**
 * Generate cyber corner styles for pseudo-elements
 * @param isVisible - Whether corners should be visible
 * @returns CSS properties object for corners
 */
export function getCyberCornerStyles(isVisible: boolean) {
  return {
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.3s ease'
  }
}

/**
 * Calculate glow intensity based on hover state
 * @param isHovered - Whether element is hovered
 * @param baseIntensity - Base glow intensity (0-1)
 * @returns Glow intensity value
 */
export function calculateGlowIntensity(isHovered: boolean, baseIntensity: number = 0.3): number {
  return isHovered ? baseIntensity : 0
}
