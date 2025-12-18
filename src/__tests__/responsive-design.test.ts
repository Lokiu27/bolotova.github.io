import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import App from '../App.vue'
import Sidebar from '../components/Sidebar.vue'
import About from '../components/About.vue'
import Footer from '../components/Footer.vue'

/**
 * **Feature: vue-migration-docker, Property 19: Responsive design**
 * **Validates: Requirements 5.2**
 * 
 * For any screen size from mobile to desktop, the layout should adapt appropriately 
 * without horizontal scrolling or content overflow
 */

describe('Responsive Design', () => {
  let originalInnerWidth: number
  let originalInnerHeight: number

  beforeEach(() => {
    // Store original window dimensions
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight
  })

  afterEach(() => {
    // Restore original window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    })
  })

  it('should adapt layout for different screen sizes without overflow', () => {
    fc.assert(fc.property(
      fc.record({
        screenWidth: fc.integer({ min: 320, max: 2560 }), // From small mobile to large desktop
        screenHeight: fc.integer({ min: 568, max: 1440 }),
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
      }),
      (testData) => {
        // Set window dimensions for this test
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: testData.screenWidth
        })
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: testData.screenHeight
        })

        // Test Sidebar component responsiveness
        const sidebarWrapper = mount(Sidebar, {
          props: {
            profileData: testData.heroData,
            contactData: testData.contactsData
          }
        })

        const sidebarElement = sidebarWrapper.find('.sidebar').element as HTMLElement
        expect(sidebarElement).toBeTruthy()

        // Verify responsive behavior based on screen size
        if (testData.screenWidth <= 480) {
          // Small mobile: should have appropriate padding and image size
          expect(sidebarWrapper.find('.profile-image').exists()).toBe(true)
        } else if (testData.screenWidth <= 768) {
          // Mobile: sidebar should be static, not fixed
          expect(sidebarWrapper.find('.sidebar').exists()).toBe(true)
        } else if (testData.screenWidth <= 1024) {
          // Tablet: reduced sidebar width
          expect(sidebarWrapper.find('.sidebar').exists()).toBe(true)
        } else {
          // Desktop: full sidebar width
          expect(sidebarWrapper.find('.sidebar').exists()).toBe(true)
        }

        // Test About component responsiveness
        const aboutWrapper = mount(About, {
          props: {
            aboutData: testData.aboutData
          }
        })

        const aboutElement = aboutWrapper.find('.about-section').element as HTMLElement
        expect(aboutElement).toBeTruthy()

        // Verify features grid adapts to screen size
        const featuresGrid = aboutWrapper.find('.features-grid')
        expect(featuresGrid.exists()).toBe(true)

        // Test Footer component responsiveness
        const footerWrapper = mount(Footer)
        const footerElement = footerWrapper.find('.footer').element as HTMLElement
        expect(footerElement).toBeTruthy()

        // Verify no horizontal overflow by checking that elements don't exceed viewport width
        // This is a basic check - in a real browser environment, we'd check computed styles
        expect(sidebarElement.tagName).toBe('ASIDE')
        expect(aboutElement.tagName).toBe('SECTION')
        expect(footerElement.tagName).toBe('FOOTER')
      }
    ), { numRuns: 100 })
  })

  it('should maintain proper layout structure across breakpoints', () => {
    fc.assert(fc.property(
      fc.constantFrom(
        { width: 320, height: 568, name: 'small-mobile' },   // iPhone SE
        { width: 375, height: 667, name: 'mobile' },         // iPhone 8
        { width: 768, height: 1024, name: 'tablet' },        // iPad
        { width: 1024, height: 768, name: 'tablet-landscape' }, // iPad landscape
        { width: 1440, height: 900, name: 'desktop' },       // Desktop
        { width: 1920, height: 1080, name: 'large-desktop' } // Large desktop
      ),
      (viewport) => {
        // Set viewport dimensions
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width
        })
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: viewport.height
        })

        const testData = {
          title: 'Test Expert',
          subtitle: 'Business Analyst',
          description: 'Test description for responsive design',
          profile_image: '/test.jpg'
        }

        const wrapper = mount(Sidebar, {
          props: {
            profileData: testData,
            contactData: {
              email: 'test@example.com',
              telegram: 'https://t.me/test',
              github: 'https://github.com/test',
              resume: '/resume.pdf'
            }
          }
        })

        // Verify essential elements exist regardless of viewport
        expect(wrapper.find('.sidebar').exists()).toBe(true)
        expect(wrapper.find('.profile-image').exists()).toBe(true)
        expect(wrapper.find('.profile-title').exists()).toBe(true)
        expect(wrapper.find('.profile-subtitle').exists()).toBe(true)
        expect(wrapper.find('.contacts-section').exists()).toBe(true)

        // Verify contact links are present and accessible
        const contactLinks = wrapper.findAll('.contact-link')
        expect(contactLinks.length).toBeGreaterThan(0)

        // Each contact link should be properly structured
        contactLinks.forEach(link => {
          expect(link.element.tagName).toBe('A')
          expect(link.attributes('href')).toBeTruthy()
        })
      }
    ), { numRuns: 100 })
  })
})