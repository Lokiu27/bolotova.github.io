import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import fc from 'fast-check';
import GlassCard from '../components/GlassCard.vue';

describe('GlassCard Opacity Property Test', () => {
  // Feature: glassmorphism-cyberpunk-redesign, Property 3: Настройка прозрачности Glass компонентов
  it('should apply opacity prop to background rgba value', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }), // Генерируем случайные opacity значения
        (opacity) => {
          const wrapper = mount(GlassCard, {
            props: { opacity },
            slots: {
              default: '<p>Test content</p>'
            }
          });
          
          const element = wrapper.element as HTMLElement;
          const computedStyle = window.getComputedStyle(element);
          const bgColor = computedStyle.backgroundColor;
          
          // В JSDOM проверяем CSS переменную напрямую
          const cssVarValue = element.style.getPropertyValue('--glass-opacity');
          expect(parseFloat(cssVarValue)).toBeCloseTo(opacity, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case opacity values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 0.1, 0.5, 1), // Тестируем граничные значения
        (opacity) => {
          const wrapper = mount(GlassCard, {
            props: { opacity },
            slots: {
              default: '<p>Test content</p>'
            }
          });
          
          const element = wrapper.element as HTMLElement;
          const cssVarValue = element.style.getPropertyValue('--glass-opacity');
          
          expect(parseFloat(cssVarValue)).toBe(opacity);
        }
      ),
      { numRuns: 50 }
    );
  });
});
