import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

async function inspectSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })

  try {
    console.log('=== INSPECTING ACTUAL SUPABASE POSTGRESQL SCHEMA ===\n')

    // 1. Tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `)
    console.log(`Found ${tablesRes.rows.length} base tables in 'public' schema:`)
    const tableCounts = []
    for (const r of tablesRes.rows) {
      try {
        const cnt = await pool.query(`SELECT count(*) as cnt FROM "${r.table_name}"`)
        tableCounts.push({ table: r.table_name, rows: parseInt(cnt.rows[0].cnt, 10) })
      } catch (err) {
        tableCounts.push({ table: r.table_name, error: err.message })
      }
    }
    console.table(tableCounts)

    // 2. Indexes
    const idxRes = await pool.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `)
    console.log(`\nFound ${idxRes.rows.length} indexes in 'public' schema.`)

    // 3. Foreign Keys
    const fkRes = await pool.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
    `)
    console.log(`\nFound ${fkRes.rows.length} foreign key relationships:`)
    console.table(fkRes.rows)

    // 4. Check RLS policies
    const rlsRes = await pool.query(`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `)
    console.log(`\nRow Level Security Status on Tables:`)
    console.table(rlsRes.rows)

  } catch (err) {
    console.error('Schema inspection error:', err)
  } finally {
    await pool.end()
  }
}

inspectSchema()
