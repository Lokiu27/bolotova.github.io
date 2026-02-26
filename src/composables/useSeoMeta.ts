/**
 * Composable for managing SEO meta tags
 * Handles document.title, meta tags (name/property), and canonical link
 */

import type { SeoMetaConfig } from '@/config/seo'

/**
 * Attribute to mark managed meta tags for cleanup
 */
const MANAGED_META_ATTRIBUTE = 'data-managed-meta'

/**
 * Interface for the useSeoMeta composable
 */
export interface UseSeoMeta {
  setMeta: (config: SeoMetaConfig) => void
  removeMeta: () => void
}

/**
 * Composable for managing SEO meta tags in document.head
 * 
 * @returns Object with setMeta and removeMeta functions
 * 
 * @example
 * const { setMeta, removeMeta } = useSeoMeta()
 * setMeta({
 *   title: 'Page Title',
 *   description: 'Page description',
 *   ogTitle: 'OG Title',
 *   canonicalUrl: 'https://example.com/page'
 * })
 */
export function useSeoMeta(): UseSeoMeta {
  /**
   * Set or update a meta tag by name or property attribute
   */
  const setMetaTag = (
    attribute: 'name' | 'property',
    key: string,
    content: string
  ): void => {
    if (!content) return

    let element = document.querySelector(
      `meta[${attribute}="${key}"]`
    ) as HTMLMetaElement

    if (element) {
      element.content = content
    } else {
      element = document.createElement('meta')
      element.setAttribute(attribute, key)
      element.content = content
      element.setAttribute(MANAGED_META_ATTRIBUTE, 'true')
      document.head.appendChild(element)
    }
  }

  /**
   * Set or update the canonical link
   */
  const setCanonicalLink = (url: string): void => {
    if (!url) return

    let link = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement

    if (link) {
      link.href = url
    } else {
      link = document.createElement('link')
      link.rel = 'canonical'
      link.href = url
      link.setAttribute(MANAGED_META_ATTRIBUTE, 'true')
      document.head.appendChild(link)
    }
  }

  /**
   * Set meta tags based on configuration
   */
  const setMeta = (config: SeoMetaConfig): void => {
    // Set document title
    if (config.title) {
      document.title = config.title
    }

    // Set basic meta tags
    setMetaTag('name', 'description', config.description)

    // Set Open Graph tags
    if (config.ogTitle) {
      setMetaTag('property', 'og:title', config.ogTitle)
    }
    if (config.ogDescription) {
      setMetaTag('property', 'og:description', config.ogDescription)
    }
    if (config.ogType) {
      setMetaTag('property', 'og:type', config.ogType)
    }
    if (config.ogUrl) {
      setMetaTag('property', 'og:url', config.ogUrl)
    }
    if (config.ogImage) {
      setMetaTag('property', 'og:image', config.ogImage)
    }
    if (config.ogLocale) {
      setMetaTag('property', 'og:locale', config.ogLocale)
    }

    // Set Twitter Card tags
    if (config.twitterCard) {
      setMetaTag('name', 'twitter:card', config.twitterCard)
    }
    if (config.twitterTitle) {
      setMetaTag('name', 'twitter:title', config.twitterTitle)
    }
    if (config.twitterDescription) {
      setMetaTag('name', 'twitter:description', config.twitterDescription)
    }
    if (config.twitterImage) {
      setMetaTag('name', 'twitter:image', config.twitterImage)
    }

    // Set canonical URL
    if (config.canonicalUrl) {
      setCanonicalLink(config.canonicalUrl)
    }
  }

  /**
   * Remove all managed meta tags and canonical link
   */
  const removeMeta = (): void => {
    const managedElements = document.querySelectorAll(
      `[${MANAGED_META_ATTRIBUTE}]`
    )
    managedElements.forEach((element) => element.remove())
  }

  return {
    setMeta,
    removeMeta
  }
}
