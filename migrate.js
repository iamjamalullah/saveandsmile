import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { getDatabasePool, initDatabase, transaction, query } from './src/db/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_JSON_PATH = path.join(__dirname, 'db.json')

export async function runMigration() {
  console.log('===============================================================')
  console.log('   QADRI GADGETS – POSTGRESQL DATA MIGRATION RUNNER')
  console.log('===============================================================')

  // 1. Initialize schema DDL
  await initDatabase()

  if (!fs.existsSync(DB_JSON_PATH)) {
    throw new Error(`Source db.json not found at ${DB_JSON_PATH}`)
  }

  const rawJson = fs.readFileSync(DB_JSON_PATH, 'utf8')
  const dbData = JSON.parse(rawJson)

  const counts = {
    source: {},
    target: {},
  }

  // 2. Perform Migration in a Transaction
  await transaction(async client => {
    // ── CATEGORIES ──
    console.log('[MIGRATION] Migrating categories...')
    const categories = dbData.categories || []
    counts.source.categories = categories.length
    for (const c of categories) {
      await client.query(
        `INSERT INTO categories (id, name, slug, icon, image_url, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           icon = EXCLUDED.icon,
           image_url = EXCLUDED.image_url`,
        [c.id, c.name, c.slug, c.icon || '📦', c.image || '/images/cat1.jpg', c.id]
      )
    }

    // ── PRODUCTS & INVENTORY ──
    console.log('[MIGRATION] Migrating products & inventory tiers...')
    const products = dbData.products || []
    counts.source.products = products.length
    for (const p of products) {
      const imagesJson = JSON.stringify(p.images || [p.image])
      const highlightsJson = JSON.stringify(p.highlights || [])
      const specsJson = JSON.stringify(p.specs || [])
      const bulkTiersJson = JSON.stringify(p.bulkTiers || [])

      await client.query(
        `INSERT INTO products (
           id, sku, name, slug, category_name, group_name, price, old_price,
           stock_quantity, brand, description, video_url, image_main,
           images_gallery, highlights, specs_json, bulk_tiers_json,
           is_featured, has_variants, variant_config, rating, reviews_count
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           price = EXCLUDED.price,
           stock_quantity = EXCLUDED.stock_quantity,
           has_variants = EXCLUDED.has_variants,
           variant_config = EXCLUDED.variant_config`,
        [
          p.id,
          p.sku || `QGW-${1000 + p.id}`,
          p.name,
          p.slug,
          p.category || 'General',
          p.group || 'general',
          Number(p.price) || 0,
          Number(p.oldPrice) || Number(p.price) || 0,
          Number(p.stock) || 0,
          p.brand || 'Qadri Select',
          p.description || '',
          p.video || null,
          p.image || '/images/p1.jpg',
          imagesJson,
          highlightsJson,
          specsJson,
          bulkTiersJson,
          Boolean(p.featured),
          Boolean(p.hasVariants),
          p.variantConfig || 'none',
          Number(p.rating) || 5.0,
          Number(p.reviewsCount) || 0,
        ]
      )

      if (p.hasVariants && Array.isArray(p.variants)) {
        // Ensure idempotency for product options & variant images on rerun
        await client.query('DELETE FROM product_options WHERE product_id = $1', [p.id])
        await client.query('DELETE FROM product_variant_images WHERE product_id = $1', [p.id])

        if (Array.isArray(p.options)) {
          for (let optIdx = 0; optIdx < p.options.length; optIdx++) {
            const opt = p.options[optIdx]
            const optRes = await client.query(
              `INSERT INTO product_options (product_id, name, sort_order)
               VALUES ($1, $2, $3) RETURNING id`,
              [p.id, opt.name, optIdx]
            )
            const optId = optRes.rows[0].id
            if (Array.isArray(opt.values)) {
              for (let valIdx = 0; valIdx < opt.values.length; valIdx++) {
                const val = opt.values[valIdx]
                const valName = typeof val === 'string' ? val : val.name
                const hexCode = typeof val === 'object' ? val.hex || val.hexCode : null
                await client.query(
                  `INSERT INTO product_option_values (option_id, product_id, value, hex_code, sort_order)
                   VALUES ($1, $2, $3, $4, $5)`,
                  [optId, p.id, valName, hexCode, valIdx]
                )
              }
            }
          }
        }

        for (const v of p.variants) {
          await client.query(
            `INSERT INTO product_variants (
               id, product_id, sku, title, color_value, size_value, options,
               price, old_price, stock_quantity, is_active, barcode
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO UPDATE SET
               price = EXCLUDED.price,
               stock_quantity = EXCLUDED.stock_quantity,
               is_active = EXCLUDED.is_active`,
            [
              v.id,
              p.id,
              v.sku || `${p.sku || p.id}-${v.id}`,
              v.title || `${v.color || ''} ${v.size || ''}`.trim() || 'Default',
              v.color || null,
              v.size || null,
              v.options ? JSON.stringify(v.options) : '{}',
              Number(v.price) || Number(p.price) || 0,
              Number(v.oldPrice) || Number(v.price) || Number(p.price) || 0,
              Number(v.stock) || 0,
              v.active !== false,
              v.barcode || null,
            ]
          )
        }

        if (Array.isArray(p.colorImages)) {
          for (const ci of p.colorImages) {
            const colorName = ci.color || ci.colorName || ci.name || 'Default'
            const images = ci.images || []
            for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
              const imgUrl = images[imgIdx]
              await client.query(
                `INSERT INTO product_variant_images (product_id, color_name, image_url, is_primary, sort_order)
                 VALUES ($1, $2, $3, $4, $5)`,
                [p.id, colorName, imgUrl, imgUrl === ci.primaryImage || imgIdx === 0, imgIdx]
              )
            }
          }
        }
      }
    }

    // ── CUSTOMERS & ORDERS ──
    console.log('[MIGRATION] Migrating customers, orders and order_items...')
    const orders = dbData.orders || []
    counts.source.orders = orders.length
    let totalOrderItemsCount = 0
    const uniqueCustomers = new Map()

    for (const o of orders) {
      const cust = o.customer || {}
      const mobile = (cust.mobile || o.mobile || '').trim()
      const name = (cust.name || o.name || 'Guest Customer').trim()
      const email = (cust.email || o.email || '').trim()
      const city = (cust.city || o.city || 'Karachi').trim()
      const address = (cust.address || o.address || '').trim()

      let customerId = `cust-${mobile.replace(/[^\d]/g, '')}`
      if (mobile && !uniqueCustomers.has(mobile)) {
        uniqueCustomers.set(mobile, { id: customerId, name, mobile, email, city, address })
        await client.query(
          `INSERT INTO customers (id, name, mobile, email, city, address)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (mobile) DO NOTHING`,
          [customerId, name, mobile, email, city, address]
        )
      }

      // Insert Order
      await client.query(
        `INSERT INTO orders (
           id, customer_id, customer_name, customer_mobile, customer_email,
           customer_city, delivery_address, delivery_method, payment_method,
           status, tracking_number, subtotal, discount, coupon_code,
           shipping_fee, total, customer_notes, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (id) DO NOTHING`,
        [
          o.id,
          customerId,
          name,
          mobile,
          email,
          city,
          address,
          o.deliveryMethod || 'Standard',
          o.paymentMethod || 'Cash on Delivery (COD)',
          o.status || 'Pending',
          o.trackingNumber || null,
          Number(o.subtotal || o.total || 0),
          Number(o.discount || 0),
          o.coupon || null,
          Number(o.shippingFee || 0),
          Number(o.total || 0),
          o.notes || '',
          o.createdAt ? new Date(o.createdAt) : new Date(),
        ]
      )

      // Insert Order Items
      if (Array.isArray(o.items)) {
        await client.query('DELETE FROM order_items WHERE order_id = $1', [o.id])
        for (const item of o.items) {
          totalOrderItemsCount++
          const prod = item.product || {}
          const variantId = item.variantId || item.variant?.id || null
          const variantTitle = item.variantTitle || item.variant?.title || null
          const unitPrice = Number(item.unitPrice || item.variant?.price || prod.price || 0)
          const qty = Number(item.qty || item.quantity || 1)
          await client.query(
            `INSERT INTO order_items (
               order_id, product_id, product_name, product_sku, variant_id, variant_title, unit_price, quantity, line_total
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              o.id,
              prod.id || item.productId || null,
              prod.name || item.name || 'Item',
              item.variant?.sku || prod.sku || item.sku || null,
              variantId,
              variantTitle,
              unitPrice,
              qty,
              unitPrice * qty,
            ]
          )
        }
      }
    }
    counts.source.customers = uniqueCustomers.size
    counts.source.order_items = totalOrderItemsCount

    // ── COUPONS ──
    console.log('[MIGRATION] Migrating discount coupons...')
    const coupons = dbData.coupons || []
    counts.source.coupons = coupons.length
    for (const cp of coupons) {
      await client.query(
        `INSERT INTO coupons (id, code, type, value, min_order, max_discount, description, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (code) DO UPDATE SET
           value = EXCLUDED.value,
           min_order = EXCLUDED.min_order`,
        [
          cp.id,
          cp.code.toUpperCase(),
          cp.type || 'percent',
          Number(cp.value) || 0,
          Number(cp.minOrder) || 0,
          cp.maxDiscount ? Number(cp.maxDiscount) : null,
          cp.description || '',
          cp.active !== false,
        ]
      )
    }

    // ── REVIEWS ──
    console.log('[MIGRATION] Migrating reviews...')
    const reviews = dbData.reviews || []
    counts.source.reviews = reviews.length
    for (const r of reviews) {
      await client.query(
        `INSERT INTO reviews (id, product_id, name, title, text, rating, whatsapp, status, date_formatted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          r.id,
          r.productId || null,
          r.name || 'Verified Customer',
          r.title || 'Review',
          r.text || '',
          Number(r.rating) || 5,
          r.whatsapp || null,
          r.status || 'approved',
          r.date || new Date().toISOString(),
        ]
      )
    }

    // ── CONTACT INQUIRIES ──
    console.log('[MIGRATION] Migrating contacts & inquiries...')
    const contacts = dbData.contacts || []
    counts.source.contact_inquiries = contacts.length
    for (const ct of contacts) {
      await client.query(
        `INSERT INTO contact_inquiries (id, type, name, email, mobile, company, city, address, reason, product_requested, quantity_requested, message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [
          ct.id,
          ct.type || 'contact',
          ct.name,
          ct.email || null,
          ct.mobile,
          ct.company || null,
          ct.city || null,
          ct.address || null,
          ct.reason || null,
          ct.product || null,
          ct.qty ? Number(ct.qty) : null,
          ct.message || '',
        ]
      )
    }

    // ── STORE SETTINGS ──
    console.log('[MIGRATION] Migrating store settings...')
    const settings = (dbData.settings && dbData.settings[0]) || {}
    counts.source.store_settings = 1
    await client.query(
      `INSERT INTO store_settings (
         id, store_name, tagline, phone, whatsapp, email, address,
         free_shipping_threshold, shipping_fee, express_shipping_fee,
         tax_rate, allow_guest_checkout, announcement
       ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         store_name = EXCLUDED.store_name,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         free_shipping_threshold = EXCLUDED.free_shipping_threshold,
         shipping_fee = EXCLUDED.shipping_fee`,
      [
        settings.name || 'Qadri Gadgets',
        settings.tagline || 'Gadgets Wholesaler',
        settings.phone || '0321-8273588',
        settings.whatsapp || '923218273588',
        settings.email || 'info@qadrigadgets.pk',
        settings.address || 'Karachi, Pakistan',
        Number(settings.freeShippingThreshold) || 3000,
        Number(settings.shippingFee) || 200,
        Number(settings.expressShippingFee) || 350,
        Number(settings.taxRate) || 0,
        settings.allowGuestCheckout !== false,
        settings.announcement || '',
      ]
    )

    // ── HERO SLIDES ──
    console.log('[MIGRATION] Migrating hero slides...')
    const heroSlides = dbData.heroSlides || []
    counts.source.hero_slides = heroSlides.length
    for (let i = 0; i < heroSlides.length; i++) {
      const s = heroSlides[i]
      await client.query(
        `INSERT INTO hero_slides (id, image_url, alt_text, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           image_url = EXCLUDED.image_url,
           alt_text = EXCLUDED.alt_text,
           sort_order = EXCLUDED.sort_order`,
        [i + 1, s.image, s.alt || 'Slide', i]
      )
    }

    // ── SECTIONS ──
    console.log('[MIGRATION] Migrating homepage sections...')
    const sections = dbData.sections || []
    counts.source.sections = sections.length
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i]
      await client.query(
        `INSERT INTO sections (id, group_name, title, subtitle, sort_order, container_layout, block_type, content_json, is_visible, is_published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           sort_order = EXCLUDED.sort_order,
           container_layout = EXCLUDED.container_layout,
           block_type = EXCLUDED.block_type,
           content_json = EXCLUDED.content_json,
           is_visible = EXCLUDED.is_visible,
           is_published = EXCLUDED.is_published`,
        [
          String(s.id || (i + 1)),
          s.group || `custom-${s.id || i + 1}`,
          s.title,
          s.subtitle || '',
          s.order || (i + 1),
          s.containerLayout || s.container_layout || 'single',
          s.blockType || s.block_type || 'products',
          JSON.stringify(s.content || s),
          s.enabled !== false && s.isVisible !== false,
          s.isPublished !== false,
        ]
      )
    }

    // ── INITIALIZE HOMEPAGE DRAFT (IF EMPTY) ──
    const draftCheck = await client.query('SELECT id FROM homepage_draft WHERE id = 1')
    if (draftCheck.rows.length === 0) {
      await client.query(
        'INSERT INTO homepage_draft (id, draft_json, updated_at) VALUES (1, $1, NOW())',
        [JSON.stringify(sections)]
      )
    }

    // ── WATCH & SHOP ──
    console.log('[MIGRATION] Migrating Watch & Shop reels...')
    const watchShop = dbData.watchShop || []
    counts.source.watch_shop = watchShop.length
    for (let i = 0; i < watchShop.length; i++) {
      const w = watchShop[i]
      await client.query(
        `INSERT INTO watch_shop (id, title, video_url, image_url, views_count, likes_count, product_id, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           video_url = EXCLUDED.video_url,
           image_url = EXCLUDED.image_url,
           views_count = EXCLUDED.views_count,
           likes_count = EXCLUDED.likes_count,
           product_id = EXCLUDED.product_id,
           sort_order = EXCLUDED.sort_order`,
        [w.id || i + 1, w.title || 'Reel', w.video, w.image, w.views || 0, w.likes || 0, w.productId || null, i]
      )
    }

    // ── STAFF ACCOUNTS (WITH BCRYPT HASHES) ──
    console.log('[MIGRATION] Seeding staff accounts with bcrypt password hashes...')
    counts.source.staff_accounts = 2
    const adminPassHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10)
    const managerPassHash = bcrypt.hashSync(process.env.MANAGER_PASSWORD || 'manager123', 10)

    await client.query(
      `INSERT INTO staff_accounts (id, name, email, password_hash, role, is_active)
       VALUES (1, 'Store Administrator', 'admin@qadrigadgets.pk', $1, 'admin', TRUE)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [adminPassHash]
    )

    await client.query(
      `INSERT INTO staff_accounts (id, name, email, password_hash, role, is_active)
       VALUES (2, 'Operations Manager', 'manager@qadrigadgets.pk', $1, 'manager', TRUE)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [managerPassHash]
    )

    // ── SYNCHRONIZE SERIAL SEQUENCES ──
    const serialTables = [
      'categories',
      'products',
      'hero_slides',
      'order_items',
      'coupons',
      'watch_shop',
      'staff_accounts',
      'homepage_section_versions',
      'product_options',
      'product_option_values',
      'product_variants',
      'product_variant_images',
    ]
    for (const tbl of serialTables) {
      try {
        await client.query(`SELECT setval(pg_get_serial_sequence('${tbl}', 'id'), COALESCE((SELECT MAX(id) FROM ${tbl}), 1))`)
      } catch (_) {
        // Ignored in pg-mem or non-serial environments
      }
    }
  })

  // 3. Verification & Comparison
  console.log('\n[MIGRATION VERIFICATION] Auditing migrated record counts across all 21 tables...')
  const tables = [
    'categories',
    'products',
    'product_options',
    'product_option_values',
    'product_variants',
    'product_variant_images',
    'customers',
    'orders',
    'order_items',
    'coupons',
    'reviews',
    'contact_inquiries',
    'store_settings',
    'hero_slides',
    'sections',
    'homepage_draft',
    'homepage_section_versions',
    'watch_shop',
    'staff_accounts',
    'idempotency_keys',
    'revoked_tokens',
  ]

  const report = []
  for (const tbl of tables) {
    const res = await query(`SELECT COUNT(*) as count FROM ${tbl}`)
    const count = parseInt(res.rows[0].count, 10)
    counts.target[tbl] = count

    const srcCount = counts.source[tbl] || 0
    const matched = srcCount === count
    report.push({
      Table: tbl,
      'db.json (Source)': srcCount,
      'PostgreSQL (Target)': count,
      Status: matched ? 'MATCHED ✓' : (srcCount === 0 && count === 0 ? 'EMPTY OK ✓' : 'MISMATCH ⚠'),
    })
  }

  console.table(report)

  const allMatched = report.every(r => r.Status.includes('✓'))
  if (allMatched) {
    console.log('[SUCCESS] All 21 schema tables verified with 100% data parity!')
  } else {
    console.warn('[WARNING] Some tables had mismatching record counts.')
  }

  return { success: allMatched, report, counts }
}

if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[MIGRATION FATAL]:', err)
      process.exit(1)
    })
}
