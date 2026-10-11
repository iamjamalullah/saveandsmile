const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Files to copy to dist
const filesToCopy = [
  'index.html',
  'cart.html',
  'checkout.html',
  'product-detail.html',
  'track-order.html',
  'admin.html',
  'live-editor.html',
  'products.json'
];

for (const file of filesToCopy) {
  const src = path.join(rootDir, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

// Folders to copy to dist
const foldersToCopy = ['css', 'js', 'images'];
for (const folder of foldersToCopy) {
  const src = path.join(rootDir, folder);
  const dest = path.join(distDir, folder);
  if (fs.existsSync(src)) {
    copyRecursiveSync(src, dest);
  }
}

// Generate static sitemap.xml and robots.txt in dist/
const domain = 'https://saveandsmile.pk';
const now = new Date().toISOString().split('T')[0];
let productsList = [];
try {
  productsList = JSON.parse(fs.readFileSync(path.join(rootDir, 'products.json'), 'utf8'));
} catch (e) {}

let sitemapContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
sitemapContent += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
sitemapContent += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
sitemapContent += `  <url>\n    <loc>${domain}/</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
sitemapContent += `  <url>\n    <loc>${domain}/track-order</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
sitemapContent += `  <url>\n    <loc>${domain}/shipping-policy</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
sitemapContent += `  <url>\n    <loc>${domain}/return-policy</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;

const defaultCats = ['storage', 'kitchen', 'bottles', 'beauty', 'accessories', 'travel', 'cleaning', 'massager'];
defaultCats.forEach(c => {
  sitemapContent += `  <url>\n    <loc>${domain}/?cat=${c}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
});

productsList.forEach(p => {
  const slug = p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : `product-${p.id}`;
  sitemapContent += `  <url>\n    <loc>${domain}/product-detail?id=${p.id}&amp;slug=${encodeURIComponent(slug)}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n`;
  if (p.image) {
    sitemapContent += `    <image:image>\n      <image:loc>${p.image}</image:loc>\n      <image:title>${(p.title || 'Product').replace(/[<>&'"]/g, '')}</image:title>\n    </image:image>\n`;
  }
  sitemapContent += `  </url>\n`;
});

sitemapContent += '</urlset>';
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent, 'utf8');

const robotsContent = `# Save & Smile Pakistan Search Engine Robots Directives
User-agent: *
Allow: /
Allow: /images/
Allow: /css/
Allow: /js/
Disallow: /admin
Disallow: /admin.html
Disallow: /live-editor
Disallow: /live-editor.html
Disallow: /api/auth
Disallow: /api/orders
Disallow: /checkout
Disallow: /cart

# XML Sitemap
Sitemap: ${domain}/sitemap.xml
`;
fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsContent, 'utf8');

console.log('✅ Static storefront + sitemap.xml + robots.txt successfully generated in dist directory with 100% original design intact!');
