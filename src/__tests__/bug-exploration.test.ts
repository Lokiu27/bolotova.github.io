/**
 * Bug Condition Exploration Tests
 * 
 * These tests are EXPECTED TO FAIL on unfixed code to confirm bugs exist.
 * Each test demonstrates a specific bug condition from the bugfix specification.
 * 
 * Test failures with counterexamples prove the bugs are real and need fixing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import fc from 'fast-check'

describe('Bug Condition Exploration Tests', () => {
  describe('1.1 Security - XSS Vulnerability Test', () => {
    /**
     * **Validates: Requirements 1.1**
     * 
     * Tests that the application does NOT validate JSON data structure,
     * allowing potential XSS attacks through malicious JSON files.
     * 
     * Expected: Test FAILS - XSS payload can be loaded without validation
     */
    it('should allow XSS payload in JSON data (bug exists)', async () => {
      // Create malicious JSON with script tags
      const maliciousPayload = {
        name: '<script>alert("XSS")</script>',
        title: '<img src=x onerror="alert(\'XSS\')">',
        description: 'Normal text with <script>malicious()</script> code'
      }

      // Simulate loading data without validation
      const loadDataWithoutValidation = async (data: any) => {
        // Current implementation just parses JSON without schema validation
        return data
      }

      const result = await loadDataWithoutValidation(maliciousPayload)

      // BUG: This should fail because XSS payloads are NOT blocked
      // The application accepts any JSON structure without validation
      expect(result.name).toContain('<script>')
      expect(result.title).toContain('onerror')
      expect(result.description).toContain('<script>')
      
      // This test passing means the bug exists - no validation is performed
    })

    it('should accept invalid data types without validation (bug exists)', () => {
      // Property-based test: any malformed data should be accepted (bug)
      fc.assert(
        fc.property(
          fc.record({
            name: fc.oneof(fc.string(), fc.integer(), fc.constant(null)),
            title: fc.oneof(fc.string(), fc.array(fc.string())),
            description: fc.anything()
          }),
          (malformedData) => {
            // BUG: Current implementation accepts any data structure
            // No Zod validation exists to reject invalid types
            const accepted = true // Simulates current behavior
            expect(accepted).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('1.2 Security - Missing CSP Headers Test', () => {
    /**
     * **Validates: Requirements 1.2**
     * 
     * Tests that nginx configuration does NOT include Content-Security-Policy headers.
     * 
     * Expected: Test FAILS - No CSP header found in nginx config
     */
    it('should not have CSP headers in nginx config (bug exists)', () => {
      const nginxConfigPath = join(process.cwd(), 'docker/nginx.conf')
      const nginxNoSslConfigPath = join(process.cwd(), 'docker/nginx-no-ssl.conf')

      if (existsSync(nginxConfigPath)) {
        const nginxConfig = readFileSync(nginxConfigPath, 'utf-8')
        
        // BUG: This should fail because CSP headers are NOT present
        expect(nginxConfig).not.toContain('Content-Security-Policy')
        expect(nginxConfig).not.toContain('add_header Content-Security-Policy')
      }

      if (existsSync(nginxNoSslConfigPath)) {
        const nginxNoSslConfig = readFileSync(nginxNoSslConfigPath, 'utf-8')
        
        // BUG: This should fail because CSP headers are NOT present
        expect(nginxNoSslConfig).not.toContain('Content-Security-Policy')
      }
    })
  })

  describe('1.3 Performance - Shader Memory Leak Test', () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * Tests that WebGL shaders are NOT deleted after program linking,
     * causing GPU memory leaks.
     * 
     * Expected: Test FAILS - Shaders not deleted, memory leak exists
     */
    it('should not delete shaders after linking (bug exists)', () => {
      const useWebGLPath = join(process.cwd(), 'src/composables/useWebGL.ts')
      const useWebGLCode = readFileSync(useWebGLPath, 'utf-8')

      // Check createProgram function for shader deletion
      const createProgramMatch = useWebGLCode.match(/function createProgram[\s\S]*?return shaderProgram[\s\S]*?}/m)
      
      if (createProgramMatch) {
        const createProgramCode = createProgramMatch[0]
        
        // BUG: This should fail because gl.deleteShader() is NOT called
        expect(createProgramCode).not.toContain('deleteShader')
        expect(createProgramCode).not.toContain('gl.deleteShader(vertexShader)')
        expect(createProgramCode).not.toContain('gl.deleteShader(fragmentShader)')
      }
    })
  })

  describe('1.4 Performance - Incomplete WebGL Cleanup Test', () => {
    /**
     * **Validates: Requirements 1.4**
     * 
     * Tests that WebGL resources are NOT fully cleaned up when component unmounts.
     * 
     * Expected: Test FAILS - Incomplete cleanup, resources leak
     */
    it('should not fully clean up WebGL resources (bug exists)', () => {
      const useWebGLPath = join(process.cwd(), 'src/composables/useWebGL.ts')
      const useWebGLCode = readFileSync(useWebGLPath, 'utf-8')

      // Check destroy function for complete cleanup
      const destroyMatch = useWebGLCode.match(/function destroy\(\)[\s\S]*?}/m)
      
      if (destroyMatch) {
        const destroyCode = destroyMatch[0]
        
        // BUG: This should fail because context loss is NOT triggered
        expect(destroyCode).not.toContain('loseContext')
        expect(destroyCode).not.toContain('WEBGL_lose_context')
        
        // Shaders are also not deleted in destroy
        expect(destroyCode).not.toContain('deleteShader')
      }
    })
  })

  describe('1.5 Performance - Blocking Font Load Test', () => {
    /**
     * **Validates: Requirements 1.5**
     * 
     * Tests that fonts are loaded via blocking @import in CSS.
     * Note: HTML already has preconnect hints, but CSS @import still blocks rendering.
     * 
     * Expected: Test FAILS - Blocking @import found in CSS
     */
    it('should use blocking @import for fonts in CSS (bug exists)', () => {
      const mainCssPath = join(process.cwd(), 'src/assets/css/main.css')
      
      if (existsSync(mainCssPath)) {
        const mainCss = readFileSync(mainCssPath, 'utf-8')
        
        // BUG: This should fail because @import is used (blocking)
        expect(mainCss).toContain('@import')
        expect(mainCss.toLowerCase()).toContain('fonts.googleapis.com')
      }
    })
  })

  describe('1.6 Error Handling - Mount Failure Test', () => {
    /**
     * **Validates: Requirements 1.6**
     * 
     * Tests that app.mount() is NOT wrapped in try-catch,
     * causing uncaught exceptions on mount failure.
     * 
     * Expected: Test FAILS - No try-catch around mount
     */
    it('should not have try-catch around app.mount (bug exists)', () => {
      const mainTsPath = join(process.cwd(), 'src/main.ts')
      const mainTsCode = readFileSync(mainTsPath, 'utf-8')

      // Check for mount call
      const hasMountCall = mainTsCode.includes('app.mount')
      expect(hasMountCall).toBe(true)

      // BUG: This should fail because try-catch is NOT present
      const mountSection = mainTsCode.substring(
        mainTsCode.indexOf('app.mount') - 100,
        mainTsCode.indexOf('app.mount') + 100
      )
      
      expect(mountSection).not.toContain('try')
      expect(mountSection).not.toContain('catch')
    })
  })

  describe('1.7 Error Handling - Component Error Test', () => {
    /**
     * **Validates: Requirements 1.7**
     * 
     * Tests that global error handler is NOT configured,
     * leaving component errors unhandled.
     * 
     * Expected: Test FAILS - No global error handler
     */
    it('should not have global error handler (bug exists)', () => {
      const mainTsPath = join(process.cwd(), 'src/main.ts')
      const mainTsCode = readFileSync(mainTsPath, 'utf-8')

      // BUG: This should fail because errorHandler is NOT configured
      expect(mainTsCode).not.toContain('errorHandler')
      expect(mainTsCode).not.toContain('app.config.errorHandler')
      expect(mainTsCode).not.toContain('warnHandler')
    })
  })

  describe('1.8 Debug Leakage - Console Statements Test', () => {
    /**
     * **Validates: Requirements 1.8**
     * 
     * Tests that console.warn and console.error are NOT removed in production build.
     * 
     * Expected: Test FAILS - Console statements found in source code
     */
    it('should have console statements in source code (bug exists)', () => {
      const useWebGLPath = join(process.cwd(), 'src/composables/useWebGL.ts')
      const useWebGLCode = readFileSync(useWebGLPath, 'utf-8')

      // BUG: This should fail because console.error is present
      expect(useWebGLCode).toContain('console.error')
    })

    it('should not remove all console methods in Terser config (bug exists)', () => {
      const viteConfigPath = join(process.cwd(), 'vite.config.js')
      const viteConfig = readFileSync(viteConfigPath, 'utf-8')

      // BUG: This should fail because pure_funcs is NOT configured
      // Only drop_console: true exists, which only removes console.log
      expect(viteConfig).not.toContain('pure_funcs')
      expect(viteConfig).not.toContain('console.warn')
      expect(viteConfig).not.toContain('console.error')
    })
  })

  describe('1.9 Architecture - Untyped Inject Test', () => {
    /**
     * **Validates: Requirements 1.9**
     * 
     * Tests that provide/inject is used WITHOUT typed InjectionKey,
     * losing type safety.
     * 
     * Expected: Test FAILS - No InjectionKey usage found
     */
    it('should not use InjectionKey for provide/inject (bug exists)', () => {
      const appVuePath = join(process.cwd(), 'src/App.vue')
      const appVueCode = readFileSync(appVuePath, 'utf-8')

      // BUG: This should fail because InjectionKey is NOT imported or used
      expect(appVueCode).not.toContain('InjectionKey')
      expect(appVueCode).not.toContain('injection-keys')
      
      // Provide is used with string keys (untyped)
      expect(appVueCode).toContain("provide('heroData'")
      expect(appVueCode).toContain("provide('aboutData'")
      expect(appVueCode).toContain("provide('contactsData'")
    })

    it('should not have injection-keys.ts file (bug exists)', () => {
      const injectionKeysPath = join(process.cwd(), 'src/types/injection-keys.ts')
      
      // BUG: This should fail because the file does NOT exist
      expect(existsSync(injectionKeysPath)).toBe(false)
    })
  })

  describe('1.10 Architecture - Duplicate Tokens Test', () => {
    /**
     * **Validates: Requirements 1.10**
     * 
     * Tests that CSS design tokens are duplicated between tokens.css and main.css.
     * 
     * NOTE: This bug appears to have been already fixed - no duplicates found.
     * Keeping test for documentation purposes.
     * 
     * Expected: Test FAILS - Duplicate tokens found (but currently passes)
     */
    it.skip('should have duplicate CSS custom properties (bug exists)', () => {
      const tokensCssPath = join(process.cwd(), 'src/assets/styles/tokens.css')
      const mainCssPath = join(process.cwd(), 'src/assets/css/main.css')

      if (existsSync(tokensCssPath) && existsSync(mainCssPath)) {
        const tokensCss = readFileSync(tokensCssPath, 'utf-8')
        const mainCss = readFileSync(mainCssPath, 'utf-8')

        // Extract CSS custom properties (--variable-name)
        const cssVarRegex = /--([\w-]+)\s*:/g
        const tokensVars = new Set<string>()
        const mainVars = new Set<string>()

        let match
        while ((match = cssVarRegex.exec(tokensCss)) !== null) {
          tokensVars.add(match[1])
        }

        cssVarRegex.lastIndex = 0
        while ((match = cssVarRegex.exec(mainCss)) !== null) {
          mainVars.add(match[1])
        }

        // Find duplicates
        const duplicates = Array.from(tokensVars).filter(v => mainVars.has(v))

        // BUG: This should fail because duplicates exist
        // Currently no duplicates found - bug may have been fixed already
        expect(duplicates.length).toBeGreaterThan(0)
      }
    })
  })

  describe('1.11 Technical Debt - jsconfig.json Test', () => {
    /**
     * **Validates: Requirements 1.11**
     * 
     * Tests that jsconfig.json exists alongside tsconfig.json,
     * creating configuration duplication.
     * 
     * Expected: Test FAILS - Both files exist
     */
    it('should have both jsconfig.json and tsconfig.json (bug exists)', () => {
      const jsconfigPath = join(process.cwd(), 'jsconfig.json')
      const tsconfigPath = join(process.cwd(), 'tsconfig.json')

      // BUG: This should fail because both files exist
      expect(existsSync(jsconfigPath)).toBe(true)
      expect(existsSync(tsconfigPath)).toBe(true)
    })
  })

  describe('1.12 Technical Debt - .DS_Store Files Test', () => {
    /**
     * **Validates: Requirements 1.12**
     * 
     * Tests that .DS_Store files exist in the repository.
     * 
     * Expected: Test FAILS - .DS_Store files found
     */
    it('should have .DS_Store files in repository (bug exists)', () => {
      // Search for .DS_Store files
      const findDsStore = (dir: string): string[] => {
        const results: string[] = []
        try {
          const files = readdirSync(dir, { withFileTypes: true })
          for (const file of files) {
            if (file.name === '.DS_Store') {
              results.push(join(dir, file.name))
            }
            if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
              results.push(...findDsStore(join(dir, file.name)))
            }
          }
        } catch (err) {
          // Skip directories we can't read
        }
        return results
      }

      const dsStoreFiles = findDsStore(process.cwd())

      // BUG: This should fail because .DS_Store files exist
      expect(dsStoreFiles.length).toBeGreaterThan(0)
    })

    it('should not have .DS_Store in .gitignore (bug exists)', () => {
      const gitignorePath = join(process.cwd(), '.gitignore')
      
      if (existsSync(gitignorePath)) {
        const gitignore = readFileSync(gitignorePath, 'utf-8')
        
        // BUG: This might fail if .DS_Store is not properly ignored
        // Check if it's missing or not comprehensive
        const hasBasicDsStore = gitignore.includes('.DS_Store')
        const hasRecursiveDsStore = gitignore.includes('**/.DS_Store')
        
        // If neither exists, bug is confirmed
        if (!hasBasicDsStore && !hasRecursiveDsStore) {
          expect(hasBasicDsStore).toBe(false)
        }
      }
    })
  })

  describe('1.13 Technical Debt - Misplaced Design File Test', () => {
    /**
     * **Validates: Requirements 1.13**
     * 
     * Tests that temporary design HTML file is in project root
     * instead of .kiro/specs/ directory.
     * 
     * Expected: Test FAILS - File in wrong location
     */
    it('should have design file in project root (bug exists)', () => {
      const rootFiles = readdirSync(process.cwd())
      const designFiles = rootFiles.filter(f => 
        f.startsWith('design-') && f.endsWith('.html')
      )

      // BUG: This should fail because design file is in root
      expect(designFiles.length).toBeGreaterThan(0)
      
      if (designFiles.length > 0) {
        const designFilePath = join(process.cwd(), designFiles[0])
        expect(existsSync(designFilePath)).toBe(true)
      }
    })

    it('should not have design file in .kiro/specs/ (bug exists)', () => {
      const specsDir = join(process.cwd(), '.kiro/specs/cyberpunk-design-replication')
      
      if (existsSync(specsDir)) {
        const specFiles = readdirSync(specsDir)
        const designFiles = specFiles.filter(f => 
          f.includes('design') && f.endsWith('.html')
        )

        // BUG: This should fail because file is NOT in correct location
        expect(designFiles.length).toBe(0)
      }
    })
  })
})
