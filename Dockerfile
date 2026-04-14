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

# Stage 2: build MkDocs
FROM python:3.12.8-alpine3.20 AS build-docs

WORKDIR /docs

COPY docs/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY docs/mkdocs.yml ./mkdocs.yml

ARG CONTENT_REPO_URL=https://github.com/Lokiu27/BA_Course.git
ARG CONTENT_REPO_REF=main
RUN apk add --no-cache git \
    && git clone --depth 1 --branch ${CONTENT_REPO_REF} ${CONTENT_REPO_URL} content \
    && cd content && git log --oneline -1 > /docs/.content-commit \
    && rm -rf content/.git

RUN mkdocs build -f mkdocs.yml

# Stage 3: nginx serving built static files
FROM nginx:1.27.3-alpine3.20

RUN rm -f /etc/nginx/conf.d/default.conf && rm -rf /usr/share/nginx/html/*

COPY docker/nginx-letsencrypt.conf /etc/nginx/conf.d/default.conf
COPY --from=build-spa /app/dist /usr/share/nginx/html
COPY --from=build-docs /docs/site /usr/share/nginx/course
COPY --from=build-docs /docs/.content-commit /usr/share/nginx/.content-commit

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
