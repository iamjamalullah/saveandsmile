/**
 * SAVE & SMILE — AUTHORITATIVE CATALOG & ENTITY SERVICE
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

import { query, transaction, isMemoryDb } from '../db/index.js';
import { handleProductDeletion } from './homepageCleanupService.js';
import { enqueueDeletion, extractImagePaths, unregisterMedia } from './mediaService.js';

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
    brand: (row.brand === 'Qadri Select' ? 'Save & Smile' : row.brand) || 'Save & Smile',
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

/**
 * Hydrates an array of product objects with their relational variants, options, and color galleries.
 * Uses batch queries to avoid N+1 performance bottlenecks.
 * 
 * @param {Array<Object>} products - Array of formatted product objects
 * @param {Object} [client] - Optional PostgreSQL client for transactional queries
 * @returns {Promise<Array<Object>>} Hydrated product objects
 */
export async function populateProductsRelations(products, client = null) {
  if (!Array.isArray(products) || products.length === 0) return products
  const runQuery = client ? (sql, params) => client.query(sql, params) : query

  const productIds = products.map(p => p.id)
  if (productIds.length === 0) return products
  const pPlaceholders = productIds.map((_, i) => `$${i + 1}`).join(', ')

  // 1. Fetch all product_options for these products
  const optionsRes = await runQuery(`
    SELECT id, product_id, name, sort_order
    FROM product_options
    WHERE product_id IN (${pPlaceholders})
    ORDER BY sort_order ASC, id ASC
  `, productIds)

  const optionIds = optionsRes.rows.map(o => o.id)
  const valuesByOption = {}
  if (optionIds.length > 0) {
    const oPlaceholders = optionIds.map((_, i) => `$${i + 1}`).join(', ')
    const valuesRes = await runQuery(`
      SELECT id, option_id, value, hex_code, sort_order
      FROM product_option_values
      WHERE option_id IN (${oPlaceholders})
      ORDER BY sort_order ASC, id ASC
    `, optionIds)
    valuesRes.rows.forEach(v => {
      if (!valuesByOption[v.option_id]) valuesByOption[v.option_id] = []
      valuesByOption[v.option_id].push({
        id: v.id,
        name: v.value,
        hex: v.hex_code,
        sortOrder: v.sort_order,
      })
    })
  }

  const optionsByProduct = {}
  optionsRes.rows.forEach(r => {
    if (!optionsByProduct[r.product_id]) optionsByProduct[r.product_id] = []
    optionsByProduct[r.product_id].push({
      id: r.id,
      name: r.name,
      sortOrder: r.sort_order,
      values: valuesByOption[r.id] || [],
    })
  })

  // 2. Fetch all product_variants for these products
  const variantsRes = await runQuery(`
    SELECT id, product_id, sku, title, color_value as color, size_value as size,
           options, price::numeric, old_price::numeric as "oldPrice", stock_quantity as stock,
           is_active as active, barcode
    FROM product_variants
    WHERE product_id IN (${pPlaceholders})
    ORDER BY id ASC
  `, productIds)

  const variantsByProduct = {}
  variantsRes.rows.forEach(v => {
    if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = []
    let parsedOpts = {}
    try {
      parsedOpts = typeof v.options === 'string' ? JSON.parse(v.options) : (v.options || {})
    } catch (_) {}
    variantsByProduct[v.product_id].push({
      id: v.id,
      productId: v.product_id,
      sku: v.sku || '',
      title: v.title || '',
      color: v.color || '',
      size: v.size || '',
      options: parsedOpts,
      price: Number(v.price),
      oldPrice: Number(v.oldPrice || v.price),
      stock: parseInt(v.stock, 10),
      active: v.active !== false,
      barcode: v.barcode || '',
    })
  })

  // 3. Fetch all product_variant_images (color galleries) for these products
  const imagesRes = await runQuery(`
    SELECT product_id, color_name as "colorName", image_url, is_primary, sort_order
    FROM product_variant_images
    WHERE product_id IN (${pPlaceholders})
    ORDER BY sort_order ASC, id ASC
  `, productIds)

  const colorImagesByProduct = {}
  imagesRes.rows.forEach(img => {
    if (!colorImagesByProduct[img.product_id]) colorImagesByProduct[img.product_id] = {}
    const cName = img.colorName || 'Default'
    if (!colorImagesByProduct[img.product_id][cName]) {
      colorImagesByProduct[img.product_id][cName] = {
        colorName: cName,
        images: [],
        primaryImage: '',
      }
    }
    colorImagesByProduct[img.product_id][cName].images.push(img.image_url)
    if (img.is_primary || !colorImagesByProduct[img.product_id][cName].primaryImage) {
      colorImagesByProduct[img.product_id][cName].primaryImage = img.image_url
    }
  })

  // Attach relational data to each product
  return products.map(p => {
    const opts = optionsByProduct[p.id] || []
    const vars = variantsByProduct[p.id] || []
    const cImgsMap = colorImagesByProduct[p.id] || {}
    const colorImages = Object.values(cImgsMap)

    return {
      ...p,
      options: opts,
      variants: vars,
      colorImages,
      // If product has variants in DB, guarantee hasVariants is true
      hasVariants: p.hasVariants || vars.length > 0,
    }
  })
}

/**
 * Saves or updates product options, option values, purchasable variants, and color galleries
 * within a database transaction.
 * 
 * @param {Object} client - PostgreSQL transaction client
 * @param {number} productId - The product ID to save variants for
 * @param {Object} data - Payload containing options, variants, colorImages, variantConfig
 */
async function saveProductVariantsTx(client, productId, data) {
  const hasVars = Boolean(data.hasVariants || (Array.isArray(data.variants) && data.variants.length > 0))
  const optionsList = Array.isArray(data.options) ? data.options : []
  const variantsList = Array.isArray(data.variants) ? data.variants : []
  const colorImagesList = Array.isArray(data.colorImages) ? data.colorImages : []

  // Clean up existing relational metadata safely
  await client.query('DELETE FROM product_options WHERE product_id = $1', [productId])
  await client.query('DELETE FROM product_variant_images WHERE product_id = $1', [productId])

  if (!hasVars || variantsList.length === 0) {
    // If variants removed, delete variant rows
    await client.query('DELETE FROM product_variants WHERE product_id = $1', [productId])
    await client.query('UPDATE products SET has_variants = FALSE, variant_config = $1 WHERE id = $2', ['none', productId])
    return
  }

  // 1. Insert product_options & product_option_values
  for (let optIdx = 0; optIdx < optionsList.length; optIdx++) {
    const opt = optionsList[optIdx]
    const optName = (opt.name || `Option ${optIdx + 1}`).trim()
    const optRes = await client.query(
      `INSERT INTO product_options (product_id, name, sort_order)
       VALUES ($1, $2, $3) RETURNING id`,
      [productId, optName, optIdx]
    )
    const optId = optRes.rows[0].id

    if (Array.isArray(opt.values)) {
      for (let valIdx = 0; valIdx < opt.values.length; valIdx++) {
        const val = opt.values[valIdx]
        const valName = typeof val === 'string' ? val.trim() : (val.name || String(val)).trim()
        const hexCode = typeof val === 'object' ? (val.hex || val.hexCode || null) : null
        await client.query(
          `INSERT INTO product_option_values (option_id, product_id, value, hex_code, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [optId, productId, valName, hexCode, valIdx]
        )
      }
    }
  }

  // 2. Synchronize product_variants
  // Fetch existing variant IDs for this product to determine what to delete
  const existingVarsRes = await client.query('SELECT id FROM product_variants WHERE product_id = $1', [productId])
  const existingIds = new Set(existingVarsRes.rows.map(r => r.id))
  const preservedIds = new Set()

  for (let i = 0; i < variantsList.length; i++) {
    const v = variantsList[i]
    const vTitle = v.title || `${v.color || ''} ${v.size || ''}`.trim() || `Variant ${i + 1}`
    const vSku = v.sku?.trim() || `${data.sku || 'GS'}-${productId}-${i + 1}`
    const vOptionsJson = v.options ? (typeof v.options === 'string' ? v.options : JSON.stringify(v.options)) : '{}'
    const vPrice = Number(v.price) >= 0 ? Number(v.price) : Number(data.price || 0)
    const vOldPrice = Number(v.oldPrice) >= 0 ? Number(v.oldPrice) : (Number(data.oldPrice) || vPrice)
    const vStock = Number(v.stock) >= 0 ? Number(v.stock) : 0
    const vActive = v.active !== false
    const vBarcode = v.barcode ? String(v.barcode).trim() : null
    const vColor = v.color || (typeof v.options === 'object' ? (v.options?.Color || null) : null)
    const vSize = v.size || (typeof v.options === 'object' ? (v.options?.Size || null) : null)

    const canReuseId = v.id && typeof v.id === 'number' && existingIds.has(v.id)

    if (canReuseId) {
      await client.query(`
        UPDATE product_variants
        SET sku = $1, title = $2, color_value = $3, size_value = $4, options = $5,
            price = $6, old_price = $7, stock_quantity = $8, is_active = $9, barcode = $10,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $11 AND product_id = $12
      `, [vSku, vTitle, vColor, vSize, vOptionsJson, vPrice, vOldPrice, vStock, vActive, vBarcode, v.id, productId])
      preservedIds.add(v.id)
    } else {
      const insRes = await client.query(`
        INSERT INTO product_variants (
          product_id, sku, title, color_value, size_value, options,
          price, old_price, stock_quantity, is_active, barcode
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [productId, vSku, vTitle, vColor, vSize, vOptionsJson, vPrice, vOldPrice, vStock, vActive, vBarcode])
      preservedIds.add(insRes.rows[0].id)
    }
  }

  // Delete obsolete variants that are no longer part of this product configuration
  const toDelete = [...existingIds].filter(id => !preservedIds.has(id))
  if (toDelete.length > 0) {
    const delPlaceholders = toDelete.map((_, i) => `$${i + 1}`).join(', ')
    await client.query(`DELETE FROM product_variants WHERE id IN (${delPlaceholders}) AND product_id = $${toDelete.length + 1}`, [...toDelete, productId])
  }

  // 3. Insert product_variant_images (Color Galleries)
  for (let ciIdx = 0; ciIdx < colorImagesList.length; ciIdx++) {
    const ci = colorImagesList[ciIdx]
    const colorName = ci.color || ci.colorName || ci.name || 'Default'
    const images = Array.isArray(ci.images) ? ci.images : []
    const primaryImg = ci.primaryImage || images[0] || ''

    for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
      const imgUrl = images[imgIdx]
      if (!imgUrl) continue
      await client.query(`
        INSERT INTO product_variant_images (product_id, color_name, image_url, is_primary, sort_order)
        VALUES ($1, $2, $3, $4, $5)
      `, [productId, colorName, imgUrl, imgUrl === primaryImg || imgIdx === 0, imgIdx])
    }
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
  const baseProducts = res.rows.map(formatProductRow)

  // Hydrate all products with variants, options, and colorImages
  return populateProductsRelations(baseProducts)
}

export async function getProductById(id) {
  const res = await query('SELECT * FROM products WHERE id = $1', [id])
  if (!res.rows.length) return null
  const baseProduct = formatProductRow(res.rows[0])
  const hydrated = await populateProductsRelations([baseProduct])
  return hydrated[0] || baseProduct
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

    const hasVars = Boolean(data.hasVariants || (Array.isArray(data.variants) && data.variants.length > 0))
    const variantConfig = data.variantConfig || (hasVars ? 'color' : 'none')

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
        data.brand || 'Save & Smile',
        data.description || '',
        data.video || null,
        data.image || '/images/p1.jpg',
        imagesJson,
        highlightsJson,
        specsJson,
        bulkTiersJson,
        Boolean(data.featured),
        hasVars,
        variantConfig,
        Number(data.rating) || 5.0,
        Number(data.reviewsCount) || 0,
      ]
    )

    // Save relational options, variants, and color galleries
    if (data.options || data.variants || data.colorImages) {
      await saveProductVariantsTx(client, nextId, data)
    }

    const baseProduct = formatProductRow(res.rows[0])
    const hydrated = await populateProductsRelations([baseProduct], client)
    return hydrated[0] || baseProduct
  })
}

export async function updateProduct(id, fields) {
  return transaction(async client => {
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

    // Determine hasVariants and variantConfig if passed
    if (fields.variants !== undefined || fields.hasVariants !== undefined) {
      const hasVars = Boolean(fields.hasVariants || (Array.isArray(fields.variants) && fields.variants.length > 0))
      fields.hasVariants = hasVars
      if (!fields.variantConfig) {
        fields.variantConfig = hasVars ? 'color' : 'none'
      }
    }

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

    let updatedRow = null
    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = $1 RETURNING *`
      const res = await client.query(sql, params)
      if (!res.rows.length) return null
      updatedRow = res.rows[0]
    } else {
      const checkRes = await client.query('SELECT * FROM products WHERE id = $1', [id])
      if (!checkRes.rows.length) return null
      updatedRow = checkRes.rows[0]
    }

    // Update relational variants, options, and color galleries if passed in payload
    if (fields.variants !== undefined || fields.options !== undefined || fields.colorImages !== undefined) {
      await saveProductVariantsTx(client, id, fields)
    }

    const baseProduct = formatProductRow(updatedRow)
    const hydrated = await populateProductsRelations([baseProduct], client)
    return hydrated[0] || baseProduct
  })
}

export async function deleteProduct(id) {
  // 1. Fetch product to inspect media and details before deletion
  const prodRes = await query('SELECT * FROM products WHERE id = $1', [id])
  if (!prodRes.rows.length) return false
  const product = prodRes.rows[0]

  // 2. Collect product images
  const imagesToCheck = []
  if (product.image_main) imagesToCheck.push(product.image_main)
  try {
    const gallery = typeof product.images_gallery === 'string'
      ? JSON.parse(product.images_gallery)
      : (product.images_gallery || [])
    if (Array.isArray(gallery)) imagesToCheck.push(...gallery)
  } catch {}

  // 3. Collect variant images
  const varImgs = await query('SELECT image_url FROM product_variant_images WHERE product_id = $1', [id])
  varImgs.rows.forEach(v => {
    if (v.image_url) imagesToCheck.push(v.image_url)
  })

  // 4. Delete the product record (Postgres CASCADE safely cleans up product_options, product_option_values, product_variants, product_variant_images)
  // Historical orders, order_items, customers, and invoices remain 100% preserved!
  const res = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id])
  const deleted = res.rows.length > 0

  // 5. Clean up any homepage draft / published section product references
  if (deleted) {
    try {
      await handleProductDeletion(id)
    } catch (cleanErr) {
      console.warn('[HOMEPAGE CLEANUP WARNING]:', cleanErr.message)
    }
    try {
      const storagePaths = extractImagePaths(imagesToCheck)
      for (const objPath of storagePaths) {
        await enqueueDeletion({ objectPath: objPath, ownerType: 'product', ownerId: String(id) })
      }
      await unregisterMedia({ ownerType: 'product', ownerId: String(id) })
    } catch (mediaErr) {
      console.warn('[MEDIA CLEANUP WARNING]:', mediaErr.message)
    }
  }

  return deleted
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

export async function deleteCategory(id, options = {}) {
  // 1. Check if category exists
  const catRes = await query('SELECT * FROM categories WHERE id = $1', [id])
  if (!catRes.rows.length) return false
  const cat = catRes.rows[0]

  // 2. Safe Category Deletion: Check if any active products belong to this category!
  // Products must NEVER be deleted automatically when a category is deleted.
  const prodCheck = await query('SELECT count(*) FROM products WHERE category_name = $1', [cat.name])
  const productCount = parseInt(prodCheck.rows[0].count, 10)

  if (productCount > 0 && !options.reassignToCategory) {
    const error = new Error(`Cannot delete category "${cat.name}". ${productCount} products currently belong to this category. Please reassign or approve before deletion.`)
    error.code = 'CATEGORY_HAS_PRODUCTS'
    error.productCount = productCount
    throw error
  }

  // If explicit reassignment provided, safely reassign products
  if (productCount > 0 && options.reassignToCategory) {
    await query('UPDATE products SET category_name = $1 WHERE category_name = $2', [options.reassignToCategory, cat.name])
  }

  // 3. Delete category record
  const res = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id])
  const deleted = res.rows.length > 0
  if (deleted && cat.image_url) {
    try {
      const paths = extractImagePaths([cat.image_url])
      for (const objPath of paths) {
        await enqueueDeletion({ objectPath: objPath, ownerType: 'category', ownerId: String(id) })
      }
      await unregisterMedia({ ownerType: 'category', ownerId: String(id) })
    } catch (catMediaErr) {
      console.warn('[CATEGORY MEDIA CLEANUP WARNING]:', catMediaErr.message)
    }
  }
  return deleted
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
