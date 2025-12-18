import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import * as fc from 'fast-check'
import About from '../components/About.vue'
import type { AboutData, Feature } from '../types'

/**
 * **Feature: vue-migration-docker, Property 4: Content component data display**
 * **Validates: Requirements 1.4**
 * 
 * Property: For any services data loaded from JSON, the About component should display all features with their titles and descriptions
 */
describe('Content Component Data Display Property Tests', () => {
  // Generator for feature data
  const featureArb = fc.record({
    icon: fc.oneof(
      fc.constant('users'),
      fc.constant('sparkles'),
      fc.constant('bullseye'),
      fc.string({ minLength: 1, maxLength: 20 })
        .filter(s => s.trim().length > 0)
        .filter(s => !['valueOf', 'toString', 'constructor', 'hasOwnProperty', '__proto__', 'prototype'].includes(s))
        .filter(s => !/^__/.test(s)) // Exclude any string starting with __
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

  it('should display all features with their titles and descriptions', () => {
    fc.assert(
      fc.property(
        aboutDataArb,
        (aboutData: AboutData) => {
          const wrapper = mount(About, {
            props: {
              aboutData: aboutData
            }
          })

          // Property 1: Should display the about title
          const aboutTitle = wrapper.find('.about-title')
          expect(aboutTitle.exists()).toBe(true)
          expect(aboutTitle.text()).toBe(aboutData.title.trim())

          // Property 2: Should display the about description
          const aboutDescription = wrapper.find('.about-description')
          expect(aboutDescription.exists()).toBe(true)
          expect(aboutDescription.text()).toBe(aboutData.description.trim())

          // Property 3: Should display all features
          const featureCards = wrapper.findAll('.feature-card')
          expect(featureCards.length).toBe(aboutData.features.length)

          // Property 4: Each feature should have title and description displayed
          aboutData.features.forEach((feature: Feature, index: number) => {
            const featureCard = featureCards[index]
            
            // Check feature title
            const featureTitle = featureCard.find('.feature-title')
            expect(featureTitle.exists()).toBe(true)
            expect(featureTitle.text()).toBe(feature.title.trim())
            
            // Check feature description
            const featureDescription = featureCard.find('.feature-description')
            expect(featureDescription.exists()).toBe(true)
            expect(featureDescription.text()).toBe(feature.description.trim())
            
            // Check feature icon exists
            const featureIcon = featureCard.find('.feature-icon')
            expect(featureIcon.exists()).toBe(true)
          })

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle different icon types correctly', () => {
    fc.assert(
      fc.property(
        aboutDataArb,
        (aboutData: AboutData) => {
          const wrapper = mount(About, {
            props: {
              aboutData: aboutData
            }
          })

          // Property: Each feature should have an icon displayed
          const featureIcons = wrapper.findAll('.feature-icon span')
          expect(featureIcons.length).toBe(aboutData.features.length)

          // Property: Icons should have appropriate symbols
          aboutData.features.forEach((feature: Feature, index: number) => {
            const iconElement = featureIcons[index]
            const iconText = iconElement.text()
            
            // Should have some icon symbol (emoji or default)
            expect(iconText.length).toBeGreaterThan(0)
            
            // Known icons should map to specific emojis
            if (feature.icon === 'users') {
              expect(iconText).toBe('👥')
            } else if (feature.icon === 'sparkles') {
              expect(iconText).toBe('✨')
            } else if (feature.icon === 'bullseye') {
              expect(iconText).toBe('🎯')
            } else {
              // Unknown icons should get default
              expect(iconText).toBe('📋')
            }
          })

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle empty or missing data gracefully', () => {
    fc.assert(
      fc.property(
        fc.option(aboutDataArb, { nil: undefined }),
        (aboutData: AboutData | undefined) => {
          const wrapper = mount(About, {
            props: {
              aboutData: aboutData
            }
          })

          // Property: Component should render without errors even with undefined data
          expect(wrapper.exists()).toBe(true)
          
          // Should have the basic structure
          expect(wrapper.find('.about-section').exists()).toBe(true)
          expect(wrapper.find('.about-header').exists()).toBe(true)
          expect(wrapper.find('.features-grid').exists()).toBe(true)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain proper grid layout for any number of features', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          features: fc.array(featureArb, { minLength: 0, maxLength: 20 })
        }),
        (aboutData: AboutData) => {
          const wrapper = mount(About, {
            props: {
              aboutData: aboutData
            }
          })

          // Property: Features grid should exist regardless of feature count
          const featuresGrid = wrapper.find('.features-grid')
          expect(featuresGrid.exists()).toBe(true)

          // Property: Number of feature cards should match features array length
          const featureCards = wrapper.findAll('.feature-card')
          expect(featureCards.length).toBe(aboutData.features.length)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})