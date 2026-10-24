# Образ только раздаёт готовую статику: SPA и курс (MkDocs из BA_Course)
# собираются на GitHub-раннере (job build и build-course в
# .github/workflows/ci.yml) и приезжают на VPS в dist-prebuilt/ и
# course-prebuilt/ (шаги scp в job deploy). Держать образ COPY-only
# принципиально — npm ci, pip и git-клон на VPS подвешивали деплой
# (деградированная сеть + слабый CPU).
#
# Локальная/ручная сборка образа:
#   npm ci --legacy-peer-deps && npm run build
#   rm -rf dist-prebuilt && cp -R dist dist-prebuilt
#   git clone --depth 1 https://github.com/Lokiu27/BA_Course.git docs-build/content
#   cp docs/mkdocs.yml docs-build/mkdocs.yml
#   pip install -r docs/requirements.txt && mkdocs build -f docs-build/mkdocs.yml
#   rm -rf course-prebuilt && cp -R docs-build/site course-prebuilt
#   docker compose up -d --build
FROM nginx:1.27.3-alpine3.20

RUN rm -f /etc/nginx/conf.d/default.conf && rm -rf /usr/share/nginx/html/*

COPY docker/nginx-letsencrypt.conf /etc/nginx/conf.d/default.conf
COPY dist-prebuilt/ /usr/share/nginx/html
COPY course-prebuilt/ /usr/share/nginx/course

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
