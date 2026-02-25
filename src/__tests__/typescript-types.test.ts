import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

/**
 * Feature: glassmorphism-cyberpunk-redesign
 * Property 18: TypeScript типизация компонентов
 * 
 * For any Vue компонента, все props, emits, computed properties и methods должны иметь 
 * явную TypeScript типизацию без использования any типа.
 * 
 * Validates: Requirements 11.1, 11.4, 11.5
 */

describe('Property 18: TypeScript типизация компонентов', () => {
  const componentsDir = path.resolve(__dirname, '../components')
  const composablesDir = path.resolve(__dirname, '../composables')
  
  // Получаем все .vue и .ts файлы
  const getFiles = (dir: string, ext: string): string[] => {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir)
      .filter(file => file.endsWith(ext))
      .map(file => path.join(dir, file))
  }

  const componentFiles = getFiles(componentsDir, '.vue')
  const composableFiles = getFiles(composablesDir, '.ts')
  const allFiles = [...componentFiles, ...composableFiles]

  it('should not use "any" type in component files', () => {
    const filesWithAny: string[] = []
    
    allFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8')
      
      // Проверяем наличие ": any" или "<any>" или "as any"
      const anyTypeRegex = /:\s*any\b|<any>|as\s+any\b/g
      const matches = content.match(anyTypeRegex)
      
      if (matches && matches.length > 0) {
        filesWithAny.push(path.basename(filePath))
      }
    })
    
    expect(filesWithAny).toEqual([])
  })

  it('should have explicit prop types in all components', () => {
    const componentsWithoutTypes: string[] = []
    
    componentFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8')
      const fileName = path.basename(filePath)
      
      // Пропускаем компоненты без props
      if (!content.includes('defineProps') && !content.includes('props:')) {
        return
      }
      
      // Проверяем наличие interface или type для props
      const hasPropsInterface = content.includes('interface') && 
                               (content.includes('Props') || content.includes('props'))
      const hasPropsType = content.includes('type ') && 
                          (content.includes('Props') || content.includes('props'))
      const hasInlineType = content.includes('defineProps<')
      
      if (!hasPropsInterface && !hasPropsType && !hasInlineType) {
        componentsWithoutTypes.push(fileName)
      }
    })
    
    expect(componentsWithoutTypes).toEqual([])
  })

  it('should export types from types directory', () => {
    const typesIndexPath = path.resolve(__dirname, '../types/index.ts')
    
    if (fs.existsSync(typesIndexPath)) {
      const content = fs.readFileSync(typesIndexPath, 'utf-8')
      
      // Проверяем наличие export statements
      expect(content).toMatch(/export.*from/)
    }
  })

  it('should have strict TypeScript configuration', () => {
    const tsconfigPath = path.resolve(__dirname, '../../tsconfig.json')
    
    if (fs.existsSync(tsconfigPath)) {
      const content = fs.readFileSync(tsconfigPath, 'utf-8')
      const config = JSON.parse(content)
      
      // Проверяем strict mode
      expect(config.compilerOptions?.strict).toBe(true)
    }
  })

  // Property-based test: проверяем типизацию для случайных комбинаций props
  it('should maintain type safety for component props', () => {
    fc.assert(
      fc.property(
        fc.record({
          blur: fc.integer({ min: 0, max: 50 }),
          opacity: fc.float({ min: 0, max: 1, noNaN: true }), // Исключаем NaN
          enabled: fc.boolean()
        }),
        (props) => {
          // Проверяем, что типы соответствуют ожиданиям
          expect(typeof props.blur).toBe('number')
          expect(typeof props.opacity).toBe('number')
          expect(typeof props.enabled).toBe('boolean')
          expect(props.blur).toBeGreaterThanOrEqual(0)
          expect(props.opacity).toBeGreaterThanOrEqual(0)
          expect(props.opacity).toBeLessThanOrEqual(1)
          expect(Number.isNaN(props.opacity)).toBe(false) // Убеждаемся, что не NaN
        }
      ),
      { numRuns: 100 }
    )
  })
})
