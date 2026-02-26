/**
 * useSchemaOrg Composable
 * Manages Schema.org JSON-LD structured data injection and removal
 */

import type { SchemaOrgConfig } from '@/config/seo'

/**
 * Schema.org composable interface
 */
export interface UseSchemaOrg {
  injectSchemas: (config: SchemaOrgConfig) => void
  removeSchemas: () => void
}

/**
 * Composable for managing Schema.org JSON-LD structured data
 * 
 * @returns Object with injectSchemas and removeSchemas functions
 */
export function useSchemaOrg(): UseSchemaOrg {
  const SCHEMA_ATTRIBUTE = 'data-schema-org'

  /**
   * Creates a JSON-LD script element
   * 
   * @param type - Schema type identifier (person, website, service)
   * @param data - JSON-LD data object
   * @returns HTMLScriptElement
   */
  const createSchemaScript = (type: string, data: object): HTMLScriptElement => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute(SCHEMA_ATTRIBUTE, type)
    script.textContent = JSON.stringify(data, null, 2)
    return script
  }

  /**
   * Generates Person schema JSON-LD
   * 
   * @param person - Person configuration
   * @returns Person schema object
   */
  const generatePersonSchema = (person: SchemaOrgConfig['person']) => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: person.jobTitle,
    description: person.description,
    email: person.email,
    url: person.url,
    sameAs: person.sameAs
  })

  /**
   * Generates WebSite schema JSON-LD
   * 
   * @param website - Website configuration
   * @returns WebSite schema object
   */
  const generateWebSiteSchema = (website: SchemaOrgConfig['website']) => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: website.name,
    url: website.url
  })

  /**
   * Generates ProfessionalService schema JSON-LD
   * 
   * @param service - Professional service configuration
   * @returns ProfessionalService schema object
   */
  const generateProfessionalServiceSchema = (service: SchemaOrgConfig['professionalService']) => ({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: service.name,
    description: service.description,
    url: service.url,
    serviceType: service.serviceTypes
  })

  /**
   * Injects Schema.org JSON-LD scripts into document head
   * Removes existing schemas before injecting new ones
   * 
   * @param config - Schema.org configuration object
   */
  const injectSchemas = (config: SchemaOrgConfig): void => {
    // Remove existing schemas first
    removeSchemas()

    // Generate and inject Person schema
    const personSchema = generatePersonSchema(config.person)
    const personScript = createSchemaScript('person', personSchema)
    document.head.appendChild(personScript)

    // Generate and inject WebSite schema
    const websiteSchema = generateWebSiteSchema(config.website)
    const websiteScript = createSchemaScript('website', websiteSchema)
    document.head.appendChild(websiteScript)

    // Generate and inject ProfessionalService schema
    const serviceSchema = generateProfessionalServiceSchema(config.professionalService)
    const serviceScript = createSchemaScript('service', serviceSchema)
    document.head.appendChild(serviceScript)
  }

  /**
   * Removes all Schema.org JSON-LD scripts from document head
   */
  const removeSchemas = (): void => {
    const schemas = document.head.querySelectorAll(`script[${SCHEMA_ATTRIBUTE}]`)
    schemas.forEach(schema => schema.remove())
  }

  return {
    injectSchemas,
    removeSchemas
  }
}
