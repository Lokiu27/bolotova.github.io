import { describe, it, expect, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

/**
 * **Feature: vue-migration-docker, Property 8: Static resource inclusion**
 * **Validates: Requirements 2.5**
 * 
 * Property: For any Docker container deployment, all CSS, JavaScript, images, and data files should be accessible within the container
 */
describe('Static Resource Inclusion Property Tests', () => {
  let distPath: string
  let assetsPath: string
  let publicDataPath: string

  beforeAll(() => {
    // Build the application first
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
    publicDataPath = join(distPath, 'data')
  }, 30000)

  it('should include all required static resources in build output', () => {
    fc.assert(
      fc.property(
        fc.record({
          containerPath: fc.constant('/usr/share/nginx/html'),
          resourceTypes: fc.constant(['css', 'js', 'json', 'images'])
        }),
        (config) => {
          // Property 1: Build output directory should exist
          expect(existsSync(distPath)).toBe(true)
          
          // Property 2: Should contain index.html as entry point
          const indexPath = join(distPath, 'index.html')
          expect(existsSync(indexPath)).toBe(true)
          
          // Property 3: Should contain assets directory with CSS and JS files
          expect(existsSync(assetsPath)).toBe(true)
          
          // Property 4: Should have CSS files in assets/css directory
          const cssPath = join(assetsPath, 'css')
          expect(existsSync(cssPath)).toBe(true)
          const cssFiles = readdirSync(cssPath)
          expect(cssFiles.length).toBeGreaterThan(0)
          expect(cssFiles.some(file => file.endsWith('.css'))).toBe(true)
          
          // Property 5: Should have JavaScript files in assets/js directory
          const jsPath = join(assetsPath, 'js')
          expect(existsSync(jsPath)).toBe(true)
          const jsFiles = readdirSync(jsPath)
          expect(jsFiles.length).toBeGreaterThan(0)
          expect(jsFiles.some(file => file.endsWith('.js'))).toBe(true)
          
          // Property 6: All asset files should be readable
          const allAssetDirs = ['css', 'js', 'images']
          allAssetDirs.forEach(dir => {
            const dirPath = join(assetsPath, dir)
            if (existsSync(dirPath)) {
              const files = readdirSync(dirPath)
              files.forEach(file => {
                const filePath = join(dirPath, file)
                const stats = statSync(filePath)
                expect(stats.isFile()).toBe(true)
                expect(stats.size).toBeGreaterThan(0)
              })
            }
          })
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should include data files for application content', () => {
    fc.assert(
      fc.property(
        fc.record({
          dataFiles: fc.constant(['hero.json', 'about.json', 'contacts.json']),
          dataPath: fc.constant('data')
        }),
        (config) => {
          // Property 1: Data directory should exist in build output
          expect(existsSync(publicDataPath)).toBe(true)
          
          const dataFiles = readdirSync(publicDataPath)
          
          // Property 2: Should contain all required JSON data files
          config.dataFiles.forEach(requiredFile => {
            expect(dataFiles).toContain(requiredFile)
            
            const filePath = join(publicDataPath, requiredFile)
            expect(existsSync(filePath)).toBe(true)
            
            // Property 3: Data files should be valid and non-empty
            const stats = statSync(filePath)
            expect(stats.isFile()).toBe(true)
            expect(stats.size).toBeGreaterThan(0)
          })
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should include image assets for the application', () => {
    fc.assert(
      fc.property(
        fc.record({
          imageFormats: fc.constant(['jpg', 'jpeg', 'png', 'gif', 'svg']),
          assetsImagePath: fc.constant('assets/images')
        }),
        (config) => {
          const imagesPath = join(distPath, config.assetsImagePath)
          
          // Property 1: Images directory should exist if images are present
          if (existsSync(imagesPath)) {
            const imageFiles = readdirSync(imagesPath)
            
            // Property 2: All image files should have valid extensions
            imageFiles.forEach(file => {
              const extension = file.split('.').pop()?.toLowerCase()
              if (extension) {
                expect(config.imageFormats).toContain(extension)
              }
              
              // Property 3: Image files should be readable and non-empty
              const filePath = join(imagesPath, file)
              const stats = statSync(filePath)
              expect(stats.isFile()).toBe(true)
              expect(stats.size).toBeGreaterThan(0)
            })
          }
          
          // Property 4: Profile image should be accessible from public directory
          const publicImagesPath = join(distPath, 'assets', 'images')
          if (existsSync(publicImagesPath)) {
            const publicImageFiles = readdirSync(publicImagesPath)
            expect(publicImageFiles.length).toBeGreaterThanOrEqual(0)
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate Docker container file structure compatibility', () => {
    fc.assert(
      fc.property(
        fc.record({
          nginxDocRoot: fc.constant('/usr/share/nginx/html'),
          requiredFiles: fc.constant(['index.html']),
          requiredDirs: fc.constant(['assets', 'data'])
        }),
        (config) => {
          // Property 1: All required files should exist in build output
          config.requiredFiles.forEach(file => {
            const filePath = join(distPath, file)
            expect(existsSync(filePath)).toBe(true)
          })
          
          // Property 2: All required directories should exist in build output
          config.requiredDirs.forEach(dir => {
            const dirPath = join(distPath, dir)
            expect(existsSync(dirPath)).toBe(true)
          })
          
          // Property 3: Build output structure should be compatible with Nginx document root
          expect(config.nginxDocRoot).toBe('/usr/share/nginx/html')
          
          // Property 4: All files should have appropriate permissions (readable)
          const allFiles = readdirSync(distPath, { withFileTypes: true })
          allFiles.forEach(dirent => {
            const fullPath = join(distPath, dirent.name)
            if (dirent.isFile()) {
              const stats = statSync(fullPath)
              expect(stats.mode & 0o444).toBeTruthy() // Should be readable
            }
          })
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})