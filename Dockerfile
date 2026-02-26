# Stage 1: build frontend with repo-specified Node version (>=18)
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy the rest of the sources and build
COPY . .
# Set environment variable to skip prerendering in Docker
ENV DOCKER_BUILD=true
RUN npm run build

# Stage 2: nginx serving built static files
FROM nginx:stable-alpine

# Remove default config
RUN rm -f /etc/nginx/conf.d/default.conf

# Our nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built SPA from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

