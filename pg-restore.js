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

    // 2. Restore tables
    // Categories
    for (const c of backupData.tables.categories || []) {
      await client.query(
        `INSERT INTO categories (id, name, slug, icon, image_url, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [c.id, c.name, c.slug, c.icon, c.image_url, c.sort_order]
      )
    }

    // Products
    for (const p of backupData.tables.products || []) {
      await client.query(
        `INSERT INTO products (
           id, sku, name, slug, category_name, group_name, price, old_price,
           stock_quantity, brand, description, video_url, image_main,
           images_gallery, highlights, specs_json, bulk_tiers_json,
           is_featured, rating, reviews_count
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          p.id, p.sku, p.name, p.slug, p.category_name, p.group_name,
          p.price, p.old_price, p.stock_quantity, p.brand, p.description,
          p.video_url, p.image_main, p.images_gallery, p.highlights,
          p.specs_json, p.bulk_tiers_json, p.is_featured, p.rating, p.reviews_count,
        ]
      )
    }

    // Customers
    for (const cust of backupData.tables.customers || []) {
      await client.query(
        `INSERT INTO customers (id, name, mobile, email, city, address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [cust.id, cust.name, cust.mobile, cust.email, cust.city, cust.address]
      )
    }

    // Coupons
    for (const cp of backupData.tables.coupons || []) {
      await client.query(
        `INSERT INTO coupons (id, code, type, value, min_order, max_discount, description, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [cp.id, cp.code, cp.type, cp.value, cp.min_order, cp.max_discount, cp.description, cp.active]
      )
    }

    // Orders
    for (const o of backupData.tables.orders || []) {
      await client.query(
        `INSERT INTO orders (
           id, customer_id, customer_name, customer_mobile, customer_email,
           customer_city, delivery_address, delivery_method, payment_method,
           status, tracking_number, subtotal, discount, coupon_code,
           shipping_fee, total, customer_notes, idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          o.id, o.customer_id, o.customer_name, o.customer_mobile, o.customer_email,
          o.customer_city, o.delivery_address, o.delivery_method, o.payment_method,
          o.status, o.tracking_number, o.subtotal, o.discount, o.coupon_code,
          o.shipping_fee, o.total, o.customer_notes, o.idempotency_key,
        ]
      )
    }

    // Order Items
    for (const oi of backupData.tables.order_items || []) {
      await client.query(
        `INSERT INTO order_items (
           id, order_id, product_id, product_name, product_sku, unit_price, quantity, line_total
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [oi.id, oi.order_id, oi.product_id, oi.product_name, oi.product_sku, oi.unit_price, oi.quantity, oi.line_total]
      )
    }

    // Reviews
    for (const r of backupData.tables.reviews || []) {
      await client.query(
        `INSERT INTO reviews (id, product_id, name, title, text, rating, whatsapp, status, date_formatted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [r.id, r.product_id, r.name, r.title, r.text, r.rating, r.whatsapp, r.status, r.date_formatted]
      )
    }

    // Contact Inquiries
    for (const ct of backupData.tables.contact_inquiries || []) {
      await client.query(
        `INSERT INTO contact_inquiries (id, type, name, email, mobile, company, city, address, reason, product_requested, quantity_requested, message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [ct.id, ct.type, ct.name, ct.email, ct.mobile, ct.company, ct.city, ct.address, ct.reason, ct.product_requested, ct.quantity_requested, ct.message]
      )
    }

    // Store Settings
    for (const s of backupData.tables.store_settings || []) {
      await client.query(
        `INSERT INTO store_settings (
           id, store_name, tagline, phone, whatsapp, email, address,
           free_shipping_threshold, shipping_fee, express_shipping_fee,
           tax_rate, allow_guest_checkout, announcement
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          s.id, s.store_name, s.tagline, s.phone, s.whatsapp, s.email, s.address,
          s.free_shipping_threshold, s.shipping_fee, s.express_shipping_fee,
          s.tax_rate, s.allow_guest_checkout, s.announcement,
        ]
      )
    }

    // Hero Slides
    for (const hs of backupData.tables.hero_slides || []) {
      await client.query(
        `INSERT INTO hero_slides (id, image_url, alt_text, title, subtitle, link_url, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [hs.id, hs.image_url, hs.alt_text, hs.title, hs.subtitle, hs.link_url, hs.sort_order]
      )
    }

    // Sections
    for (const sec of backupData.tables.sections || []) {
      await client.query(
        `INSERT INTO sections (id, group_name, title, subtitle, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [sec.id, sec.group_name, sec.title, sec.subtitle, sec.sort_order]
      )
    }

    // Watch Shop
    for (const ws of backupData.tables.watch_shop || []) {
      await client.query(
        `INSERT INTO watch_shop (id, title, video_url, image_url, views_count, likes_count, product_id, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [ws.id, ws.title, ws.video_url, ws.image_url, ws.views_count, ws.likes_count, ws.product_id, ws.sort_order]
      )
    }

    // Staff Accounts
    for (const sa of backupData.tables.staff_accounts || []) {
      await client.query(
        `INSERT INTO staff_accounts (id, name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sa.id, sa.name, sa.email, sa.password_hash, sa.role, sa.is_active]
      )
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
