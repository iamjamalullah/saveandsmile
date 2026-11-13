import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { query } from './src/db/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKUP_DIR = path.join(__dirname, 'backups')

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

const TABLES = [
  'staff_accounts',
  'categories',
  'products',
  'customers',
  'coupons',
  'orders',
  'order_items',
  'reviews',
  'contact_inquiries',
  'store_settings',
  'hero_slides',
  'sections',
  'watch_shop',
  'idempotency_keys',
]

/**
 * Creates an automated, full snapshot backup of all PostgreSQL tables,
 * generates a SHA-256 checksum manifest, and applies retention policy.
 */
export async function createPostgresBackup() {
  console.log('[PG BACKUP] Starting database snapshot backup...')

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      engine: 'postgresql',
      version: '1.0',
    },
    tables: {},
    counts: {},
  }

  for (const table of TABLES) {
    try {
      const res = await query(`SELECT * FROM ${table}`)
      backupData.tables[table] = res.rows
      backupData.counts[table] = res.rows.length
    } catch (err) {
      console.warn(`[PG BACKUP] Table ${table} query failed: ${err.message}`)
      backupData.tables[table] = []
      backupData.counts[table] = 0
    }
  }

  const jsonString = JSON.stringify(backupData, null, 2)
  const checksum = crypto.createHash('sha256').update(jsonString).digest('hex')
  backupData.metadata.checksum = checksum

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `pg-backup-${timestamp}.json`
  const destination = path.join(BACKUP_DIR, filename)

  fs.writeFileSync(destination, JSON.stringify(backupData, null, 2), 'utf8')
  console.log(`[PG BACKUP] Backup successfully created: ${filename}`)
  console.log(`[PG BACKUP] SHA-256 Checksum: ${checksum}`)
  console.log(`[PG BACKUP] Summary: ${backupData.counts.products} products, ${backupData.counts.orders} orders, ${backupData.counts.customers} customers`)

  // Retention Policy: Retain last 30 backups
  applyRetentionPolicy()

  return { destination, filename, checksum, counts: backupData.counts }
}

export function applyRetentionPolicy(maxBackups = 30) {
  const existing = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('pg-backup-') && f.endsWith('.json'))
    .sort()

  while (existing.length > maxBackups) {
    const toRemove = existing.shift()
    try {
      fs.unlinkSync(path.join(BACKUP_DIR, toRemove))
      console.log(`[PG BACKUP RETENTION] Pruned old backup: ${toRemove}`)
    } catch (err) {
      console.warn(`[PG BACKUP RETENTION] Error pruning ${toRemove}:`, err.message)
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith('pg-backup.js')) {
  createPostgresBackup()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[PG BACKUP FATAL]:', err)
      process.exit(1)
    })
}
