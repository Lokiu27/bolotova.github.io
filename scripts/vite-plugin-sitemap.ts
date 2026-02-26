import type { Plugin } from 'vite'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

interface SitemapRoute {
  path: string
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: number
}

/**
 * Vite plugin to generate sitemap.xml during build
 * @param baseUrl - Base URL of the site (e.g., 'https://bolotova.site')
 * @param routes - Array of routes with SEO metadata
 * @returns Vite Plugin
 */
export function viteSitemapPlugin(baseUrl: string, routes: SitemapRoute[]): Plugin {
  return {
    name: 'vite-plugin-sitemap',
    apply: 'build', // Only run during build
    closeBundle() {
      // Generate sitemap.xml after build completes
      const lastmod = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      
      const urlEntries = routes.map(route => {
        const url = `${baseUrl}${route.path}`
        return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`
      }).join('\n')

      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`

      // Write sitemap.xml to dist directory
      const distPath = resolve(process.cwd(), 'dist', 'sitemap.xml')
      writeFileSync(distPath, sitemapXml, 'utf-8')
      
      console.log(`✓ Generated sitemap.xml with ${routes.length} routes`)
    }
  }
}
