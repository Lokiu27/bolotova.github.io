# Сайт-визитка эксперта по формированию команд бизнес-аналитиков

Статический сайт, созданный с помощью Jekyll для размещения на GitHub Pages.

## О проекте

Это одностраничный сайт-визитка с информацией об эксперте по формированию команд бизнес-аналитиков. Сайт включает:

- Секцию Hero с фотографией профиля и контактными кнопками
- Секцию About с описанием услуг
- Footer с информацией об авторских правах

## Технологии

- [Jekyll](https://jekyllrb.com/) - генератор статических сайтов
- [GitHub Pages](https://pages.github.com/) - хостинг
- CSS3 с переменными для стилизации
- [Font Awesome](https://fontawesome.com/) - иконки

## Локальная разработка

### Требования

- Ruby 2.7 или выше
- Bundler

### Установка зависимостей

1. Клонируйте репозиторий:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Установите зависимости Jekyll:
```bash
bundle install
```

### Запуск локального сервера

Запустите локальный сервер разработки:

```bash
bundle exec jekyll serve
```

Сайт будет доступен по адресу: `http://localhost:4000`

Сервер автоматически пересобирает сайт при изменении файлов (кроме `_config.yml` - требуется перезапуск).

### Дополнительные опции запуска

```bash
# Запуск с live reload
bundle exec jekyll serve --livereload

# Запуск на другом порту
bundle exec jekyll serve --port 4001

# Запуск с отображением черновиков
bundle exec jekyll serve --drafts
```

## Структура проекта

```
/
├── _config.yml              # Конфигурация Jekyll
├── _data/                   # Данные контента в YAML
│   ├── hero.yml            # Данные секции Hero
│   ├── about.yml           # Данные секции About
│   └── contacts.yml        # Контактные ссылки
├── _layouts/               # HTML-шаблоны
│   └── default.html        # Основной layout
├── _includes/              # Переиспользуемые компоненты
│   ├── head.html          # HTML head с мета-тегами
│   ├── hero.html          # Секция Hero
│   ├── about.html         # Секция About
│   └── footer.html        # Секция Footer
├── assets/                 # Статические ресурсы
│   ├── css/
│   │   └── main.css       # Основные стили
│   ├── images/
│   │   └── profile-photo.jpg
│   └── files/
│       └── resume.pdf
├── index.html              # Главная страница
├── Gemfile                 # Ruby зависимости
└── README.md              # Документация
```

## Редактирование контента

### Изменение текста секции Hero

Отредактируйте файл `_data/hero.yml`:

```yaml
title: "Ваш заголовок"
subtitle: "Ваш подзаголовок"
description: "Ваше описание"
profile_image: "/assets/images/profile-photo.jpg"
```

### Изменение услуг в секции About

Отредактируйте файл `_data/about.yml`:

```yaml
title: "Заголовок секции"
description: "Описание секции"
features:
  - icon: "users"
    title: "Название услуги"
    description: "Описание услуги"
```

Доступные иконки Font Awesome: `users`, `sparkles`, `bullseye`, `envelope`, `github`, `file-alt` и другие.

### Изменение контактных ссылок

Отредактируйте файл `_data/contacts.yml`:

```yaml
email: "your.email@example.com"
telegram: "https://t.me/yourusername"
github: "https://github.com/yourusername"
resume: "/assets/files/resume.pdf"
```

### Замена фотографии профиля

Замените файл `assets/images/profile-photo.jpg` на свою фотографию (рекомендуемый размер: 400x400px).

### Обновление резюме

Замените файл `assets/files/resume.pdf` на свое резюме.

## Деплой на GitHub Pages

### Первоначальная настройка

1. Создайте репозиторий на GitHub (если еще не создан)

2. Обновите `_config.yml` с вашими данными:
```yaml
title: "Ваш заголовок"
description: "Ваше описание"
url: "https://yourusername.github.io"
baseurl: ""  # Оставьте пустым для username.github.io
# Или укажите имя репозитория для project pages:
# baseurl: "/repository-name"
```

3. Отправьте код в GitHub:
```bash
git add .
git commit -m "Initial Jekyll site"
git push origin main
```

### Включение GitHub Pages

1. Перейдите в Settings вашего репозитория
2. Выберите раздел "Pages" в боковом меню
3. В разделе "Source" выберите:
   - Branch: `main`
   - Folder: `/ (root)`
4. Нажмите "Save"

GitHub Pages автоматически соберет и опубликует ваш сайт. Процесс занимает 1-2 минуты.

### Проверка деплоя

Ваш сайт будет доступен по адресу:
- Для user/organization pages: `https://yourusername.github.io`
- Для project pages: `https://yourusername.github.io/repository-name`

### Обновление сайта

После любых изменений просто отправьте код в GitHub:

```bash
git add .
git commit -m "Update content"
git push origin main
```

GitHub Pages автоматически пересоберет сайт.

## Настройка baseurl для project pages

Если вы используете project pages (не username.github.io), обновите `_config.yml`:

```yaml
baseurl: "/repository-name"
```

И используйте фильтр `relative_url` для всех путей к ресурсам в шаблонах:

```liquid
{{ '/assets/css/main.css' | relative_url }}
{{ '/assets/images/profile-photo.jpg' | relative_url }}
```

Фильтр `relative_url` автоматически добавляет `baseurl` к путям, что обеспечивает корректную работу как для пользовательских сайтов (username.github.io), так и для проектных сайтов (username.github.io/repository-name).

## Кастомизация стилей

Стили находятся в `assets/css/main.css`. Вы можете изменить:

### Цветовую схему

```css
:root {
  --color-primary: #9b87f5;      /* Основной цвет */
  --color-background: #1A1F2C;   /* Фон */
  --color-foreground: #FFFFFF;   /* Текст */
  --color-card: #221F26;         /* Фон карточек */
}
```

### Шрифты

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

### Размеры и отступы

Измените значения padding, margin, font-size в соответствующих классах.

## Устранение неполадок

### Сайт не отображается на GitHub Pages

- Проверьте, что GitHub Pages включен в настройках репозитория
- Убедитесь, что `baseurl` в `_config.yml` настроен правильно
- Проверьте статус сборки в разделе Actions репозитория

### Стили не применяются

- Проверьте путь к CSS в `_includes/head.html`
- Убедитесь, что используете `{{ site.baseurl }}` для путей
- Очистите кеш браузера

### Изображения не загружаются

- Проверьте пути к изображениям в YAML-файлах
- Убедитесь, что файлы находятся в `assets/images/`
- Проверьте, что используете правильный `baseurl`

### Изменения не отображаются локально

- Перезапустите Jekyll сервер после изменения `_config.yml`
- Очистите кеш: `bundle exec jekyll clean`
- Проверьте консоль на наличие ошибок

## Полезные команды

```bash
# Сборка сайта без запуска сервера
bundle exec jekyll build

# Очистка сгенерированных файлов
bundle exec jekyll clean

# Проверка версии Jekyll
bundle exec jekyll --version

# Обновление зависимостей
bundle update
```

## Дополнительные ресурсы

- [Документация Jekyll](https://jekyllrb.com/docs/)
- [Документация GitHub Pages](https://docs.github.com/en/pages)
- [Liquid шаблонизатор](https://shopify.github.io/liquid/)
- [Font Awesome иконки](https://fontawesome.com/icons)

## Лицензия

© 2024. Все права защищены.
