require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL is not defined in .env or environment variables.');
    console.log('👉 Please set DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require');
    process.exit(1);
  }

  console.log('🚀 Connecting to Neon PostgreSQL...');
  const sql = neon(dbUrl);

  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📦 Executing schema.sql migration...');
    // Split statements by semicolon where appropriate or execute blocks
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.length > 5) {
        await sql(statement);
      }
    }

    const countResult = await sql`SELECT count(*) as count FROM products`;
    console.log(`✅ Successfully seeded Neon database!`);
    console.log(`📊 Total products in database: ${countResult[0].count}`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

seed();
