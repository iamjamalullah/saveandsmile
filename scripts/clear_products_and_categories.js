import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pkg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbJsonPath = path.resolve(__dirname, '../db.json');

async function clearProductsAndCategories() {
  console.log('===============================================================');
  console.log('   CLEAR PRODUCTS & CATEGORIES - SAVE & SMILE CLEAN SLATE     ');
  console.log('===============================================================');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment.');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('[POSTGRES] Connected to PostgreSQL.');

  try {
    await client.query('BEGIN');

    // 1. Clear variant options and variant records (child tables)
    console.log('[CLEAR] Deleting variant images, variants, and options...');
    await client.query('DELETE FROM product_variant_images');
    await client.query('DELETE FROM product_variants');
    await client.query('DELETE FROM product_option_values');
    await client.query('DELETE FROM product_options');

    // 2. Unlink any product_id in watch_shop
    await client.query('UPDATE watch_shop SET product_id = NULL');

    // 3. Clear products
    console.log('[CLEAR] Deleting all products...');
    const prodRes = await client.query('DELETE FROM products');
    console.log(`[CLEAR] Deleted ${prodRes.rowCount} products from PostgreSQL.`);

    // 4. Clear categories
    console.log('[CLEAR] Deleting all categories...');
    const catRes = await client.query('DELETE FROM categories');
    console.log(`[CLEAR] Deleted ${catRes.rowCount} categories from PostgreSQL.`);

    // Reset SERIAL sequences
    await client.query('ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE IF EXISTS categories_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE IF EXISTS product_options_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE IF EXISTS product_option_values_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE IF EXISTS product_variants_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE IF EXISTS product_variant_images_id_seq RESTART WITH 1');

    await client.query('COMMIT');
    console.log('[POSTGRES] Transaction committed successfully.');

    // Verify in PostgreSQL
    const checkProd = await client.query('SELECT COUNT(*)::int AS count FROM products');
    const checkCat = await client.query('SELECT COUNT(*)::int AS count FROM categories');
    console.log(`[VERIFY POSTGRES] Products remaining: ${checkProd.rows[0].count}`);
    console.log(`[VERIFY POSTGRES] Categories remaining: ${checkCat.rows[0].count}`);

    // Update db.json
    console.log('[DB.JSON] Updating db.json to match clean slate...');
    const dbData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
    dbData.products = [];
    dbData.categories = [];
    dbData.product_options = [];
    dbData.product_option_values = [];
    dbData.product_variants = [];
    dbData.product_variant_images = [];

    fs.writeFileSync(dbJsonPath, JSON.stringify(dbData, null, 2), 'utf8');
    console.log('[DB.JSON] db.json updated successfully with empty products & categories.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[ERROR] Failed to clear products and categories:', err);
    throw err;
  } finally {
    await client.end();
  }
}

clearProductsAndCategories()
  .then(() => {
    console.log('\n✓ Products and categories successfully cleared from PostgreSQL and db.json.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
