import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'db.json')
const BACKUP_DIR = path.join(__dirname, 'backups')

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

export function createBackup() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database file not found at ${DB_PATH}`)
  }

  // Verify integrity before creating backup
  const raw = fs.readFileSync(DB_PATH, 'utf8')
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new Error(`Database file is corrupt JSON! Refusing to backup invalid file: ${err.message}`)
  }

  if (!parsed.products || !parsed.orders || !parsed.categories) {
    throw new Error('Database schema check failed: Missing primary collections.')
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `db-backup-${timestamp}.json`
  const destination = path.join(BACKUP_DIR, filename)

  fs.copyFileSync(DB_PATH, destination)
  console.log(`[BACKUP] Successfully created database backup: ${filename}`)
  console.log(`[BACKUP] Total products: ${parsed.products.length} | Orders: ${parsed.orders.length} | Categories: ${parsed.categories.length}`)

  // Prune to keep last 30 backups
  const existing = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('db-backup-') || f.startsWith('db-snapshot-'))
    .sort()

  while (existing.length > 30) {
    const toRemove = existing.shift()
    fs.unlinkSync(path.join(BACKUP_DIR, toRemove))
    console.log(`[BACKUP] Pruned older backup: ${toRemove}`)
  }

  return destination
}

if (process.argv[1] && process.argv[1].endsWith('backup.js')) {
  try {
    createBackup()
  } catch (err) {
    console.error('[BACKUP ERROR]:', err.message)
    process.exit(1)
  }
}
