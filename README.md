
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
- `docker/nginx.conf` — конфигурация Nginx для SPA (`try_files ... /index.html`) и HTTPS с Origin Certificate от Cloudflare
- `docker-compose.yml` — сервис `web` с пробросом портов `8080:80` (HTTP) и `443:443` (HTTPS)

Базовый запуск (без монтирования сертификатов):

```sh
docker-compose up -d --build
```

Приложение будет доступно по адресу `http://<IP_VPS>:8080`.

### 3. Настройка Origin Certificate Cloudflare на VPS

1. В панели Cloudflare создать Origin Certificate (SSL/TLS → Origin Server) и скачать:
   - сертификат (например, `origin.crt`)
   - приватный ключ (например, `origin.key`)
2. На VPS создать директорию для сертификатов:

   ```sh
   sudo mkdir -p /etc/nginx/ssl
   sudo chown root:root /etc/nginx/ssl
   sudo chmod 700 /etc/nginx/ssl
   ```

3. Загрузить файлы на VPS и переместить их в `/etc/nginx/ssl`:

   ```sh
   scp origin.crt origin.key user@<IP_VPS>:/home/user/
   ssh user@<IP_VPS>
   sudo mv /home/user/origin.crt /etc/nginx/ssl/
   sudo mv /home/user/origin.key /etc/nginx/ssl/
   sudo chmod 600 /etc/nginx/ssl/origin.*
   ```

4. В `docker-compose.yml` раскомментировать volume с сертификатами:

   ```yaml
   volumes:
     - /etc/nginx/ssl:/etc/nginx/ssl:ro
   ```

5. Пересобрать и перезапустить контейнер:

   ```sh
   npm run build        # при обновлении фронтенда
   docker-compose up -d --build
   ```

После этого Cloudflare будет устанавливать HTTPS-соединение до вашего Nginx по Origin Certificate.

### 4. Настройка домена в Cloudflare

1. В разделе DNS создать запись `A` (или `CNAME`) на IP VPS, включить режим Proxy (оранжевое облако).
2. В разделе SSL/TLS выбрать режим **Full (Strict)**.
3. Дождаться обновления DNS и открыть сайт по `https://<домен>`.

### 5. Обновление версии приложения

При изменениях в коде:

```sh
npm run build
docker-compose up -d --build
```

Это пересоберёт образ и обновит статику внутри контейнера.

### 6. CI/CD через GitHub Actions (деплой на VPS)

В репозитории настроен простой pipeline `.github/workflows/ci.yml`:

- при `push`/PR в `main`:
  - выполняется сборка (`npm ci`, `npm run build`);
- при `push` в `main`:
  - по SSH выполняется деплой на VPS.

Для работы CD нужно в `Settings → Secrets and variables → Actions` задать:

- `VPS_HOST` — IP или домен VPS;
- `VPS_USER` — пользователь на VPS (с доступом к проекту и Docker);
- `VPS_PORT` — SSH-порт (обычно `22`);
- `VPS_SSH_KEY` — приватный SSH‑ключ (формат OpenSSH);
- `VPS_PROJECT_PATH` — путь к директории проекта на VPS (где лежит git-клон и `docker-compose.yml`).

После этого при каждом `push` в `main` GitHub Actions будет выполнять на VPS:

```sh
git pull origin main
npm install
npm run build
docker-compose up -d --build
```
