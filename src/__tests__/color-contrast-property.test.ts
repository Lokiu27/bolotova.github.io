/**
 * Feature: glassmorphism-cyberpunk-redesign, Property 15: Цветовой контраст для accessibility
 * 
 * Property: For any текстового элемента с основным контентом, контрастность между цветом 
 * текста и фона должна быть минимум 4.5:1 согласно WCAG AA стандарту.
 * 
 * Validates: Requirements 10.2
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  getContrastRatio,
  meetsWCAGAA,
  designTokenColors,
  validateDesignTokenContrast
} from '../utils/contrast'

describe('Property 15: Color Contrast for Accessibility', () => {
  it('should have contrast ratio ≥4.5:1 for all text/background combinations in design tokens', () => {
    const results = validateDesignTokenContrast()
    
    // Все комбинации должны соответствовать WCAG AA
    results.forEach(result => {
      expect(result.meetsAA).toBe(true)
      expect(result.ratio).toBeGreaterThanOrEqual(4.5)
    })
  })

  it('should maintain WCAG AA contrast for textPrimary on any background', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          designTokenColors.bgVoid,
          designTokenColors.bgPanel,
          designTokenColors.bgActive
        ),
        (bgColor) => {
          const ratio = getContrastRatio(designTokenColors.textPrimary, bgColor)
          
          // textPrimary должен иметь контраст ≥4.5:1 на любом фоне
          expect(ratio).toBeGreaterThanOrEqual(4.5)
          expect(meetsWCAGAA(designTokenColors.textPrimary, bgColor)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain WCAG AA contrast for textSecondary on any background', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          designTokenColors.bgVoid,
          designTokenColors.bgPanel,
          designTokenColors.bgActive
        ),
        (bgColor) => {
          const ratio = getContrastRatio(designTokenColors.textSecondary, bgColor)
          
          // textSecondary должен иметь контраст ≥4.5:1 на любом фоне
          expect(ratio).toBeGreaterThanOrEqual(4.5)
          expect(meetsWCAGAA(designTokenColors.textSecondary, bgColor)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain WCAG AA contrast for textTertiary on any background', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          designTokenColors.bgVoid,
          designTokenColors.bgPanel,
          designTokenColors.bgActive
        ),
        (bgColor) => {
          const ratio = getContrastRatio(designTokenColors.textTertiary, bgColor)
          
          // textTertiary должен иметь контраст ≥4.5:1 на любом фоне
          expect(ratio).toBeGreaterThanOrEqual(4.5)
          expect(meetsWCAGAA(designTokenColors.textTertiary, bgColor)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain WCAG AA contrast for accentCyan on any background', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          designTokenColors.bgVoid,
          designTokenColors.bgPanel,
          designTokenColors.bgActive
        ),
        (bgColor) => {
          const ratio = getContrastRatio(designTokenColors.accentCyan, bgColor)
          
          // accentCyan должен иметь контраст ≥4.5:1 на любом фоне
          expect(ratio).toBeGreaterThanOrEqual(4.5)
          expect(meetsWCAGAA(designTokenColors.accentCyan, bgColor)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have higher contrast for primary text than secondary text', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          designTokenColors.bgVoid,
          designTokenColors.bgPanel,
          designTokenColors.bgActive
        ),
        (bgColor) => {
          const primaryRatio = getContrastRatio(designTokenColors.textPrimary, bgColor)
          const secondaryRatio = getContrastRatio(designTokenColors.textSecondary, bgColor)
          
          // Primary текст должен иметь более высокий контраст чем secondary
          expect(primaryRatio).toBeGreaterThan(secondaryRatio)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have higher contrast for secondary text than tertiary text', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          designTokenColors.bgVoid,
          designTokenColors.bgPanel,
          designTokenColors.bgActive
        ),
        (bgColor) => {
          const secondaryRatio = getContrastRatio(designTokenColors.textSecondary, bgColor)
          const tertiaryRatio = getContrastRatio(designTokenColors.textTertiary, bgColor)
          
          // Secondary текст должен иметь более высокий контраст чем tertiary
          expect(secondaryRatio).toBeGreaterThan(tertiaryRatio)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain contrast hierarchy: primary > secondary > tertiary', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          designTokenColors.bgVoid,
          designTokenColors.bgPanel,
          designTokenColors.bgActive
        ),
        (bgColor) => {
          const primaryRatio = getContrastRatio(designTokenColors.textPrimary, bgColor)
          const secondaryRatio = getContrastRatio(designTokenColors.textSecondary, bgColor)
          const tertiaryRatio = getContrastRatio(designTokenColors.textTertiary, bgColor)
          
          // Должна соблюдаться иерархия контраста
          expect(primaryRatio).toBeGreaterThan(secondaryRatio)
          expect(secondaryRatio).toBeGreaterThan(tertiaryRatio)
          
          // И все должны соответствовать WCAG AA
          expect(primaryRatio).toBeGreaterThanOrEqual(4.5)
          expect(secondaryRatio).toBeGreaterThanOrEqual(4.5)
          expect(tertiaryRatio).toBeGreaterThanOrEqual(4.5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have excellent contrast for accent color (>10:1)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          designTokenColors.bgVoid,
          designTokenColors.bgPanel,
          designTokenColors.bgActive
        ),
        (bgColor) => {
          const ratio = getContrastRatio(designTokenColors.accentCyan, bgColor)
          
          // Accent цвет должен иметь отличный контраст (>10:1)
          expect(ratio).toBeGreaterThan(10)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate contrast ratio calculation is symmetric', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          designTokenColors.textPrimary,
          designTokenColors.textSecondary,
          designTokenColors.textTertiary,
          designTokenColors.accentCyan
        ),
        fc.constantFrom(
          designTokenColors.bgVoid,
          designTokenColors.bgPanel,
          designTokenColors.bgActive
        ),
        (color1, color2) => {
          const ratio1 = getContrastRatio(color1, color2)
          const ratio2 = getContrastRatio(color2, color1)
          
          // Контраст должен быть симметричным
          expect(Math.abs(ratio1 - ratio2)).toBeLessThan(0.01)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have all design token combinations documented and validated', () => {
    const results = validateDesignTokenContrast()
    
    // Должно быть 12 комбинаций (4 текстовых цвета × 3 фоновых цвета)
    expect(results.length).toBe(12)
    
    // Каждая комбинация должна иметь все необходимые поля
    results.forEach(result => {
      expect(result.combination).toBeDefined()
      expect(result.ratio).toBeGreaterThan(0)
      expect(typeof result.meetsAA).toBe('boolean')
      expect(typeof result.meetsAAA).toBe('boolean')
    })
  })
})
