require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

async function seedAllProducts() {
  const sql = neon(process.env.DATABASE_URL);
  const products = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'products.json'), 'utf8'));

  console.log(`Seeding ${products.length} catalog products to Neon PostgreSQL...`);

  for (const p of products) {
    await sql`
      INSERT INTO products (
        id, title, description, code, category, tab, price, original_price,
        rating, reviews, badge, image, stock, is_flash_sale
      )
      VALUES (
        ${p.id}, ${p.title}, ${p.description || ''}, ${p.code || ''},
        ${p.category || 'storage'}, ${p.tab || 'storage'}, ${p.price},
        ${p.originalPrice || null}, ${p.rating || 4.8}, ${p.reviews || 50},
        ${p.badge || 'NEW'}, ${p.image}, ${p.stock || 100}, ${Boolean(p.isFlashSale)}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        price = EXCLUDED.price,
        code = EXCLUDED.code,
        image = EXCLUDED.image,
        stock = EXCLUDED.stock;
    `;
  }

  const countRes = await sql`SELECT count(*) as total FROM products`;
  console.log(`✅ Total products in Neon: ${countRes[0].total}`);
}

seedAllProducts().catch(console.error);
