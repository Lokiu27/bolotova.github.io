import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { BASE_URL, routeSeoConfig } from '../src/config/seo'

/**
 * Генератор llms.txt и llms-full.txt — машиночитаемых описаний сайта
 * для AI-агентов (https://llmstxt.org).
 *
 * Источники (никаких ручных списков — всё берётся из работающих файлов):
 * - страницы основного сайта: routeSeoConfig (src/config/seo.ts) — тот же
 *   единый источник, что у prerender и sitemap;
 * - страницы курса: markdown-контент BA_Course (docs_dir сборки курса,
 *   по умолчанию docs-build/content — путь как в CI, см. ci.yml build-course;
 *   переопределяется флагом --content <dir>);
 * - био-блок и «О специалисте» в llms-full.txt: public/data/Болотова Ксения
 *   Борисовна.md — единый источник с /resume и resume.pdf.
 *
 * Запуск: npm run generate:llms [-- --content <dir>]
 *
 * CI пересобирает оба файла на каждом деплое (build job клонирует BA_Course),
 * поэтому закоммиченные копии в public/ не рассинхронизируются с курсом.
 */

const COURSE_BASE_URL = `${BASE_URL}/course/`
const DEFAULT_CONTENT_DIR = resolve(process.cwd(), 'docs-build/content')
const RESUME_MD = resolve(process.cwd(), 'public/data/Болотова Ксения Борисовна.md')
const LLMSTXT_PATH = resolve(process.cwd(), 'public/llms.txt')
const LLMSFULL_PATH = resolve(process.cwd(), 'public/llms-full.txt')

/** Био-блок llms.txt: только проверяемые факты, формулировки согласованы с владельцем */
const BIO = [
  'Эксперт по управлению требованиями с AI: процессы, стандарты и команды бизнес-анализа.',
  '15+ лет в бизнес-анализе, руковожу функцией БА в крупном GovTech-проекте (ЕМИАС).',
  'Автор курса «Управление требованиями с AI» (bolotova.online/course).',
  'Специализация: spec-driven development, BPMN, doc-as-code, внедрение AI-инструментов в анализ требований.',
  'Консультирую компании, менторинг аналитиков.'
].join(' ')

interface CoursePage {
  url: string
  title: string
  description: string
  markdown: string
}

/** content/index.md → /course/, modul-1/index.md → /course/modul-1/, materialy/x.md → /course/materialy/x/ */
function pageUrl(relPath: string): string {
  const withoutExt = relPath.replace(/\.md$/, '')
  if (withoutExt === 'index') return COURSE_BASE_URL
  return `${COURSE_BASE_URL}${withoutExt.replace(/\/index$/, '')}/`
}

/** Заголовок: front-matter title, иначе первая строка H1 */
function extractTitle(markdown: string): string {
  const fmTitle = markdown.match(/^title:\s*"([^"]+)"/m)
  if (fmTitle) return fmTitle[1]
  const h1 = markdown.match(/^#\s+(.+)$/m)
  return h1 ? h1[1].trim() : 'Без названия'
}

/** Аннотация: front-matter description, иначе первый абзац текста */
function extractDescription(markdown: string): string {
  const fmDesc = markdown.match(/^description:\s*"([^"]+)"/m)
  if (fmDesc) return fmDesc[1]
  const body = markdown
    .replace(/^---[\s\S]*?---/, '') // front-matter
    .replace(/^#[^\n]*\n/m, '') // H1
  const paragraph = body.split(/\n\s*\n/).map(s => s.trim()).find(s => s && !s.startsWith('#'))
  return paragraph ? paragraph.replace(/\s+/g, ' ').slice(0, 200) : ''
}

/** Порядок страниц курса: index, modul-N, itogovyy-proekt, materialy/* */
function collectCourseFiles(contentDir: string): string[] {
  const walk = (dir: string, prefix = ''): string[] => {
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      if (entry.isDirectory()) return walk(resolve(dir, entry.name), `${prefix}${entry.name}/`)
      if (entry.name === 'README.md' || !entry.name.endsWith('.md')) return []
      return [`${prefix}${entry.name}`]
    })
  }
  const files = walk(contentDir)
  const rank = (p: string): number => {
    if (p === 'index.md') return 0
    const modul = p.match(/^modul-(\d+)\/index\.md$/)
    if (modul) return Number(modul[1])
    if (p === 'itogovyy-proekt.md') return 90
    return 100 // materialy/*
  }
  return files.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

function collectCoursePages(contentDir: string): CoursePage[] {
  return collectCourseFiles(contentDir).map(relPath => {
    const markdown = readFileSync(resolve(contentDir, relPath), 'utf-8')
    return {
      url: pageUrl(relPath),
      title: extractTitle(markdown),
      description: extractDescription(markdown),
      markdown
    }
  })
}

/** Полное содержимое страницы курса без front-matter — для llms-full.txt */
function stripFrontMatter(markdown: string): string {
  return markdown.replace(/^---[\s\S]*?---\s*\n/, '').trim()
}

function buildLlmsTxt(coursePages: CoursePage[]): string {
  const lines: string[] = [
    '# Болотова Ксения — эксперт по управлению требованиями с AI',
    '',
    `> ${BIO}`,
    '',
    '## Страницы сайта',
    ''
  ]
  for (const [route, seo] of Object.entries(routeSeoConfig)) {
    lines.push(`- [${seo.title.replace(/\s*[|—].*$/, '')}](${BASE_URL}${route === '/' ? '' : route}): ${seo.description}`)
  }
  lines.push('', '## Курс «Управление требованиями с AI»', '')
  for (const page of coursePages) {
    lines.push(`- [${page.title}](${page.url}): ${page.description}`)
  }
  lines.push('', 'Полное содержимое сайта и курса для машинной обработки: https://bolotova.online/llms-full.txt', '')
  return lines.join('\n')
}

function buildLlmsFullTxt(resumeMarkdown: string, coursePages: CoursePage[]): string {
  const lines: string[] = [
    '# Болотова Ксения — эксперт по управлению требованиями с AI',
    '',
    `> ${BIO}`,
    '',
    '## Резюме',
    '',
    stripFrontMatter(resumeMarkdown),
    '',
    '---',
    '',
    '# Курс «Управление требованиями с AI»: полный текст',
    ''
  ]
  for (const page of coursePages) {
    lines.push(`<!-- ${page.url} -->`, '', `## ${page.title}`, '', stripFrontMatter(page.markdown), '', '---', '')
  }
  return lines.join('\n')
}

async function main(): Promise<void> {
  const contentFlag = process.argv.indexOf('--content')
  const contentDir = contentFlag > -1 ? resolve(process.argv[contentFlag + 1]) : DEFAULT_CONTENT_DIR

  if (!existsSync(contentDir)) {
    throw new Error(
      `Нет контента курса: ${contentDir}\n` +
      'Склонируйте BA_Course, как это делает CI (ci.yml, job build-course):\n' +
      '  git clone --depth 1 https://github.com/Lokiu27/BA_Course.git docs-build/content'
    )
  }

  const coursePages = collectCoursePages(contentDir)
  const resumeMarkdown = readFileSync(RESUME_MD, 'utf-8')

  writeFileSync(LLMSTXT_PATH, buildLlmsTxt(coursePages), 'utf-8')
  writeFileSync(LLMSFULL_PATH, buildLlmsFullTxt(resumeMarkdown, coursePages), 'utf-8')

  console.log(`✓ llms.txt: ${coursePages.length} страниц курса + ${Object.keys(routeSeoConfig).length} страниц сайта`)
  console.log(`✓ llms-full.txt: резюме + полный текст курса (${coursePages.length} страниц)`)
}

main().catch((err) => {
  console.error('Ошибка генерации llms:', err)
  process.exit(1)
})
