/**
 * Генератор PNG-фавиконок из public/favicon.svg.
 *
 * Почему Puppeteer, а не конвертер: в SVG монограмма «KB» набрана текстом,
 * и для пиксель-в-пиксель совпадения с сайтом нужен настоящий JetBrains Mono
 * (подключается из локального woff2, без внешних запросов).
 *
 * Запуск: npm run favicons
 * Источник: public/favicon.svg
 * Результат:
 *   public/favicon-32x32.png      — браузерные вкладки (fallback для svg)
 *   public/apple-touch-icon.png   — iOS-закладки/сниппеты (180×180)
 *   public/favicon-512x512.png    — крупные сниппеты/ярлыки (512×512)
 */
import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SVG_PATH = resolve(process.cwd(), 'public/favicon.svg')
const FONT_PATH = resolve(process.cwd(), 'src/assets/fonts/jetbrains-mono-latin.woff2')

const TARGETS = [
  { size: 32, file: 'public/favicon-32x32.png' },
  { size: 180, file: 'public/apple-touch-icon.png' },
  { size: 512, file: 'public/favicon-512x512.png' }
] as const

function buildHtml(svg: string, fontDataUri: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 100 800;
    src: url(${fontDataUri}) format('woff2');
  }
  * { margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
  svg { width: 100%; height: 100%; display: block; }
</style>
</head>
<body>${svg}</body>
</html>`
}

async function main(): Promise<void> {
  const svg = readFileSync(SVG_PATH, 'utf-8')
  const font = readFileSync(FONT_PATH).toString('base64')
  const html = buildHtml(svg, `data:font/woff2;base64,${font}`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 })
    await page.evaluate(() => document.fonts.ready)
    await new Promise(r => setTimeout(r, 200))

    for (const { size, file } of TARGETS) {
      await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 })
      await new Promise(r => setTimeout(r, 100))
      const outputPath = resolve(process.cwd(), file)
      await page.screenshot({ type: 'png', path: outputPath, omitBackground: true })
      const kb = readFileSync(outputPath).length / 1024
      console.log(`✓ ${file} (${size}×${size}, ${kb.toFixed(1)} КБ)`)
    }
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error('❌ Не удалось сгенерировать фавиконки:', error)
  process.exit(1)
})
