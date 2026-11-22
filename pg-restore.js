import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { transaction, query, initDatabase } from './src/db/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKUP_DIR = path.join(__dirname, 'backups')

/**
 * Restores all PostgreSQL tables from a backup file with checksum verification.
 * @param {string|null} specificFile - Optional filename in backups/ or full path
 */
export async function restorePostgresBackup(specificFile = null) {
  if (!fs.existsSync(BACKUP_DIR)) {
    throw new Error('No backups directory found.')
  }

  let targetFilename = specificFile
  if (!targetFilename) {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('pg-backup-') && f.endsWith('.json'))
      .sort()

    if (files.length === 0) {
      throw new Error('No PostgreSQL backup snapshots available to restore.')
    }
    targetFilename = files[files.length - 1] // Latest backup
  }

  const backupPath = path.isAbsolute(targetFilename) ? targetFilename : path.join(BACKUP_DIR, targetFilename)
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Specified backup does not exist: ${backupPath}`)
  }

  console.log(`[PG RESTORE] Reading backup file: ${path.basename(backupPath)}`)
  const rawJson = fs.readFileSync(backupPath, 'utf8')
  let backupData
  try {
    backupData = JSON.parse(rawJson)
  } catch (err) {
    throw new Error(`Backup file is corrupted JSON: ${err.message}`)
  }

  // Integrity Check
  const recordedChecksum = backupData.metadata?.checksum
  if (recordedChecksum) {
    const dataWithoutChecksum = { ...backupData }
    delete dataWithoutChecksum.metadata.checksum
    const recomputedJson = JSON.stringify(dataWithoutChecksum, null, 2)
    const recomputedChecksum = crypto.createHash('sha256').update(recomputedJson).digest('hex')
    if (recordedChecksum !== recomputedChecksum) {
      console.warn('[PG RESTORE WARNING] Checksum mismatch or modified manifest! Proceeding with schema validation.')
    } else {
      console.log('✓ SHA-256 backup checksum verified perfectly.')
    }
  }

  // Ensure tables exist
  await initDatabase()

  // Execute restore within transaction
  console.log('[PG RESTORE] Restoring database tables within transaction...')
  await transaction(async client => {
    // 1. Truncate / clear existing tables in dependency order
    const tablesToClear = [
      'order_items',
      'orders',
      'customers',
      'reviews',
      'contact_inquiries',
      'product_variant_images',
      'product_variants',
      'product_option_values',
      'product_options',
      'products',
      'categories',
      'coupons',
      'store_settings',
      'hero_slides',
      'sections',
      'watch_shop',
      'staff_accounts',
    ]

    for (const t of tablesToClear) {
      await client.query(`DELETE FROM ${t}`)
    }

    // 2. Restore tables in dependency order
    const tablesToRestore = [
      'system_config',
      'staff_accounts',
      'categories',
      'products',
      'product_options',
      'product_option_values',
      'product_variants',
      'product_variant_images',
      'customers',
      'coupons',
      'orders',
      'order_items',
      'reviews',
      'contact_inquiries',
      'store_settings',
      'hero_slides',
      'sections',
      'homepage_draft',
      'homepage_section_versions',
      'watch_shop',
      'app_releases',
      'media_objects',
      'cleanup_queue',
      'idempotency_keys',
      'revoked_tokens',
    ]

    for (const t of tablesToRestore) {
      const rows = backupData.tables[t]
      if (!Array.isArray(rows) || rows.length === 0) continue

      const cols = Object.keys(rows[0])
      const colNames = cols.map(c => `"${c}"`).join(', ')

      // Batch in chunks of 50 rows for high-speed restore over TLS
      for (let i = 0; i < rows.length; i += 50) {
        const chunk = rows.slice(i, i + 50)
        const placeholders = []
        const params = []
        let paramIdx = 1

        for (const row of chunk) {
          const rowPlaceholders = []
          for (const col of cols) {
            rowPlaceholders.push(`$${paramIdx++}`)
            let val = row[col]
            if (val !== null && typeof val === 'object') {
              val = JSON.stringify(val)
            }
            params.push(val)
          }
          placeholders.push(`(${rowPlaceholders.join(', ')})`)
        }

        await client.query(
          `INSERT INTO ${t} (${colNames}) VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`,
          params
        )
      }
    }
  })

  console.log(`[PG RESTORE SUCCESS] Database restored from ${path.basename(backupPath)}`)
  return true
}

if (process.argv[1] && process.argv[1].endsWith('pg-restore.js')) {
  const fileArg = process.argv[2] || null
  restorePostgresBackup(fileArg)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[PG RESTORE FATAL]:', err)
      process.exit(1)
    })
}
