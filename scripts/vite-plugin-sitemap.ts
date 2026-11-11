import type { Plugin } from 'vite'
import { writeFileSync } from 'fs'
import { execFileSync } from 'child_process'
import { resolve } from 'path'

interface SitemapRoute {
  path: string
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: number
}

/**
 * Маршрут → файлы-источники содержимого для lastmod. Берётся дата последнего
 * коммита, затрагивающего файлы маршрута (не дата сборки: фиктивный lastmod
 * обесценивает сигнал обновления для поисковиков).
 *
 * Карта держится рядом с генератором, а не в src/config/seo.ts, потому что
 * это сборочная, а не рантайм-конфигурация. Файлы — контент-источники
 * маршрута (view-компоненты и markdown-данные), см. main.ts и генераторы PDF.
 */
const ROUTE_CONTENT_FILES: Record<string, string[]> = {
  '/': ['index.html', 'src/App.vue', 'src/views/Home.vue', 'src/components'],
  '/projects': ['src/views/Services.vue'],
  '/projects/mini-llm': ['src/views/MiniLlmView.vue'],
  '/resume': ['src/views/Resume.vue', 'public/data/Болотова Ксения Борисовна.md'],
  '/privacy': ['src/views/PrivacyPolicy.vue', 'public/data/privacy-policy.md']
}

/**
 * Дата последнего коммита (YYYY-MM-DD), затрагивающего файлы маршрута.
 * В мелком клоне (fetch-depth: 1) история недоступна — тогда null,
 * и вызывающий код падает обратно на дату сборки.
 */
function gitLastmod(files: string[]): string | null {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files], {
      encoding: 'utf-8'
    }).trim()
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null
  } catch {
    return null
  }
}

/**
 * Vite plugin to generate sitemap.xml during build
 * @param baseUrl - Base URL of the site (e.g., 'https://bolotova.online')
 * @param routes - Array of routes with SEO metadata
 * @returns Vite Plugin
 */
export function viteSitemapPlugin(baseUrl: string, routes: SitemapRoute[]): Plugin {
  return {
    name: 'vite-plugin-sitemap',
    apply: 'build', // Only run during build
    closeBundle() {
      const fallbackLastmod = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

      const urlEntries = routes.map(route => {
        // nginx отдаёт страницы каталогами: /resume → 301 → /resume/ (200).
        // В sitemap идут только финальные 200-URL — со слешем (корень
        // не удваиваем).
        const loc = `${baseUrl}${route.path === '/' ? '/' : `${route.path}/`}`
        const lastmod = gitLastmod(ROUTE_CONTENT_FILES[route.path] ?? []) ?? fallbackLastmod
        return `  <url>
    <loc>${loc}</loc>
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
