#!/bin/bash

# Скрипт диагностики проблем с развертыванием
# Использование: ./diagnose.sh

echo "=== Диагностика проекта ==="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Проверка наличия dist/
echo "1. Проверка наличия собранных файлов..."
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    echo -e "${GREEN}✓${NC} Папка dist/ существует и содержит файлы"
else
    echo -e "${RED}✗${NC} Папка dist/ отсутствует или пуста. Запустите: npm run build"
fi
echo ""

# 2. Проверка Docker
echo "2. Проверка Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker установлен"
    docker --version
else
    echo -e "${RED}✗${NC} Docker не установлен"
fi
echo ""

# 3. Проверка Docker Compose
echo "3. Проверка Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose установлен"
    docker-compose --version
else
    echo -e "${RED}✗${NC} Docker Compose не установлен"
fi
echo ""

# 4. Проверка статуса контейнера
echo "4. Проверка статуса контейнера..."
if docker ps -a | grep -q portfolio-web; then
    echo -e "${GREEN}✓${NC} Контейнер portfolio-web найден"
    echo "Статус:"
    docker ps -a | grep portfolio-web
    echo ""
    echo "Последние логи:"
    docker logs portfolio-web --tail 20 2>&1 | tail -10
else
    echo -e "${YELLOW}⚠${NC} Контейнер portfolio-web не найден. Запустите: docker-compose up -d"
fi
echo ""

# 5. Проверка портов
echo "5. Проверка портов..."
if command -v netstat &> /dev/null; then
    if netstat -tlnp 2>/dev/null | grep -qE ':(80|443|8080)'; then
        echo -e "${GREEN}✓${NC} Найдены открытые порты:"
        netstat -tlnp 2>/dev/null | grep -E ':(80|443|8080)'
    else
        echo -e "${YELLOW}⚠${NC} Порты 80, 443 или 8080 не найдены в netstat"
    fi
elif command -v ss &> /dev/null; then
    if ss -tlnp 2>/dev/null | grep -qE ':(80|443|8080)'; then
        echo -e "${GREEN}✓${NC} Найдены открытые порты:"
        ss -tlnp 2>/dev/null | grep -E ':(80|443|8080)'
    else
        echo -e "${YELLOW}⚠${NC} Порты 80, 443 или 8080 не найдены"
    fi
else
    echo -e "${YELLOW}⚠${NC} netstat и ss не найдены, проверка портов пропущена"
fi
echo ""

# 6. Проверка SSL сертификатов
echo "6. Проверка SSL сертификатов..."
if docker ps | grep -q portfolio-web; then
    if docker exec portfolio-web ls /etc/nginx/ssl/origin.crt &> /dev/null; then
        echo -e "${GREEN}✓${NC} SSL сертификаты найдены в контейнере"
    else
        echo -e "${YELLOW}⚠${NC} SSL сертификаты не найдены в контейнере"
        echo "  Это нормально, если вы используете конфигурацию без SSL"
        echo "  Для работы с Cloudflare установите Origin Certificate"
    fi
else
    echo -e "${YELLOW}⚠${NC} Контейнер не запущен, проверка SSL пропущена"
fi
echo ""

# 7. Проверка конфигурации Nginx
echo "7. Проверка конфигурации Nginx..."
if docker ps | grep -q portfolio-web; then
    if docker exec portfolio-web nginx -t &> /dev/null; then
        echo -e "${GREEN}✓${NC} Конфигурация Nginx валидна"
        docker exec portfolio-web nginx -t
    else
        echo -e "${RED}✗${NC} Ошибка в конфигурации Nginx:"
        docker exec portfolio-web nginx -t
    fi
else
    echo -e "${YELLOW}⚠${NC} Контейнер не запущен, проверка конфигурации пропущена"
fi
echo ""

# 8. Проверка доступности HTTP
echo "8. Проверка доступности HTTP (порт 8080)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo -e "${GREEN}✓${NC} HTTP доступен (код: $HTTP_CODE)"
    else
        echo -e "${YELLOW}⚠${NC} HTTP отвечает с кодом: $HTTP_CODE"
    fi
else
    echo -e "${RED}✗${NC} HTTP недоступен на порту 8080"
fi
echo ""

echo "=== Диагностика завершена ==="
echo ""
echo "Для получения подробной информации см. TROUBLESHOOTING.md"
