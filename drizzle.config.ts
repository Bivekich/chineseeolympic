import * as dotenv from 'dotenv';
// Загружаем переменные окружения из .env
dotenv.config();

/** @type {import('drizzle-kit').Config} */
export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  migrationsFolder: './drizzle',
  dialect: 'postgresql',
  url: process.env.DATABASE_URL,
};
