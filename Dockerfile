FROM nginx:stable-alpine

# Удаляем конфигурацию Nginx по умолчанию
RUN rm -f /etc/nginx/conf.d/default.conf

# Копируем нашу конфигурацию Nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные статические файлы SPA
COPY dist/ /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

