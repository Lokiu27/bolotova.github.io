import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import * as fc from 'fast-check'
import Sidebar from '../components/Sidebar.vue'
import type { HeroData, ContactsData } from '../types'

/**
 * **Feature: vue-migration-docker, Property 3: Sidebar component completeness**
 * **Validates: Requirements 1.3**
 * 
 * Property: For any render of the Sidebar component, it should contain profile image, name, roles, experience, and all contact links from the data source
 */
describe('Sidebar Component Completeness Property Tests', () => {
  // Generators for test data
  const heroDataArb = fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    subtitle: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    profile_image: fc.webUrl()
  })

  const contactsDataArb = fc.record({
    email: fc.emailAddress(),
    telegram: fc.webUrl(),
    github: fc.webUrl(),
    resume: fc.webUrl()
  })

  it('should contain all required profile elements for any valid hero data', () => {
    fc.assert(
      fc.property(
        heroDataArb,
        contactsDataArb,
        (heroData: HeroData, contactsData: ContactsData) => {
          const wrapper = mount(Sidebar, {
            props: {
              profileData: heroData,
              contactData: contactsData
            }
          })

          // Property 1: Should contain profile image with correct src
          const profileImage = wrapper.find('.profile-image')
          expect(profileImage.exists()).toBe(true)
          expect(profileImage.attributes('src')).toBe(heroData.profile_image)
          expect(profileImage.attributes('alt')).toBe(heroData.title)

          // Property 2: Should contain profile title (name/role)
          const profileTitle = wrapper.find('.profile-title')
          expect(profileTitle.exists()).toBe(true)
          expect(profileTitle.text()).toBe(heroData.title.trim())

          // Property 3: Should contain profile subtitle (roles)
          const profileSubtitle = wrapper.find('.profile-subtitle')
          expect(profileSubtitle.exists()).toBe(true)
          expect(profileSubtitle.text()).toBe(heroData.subtitle.trim())

          // Property 4: Should contain profile description (experience)
          const profileDescription = wrapper.find('.profile-description')
          expect(profileDescription.exists()).toBe(true)
          expect(profileDescription.text()).toBe(heroData.description.trim())

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should contain all contact links from the data source', () => {
    fc.assert(
      fc.property(
        heroDataArb,
        contactsDataArb,
        (heroData: HeroData, contactsData: ContactsData) => {
          const wrapper = mount(Sidebar, {
            props: {
              profileData: heroData,
              contactData: contactsData
            }
          })

          // Property 1: Should contain email link
          const emailLink = wrapper.find('.contact-link.email')
          expect(emailLink.exists()).toBe(true)
          expect(emailLink.attributes('href')).toBe(`mailto:${contactsData.email}`)

          // Property 2: Should contain telegram link
          const telegramLink = wrapper.find('.contact-link.telegram')
          expect(telegramLink.exists()).toBe(true)
          expect(telegramLink.attributes('href')).toBe(contactsData.telegram)
          expect(telegramLink.attributes('target')).toBe('_blank')

          // Property 3: Should contain github link
          const githubLink = wrapper.find('.contact-link.github')
          expect(githubLink.exists()).toBe(true)
          expect(githubLink.attributes('href')).toBe(contactsData.github)
          expect(githubLink.attributes('target')).toBe('_blank')

          // Property 4: Should contain resume link
          const resumeLink = wrapper.find('.contact-link.resume')
          expect(resumeLink.exists()).toBe(true)
          expect(resumeLink.attributes('href')).toBe(contactsData.resume)
          expect(resumeLink.attributes('target')).toBe('_blank')

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle missing data gracefully', () => {
    fc.assert(
      fc.property(
        fc.option(heroDataArb, { nil: undefined }),
        fc.option(contactsDataArb, { nil: undefined }),
        (heroData: HeroData | undefined, contactsData: ContactsData | undefined) => {
          const wrapper = mount(Sidebar, {
            props: {
              profileData: heroData,
              contactData: contactsData
            }
          })

          // Property: Component should render without errors even with undefined data
          expect(wrapper.exists()).toBe(true)
          
          // Should have the basic structure
          expect(wrapper.find('.sidebar').exists()).toBe(true)
          expect(wrapper.find('.profile-section').exists()).toBe(true)
          expect(wrapper.find('.contacts-section').exists()).toBe(true)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})