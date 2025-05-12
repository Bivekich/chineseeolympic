#!/bin/bash

echo "Подготовка директорий..."
mkdir -p public/uploads public/olympiad-media public/certificates

echo "Запуск приложения..."
docker-compose up -d --build

echo "Приложение запущено на порту 3001"
echo "Для просмотра логов выполните: docker-compose logs -f app"
