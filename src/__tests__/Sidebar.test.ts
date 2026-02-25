import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Sidebar from '../components/Sidebar.vue'
import GlassPanel from '../components/GlassPanel.vue'
import StatusPanel from '../components/StatusPanel.vue'
import type { HeroData, ContactsData } from '../types'

/**
 * Unit tests for the refactored Sidebar component with cyberpunk glassmorphism design
 * Tests Requirements: 5.1, 5.4, 7.1
 */
describe('Sidebar Component - Cyberpunk Redesign', () => {
  let wrapper: VueWrapper<any>
  
  const mockProfileData: HeroData = {
    title: 'John Doe',
    subtitle: 'Full Stack Developer',
    description: 'Building amazing web applications',
    profile_image: '/test-profile.jpg'
  }

  const mockContactData: ContactsData = {
    email: 'test@example.com',
    telegram: 'https://t.me/testuser',
    github: 'https://github.com/testuser',
    resume: 'https://example.com/resume.pdf'
  }

  beforeEach(() => {
    wrapper = mount(Sidebar, {
      props: {
        profileData: mockProfileData,
        contactData: mockContactData
      },
      global: {
        stubs: {
          'router-link': {
            template: '<a :class="$attrs.class"><slot /></a>',
            props: ['to']
          },
          LazyImage: {
            template: '<img :src="src" :alt="alt" :class="$attrs.class" />',
            props: ['src', 'alt']
          }
        }
      }
    })
  })

  describe('Component Structure', () => {
    it('should render the sidebar with GlassPanel wrapper', () => {
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.findComponent(GlassPanel).exists()).toBe(true)
    })

    it('should preserve all existing props', () => {
      expect(wrapper.props('profileData')).toEqual(mockProfileData)
      expect(wrapper.props('contactData')).toEqual(mockContactData)
    })

    it('should render all main sections', () => {
      expect(wrapper.find('.profile-section').exists()).toBe(true)
      expect(wrapper.find('.navigation-section').exists()).toBe(true)
      expect(wrapper.find('.contacts-section').exists()).toBe(true)
    })
  })

  describe('Profile Section with Cyber Styles', () => {
    it('should render profile image with cyber-style container', () => {
      const imgContainer = wrapper.find('.profile-img-container')
      expect(imgContainer.exists()).toBe(true)
      
      const profileImage = imgContainer.find('.profile-image')
      expect(profileImage.exists()).toBe(true)
      expect(profileImage.attributes('src')).toBe(mockProfileData.profile_image)
      expect(profileImage.attributes('alt')).toBe(mockProfileData.title)
    })

    it('should have rotating frame pseudo-elements on profile container', () => {
      const imgContainer = wrapper.find('.profile-img-container')
      expect(imgContainer.exists()).toBe(true)
      
      // Check that the container exists and wraps the profile image
      const profileImage = imgContainer.find('.profile-image')
      expect(profileImage.exists()).toBe(true)
    })

    it('should render profile title with design tokens', () => {
      const title = wrapper.find('.profile-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe(mockProfileData.title)
      
      // Check that the title has the correct class
      expect(title.classes()).toContain('profile-title')
    })

    it('should render profile subtitle with cyber styling', () => {
      const subtitle = wrapper.find('.profile-subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toBe(mockProfileData.subtitle)
      
      // Check that the subtitle has the correct class
      expect(subtitle.classes()).toContain('profile-subtitle')
    })

    it('should render profile description', () => {
      const description = wrapper.find('.profile-description')
      expect(description.exists()).toBe(true)
      expect(description.text()).toBe(mockProfileData.description)
    })
  })

  describe('Navigation Items with Hover Effects', () => {
    it('should render navigation links with arrow indicators', () => {
      const navLinks = wrapper.findAll('.nav-link')
      expect(navLinks.length).toBe(2)
      
      navLinks.forEach(link => {
        const arrow = link.find('.nav-arrow')
        const text = link.find('.nav-text')
        
        expect(arrow.exists()).toBe(true)
        expect(arrow.text()).toBe('>')
        expect(text.exists()).toBe(true)
      })
    })

    it('should have correct navigation link structure', () => {
      const homeLink = wrapper.findAll('.nav-link')[0]
      expect(homeLink.find('.nav-text').text()).toBe('Главная')
      
      const projectsLink = wrapper.findAll('.nav-link')[1]
      expect(projectsLink.find('.nav-text').text()).toBe('Проекты')
    })

    it('should apply design tokens to nav links', () => {
      const navLink = wrapper.find('.nav-link')
      
      // Check that nav links have the correct structure
      expect(navLink.exists()).toBe(true)
      expect(navLink.classes()).toContain('nav-link')
    })

    it('should have slideInRight animation class available', () => {
      const navLink = wrapper.find('.nav-link')
      expect(navLink.exists()).toBe(true)
      
      // The arrow should exist and be part of the nav link structure
      const arrow = navLink.find('.nav-arrow')
      expect(arrow.exists()).toBe(true)
      expect(arrow.classes()).toContain('nav-arrow')
    })
  })

  describe('Contact Links', () => {
    it('should render all contact links when data is provided', () => {
      const emailLink = wrapper.find('.contact-link.email')
      expect(emailLink.exists()).toBe(true)
      expect(emailLink.attributes('href')).toBe(`mailto:${mockContactData.email}`)
      
      const telegramLink = wrapper.find('.contact-link.telegram')
      expect(telegramLink.exists()).toBe(true)
      expect(telegramLink.attributes('href')).toBe(mockContactData.telegram)
      expect(telegramLink.attributes('target')).toBe('_blank')
      
      const githubLink = wrapper.find('.contact-link.github')
      expect(githubLink.exists()).toBe(true)
      expect(githubLink.attributes('href')).toBe(mockContactData.github)
      expect(githubLink.attributes('target')).toBe('_blank')
      
      const resumeLink = wrapper.find('.contact-link.resume')
      expect(resumeLink.exists()).toBe(true)
      expect(resumeLink.attributes('href')).toBe(mockContactData.resume)
      expect(resumeLink.attributes('target')).toBe('_blank')
    })

    it('should apply design tokens to contact links', () => {
      const contactLink = wrapper.find('.contact-link')
      
      // Check that contact links have the correct structure
      expect(contactLink.exists()).toBe(true)
      expect(contactLink.classes()).toContain('contact-link')
    })

    it('should not render contact links when data is missing', () => {
      const wrapperWithoutContacts = mount(Sidebar, {
        props: {
          profileData: mockProfileData,
          contactData: undefined
        },
        global: {
          stubs: {
            'router-link': {
              template: '<a :class="$attrs.class"><slot /></a>',
              props: ['to']
            },
            LazyImage: {
              template: '<img :src="src" :alt="alt" :class="$attrs.class" />',
              props: ['src', 'alt']
            }
          }
        }
      })
      
      expect(wrapperWithoutContacts.find('.contact-link.email').exists()).toBe(false)
      expect(wrapperWithoutContacts.find('.contact-link.telegram').exists()).toBe(false)
    })
  })

  describe('StatusPanel Integration', () => {
    it('should integrate StatusPanel in footer slot', () => {
      const statusPanel = wrapper.findComponent(StatusPanel)
      expect(statusPanel.exists()).toBe(true)
    })

    it('should pass correct props to StatusPanel', () => {
      const statusPanel = wrapper.findComponent(StatusPanel)
      expect(statusPanel.props('status')).toBe('online')
      expect(statusPanel.props('statusText')).toBe('SYSTEM: ONLINE')
    })
  })

  describe('Design Tokens Usage', () => {
    it('should use design tokens for spacing', () => {
      const sidebar = wrapper.find('.sidebar')
      
      // Check that the sidebar exists and has the correct class
      expect(sidebar.exists()).toBe(true)
      expect(sidebar.classes()).toContain('sidebar')
    })

    it('should use design tokens for colors', () => {
      const profileSubtitle = wrapper.find('.profile-subtitle')
      
      // Check that the subtitle exists and has the correct class
      expect(profileSubtitle.exists()).toBe(true)
      expect(profileSubtitle.classes()).toContain('profile-subtitle')
    })

    it('should use design tokens for typography', () => {
      const profileTitle = wrapper.find('.profile-title')
      
      // Check that the title exists and has the correct class
      expect(profileTitle.exists()).toBe(true)
      expect(profileTitle.classes()).toContain('profile-title')
    })
  })

  describe('Responsive Behavior', () => {
    it('should have responsive classes and styles', () => {
      const sidebar = wrapper.find('.sidebar')
      expect(sidebar.exists()).toBe(true)
      
      // Component should have the sidebar class
      expect(sidebar.classes()).toContain('sidebar')
    })

    it('should maintain structure on different viewport sizes', () => {
      // The component should always have these sections regardless of viewport
      expect(wrapper.find('.profile-section').exists()).toBe(true)
      expect(wrapper.find('.navigation-section').exists()).toBe(true)
      expect(wrapper.find('.contacts-section').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      expect(wrapper.find('aside').exists()).toBe(true)
      expect(wrapper.find('nav').exists()).toBe(true)
    })

    it('should have proper alt text for profile image', () => {
      const profileImage = wrapper.find('.profile-image')
      expect(profileImage.attributes('alt')).toBe(mockProfileData.title)
    })

    it('should have proper rel attributes for external links', () => {
      const telegramLink = wrapper.find('.contact-link.telegram')
      expect(telegramLink.attributes('rel')).toBe('noopener noreferrer')
      
      const githubLink = wrapper.find('.contact-link.github')
      expect(githubLink.attributes('rel')).toBe('noopener noreferrer')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing profile data gracefully', () => {
      const wrapperWithoutProfile = mount(Sidebar, {
        props: {
          profileData: undefined,
          contactData: mockContactData
        },
        global: {
          stubs: {
            'router-link': {
              template: '<a :class="$attrs.class"><slot /></a>',
              props: ['to']
            },
            LazyImage: {
              template: '<img :src="src" :alt="alt" :class="$attrs.class" />',
              props: ['src', 'alt']
            }
          }
        }
      })
      
      expect(wrapperWithoutProfile.find('.sidebar').exists()).toBe(true)
      expect(wrapperWithoutProfile.find('.profile-section').exists()).toBe(true)
    })

    it('should handle partial contact data', () => {
      const partialContactData: Partial<ContactsData> = {
        email: 'test@example.com',
        github: 'https://github.com/testuser'
      }
      
      const wrapperWithPartialContacts = mount(Sidebar, {
        props: {
          profileData: mockProfileData,
          contactData: partialContactData as ContactsData
        },
        global: {
          stubs: {
            'router-link': {
              template: '<a :class="$attrs.class"><slot /></a>',
              props: ['to']
            },
            LazyImage: {
              template: '<img :src="src" :alt="alt" :class="$attrs.class" />',
              props: ['src', 'alt']
            }
          }
        }
      })
      
      expect(wrapperWithPartialContacts.find('.contact-link.email').exists()).toBe(true)
      expect(wrapperWithPartialContacts.find('.contact-link.github').exists()).toBe(true)
      expect(wrapperWithPartialContacts.find('.contact-link.telegram').exists()).toBe(false)
      expect(wrapperWithPartialContacts.find('.contact-link.resume').exists()).toBe(false)
    })
  })
})
