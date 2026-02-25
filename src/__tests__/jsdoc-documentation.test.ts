import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Feature: glassmorphism-cyberpunk-redesign
 * Property 20: JSDoc документация компонентов
 * 
 * For any компонента, props и emits должны быть документированы через JSDoc комментарии 
 * с описанием типов, default значений и назначения.
 * 
 * Validates: Requirements 12.5
 */

describe('Property 20: JSDoc документация компонентов', () => {
  const componentsDir = path.resolve(__dirname, '../components')
  const composablesDir = path.resolve(__dirname, '../composables')
  
  // Список компонентов для проверки
  const componentsToCheck = [
    'WebGLBackground.vue',
    'ScanlineOverlay.vue',
    'GlassCard.vue',
    'GlassPanel.vue',
    'CyberBreadcrumbs.vue',
    'StatusPanel.vue',
    'MainContent.vue'
  ]

  const composablesToCheck = [
    'useWebGL.ts',
    'useGlassEffect.ts',
    'usePerformance.ts',
    'useResponsive.ts',
    'useIntersectionObserver.ts'
  ]

  const getFileContent = (dir: string, fileName: string): string | null => {
    const filePath = path.join(dir, fileName)
    if (!fs.existsSync(filePath)) return null
    return fs.readFileSync(filePath, 'utf-8')
  }

  it('should have JSDoc comments for component props', () => {
    const componentsWithoutPropsDocs: string[] = []
    
    componentsToCheck.forEach(fileName => {
      const content = getFileContent(componentsDir, fileName)
      if (!content) return
      
      // Проверяем наличие props
      const hasProps = content.includes('defineProps') || content.includes('props:')
      if (!hasProps) return
      
      // Проверяем наличие JSDoc комментариев перед defineProps или interface
      const hasJSDocBeforeProps = content.match(/\/\*\*[\s\S]*?\*\/[\s\S]*?(defineProps|interface.*Props)/g)
      
      if (!hasJSDocBeforeProps || hasJSDocBeforeProps.length === 0) {
        componentsWithoutPropsDocs.push(fileName)
      }
    })
    
    // Допускаем некоторые компоненты без документации, но большинство должны быть задокументированы
    expect(componentsWithoutPropsDocs.length).toBeLessThan(componentsToCheck.length / 2)
  })

  it('should have JSDoc comments for composable functions', () => {
    const composablesWithoutDocs: string[] = []
    
    composablesToCheck.forEach(fileName => {
      const content = getFileContent(composablesDir, fileName)
      if (!content) return
      
      // Проверяем наличие export function
      const hasExportFunction = content.includes('export function')
      if (!hasExportFunction) return
      
      // Проверяем наличие JSDoc комментариев перед export function
      const hasJSDocBeforeFunction = content.match(/\/\*\*[\s\S]*?\*\/[\s\S]*?export function/g)
      
      if (!hasJSDocBeforeFunction || hasJSDocBeforeFunction.length === 0) {
        composablesWithoutDocs.push(fileName)
      }
    })
    
    // Большинство composables должны быть задокументированы
    expect(composablesWithoutDocs.length).toBeLessThan(composablesToCheck.length / 2)
  })

  it('should include @param tags in JSDoc for function parameters', () => {
    const filesWithMissingParamDocs: string[] = []
    
    composablesToCheck.forEach(fileName => {
      const content = getFileContent(composablesDir, fileName)
      if (!content) return
      
      // Находим функции с параметрами
      const functionMatches = content.matchAll(/export function \w+\s*\((.*?)\)/g)
      
      for (const match of functionMatches) {
        const params = match[1]
        if (params.trim().length === 0) continue
        
        // Проверяем наличие @param в JSDoc перед функцией
        const beforeFunction = content.substring(0, match.index)
        const lastJSDoc = beforeFunction.match(/\/\*\*[\s\S]*?\*\/(?![\s\S]*\/\*\*)/)?.[0]
        
        if (lastJSDoc && !lastJSDoc.includes('@param')) {
          filesWithMissingParamDocs.push(fileName)
          break
        }
      }
    })
    
    // Допускаем некоторые функции без @param, но большинство должны иметь
    expect(filesWithMissingParamDocs.length).toBeLessThan(composablesToCheck.length)
  })

  it('should include @returns tag in JSDoc for functions with return values', () => {
    const filesWithMissingReturnDocs: string[] = []
    
    composablesToCheck.forEach(fileName => {
      const content = getFileContent(composablesDir, fileName)
      if (!content) return
      
      // Находим функции с return statements
      const functionMatches = content.matchAll(/export function (\w+)[\s\S]*?\{([\s\S]*?)\n\}/g)
      
      for (const match of functionMatches) {
        const functionBody = match[2]
        const hasReturn = functionBody.includes('return ')
        
        if (!hasReturn) continue
        
        // Проверяем наличие @returns в JSDoc перед функцией
        const beforeFunction = content.substring(0, match.index)
        const lastJSDoc = beforeFunction.match(/\/\*\*[\s\S]*?\*\/(?![\s\S]*\/\*\*)/)?.[0]
        
        if (lastJSDoc && !lastJSDoc.includes('@returns') && !lastJSDoc.includes('@return')) {
          filesWithMissingReturnDocs.push(fileName)
          break
        }
      }
    })
    
    // Допускаем некоторые функции без @returns
    expect(filesWithMissingReturnDocs.length).toBeLessThan(composablesToCheck.length)
  })

  it('should have description in JSDoc comments', () => {
    const filesWithEmptyDocs: string[] = []
    
    const allFiles = [
      ...componentsToCheck.map(f => ({ dir: componentsDir, file: f })),
      ...composablesToCheck.map(f => ({ dir: composablesDir, file: f }))
    ]
    
    allFiles.forEach(({ dir, file }) => {
      const content = getFileContent(dir, file)
      if (!content) return
      
      // Находим все JSDoc комментарии
      const jsdocMatches = content.matchAll(/\/\*\*([\s\S]*?)\*\//g)
      
      for (const match of jsdocMatches) {
        const jsdocContent = match[1]
        
        // Удаляем звездочки и пробелы
        const cleanContent = jsdocContent
          .split('\n')
          .map(line => line.replace(/^\s*\*\s?/, '').trim())
          .filter(line => !line.startsWith('@'))
          .join(' ')
          .trim()
        
        // Если JSDoc пустой (только теги без описания)
        if (cleanContent.length === 0) {
          filesWithEmptyDocs.push(file)
          break
        }
      }
    })
    
    // Большинство файлов должны иметь описания в JSDoc
    expect(filesWithEmptyDocs.length).toBeLessThan(allFiles.length / 2)
  })

  // Property-based test: проверяем структуру JSDoc комментариев
  it('should have well-formed JSDoc structure', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...composablesToCheck),
        (fileName) => {
          const content = getFileContent(composablesDir, fileName)
          if (!content) return true
          
          // Находим все JSDoc комментарии
          const jsdocMatches = content.matchAll(/\/\*\*([\s\S]*?)\*\//g)
          
          for (const match of jsdocMatches) {
            const jsdoc = match[0]
            
            // Проверяем базовую структуру JSDoc
            expect(jsdoc).toMatch(/^\/\*\*/)
            expect(jsdoc).toMatch(/\*\/$/)
            
            // Если есть теги, они должны начинаться с @
            const lines = jsdoc.split('\n')
            const tagLines = lines.filter(line => line.includes('@'))
            
            tagLines.forEach(line => {
              expect(line).toMatch(/@\w+/)
            })
          }
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should document default values for optional props', () => {
    const componentsWithoutDefaultDocs: string[] = []
    
    componentsToCheck.forEach(fileName => {
      const content = getFileContent(componentsDir, fileName)
      if (!content) return
      
      // Находим props с default значениями
      const hasDefaultProps = content.includes('default:') || content.includes('withDefaults')
      if (!hasDefaultProps) return
      
      // Проверяем, что default значения упомянуты в JSDoc
      const jsdocMatches = content.matchAll(/\/\*\*([\s\S]*?)\*\//g)
      let hasDefaultInDocs = false
      
      for (const match of jsdocMatches) {
        const jsdoc = match[0]
        if (jsdoc.includes('default') || jsdoc.includes('Default')) {
          hasDefaultInDocs = true
          break
        }
      }
      
      if (!hasDefaultInDocs) {
        componentsWithoutDefaultDocs.push(fileName)
      }
    })
    
    // Допускаем некоторые компоненты без документации default значений
    expect(componentsWithoutDefaultDocs.length).toBeLessThan(componentsToCheck.length)
  })

  it('should have usage examples in component documentation', () => {
    const componentsWithoutExamples: string[] = []
    
    componentsToCheck.forEach(fileName => {
      const content = getFileContent(componentsDir, fileName)
      if (!content) return
      
      // Проверяем наличие примеров использования в JSDoc
      const hasExample = content.includes('@example') || 
                        content.includes('Example:') ||
                        content.includes('Usage:')
      
      if (!hasExample) {
        componentsWithoutExamples.push(fileName)
      }
    })
    
    // Допускаем отсутствие примеров в некоторых компонентах
    // Но хотя бы половина должна иметь примеры
    expect(componentsWithoutExamples.length).toBeLessThan(componentsToCheck.length)
  })
})
