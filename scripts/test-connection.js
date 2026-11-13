// Quick Supabase connection test
import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

async function testConnection() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.log('❌ DATABASE_URL not found in .env')
    process.exit(1)
  }
  
  console.log('✅ DATABASE_URL found in .env')
  console.log('🔄 Supabase se connect ho rahe hain...')
  
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
  
  try {
    const res = await pool.query('SELECT 1 as ping')
    console.log('✅ Supabase PostgreSQL se connection SUCCESSFUL!')
    console.log('✅ Database ready hai!')
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.log('❌ Connection FAILED:', err.message)
    await pool.end()
    process.exit(1)
  }
}

testConnection()
