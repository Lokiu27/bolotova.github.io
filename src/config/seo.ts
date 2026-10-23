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
  ogImageWidth?: number
  ogImageHeight?: number
  ogImageAlt?: string
  ogSiteName?: string
  ogLocale?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  canonicalUrl?: string
  robots?: string
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
export const BASE_URL = 'https://bolotova.online'

/**
 * Отдельное og:image 1200×630 для превью в соцсетях/мессенджерах
 * (JPG: WebP в og:image поддерживается не всеми скрейперами).
 * Регенерация: npm run og:image
 */
export const OG_IMAGE = {
  path: '/assets/images/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Болотова Ксения — бизнес-анализ, требования и AI-инструменты'
} as const

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
    description: 'Вайб-кодинг пет-проекты в области AI: эксперименты с LLM в браузере, генерация JSON Schema и другие инструменты на базе современных языковых моделей.',
    ogType: 'website'
  },
  '/resume': {
    title: 'Резюме — Болотова Ксения | Бизнес-аналитик, AI эксперт',
    description: 'Резюме руководителя функции бизнес-анализа. Помогу собрать команду и выстроить процессы бизнес-анализа в вашей компании.',
    ogType: 'profile'
  },
  '/projects/mini-llm': {
    title: 'Мини LLM в браузере — Болотова Ксения | AI проект',
    description: 'Генерация JSON Schema с использованием языковой модели Phi-3-mini, работающей полностью в браузере. Все данные обрабатываются локально — без отправки на сервер.',
    ogType: 'website'
  },
  '/privacy': {
    title: 'Политика обработки персональных данных — Болотова Ксения',
    description: 'Порядок обработки и защиты персональных данных пользователей сайта bolotova.online в соответствии с Федеральным законом № 152-ФЗ. Текст политики, постоянная ссылка и скачивание PDF.',
    ogType: 'article'
  }
}

/**
 * SEO-конфиг для catch-all маршрута 404 (страница не найдена)
 */
export const notFoundSeoConfig: RouteSeoConfig = {
  title: 'Страница не найдена — Болотова Ксения',
  description: 'Запрошенная страница не существует. Вернитесь на главную страницу сайта bolotova.online.',
  ogType: 'website'
}

/**
 * Маршруты для sitemap.xml — единый источник для vite.config.js
 * (список должен совпадать с ключами routeSeoConfig и маршрутов пререндера)
 */
export const sitemapRoutes: SitemapRoute[] = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/projects', changefreq: 'monthly', priority: 0.8 },
  { path: '/projects/mini-llm', changefreq: 'monthly', priority: 0.7 },
  { path: '/resume', changefreq: 'monthly', priority: 0.8 },
  { path: '/privacy', changefreq: 'monthly', priority: 0.3 }
]
