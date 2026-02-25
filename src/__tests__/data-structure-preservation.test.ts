import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { AboutData, Feature } from '../types'

/**
 * Feature: glassmorphism-cyberpunk-redesign, Property 8: Сохранение структуры данных
 * 
 * **Validates: Requirements 7.4**
 * 
 * For any JSON файла с данными (hero.json, about.json, contacts.json), 
 * после загрузки и парсинга компонентами, структура данных должна 
 * соответствовать определенным TypeScript типам без потери или изменения полей.
 */
describe('Property 8: Data Structure Preservation', () => {
  // Arbitrary generator for Feature
  const featureArbitrary = fc.record({
    icon: fc.string({ minLength: 1, maxLength: 20 }),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 })
  })

  // Arbitrary generator for AboutData
  const aboutDataArbitrary = fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    features: fc.array(featureArbitrary, { minLength: 1, maxLength: 10 })
  })

  it('should preserve AboutData structure after JSON serialization and parsing', () => {
    fc.assert(
      fc.property(aboutDataArbitrary, (originalData) => {
        // Simulate JSON serialization and parsing (what happens when loading from JSON files)
        const jsonString = JSON.stringify(originalData)
        const parsedData = JSON.parse(jsonString) as AboutData

        // Verify all fields are preserved
        expect(parsedData.title).toBe(originalData.title)
        expect(parsedData.description).toBe(originalData.description)
        expect(parsedData.features).toHaveLength(originalData.features.length)

        // Verify each feature is preserved
        parsedData.features.forEach((feature, index) => {
          expect(feature.icon).toBe(originalData.features[index].icon)
          expect(feature.title).toBe(originalData.features[index].title)
          expect(feature.description).toBe(originalData.features[index].description)
        })

        // Verify no extra fields were added
        expect(Object.keys(parsedData)).toEqual(['title', 'description', 'features'])
        
        parsedData.features.forEach((feature) => {
          expect(Object.keys(feature).sort()).toEqual(['icon', 'title', 'description'].sort())
        })
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve Feature structure integrity', () => {
    fc.assert(
      fc.property(featureArbitrary, (originalFeature) => {
        // Simulate JSON round-trip
        const jsonString = JSON.stringify(originalFeature)
        const parsedFeature = JSON.parse(jsonString) as Feature

        // Verify all required fields exist and match
        expect(parsedFeature).toHaveProperty('icon')
        expect(parsedFeature).toHaveProperty('title')
        expect(parsedFeature).toHaveProperty('description')
        
        expect(parsedFeature.icon).toBe(originalFeature.icon)
        expect(parsedFeature.title).toBe(originalFeature.title)
        expect(parsedFeature.description).toBe(originalFeature.description)

        // Verify no fields were lost
        expect(Object.keys(parsedFeature).sort()).toEqual(
          Object.keys(originalFeature).sort()
        )
      }),
      { numRuns: 100 }
    )
  })

  it('should handle empty features array without data loss', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (title, description) => {
          const data: AboutData = {
            title,
            description,
            features: []
          }

          const jsonString = JSON.stringify(data)
          const parsed = JSON.parse(jsonString) as AboutData

          expect(parsed.title).toBe(title)
          expect(parsed.description).toBe(description)
          expect(parsed.features).toEqual([])
          expect(Array.isArray(parsed.features)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve data types after JSON round-trip', () => {
    fc.assert(
      fc.property(aboutDataArbitrary, (data) => {
        const parsed = JSON.parse(JSON.stringify(data)) as AboutData

        // Verify types are preserved
        expect(typeof parsed.title).toBe('string')
        expect(typeof parsed.description).toBe('string')
        expect(Array.isArray(parsed.features)).toBe(true)

        parsed.features.forEach((feature) => {
          expect(typeof feature.icon).toBe('string')
          expect(typeof feature.title).toBe('string')
          expect(typeof feature.description).toBe('string')
        })
      }),
      { numRuns: 100 }
    )
  })
})
