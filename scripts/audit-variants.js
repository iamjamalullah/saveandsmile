import fs from 'node:fs'

const db = JSON.parse(fs.readFileSync('db.json', 'utf8'))

const variantProducts = (db.products || []).filter(p => p.hasVariants || (p.variants && p.variants.length > 0))
console.log('Total products with variants:', variantProducts.length)

variantProducts.forEach(p => {
  console.log(`\nProduct ID: ${p.id} | Name: ${p.name} | SKU: ${p.sku}`)
  console.log('Options:', JSON.stringify(p.options || []))
  console.log('Variants count:', (p.variants || []).length)
  ;(p.variants || []).forEach(v => {
    console.log(`  - Variant ID: ${v.id} | SKU: ${v.sku} | Title: ${v.title} | Color: ${v.color} | Size: ${v.size} | Price: ${v.price} | OldPrice: ${v.oldPrice} | Stock: ${v.stock}`)
  })
  console.log('ColorImages count:', (p.colorImages || []).length)
  ;(p.colorImages || []).forEach(ci => {
    console.log(`  - Color: ${ci.color || ci.colorName} | Images: ${(ci.images || []).length} | Primary: ${ci.primaryImage}`)
  })
})
