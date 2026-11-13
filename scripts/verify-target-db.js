// Supabase target database verification - check all tables for existing records
import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

async function verifyTarget() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.log('ERROR: DATABASE_URL not found')
    process.exit(1)
  }

  // Identify provider without exposing credentials
  let provider = 'Unknown'
  if (dbUrl.includes('supabase.com')) provider = 'Supabase'
  else if (dbUrl.includes('neon.tech')) provider = 'Neon'
  else if (dbUrl.includes('localhost')) provider = 'Local PostgreSQL'
  
  const isPooler = dbUrl.includes('pooler.')
  const hasSSL = dbUrl.includes('sslmode=') || true // SSL is default for cloud
  const port = dbUrl.match(/:(\d+)\//)?.[1] || 'default'
  
  console.log('=== DATABASE PROVIDER VERIFICATION ===')
  console.log('Provider:', provider)
  console.log('Connection Type:', isPooler ? 'Transaction Pooler (PgBouncer)' : 'Direct')
  console.log('Port:', port)
  console.log('SSL:', 'Enabled (rejectUnauthorized: false)')
  console.log('')

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    // Test connection
    const pingRes = await pool.query('SELECT version()')
    console.log('PostgreSQL Version:', pingRes.rows[0].version.split(',')[0])
    console.log('')

    // Check all 18 schema tables
    const tables = [
      'staff_accounts', 'categories', 'products', 'product_options',
      'product_option_values', 'product_variants', 'product_variant_images',
      'customers', 'orders', 'order_items', 'coupons', 'reviews',
      'contact_inquiries', 'store_settings', 'hero_slides', 'sections',
      'homepage_section_versions', 'homepage_draft', 'watch_shop',
      'idempotency_keys', 'revoked_tokens'
    ]

    console.log('=== TARGET DATABASE TABLE STATUS ===')
    console.log('Table Name                    | Exists | Row Count | Status')
    console.log('------------------------------|--------|-----------|-------')

    for (const table of tables) {
      try {
        const res = await pool.query(`SELECT COUNT(*) as cnt FROM ${table}`)
        const count = parseInt(res.rows[0].cnt)
        const status = count === 0 ? 'EMPTY (Ready for INSERT)' : `HAS ${count} RECORDS (CONFLICT CHECK NEEDED)`
        console.log(`${table.padEnd(30)}| YES    | ${String(count).padEnd(10)}| ${status}`)
      } catch (err) {
        if (err.message.includes('does not exist')) {
          console.log(`${table.padEnd(30)}| NO     | N/A       | TABLE MISSING (Will be created by schema.sql)`)
        } else {
          console.log(`${table.padEnd(30)}| ERROR  | N/A       | ${err.message}`)
        }
      }
    }

    // Check sequences
    console.log('')
    console.log('=== SEQUENCE STATUS ===')
    const seqTables = ['categories', 'products', 'order_items', 'coupons', 'hero_slides', 
                       'staff_accounts', 'product_options', 'product_option_values', 
                       'product_variants', 'product_variant_images', 'watch_shop',
                       'homepage_section_versions']
    
    for (const t of seqTables) {
      try {
        const seqRes = await pool.query(`SELECT pg_get_serial_sequence('${t}', 'id') as seq`)
        const seqName = seqRes.rows[0]?.seq
        if (seqName) {
          const valRes = await pool.query(`SELECT last_value, is_called FROM ${seqName}`)
          console.log(`${t}: sequence=${seqName}, last_value=${valRes.rows[0].last_value}, is_called=${valRes.rows[0].is_called}`)
        }
      } catch (err) {
        console.log(`${t}: sequence check skipped (${err.message.substring(0, 50)})`)
      }
    }

    // Check unique constraints
    console.log('')
    console.log('=== UNIQUE CONSTRAINTS ===')
    try {
      const constraintRes = await pool.query(`
        SELECT tc.table_name, tc.constraint_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
      `)
      for (const row of constraintRes.rows) {
        console.log(`${row.table_name}.${row.column_name} → UNIQUE (${row.constraint_name})`)
      }
    } catch (err) {
      console.log('Could not query constraints:', err.message)
    }

    // Check foreign keys
    console.log('')
    console.log('=== FOREIGN KEY CONSTRAINTS ===')
    try {
      const fkRes = await pool.query(`
        SELECT
          tc.table_name AS child_table,
          kcu.column_name AS child_column,
          ccu.table_name AS parent_table,
          ccu.column_name AS parent_column,
          rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name
      `)
      for (const row of fkRes.rows) {
        console.log(`${row.child_table}.${row.child_column} → ${row.parent_table}.${row.parent_column} (ON DELETE ${row.delete_rule})`)
      }
    } catch (err) {
      console.log('Could not query foreign keys:', err.message)
    }

  } catch (err) {
    console.log('CONNECTION ERROR:', err.message)
  } finally {
    await pool.end()
  }
}

verifyTarget()
