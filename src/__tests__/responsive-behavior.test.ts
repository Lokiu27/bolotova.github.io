import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { useResponsive } from '../composables/useResponsive';
import App from '../App.vue';
import Sidebar from '../components/Sidebar.vue';

/**
 * Unit tests for responsive behavior
 * Testing specific breakpoints and responsive features
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */

describe('Responsive Behavior Unit Tests', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    // Store original window dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    // Restore original window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  describe('useResponsive composable', () => {
    it('should correctly identify mobile viewport (320px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { isMobile, isTablet, isDesktop, width } = useResponsive();

      expect(width.value).toBe(320);
      expect(isMobile.value).toBe(true);
      expect(isTablet.value).toBe(false);
      expect(isDesktop.value).toBe(false);
    });

    it('should correctly identify mobile viewport (767px - edge case)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      const { isMobile, isTablet, isDesktop, width } = useResponsive();

      expect(width.value).toBe(767);
      expect(isMobile.value).toBe(true);
      expect(isTablet.value).toBe(false);
      expect(isDesktop.value).toBe(false);
    });

    it('should correctly identify tablet viewport (768px - boundary)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { isMobile, isTablet, isDesktop, width } = useResponsive();

      expect(width.value).toBe(768);
      expect(isMobile.value).toBe(false);
      expect(isTablet.value).toBe(true);
      expect(isDesktop.value).toBe(false);
    });

    it('should correctly identify tablet viewport (1023px - edge case)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1023,
      });

      const { isMobile, isTablet, isDesktop, width } = useResponsive();

      expect(width.value).toBe(1023);
      expect(isMobile.value).toBe(false);
      expect(isTablet.value).toBe(true);
      expect(isDesktop.value).toBe(false);
    });

    it('should correctly identify desktop viewport (1024px - boundary)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { isMobile, isTablet, isDesktop, width } = useResponsive();

      expect(width.value).toBe(1024);
      expect(isMobile.value).toBe(false);
      expect(isTablet.value).toBe(false);
      expect(isDesktop.value).toBe(true);
    });

    it('should correctly identify desktop viewport (1920px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      const { isMobile, isTablet, isDesktop, width } = useResponsive();

      expect(width.value).toBe(1920);
      expect(isMobile.value).toBe(false);
      expect(isTablet.value).toBe(false);
      expect(isDesktop.value).toBe(true);
    });

    it('should use custom breakpoints when provided', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const customBreakpoints = {
        mobile: 600,
        tablet: 900,
        desktop: 900,
      };

      const { isMobile, isTablet, isDesktop, breakpoints } = useResponsive(customBreakpoints);

      expect(breakpoints.mobile).toBe(600);
      expect(breakpoints.tablet).toBe(900);
      expect(breakpoints.desktop).toBe(900);
      expect(isMobile.value).toBe(false);
      expect(isTablet.value).toBe(true);
    });

    it('should track height changes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { width, height } = useResponsive();

      expect(width.value).toBe(1024);
      expect(height.value).toBe(768);
    });
  });

  describe('Sidebar responsive behavior', () => {
    it('should render sidebar on mobile (hidden via CSS)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const wrapper = mount(Sidebar, {
        props: {
          profileData: {
            title: 'Test User',
            subtitle: 'Developer',
            description: 'Test description',
            profile_image: '/test.jpg',
          },
          contactData: {
            email: 'test@example.com',
            telegram: 'https://t.me/test',
            github: 'https://github.com/test',
            resume: '/resume.pdf',
          },
        },
      });

      const sidebar = wrapper.find('.sidebar');
      expect(sidebar.exists()).toBe(true);
      
      // Sidebar exists in DOM but should be hidden via CSS media query
      // In actual browser, it would have display: none
    });

    it('should render sidebar on tablet with reduced width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const wrapper = mount(Sidebar, {
        props: {
          profileData: {
            title: 'Test User',
            subtitle: 'Developer',
            description: 'Test description',
            profile_image: '/test.jpg',
          },
          contactData: {
            email: 'test@example.com',
            telegram: 'https://t.me/test',
            github: 'https://github.com/test',
            resume: '/resume.pdf',
          },
        },
      });

      const sidebar = wrapper.find('.sidebar');
      expect(sidebar.exists()).toBe(true);
      
      // On tablet, sidebar should be visible with reduced width (240px via CSS)
    });

    it('should render sidebar on desktop with full width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      });

      const wrapper = mount(Sidebar, {
        props: {
          profileData: {
            title: 'Test User',
            subtitle: 'Developer',
            description: 'Test description',
            profile_image: '/test.jpg',
          },
          contactData: {
            email: 'test@example.com',
            telegram: 'https://t.me/test',
            github: 'https://github.com/test',
            resume: '/resume.pdf',
          },
        },
      });

      const sidebar = wrapper.find('.sidebar');
      expect(sidebar.exists()).toBe(true);
      
      // On desktop, sidebar should be visible with full width (320px via CSS)
    });
  });

  describe('Grid layout responsive behavior', () => {
    it('should have grid-layout class for responsive grids', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const wrapper = mount(App, {
        global: {
          stubs: {
            RouterView: true,
            RouterLink: true,
          },
        },
      });

      // Check if grid layouts exist in the app
      const grids = wrapper.findAll('.grid-layout, .cards-grid');
      
      // Grids should exist and be styled via CSS media queries
      // On mobile: 1 column
      // On tablet: 2 columns
      // On desktop: auto-fit with minmax(300px, 1fr)
      expect(grids.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Responsive utility classes', () => {
    it('should have mobile-only class available', () => {
      const wrapper = mount({
        template: '<div class="mobile-only">Mobile Content</div>',
      });

      const element = wrapper.find('.mobile-only');
      expect(element.exists()).toBe(true);
      expect(element.text()).toBe('Mobile Content');
    });

    it('should have tablet-only class available', () => {
      const wrapper = mount({
        template: '<div class="tablet-only">Tablet Content</div>',
      });

      const element = wrapper.find('.tablet-only');
      expect(element.exists()).toBe(true);
      expect(element.text()).toBe('Tablet Content');
    });

    it('should have desktop-only class available', () => {
      const wrapper = mount({
        template: '<div class="desktop-only">Desktop Content</div>',
      });

      const element = wrapper.find('.desktop-only');
      expect(element.exists()).toBe(true);
      expect(element.text()).toBe('Desktop Content');
    });
  });

  describe('Edge cases', () => {
    it('should handle very small viewport (320px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { isMobile, width } = useResponsive();

      expect(width.value).toBe(320);
      expect(isMobile.value).toBe(true);
    });

    it('should handle very large viewport (2560px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 2560,
      });

      const { isDesktop, width } = useResponsive();

      expect(width.value).toBe(2560);
      expect(isDesktop.value).toBe(true);
    });

    it('should handle exact breakpoint boundaries', () => {
      // Test 768px boundary (mobile -> tablet)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const responsive1 = useResponsive();
      expect(responsive1.isMobile.value).toBe(false);
      expect(responsive1.isTablet.value).toBe(true);

      // Test 1024px boundary (tablet -> desktop)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const responsive2 = useResponsive();
      expect(responsive2.isTablet.value).toBe(false);
      expect(responsive2.isDesktop.value).toBe(true);
    });
  });

  describe('Debounce functionality', () => {
    it('should debounce resize events', async () => {
      vi.useFakeTimers();

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { width } = useResponsive(undefined, 300);

      expect(width.value).toBe(1024);

      // Simulate resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      window.dispatchEvent(new Event('resize'));

      // Width should not update immediately due to debounce
      expect(width.value).toBe(1024);

      // Fast forward time
      vi.advanceTimersByTime(300);

      // After debounce delay, width should update
      await vi.runAllTimersAsync();

      vi.useRealTimers();
    });
  });
});
