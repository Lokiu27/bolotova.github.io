# syntax=docker/dockerfile:1

# Stage 1: build Vue SPA
FROM node:20.19-alpine3.20 AS build-spa

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy the rest of the sources and build
COPY . .
RUN npm run build

# Stage 2: build MkDocs (BA_Course) — УДАЛЁН: курс не нужен, а его этап
# тянул каждую сборку pip-install/клонирование через деградированную сеть VPS

# Stage 3: nginx serving built static files
FROM nginx:1.27.3-alpine3.20

RUN rm -f /etc/nginx/conf.d/default.conf && rm -rf /usr/share/nginx/html/*

COPY docker/nginx-letsencrypt.conf /etc/nginx/conf.d/default.conf
COPY --from=build-spa /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
