/**
 * Генератор og:image 1200×630 (превью ссылок в Telegram/Twitter/WhatsApp).
 *
 * Композит: профильное фото (верх кадра с лицом) + тёмный градиент снизу
 * + имя/роль в фирменном стиле (JetBrains Mono, циан #00f0ff).
 *
 * Запуск: npm run og:image
 * Источник фона: public/assets/images/profile-photo.webp
 * Результат: public/assets/images/og-image.jpg (≤300 КБ)
 */
import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const WIDTH = 1200
const HEIGHT = 630
const PHOTO_PATH = resolve(process.cwd(), 'public/assets/images/profile-photo.webp')
const OUTPUT_PATH = resolve(process.cwd(), 'public/assets/images/og-image.jpg')

function buildHtml(photoDataUri: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    font-family: 'JetBrains Mono', monospace;
    background: #090a0d;
    position: relative;
    display: flex;
  }
  /* Левая панель: текст на сплошном тёмном фоне */
  .panel {
    width: 620px;
    height: ${HEIGHT}px;
    padding: 56px 56px 56px 64px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    z-index: 2;
  }
  .panel-top {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .monogram {
    width: 72px;
    height: 72px;
    border: 2px solid #00f0ff;
    box-shadow: 0 0 16px rgba(0, 240, 255, 0.35), inset 0 0 12px rgba(0, 240, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 700;
    color: #00f0ff;
    letter-spacing: 0.08em;
  }
  .domain {
    font-size: 21px;
    font-weight: 500;
    letter-spacing: 0.18em;
    color: rgba(0, 240, 255, 0.85);
  }
  .panel-bottom {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .name {
    font-size: 56px;
    font-weight: 700;
    letter-spacing: 0.05em;
    line-height: 1.12;
    color: #ffffff;
    text-shadow: 0 0 24px rgba(0, 240, 255, 0.22);
    text-transform: uppercase;
  }
  .rule {
    width: 120px;
    height: 3px;
    background: #00f0ff;
    box-shadow: 0 0 12px rgba(0, 240, 255, 0.6);
  }
  .role {
    font-size: 24px;
    font-weight: 400;
    letter-spacing: 0.06em;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.78);
  }
  /* Правая часть: портрет, голова целиком в кадре */
  .photo {
    flex: 1;
    height: ${HEIGHT}px;
    background-image: url(${photoDataUri});
    background-size: cover;
    background-position: center top;
    position: relative;
  }
  .photo-shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(9, 10, 13, 0.45) 0%,
      rgba(9, 10, 13, 0.08) 40%,
      rgba(9, 10, 13, 0) 60%
    );
  }
  .scanlines {
    position: absolute;
    inset: 0;
    z-index: 3;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 3px,
      rgba(0, 0, 0, 0.08) 3px,
      rgba(0, 0, 0, 0.08) 4px
    );
    pointer-events: none;
  }
</style>
</head>
<body>
  <div class="panel">
    <div class="panel-top">
      <div class="monogram">KB</div>
      <div class="domain">bolotova.online</div>
    </div>
    <div class="panel-bottom">
      <div class="name">Болотова<br>Ксения</div>
      <div class="rule"></div>
      <div class="role">бизнес-анализ &bull; требования<br>AI-инструменты</div>
    </div>
  </div>
  <div class="photo">
    <div class="photo-shade"></div>
  </div>
  <div class="scanlines"></div>
</body>
</html>`
}

async function main(): Promise<void> {
  const photo = readFileSync(PHOTO_PATH).toString('base64')
  const html = buildHtml(`data:image/webp;base64,${photo}`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 })

    // networkidle0 дожидается загрузки Google Fonts, fonts.ready — применения
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })
    await page.evaluate(() => document.fonts.ready)
    await new Promise(r => setTimeout(r, 300))

    await page.screenshot({
      type: 'jpeg',
      quality: 88,
      path: OUTPUT_PATH
    })

    const size = readFileSync(OUTPUT_PATH).length
    console.log(`✓ og:image сохранён: ${OUTPUT_PATH}`)
    console.log(`  ${WIDTH}×${HEIGHT}, ${(size / 1024).toFixed(1)} КБ (цель ≤300 КБ)`)
    if (size > 300 * 1024) {
      console.warn('⚠ Больше 300 КБ — уменьшите quality в page.screenshot')
      process.exitCode = 1
    }
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error('❌ Не удалось сгенерировать og:image:', error)
  process.exit(1)
})
