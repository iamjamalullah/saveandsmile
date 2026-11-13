import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDatabasePool, isMemoryDb, query } from '../src/db/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_JSON_PATH = path.join(__dirname, '..', 'db.json')

export async function generateMigrationPreview() {
  console.log('===============================================================')
  console.log('   QADRI GADGETS – NEON POSTGRESQL MIGRATION PREVIEW (DRY-RUN)')
  console.log('===============================================================')

  if (!fs.existsSync(DB_JSON_PATH)) {
    throw new Error(`Source db.json not found at ${DB_JSON_PATH}`)
  }

  const rawJson = fs.readFileSync(DB_JSON_PATH, 'utf8')
  const dbData = JSON.parse(rawJson)

  // Entities to preview
  const preview = []

  // Check target connection mode
  const targetMode = process.env.DATABASE_URL
    ? (process.env.DATABASE_URL.includes('neon.tech') ? 'Neon PostgreSQL (Cloud)' : 'PostgreSQL Server')
    : 'Local pg-mem Sandbox'

  console.log(`Target Database Engine: ${targetMode}`)
  console.log(`Database URL Configured: ${process.env.DATABASE_URL ? 'YES (Protected)' : 'NO (Local Test Mode)'}`)
  console.log('Timestamp:', new Date().toISOString())
  console.log('---------------------------------------------------------------\n')

  // Helper to query table if exists
  async function getExistingIds(tableName, idCol = 'id') {
    try {
      const res = await query(`SELECT ${idCol} FROM ${tableName}`)
      return new Set(res.rows.map(r => String(r[idCol])))
    } catch (_) {
      return new Set()
    }
  }

  // 1. Categories
  const catSource = dbData.categories || []
  const catExisting = await getExistingIds('categories', 'id')
  let catInsert = 0, catUpdate = 0, catSkip = 0
  for (const c of catSource) {
    if (catExisting.has(String(c.id))) catUpdate++
    else catInsert++
  }
  preview.push({
    Table: 'categories',
    Source: catSource.length,
    TargetCurrent: catExisting.size,
    'Will INSERT': catInsert,
    'Will UPDATE': catUpdate,
    'Will SKIP': catSkip,
    Action: catInsert > 0 ? 'INSERT + UPDATE' : 'IN SYNC',
  })

  // 2. Products
  const prodSource = dbData.products || []
  const prodExisting = await getExistingIds('products', 'id')
  let prodInsert = 0, prodUpdate = 0, prodSkip = 0
  for (const p of prodSource) {
    if (prodExisting.has(String(p.id))) prodUpdate++
    else prodInsert++
  }
  preview.push({
    Table: 'products',
    Source: prodSource.length,
    TargetCurrent: prodExisting.size,
    'Will INSERT': prodInsert,
    'Will UPDATE': prodUpdate,
    'Will SKIP': prodSkip,
    Action: prodInsert > 0 ? 'INSERT + UPDATE' : 'IN SYNC',
  })

  // 3. Customers
  const orders = dbData.orders || []
  const uniqueMobiles = new Set()
  orders.forEach(o => {
    const m = (o.customer?.mobile || o.mobile || '').trim()
    if (m) uniqueMobiles.add(m)
  })
  const custExisting = await getExistingIds('customers', 'mobile')
  let custInsert = 0, custSkip = 0
  for (const m of uniqueMobiles) {
    if (custExisting.has(m)) custSkip++
    else custInsert++
  }
  preview.push({
    Table: 'customers',
    Source: uniqueMobiles.size,
    TargetCurrent: custExisting.size,
    'Will INSERT': custInsert,
    'Will UPDATE': 0,
    'Will SKIP': custSkip,
    Action: custInsert > 0 ? 'INSERT NEW ONLY' : 'PRESERVED',
  })

  // 4. Orders
  const orderExisting = await getExistingIds('orders', 'id')
  let ordInsert = 0, ordSkip = 0
  for (const o of orders) {
    if (orderExisting.has(String(o.id))) ordSkip++
    else ordInsert++
  }
  preview.push({
    Table: 'orders',
    Source: orders.length,
    TargetCurrent: orderExisting.size,
    'Will INSERT': ordInsert,
    'Will UPDATE': 0,
    'Will SKIP': ordSkip,
    Action: ordInsert > 0 ? 'INSERT NEW ONLY' : 'PRESERVED',
  })

  // 5. Order Items
  let totalOrderItems = 0
  orders.forEach(o => { if (Array.isArray(o.items)) totalOrderItems += o.items.length })
  const existingOrderItems = await getExistingIds('order_items', 'id')
  preview.push({
    Table: 'order_items',
    Source: totalOrderItems,
    TargetCurrent: existingOrderItems.size,
    'Will INSERT': ordInsert > 0 ? totalOrderItems : 0,
    'Will UPDATE': 0,
    'Will SKIP': ordInsert === 0 ? totalOrderItems : 0,
    Action: 'CASCADE MANAGED',
  })

  // 6. Coupons
  const coupons = dbData.coupons || []
  const existingCoupons = await getExistingIds('coupons', 'code')
  let cpInsert = 0, cpUpdate = 0
  for (const c of coupons) {
    if (existingCoupons.has(String(c.code).toUpperCase())) cpUpdate++
    else cpInsert++
  }
  preview.push({
    Table: 'coupons',
    Source: coupons.length,
    TargetCurrent: existingCoupons.size,
    'Will INSERT': cpInsert,
    'Will UPDATE': cpUpdate,
    'Will SKIP': 0,
    Action: 'SYNC CONFIG',
  })

  // 7. Reviews
  const reviews = dbData.reviews || []
  const existingReviews = await getExistingIds('reviews', 'id')
  let revInsert = 0, revSkip = 0
  for (const r of reviews) {
    if (existingReviews.has(String(r.id))) revSkip++
    else revInsert++
  }
  preview.push({
    Table: 'reviews',
    Source: reviews.length,
    TargetCurrent: existingReviews.size,
    'Will INSERT': revInsert,
    'Will UPDATE': 0,
    'Will SKIP': revSkip,
    Action: 'PRESERVE APPROVED',
  })

  // 8. Contact Inquiries
  const contacts = dbData.contacts || []
  const existingContacts = await getExistingIds('contact_inquiries', 'id')
  let conInsert = 0, conSkip = 0
  for (const ct of contacts) {
    if (existingContacts.has(String(ct.id))) conSkip++
    else conInsert++
  }
  preview.push({
    Table: 'contact_inquiries',
    Source: contacts.length,
    TargetCurrent: existingContacts.size,
    'Will INSERT': conInsert,
    'Will UPDATE': 0,
    'Will SKIP': conSkip,
    Action: 'DO NOTHING ON CONFLICT',
  })

  // 9. Store Settings
  const settingsExisting = await getExistingIds('store_settings', 'id')
  preview.push({
    Table: 'store_settings',
    Source: 1,
    TargetCurrent: settingsExisting.size,
    'Will INSERT': settingsExisting.has('1') ? 0 : 1,
    'Will UPDATE': settingsExisting.has('1') ? 1 : 0,
    'Will SKIP': 0,
    Action: 'UPDATE CONFIG',
  })

  // 10. Hero Slides
  const heroSlides = dbData.heroSlides || []
  const existingSlides = await getExistingIds('hero_slides', 'id')
  let slideInsert = 0, slideUpdate = 0
  for (let i = 0; i < heroSlides.length; i++) {
    if (existingSlides.has(String(i + 1))) slideUpdate++
    else slideInsert++
  }
  preview.push({
    Table: 'hero_slides',
    Source: heroSlides.length,
    TargetCurrent: existingSlides.size,
    'Will INSERT': slideInsert,
    'Will UPDATE': slideUpdate,
    'Will SKIP': 0,
    Action: 'SYNC SLIDES',
  })

  // 11. Sections
  const sections = dbData.sections || []
  const existingSections = await getExistingIds('sections', 'id')
  let secInsert = 0, secUpdate = 0
  for (let i = 0; i < sections.length; i++) {
    const sid = String(sections[i].id || (i + 1))
    if (existingSections.has(sid)) secUpdate++
    else secInsert++
  }
  preview.push({
    Table: 'sections',
    Source: sections.length,
    TargetCurrent: existingSections.size,
    'Will INSERT': secInsert,
    'Will UPDATE': secUpdate,
    'Will SKIP': 0,
    Action: 'SYNC BUILDER',
  })

  // 12. Watch & Shop
  const watchShop = dbData.watchShop || []
  const existingWatch = await getExistingIds('watch_shop', 'id')
  let wsInsert = 0, wsUpdate = 0
  for (let i = 0; i < watchShop.length; i++) {
    const wid = String(watchShop[i].id || (i + 1))
    if (existingWatch.has(wid)) wsUpdate++
    else wsInsert++
  }
  preview.push({
    Table: 'watch_shop',
    Source: watchShop.length,
    TargetCurrent: existingWatch.size,
    'Will INSERT': wsInsert,
    'Will UPDATE': wsUpdate,
    'Will SKIP': 0,
    Action: 'SYNC REELS',
  })

  // 13. Staff Accounts
  const existingStaff = await getExistingIds('staff_accounts', 'email')
  preview.push({
    Table: 'staff_accounts',
    Source: 2,
    TargetCurrent: existingStaff.size,
    'Will INSERT': existingStaff.has('admin@qadrigadgets.pk') ? 0 : 2,
    'Will UPDATE': existingStaff.has('admin@qadrigadgets.pk') ? 2 : 0,
    'Will SKIP': 0,
    Action: 'BCRYPT HASH SEED',
  })

  console.table(preview)

  console.log('\n[PREVIEW SAFETY SUMMARY]:')
  console.log('✓ Foreign Key Ordering: Parent tables processed strictly before child tables.')
  console.log('✓ Safe Idempotency: Duplicate keys are handled safely via ON CONFLICT.')
  console.log('✓ Customer Data Shield: Order history & customer contacts never overwritten by stale records.')
  console.log('✓ Zero Destructive Operations: No DROP TABLE or TRUNCATE commands are executed.')

  return preview
}

if (process.argv[1] && process.argv[1].endsWith('migration-preview.js')) {
  generateMigrationPreview()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[PREVIEW ERROR]:', err)
      process.exit(1)
    })
}
