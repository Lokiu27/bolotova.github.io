import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import * as fc from 'fast-check'
import Sidebar from '../components/Sidebar.vue'
import type { HeroData, ContactsData } from '../types'

/**
 * **Feature: vue-migration-docker, Property 15: Sidebar reactivity**
 * **Validates: Requirements 4.3**
 * 
 * Property: For any change to profile data, the Sidebar component should automatically update to reflect the new information
 */
describe('Sidebar Reactivity Property Tests', () => {
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

  it('should automatically update when profile data changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        heroDataArb,
        heroDataArb,
        contactsDataArb,
        async (initialHeroData: HeroData, updatedHeroData: HeroData, contactsData: ContactsData) => {
          // Ensure the data is actually different
          fc.pre(
            initialHeroData.title !== updatedHeroData.title ||
            initialHeroData.subtitle !== updatedHeroData.subtitle ||
            initialHeroData.description !== updatedHeroData.description ||
            initialHeroData.profile_image !== updatedHeroData.profile_image
          )

          const wrapper = mount(Sidebar, {
            props: {
              profileData: initialHeroData,
              contactData: contactsData
            }
          })

          // Verify initial state
          expect(wrapper.find('.profile-title').text()).toBe(initialHeroData.title.trim())
          expect(wrapper.find('.profile-subtitle').text()).toBe(initialHeroData.subtitle.trim())
          expect(wrapper.find('.profile-description').text()).toBe(initialHeroData.description.trim())
          expect(wrapper.find('.profile-image').attributes('src')).toBe(initialHeroData.profile_image)

          // Update the props
          await wrapper.setProps({
            profileData: updatedHeroData,
            contactData: contactsData
          })

          // Property: Component should automatically reflect the new data
          expect(wrapper.find('.profile-title').text()).toBe(updatedHeroData.title.trim())
          expect(wrapper.find('.profile-subtitle').text()).toBe(updatedHeroData.subtitle.trim())
          expect(wrapper.find('.profile-description').text()).toBe(updatedHeroData.description.trim())
          expect(wrapper.find('.profile-image').attributes('src')).toBe(updatedHeroData.profile_image)
          expect(wrapper.find('.profile-image').attributes('alt')).toBe(updatedHeroData.title)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should automatically update when contact data changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        heroDataArb,
        contactsDataArb,
        contactsDataArb,
        async (heroData: HeroData, initialContactsData: ContactsData, updatedContactsData: ContactsData) => {
          // Ensure the data is actually different
          fc.pre(
            initialContactsData.email !== updatedContactsData.email ||
            initialContactsData.telegram !== updatedContactsData.telegram ||
            initialContactsData.github !== updatedContactsData.github ||
            initialContactsData.resume !== updatedContactsData.resume
          )

          const wrapper = mount(Sidebar, {
            props: {
              profileData: heroData,
              contactData: initialContactsData
            }
          })

          // Verify initial state
          expect(wrapper.find('.contact-link.email').attributes('href')).toBe(`mailto:${initialContactsData.email}`)
          expect(wrapper.find('.contact-link.telegram').attributes('href')).toBe(initialContactsData.telegram)
          expect(wrapper.find('.contact-link.github').attributes('href')).toBe(initialContactsData.github)
          expect(wrapper.find('.contact-link.resume').attributes('href')).toBe(initialContactsData.resume)

          // Update the props
          await wrapper.setProps({
            profileData: heroData,
            contactData: updatedContactsData
          })

          // Property: Component should automatically reflect the new contact data
          expect(wrapper.find('.contact-link.email').attributes('href')).toBe(`mailto:${updatedContactsData.email}`)
          expect(wrapper.find('.contact-link.telegram').attributes('href')).toBe(updatedContactsData.telegram)
          expect(wrapper.find('.contact-link.github').attributes('href')).toBe(updatedContactsData.github)
          expect(wrapper.find('.contact-link.resume').attributes('href')).toBe(updatedContactsData.resume)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle transitions from undefined to defined data', async () => {
    await fc.assert(
      fc.asyncProperty(
        heroDataArb,
        contactsDataArb,
        async (heroData: HeroData, contactsData: ContactsData) => {
          const wrapper = mount(Sidebar, {
            props: {
              profileData: undefined,
              contactData: undefined
            }
          })

          // Initial state should handle undefined gracefully
          expect(wrapper.find('.sidebar').exists()).toBe(true)

          // Update to defined data
          await wrapper.setProps({
            profileData: heroData,
            contactData: contactsData
          })

          // Property: Component should now display the provided data
          expect(wrapper.find('.profile-title').text()).toBe(heroData.title.trim())
          expect(wrapper.find('.profile-subtitle').text()).toBe(heroData.subtitle.trim())
          expect(wrapper.find('.profile-description').text()).toBe(heroData.description.trim())
          expect(wrapper.find('.profile-image').attributes('src')).toBe(heroData.profile_image)

          expect(wrapper.find('.contact-link.email').attributes('href')).toBe(`mailto:${contactsData.email}`)
          expect(wrapper.find('.contact-link.telegram').attributes('href')).toBe(contactsData.telegram)
          expect(wrapper.find('.contact-link.github').attributes('href')).toBe(contactsData.github)
          expect(wrapper.find('.contact-link.resume').attributes('href')).toBe(contactsData.resume)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle transitions from defined to undefined data', async () => {
    await fc.assert(
      fc.asyncProperty(
        heroDataArb,
        contactsDataArb,
        async (heroData: HeroData, contactsData: ContactsData) => {
          const wrapper = mount(Sidebar, {
            props: {
              profileData: heroData,
              contactData: contactsData
            }
          })

          // Verify initial state with data
          expect(wrapper.find('.profile-title').text()).toBe(heroData.title.trim())

          // Update to undefined data
          await wrapper.setProps({
            profileData: undefined,
            contactData: undefined
          })

          // Property: Component should handle undefined data gracefully without errors
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