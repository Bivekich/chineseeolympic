# Руководство по развертыванию через Docker

## Подготовка

1. Установите Docker и Docker Compose на сервер:

   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.25.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. Клонируйте репозиторий:

   ```bash
   git clone <url-репозитория>
   cd <название-папки-проекта>
   ```

3. Настройте файл `.env.docker` (уже создан в репозитории):

   ```
   # Строка подключения к БД в формате Prisma/PostgreSQL
   DATABASE_URL=postgresql://user:password@postgres:5432/dbname
   # Секретный ключ для JWT, рекомендуется изменить
   JWT_SECRET=9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p3q2r1s0t9u8v7w6x5y4z3a2b1c0d
   # URL приложения - укажите ваш домен
   NEXT_PUBLIC_APP_URL=http://ваш-домен.ру
   # Включаем dev-режим для запуска без настройки почты
   NEXT_PUBLIC_DEV_MODE=true
   ```

4. Настройте DNS, чтобы ваш домен указывал на IP-адрес вашего сервера.

## Запуск

1. Соберите и запустите контейнеры:

   ```bash
   docker-compose up -d
   ```

2. Проверьте, что все контейнеры запущены и работают:
   ```bash
   docker-compose ps
   ```

## Структура проекта

- **nextjs**: Основное приложение Next.js
- **nginx**: Веб-сервер, обеспечивающий проксирование запросов к приложению
- **postgres**: База данных PostgreSQL

## Проверка логов

Для просмотра логов контейнера:

```bash
docker-compose logs -f nextjs
```

## Управление контейнерами

- **Остановка**: `docker-compose stop`
- **Запуск**: `docker-compose start`
- **Перезапуск**: `docker-compose restart`
- **Удаление всех контейнеров**: `docker-compose down`
- **Удаление всех контейнеров и данных**: `docker-compose down -v`

## Настройка для production

Для настройки рабочего сервера:

1. Отключите режим разработки, установив `NEXT_PUBLIC_DEV_MODE=false`
2. Укажите настройки почтового сервера для отправки писем
3. Настройте HTTPS с помощью Certbot и Nginx
4. Установите правильные пароли для базы данных и JWT-токенов
