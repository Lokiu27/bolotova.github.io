import { describe, it, expect, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import { execSync } from 'child_process'
import { existsSync, statSync, readdirSync } from 'fs'
import { join } from 'path'

/**
 * **Feature: vue-migration-docker, Property 5: Build optimization**
 * **Validates: Requirements 1.5**
 * 
 * Property: For any production build, the generated static files should be minified, compressed, and optimized for web delivery
 */
describe('Build Optimization Property Tests', () => {
  let distPath: string
  let assetsPath: string
  let assetFiles: string[]

  beforeAll(() => {
    // Build once before all tests
    try {
      execSync('npm run build', { 
        cwd: process.cwd(),
        stdio: 'pipe'
      })
    } catch (error) {
      throw new Error(`Build failed: ${error}`)
    }

    distPath = join(process.cwd(), 'dist')
    assetsPath = join(distPath, 'assets')
    assetFiles = existsSync(assetsPath) ? readdirSync(assetsPath) : []
  }, 30000) // 30 second timeout for build

  it('should generate optimized static files for production build', () => {
    fc.assert(
      fc.property(
        fc.constant('production'), // Build environment
        (buildEnv) => {
          // Property 1: Build output should exist
          expect(existsSync(distPath)).toBe(true)
          
          // Property 2: Should contain index.html
          const indexPath = join(distPath, 'index.html')
          expect(existsSync(indexPath)).toBe(true)
          
          // Property 3: Should contain assets directory with optimized files
          expect(existsSync(assetsPath)).toBe(true)
          
          // Property 4: Should have minified JavaScript files (indicated by hash in filename)
          const jsFiles = assetFiles.filter(file => file.endsWith('.js'))
          expect(jsFiles.length).toBeGreaterThan(0)
          
          // Property 5: JS files should have content hash for caching optimization
          jsFiles.forEach(jsFile => {
            expect(jsFile).toMatch(/^index-[a-zA-Z0-9_-]+\.js$/)
          })
          
          // Property 6: Files should be reasonably small (minified)
          jsFiles.forEach(jsFile => {
            const filePath = join(assetsPath, jsFile)
            const stats = statSync(filePath)
            // For a basic Vue app, minified JS should be under 200KB
            expect(stats.size).toBeLessThan(200 * 1024)
          })
          
          return true
        }
      ),
      { numRuns: 10 } // Reduced runs since we're not rebuilding
    )
  })

  it('should optimize assets for web delivery', () => {
    fc.assert(
      fc.property(
        fc.constant('build'), // Build command
        (buildCommand) => {
          // Property 1: CSS files should be minified and have content hash
          const cssFiles = assetFiles.filter(file => file.endsWith('.css'))
          cssFiles.forEach(cssFile => {
            expect(cssFile).toMatch(/^index-[a-zA-Z0-9_-]+\.css$/)
            
            const filePath = join(assetsPath, cssFile)
            const stats = statSync(filePath)
            // CSS should be reasonably small when minified
            expect(stats.size).toBeLessThan(50 * 1024)
          })
          
          // Property 2: All asset files should have content-based naming for cache optimization
          assetFiles.forEach(file => {
            if (file.includes('index-')) {
              expect(file).toMatch(/^index-[a-zA-Z0-9_-]+\.(js|css)$/)
            }
          })
          
          return true
        }
      ),
      { numRuns: 10 } // Reduced runs since we're not rebuilding
    )
  })
})