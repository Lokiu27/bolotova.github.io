import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Feature: glassmorphism-cyberpunk-redesign
 * Property 19: Использование Composition API
 * 
 * For any нового компонента, должен использоваться Vue 3 Composition API 
 * (setup() или <script setup>) вместо Options API для лучшей организации кода 
 * и переиспользования логики.
 * 
 * Validates: Requirements 12.4
 */

describe('Property 19: Использование Composition API', () => {
  const componentsDir = path.resolve(__dirname, '../components')
  
  // Список новых компонентов из спецификации
  const newComponents = [
    'WebGLBackground.vue',
    'ScanlineOverlay.vue',
    'GlassCard.vue',
    'GlassPanel.vue',
    'CyberBreadcrumbs.vue',
    'StatusPanel.vue',
    'MainContent.vue',
    'LazyImage.vue',
    'LoadingSpinner.vue'
  ]

  const getComponentContent = (fileName: string): string | null => {
    const filePath = path.join(componentsDir, fileName)
    if (!fs.existsSync(filePath)) return null
    return fs.readFileSync(filePath, 'utf-8')
  }

  it('should use Composition API in all new components', () => {
    const componentsWithOptionsAPI: string[] = []
    
    newComponents.forEach(fileName => {
      const content = getComponentContent(fileName)
      if (!content) return
      
      // Проверяем использование Composition API
      const hasScriptSetup = content.includes('<script setup')
      const hasSetupFunction = content.includes('setup(') || content.includes('setup (')
      
      // Проверяем отсутствие Options API паттернов
      const hasOptionsAPI = content.includes('export default {') && 
                           (content.includes('data()') || 
                            content.includes('methods:') ||
                            content.includes('computed:'))
      
      if (!hasScriptSetup && !hasSetupFunction) {
        componentsWithOptionsAPI.push(fileName)
      }
      
      if (hasOptionsAPI && !hasSetupFunction) {
        componentsWithOptionsAPI.push(`${fileName} (uses Options API)`)
      }
    })
    
    expect(componentsWithOptionsAPI).toEqual([])
  })

  it('should use defineProps and defineEmits in script setup', () => {
    const componentsWithoutDefineAPI: string[] = []
    
    newComponents.forEach(fileName => {
      const content = getComponentContent(fileName)
      if (!content) return
      
      // Только для компонентов с <script setup>
      if (!content.includes('<script setup')) return
      
      // Проверяем наличие props или emits
      const hasProps = content.includes('defineProps')
      const hasEmits = content.includes('defineEmits')
      const needsProps = content.includes('props.') || content.includes('{{ ')
      const needsEmits = content.includes('emit(')
      
      // Если компонент использует props/emits, они должны быть определены через define API
      if (needsProps && !hasProps) {
        componentsWithoutDefineAPI.push(`${fileName} (missing defineProps)`)
      }
      if (needsEmits && !hasEmits) {
        componentsWithoutDefineAPI.push(`${fileName} (missing defineEmits)`)
      }
    })
    
    expect(componentsWithoutDefineAPI).toEqual([])
  })

  it('should use composables for reusable logic', () => {
    const composablesDir = path.resolve(__dirname, '../composables')
    
    if (!fs.existsSync(composablesDir)) {
      throw new Error('Composables directory not found')
    }
    
    const composableFiles = fs.readdirSync(composablesDir)
      .filter(file => file.endsWith('.ts'))
    
    // Проверяем наличие ключевых composables из спецификации
    const requiredComposables = [
      'useWebGL.ts',
      'useGlassEffect.ts',
      'usePerformance.ts',
      'useResponsive.ts'
    ]
    
    requiredComposables.forEach(composable => {
      expect(composableFiles).toContain(composable)
    })
  })

  it('should use reactive Vue 3 APIs in composables', () => {
    const composablesDir = path.resolve(__dirname, '../composables')
    
    if (!fs.existsSync(composablesDir)) return
    
    const composableFiles = fs.readdirSync(composablesDir)
      .filter(file => file.endsWith('.ts'))
    
    composableFiles.forEach(fileName => {
      const content = fs.readFileSync(path.join(composablesDir, fileName), 'utf-8')
      
      // Проверяем использование Vue 3 reactive APIs
      const hasVue3APIs = content.includes('ref(') || 
                         content.includes('reactive(') ||
                         content.includes('computed(') ||
                         content.includes('watch(') ||
                         content.includes('onMounted(') ||
                         content.includes('onUnmounted(')
      
      // Composables должны использовать Vue 3 APIs
      if (content.includes('export function use')) {
        expect(hasVue3APIs).toBe(true)
      }
    })
  })

  it('should not use Vue 2 lifecycle hooks in new components', () => {
    const componentsWithVue2Hooks: string[] = []
    
    newComponents.forEach(fileName => {
      const content = getComponentContent(fileName)
      if (!content) return
      
      // Проверяем отсутствие Vue 2 lifecycle hooks
      const vue2Hooks = [
        'beforeCreate',
        'created',
        'beforeMount',
        'mounted',
        'beforeUpdate',
        'updated',
        'beforeDestroy',
        'destroyed'
      ]
      
      vue2Hooks.forEach(hook => {
        if (content.includes(`${hook}()`) || content.includes(`${hook}:`)) {
          componentsWithVue2Hooks.push(`${fileName} (uses ${hook})`)
        }
      })
    })
    
    expect(componentsWithVue2Hooks).toEqual([])
  })

  it('should use onMounted/onUnmounted instead of mounted/destroyed', () => {
    const componentsWithCorrectHooks: string[] = []
    
    newComponents.forEach(fileName => {
      const content = getComponentContent(fileName)
      if (!content) return
      
      // Если компонент использует lifecycle hooks, они должны быть Vue 3 версии
      const hasOnMounted = content.includes('onMounted(')
      const hasOnUnmounted = content.includes('onUnmounted(')
      const hasMounted = content.includes('mounted(') || content.includes('mounted:')
      const hasDestroyed = content.includes('destroyed(') || content.includes('destroyed:')
      
      if ((hasOnMounted || hasOnUnmounted) && !hasMounted && !hasDestroyed) {
        componentsWithCorrectHooks.push(fileName)
      }
    })
    
    // Хотя бы некоторые компоненты должны использовать правильные hooks
    expect(componentsWithCorrectHooks.length).toBeGreaterThan(0)
  })
})
