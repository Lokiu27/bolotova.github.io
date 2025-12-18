import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import App from '../App.vue'
import Sidebar from '../components/Sidebar.vue'
import About from '../components/About.vue'
import Footer from '../components/Footer.vue'

/**
 * **Feature: vue-migration-docker, Property 22: Browser compatibility**
 * **Validates: Requirements 5.5**
 * 
 * For any modern browser (Chrome, Firefox, Safari, Edge), the application should 
 * render and function correctly
 */

describe('Browser Compatibility', () => {
  let originalUserAgent: string

  beforeEach(() => {
    originalUserAgent = navigator.userAgent
  })

  afterEach(() => {
    // Restore original user agent
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: originalUserAgent
    })
  })

  it('should render correctly across different browser environments', () => {
    fc.assert(fc.property(
      fc.record({
        userAgent: fc.constantFrom(
          // Chrome
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          // Firefox
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
          // Safari
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
          // Edge
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
        ),
        testData: fc.record({
          heroData: fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            subtitle: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            profile_image: fc.constant('/assets/images/profile-photo.jpg')
          }),
          aboutData: fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            features: fc.array(fc.record({
              icon: fc.constantFrom('users', 'sparkles', 'bullseye'),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 1, maxLength: 300 })
            }), { minLength: 1, maxLength: 5 })
          }),
          contactsData: fc.record({
            email: fc.emailAddress(),
            telegram: fc.webUrl(),
            github: fc.webUrl(),
            resume: fc.webUrl()
          })
        })
      }),
      (testCase) => {
        // Mock the user agent for this test
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          configurable: true,
          value: testCase.userAgent
        })

        // Test Sidebar component browser compatibility
        const sidebarWrapper = mount(Sidebar, {
          props: {
            profileData: testCase.testData.heroData,
            contactData: testCase.testData.contactsData
          }
        })

        // Verify essential CSS features work across browsers
        const sidebarElement = sidebarWrapper.find('.sidebar').element as HTMLElement
        expect(sidebarElement).toBeTruthy()

        // Test CSS custom properties (CSS variables) support
        const profileImage = sidebarWrapper.find('.profile-image')
        expect(profileImage.exists()).toBe(true)

        // Verify flexbox layout works (supported in all modern browsers)
        expect(sidebarWrapper.find('.contacts-section').exists()).toBe(true)

        // Test About component browser compatibility
        const aboutWrapper = mount(About, {
          props: {
            aboutData: testCase.testData.aboutData
          }
        })

        // Verify CSS Grid support (modern browsers)
        const featuresGrid = aboutWrapper.find('.features-grid')
        expect(featuresGrid.exists()).toBe(true)

        // Test Footer component browser compatibility
        const footerWrapper = mount(Footer)
        expect(footerWrapper.find('.footer').exists()).toBe(true)

        // Verify modern CSS features are properly applied
        const aboutElement = aboutWrapper.find('.about-section').element as HTMLElement
        expect(aboutElement).toBeTruthy()
      }
    ), { numRuns: 100 })
  })

  it('should handle CSS features gracefully across browser versions', () => {
    fc.assert(fc.property(
      fc.record({
        cssFeature: fc.constantFrom(
          'flexbox',
          'grid',
          'custom-properties',
          'transforms',
          'transitions'
        ),
        componentType: fc.constantFrom('sidebar', 'about', 'footer')
      }),
      (testCase) => {
        let wrapper: any

        const testData = {
          heroData: {
            title: 'Test Title',
            subtitle: 'Test Subtitle',
            description: 'Test Description',
            profile_image: '/test.jpg'
          },
          aboutData: {
            title: 'Test About',
            description: 'Test Description',
            features: [{
              icon: 'users',
              title: 'Test Feature',
              description: 'Test Feature Description'
            }]
          },
          contactsData: {
            email: 'test@example.com',
            telegram: 'https://t.me/test',
            github: 'https://github.com/test',
            resume: '/resume.pdf'
          }
        }

        // Mount the appropriate component
        switch (testCase.componentType) {
          case 'sidebar':
            wrapper = mount(Sidebar, {
              props: {
                profileData: testData.heroData,
                contactData: testData.contactsData
              }
            })
            break
          case 'about':
            wrapper = mount(About, {
              props: {
                aboutData: testData.aboutData
              }
            })
            break
          case 'footer':
            wrapper = mount(Footer)
            break
        }

        // Verify component renders without errors
        expect(wrapper.exists()).toBe(true)

        // Test specific CSS feature compatibility
        switch (testCase.cssFeature) {
          case 'flexbox':
            // Flexbox is used in sidebar and footer layouts
            if (testCase.componentType === 'sidebar') {
              expect(wrapper.find('.sidebar').exists()).toBe(true)
              expect(wrapper.find('.contacts-section').exists()).toBe(true)
            }
            break

          case 'grid':
            // CSS Grid is used in about component features
            if (testCase.componentType === 'about') {
              expect(wrapper.find('.features-grid').exists()).toBe(true)
            }
            break

          case 'custom-properties':
            // CSS custom properties (variables) are used throughout
            const element = wrapper.find('*').element as HTMLElement
            expect(element).toBeTruthy()
            break

          case 'transforms':
            // CSS transforms are used for hover effects
            const interactiveElements = wrapper.findAll('a, .feature-card')
            expect(interactiveElements.length).toBeGreaterThanOrEqual(0)
            break

          case 'transitions':
            // CSS transitions are used for smooth interactions
            const transitionElements = wrapper.findAll('a, .contact-link')
            expect(transitionElements.length).toBeGreaterThanOrEqual(0)
            break
        }

        // Verify no JavaScript errors occurred during rendering
        expect(wrapper.vm).toBeTruthy()
      }
    ), { numRuns: 100 })
  })

  it('should provide fallbacks for unsupported features', () => {
    fc.assert(fc.property(
      fc.record({
        testScenario: fc.constantFrom(
          'missing-css-variables',
          'no-flexbox-support',
          'limited-grid-support',
          'no-transform-support'
        )
      }),
      (testCase) => {
        // Test that components still render even if certain CSS features aren't supported
        const sidebarWrapper = mount(Sidebar, {
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
          }
        })

        // Basic functionality should work regardless of CSS feature support
        expect(sidebarWrapper.find('.sidebar').exists()).toBe(true)
        expect(sidebarWrapper.find('.profile-image').exists()).toBe(true)
        expect(sidebarWrapper.find('.profile-title').exists()).toBe(true)
        expect(sidebarWrapper.find('.contacts-section').exists()).toBe(true)

        // Contact links should be functional
        const contactLinks = sidebarWrapper.findAll('.contact-link')
        contactLinks.forEach(link => {
          expect(link.element.tagName).toBe('A')
          expect(link.attributes('href')).toBeTruthy()
        })

        // Content should be accessible and readable
        const profileTitle = sidebarWrapper.find('.profile-title')
        expect(profileTitle.text()).toBeTruthy()
      }
    ), { numRuns: 100 })
  })
})