import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // In production (Vercel), use PostgreSQL with pg adapter
  if (process.env.NODE_ENV === 'production') {
    const { PrismaPg } = require('@prisma/adapter-pg');
    const { Pool } = require('pg');

    const connectionString = process.env.POSTGRES_PRISMA_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
      adapter,
      log: ['error'],
      errorFormat: 'minimal',
    });
  }

  // In development, use SQLite with better-sqlite3 adapter
  // Dynamic import to avoid bundling better-sqlite3 in production
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  const dbPath = path.join(process.cwd(), 'dev.db');
  const adapter = new PrismaBetterSqlite3({ url: dbPath });

  return new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
    errorFormat: 'minimal',
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
