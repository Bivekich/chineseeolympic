import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Проверяем, включен ли режим разработки
const isDevelopmentMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// Создаем типизированную версию db, которая соответствует используемым паттернам
export type DbType = {
  query: {
    users: {
      findFirst: (params?: any) => Promise<any>;
      findMany: (params?: any) => Promise<any[]>;
    };
    olympiads: {
      findFirst: (params?: any) => Promise<any>;
      findMany: (params?: any) => Promise<any[]>;
    };
    prizes: {
      findFirst: (params?: any) => Promise<any>;
      findMany: (params?: any) => Promise<any[]>;
    };
    participantResults: {
      findFirst: (params?: any) => Promise<any>;
      findMany: (params?: any) => Promise<any[]>;
    };
    participantDetails: {
      findFirst: (params?: any) => Promise<any>;
      findMany: (params?: any) => Promise<any[]>;
    };
    questions: {
      findFirst: (params?: any) => Promise<any>;
      findMany: (params?: any) => Promise<any[]>;
    };
  };
  select: (fields?: any) => {
    from: (table: any) => {
      where: (condition: any) => any;
      innerJoin: (
        table: any,
        condition: any
      ) => {
        where: (condition: any) => any;
      };
    };
  };
  insert: (table: any) => {
    values: (data: any) => {
      returning: () => Promise<any[]>;
    };
  };
  update: (table: any) => {
    set: (data: any) => {
      where: (condition: any) => {
        returning: () => Promise<any[]>;
      };
    };
  };
  delete: (table: any) => {
    where: (condition: Function) => Promise<any[]>;
  };
  transaction: (fn: (tx: any) => Promise<any>) => Promise<any>;
};

// Создаем заглушку для базы данных в dev-режиме
const createMockDB = (): DbType => {
  console.log('⚠️ Running in development mode with mock database');

  // Возвращаем заглушку, которая имитирует интерфейс drizzle
  return {
    query: {
      users: {
        findFirst: async () => null,
        findMany: async () => [],
      },
      olympiads: {
        findFirst: async () => null,
        findMany: async () => [],
      },
      prizes: {
        findFirst: async () => null,
        findMany: async () => [],
      },
      participantResults: {
        findFirst: async () => null,
        findMany: async () => [],
      },
      participantDetails: {
        findFirst: async () => null,
        findMany: async () => [],
      },
      questions: {
        findFirst: async () => null,
        findMany: async () => [],
      },
    },
    // Имитация основных методов drizzle
    insert: () => ({ values: () => ({ returning: async () => [] }) }),
    select: () => ({
      from: () => ({
        where: () => [],
        innerJoin: () => ({
          where: () => [],
        }),
      }),
    }),
    update: () => ({
      set: () => ({ where: () => ({ returning: async () => [] }) }),
    }),
    // В dev режиме используем этот интерфейс
    delete: (table: any) => ({
      where: (condition: any) => Promise.resolve([]),
    }),
    transaction: async (fn) => {
      // Implementation of transaction
    },
  };
};

let dbInstance: DbType;

if (isDevelopmentMode) {
  dbInstance = createMockDB();
} else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === 'production'
        ? {
            rejectUnauthorized: false,
          }
        : false,
  });

  dbInstance = drizzle(pool, { schema }) as any as DbType;
}

export const db = dbInstance;
