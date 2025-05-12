# Запуск приложения в Docker

## Подготовка

1. Создайте файл `.env` в корне проекта со всеми необходимыми переменными окружения.

Пример `.env`:

```
# База данных
DATABASE_URL=postgresql://user:password@host:5432/database

# ЮКасса (боевые ключи)
UKASSA_API_KEY=live_xxxxxxx
UKASSA_SHOP_ID=xxxxxx
UKASSA_SECRET_KEY=xxxxxx

# JWT
JWT_SECRET=your-jwt-secret

# URL приложения
NEXT_PUBLIC_APP_URL=https://chinesestar.ru

# Режим работы
NODE_ENV=production
```

## Запуск

```bash
# Создание необходимых директорий
mkdir -p public/uploads public/olympiad-media public/certificates

# Запуск приложения
docker-compose up -d --build
```

Приложение будет доступно по адресу `http://ваш-хост:3001`

## Проверка логов

```bash
docker-compose logs -f app
```

## Остановка приложения

```bash
docker-compose down
```

## Переменные окружения

Все переменные окружения должны быть определены в файле `.env`. Приложение использует порт 3001 для доступа извне, но внутри контейнера работает на порту 3000.
