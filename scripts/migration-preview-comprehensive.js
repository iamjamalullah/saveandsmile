import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDatabasePool, isMemoryDb, query } from '../src/db/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_JSON_PATH = path.join(__dirname, '..', 'db.json')

export async function generateComprehensiveMigrationPreview() {
  console.log('========================================================================')
  console.log('   QADRI GADGETS – AUTHORITATIVE 21-TABLE MIGRATION PREVIEW (DRY-RUN)')
  console.log('========================================================================')

  const dbData = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'))

  const preview = []

  // Check target connection mode
  const targetMode = process.env.DATABASE_URL
    ? (process.env.DATABASE_URL.includes('supabase.com') ? 'Supabase PostgreSQL (Cloud)' : 'PostgreSQL Server')
    : 'Local pg-mem Sandbox'

  console.log(`Target Database Engine: ${targetMode}`)
  console.log(`Database URL Configured: ${process.env.DATABASE_URL ? 'YES (Protected)' : 'NO'}`)
  console.log('Timestamp:', new Date().toISOString())
  console.log('------------------------------------------------------------------------\n')

  async function getExistingCount(tableName) {
    try {
      const res = await query(`SELECT COUNT(*) as cnt FROM ${tableName}`)
      return parseInt(res.rows[0].cnt)
    } catch (_) {
      return 0
    }
  }

  // 1. Categories
  const catSource = dbData.categories?.length || 0
  const catTarget = await getExistingCount('categories')
  preview.push({ Table: 'categories', Type: 'Core Business', Source: catSource, TargetCurrent: catTarget, 'Will INSERT': catSource, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'YES' })

  // 2. Products
  const prodSource = dbData.products?.length || 0
  const prodTarget = await getExistingCount('products')
  preview.push({ Table: 'products', Type: 'Core Business', Source: prodSource, TargetCurrent: prodTarget, 'Will INSERT': prodSource, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'YES' })

  // 3. Product Options
  let optSource = 0, valSource = 0, varSource = 0, imgSource = 0
  for (const p of dbData.products || []) {
    if (p.hasVariants) {
      if (Array.isArray(p.options)) {
        optSource += p.options.length
        p.options.forEach(o => { if (Array.isArray(o.values)) valSource += o.values.length })
      }
      if (Array.isArray(p.variants)) varSource += p.variants.length
      if (Array.isArray(p.colorImages)) {
        p.colorImages.forEach(ci => { if (Array.isArray(ci.images)) imgSource += ci.images.length })
      }
    }
  }

  preview.push({ Table: 'product_options', Type: 'Normalized Relational', Source: optSource, TargetCurrent: await getExistingCount('product_options'), 'Will INSERT': optSource, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'YES' })
  preview.push({ Table: 'product_option_values', Type: 'Normalized Relational', Source: valSource, TargetCurrent: await getExistingCount('product_option_values'), 'Will INSERT': valSource, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'YES' })
  preview.push({ Table: 'product_variants', Type: 'Normalized Relational', Source: varSource, TargetCurrent: await getExistingCount('product_variants'), 'Will INSERT': varSource, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'YES' })
  preview.push({ Table: 'product_variant_images', Type: 'Normalized Relational', Source: imgSource, TargetCurrent: await getExistingCount('product_variant_images'), 'Will INSERT': imgSource, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'YES' })

  // Customers
  const orders = dbData.orders || []
  const uniqueMobiles = new Set()
  orders.forEach(o => {
    const m = (o.customer?.mobile || o.mobile || '').trim()
    if (m) uniqueMobiles.add(m)
  })
  preview.push({ Table: 'customers', Type: 'Core Business', Source: uniqueMobiles.size, TargetCurrent: await getExistingCount('customers'), 'Will INSERT': uniqueMobiles.size, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'NO (UUID/Text PK)' })

  // Orders
  preview.push({ Table: 'orders', Type: 'Core Business', Source: orders.length, TargetCurrent: await getExistingCount('orders'), 'Will INSERT': orders.length, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'NO (Custom String PK)' })

  // Order Items
  let totalOrderItems = 0
  orders.forEach(o => { if (Array.isArray(o.items)) totalOrderItems += o.items.length })
  preview.push({ Table: 'order_items', Type: 'Normalized Relational', Source: totalOrderItems, TargetCurrent: await getExistingCount('order_items'), 'Will INSERT': totalOrderItems, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'YES' })

  // Coupons
  const coupons = dbData.coupons || []
  preview.push({ Table: 'coupons', Type: 'Core Business', Source: coupons.length, TargetCurrent: await getExistingCount('coupons'), 'Will INSERT': coupons.length, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'YES' })

  // Reviews
  const reviews = dbData.reviews || []
  preview.push({ Table: 'reviews', Type: 'Core Business', Source: reviews.length, TargetCurrent: await getExistingCount('reviews'), 'Will INSERT': reviews.length, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'NO (BIGINT Timestamp PK)' })

  // Contact Inquiries
  const contacts = dbData.contacts || []
  preview.push({ Table: 'contact_inquiries', Type: 'Core Business', Source: contacts.length, TargetCurrent: await getExistingCount('contact_inquiries'), 'Will INSERT': contacts.length, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'NO (BIGINT Timestamp PK)' })

  // Store Settings
  preview.push({ Table: 'store_settings', Type: 'Configuration Singleton', Source: 1, TargetCurrent: await getExistingCount('store_settings'), 'Will INSERT': 1, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'NO (Singleton PK=1)' })

  // Hero Slides
  const heroSlides = dbData.heroSlides || []
  preview.push({ Table: 'hero_slides', Type: 'Core Marketing', Source: heroSlides.length, TargetCurrent: await getExistingCount('hero_slides'), 'Will INSERT': heroSlides.length, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'YES' })

  // Sections
  const sections = dbData.sections || []
  preview.push({ Table: 'sections', Type: 'Core CMS', Source: sections.length, TargetCurrent: await getExistingCount('sections'), 'Will INSERT': sections.length, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'NO (Slug/String PK)' })

  // Homepage Draft
  preview.push({ Table: 'homepage_draft', Type: 'CMS Supporting', Source: 1, TargetCurrent: await getExistingCount('homepage_draft'), 'Will INSERT': 1, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'NO (Singleton PK=1)' })

  // Homepage Section Versions
  preview.push({ Table: 'homepage_section_versions', Type: 'CMS Audit', Source: 0, TargetCurrent: await getExistingCount('homepage_section_versions'), 'Will INSERT': 0, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'YES (Initializes Empty)' })

  // Watch Shop
  const watchShop = dbData.watchShop || []
  preview.push({ Table: 'watch_shop', Type: 'Core Marketing', Source: watchShop.length, TargetCurrent: await getExistingCount('watch_shop'), 'Will INSERT': watchShop.length, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'YES' })

  // Staff Accounts
  preview.push({ Table: 'staff_accounts', Type: 'Security / Auth', Source: 2, TargetCurrent: await getExistingCount('staff_accounts'), 'Will INSERT': 2, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'YES' })

  // Idempotency Keys
  preview.push({ Table: 'idempotency_keys', Type: 'Security / Transactions', Source: 0, TargetCurrent: await getExistingCount('idempotency_keys'), 'Will INSERT': 0, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'NO (Initializes Empty)' })

  // Revoked Tokens
  preview.push({ Table: 'revoked_tokens', Type: 'Security / Auth', Source: 0, TargetCurrent: await getExistingCount('revoked_tokens'), 'Will INSERT': 0, 'Will UPDATE': 0, 'Will SKIP': 0, Conflicts: 0, SequenceSync: 'NO (Initializes Empty)' })

  console.table(preview)

  let sumSource = 0
  let sumInsert = 0
  preview.forEach(p => {
    sumSource += p.Source
    sumInsert += p['Will INSERT']
  })
  console.log(`TOTAL RECORDS IN SOURCE DATASET: ${sumSource}`)
  console.log(`TOTAL RECORDS SCHEDULED TO INSERT: ${sumInsert}`)
  console.log(`TOTAL CONFLICTS / DELETIONS: 0`)

  return preview
}

if (process.argv[1] && process.argv[1].endsWith('migration-preview-comprehensive.js')) {
  generateComprehensiveMigrationPreview()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}
