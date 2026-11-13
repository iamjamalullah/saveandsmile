/**
 * QADRI GADGETS — AUTHORITATIVE CATALOG & ENTITY SERVICE
 * 
 * Provides production-grade ACID database persistence for:
 * - Products, inventory, variants & bulk tier pricing
 * - Categories & catalog navigation
 * - Customer reviews & moderation
 * - Store settings
 * 
 * Ensures all Admin Panel modifications are authoritatively persisted into PostgreSQL
 * without relying on ephemeral in-memory storage or temporary /tmp/db.json.
 */

import { query, transaction, isMemoryDb } from '../db/index.js'

function formatProductRow(row) {
  let images = []
  let highlights = []
  let specs = []
  let bulkTiers = []

  try { images = typeof row.images_gallery === 'string' ? JSON.parse(row.images_gallery) : (row.images_gallery || []) } catch (_) {}
  try { highlights = typeof row.highlights === 'string' ? JSON.parse(row.highlights) : (row.highlights || []) } catch (_) {}
  try { specs = typeof row.specs_json === 'string' ? JSON.parse(row.specs_json) : (row.specs_json || []) } catch (_) {}
  try { bulkTiers = typeof row.bulk_tiers_json === 'string' ? JSON.parse(row.bulk_tiers_json) : (row.bulk_tiers_json || []) } catch (_) {}

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    category: row.category_name,
    group: row.group_name,
    price: Number(row.price),
    oldPrice: row.old_price ? Number(row.old_price) : Number(row.price),
    stock: parseInt(row.stock_quantity, 10),
    brand: row.brand || 'Qadri Select',
    description: row.description || '',
    video: row.video_url || null,
    image: row.image_main,
    images: images.length ? images : [row.image_main],
    highlights,
    specs,
    bulkTiers,
    featured: Boolean(row.is_featured),
    hasVariants: Boolean(row.has_variants),
    variantConfig: row.variant_config || 'none',
    rating: Number(row.rating) || 5.0,
    reviewsCount: parseInt(row.reviews_count, 10) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── PRODUCTS CRUD ──

export async function getProducts(filters = {}) {
  let sql = 'SELECT * FROM products WHERE 1=1'
  const params = []

  if (filters.category && filters.category !== 'ALL') {
    params.push(filters.category)
    sql += ` AND category_name = $${params.length}`
  }
  if (filters.group && filters.group !== 'ALL') {
    params.push(filters.group)
    sql += ` AND group_name = $${params.length}`
  }
  if (filters.search) {
    params.push(`%${filters.search}%`)
    sql += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length} OR category_name ILIKE $${params.length})`
  }

  const sortOrder = filters._order === 'asc' ? 'ASC' : 'DESC'
  const sortCol = filters._sort === 'price' ? 'price'
    : filters._sort === 'name' ? 'name'
    : filters._sort === 'stock' ? 'stock_quantity'
    : 'id'

  sql += ` ORDER BY ${sortCol} ${sortOrder}`

  const res = await query(sql, params)
  return res.rows.map(formatProductRow)
}

export async function getProductById(id) {
  const res = await query('SELECT * FROM products WHERE id = $1', [id])
  if (!res.rows.length) return null
  return formatProductRow(res.rows[0])
}

export async function createProduct(data) {
  return transaction(async client => {
    const imagesJson = JSON.stringify(data.images || [data.image || '/images/p1.jpg'])
    const highlightsJson = JSON.stringify(data.highlights || [])
    const specsJson = JSON.stringify(data.specs || [])
    const bulkTiersJson = JSON.stringify(data.bulkTiers || [])

    let nextId = data.id
    if (!nextId) {
      const idRes = await client.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM products')
      nextId = idRes.rows[0].next_id
    }

    const sku = data.sku || `QGW-${1000 + nextId}`
    const slug = data.slug || `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sku.toLowerCase()}`

    const res = await client.query(
      `INSERT INTO products (
         id, sku, name, slug, category_name, group_name, price, old_price,
         stock_quantity, brand, description, video_url, image_main,
         images_gallery, highlights, specs_json, bulk_tiers_json,
         is_featured, has_variants, variant_config, rating, reviews_count
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       RETURNING *`,
      [
        nextId,
        sku,
        data.name,
        slug,
        data.category || 'General',
        data.group || 'new',
        Number(data.price) || 0,
        Number(data.oldPrice) || Number(data.price) || 0,
        Number(data.stock) || 0,
        data.brand || 'Qadri Select',
        data.description || '',
        data.video || null,
        data.image || '/images/p1.jpg',
        imagesJson,
        highlightsJson,
        specsJson,
        bulkTiersJson,
        Boolean(data.featured),
        Boolean(data.hasVariants),
        data.variantConfig || 'none',
        Number(data.rating) || 5.0,
        Number(data.reviewsCount) || 0,
      ]
    )

    return formatProductRow(res.rows[0])
  })
}

export async function updateProduct(id, fields) {
  const allowed = {
    name: 'name',
    price: 'price',
    oldPrice: 'old_price',
    stock: 'stock_quantity',
    category: 'category_name',
    group: 'group_name',
    brand: 'brand',
    description: 'description',
    video: 'video_url',
    image: 'image_main',
    featured: 'is_featured',
    hasVariants: 'has_variants',
    variantConfig: 'variant_config',
  }

  const updates = []
  const params = [id]

  for (const [key, val] of Object.entries(fields)) {
    if (allowed[key]) {
      params.push(val)
      updates.push(`${allowed[key]} = $${params.length}`)
    } else if (key === 'images') {
      params.push(JSON.stringify(val))
      updates.push(`images_gallery = $${params.length}`)
    } else if (key === 'highlights') {
      params.push(JSON.stringify(val))
      updates.push(`highlights = $${params.length}`)
    } else if (key === 'specs') {
      params.push(JSON.stringify(val))
      updates.push(`specs_json = $${params.length}`)
    } else if (key === 'bulkTiers') {
      params.push(JSON.stringify(val))
      updates.push(`bulk_tiers_json = $${params.length}`)
    }
  }

  if (!updates.length) {
    return getProductById(id)
  }

  updates.push('updated_at = CURRENT_TIMESTAMP')
  const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = $1 RETURNING *`
  const res = await query(sql, params)
  if (!res.rows.length) return null
  return formatProductRow(res.rows[0])
}

export async function deleteProduct(id) {
  const res = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id])
  return res.rows.length > 0
}

// ── CATEGORIES CRUD ──

export async function getCategories() {
  const res = await query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC')
  return res.rows.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    icon: r.icon,
    image: r.image_url,
    sortOrder: r.sort_order,
  }))
}

export async function createCategory(data) {
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  let nextId = data.id
  if (!nextId) {
    const idRes = await query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM categories')
    nextId = idRes.rows[0].next_id
  }

  const res = await query(
    `INSERT INTO categories (id, name, slug, icon, image_url, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [nextId, data.name, slug, data.icon || '📦', data.image || '/images/cat1.jpg', nextId]
  )
  const r = res.rows[0]
  return { id: r.id, name: r.name, slug: r.slug, icon: r.icon, image: r.image_url }
}

export async function updateCategory(id, fields) {
  const updates = []
  const params = [id]
  if (fields.name) { params.push(fields.name); updates.push(`name = $${params.length}`) }
  if (fields.slug) { params.push(fields.slug); updates.push(`slug = $${params.length}`) }
  if (fields.icon) { params.push(fields.icon); updates.push(`icon = $${params.length}`) }
  if (fields.image) { params.push(fields.image); updates.push(`image_url = $${params.length}`) }

  if (!updates.length) return null
  const sql = `UPDATE categories SET ${updates.join(', ')} WHERE id = $1 RETURNING *`
  const res = await query(sql, params)
  if (!res.rows.length) return null
  const r = res.rows[0]
  return { id: r.id, name: r.name, slug: r.slug, icon: r.icon, image: r.image_url }
}

export async function deleteCategory(id) {
  const res = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id])
  return res.rows.length > 0
}

// ── REVIEWS CRUD & MODERATION ──

export async function getReviews(filters = {}) {
  let sql = 'SELECT * FROM reviews WHERE 1=1'
  const params = []

  if (filters.status) {
    params.push(filters.status)
    sql += ` AND status = $${params.length}`
  }
  if (filters.productId) {
    params.push(filters.productId)
    sql += ` AND product_id = $${params.length}`
  }

  sql += ' ORDER BY id DESC'
  const res = await query(sql, params)
  return res.rows.map(r => ({
    id: r.id,
    productId: r.product_id,
    name: r.name,
    title: r.title,
    text: r.text,
    rating: Number(r.rating),
    whatsapp: r.whatsapp,
    status: r.status,
    date: r.date_formatted,
    createdAt: r.created_at,
  }))
}

export async function createReview(data) {
  let nextId = data.id
  if (!nextId) {
    const idRes = await query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM reviews')
    nextId = idRes.rows[0].next_id
  }

  const res = await query(
    `INSERT INTO reviews (id, product_id, name, title, text, rating, whatsapp, status, date_formatted)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      nextId,
      data.productId ? Number(data.productId) : null,
      data.name,
      data.title || '',
      data.text,
      Number(data.rating) || 5,
      data.whatsapp || '',
      data.status || 'pending',
      data.date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
    ]
  )
  const r = res.rows[0]
  return { id: r.id, productId: r.product_id, name: r.name, title: r.title, text: r.text, rating: Number(r.rating), status: r.status }
}

// ── STORE SETTINGS ──

export async function getStoreSettings() {
  const res = await query('SELECT * FROM store_settings WHERE id = 1')
  if (!res.rows.length) return null
  const r = res.rows[0]
  return {
    name: r.store_name,
    tagline: r.tagline,
    phone: r.phone,
    whatsapp: r.whatsapp,
    email: r.email,
    address: r.address,
    currency: r.currency,
    freeShippingThreshold: Number(r.free_shipping_threshold),
    shippingFee: Number(r.shipping_fee),
    expressShippingFee: Number(r.express_shipping_fee),
    announcement: r.announcement_bar_text,
  }
}

export async function updateStoreSettings(settings) {
  const res = await query(
    `UPDATE store_settings SET
       store_name = COALESCE($1, store_name),
       tagline = COALESCE($2, tagline),
       phone = COALESCE($3, phone),
       whatsapp = COALESCE($4, whatsapp),
       email = COALESCE($5, email),
       address = COALESCE($6, address),
       free_shipping_threshold = COALESCE($7, free_shipping_threshold),
       shipping_fee = COALESCE($8, shipping_fee),
       announcement_bar_text = COALESCE($9, announcement_bar_text),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = 1
     RETURNING *`,
    [
      settings.name,
      settings.tagline,
      settings.phone,
      settings.whatsapp,
      settings.email,
      settings.address,
      settings.freeShippingThreshold !== undefined ? Number(settings.freeShippingThreshold) : null,
      settings.shippingFee !== undefined ? Number(settings.shippingFee) : null,
      settings.announcement,
    ]
  )
  return res.rows[0]
}
