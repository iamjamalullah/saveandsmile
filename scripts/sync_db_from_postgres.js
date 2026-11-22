import dotenv from 'dotenv'
import pg from 'pg'
import fs from 'fs'

dotenv.config()
const { Client } = pg

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  const db = JSON.parse(fs.readFileSync('db.json', 'utf8'))

  // 1. Fetch categories
  const catRes = await client.query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC')
  if (catRes.rows.length > 0) {
    db.categories = catRes.rows.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image_url,
      description: c.description,
      productCount: c.product_count,
      sortOrder: c.sort_order,
      isActive: c.is_active,
    }))
    console.log(`[SYNC] Synced ${db.categories.length} categories from PostgreSQL`)
  }

  // 2. Fetch products & variants
  const prodRes = await client.query('SELECT * FROM products ORDER BY id ASC')
  const varRes = await client.query('SELECT * FROM product_variants ORDER BY id ASC')
  const variantsByProd = {}
  varRes.rows.forEach(v => {
    if (!variantsByProd[v.product_id]) variantsByProd[v.product_id] = []
    variantsByProd[v.product_id].push({
      id: v.id,
      title: v.title,
      color: v.color_value,
      size: v.size_value,
      sku: v.sku,
      price: Number(v.price),
      stock: v.stock_quantity,
      active: v.is_active,
    })
  })

  if (prodRes.rows.length > 0) {
    db.products = prodRes.rows.map(p => {
      let gallery = []
      try {
        gallery = typeof p.gallery_json === 'string' ? JSON.parse(p.gallery_json) : (p.gallery_json || [])
      } catch (e) {
        gallery = []
      }
      let bulkTiers = []
      try {
        bulkTiers = typeof p.bulk_tiers_json === 'string' ? JSON.parse(p.bulk_tiers_json) : (p.bulk_tiers_json || [])
      } catch (e) {
        bulkTiers = []
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        brand: p.brand || 'Save & Smile',
        category: p.category_slug,
        price: Number(p.price),
        salePrice: p.sale_price ? Number(p.sale_price) : null,
        wholesalePrice: p.wholesale_price ? Number(p.wholesale_price) : null,
        stock: p.stock_quantity,
        isFeatured: p.is_featured,
        isActive: p.is_active,
        image: p.image_main,
        gallery,
        bulkTiers,
        description: p.description,
        variants: variantsByProd[p.id] || [],
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }
    })
    console.log(`[SYNC] Synced ${db.products.length} products from PostgreSQL`)
  }

  // 3. Fetch sections
  const secRes = await client.query('SELECT * FROM sections ORDER BY sort_order ASC')
  if (secRes.rows.length > 0) {
    db.sections = secRes.rows.map(s => {
      let content = {}
      try {
        content = typeof s.content_json === 'string' ? JSON.parse(s.content_json) : (s.content_json || {})
      } catch (e) {
        content = {}
      }
      return {
        id: s.id,
        blockType: s.block_type,
        title: s.title,
        subtitle: s.subtitle,
        order: s.sort_order,
        enabled: s.is_enabled,
        isVisible: s.is_enabled,
        isPublished: s.is_published,
        containerLayout: s.container_layout,
        color: s.color,
        bg: s.bg,
        viewAll: s.view_all,
        seeMore: s.see_more,
        content,
      }
    })
    console.log(`[SYNC] Synced ${db.sections.length} sections from PostgreSQL`)
  }

  // 4. Sanitize orders in db.json (remove test customers)
  if (Array.isArray(db.orders)) {
    db.orders = db.orders.filter(o => {
      const name = o.customer?.name || o.customerName || ''
      const mobile = o.customer?.mobile || o.mobile || ''
      return !['Price Tamperer', 'Double Clicker', 'E2E Test Customer', 'dsfdsfs', 'Single Test'].includes(name)
        && !['03450000001', '03459999999', '5454545454', '03112233445'].includes(mobile)
    })
  }

  // 5. Replace any remaining competitor strings in entire db.json
  let jsonString = JSON.stringify(db, null, 2)
  jsonString = jsonString.replace(/https?:\/\/(?:www\.)?qadrigadgets\.pk\/images\/banners\/[a-zA-Z0-9._-]+\.webp/g, '/images/banner-placeholder.webp')
  jsonString = jsonString.replace(/https?:\/\/(?:www\.)?qadrigadgets\.pk\/images\/builder_background\/[a-zA-Z0-9._-]+\.(?:png|jpg|webp)/g, '')
  jsonString = jsonString.replace(/https?:\/\/(?:www\.)?qadrigadgets\.pk/g, 'https://saveandsmile.pk')
  jsonString = jsonString.replace(/qadrigadgets\.pk/g, 'saveandsmile.pk')
  jsonString = jsonString.replace(/Qadri Gadgets/g, 'Save & Smile')
  jsonString = jsonString.replace(/Qadri Select/g, 'Save & Smile')

  fs.writeFileSync('db.json', jsonString, 'utf8')
  console.log('[SYNC] Successfully synced and sanitized db.json!')

  await client.end()
}

run().catch(console.error)
