import pg from 'pg'
import { newDb } from 'pg-mem'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'schema.sql')

const { Pool } = pg

let pool = null
let isMemoryDb = false
let pgMemInstance = null

export function getDatabasePool() {
  if (pool) return pool

  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    console.log('[POSTGRES] Initializing authoritative connection pool to PostgreSQL...')
    const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')
    pool = new Pool({
      connectionString: dbUrl,
      ssl: !isLocalhost ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DB_POOL_MAX || (process.env.VERCEL ? '5' : '15'), 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      allowExitOnIdle: Boolean(process.env.VERCEL),
    })
    isMemoryDb = false
  } else {
    // ENFORCE SAFEGUARD: Production MUST have DATABASE_URL configured
    const isProduction = process.env.NODE_ENV === 'production' && !process.env.ALLOW_PG_MEM && !process.env.TEST_ENV
    if (isProduction && process.env.VERCEL) {
      console.error('[DATABASE FATAL]: DATABASE_URL is missing in production environment. In-memory storage is prohibited to prevent data loss.')
      throw new Error('[DATABASE CONFIGURATION ERROR]: DATABASE_URL must be configured in production Vercel environment.')
    }

    console.log('[POSTGRES] No DATABASE_URL found. Initializing PostgreSQL in-process engine (TEST/LOCAL ONLY)...')
    pgMemInstance = newDb()

    // Register PostgreSQL standard functions
    pgMemInstance.public.registerFunction({
      name: 'gen_random_uuid',
      implementation: () => '00000000-0000-0000-0000-' + Math.random().toString(16).slice(2, 14),
    })

    const adapter = pgMemInstance.adapters.createPg()
    pool = new adapter.Pool()
    isMemoryDb = true
  }

  pool.on('error', err => {
    console.error('[POSTGRES ERROR] Unexpected idle client error:', err.message)
  })

  return pool
}

export async function query(text, params = []) {
  const p = getDatabasePool()
  return p.query(text, params)
}

export async function getClient() {
  const p = getDatabasePool()
  return p.connect()
}

let txQueue = Promise.resolve()

/**
 * Execute a transactional database operation with guaranteed commit or rollback.
 * Uses native PostgreSQL transactions on live DB, and snapshot serialization on pg-mem.
 * @param {Function} callback - async function(client) returning result
 */
export async function transaction(callback) {
  if (isMemoryDb && pgMemInstance) {
    const runInQueue = async () => {
      const snapshot = pgMemInstance.backup()
      const client = await getClient()
      try {
        await client.query('BEGIN')
        const result = await callback(client)
        await client.query('COMMIT')
        return result
      } catch (err) {
        try {
          await client.query('ROLLBACK')
        } catch (_) {}
        snapshot.restore()
        throw err
      } finally {
        client.release()
      }
    }

    const currentOp = txQueue.then(runInQueue, runInQueue)
    txQueue = currentOp.catch(() => {})
    return currentOp
  }

  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackErr) {
      console.error('[POSTGRES] Rollback failed:', rollbackErr.message)
    }
    throw err
  } finally {
    client.release()
  }
}

/**
 * Execute DDL schema to ensure all PostgreSQL tables exist.
 */
export async function initDatabase() {
  const p = getDatabasePool()
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8')

  // Strip line comments before splitting statements
  const cleanSql = sql.replace(/--.*$/gm, '')
  const statements = cleanSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const stmt of statements) {
    try {
      await p.query(stmt)
    } catch (err) {
      // Ignore index/table already exists errors
      if (!err.message.includes('already exists')) {
        console.warn('[POSTGRES DDL NOTICE]:', err.message)
      }
    }
  }

  console.log('[POSTGRES] Database schema initialization complete.')
  return true
}

export { isMemoryDb, pgMemInstance }
