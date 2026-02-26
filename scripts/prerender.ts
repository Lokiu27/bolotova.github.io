import puppeteer from 'puppeteer'
import { createServer } from 'http'
import { createReadStream, existsSync, mkdirSync, writeFileSync, statSync } from 'fs'
import { resolve, dirname } from 'path'
import { parse } from 'url'

interface PrerenderConfig {
  routes: string[]
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
 * Prerender all routes using Puppeteer
 * @param config - Prerender configuration
 */
export async function prerenderRoutes(config: PrerenderConfig): Promise<void> {
  const { routes, distDir, waitForSelector } = config
  
  console.log(`\n🚀 Starting prerendering for ${routes.length} routes...\n`)
  
  // Start local HTTP server
  const { server, url } = startServer(distDir)
  
  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    for (const route of routes) {
      const pageUrl = `${url}${route}`
      console.log(`  Rendering: ${route}`)
      
      const page = await browser.newPage()
      
      // Navigate to the route
      await page.goto(pageUrl, {
        waitUntil: 'networkidle0', // Wait for network to be idle
        timeout: 30000
      })
      
      // Wait for the app to render
      await page.waitForSelector(waitForSelector, { timeout: 10000 })
      
      // Give Vue a bit more time to hydrate
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Extract the full HTML
      const html = await page.evaluate(() => document.documentElement.outerHTML)
      
      // Determine output path
      let outputPath: string
      if (route === '/') {
        outputPath = resolve(distDir, 'index.html')
      } else {
        const routeDir = resolve(distDir, route.slice(1))
        mkdirSync(routeDir, { recursive: true })
        outputPath = resolve(routeDir, 'index.html')
      }
      
      // Save the HTML
      writeFileSync(outputPath, html, 'utf-8')
      
      console.log(`    ✓ Saved to: ${outputPath}`)
      
      await page.close()
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
    routes: ['/', '/projects', '/resume'],
    distDir: resolve(process.cwd(), 'dist'),
    baseUrl: 'https://bolotova.site',
    waitForSelector: '#app'
  }
  
  prerenderRoutes(config).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
