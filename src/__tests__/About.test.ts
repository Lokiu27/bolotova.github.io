import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import About from '../components/About.vue'
import type { AboutData } from '../types'

/**
 * Unit tests for About.vue component
 * Requirements: 5.2, 7.2, 7.4
 */
describe('About.vue', () => {
  const mockAboutData: AboutData = {
    title: 'Test Title',
    description: 'Test Description',
    features: [
      {
        icon: 'users',
        title: 'Feature 1',
        description: 'Description 1'
      },
      {
        icon: 'sparkles',
        title: 'Feature 2',
        description: 'Description 2'
      },
      {
        icon: 'bullseye',
        title: 'Feature 3',
        description: 'Description 3'
      }
    ]
  }

  describe('Data Loading and Display', () => {
    it('should render hero section with title and description from aboutData', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: mockAboutData
        }
      })

      const tagline = wrapper.find('.tagline')
      const highlight = wrapper.find('.tagline-highlight')

      expect(tagline.exists()).toBe(true)
      expect(tagline.text()).toBe('Test Title')
      expect(highlight.exists()).toBe(true)
      expect(highlight.text()).toBe('Test Description')
    })

    it('should handle missing aboutData gracefully', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: undefined
        }
      })

      expect(wrapper.find('.about-section').exists()).toBe(true)
      expect(wrapper.find('.hero-section').exists()).toBe(true)
    })

    it('should handle empty features array', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: {
            title: 'Test',
            description: 'Test',
            features: []
          }
        }
      })

      const cards = wrapper.findAll('.feature-card')
      expect(cards).toHaveLength(0)
    })
  })

  describe('Feature Card Rendering', () => {
    it('should render article element for each feature', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: mockAboutData
        }
      })

      const cards = wrapper.findAll('article.feature-card')
      expect(cards).toHaveLength(3)
    })

    it('should render card header with flexbox layout', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: mockAboutData
        }
      })

      const headers = wrapper.findAll('.card-header')
      expect(headers).toHaveLength(3)
      
      // Check that each header contains both icon and index
      headers.forEach(header => {
        expect(header.find('.feature-icon').exists()).toBe(true)
        expect(header.find('.card-index').exists()).toBe(true)
      })
    })

    it('should render feature content inside article', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: mockAboutData
        }
      })

      const cards = wrapper.findAll('article.feature-card')
      
      // Check first card
      const firstCard = cards[0]
      expect(firstCard.text()).toContain('Feature 1')
      expect(firstCard.text()).toContain('Description 1')
      
      // Check second card
      const secondCard = cards[1]
      expect(secondCard.text()).toContain('Feature 2')
      expect(secondCard.text()).toContain('Description 2')
    })
  })

  describe('Grid Layout', () => {
    it('should apply features-grid class for grid layout', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: mockAboutData
        }
      })

      const grid = wrapper.find('.features-grid')
      expect(grid.exists()).toBe(true)
    })

    it('should render all features in the grid', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: mockAboutData
        }
      })

      const grid = wrapper.find('.features-grid')
      const cards = grid.findAll('article.feature-card')
      
      expect(cards).toHaveLength(mockAboutData.features.length)
    })
  })

  describe('Cyberpunk Styling', () => {
    it('should render card-index for each feature', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: mockAboutData
        }
      })

      const indices = wrapper.findAll('.card-index')
      expect(indices).toHaveLength(3)
      
      // Check that indices are formatted correctly (01, 02, 03)
      expect(indices[0].text()).toBe('01')
      expect(indices[1].text()).toBe('02')
      expect(indices[2].text()).toBe('03')
    })

    it('should render feature-icon for each feature', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: mockAboutData
        }
      })

      const icons = wrapper.findAll('.feature-icon')
      expect(icons).toHaveLength(3)
      
      // Check that icons are rendered
      expect(icons[0].text()).toBeTruthy()
      expect(icons[1].text()).toBeTruthy()
      expect(icons[2].text()).toBeTruthy()
    })

    it('should render feature titles with correct styling', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: mockAboutData
        }
      })

      const titles = wrapper.findAll('.feature-title')
      expect(titles).toHaveLength(3)
      
      expect(titles[0].text()).toBe('Feature 1')
      expect(titles[1].text()).toBe('Feature 2')
      expect(titles[2].text()).toBe('Feature 3')
    })

    it('should render feature descriptions', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: mockAboutData
        }
      })

      const descriptions = wrapper.findAll('.feature-description')
      expect(descriptions).toHaveLength(3)
      
      expect(descriptions[0].text()).toBe('Description 1')
      expect(descriptions[1].text()).toBe('Description 2')
      expect(descriptions[2].text()).toBe('Description 3')
    })
  })

  describe('Icon Mapping', () => {
    it('should map known icons correctly', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: mockAboutData
        }
      })

      const icons = wrapper.findAll('.feature-icon span')
      
      // users -> 👥
      expect(icons[0].text()).toBe('👥')
      // sparkles -> ✨
      expect(icons[1].text()).toBe('✨')
      // bullseye -> 🎯
      expect(icons[2].text()).toBe('🎯')
    })

    it('should use default icon for unknown icon names', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: {
            title: 'Test',
            description: 'Test',
            features: [
              {
                icon: 'unknown-icon',
                title: 'Test',
                description: 'Test'
              }
            ]
          }
        }
      })

      const icon = wrapper.find('.feature-icon span')
      expect(icon.text()).toBe('📋')
    })

    it('should handle empty icon name', () => {
      const wrapper = mount(About, {
        props: {
          aboutData: {
            title: 'Test',
            description: 'Test',
            features: [
              {
                icon: '',
                title: 'Test',
                description: 'Test'
              }
            ]
          }
        }
      })

      const icon = wrapper.find('.feature-icon span')
      expect(icon.text()).toBe('📋')
    })
  })

  describe('Responsive Behavior', () => {
    it('should maintain structure with different numbers of features', () => {
      // Test with 1 feature
      const wrapper1 = mount(About, {
        props: {
          aboutData: {
            title: 'Test',
            description: 'Test',
            features: [mockAboutData.features[0]]
          }
        }
      })
      expect(wrapper1.findAll('article.feature-card')).toHaveLength(1)

      // Test with 5 features
      const wrapper5 = mount(About, {
        props: {
          aboutData: {
            title: 'Test',
            description: 'Test',
            features: [
              ...mockAboutData.features,
              { icon: 'users', title: 'Feature 4', description: 'Desc 4' },
              { icon: 'users', title: 'Feature 5', description: 'Desc 5' }
            ]
          }
        }
      })
      expect(wrapper5.findAll('article.feature-card')).toHaveLength(5)
    })
  })
})
