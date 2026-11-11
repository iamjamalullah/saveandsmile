import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'db.json')
const BACKUP_DIR = path.join(__dirname, 'backups')

export function restoreBackup(specificFile = null) {
  if (!fs.existsSync(BACKUP_DIR)) {
    throw new Error('No backups directory found.')
  }

  let targetBackup = specificFile
  if (!targetBackup) {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
    if (!files.length) {
      throw new Error('No backup snapshots available to restore.')
    }
    targetBackup = files[files.length - 1] // Latest backup
  }

  const backupPath = path.isAbsolute(targetBackup) ? targetBackup : path.join(BACKUP_DIR, targetBackup)
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Specified backup does not exist: ${backupPath}`)
  }

  // Validate integrity before restoration
  const raw = fs.readFileSync(backupPath, 'utf8')
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new Error(`Backup file is corrupted JSON: ${err.message}`)
  }

  if (!parsed.products || !parsed.orders) {
    throw new Error('Backup is missing required collections.')
  }

  // Atomic restore
  const tmpPath = `${DB_PATH}.restore.tmp`
  fs.writeFileSync(tmpPath, JSON.stringify(parsed, null, 2), 'utf8')
  fs.renameSync(tmpPath, DB_PATH)

  console.log(`[RESTORE] Successfully restored database from: ${path.basename(backupPath)}`)
  console.log(`[RESTORE] Products: ${parsed.products.length} | Orders: ${parsed.orders.length}`)
  return true
}

if (process.argv[1] && process.argv[1].endsWith('restore.js')) {
  try {
    const fileArg = process.argv[2] || null
    restoreBackup(fileArg)
  } catch (err) {
    console.error('[RESTORE ERROR]:', err.message)
    process.exit(1)
  }
}
