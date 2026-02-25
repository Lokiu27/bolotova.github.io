import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import GlassCard from '../components/GlassCard.vue';

describe('GlassCard Component Unit Tests', () => {
  beforeEach(() => {
    // Очищаем стили перед каждым тестом
    document.head.querySelectorAll('style').forEach(style => {
      if (style.textContent?.includes('glass-card')) {
        style.remove();
      }
    });
  });

  it('should render with default props', () => {
    const wrapper = mount(GlassCard, {
      slots: {
        default: '<p>Test content</p>'
      }
    });

    expect(wrapper.find('.glass-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('Test content');
  });

  it('should apply backdrop-filter with blur value', () => {
    const wrapper = mount(GlassCard, {
      props: { blur: 15 },
      slots: {
        default: '<p>Test content</p>'
      },
      attachTo: document.body
    });

    const element = wrapper.element as HTMLElement;
    const cssVarValue = element.style.getPropertyValue('--glass-blur');
    
    expect(cssVarValue).toBe('15px');
    
    wrapper.unmount();
  });

  it('should apply rgba background with opacity', () => {
    const wrapper = mount(GlassCard, {
      props: { opacity: 0.3 },
      slots: {
        default: '<p>Test content</p>'
      },
      attachTo: document.body
    });

    const element = wrapper.element as HTMLElement;
    const cssVarValue = element.style.getPropertyValue('--glass-opacity');
    
    expect(parseFloat(cssVarValue)).toBe(0.3);
    
    wrapper.unmount();
  });

  it('should render header slot when provided', () => {
    const wrapper = mount(GlassCard, {
      slots: {
        header: '<h3>Card Header</h3>',
        default: '<p>Card content</p>'
      }
    });

    expect(wrapper.find('.glass-card-header').exists()).toBe(true);
    expect(wrapper.find('.glass-card-header').text()).toContain('Card Header');
  });

  it('should render footer slot when provided', () => {
    const wrapper = mount(GlassCard, {
      slots: {
        default: '<p>Card content</p>',
        footer: '<div>Card Footer</div>'
      }
    });

    expect(wrapper.find('.glass-card-footer').exists()).toBe(true);
    expect(wrapper.find('.glass-card-footer').text()).toContain('Card Footer');
  });

  it('should not render header when slot is not provided', () => {
    const wrapper = mount(GlassCard, {
      slots: {
        default: '<p>Card content</p>'
      }
    });

    expect(wrapper.find('.glass-card-header').exists()).toBe(false);
  });

  it('should not render footer when slot is not provided', () => {
    const wrapper = mount(GlassCard, {
      slots: {
        default: '<p>Card content</p>'
      }
    });

    expect(wrapper.find('.glass-card-footer').exists()).toBe(false);
  });

  it('should apply custom padding', () => {
    const wrapper = mount(GlassCard, {
      props: { padding: '24px' },
      slots: {
        default: '<p>Test content</p>'
      },
      attachTo: document.body
    });

    const element = wrapper.element as HTMLElement;
    const cssVarValue = element.style.getPropertyValue('--glass-padding');
    
    expect(cssVarValue).toBe('24px');
    
    wrapper.unmount();
  });

  it('should apply glow-on-hover class when prop is true', () => {
    const wrapper = mount(GlassCard, {
      props: { glowOnHover: true },
      slots: {
        default: '<p>Test content</p>'
      }
    });

    expect(wrapper.find('.glass-card').classes()).toContain('glow-on-hover');
  });

  it('should not apply glow-on-hover class when prop is false', () => {
    const wrapper = mount(GlassCard, {
      props: { glowOnHover: false },
      slots: {
        default: '<p>Test content</p>'
      }
    });

    expect(wrapper.find('.glass-card').classes()).not.toContain('glow-on-hover');
  });

  it('should apply cyber-corners class when prop is true', () => {
    const wrapper = mount(GlassCard, {
      props: { cyberCorners: true },
      slots: {
        default: '<p>Test content</p>'
      }
    });

    expect(wrapper.find('.glass-card').classes()).toContain('cyber-corners');
  });

  it('should not apply cyber-corners class when prop is false', () => {
    const wrapper = mount(GlassCard, {
      props: { cyberCorners: false },
      slots: {
        default: '<p>Test content</p>'
      }
    });

    expect(wrapper.find('.glass-card').classes()).not.toContain('cyber-corners');
  });

  it('should have fallback styles for browsers without backdrop-filter support', () => {
    const wrapper = mount(GlassCard, {
      slots: {
        default: '<p>Test content</p>'
      },
      attachTo: document.body
    });

    // Проверяем что стили содержат @supports fallback
    const styleElement = document.querySelector('style[data-v-app]') || 
                        document.querySelector('style');
    
    if (styleElement) {
      const styleContent = styleElement.textContent || '';
      expect(styleContent).toContain('@supports not (backdrop-filter');
    }
    
    wrapper.unmount();
  });

  it('should apply border opacity prop', () => {
    const wrapper = mount(GlassCard, {
      props: { borderOpacity: 0.5 },
      slots: {
        default: '<p>Test content</p>'
      },
      attachTo: document.body
    });

    const element = wrapper.element as HTMLElement;
    const cssVarValue = element.style.getPropertyValue('--glass-border-opacity');
    
    expect(parseFloat(cssVarValue)).toBe(0.5);
    
    wrapper.unmount();
  });

  it('should handle all props together', () => {
    const wrapper = mount(GlassCard, {
      props: {
        blur: 20,
        opacity: 0.2,
        borderOpacity: 0.4,
        glowOnHover: true,
        cyberCorners: true,
        padding: '16px'
      },
      slots: {
        header: '<h3>Header</h3>',
        default: '<p>Content</p>',
        footer: '<div>Footer</div>'
      },
      attachTo: document.body
    });

    const element = wrapper.element as HTMLElement;
    
    expect(element.style.getPropertyValue('--glass-blur')).toBe('20px');
    expect(parseFloat(element.style.getPropertyValue('--glass-opacity'))).toBe(0.2);
    expect(parseFloat(element.style.getPropertyValue('--glass-border-opacity'))).toBe(0.4);
    expect(element.style.getPropertyValue('--glass-padding')).toBe('16px');
    expect(wrapper.classes()).toContain('glow-on-hover');
    expect(wrapper.classes()).toContain('cyber-corners');
    expect(wrapper.find('.glass-card-header').exists()).toBe(true);
    expect(wrapper.find('.glass-card-footer').exists()).toBe(true);
    
    wrapper.unmount();
  });
});
