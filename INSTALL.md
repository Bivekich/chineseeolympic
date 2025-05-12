# Инструкция по установке и запуску

## Требования

- Docker и Docker Compose
- PostgreSQL (внешняя база данных)

## Быстрый запуск

1. Создайте файл `.env` с следующими параметрами:

```
# База данных
DATABASE_URL=postgresql://user:password@host:5432/database

# ЮКасса
UKASSA_API_KEY=live_xxxxxxx
UKASSA_SHOP_ID=xxxxxx
UKASSA_SECRET_KEY=xxxxxx

# JWT
JWT_SECRET=your-jwt-secret

# URL приложения
NEXT_PUBLIC_APP_URL=https://chinesestar.ru

# Режим работы (обязательно для боевого режима ЮКассы)
NODE_ENV=production
```

2. Запустите приложение:

```bash
# Используйте готовый скрипт
./start.sh

# Или выполните команды вручную
mkdir -p public/uploads public/olympiad-media public/certificates
docker-compose up -d --build
```

3. Приложение будет доступно по адресу: http://ваш-хост:3001

## Проверка логов

```bash
docker-compose logs -f app
```

## Решение проблем с ЮКассой

1. Убедитесь, что используются боевые ключи (начинаются с `live_`)
2. Проверьте настройки чеков в личном кабинете ЮКассы
3. Убедитесь, что `NODE_ENV=production` указан в .env файле

## Перезапуск приложения

```bash
docker-compose down
docker-compose up -d --build
```
