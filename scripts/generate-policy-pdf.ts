import puppeteer from 'puppeteer'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { marked } from 'marked'

/**
 * Генератор PDF-версии «Политики обработки персональных данных».
 *
 * Источник — public/data/privacy-policy.md (единый источник для веб-страницы и PDF).
 * Результат — public/privacy-policy.pdf (статика, публикуется как есть).
 *
 * Запуск: npm run pdf:policy
 *
 * Шаблон печатный (светлый): белый фон, чёрный текст, заголовки JetBrains Mono
 * (Google Fonts, при отсутствии сети — системный monospace), циановые акцент-линии.
 */

const POLICY_TITLE = 'Политика обработки персональных данных'
const PERMALINK = 'https://bolotova.online/privacy'
const SOURCE_PATH = resolve(process.cwd(), 'public/data/privacy-policy.md')
const OUTPUT_PATH = resolve(process.cwd(), 'public/privacy-policy.pdf')

function buildHtml(markdown: string): string {
  const body = marked.parse(markdown, { gfm: true, breaks: true }) as string

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${POLICY_TITLE}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
    }

    body {
      font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #111;
      margin: 0;
    }

    .doc-header {
      margin-bottom: 28px;
      padding-bottom: 16px;
      border-bottom: 2px solid #00f0ff;
    }

    .doc-header h1 {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 18pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      line-height: 1.35;
      margin: 0 0 10px;
      color: #000;
    }

    .doc-header .accent-line {
      display: block;
      width: 100px;
      height: 3px;
      background: #00f0ff;
    }

    .doc-header .doc-url {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 9pt;
      color: #555;
      margin-top: 10px;
    }

    h2 {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 12.5pt;
      font-weight: 700;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 26px 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #d5d9e0;
      position: relative;
      page-break-after: avoid;
    }

    h2::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 60px;
      height: 2px;
      background: #00f0ff;
    }

    h3 {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 11.5pt;
      color: #000;
      margin: 20px 0 8px;
      page-break-after: avoid;
    }

    p {
      margin: 0 0 10px;
    }

    ul, ol {
      margin: 0 0 12px;
      padding-left: 22px;
    }

    li {
      margin-bottom: 5px;
    }

    strong {
      font-weight: 600;
    }

    a {
      color: #0891b2;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <header class="doc-header">
    <h1>${POLICY_TITLE}</h1>
    <span class="accent-line"></span>
    <p class="doc-url">${PERMALINK}</p>
  </header>
  ${body}
</body>
</html>`
}

async function main(): Promise<void> {
  const markdown = readFileSync(SOURCE_PATH, 'utf-8')

  if (!markdown.trim()) {
    throw new Error(`Пустой файл политики: ${SOURCE_PATH}`)
  }

  const html = buildHtml(markdown)

  const browser = await puppeteer.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    // Дождаться загрузки веб-шрифтов, чтобы заголовки ушли в PDF как задумано
    await page.evaluate(() => document.fonts.ready)

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="width: 100%; text-align: center; font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 8px; color: #7a8290;">
          bolotova.online/privacy &nbsp;·&nbsp; <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '18mm',
        right: '18mm'
      }
    })

    writeFileSync(OUTPUT_PATH, pdf)
    console.log(`✓ PDF сохранён: ${OUTPUT_PATH} (${(pdf.length / 1024).toFixed(1)} KB)`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('Ошибка генерации PDF:', err)
  process.exit(1)
})
