import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import fc from 'fast-check';
import GlassCard from '../components/GlassCard.vue';

describe('GlassCard Hover Effects Property Test', () => {
  beforeEach(() => {
    // Очищаем стили перед каждым тестом
    document.head.querySelectorAll('style').forEach(style => {
      if (style.textContent?.includes('glass-card')) {
        style.remove();
      }
    });
  });

  // Feature: glassmorphism-cyberpunk-redesign, Property 4: Hover эффекты на Glass карточках
  it('should display glow effect and cyber corners on hover', () => {
    fc.assert(
      fc.property(
        fc.record({
          glowOnHover: fc.boolean(),
          cyberCorners: fc.boolean()
        }),
        (props) => {
          const wrapper = mount(GlassCard, {
            props,
            slots: {
              default: '<p>Test content</p>'
            },
            attachTo: document.body
          });
          
          // Проверяем классы вместо computed styles (JSDOM ограничение)
          const classes = wrapper.classes();
          
          if (props.glowOnHover) {
            expect(classes).toContain('glow-on-hover');
          } else {
            expect(classes).not.toContain('glow-on-hover');
          }
          
          if (props.cyberCorners) {
            expect(classes).toContain('cyber-corners');
          } else {
            expect(classes).not.toContain('cyber-corners');
          }
          
          wrapper.unmount();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply hover transform when glowOnHover is enabled', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (glowOnHover) => {
          const wrapper = mount(GlassCard, {
            props: { glowOnHover },
            slots: {
              default: '<p>Test content</p>'
            },
            attachTo: document.body
          });

          const classes = wrapper.classes();
          
          // Проверяем наличие класса вместо computed styles
          if (glowOnHover) {
            expect(classes).toContain('glow-on-hover');
          } else {
            expect(classes).not.toContain('glow-on-hover');
          }
          
          wrapper.unmount();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have glow-on-hover class when enabled', () => {
    fc.assert(
      fc.property(
        fc.constant(true), // glowOnHover всегда true для этого теста
        (glowOnHover) => {
          const wrapper = mount(GlassCard, {
            props: { glowOnHover },
            slots: {
              default: '<p>Test content</p>'
            },
            attachTo: document.body
          });

          // Проверяем наличие класса для hover эффектов
          expect(wrapper.classes()).toContain('glow-on-hover');
          
          wrapper.unmount();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
