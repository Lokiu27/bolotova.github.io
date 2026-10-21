# Образ только раздаёт готовую статику: SPA собирается на GitHub-раннере
# (job build в .github/workflows/ci.yml) и приезжает на VPS в dist-prebuilt/
# (шаг scp в job deploy). Держать образ COPY-only принципиально — npm ci и
# vite build на VPS подвешивали деплой (деградированная сеть + слабый CPU).
#
# Локальная/ручная сборка образа:
#   npm ci --legacy-peer-deps && npm run build
#   rm -rf dist-prebuilt && cp -R dist dist-prebuilt
#   docker compose up -d --build
FROM nginx:1.27.3-alpine3.20

RUN rm -f /etc/nginx/conf.d/default.conf && rm -rf /usr/share/nginx/html/*

COPY docker/nginx-letsencrypt.conf /etc/nginx/conf.d/default.conf
COPY dist-prebuilt/ /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
