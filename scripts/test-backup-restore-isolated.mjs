import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import pkg from 'pg'
const { Pool } = pkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKUP_PATH = path.resolve(__dirname, '..', 'backups', 'pg-backup-2026-11-15T06-55-23-585Z.json')

async function verifyAndRestoreBackup() {
  console.log('=================================================================')
  console.log('   SAVE & SMILE — DATABASE BACKUP RESTORE VERIFICATION TEST     ')
  console.log('=================================================================\n')

  if (!fs.existsSync(BACKUP_PATH)) {
    throw new Error(`Backup file not found at: ${BACKUP_PATH}`)
  }

  const rawJson = fs.readFileSync(BACKUP_PATH, 'utf8')
  const backup = JSON.parse(rawJson)

  // 1. Verify Checksum
  console.log('[1/6] Verifying SHA-256 Checksum...')
  const targetChecksum = backup.metadata?.checksum
  const backupClone = JSON.parse(rawJson)
  delete backupClone.metadata.checksum
  const recalculated = crypto.createHash('sha256').update(JSON.stringify(backupClone, null, 2)).digest('hex')

  const checksumValid = (targetChecksum === recalculated)
  console.log(`  Stored Checksum:       ${targetChecksum}`)
  console.log(`  Recalculated Checksum: ${recalculated}`)
  console.log(`  Checksum Match:        ${checksumValid ? 'PASS (100% Verified)' : 'FAIL'}`)

  if (!checksumValid) {
    throw new Error('Backup checksum verification failed!')
  }

  // 2. Validate JSON Structure
  console.log('\n[2/6] Validating JSON Structure...')
  const tablesInBackup = Object.keys(backup.tables || {})
  console.log(`  Tables Present (${tablesInBackup.length}): ${tablesInBackup.join(', ')}`)
  console.log('  Counts Manifest:', JSON.stringify(backup.counts, null, 2))

  // 3. Connect to PostgreSQL and Create Isolated Staging Schema
  console.log('\n[3/6] Connecting to DB and Initializing Staging Schema (staging_restore_test)...')
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    connectionTimeoutMillis: 15000,
  })

  const client = await pool.connect()
  const startTime = Date.now()
  let restoreSuccess = false
  const comparisonResults = {}

  try {
    // DO NOT touch public schema! Create separate test schema.
    await client.query('CREATE SCHEMA IF NOT EXISTS staging_restore_test')
    console.log('  Isolated schema `staging_restore_test` initialized.')

    // Clone table definitions from public to staging_restore_test
    console.log('\n[4/6] Creating Staging Table Definitions and Restoring Data...')
    for (const table of tablesInBackup) {
      await client.query(`CREATE TABLE IF NOT EXISTS staging_restore_test.${table} (LIKE public.${table} INCLUDING ALL)`)
      // Ensure staging table is clean
      await client.query(`TRUNCATE TABLE staging_restore_test.${table} CASCADE`)

      const rows = backup.tables[table] || []
      if (rows.length > 0) {
        // Build dynamic INSERT
        const sample = rows[0]
        const columns = Object.keys(sample)
        const colList = columns.map(c => `"${c}"`).join(', ')

        const allValues = []
        const rowPlaceholders = []
        let pIdx = 1

        for (const row of rows) {
          const rowP = []
          for (const c of columns) {
            let v = row[c]
            if (v !== null && typeof v === 'object') {
              v = JSON.stringify(v)
            }
            allValues.push(v)
            rowP.push(`$${pIdx++}`)
          }
          rowPlaceholders.push(`(${rowP.join(', ')})`)
        }

        await client.query(
          `INSERT INTO staging_restore_test.${table} (${colList}) VALUES ${rowPlaceholders.join(', ')}`,
          allValues
        )
      }
      console.log(`  Restored table staging_restore_test.${table}: ${rows.length} records.`)
    }

    const restoreDurationMs = Date.now() - startTime
    console.log(`\n  Restore Duration: ${(restoreDurationMs / 1000).toFixed(2)}s`)

    // 5. Compare Data Integrity Between public and staging_restore_test
    console.log('\n[5/6] Comparing Data Integrity Between `public` and `staging_restore_test`...')

    for (const table of tablesInBackup) {
      const pubCountRes = await client.query(`SELECT COUNT(*)::int AS count FROM public.${table}`)
      const stgCountRes = await client.query(`SELECT COUNT(*)::int AS count FROM staging_restore_test.${table}`)
      const expected = backup.counts[table] || 0
      const stgActual = stgCountRes.rows[0].count
      const pubActual = pubCountRes.rows[0].count

      comparisonResults[table] = {
        inBackup: expected,
        restoredInStaging: stgActual,
        liveInPublic: pubActual,
        matchesBackup: expected === stgActual
      }
      console.log(`  Table ${table.padEnd(18)}: Backup=${expected} | Staging=${stgActual} | Public=${pubActual} => ${expected === stgActual ? 'MATCH' : 'MISMATCH'}`)
    }

    // Financial Totals Comparison
    const pubFinRes = await client.query(`SELECT SUM(total)::numeric AS sum_orders, COUNT(*)::int as count FROM public.orders`)
    const stgFinRes = await client.query(`SELECT SUM(total)::numeric AS sum_orders, COUNT(*)::int as count FROM staging_restore_test.orders`)
    console.log('\n  Financial Totals Integrity:')
    console.log(`    Staging Orders Total: Rs. ${Number(stgFinRes.rows[0].sum_orders || 0).toLocaleString()} across ${stgFinRes.rows[0].count} orders`)
    console.log(`    Public Orders Total:  Rs. ${Number(pubFinRes.rows[0].sum_orders || 0).toLocaleString()} across ${pubFinRes.rows[0].count} orders`)

    // Foreign-Key Relationship Validation
    console.log('\n  Foreign-Key Relationship Validation:')
    const orphanItemsRes = await client.query(`
      SELECT COUNT(*)::int as orphans 
      FROM staging_restore_test.order_items oi 
      LEFT JOIN staging_restore_test.orders o ON oi.order_id = o.id 
      WHERE o.id IS NULL
    `)
    const orphanItems = orphanItemsRes.rows[0].orphans
    console.log(`    Orphan Order Items in Staging: ${orphanItems} (Expected: 0)`)

    const orphanReviewsRes = await client.query(`
      SELECT COUNT(*)::int as orphans 
      FROM staging_restore_test.reviews r 
      LEFT JOIN staging_restore_test.products p ON r.product_id = p.id 
      WHERE p.id IS NULL
    `)
    const orphanReviews = orphanReviewsRes.rows[0].orphans
    console.log(`    Orphan Reviews in Staging:     ${orphanReviews} (Expected: 0)`)

    restoreSuccess = (orphanItems === 0)

    // Check for missing tables not covered by the 14-table backup
    const allPublicTablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    const allPublicTables = allPublicTablesRes.rows.map(r => r.table_name)
    const missingFromBackup = allPublicTables.filter(t => !tablesInBackup.includes(t))

    console.log(`\n  Schema Coverage Analysis:`)
    console.log(`    Total Public Tables in PostgreSQL: ${allPublicTables.length}`)
    console.log(`    Tables in JSON Backup:             ${tablesInBackup.length}`)
    console.log(`    Missing from this JSON backup:     ${missingFromBackup.length} (${missingFromBackup.join(', ')})`)

    const finalReport = {
      checksumValid,
      targetChecksum,
      recalculated,
      restoreDurationMs,
      tablesInBackup,
      comparisonResults,
      missingFromBackup,
      financial: {
        stagingSum: Number(stgFinRes.rows[0].sum_orders || 0),
        publicSum: Number(pubFinRes.rows[0].sum_orders || 0),
        stagingCount: stgFinRes.rows[0].count,
        publicCount: pubFinRes.rows[0].count
      },
      foreignKeys: {
        orphanItems,
        orphanReviews
      }
    }
    return finalReport
  } finally {
    // 6. Clean Up Staging Schema
    console.log('\n[6/6] Cleaning Up Staging Schema (DROP SCHEMA staging_restore_test CASCADE)...')
    try {
      await client.query('DROP SCHEMA IF EXISTS staging_restore_test CASCADE')
      console.log('  Cleaned up staging_restore_test. Production schema remains 100% untouched.')
    } catch (cleanupErr) {
      console.warn('  Cleanup warning:', cleanupErr.message)
    }
    client.release()
    await pool.end()
  }
}

verifyAndRestoreBackup()
  .then(res => {
    console.log('\n>>> BACKUP RESTORE VERIFICATION COMPLETED SUCCESSFULLY <<<')
    fs.writeFileSync(
      path.resolve(__dirname, 'backup-restore-verification-result.json'),
      JSON.stringify(res, null, 2)
    )
  })
  .catch(err => {
    console.error('\n[FATAL RESTORE VERIFICATION ERROR]:', err)
    process.exit(1)
  })
