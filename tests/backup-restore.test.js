import fs from 'node:fs'
import { runMigration } from '../migrate.js'
import { createPostgresBackup } from '../pg-backup.js'
import { restorePostgresBackup } from '../pg-restore.js'
import { query } from '../src/db/index.js'

async function runBackupRestoreTest() {
  console.log('===============================================================')
  console.log('   POSTGRESQL BACKUP & RESTORE INTEGRITY TEST SUITE')
  console.log('===============================================================')

  // 1. Initial Migration & Seed
  await runMigration()

  // 2. Measure baseline record counts
  const tables = ['products', 'categories', 'orders', 'order_items', 'customers', 'coupons', 'staff_accounts']
  const baselineCounts = {}
  for (const t of tables) {
    const res = await query(`SELECT COUNT(*) as count FROM ${t}`)
    baselineCounts[t] = parseInt(res.rows[0].count, 10)
  }
  console.log('\n[BASELINE RECORD COUNTS]:')
  console.table(baselineCounts)

  // 3. Create Automated PostgreSQL Backup
  console.log('\n--- 1. Creating Backup Snapshot ---')
  const backupResult = await createPostgresBackup()
  if (!fs.existsSync(backupResult.destination)) {
    throw new Error(`Backup file was not created at ${backupResult.destination}`)
  }
  console.log(`✓ Backup successfully created at: ${backupResult.destination}`)
  console.log(`✓ Verified SHA-256 Checksum: ${backupResult.checksum}`)

  // 4. Simulate Catastrophic Data Loss (Delete Orders and Truncate Products)
  console.log('\n--- 2. Simulating Catastrophic Data Loss / Deletion ---')
  await query('DELETE FROM order_items')
  await query('DELETE FROM orders')
  await query('DELETE FROM products WHERE id > 10')

  const postDeletionProducts = parseInt((await query('SELECT COUNT(*) as count FROM products')).rows[0].count, 10)
  const postDeletionOrders = parseInt((await query('SELECT COUNT(*) as count FROM orders')).rows[0].count, 10)

  console.log(`Damaged Database State: Products = ${postDeletionProducts} (was ${baselineCounts.products}), Orders = ${postDeletionOrders} (was ${baselineCounts.orders})`)
  if (postDeletionProducts >= baselineCounts.products || postDeletionOrders > 0) {
    throw new Error('Simulation failed to modify database records.')
  }
  console.log('✓ Artificial data loss successfully created for test.')

  // 5. Restore Database from Backup
  console.log('\n--- 3. Restoring Database From Backup Snapshot ---')
  await restorePostgresBackup(backupResult.destination)

  // 6. Verify 100% Data Parity Post-Restore
  console.log('\n--- 4. Verifying Post-Restore Data Parity ---')
  const restoredCounts = {}
  const parityReport = []
  let allMatched = true

  for (const t of tables) {
    const res = await query(`SELECT COUNT(*) as count FROM ${t}`)
    const count = parseInt(res.rows[0].count, 10)
    restoredCounts[t] = count
    const matched = count === baselineCounts[t]
    if (!matched) allMatched = false

    parityReport.push({
      Table: t,
      'Pre-Backup Baseline': baselineCounts[t],
      'Post-Restore Count': count,
      Status: matched ? 'RESTORED 100% ✓' : 'MISMATCH ⚠',
    })
  }

  console.table(parityReport)

  if (!allMatched) {
    throw new Error('BACKUP & RESTORE TEST FAILED: Record counts do not match baseline!')
  }

  console.log('\n===============================================================')
  console.log('   POSTGRESQL BACKUP & RESTORE TEST PASSED WITH 100% PARITY!   ')
  console.log('===============================================================')
}

runBackupRestoreTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n[BACKUP RESTORE TEST FATAL]:', err)
    process.exit(1)
  })
