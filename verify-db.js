import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'db.json')

export function verifyDatabaseIntegrity() {
  if (!fs.existsSync(DB_PATH)) {
    return { valid: false, error: 'db.json does not exist' }
  }

  let db
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    db = JSON.parse(raw)
  } catch (err) {
    return { valid: false, error: `Invalid JSON format: ${err.message}` }
  }

  const requiredCollections = ['products', 'categories', 'orders', 'coupons', 'settings', 'reviews', 'contacts']
  const missing = requiredCollections.filter(c => !Array.isArray(db[c]))
  if (missing.length) {
    return { valid: false, error: `Missing required collections: ${missing.join(', ')}` }
  }

  // Verify Products
  for (const p of db.products) {
    if (!p.id || !p.name || typeof p.price !== 'number' || typeof p.stock !== 'number') {
      return { valid: false, error: `Corrupt product record detected: ID #${p?.id}` }
    }
  }

  // Verify Orders
  for (const o of db.orders) {
    if (!o.id || !o.customer || typeof o.total !== 'number') {
      return { valid: false, error: `Corrupt order record detected: ID #${o?.id}` }
    }
  }

  return {
    valid: true,
    stats: {
      productsCount: db.products.length,
      categoriesCount: db.categories.length,
      ordersCount: db.orders.length,
      couponsCount: db.coupons.length,
      reviewsCount: db.reviews.length,
      contactsCount: db.contacts.length,
      fileSizeBytes: fs.statSync(DB_PATH).size,
    },
  }
}

if (process.argv[1] && process.argv[1].endsWith('verify-db.js')) {
  const result = verifyDatabaseIntegrity()
  if (result.valid) {
    console.log('[INTEGRITY CHECK PASSED]: Database structure is healthy.')
    console.table(result.stats)
  } else {
    console.error('[INTEGRITY CHECK FAILED]:', result.error)
    process.exit(1)
  }
}
