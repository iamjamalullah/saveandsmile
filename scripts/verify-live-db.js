require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function inspectCounts() {
  const sql = neon(process.env.DATABASE_URL);

  const pCount = await sql`SELECT count(*) as count FROM products`;
  const cCount = await sql`SELECT count(*) as count FROM categories`;
  const oCount = await sql`SELECT count(*) as count FROM orders`;
  const iCount = await sql`SELECT count(*) as count FROM order_items`;
  const aCount = await sql`SELECT count(*) as count FROM admins`;

  console.log('--- TABLE ROW COUNTS ---');
  console.log(`products: ${pCount[0].count}`);
  console.log(`categories: ${cCount[0].count}`);
  console.log(`orders: ${oCount[0].count}`);
  console.log(`order_items: ${iCount[0].count}`);
  console.log(`admins: ${aCount[0].count}`);
}

inspectCounts();
