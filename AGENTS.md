# AGENTS.md — база знаний проекта bolotova.online

База знаний для агентов и новых сессий, работающих в этом репозитории.

## Что это за проект

- **Основной сайт** bolotova.online — SPA (Vue 3 + Vite), пререндер статическим HTML через Puppeteer (`scripts/prerender.ts`), деплой на VPS через GitHub Actions (`ci.yml`, job `deploy` только с main).
- **Курс** `/course/` — MkDocs Material, но **контент живёт в отдельном репо** [Lokiu27/BA_Course](https://github.com/Lokiu27/BA_Course). CI сайта клонирует его в `docs-build/content` и собирает (job `build-course`). В этом репо — только `docs/mkdocs.yml` (конфиг) и `docs/custom/` (шаблоны).
- **Единый источник маршрутов и SEO**: `src/config/seo.ts` (`routeSeoConfig` — title/description всех страниц, `sitemapRoutes`). Его используют пререндер, sitemap, canonical и llms-генератор. Новую страницу добавлять туда, а не точечно.

## Сборка локально

```bash
# Сайт (PDF резюме → vite build → пререндер всех маршрутов + 404)
npm run build:prerender

# llms.txt / llms-full.txt (нужен клон курса)
git clone --depth 1 https://github.com/Lokiu27/BA_Course.git docs-build/content
npm run generate:llms

# Курс (mkdocs), ТОЛЬКО в venv — глобальные установки запрещены
/opt/homebrew/bin/python3.13 -m venv .venv        # CI использует 3.12, 3.13 совместим
.venv/bin/pip install -r docs/requirements.txt     # pinned mkdocs-material 9.5.47
git clone --depth 1 https://github.com/Lokiu27/BA_Course.git docs-build/content
cp docs/mkdocs.yml docs-build/mkdocs.yml
.venv/bin/python docs/generate_nav.py --content docs-build/content --config docs-build/mkdocs.yml
.venv/bin/mkdocs build -f docs-build/mkdocs.yml    # выход: docs-build/site
```

`docs-build/` и `.venv/` в .gitignore. `docs-build/mkdocs.yml` отличается от `docs/mkdocs.yml` только тем, что лежит рядом с `content/`.

## Ключевые решения и инварианты (не сломать)

1. **Финальные URL со слешем.** nginx отдаёт страницы каталогами: `/resume` → 301 → `/resume/` (200). canonical, og:url и sitemap обязаны указывать на финальный 200-URL — см. `src/main.ts` (`finalUrl`) и `scripts/vite-plugin-sitemap.ts` (`loc`). `/` не удваивать.
2. **lastmod из git, не из даты сборки** — иначе сигнал обновления обесценивается. Карта «маршрут → контент-файлы» — `ROUTE_CONTENT_FILES` в `vite-plugin-sitemap.ts`; требует полного клона в CI (`fetch-depth: 0` в build job), в мелком клоне — фолбэк на дату сборки.
3. **og-теги курса через оверрайд, не через meta-плагин.** Встроенный meta-плагин Material появился в 9.6, а requirements.txt держит 9.5.47. Работает `docs/custom/main.html` (блок extrahead base.html): og:title/description/image + JSON-LD Course с hasPart из nav. Description берётся из front-matter BA_Course — шаблон обязан не падать, если его нет (Jinja Undefined роняет `tojson` — см. дефолт через `or config.site_name`).
4. **Puppeteer в CI**: любой запуск Chrome (prerender, generate-resume-pdf) — с `args: ['--no-sandbox', '--disable-setuid-sandbox']`, иначе GitHub Actions падает с «No usable sandbox!».
5. **llms.txt / llms-full.txt генерируются, не пишутся руками.** `scripts/generate-llms.ts`: био — константа `BIO` (факты согласованы с владельцем), страницы сайта из `routeSeoConfig`, курс из клона BA_Course, резюме из `public/data/Болотова Ксения Борисовна.md`. CI пересобирает их на каждом деплое — закоммиченные копии не могут устареть.
6. **SEO-инварианты пререндера** проверяются сборкой (`verifyRenderedHtml` в prerender.ts): один `<h1>` на страницу, наличие canonical/twitter:card/og:image, noindex без canonical на 404. Упавший инвариант = не деплоить.

## CI (ci.yml)

- `build`: полный клон → валидация nginx в docker → npm ci (кэш Puppeteer) → клон BA_Course + `generate:llms` → `build:prerender` → артефакт `dist`.
- `build-course`: Python 3.12 → `docs/requirements.txt` → клон BA_Course → `generate_nav.py` → `mkdocs build`.
- `deploy`: только push в main (+ repository_dispatch/workflow_dispatch), копирует артефакт `dist` на VPS (VPS ничего не собирает — слабый CPU).
- BA_Course имеет свой workflow «Trigger docs rebuild» — пуш в его main перестраивает курс.

## Конвенции

- PR squash-мержатся после зелёного CI; прямые пушы владельца в main допустимы (история до 11.2026 — только они).
- Тесты: `npm test` (vitest). **На main есть ~42 предсуществующих падения** (About/Sidebar/иконки/CSP-тесты) — это не регрессии новых изменений; сравнивайте дельту с чистым main.
- Деплой-специфика и история миграций — `DEPLOY.md`, аудит SEO — `seo-audit-2026-10-22.md`.

## Состояние на 2026-11-11 (все мержи на проде, проверено curl-ом)

- SEO-комплекс по аудиту: мета курса + og/JSON-LD Course (CORD-2), llms.txt/llms-full.txt с генерацией на CI (CORD-3), title/JSON-LD Person главной + resume.pdf на старом URL (CORD-4), canonical/sitemap на финальные URL + lastmod из git (CORD-5).
- **Не сделано**: статья-хаб «Управление требованиями с AI: подход и практика» + FAQPage JSON-LD + перелинковка (отложена владельцем); GSC/Я.Вебмастер — ручные шаги владельца (покрытие /course/, запрос индексации); внешние сигналы — статьи на Habr, Pressfeed.
