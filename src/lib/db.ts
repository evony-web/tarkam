// ─── Database Client — Dual Environment ───
// Production (Vercel): Neon PostgreSQL via standard PrismaClient
// Local development: SQLite via standard PrismaClient
//
// NOTE: Lazy initialization is required because Turbopack may evaluate
// this module before .env is loaded. By deferring PrismaClient creation
// to first actual use, we ensure process.env.DATABASE_URL is available.

// Ensure .env is loaded with correct values before Prisma Client initialization.
// Bun auto-loads .env but may cache stale values; dotenv with override fixes this.
import { config as dotenvConfig } from 'dotenv'
import { resolve } from 'path'
dotenvConfig({ path: resolve(process.cwd(), '.env'), override: true })

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function _isPostgresUrl(): boolean {
  return (process.env.DATABASE_URL || '').startsWith('postgres')
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.error('[DB] ❌ DATABASE_URL is not set! Database connection will fail.')
    console.error('[DB] Set DATABASE_URL in .env (local) or Vercel Environment Variables (production)')
  }

  if (_isPostgresUrl()) {
    // ── Production: Neon PostgreSQL ──
    // Standard PrismaClient works with Neon using the pooled connection URL.
    // For Prisma migrations/schema push, use DIRECT_URL (non-pooled).
    console.log('[DB] Using Neon PostgreSQL —', dbUrl?.substring(0, 30) + '...')
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })
  }

  // ── Local development: SQLite ──
  console.log('[DB] Using SQLite —', dbUrl || '(no URL)')
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  })
}

function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Lazy proxy: forwards all property accesses to the real PrismaClient
// which is created on first use (after .env is loaded).
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const real = getDb()
    const value = Reflect.get(real, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(real)
    }
    return value
  },
})

/** Export provider info so other modules can adapt behavior */
export const isSQLite = !_isPostgresUrl()
export const isPostgreSQL = _isPostgresUrl()

// ═══════════════════════════════════════════════════════════
// POSTGRESQL COMPATIBILITY HELPERS
// ═══════════════════════════════════════════════════════════
// When running on PostgreSQL (Neon), certain Prisma operations
// need raw SQL workarounds. On SQLite, standard Prisma is used.
// ═══════════════════════════════════════════════════════════

/**
 * PostgreSQL-compatible replacement for Prisma's updateMany().
 * When running on PostgreSQL, uses raw SQL instead.
 * When running on SQLite, falls back to normal Prisma updateMany.
 *
 * @param table - Prisma model name (e.g. 'Participation', 'Player')
 * @param whereClauses - Array of { column, operator, value } conditions
 * @param data - Object of { column: value } to update
 * @returns Number of rows affected
 */
export async function neonUpdateMany(
  table: string,
  whereClauses: Array<{ column: string; operator: '=' | 'IN' | 'NOT NULL' | 'IS NULL'; value?: string | string[] }>,
  data: Record<string, unknown>
): Promise<number> {
  if (!_isPostgresUrl()) {
    throw new Error('neonUpdateMany should only be called for PostgreSQL. Use db.model.updateMany for SQLite.');
  }

  // Build SET clause
  const setParts: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  for (const [col, val] of Object.entries(data)) {
    if (val === null) {
      setParts.push(`"${col}" = NULL`);
    } else if (typeof val === 'string') {
      params.push(val);
      setParts.push(`"${col}" = $${paramIdx++}`);
    } else if (typeof val === 'number') {
      params.push(val);
      setParts.push(`"${col}" = $${paramIdx++}`);
    } else if (typeof val === 'boolean') {
      params.push(val);
      setParts.push(`"${col}" = $${paramIdx++}`);
    } else {
      params.push(val);
      setParts.push(`"${col}" = $${paramIdx++}`);
    }
  }

  // Build WHERE clause
  const whereParts: string[] = [];
  for (const wc of whereClauses) {
    if (wc.operator === '=' && wc.value !== undefined) {
      params.push(wc.value);
      whereParts.push(`"${wc.column}" = $${paramIdx++}`);
    } else if (wc.operator === 'IN' && Array.isArray(wc.value) && wc.value.length > 0) {
      const placeholders = wc.value.map(() => `$${paramIdx++}`).join(', ');
      params.push(...wc.value);
      whereParts.push(`"${wc.column}" IN (${placeholders})`);
    } else if (wc.operator === 'NOT NULL') {
      whereParts.push(`"${wc.column}" IS NOT NULL`);
    } else if (wc.operator === 'IS NULL') {
      whereParts.push(`"${wc.column}" IS NULL`);
    }
  }

  const sql = `UPDATE "${table}" SET ${setParts.join(', ')}${whereParts.length > 0 ? ' WHERE ' + whereParts.join(' AND ') : ''}`;
  return db.$executeRawUnsafe(sql, ...params);
}

/**
 * PostgreSQL-compatible replacement for Prisma's deleteMany().
 * When running on PostgreSQL, uses raw SQL instead.
 * When running on SQLite, falls back to normal Prisma deleteMany.
 *
 * @param table - Prisma model name (e.g. 'TeamPlayer', 'Match')
 * @param whereClauses - Array of { column, operator, value } conditions
 * @returns Number of rows deleted
 */
export async function neonDeleteMany(
  table: string,
  whereClauses: Array<{ column: string; operator: '=' | 'IN' | 'NOT NULL' | 'IS NULL'; value?: string | string[] }>
): Promise<number> {
  if (!_isPostgresUrl()) {
    throw new Error('neonDeleteMany should only be called for PostgreSQL. Use db.model.deleteMany for SQLite.');
  }

  const params: unknown[] = [];
  let paramIdx = 1;
  const whereParts: string[] = [];

  for (const wc of whereClauses) {
    if (wc.operator === '=' && wc.value !== undefined && typeof wc.value === 'string') {
      params.push(wc.value);
      whereParts.push(`"${wc.column}" = $${paramIdx++}`);
    } else if (wc.operator === 'IN' && Array.isArray(wc.value) && wc.value.length > 0) {
      const placeholders = wc.value.map(() => `$${paramIdx++}`).join(', ');
      params.push(...wc.value);
      whereParts.push(`"${wc.column}" IN (${placeholders})`);
    } else if (wc.operator === 'NOT NULL') {
      whereParts.push(`"${wc.column}" IS NOT NULL`);
    } else if (wc.operator === 'IS NULL') {
      whereParts.push(`"${wc.column}" IS NULL`);
    }
  }

  const sql = `DELETE FROM "${table}"${whereParts.length > 0 ? ' WHERE ' + whereParts.join(' AND ') : ''}`;
  return db.$executeRawUnsafe(sql, ...params);
}

/**
 * PostgreSQL-compatible replacement for Prisma's createMany().
 * When running on PostgreSQL, creates rows one by one sequentially.
 * When running on SQLite, falls back to normal Prisma createMany.
 *
 * @param model - Prisma model delegate (e.g. db.teamPlayer)
 * @param data - Array of data objects to create
 * @returns Count of created rows
 */
export async function neonCreateMany<T>(
  model: { create: (args: { data: T }) => Promise<unknown> },
  data: T[]
): Promise<number> {
  if (!_isPostgresUrl()) {
    throw new Error('neonCreateMany should only be called for PostgreSQL. Use db.model.createMany for SQLite.');
  }

  let count = 0;
  for (const item of data) {
    await model.create({ data: item });
    count++;
  }
  return count;
}

/**
 * PostgreSQL-compatible replacement for Prisma's $transaction().
 * When running on PostgreSQL, uses standard $transaction.
 * When running on SQLite, uses standard $transaction.
 */
export async function neonTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  if (!_isPostgresUrl()) {
    return db.$transaction(fn as never) as Promise<T>;
  }
  // PostgreSQL: use standard Prisma transaction
  return db.$transaction(fn as never) as Promise<T>;
}
