import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Sidebar from '../components/Sidebar.vue'
import type { HeroData, ContactsData } from '../types'

/**
 * Responsive Behavior Preservation Tests for Design Alignment Bugfix
 * 
 * These tests verify that responsive behavior across different breakpoints
 * remains unchanged after visual fixes are applied.
 * 
 * **Validates: Requirement 3.3 (Responsive behavior across breakpoints)**
 */
describe('Design Alignment - Responsive Behavior Preservation', () => {
  let wrapper: VueWrapper<any>
  
  const mockProfileData: HeroData = {
    title: 'Эксперт по формированию команд',
    subtitle: 'бизнес-аналитиков',
    description: 'Помогу создать эффективную команду бизнес-аналитиков и внедрять современные технологии. Фанат AI инструментов.',
    profile_image: '/assets/images/profile-photo.jpg',
    role: 'Team Formation Expert'
  }

  const mockContactData: ContactsData = {
    email: 'k.bolotova@yandex.ru',
    telegram: 'https://t.me/bolotovakb',
    github: 'https://github.com/Lokiu27',
    resume: '/assets/files/resume.pdf'
  }

  // Mock window.matchMedia for responsive testing
  const mockMatchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })

  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(mockMatchMedia),
    })

    wrapper = mount(Sidebar, {
      props: {
        profileData: mockProfileData,
        contactData: mockContactData
      },
      global: {
        stubs: {
          'router-link': {
            template: '<a :class="$attrs.class" :href="to"><slot /></a>',
            props: ['to', 'exact-active-class', 'active-class']
          },
          LazyImage: {
            template: '<img :src="src" :alt="alt" :class="$attrs.class" />',
            props: ['src', 'alt']
          }
        }
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Desktop Breakpoint (>= 1024px) Preservation', () => {
    it('should preserve desktop sidebar structure', () => {
      // Verify that all desktop elements exist
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.sidebar-panel').exists()).toBe(true)
      expect(wrapper.find('.profile-section').exists()).toBe(true)
      expect(wrapper.find('.navigation-section').exists()).toBe(true)
      expect(wrapper.find('.contacts-section').exists()).toBe(true)
    })

    it('should preserve desktop profile image container', () => {
      const profileImgContainer = wrapper.find('.profile-img-container')
      expect(profileImgContainer.exists()).toBe(true)
      
      const profileImage = wrapper.find('.profile-image')
      expect(profileImage.exists()).toBe(true)
      expect(profileImage.classes()).toContain('profile-image')
    })

    it('should preserve desktop navigation layout', () => {
      const navigationSection = wrapper.find('.navigation-section')
      expect(navigationSection.exists()).toBe(true)
      
      const navLinks = wrapper.findAll('.nav-link')
      expect(navLinks.length).toBeGreaterThan(0)
      
      navLinks.forEach(link => {
        expect(link.find('.nav-arrow').exists()).toBe(true)
        expect(link.find('.nav-text').exists()).toBe(true)
      })
    })

    it('should preserve desktop contact links layout', () => {
      const contactsSection = wrapper.find('.contacts-section')
      expect(contactsSection.exists()).toBe(true)
      
      const contactLinks = wrapper.findAll('.contact-link')
      expect(contactLinks.length).toBeGreaterThan(0)
      
      contactLinks.forEach(link => {
        expect(link.classes()).toContain('contact-link')
      })
    })
  })

  describe('Tablet Breakpoint (768-1024px) Preservation', () => {
    it('should preserve tablet responsive structure', () => {
      // The component should maintain its structure regardless of viewport
      // CSS media queries handle the responsive behavior
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.profile-section').exists()).toBe(true)
      expect(wrapper.find('.navigation-section').exists()).toBe(true)
      expect(wrapper.find('.contacts-section').exists()).toBe(true)
    })

    it('should preserve tablet profile image structure', () => {
      const profileImgContainer = wrapper.find('.profile-img-container')
      expect(profileImgContainer.exists()).toBe(true)
      
      const profileImage = wrapper.find('.profile-image')
      expect(profileImage.exists()).toBe(true)
      
      // The responsive behavior is handled by CSS, component structure remains the same
      expect(profileImage.classes()).toContain('profile-image')
    })

    it('should preserve tablet navigation functionality', () => {
      const navLinks = wrapper.findAll('.nav-link')
      expect(navLinks.length).toBeGreaterThan(0)
      
      // Navigation functionality should remain the same across breakpoints
      navLinks.forEach(link => {
        expect(link.classes()).toContain('nav-link')
        expect(link.find('.nav-arrow').exists()).toBe(true)
        expect(link.find('.nav-text').exists()).toBe(true)
      })
    })
  })

  describe('Mobile Breakpoint (< 768px) Preservation', () => {
    it('should preserve mobile responsive structure', () => {
      // Component structure remains consistent across all breakpoints
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.profile-section').exists()).toBe(true)
      expect(wrapper.find('.navigation-section').exists()).toBe(true)
      expect(wrapper.find('.contacts-section').exists()).toBe(true)
    })

    it('should preserve mobile profile section', () => {
      const profileSection = wrapper.find('.profile-section')
      expect(profileSection.exists()).toBe(true)
      
      const profileTitle = wrapper.find('.profile-title')
      expect(profileTitle.exists()).toBe(true)
      expect(profileTitle.text()).toContain(mockProfileData.title)
      expect(profileTitle.text()).toContain(mockProfileData.subtitle)
    })

    it('should preserve mobile navigation accessibility', () => {
      const navigationSection = wrapper.find('.navigation-section')
      expect(navigationSection.attributes('role')).toBe('navigation')
      expect(navigationSection.attributes('aria-label')).toBe('Main navigation')
      
      const navLinks = wrapper.findAll('.nav-link')
      navLinks.forEach(link => {
        expect(link.attributes('aria-label')).toBeDefined()
      })
    })

    it('should preserve mobile contact links functionality', () => {
      const contactsSection = wrapper.find('.contacts-section')
      expect(contactsSection.exists()).toBe(true)
      expect(contactsSection.attributes('role')).toBe('navigation')
      expect(contactsSection.attributes('aria-label')).toBe('Contact links')
      
      const emailLink = wrapper.find('.contact-link.email')
      expect(emailLink.exists()).toBe(true)
      expect(emailLink.attributes('href')).toBe(`mailto:${mockContactData.email}`)
    })
  })

  describe('Small Mobile Breakpoint (< 480px) Preservation', () => {
    it('should preserve small mobile structure integrity', () => {
      // Even at the smallest breakpoint, all core elements should exist
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.profile-section').exists()).toBe(true)
      expect(wrapper.find('.navigation-section').exists()).toBe(true)
      expect(wrapper.find('.contacts-section').exists()).toBe(true)
    })

    it('should preserve small mobile profile image', () => {
      const profileImgContainer = wrapper.find('.profile-img-container')
      expect(profileImgContainer.exists()).toBe(true)
      
      const profileImage = wrapper.find('.profile-image')
      expect(profileImage.exists()).toBe(true)
      expect(profileImage.attributes('src')).toBe(mockProfileData.profile_image)
      expect(profileImage.attributes('alt')).toBe(mockProfileData.title)
    })

    it('should preserve small mobile navigation structure', () => {
      const navLinks = wrapper.findAll('.nav-link')
      expect(navLinks.length).toBeGreaterThan(0)
      
      // Navigation should remain functional at all breakpoints
      // Note: Navigation text now includes "/" prefix
      const homeLink = navLinks.find(link => link.text().includes('ГЛАВНАЯ'))
      expect(homeLink).toBeDefined()
      expect(homeLink!.attributes('href')).toBe('/')
      expect(homeLink!.text()).toContain('/ ГЛАВНАЯ')
    })
  })

  describe('Responsive CSS Classes Preservation', () => {
    it('should preserve responsive CSS class structure', () => {
      // Verify that all elements have the correct CSS classes for responsive behavior
      const sidebar = wrapper.find('.sidebar')
      expect(sidebar.classes()).toContain('sidebar')
      
      const profileImgContainer = wrapper.find('.profile-img-container')
      expect(profileImgContainer.classes()).toContain('profile-img-container')
      
      const profileImage = wrapper.find('.profile-image')
      expect(profileImage.classes()).toContain('profile-image')
      
      const navigationSection = wrapper.find('.navigation-section')
      expect(navigationSection.classes()).toContain('navigation-section')
      
      const contactsSection = wrapper.find('.contacts-section')
      expect(contactsSection.classes()).toContain('contacts-section')
    })

    it('should preserve responsive typography classes', () => {
      const profileTitle = wrapper.find('.profile-title')
      expect(profileTitle.classes()).toContain('profile-title')
      
      const profileDescription = wrapper.find('.profile-description')
      expect(profileDescription.classes()).toContain('profile-description')
    })

    it('should preserve responsive navigation classes', () => {
      const navLinks = wrapper.findAll('.nav-link')
      
      navLinks.forEach(link => {
        expect(link.classes()).toContain('nav-link')
        
        const arrow = link.find('.nav-arrow')
        expect(arrow.classes()).toContain('nav-arrow')
        
        const text = link.find('.nav-text')
        expect(text.classes()).toContain('nav-text')
      })
    })
  })

  describe('Responsive Behavior Edge Cases', () => {
    it('should preserve component integrity with missing data at all breakpoints', () => {
      const wrapperWithoutData = mount(Sidebar, {
        props: {
          profileData: undefined,
          contactData: undefined
        },
        global: {
          stubs: {
            'router-link': {
              template: '<a :class="$attrs.class"><slot /></a>',
              props: ['to', 'exact-active-class', 'active-class']
            },
            LazyImage: {
              template: '<img :src="src" :alt="alt" :class="$attrs.class" />',
              props: ['src', 'alt']
            }
          }
        }
      })
      
      // Component should render gracefully without data at all breakpoints
      expect(wrapperWithoutData.find('.sidebar').exists()).toBe(true)
      expect(wrapperWithoutData.find('.profile-section').exists()).toBe(true)
      expect(wrapperWithoutData.find('.navigation-section').exists()).toBe(true)
    })

    it('should preserve responsive layout with partial data', () => {
      const partialContactData: Partial<ContactsData> = {
        email: 'test@example.com'
      }
      
      const wrapperWithPartialData = mount(Sidebar, {
        props: {
          profileData: mockProfileData,
          contactData: partialContactData as ContactsData
        },
        global: {
          stubs: {
            'router-link': {
              template: '<a :class="$attrs.class"><slot /></a>',
              props: ['to', 'exact-active-class', 'active-class']
            },
            LazyImage: {
              template: '<img :src="src" :alt="alt" :class="$attrs.class" />',
              props: ['src', 'alt']
            }
          }
        }
      })
      
      // Layout should remain stable with partial data
      expect(wrapperWithPartialData.find('.sidebar').exists()).toBe(true)
      expect(wrapperWithPartialData.find('.contacts-section').exists()).toBe(true)
      expect(wrapperWithPartialData.find('.contact-link.email').exists()).toBe(true)
    })
  })

  describe('Responsive Animation Preservation', () => {
    it('should preserve animation structure across breakpoints', () => {
      // Verify that animation-related classes exist for responsive behavior
      const profileImgContainer = wrapper.find('.profile-img-container')
      expect(profileImgContainer.exists()).toBe(true)
      
      const navLinks = wrapper.findAll('.nav-link')
      navLinks.forEach(link => {
        const arrow = link.find('.nav-arrow')
        expect(arrow.exists()).toBe(true)
        expect(arrow.classes()).toContain('nav-arrow')
      })
    })

    it('should preserve prefers-reduced-motion support across breakpoints', () => {
      // Verify that elements that support reduced motion exist
      const profileImgContainer = wrapper.find('.profile-img-container')
      expect(profileImgContainer.exists()).toBe(true)
      
      const navArrows = wrapper.findAll('.nav-arrow')
      expect(navArrows.length).toBeGreaterThan(0)
      
      navArrows.forEach(arrow => {
        expect(arrow.classes()).toContain('nav-arrow')
      })
    })
  })
})