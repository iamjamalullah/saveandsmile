import 'dotenv/config'
import { query } from '../src/db/index.js'

async function checkStatus() {
  try {
    const res = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    console.log('PUBLIC TABLES IN SUPABASE:', res.rows.map(r => r.table_name))
  } catch (err) {
    console.error('ERROR:', err.message)
  }
  process.exit(0)
}

checkStatus()
