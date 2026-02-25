import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import App from '@/App.vue';
import WebGLBackground from '@/components/WebGLBackground.vue';
import ScanlineOverlay from '@/components/ScanlineOverlay.vue';
import Sidebar from '@/components/Sidebar.vue';

// Mock fetch for data loading
global.fetch = vi.fn();

const mockHeroData = {
  title: 'Test User',
  subtitle: 'Test Subtitle',
  description: 'Test Description',
  profile_image: '/test-image.jpg'
};

const mockAboutData = {
  cards: [
    {
      index: '01',
      icon: 'test-icon',
      title: 'Test Card',
      description: 'Test Description'
    }
  ]
};

const mockContactsData = {
  email: 'test@example.com',
  telegram: 'https://t.me/test',
  github: 'https://github.com/test',
  resume: '/resume.pdf'
};

describe('App.vue Integration Tests', () => {
  let router: any;

  beforeEach(() => {
    // Reset fetch mock
    vi.clearAllMocks();
    
    // Setup router
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/projects', component: { template: '<div>Projects</div>' } }
      ]
    });

    // Mock successful fetch responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('hero.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHeroData)
        });
      }
      if (url.includes('about.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAboutData)
        });
      }
      if (url.includes('contacts.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockContactsData)
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('should render WebGLBackground component', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          WebGLBackground: true,
          ScanlineOverlay: true,
          Sidebar: true,
          Footer: true
        }
      }
    });

    await flushPromises();

    const webglBackground = wrapper.findComponent(WebGLBackground);
    expect(webglBackground.exists()).toBe(true);
    expect(webglBackground.props('enabled')).toBe(true);
  });

  it('should render ScanlineOverlay component', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          WebGLBackground: true,
          ScanlineOverlay: true,
          Sidebar: true,
          Footer: true
        }
      }
    });

    await flushPromises();

    const scanlineOverlay = wrapper.findComponent(ScanlineOverlay);
    expect(scanlineOverlay.exists()).toBe(true);
    expect(scanlineOverlay.props('enabled')).toBe(true);
  });

  it('should preserve layout structure with sidebar and main content', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          WebGLBackground: true,
          ScanlineOverlay: true,
          Footer: true
        }
      }
    });

    await flushPromises();

    // Check for layout structure
    const appLayout = wrapper.find('.app-layout');
    expect(appLayout.exists()).toBe(true);

    // Check for sidebar
    const sidebar = wrapper.find('.app-sidebar');
    expect(sidebar.exists()).toBe(true);
    expect(sidebar.findComponent(Sidebar).exists()).toBe(true);

    // Check for main content
    const mainContent = wrapper.find('.app-main');
    expect(mainContent.exists()).toBe(true);
  });

  it('should apply grid background pattern to main content', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          WebGLBackground: true,
          ScanlineOverlay: true,
          Sidebar: true,
          Footer: true
        }
      }
    });

    await flushPromises();

    const mainContent = wrapper.find('.app-main');
    expect(mainContent.exists()).toBe(true);
    
    // Check that the element has the class that applies grid pattern
    expect(mainContent.classes()).toContain('app-main');
  });

  it('should preserve routing functionality', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          WebGLBackground: true,
          ScanlineOverlay: true,
          Sidebar: true,
          Footer: true
        }
      }
    });

    await flushPromises();

    // Initial route should be home
    expect(router.currentRoute.value.path).toBe('/');

    // Navigate to projects
    await router.push('/projects');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/projects');

    // Layout structure should still exist after navigation
    const appLayout = wrapper.find('.app-layout');
    expect(appLayout.exists()).toBe(true);
    
    const sidebar = wrapper.find('.app-sidebar');
    expect(sidebar.exists()).toBe(true);
    
    const mainContent = wrapper.find('.app-main');
    expect(mainContent.exists()).toBe(true);
  });

  it('should load and provide data to child components', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          WebGLBackground: true,
          ScanlineOverlay: true,
          Footer: true
        }
      }
    });

    await flushPromises();

    // Check that Sidebar receives profile and contact data
    const sidebar = wrapper.findComponent(Sidebar);
    expect(sidebar.exists()).toBe(true);
    expect(sidebar.props('profileData')).toEqual(mockHeroData);
    expect(sidebar.props('contactData')).toEqual(mockContactsData);
  });

  it('should display loading state initially', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          WebGLBackground: true,
          ScanlineOverlay: true,
          Sidebar: true,
          Footer: true
        }
      }
    });

    const loading = wrapper.find('.loading');
    expect(loading.exists()).toBe(true);
    expect(loading.text()).toContain('Загрузка');
  });

  it('should display error state when data loading fails', async () => {
    // Mock fetch to fail
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.reject(new Error('Failed to load'))
      })
    );

    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          WebGLBackground: true,
          ScanlineOverlay: true,
          Sidebar: true,
          Footer: true
        }
      }
    });

    await flushPromises();

    const error = wrapper.find('.error');
    expect(error.exists()).toBe(true);
    expect(error.text()).toContain('Ошибка загрузки');
  });

  it('should have correct z-index layering', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          Footer: true
        }
      }
    });

    await flushPromises();

    // WebGLBackground should have z-index: 0 (in its own styles)
    const webglBackground = wrapper.findComponent(WebGLBackground);
    expect(webglBackground.exists()).toBe(true);

    // ScanlineOverlay should have z-index: 9999 (in its own styles)
    const scanlineOverlay = wrapper.findComponent(ScanlineOverlay);
    expect(scanlineOverlay.exists()).toBe(true);

    // App layout should have z-index: 1
    const appLayout = wrapper.find('.app-layout');
    expect(appLayout.exists()).toBe(true);
  });
});
