/**
 * SEO Configuration
 * Defines interfaces and configuration for SEO meta tags, Schema.org, and sitemap
 */

/**
 * SEO meta tags configuration interface
 */
export interface SeoMetaConfig {
  title: string
  description: string
  ogTitle?: string
  ogDescription?: string
  ogType?: string
  ogUrl?: string
  ogImage?: string
  ogLocale?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  canonicalUrl?: string
}

/**
 * Route-specific SEO configuration
 */
export interface RouteSeoConfig {
  title: string
  description: string
  ogType: string
}

/**
 * Schema.org structured data configuration
 */
export interface SchemaOrgConfig {
  person: {
    name: string
    jobTitle: string
    description: string
    email: string
    url: string
    sameAs: string[]
  }
  website: {
    name: string
    url: string
  }
  professionalService: {
    name: string
    description: string
    url: string
    serviceTypes: string[]
  }
}

/**
 * Sitemap route configuration
 */
export interface SitemapRoute {
  path: string
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: number
}

/**
 * Base URL of the website
 */
export const BASE_URL = 'https://bolotova.site'

/**
 * SEO configuration for each route
 */
export const routeSeoConfig: Record<string, RouteSeoConfig> = {
  '/': {
    title: 'Болотова Ксения — Эксперт по бизнес-анализу и AI инструментам',
    description: 'Помогу создать эффективную команду бизнес-аналитиков и внедрить AI инструменты. Формирование команд, стратегический подход, автоматизация. Консультирую компании. Менторинг.',
    ogType: 'website'
  },
  '/projects': {
    title: 'Проекты — Болотова Ксения | Бизнес-анализ и AI',
    description: 'Пет-проекты в области AI.',
    ogType: 'website'
  },
  '/resume': {
    title: 'Резюме — Болотова Ксения | Бизнес-аналитик, AI эксперт',
    description: 'Резюме руководителя функции бизнес-анализа. Помогу собрать команду и выстроить процессы бизнес-анализа в вашей компании.',
    ogType: 'profile'
  }
}
