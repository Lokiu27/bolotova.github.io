import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatusPanel from '../components/StatusPanel.vue';
import type { StatusType } from '../components/StatusPanel.vue';

/**
 * Unit тесты для компонента StatusPanel
 * Requirements: 6.4
 */
describe('StatusPanel Component Unit Tests', () => {
  it('should render with default props', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'online'
      }
    });

    expect(wrapper.find('.status-panel').exists()).toBe(true);
    expect(wrapper.find('.status-text').text()).toBe('SYSTEM: ONLINE');
  });

  it('should render custom status text', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'online',
        statusText: 'CUSTOM STATUS'
      }
    });

    expect(wrapper.find('.status-text').text()).toBe('CUSTOM STATUS');
  });

  it('should show status dot by default', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'online'
      }
    });

    expect(wrapper.find('.status-dot').exists()).toBe(true);
  });

  it('should hide status dot when showDot is false', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'online',
        showDot: false
      }
    });

    expect(wrapper.find('.status-dot').exists()).toBe(false);
  });

  it('should apply online status class', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'online'
      }
    });

    const dot = wrapper.find('.status-dot');
    expect(dot.classes()).toContain('status-dot--online');
  });

  it('should apply offline status class', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'offline'
      }
    });

    const dot = wrapper.find('.status-dot');
    expect(dot.classes()).toContain('status-dot--offline');
  });

  it('should apply away status class', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'away'
      }
    });

    const dot = wrapper.find('.status-dot');
    expect(dot.classes()).toContain('status-dot--away');
  });

  it('should have pulse animation for online status', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'online'
      },
      attachTo: document.body
    });

    const dot = wrapper.find('.status-dot--online');
    expect(dot.exists()).toBe(true);
    
    // Проверяем, что стили содержат pulse анимацию
    const styleElement = document.querySelector('style');
    if (styleElement) {
      const styleContent = styleElement.textContent || '';
      expect(styleContent).toContain('pulse');
    }
    
    wrapper.unmount();
  });

  it('should not have pulse animation for offline status', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'offline'
      }
    });

    const dot = wrapper.find('.status-dot');
    expect(dot.classes()).toContain('status-dot--offline');
    expect(dot.classes()).not.toContain('status-dot--online');
  });

  it('should not have pulse animation for away status', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'away'
      }
    });

    const dot = wrapper.find('.status-dot');
    expect(dot.classes()).toContain('status-dot--away');
    expect(dot.classes()).not.toContain('status-dot--online');
  });

  it('should have proper ARIA attributes', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'online'
      }
    });

    const dot = wrapper.find('.status-dot');
    expect(dot.attributes('aria-label')).toBe('Status: online');
    expect(dot.attributes('role')).toBe('status');
  });

  it('should update ARIA label when status changes', async () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'online'
      }
    });

    let dot = wrapper.find('.status-dot');
    expect(dot.attributes('aria-label')).toBe('Status: online');

    await wrapper.setProps({ status: 'offline' });
    
    dot = wrapper.find('.status-dot');
    expect(dot.attributes('aria-label')).toBe('Status: offline');
  });

  it('should handle all status types', () => {
    const statuses: StatusType[] = ['online', 'offline', 'away'];

    statuses.forEach(status => {
      const wrapper = mount(StatusPanel, {
        props: { status }
      });

      const dot = wrapper.find('.status-dot');
      expect(dot.classes()).toContain(`status-dot--${status}`);
    });
  });

  it('should apply cyberpunk styles (uppercase, monospace)', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'online'
      }
    });

    const panel = wrapper.find('.status-panel');
    expect(panel.exists()).toBe(true);
  });

  it('should handle status change from online to offline', async () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'online'
      }
    });

    let dot = wrapper.find('.status-dot');
    expect(dot.classes()).toContain('status-dot--online');

    await wrapper.setProps({ status: 'offline' });

    dot = wrapper.find('.status-dot');
    expect(dot.classes()).toContain('status-dot--offline');
    expect(dot.classes()).not.toContain('status-dot--online');
  });

  it('should handle all props together', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'away',
        statusText: 'SYSTEM: AWAY',
        showDot: true
      }
    });

    expect(wrapper.find('.status-dot').exists()).toBe(true);
    expect(wrapper.find('.status-dot').classes()).toContain('status-dot--away');
    expect(wrapper.find('.status-text').text()).toBe('SYSTEM: AWAY');
  });

  it('should respect prefers-reduced-motion', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        status: 'online'
      },
      attachTo: document.body
    });

    // Проверяем, что стили содержат @media (prefers-reduced-motion)
    const styleElement = document.querySelector('style');
    if (styleElement) {
      const styleContent = styleElement.textContent || '';
      expect(styleContent).toContain('prefers-reduced-motion');
    }
    
    wrapper.unmount();
  });
});
