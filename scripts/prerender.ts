import puppeteer from 'puppeteer'
import { createServer } from 'http'
import { createReadStream, existsSync, mkdirSync, writeFileSync, statSync } from 'fs'
import { resolve, dirname } from 'path'
import { parse } from 'url'
import { BASE_URL, routeSeoConfig } from '../src/config/seo'

interface PrerenderConfig {
  routes: string[]
  /** Любой несуществующий путь — рендерится catch-all NotFound → dist/404.html */
  notFoundPath: string
  distDir: string
  baseUrl: string
  waitForSelector: string // '#app' or '[data-rendered]'
}

/**
 * Start a simple HTTP server to serve the dist directory
 * @param distDir - Path to the dist directory
 * @param port - Port to listen on
 * @returns Server instance and URL
 */
function startServer(distDir: string, port: number = 3000): { server: any; url: string } {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '/')
    let pathname = parsedUrl.pathname || '/'

    // Браузер percent-кодирует не-ASCII имена файлов (например,
    // /data/Болотова%20Ксения%20Борисовна.md). Без декодирования existsSync
    // не находит файл, срабатывает SPA-fallback и страница получает
    // index.html вместо запрошенных данных — как это было с резюме.
    try {
      pathname = decodeURIComponent(pathname)
    } catch {
      // некорректная %XX-последовательность — отдаём как есть
    }
    
    // Resolve file path
    let filePath = resolve(distDir, pathname.slice(1))
    
    // Check if it's a static asset (has file extension)
    const hasExtension = pathname.includes('.') && !pathname.endsWith('/')
    
    if (hasExtension && existsSync(filePath)) {
      // Serve static asset
      const stream = createReadStream(filePath)
      
      // Set content type based on file extension
      if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html')
      } else if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript')
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css')
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json')
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml')
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png')
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg')
      } else if (filePath.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp')
      } else if (filePath.endsWith('.woff2')) {
        res.setHeader('Content-Type', 'font/woff2')
      }
      
      stream.pipe(res)
    } else {
      // SPA fallback: serve index.html for all routes
      const indexPath = resolve(distDir, 'index.html')
      if (existsSync(indexPath)) {
        res.setHeader('Content-Type', 'text/html')
        const stream = createReadStream(indexPath)
        stream.pipe(res)
      } else {
        res.statusCode = 404
        res.end('Not found')
      }
    }
  })
  
  server.listen(port)
  const url = `http://localhost:${port}`
  
  console.log(`✓ Started local server at ${url}`)
  
  return { server, url }
}

/**
 * Output path in dist for a route ('/' → dist/index.html, '/projects' → dist/projects/index.html)
 */
function routeOutputPath(distDir: string, route: string): string {
  if (route === '/') {
    return resolve(distDir, 'index.html')
  }
  return resolve(distDir, route.slice(1), 'index.html')
}

/**
 * Проверка снятого HTML до записи на диск: SEO-инварианты, которые
 * обязан соблюдать каждый пререндеренный файл (падаем в CI, а не в проде)
 */
function verifyRenderedHtml(html: string, pageUrl: string, opts: { isNotFound?: boolean } = {}): void {
  const h1Count = html.match(/<h1[\s>]/gi)?.length ?? 0
  if (h1Count !== 1) {
    throw new Error(`${pageUrl}: ожидался ровно один <h1>, найдено ${h1Count}`)
  }
  if (opts.isNotFound) {
    if (!html.includes('noindex')) {
      throw new Error(`${pageUrl}: на 404-странице нет noindex`)
    }
    if (html.includes('rel="canonical"')) {
      throw new Error(`${pageUrl}: на 404-странице не должно быть canonical`)
    }
    return
  }
  for (const marker of ['twitter:card', 'og:image:width', 'og:image:height', 'rel="canonical"']) {
    if (!html.includes(marker)) {
      throw new Error(`${pageUrl}: в пререндеренном HTML нет ${marker}`)
    }
  }
}

/**
 * Prerender all routes using Puppeteer
 * @param config - Prerender configuration
 */
export async function prerenderRoutes(config: PrerenderConfig): Promise<void> {
  const { routes, notFoundPath, distDir, waitForSelector } = config

  console.log(`\n🚀 Starting prerendering for ${routes.length} routes + 404 page...\n`)

  // Start local HTTP server
  const { server, url } = startServer(distDir)

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  /**
   * Render a single URL and save the captured DOM to outputPath
   */
  const renderAndSave = async (pageUrl: string, outputPath: string, opts: { isNotFound?: boolean } = {}): Promise<void> => {
    const page = await browser.newPage()

    // Navigate to the route
    await page.goto(pageUrl, {
      waitUntil: 'networkidle0', // Wait for network to be idle
      timeout: 30000
    })

    // Wait for the app to render
    await page.waitForSelector(waitForSelector, { timeout: 10000 })

    // Give Vue a bit more time to hydrate (и дождаться JS-инжекции
    // мета-тегов, canonical и JSON-LD)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Extract the full HTML
    const html = await page.evaluate(() => document.documentElement.outerHTML)

    verifyRenderedHtml(html, pageUrl, opts)

    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, html, 'utf-8')

    console.log(`    ✓ Saved to: ${outputPath}`)

    await page.close()
  }

  try {
    for (const route of routes) {
      console.log(`  Rendering: ${route}`)
      await renderAndSave(`${url}${route}`, routeOutputPath(distDir, route))
    }

    // 404: несуществующий путь попадает в catch-all маршрут NotFound,
    // nginx потом отдаёт этот файл через error_page 404
    console.log(`  Rendering: ${notFoundPath} (404 page)`)
    await renderAndSave(`${url}${notFoundPath}`, resolve(distDir, '404.html'), { isNotFound: true })

    // Страховка: nginx отдаёт только реальные файлы (без SPA-fallback),
    // поэтому отсутствие любого вывода уронило бы страницу в проде —
    // падаем здесь, чтобы CI не задеплоил неполный бандл
    const expectedFiles = [
      ...routes.map(route => routeOutputPath(distDir, route)),
      resolve(distDir, '404.html')
    ]
    for (const file of expectedFiles) {
      if (!existsSync(file) || statSync(file).size === 0) {
        throw new Error(`Prerender output missing or empty: ${file}`)
      }
    }

    console.log(`\n✅ Prerendering complete!\n`)
  } catch (error) {
    console.error('❌ Prerendering failed:', error)
    throw error
  } finally {
    // Clean up
    await browser.close()
    server.close()
    console.log('✓ Closed browser and server\n')
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const config: PrerenderConfig = {
    // Единый источник маршрутов — как у SEO-конфига и sitemap
    routes: Object.keys(routeSeoConfig),
    notFoundPath: '/not-found-prerender',
    distDir: resolve(process.cwd(), 'dist'),
    baseUrl: BASE_URL,
    waitForSelector: '#app'
  }

  prerenderRoutes(config).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
