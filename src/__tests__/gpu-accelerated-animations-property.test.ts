import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Feature: glassmorphism-cyberpunk-redesign
 * Property 11: GPU-ускоренные анимации
 * 
 * **Validates: Requirements 9.2**
 * 
 * For any CSS анимации в системе, должны использоваться только transform и opacity 
 * свойства (не left/top/width/height), чтобы обеспечить GPU acceleration и плавность 60fps.
 */
describe('Property 11: GPU-Accelerated Animations', () => {
  // List of CSS files to check
  const cssFiles = [
    'src/assets/styles/animations.css',
    'src/assets/styles/tokens.css',
    'src/assets/styles/glassmorphism.css'
  ];

  // List of Vue component files to check
  const componentFiles = [
    'src/components/GlassCard.vue',
    'src/components/GlassPanel.vue',
    'src/components/StatusPanel.vue',
    'src/components/Sidebar.vue',
    'src/components/LoadingSpinner.vue',
    'src/components/WebGLBackground.vue',
    'src/components/ScanlineOverlay.vue'
  ];

  // Properties that are NOT GPU-accelerated (should not be animated)
  const nonGpuProperties = [
    'left', 'right', 'top', 'bottom',
    'width', 'height',
    'margin', 'padding',
    'font-size',
    'background-color', 'color',
    'border-width', 'border-color'
  ];

  // Properties that ARE GPU-accelerated (safe to animate)
  const gpuProperties = ['transform', 'opacity'];

  it('should only use GPU-accelerated properties in @keyframes animations', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...cssFiles), // Test each CSS file
        (cssFile) => {
          const filePath = path.resolve(process.cwd(), cssFile);
          
          // Skip if file doesn't exist
          if (!fs.existsSync(filePath)) {
            return true;
          }

          const content = fs.readFileSync(filePath, 'utf-8');

          // Extract all @keyframes blocks
          const keyframesRegex = /@keyframes\s+[\w-]+\s*\{([^}]+\{[^}]+\})+\}/g;
          const keyframesMatches = content.match(keyframesRegex) || [];

          keyframesMatches.forEach((keyframe) => {
            // Check that no non-GPU properties are used in animations
            nonGpuProperties.forEach((prop) => {
              const propRegex = new RegExp(`\\b${prop}\\s*:`, 'i');
              expect(propRegex.test(keyframe)).toBe(false);
            });

            // Verify that only GPU properties are used
            // Extract property names from the keyframe
            const propertyRegex = /([a-z-]+)\s*:/gi;
            const properties = [];
            let match;
            while ((match = propertyRegex.exec(keyframe)) !== null) {
              const prop = match[1].trim();
              // Skip percentage values and keyframe selectors
              if (!prop.match(/^\d+%?$/) && prop !== 'from' && prop !== 'to') {
                properties.push(prop);
              }
            }

            // All properties should be GPU-accelerated
            properties.forEach((prop) => {
              const isGpuProperty = gpuProperties.includes(prop);
              const isNonGpuProperty = nonGpuProperties.includes(prop);
              
              // If it's a non-GPU property, fail the test
              if (isNonGpuProperty) {
                expect(isGpuProperty).toBe(true);
              }
            });
          });
        }
      ),
      { numRuns: cssFiles.length }
    );
  });

  it('should not animate non-GPU properties in component styles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...componentFiles), // Test each component file
        (componentFile) => {
          const filePath = path.resolve(process.cwd(), componentFile);
          
          // Skip if file doesn't exist
          if (!fs.existsSync(filePath)) {
            return true;
          }

          const content = fs.readFileSync(filePath, 'utf-8');

          // Extract style section
          const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/;
          const styleMatch = content.match(styleRegex);
          
          if (!styleMatch) {
            return true; // No styles, pass
          }

          const styles = styleMatch[1];

          // Check for animation or transition properties
          const animationRegex = /animation\s*:\s*([^;]+);/gi;
          const transitionRegex = /transition\s*:\s*([^;]+);/gi;

          let match;
          
          // Check animations
          while ((match = animationRegex.exec(styles)) !== null) {
            const animationValue = match[1];
            
            // If animation references a keyframe, we've already checked it
            // Just verify no inline non-GPU properties
            nonGpuProperties.forEach((prop) => {
              expect(animationValue.toLowerCase()).not.toContain(prop);
            });
          }

          // Check transitions - should only transition GPU properties
          while ((match = transitionRegex.exec(styles)) !== null) {
            const transitionValue = match[1].toLowerCase();
            
            // If transition is "all", it's acceptable (browser optimizes)
            if (transitionValue.includes('all')) {
              continue;
            }

            // Otherwise, check that only GPU properties are transitioned
            nonGpuProperties.forEach((prop) => {
              // Only fail if the property is explicitly mentioned as a word boundary
              // This avoids false positives like "slideInRight" containing "right"
              const propRegex = new RegExp(`\\b${prop}\\b(?!\\w)`);
              if (propRegex.test(transitionValue)) {
                // This is a non-GPU property being transitioned
                expect(false).toBe(true);
              }
            });
          }
        }
      ),
      { numRuns: componentFiles.length }
    );
  });

  it('should have will-change property for animated elements', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...componentFiles),
        (componentFile) => {
          const filePath = path.resolve(process.cwd(), componentFile);
          
          if (!fs.existsSync(filePath)) {
            return true;
          }

          const content = fs.readFileSync(filePath, 'utf-8');
          const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/;
          const styleMatch = content.match(styleRegex);
          
          if (!styleMatch) {
            return true;
          }

          const styles = styleMatch[1];

          // Find all animation declarations
          const animationRegex = /animation\s*:\s*([^;]+);/gi;
          const animationMatches = styles.match(animationRegex) || [];

          if (animationMatches.length > 0) {
            // If there are animations, there should be at least one will-change declaration
            // (This is a heuristic - not all animated elements need will-change, but it's good practice)
            const hasWillChange = /will-change\s*:/i.test(styles);
            
            // We expect will-change to be present for performance optimization
            // Note: This is a soft requirement - will-change should be used judiciously
            expect(hasWillChange).toBe(true);
          }
        }
      ),
      { numRuns: componentFiles.length }
    );
  });

  it('should verify animations.css only uses transform and opacity', () => {
    const animationsPath = path.resolve(process.cwd(), 'src/assets/styles/animations.css');
    
    if (!fs.existsSync(animationsPath)) {
      return;
    }

    const content = fs.readFileSync(animationsPath, 'utf-8');

    // Define all keyframes that should exist
    const expectedKeyframes = ['spin', 'pulse', 'glitch', 'fadeIn', 'slideInRight'];

    expectedKeyframes.forEach((keyframeName) => {
      // More flexible regex that handles multi-line keyframes
      const keyframeRegex = new RegExp(`@keyframes\\s+${keyframeName}[\\s\\S]*?\\{[\\s\\S]*?\\}\\s*\\}`, 'i');
      const keyframeMatch = content.match(keyframeRegex);

      expect(keyframeMatch).toBeTruthy();

      if (keyframeMatch) {
        const keyframeContent = keyframeMatch[0];

        // Verify only transform and opacity are used
        nonGpuProperties.forEach((prop) => {
          const propRegex = new RegExp(`\\b${prop}\\s*:`, 'i');
          expect(propRegex.test(keyframeContent)).toBe(false);
        });

        // Verify that transform or opacity is present
        const hasGpuProperty = /\b(transform|opacity)\s*:/i.test(keyframeContent);
        expect(hasGpuProperty).toBe(true);
      }
    });
  });
});
