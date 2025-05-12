import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

// Инициализируем соединение с базой через pg.Pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Применяем миграции
migrate(db, { migrationsFolder: './drizzle' })
  .then(() => console.log('Drizzle migrations applied'))
  .catch((error) => console.error('Drizzle migration error:', error));
