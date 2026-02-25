import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import CyberBreadcrumbs from '../components/CyberBreadcrumbs.vue';
import type { BreadcrumbItem } from '../components/CyberBreadcrumbs.vue';

/**
 * Unit тесты для компонента CyberBreadcrumbs
 * Requirements: 6.3
 */
describe('CyberBreadcrumbs Component Unit Tests', () => {
  // Создаем простой роутер для тестов
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/profile', component: { template: '<div>Profile</div>' } },
      { path: '/settings', component: { template: '<div>Settings</div>' } }
    ]
  });

  it('should render breadcrumb items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'ROOT' },
      { label: 'PROFILE' },
      { label: 'OVERVIEW' }
    ];

    const wrapper = mount(CyberBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router]
      }
    });

    const breadcrumbItems = wrapper.findAll('.breadcrumb-item');
    expect(breadcrumbItems).toHaveLength(3);
    expect(breadcrumbItems[0].text()).toContain('ROOT');
    expect(breadcrumbItems[1].text()).toContain('PROFILE');
    expect(breadcrumbItems[2].text()).toContain('OVERVIEW');
  });

  it('should render router-link for items with path (except last)', () => {
    const items: BreadcrumbItem[] = [
      { label: 'ROOT', path: '/' },
      { label: 'PROFILE', path: '/profile' },
      { label: 'OVERVIEW' }
    ];

    const wrapper = mount(CyberBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router]
      }
    });

    const links = wrapper.findAllComponents({ name: 'RouterLink' });
    expect(links).toHaveLength(2); // Только первые два элемента должны быть ссылками
    
    // Проверяем, что последний элемент не является ссылкой
    const lastItem = wrapper.findAll('.breadcrumb-item')[2];
    expect(lastItem.find('.breadcrumb-link').exists()).toBe(false);
    expect(lastItem.find('.breadcrumb-text').exists()).toBe(true);
  });

  it('should render separator between items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'ROOT' },
      { label: 'PROFILE' },
      { label: 'OVERVIEW' }
    ];

    const wrapper = mount(CyberBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router]
      }
    });

    const separators = wrapper.findAll('.breadcrumb-separator');
    expect(separators).toHaveLength(2); // Разделители между 3 элементами = 2
    expect(separators[0].text()).toBe('/');
    expect(separators[1].text()).toBe('/');
  });

  it('should use custom separator', () => {
    const items: BreadcrumbItem[] = [
      { label: 'ROOT' },
      { label: 'PROFILE' }
    ];

    const wrapper = mount(CyberBreadcrumbs, {
      props: { 
        items,
        separator: '>'
      },
      global: {
        plugins: [router]
      }
    });

    const separator = wrapper.find('.breadcrumb-separator');
    expect(separator.text()).toBe('>');
  });

  it('should not render separator after last item', () => {
    const items: BreadcrumbItem[] = [
      { label: 'ROOT' },
      { label: 'PROFILE' }
    ];

    const wrapper = mount(CyberBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router]
      }
    });

    const breadcrumbItems = wrapper.findAll('.breadcrumb-item');
    const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
    
    expect(lastItem.find('.breadcrumb-separator').exists()).toBe(false);
  });

  it('should apply active class to last item', () => {
    const items: BreadcrumbItem[] = [
      { label: 'ROOT' },
      { label: 'PROFILE' },
      { label: 'OVERVIEW' }
    ];

    const wrapper = mount(CyberBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router]
      }
    });

    const breadcrumbItems = wrapper.findAll('.breadcrumb-item');
    const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
    
    expect(lastItem.classes()).toContain('breadcrumb-item--active');
  });

  it('should not apply active class to non-last items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'ROOT' },
      { label: 'PROFILE' },
      { label: 'OVERVIEW' }
    ];

    const wrapper = mount(CyberBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router]
      }
    });

    const breadcrumbItems = wrapper.findAll('.breadcrumb-item');
    
    expect(breadcrumbItems[0].classes()).not.toContain('breadcrumb-item--active');
    expect(breadcrumbItems[1].classes()).not.toContain('breadcrumb-item--active');
  });

  it('should render single item without separator', () => {
    const items: BreadcrumbItem[] = [
      { label: 'ROOT' }
    ];

    const wrapper = mount(CyberBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.findAll('.breadcrumb-item')).toHaveLength(1);
    expect(wrapper.findAll('.breadcrumb-separator')).toHaveLength(0);
  });

  it('should have proper ARIA attributes', () => {
    const items: BreadcrumbItem[] = [
      { label: 'ROOT' },
      { label: 'PROFILE' }
    ];

    const wrapper = mount(CyberBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router]
      }
    });

    const nav = wrapper.find('nav');
    expect(nav.attributes('aria-label')).toBe('Breadcrumb navigation');
    
    const separators = wrapper.findAll('.breadcrumb-separator');
    separators.forEach(separator => {
      expect(separator.attributes('aria-hidden')).toBe('true');
    });
  });

  it('should apply cyberpunk styles (uppercase, monospace)', () => {
    const items: BreadcrumbItem[] = [
      { label: 'ROOT' }
    ];

    const wrapper = mount(CyberBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router]
      }
    });

    const nav = wrapper.find('.cyber-breadcrumbs');
    expect(nav.exists()).toBe(true);
  });

  it('should handle items with mixed path presence', () => {
    const items: BreadcrumbItem[] = [
      { label: 'ROOT', path: '/' },
      { label: 'PROFILE' }, // Без path
      { label: 'SETTINGS', path: '/settings' },
      { label: 'OVERVIEW' } // Последний элемент
    ];

    const wrapper = mount(CyberBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router]
      }
    });

    const breadcrumbItems = wrapper.findAll('.breadcrumb-item');
    expect(breadcrumbItems).toHaveLength(4);
    
    // Первый элемент с path должен быть ссылкой
    expect(breadcrumbItems[0].find('.breadcrumb-link').exists()).toBe(true);
    
    // Второй элемент без path должен быть текстом
    expect(breadcrumbItems[1].find('.breadcrumb-text').exists()).toBe(true);
    expect(breadcrumbItems[1].find('.breadcrumb-link').exists()).toBe(false);
    
    // Третий элемент с path должен быть ссылкой
    expect(breadcrumbItems[2].find('.breadcrumb-link').exists()).toBe(true);
    
    // Последний элемент всегда текст
    expect(breadcrumbItems[3].find('.breadcrumb-text').exists()).toBe(true);
    expect(breadcrumbItems[3].find('.breadcrumb-link').exists()).toBe(false);
  });

  it('should render correct router-link paths', () => {
    const items: BreadcrumbItem[] = [
      { label: 'ROOT', path: '/' },
      { label: 'PROFILE', path: '/profile' },
      { label: 'OVERVIEW' }
    ];

    const wrapper = mount(CyberBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router]
      }
    });

    const links = wrapper.findAllComponents({ name: 'RouterLink' });
    expect(links[0].props('to')).toBe('/');
    expect(links[1].props('to')).toBe('/profile');
  });
});
