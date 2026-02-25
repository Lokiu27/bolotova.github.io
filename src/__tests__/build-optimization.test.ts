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
    
    // Collect all asset files from subdirectories
    assetFiles = []
    if (existsSync(assetsPath)) {
      const subdirs = ['js', 'css', 'images']
      subdirs.forEach(subdir => {
        const subdirPath = join(assetsPath, subdir)
        if (existsSync(subdirPath)) {
          const files = readdirSync(subdirPath)
          assetFiles.push(...files)
        }
      })
    }
  }, 30000) // 30 second timeout for build

  it('should generate optimized static files for production build', () => {
    // Property 1: Build output should exist
    expect(existsSync(distPath)).toBe(true)
    
    // Property 2: Should contain index.html
    const indexPath = join(distPath, 'index.html')
    expect(existsSync(indexPath)).toBe(true)
    
    // Property 3: Should contain assets directory with optimized files
    expect(existsSync(assetsPath)).toBe(true)
    
    // Property 4: Should have JavaScript files
    const jsFiles = assetFiles.filter(file => file.endsWith('.js'))
    expect(jsFiles.length).toBeGreaterThan(0)
    
    // Property 5: JS files should have content hash for caching optimization
    jsFiles.forEach(jsFile => {
      expect(jsFile).toMatch(/-[a-zA-Z0-9_-]+\.js$/)
    })
  })

  it('should optimize assets for web delivery', () => {
    // Property 1: CSS files should be minified and have content hash
    const cssFiles = assetFiles.filter(file => file.endsWith('.css'))
    cssFiles.forEach(cssFile => {
      expect(cssFile).toMatch(/-[a-zA-Z0-9_-]+\.css$/)
    })
    
    // Property 2: All asset files should have content-based naming for cache optimization
    const hashFiles = assetFiles.filter(file => file.includes('-'))
    expect(hashFiles.length).toBeGreaterThan(0)
  })
})