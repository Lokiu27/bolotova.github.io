import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import * as fc from 'fast-check'
import About from '../components/About.vue'
import type { AboutData, Feature } from '../types'

/**
 * **Feature: vue-migration-docker, Property 16: Content reactivity**
 * **Validates: Requirements 4.4**
 * 
 * Property: For any modification to services data, the About component should immediately display the updated content
 */
describe('Content Reactivity Property Tests', () => {
  // Generator for feature data
  const featureArb = fc.record({
    icon: fc.oneof(
      fc.constant('users'),
      fc.constant('sparkles'),
      fc.constant('bullseye'),
      fc.string({ minLength: 1, maxLength: 20 })
        .filter(s => s.trim().length > 0)
        .filter(s => !['valueOf', 'toString', 'constructor', 'hasOwnProperty'].includes(s))
    ),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0)
  })

  // Generator for about data
  const aboutDataArb = fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    features: fc.array(featureArb, { minLength: 1, maxLength: 10 })
  })

  it('should immediately update when about data changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        aboutDataArb,
        aboutDataArb,
        async (initialAboutData: AboutData, updatedAboutData: AboutData) => {
          // Ensure the data is actually different
          fc.pre(
            initialAboutData.title !== updatedAboutData.title ||
            initialAboutData.description !== updatedAboutData.description ||
            initialAboutData.features.length !== updatedAboutData.features.length ||
            JSON.stringify(initialAboutData.features) !== JSON.stringify(updatedAboutData.features)
          )

          const wrapper = mount(About, {
            props: {
              aboutData: initialAboutData
            }
          })

          // Verify initial state
          expect(wrapper.find('.about-title').text()).toBe(initialAboutData.title.trim())
          expect(wrapper.find('.about-description').text()).toBe(initialAboutData.description.trim())
          expect(wrapper.findAll('.feature-card').length).toBe(initialAboutData.features.length)

          // Update the props
          await wrapper.setProps({
            aboutData: updatedAboutData
          })

          // Property: Component should immediately reflect the new data
          expect(wrapper.find('.about-title').text()).toBe(updatedAboutData.title.trim())
          expect(wrapper.find('.about-description').text()).toBe(updatedAboutData.description.trim())
          expect(wrapper.findAll('.feature-card').length).toBe(updatedAboutData.features.length)

          // Verify each feature is updated
          const featureCards = wrapper.findAll('.feature-card')
          updatedAboutData.features.forEach((feature: Feature, index: number) => {
            const featureCard = featureCards[index]
            expect(featureCard.find('.feature-title').text()).toBe(feature.title.trim())
            expect(featureCard.find('.feature-description').text()).toBe(feature.description.trim())
          })

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should immediately update when features array changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          features: fc.array(featureArb, { minLength: 1, maxLength: 5 })
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          features: fc.array(featureArb, { minLength: 1, maxLength: 8 })
        }),
        async (initialAboutData: AboutData, updatedAboutData: AboutData) => {
          // Ensure features are different
          fc.pre(JSON.stringify(initialAboutData.features) !== JSON.stringify(updatedAboutData.features))

          const wrapper = mount(About, {
            props: {
              aboutData: initialAboutData
            }
          })

          // Verify initial feature count
          expect(wrapper.findAll('.feature-card').length).toBe(initialAboutData.features.length)

          // Update the props with different features
          await wrapper.setProps({
            aboutData: updatedAboutData
          })

          // Property: Component should immediately reflect the new features
          const updatedFeatureCards = wrapper.findAll('.feature-card')
          expect(updatedFeatureCards.length).toBe(updatedAboutData.features.length)

          // Verify each new feature is displayed correctly
          updatedAboutData.features.forEach((feature: Feature, index: number) => {
            const featureCard = updatedFeatureCards[index]
            expect(featureCard.find('.feature-title').text()).toBe(feature.title.trim())
            expect(featureCard.find('.feature-description').text()).toBe(feature.description.trim())
            expect(featureCard.find('.feature-icon').exists()).toBe(true)
          })

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle transitions from undefined to defined data', async () => {
    await fc.assert(
      fc.asyncProperty(
        aboutDataArb,
        async (aboutData: AboutData) => {
          const wrapper = mount(About, {
            props: {
              aboutData: undefined
            }
          })

          // Initial state should handle undefined gracefully
          expect(wrapper.find('.about-section').exists()).toBe(true)
          expect(wrapper.findAll('.feature-card').length).toBe(0)

          // Update to defined data
          await wrapper.setProps({
            aboutData: aboutData
          })

          // Property: Component should immediately display the provided data
          expect(wrapper.find('.about-title').text()).toBe(aboutData.title.trim())
          expect(wrapper.find('.about-description').text()).toBe(aboutData.description.trim())
          expect(wrapper.findAll('.feature-card').length).toBe(aboutData.features.length)

          // Verify each feature is displayed
          const featureCards = wrapper.findAll('.feature-card')
          aboutData.features.forEach((feature: Feature, index: number) => {
            const featureCard = featureCards[index]
            expect(featureCard.find('.feature-title').text()).toBe(feature.title.trim())
            expect(featureCard.find('.feature-description').text()).toBe(feature.description.trim())
          })

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle transitions from defined to undefined data', async () => {
    await fc.assert(
      fc.asyncProperty(
        aboutDataArb,
        async (aboutData: AboutData) => {
          const wrapper = mount(About, {
            props: {
              aboutData: aboutData
            }
          })

          // Verify initial state with data
          expect(wrapper.find('.about-title').text()).toBe(aboutData.title.trim())
          expect(wrapper.findAll('.feature-card').length).toBe(aboutData.features.length)

          // Update to undefined data
          await wrapper.setProps({
            aboutData: undefined
          })

          // Property: Component should handle undefined data gracefully without errors
          expect(wrapper.find('.about-section').exists()).toBe(true)
          expect(wrapper.find('.about-header').exists()).toBe(true)
          expect(wrapper.find('.features-grid').exists()).toBe(true)
          expect(wrapper.findAll('.feature-card').length).toBe(0)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should immediately update individual feature properties', async () => {
    await fc.assert(
      fc.asyncProperty(
        featureArb,
        featureArb,
        async (initialFeature: Feature, updatedFeature: Feature) => {
          // Ensure the features are different
          fc.pre(
            initialFeature.title !== updatedFeature.title ||
            initialFeature.description !== updatedFeature.description ||
            initialFeature.icon !== updatedFeature.icon
          )

          const initialAboutData: AboutData = {
            title: 'Test Title',
            description: 'Test Description',
            features: [initialFeature]
          }

          const updatedAboutData: AboutData = {
            title: 'Test Title',
            description: 'Test Description',
            features: [updatedFeature]
          }

          const wrapper = mount(About, {
            props: {
              aboutData: initialAboutData
            }
          })

          // Verify initial feature
          const initialFeatureCard = wrapper.find('.feature-card')
          expect(initialFeatureCard.find('.feature-title').text()).toBe(initialFeature.title.trim())
          expect(initialFeatureCard.find('.feature-description').text()).toBe(initialFeature.description.trim())

          // Update the feature
          await wrapper.setProps({
            aboutData: updatedAboutData
          })

          // Property: Component should immediately reflect the updated feature
          const updatedFeatureCard = wrapper.find('.feature-card')
          expect(updatedFeatureCard.find('.feature-title').text()).toBe(updatedFeature.title.trim())
          expect(updatedFeatureCard.find('.feature-description').text()).toBe(updatedFeature.description.trim())

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})