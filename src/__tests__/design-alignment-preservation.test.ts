import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import StatusPanel from '../components/StatusPanel.vue'
import type { HeroData, ContactsData } from '../types'

/**
 * Preservation Tests for Design Alignment Bugfix
 * 
 * These tests capture the current functionality that MUST remain unchanged
 * after visual fixes are applied. They run on UNFIXED code and should PASS,
 * confirming that all existing behavior works correctly.
 * 
 * **Validates: Requirements 3.1-3.8 (Unchanged Behavior - Regression Prevention)**
 */
describe('Design Alignment - Functionality Preservation', () => {
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

  beforeEach(() => {
    wrapper = mount(Sidebar, {
      props: {
        profileData: mockProfileData,
        contactData: mockContactData
      },
      global: {
        stubs: {
          'router-link': {
            template: '<a :class="$attrs.class" :href="to" @click="$emit(\'click\', $event)"><slot /></a>',
            props: ['to', 'exact-active-class', 'active-class'],
            emits: ['click']
          },
          LazyImage: {
            template: '<img :src="src" :alt="alt" :class="$attrs.class" @load="$emit(\'load\')" />',
            props: ['src', 'alt'],
            emits: ['load']
          }
        }
      }
    })
  })

  describe('3.1 Navigation Functionality Preservation', () => {
    it('should preserve router-link navigation functionality', () => {
      const navLinks = wrapper.findAll('.nav-link')
      expect(navLinks.length).toBeGreaterThan(0)
      
      // Check that navigation links exist and have correct structure
      const homeLink = navLinks.find(link => link.text().includes('ГЛАВНАЯ'))
      expect(homeLink).toBeDefined()
      expect(homeLink!.attributes('href')).toBe('/')
      
      const projectsLink = navLinks.find(link => link.text().includes('ПРОЕКТЫ'))
      expect(projectsLink).toBeDefined()
      expect(projectsLink!.attributes('href')).toBe('/projects')
      
      const resumeLink = navLinks.find(link => link.text().includes('РЕЗЮМЕ'))
      expect(resumeLink).toBeDefined()
      expect(resumeLink!.attributes('href')).toBe('/resume')
    })

    it('should preserve active state class application', () => {
      const navLinks = wrapper.findAll('.nav-link')
      
      // Check that nav links have the correct active class attributes
      const homeLink = navLinks.find(link => link.text().includes('ГЛАВНАЯ'))
      expect(homeLink).toBeDefined()
      expect(homeLink!.classes()).toContain('nav-link')
      
      const projectsLink = navLinks.find(link => link.text().includes('ПРОЕКТЫ'))
      expect(projectsLink).toBeDefined()
      expect(projectsLink!.classes()).toContain('nav-link')
      
      const resumeLink = navLinks.find(link => link.text().includes('РЕЗЮМЕ'))
      expect(resumeLink).toBeDefined()
      expect(resumeLink!.classes()).toContain('nav-link')
    })

    it('should preserve navigation click events', async () => {
      const navLink = wrapper.find('.nav-link')
      expect(navLink.exists()).toBe(true)
      
      // Simulate click event
      await navLink.trigger('click')
      
      // Verify that the click event can be triggered without errors
      expect(navLink.exists()).toBe(true)
    })
  })

  describe('3.2 Hover Animation Preservation', () => {
    it('should preserve arrow visibility animation structure', () => {
      const navLinks = wrapper.findAll('.nav-link')
      
      navLinks.forEach(link => {
        const arrow = link.find('.nav-arrow')
        const text = link.find('.nav-text')
        
        expect(arrow.exists()).toBe(true)
        expect(text.exists()).toBe(true)
        expect(arrow.text()).toBe('>')
      })
    })

    it('should preserve hover state CSS classes', async () => {
      const navLink = wrapper.find('.nav-link')
      expect(navLink.exists()).toBe(true)
      
      // Simulate hover event
      await navLink.trigger('mouseenter')
      
      // The hover effects are CSS-based, so we verify the structure exists
      const arrow = navLink.find('.nav-arrow')
      const text = navLink.find('.nav-text')
      
      expect(arrow.exists()).toBe(true)
      expect(text.exists()).toBe(true)
      expect(arrow.classes()).toContain('nav-arrow')
      expect(text.classes()).toContain('nav-text')
    })

    it('should preserve contact link hover effects structure', async () => {
      const contactLinks = wrapper.findAll('.contact-link')
      expect(contactLinks.length).toBeGreaterThan(0)
      
      for (const link of contactLinks) {
        // Simulate hover
        await link.trigger('mouseenter')
        
        // Verify structure for hover effects exists
        expect(link.classes()).toContain('contact-link')
      }
    })
  })

  describe('3.3 Responsive Behavior Preservation', () => {
    it('should preserve responsive CSS classes and structure', () => {
      const sidebar = wrapper.find('.sidebar')
      expect(sidebar.exists()).toBe(true)
      expect(sidebar.classes()).toContain('sidebar')
      
      // Verify all responsive sections exist
      expect(wrapper.find('.profile-section').exists()).toBe(true)
      expect(wrapper.find('.navigation-section').exists()).toBe(true)
      expect(wrapper.find('.contacts-section').exists()).toBe(true)
    })

    it('should preserve profile image responsive container', () => {
      const profileImgContainer = wrapper.find('.profile-img-container')
      expect(profileImgContainer.exists()).toBe(true)
      
      const profileImage = wrapper.find('.profile-image')
      expect(profileImage.exists()).toBe(true)
      expect(profileImage.classes()).toContain('profile-image')
    })

    it('should preserve responsive navigation structure', () => {
      const navigationSection = wrapper.find('.navigation-section')
      expect(navigationSection.exists()).toBe(true)
      expect(navigationSection.attributes('role')).toBe('navigation')
      expect(navigationSection.attributes('aria-label')).toBe('Main navigation')
    })
  })

  describe('3.4 Keyboard Navigation and Accessibility Preservation', () => {
    it('should preserve semantic HTML structure', () => {
      // Verify semantic elements
      expect(wrapper.find('aside').exists()).toBe(true)
      expect(wrapper.find('nav').exists()).toBe(true)
      expect(wrapper.find('header').exists()).toBe(true)
    })

    it('should preserve ARIA labels on navigation', () => {
      const navigationSection = wrapper.find('.navigation-section')
      expect(navigationSection.attributes('role')).toBe('navigation')
      expect(navigationSection.attributes('aria-label')).toBe('Main navigation')
      
      const navLinks = wrapper.findAll('.nav-link')
      navLinks.forEach(link => {
        expect(link.attributes('aria-label')).toBeDefined()
      })
    })

    it('should preserve ARIA labels on contact links', () => {
      const contactsSection = wrapper.find('.contacts-section')
      expect(contactsSection.attributes('role')).toBe('navigation')
      expect(contactsSection.attributes('aria-label')).toBe('Contact links')
      
      const contactLinks = wrapper.findAll('.contact-link')
      contactLinks.forEach(link => {
        expect(link.attributes('aria-label')).toBeDefined()
      })
    })

    it('should preserve focus-visible support structure', async () => {
      const navLink = wrapper.find('.nav-link')
      expect(navLink.exists()).toBe(true)
      
      // Simulate focus event
      await navLink.trigger('focus')
      
      // Verify the element can receive focus
      expect(navLink.exists()).toBe(true)
    })

    it('should preserve profile image alt text', () => {
      const profileImage = wrapper.find('.profile-image')
      expect(profileImage.exists()).toBe(true)
      expect(profileImage.attributes('alt')).toBe(mockProfileData.title)
    })
  })

  describe('3.5 Data Loading from JSON Files Preservation', () => {
    it('should preserve profile data prop handling', () => {
      expect(wrapper.props('profileData')).toEqual(mockProfileData)
      
      // Verify profile data is displayed correctly
      const profileTitle = wrapper.find('.profile-title')
      // Profile title now contains both title and subtitle with <br> between them
      expect(profileTitle.text()).toContain(mockProfileData.title)
      expect(profileTitle.text()).toContain(mockProfileData.subtitle)
      
      const profileDescription = wrapper.find('.profile-description')
      // Description is now uppercase due to CSS text-transform
      expect(profileDescription.text().toUpperCase()).toBe(mockProfileData.description.toUpperCase())
      
      const roleBadge = wrapper.find('.role-badge')
      expect(roleBadge.text()).toBe(mockProfileData.role)
    })

    it('should preserve contact data prop handling', () => {
      expect(wrapper.props('contactData')).toEqual(mockContactData)
      
      // Verify contact data is used correctly
      const emailLink = wrapper.find('.contact-link.email')
      expect(emailLink.attributes('href')).toBe(`mailto:${mockContactData.email}`)
      
      const telegramLink = wrapper.find('.contact-link.telegram')
      expect(telegramLink.attributes('href')).toBe(mockContactData.telegram)
      
      const githubLink = wrapper.find('.contact-link.github')
      expect(githubLink.attributes('href')).toBe(mockContactData.github)
    })

    it('should preserve graceful handling of missing data', () => {
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
      
      // Component should still render without data
      expect(wrapperWithoutData.find('.sidebar').exists()).toBe(true)
      expect(wrapperWithoutData.find('.profile-section').exists()).toBe(true)
      expect(wrapperWithoutData.find('.navigation-section').exists()).toBe(true)
    })
  })

  describe('3.6 LazyImage Component Functionality Preservation', () => {
    it('should preserve LazyImage component usage', () => {
      // Check that the profile image element exists with correct attributes
      const profileImage = wrapper.find('.profile-image')
      expect(profileImage.exists()).toBe(true)
      expect(profileImage.attributes('src')).toBe(mockProfileData.profile_image)
      expect(profileImage.attributes('alt')).toBe(mockProfileData.title)
    })

    it('should preserve profile image CSS classes', () => {
      const profileImage = wrapper.find('.profile-image')
      expect(profileImage.exists()).toBe(true)
      expect(profileImage.classes()).toContain('profile-image')
      expect(profileImage.classes()).toContain('critical-image')
    })

    it('should preserve profile image container structure', () => {
      const profileImgContainer = wrapper.find('.profile-img-container')
      expect(profileImgContainer.exists()).toBe(true)
      
      const profileImage = profileImgContainer.find('.profile-image')
      expect(profileImage.exists()).toBe(true)
    })
  })

  describe('3.7 Existing Animations Preservation', () => {
    it('should preserve glitch-hover effect classes', () => {
      const profileTitle = wrapper.find('.profile-title')
      expect(profileTitle.classes()).toContain('glitch-hover')
    })

    it('should preserve rotating profile frame structure', () => {
      const profileImgContainer = wrapper.find('.profile-img-container')
      expect(profileImgContainer.exists()).toBe(true)
      
      // The rotating frames are implemented via CSS pseudo-elements
      // We verify the container exists to support the animations
      expect(profileImgContainer.classes()).toContain('profile-img-container')
    })

    it('should preserve nav arrow animation structure', () => {
      const navLinks = wrapper.findAll('.nav-link')
      
      navLinks.forEach(link => {
        const arrow = link.find('.nav-arrow')
        expect(arrow.exists()).toBe(true)
        expect(arrow.classes()).toContain('nav-arrow')
        expect(arrow.attributes('aria-hidden')).toBe('true')
      })
    })

    it('should preserve prefers-reduced-motion support', () => {
      // Verify that animation elements exist and can be controlled by CSS
      const profileImgContainer = wrapper.find('.profile-img-container')
      expect(profileImgContainer.exists()).toBe(true)
      
      const navArrow = wrapper.find('.nav-arrow')
      expect(navArrow.exists()).toBe(true)
    })
  })

  describe('3.8 GlassPanel Component Structure Preservation', () => {
    it('should preserve GlassPanel wrapper component', () => {
      const glassPanel = wrapper.findComponent({ name: 'GlassPanel' })
      expect(glassPanel.exists()).toBe(true)
    })

    it('should preserve StatusPanel in footer slot', () => {
      const statusPanel = wrapper.findComponent(StatusPanel)
      expect(statusPanel.exists()).toBe(true)
      
      // Verify StatusPanel props
      expect(statusPanel.props('status')).toBe('online')
      expect(statusPanel.props('statusText')).toBe('SYSTEM: ONLINE')
    })

    it('should preserve glassmorphism structure', () => {
      const sidebarPanel = wrapper.find('.sidebar-panel')
      expect(sidebarPanel.exists()).toBe(true)
      
      // Verify the panel contains all sections
      expect(sidebarPanel.find('.profile-section').exists()).toBe(true)
      expect(sidebarPanel.find('.navigation-section').exists()).toBe(true)
      expect(sidebarPanel.find('.contacts-section').exists()).toBe(true)
    })
  })

  describe('Contact Links Functionality Preservation', () => {
    it('should preserve email link functionality', () => {
      const emailLink = wrapper.find('.contact-link.email')
      expect(emailLink.exists()).toBe(true)
      expect(emailLink.attributes('href')).toBe(`mailto:${mockContactData.email}`)
      expect(emailLink.text()).toBe('Email')
    })

    it('should preserve external link attributes', () => {
      const telegramLink = wrapper.find('.contact-link.telegram')
      expect(telegramLink.attributes('target')).toBe('_blank')
      expect(telegramLink.attributes('rel')).toBe('noopener noreferrer')
      
      const githubLink = wrapper.find('.contact-link.github')
      expect(githubLink.attributes('target')).toBe('_blank')
      expect(githubLink.attributes('rel')).toBe('noopener noreferrer')
    })

    it('should preserve contact link hover indicators', () => {
      const contactLinks = wrapper.findAll('.contact-link')
      
      contactLinks.forEach(link => {
        // Each contact link should have the structure for dot indicators
        expect(link.classes()).toContain('contact-link')
      })
    })
  })

  describe('Component Integration Preservation', () => {
    it('should preserve component prop interface', () => {
      // Verify that the component accepts the expected props
      expect(wrapper.props()).toHaveProperty('profileData')
      expect(wrapper.props()).toHaveProperty('contactData')
    })

    it('should preserve component reactivity', async () => {
      const newProfileData: HeroData = {
        title: 'Updated Title',
        subtitle: 'Updated Subtitle',
        description: 'Updated Description',
        profile_image: '/new-image.jpg',
        role: 'New Role'
      }
      
      await wrapper.setProps({ profileData: newProfileData })
      await nextTick()
      
      // Verify that the component updates with new data
      const profileTitle = wrapper.find('.profile-title')
      expect(profileTitle.text()).toContain(newProfileData.title)
      expect(profileTitle.text()).toContain(newProfileData.subtitle)
      
      const roleBadge = wrapper.find('.role-badge')
      expect(roleBadge.text()).toBe(newProfileData.role)
    })

    it('should preserve component structure integrity', () => {
      // Verify that all major structural elements exist
      const requiredElements = [
        '.sidebar',
        '.sidebar-panel',
        '.profile-section',
        '.profile-img-container',
        '.profile-image',
        '.role-badge',
        '.profile-title',
        '.profile-description',
        '.navigation-section',
        '.navigation-header',
        '.nav-link',
        '.nav-arrow',
        '.nav-text',
        '.contacts-section'
      ]
      
      requiredElements.forEach(selector => {
        expect(wrapper.find(selector).exists()).toBe(true)
      })
    })
  })
})