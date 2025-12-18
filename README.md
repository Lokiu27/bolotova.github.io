# vue-app

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Сборка и развертывание на VPS (Docker + Nginx)

### Предварительные требования

- Установлены Docker и Docker Compose (локально и/или на VPS)
- Настроен домен в Cloudflare с режимом SSL/TLS **Full (Strict)**

### 1. Локальная сборка фронтенда

```sh
npm install
npm run build
```

После этого в папке `dist/` появятся собранные статические файлы.

### 2. Сборка и запуск Docker-контейнера

В корне проекта уже есть:

- `Dockerfile` — образ на базе `nginx:stable-alpine`, копирует `dist/` в `/usr/share/nginx/html`
- `docker/nginx.conf` — конфигурация Nginx для SPA (`try_files ... /index.html`)
- `docker-compose.yml` — сервис `web` с пробросом порта `8080:80`

Запуск:

```sh
docker-compose up -d --build
```

Приложение будет доступно по адресу `http://<IP_VPS>:8080`.

### 3. Настройка домена в Cloudflare

1. В разделе DNS создать запись `A` (или `CNAME`) на IP VPS, включить режим Proxy (оранжевое облако).
2. В разделе SSL/TLS выбрать режим **Full (Strict)**.
3. Дождаться обновления DNS и открыть сайт по `https://<домен>`.

### 4. Обновление версии приложения

При изменениях в коде:

```sh
npm run build
docker-compose up -d --build
```

Это пересоберёт образ и обновит статику внутри контейнера.
