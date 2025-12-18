import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * **Feature: vue-migration-docker, Property 14: JSON data loading**
 * **Validates: Requirements 4.1**
 * 
 * Property: For any Vue application initialization, all JSON data files should load successfully and be parsed without errors
 */
describe('JSON Data Loading Property Tests', () => {
  const dataFiles = [
    'public/data/hero.json',
    'public/data/about.json', 
    'public/data/contacts.json'
  ]

  it('should load and parse all JSON data files without errors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...dataFiles), // Test each data file
        (dataFile) => {
          const filePath = join(process.cwd(), dataFile)
          
          // Property 1: File should exist on filesystem
          expect(existsSync(filePath)).toBe(true)
          
          // Property 2: File should be readable
          const jsonText = readFileSync(filePath, 'utf-8')
          expect(jsonText.length).toBeGreaterThan(0)
          
          // Property 3: Content should be valid JSON
          expect(() => JSON.parse(jsonText)).not.toThrow()
          
          // Property 4: Parsed JSON should be an object (not null, array, or primitive)
          const parsedData = JSON.parse(jsonText)
          expect(typeof parsedData).toBe('object')
          expect(parsedData).not.toBeNull()
          expect(Array.isArray(parsedData)).toBe(false)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have required structure for hero data', () => {
    fc.assert(
      fc.property(
        fc.constant('public/data/hero.json'),
        (dataFile) => {
          const filePath = join(process.cwd(), dataFile)
          const jsonText = readFileSync(filePath, 'utf-8')
          const heroData = JSON.parse(jsonText)
          
          // Property: Hero data should have required fields
          expect(heroData).toHaveProperty('title')
          expect(heroData).toHaveProperty('subtitle')
          expect(heroData).toHaveProperty('description')
          expect(heroData).toHaveProperty('profile_image')
          
          // Property: All required fields should be non-empty strings
          expect(typeof heroData.title).toBe('string')
          expect(heroData.title.length).toBeGreaterThan(0)
          expect(typeof heroData.subtitle).toBe('string')
          expect(heroData.subtitle.length).toBeGreaterThan(0)
          expect(typeof heroData.description).toBe('string')
          expect(heroData.description.length).toBeGreaterThan(0)
          expect(typeof heroData.profile_image).toBe('string')
          expect(heroData.profile_image.length).toBeGreaterThan(0)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have required structure for about data', () => {
    fc.assert(
      fc.property(
        fc.constant('public/data/about.json'),
        (dataFile) => {
          const filePath = join(process.cwd(), dataFile)
          const jsonText = readFileSync(filePath, 'utf-8')
          const aboutData = JSON.parse(jsonText)
          
          // Property: About data should have required fields
          expect(aboutData).toHaveProperty('title')
          expect(aboutData).toHaveProperty('description')
          expect(aboutData).toHaveProperty('features')
          
          // Property: Features should be an array with valid structure
          expect(Array.isArray(aboutData.features)).toBe(true)
          expect(aboutData.features.length).toBeGreaterThan(0)
          
          // Property: Each feature should have required fields
          aboutData.features.forEach((feature: any) => {
            expect(feature).toHaveProperty('icon')
            expect(feature).toHaveProperty('title')
            expect(feature).toHaveProperty('description')
            expect(typeof feature.icon).toBe('string')
            expect(typeof feature.title).toBe('string')
            expect(typeof feature.description).toBe('string')
            expect(feature.icon.length).toBeGreaterThan(0)
            expect(feature.title.length).toBeGreaterThan(0)
            expect(feature.description.length).toBeGreaterThan(0)
          })
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have required structure for contacts data', () => {
    fc.assert(
      fc.property(
        fc.constant('public/data/contacts.json'),
        (dataFile) => {
          const filePath = join(process.cwd(), dataFile)
          const jsonText = readFileSync(filePath, 'utf-8')
          const contactsData = JSON.parse(jsonText)
          
          // Property: Contacts data should have required fields
          expect(contactsData).toHaveProperty('email')
          expect(contactsData).toHaveProperty('telegram')
          expect(contactsData).toHaveProperty('github')
          expect(contactsData).toHaveProperty('resume')
          
          // Property: All contact fields should be non-empty strings
          expect(typeof contactsData.email).toBe('string')
          expect(contactsData.email.length).toBeGreaterThan(0)
          expect(typeof contactsData.telegram).toBe('string')
          expect(contactsData.telegram.length).toBeGreaterThan(0)
          expect(typeof contactsData.github).toBe('string')
          expect(contactsData.github.length).toBeGreaterThan(0)
          expect(typeof contactsData.resume).toBe('string')
          expect(contactsData.resume.length).toBeGreaterThan(0)
          
          // Property: Email should contain @ symbol
          expect(contactsData.email).toContain('@')
          
          // Property: URLs should start with http
          expect(contactsData.telegram).toMatch(/^https?:\/\//)
          expect(contactsData.github).toMatch(/^https?:\/\//)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})