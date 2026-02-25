import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { axe, toHaveNoViolations } from 'jest-axe'
import App from '../App.vue'
import Sidebar from '../components/Sidebar.vue'
import About from '../components/About.vue'
import Footer from '../components/Footer.vue'

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations)

/**
 * Accessibility Testing with axe-core
 * 
 * These tests use axe-core to automatically detect accessibility violations
 * according to WCAG 2.1 Level AA standards.
 */
describe('Accessibility Tests with axe-core', () => {
  it('App component should have no accessibility violations', async () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          'router-view': {
            template: '<div class="router-view-stub"></div>'
          },
          Sidebar: {
            template: '<aside class="sidebar"></aside>'
          },
          Footer: {
            template: '<footer class="footer"></footer>'
          },
          WebGLBackground: {
            template: '<canvas class="webgl-background"></canvas>'
          },
          ScanlineOverlay: {
            template: '<div class="scanline-overlay"></div>'
          }
        }
      }
    })

    // Disable region rule for isolated component testing with stubs
    const results = await axe(wrapper.element as HTMLElement, {
      rules: {
        region: { enabled: false }
      }
    })
    expect(results).toHaveNoViolations()
  })

  it('Sidebar component should have no accessibility violations', async () => {
    const wrapper = mount(Sidebar, {
      props: {
        profileData: {
          title: 'Test Title',
          subtitle: 'Test Subtitle',
          description: 'Test Description',
          profile_image: '/test.jpg'
        },
        contactData: {
          email: 'test@example.com',
          telegram: 'https://t.me/test',
          github: 'https://github.com/test',
          resume: '/resume.pdf'
        }
      },
      global: {
        stubs: {
          'router-link': {
            template: '<a :href="to"><slot /></a>',
            props: ['to']
          },
          GlassPanel: {
            template: '<div class="glass-panel"><slot /><slot name="footer" /></div>'
          },
          StatusPanel: {
            template: '<div class="status-panel"></div>'
          },
          LazyImage: {
            template: '<img :src="src" :alt="alt" />',
            props: ['src', 'alt']
          }
        }
      }
    })

    // Disable region rule for isolated component testing
    const results = await axe(wrapper.element as HTMLElement, {
      rules: {
        region: { enabled: false }
      }
    })
    expect(results).toHaveNoViolations()
  })

  it('About component should have no accessibility violations', async () => {
    const wrapper = mount(About, {
      props: {
        aboutData: {
          title: 'About Title',
          description: 'About Description',
          features: [
            {
              icon: 'users',
              title: 'Feature 1',
              description: 'Feature 1 Description'
            },
            {
              icon: 'sparkles',
              title: 'Feature 2',
              description: 'Feature 2 Description'
            }
          ]
        }
      },
      global: {
        stubs: {
          GlassCard: {
            template: '<div class="glass-card" :role="$attrs.role"><slot /></div>'
          }
        }
      }
    })

    const results = await axe(wrapper.element as HTMLElement)
    expect(results).toHaveNoViolations()
  })

  it('Footer component should have no accessibility violations', async () => {
    const wrapper = mount(Footer)

    const results = await axe(wrapper.element as HTMLElement)
    expect(results).toHaveNoViolations()
  })
})
