import fs from 'node:fs'

const db = JSON.parse(fs.readFileSync('db.json', 'utf8'))
const BASE_URL = 'https://saveandsmile.vercel.app'
const today = new Date().toISOString().split('T')[0]

const staticRoutes = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/shop', priority: '0.9', changefreq: 'daily' },
  { loc: '/bulk-order', priority: '0.8', changefreq: 'weekly' },
  { loc: '/reviews', priority: '0.7', changefreq: 'weekly' },
  { loc: '/about-us', priority: '0.6', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.6', changefreq: 'monthly' },
  { loc: '/support', priority: '0.5', changefreq: 'monthly' },
  { loc: '/terms-conditions', priority: '0.3', changefreq: 'yearly' },
  { loc: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
]

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`

// Static Pages
for (const r of staticRoutes) {
  xml += `  <url>
    <loc>${BASE_URL}${r.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>
`
}

// Categories
for (const c of db.categories || []) {
  xml += `  <url>
    <loc>${BASE_URL}/category/${encodeURIComponent(c.slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
`
}

// Products
for (const p of db.products || []) {
  const imgTag = p.image ? `
    <image:image>
      <image:loc>${p.image.startsWith('http') ? p.image : `${BASE_URL}${p.image}`}</image:loc>
      <image:title><![CDATA[${p.name}]]></image:title>
    </image:image>` : ''

  xml += `  <url>
    <loc>${BASE_URL}/product/${encodeURIComponent(p.slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>${imgTag}
  </url>
`
}

xml += `</urlset>\n`

fs.writeFileSync('public/sitemap.xml', xml, 'utf8')
console.log('Successfully generated public/sitemap.xml with', staticRoutes.length + (db.categories || []).length + (db.products || []).length, 'URLs.')
