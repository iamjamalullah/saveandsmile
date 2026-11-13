// Compare current live production data against migration source (db.json)
import fs from 'node:fs'

async function compareLiveWithSource() {
  console.log('=== SOURCE DATA FRESHNESS & AUDIT COMPARISON ===\n')

  const dbJson = JSON.parse(fs.readFileSync('db.json', 'utf8'))

  // Fetch current live production endpoints
  const BASE_URL = 'https://saveandsmile.vercel.app'
  
  async function fetchJson(endpoint) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      return null
    }
  }

  console.log('Fetching live endpoints from https://saveandsmile.vercel.app ...')
  const liveProducts = await fetchJson('/products') || []
  const liveCategories = await fetchJson('/categories') || []
  const liveSections = await fetchJson('/sections') || []
  const liveReviews = await fetchJson('/reviews') || []
  const liveSlides = await fetchJson('/hero-slides') || []
  const liveWatch = await fetchJson('/watch-shop') || []

  console.log('\n--- COLLECTION LEVEL PARITY ---')
  console.log(`Products: Live=${liveProducts.length} | Source=${dbJson.products?.length || 0} -> MATCHED: ${liveProducts.length === (dbJson.products?.length || 0)}`)
  console.log(`Categories: Live=${liveCategories.length} | Source=${dbJson.categories?.length || 0} -> MATCHED: ${liveCategories.length === (dbJson.categories?.length || 0)}`)
  console.log(`Sections: Live=${liveSections.length} | Source=${dbJson.sections?.length || 0} -> MATCHED: ${liveSections.length === (dbJson.sections?.length || 0)}`)
  console.log(`Hero Slides: Live=${liveSlides.length} | Source=${dbJson.heroSlides?.length || 0} -> MATCHED: ${liveSlides.length === (dbJson.heroSlides?.length || 0)}`)
  console.log(`Watch & Shop: Live=${liveWatch.length} | Source=${dbJson.watchShop?.length || 0} -> MATCHED: ${liveWatch.length === (dbJson.watchShop?.length || 0)}`)
  console.log(`Reviews: Live=${liveReviews.length} (Approved only) | Source=${dbJson.reviews?.length || 0} (10 Approved + 2 Pending)`)

  // Check Product 907
  console.log('\n--- PRODUCT 907 (Ladies Purse Leather) DEEP AUDIT ---')
  const prod907 = (dbJson.products || []).find(p => p.id === 907)
  if (prod907) {
    console.log(`Name: ${prod907.name}`)
    console.log(`Slug: ${prod907.slug}`)
    console.log(`Price: Rs. ${prod907.price} (Old: Rs. ${prod907.oldPrice})`)
    console.log('Variants count:', prod907.variants?.length || 0)
    for (const v of prod907.variants || []) {
      console.log(`- Variant ID ${v.id}: ${v.color} | SKU: ${v.sku} | Price: ${v.price} | Stock: ${v.stock}`)
    }
  }

  // Check Orders
  console.log('\n--- ORDERS & ORDER ITEMS INTEGRITY ---')
  const orders = dbJson.orders || []
  let totalItems = 0
  orders.forEach(o => { if (Array.isArray(o.items)) totalItems += o.items.length })
  console.log(`Total Orders in db.json: ${orders.length}`)
  console.log(`Total Order Items in db.json: ${totalItems}`)
  orders.forEach(o => {
    console.log(`Order ${o.id}: Total=Rs. ${o.total} | Status=${o.status} | Customer=${o.customer?.name || o.name} (${o.customer?.mobile || o.mobile}) | Items=${(o.items || []).length}`)
  })
}

compareLiveWithSource().catch(console.error)
