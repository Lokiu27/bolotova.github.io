/**
 * Утилиты для проверки цветового контраста согласно WCAG AA стандарту
 */

/**
 * Конвертирует hex цвет в RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result || !result[1] || !result[2] || !result[3]) {
    return null
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  }
}

/**
 * Вычисляет относительную яркость цвета
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255
  const gsRGB = g / 255
  const bsRGB = b / 255

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/**
 * Вычисляет контрастность между двумя цветами
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format')
  }

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b)
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Проверяет, соответствует ли контраст WCAG AA стандарту (4.5:1 для обычного текста)
 */
export function meetsWCAGAA(color1: string, color2: string): boolean {
  const ratio = getContrastRatio(color1, color2)
  return ratio >= 4.5
}

/**
 * Проверяет, соответствует ли контраст WCAG AAA стандарту (7:1 для обычного текста)
 */
export function meetsWCAGAAA(color1: string, color2: string): boolean {
  const ratio = getContrastRatio(color1, color2)
  return ratio >= 7
}

/**
 * Проверяет, соответствует ли контраст WCAG AA стандарту для крупного текста (3:1)
 */
export function meetsWCAGAALargeText(color1: string, color2: string): boolean {
  const ratio = getContrastRatio(color1, color2)
  return ratio >= 3
}

/**
 * Дизайн-токены цветов из tokens.css
 */
export const designTokenColors = {
  // Фон
  bgVoid: '#090a0d',
  bgPanel: '#0e1116',
  bgActive: '#151921',
  
  // Границы
  borderDim: '#232730',
  borderBright: '#3d4450',
  
  // Акцентные цвета
  accentCyan: '#00f0ff',
  
  // Текст
  textPrimary: '#e0e0e0',
  textSecondary: '#858b99',
  textTertiary: '#7a8290' // Скорректировано для WCAG AA
}

/**
 * Проверяет все комбинации текст/фон в дизайн-токенах
 */
export function validateDesignTokenContrast(): {
  combination: string
  ratio: number
  meetsAA: boolean
  meetsAAA: boolean
}[] {
  const results: {
    combination: string
    ratio: number
    meetsAA: boolean
    meetsAAA: boolean
  }[] = []

  const textColors = [
    { name: 'textPrimary', value: designTokenColors.textPrimary },
    { name: 'textSecondary', value: designTokenColors.textSecondary },
    { name: 'textTertiary', value: designTokenColors.textTertiary },
    { name: 'accentCyan', value: designTokenColors.accentCyan }
  ]

  const bgColors = [
    { name: 'bgVoid', value: designTokenColors.bgVoid },
    { name: 'bgPanel', value: designTokenColors.bgPanel },
    { name: 'bgActive', value: designTokenColors.bgActive }
  ]

  for (const text of textColors) {
    for (const bg of bgColors) {
      const ratio = getContrastRatio(text.value, bg.value)
      results.push({
        combination: `${text.name} on ${bg.name}`,
        ratio: Math.round(ratio * 100) / 100,
        meetsAA: ratio >= 4.5,
        meetsAAA: ratio >= 7
      })
    }
  }

  return results
}
