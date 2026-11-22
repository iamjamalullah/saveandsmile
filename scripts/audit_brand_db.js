import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()
const { Client } = pg

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  const pRes = await client.query("SELECT id, name, brand, image_main FROM products WHERE image_main LIKE '%qadrigadgets%' OR brand ILIKE '%qadri%'")
  console.log('Products matching qadri:', pRes.rows.length)
  if (pRes.rows.length > 0) console.log(pRes.rows.slice(0, 10))

  const sRes = await client.query("SELECT id, title FROM sections WHERE content_json LIKE '%qadrigadgets%'")
  console.log('Sections matching qadri:', sRes.rows.length)
  if (sRes.rows.length > 0) console.log(sRes.rows)

  const stRes = await client.query("SELECT id, store_name, email FROM store_settings")
  console.log('Store settings:', stRes.rows)

  const staffRes = await client.query("SELECT id, name, email, role FROM staff_accounts")
  console.log('Staff accounts:', staffRes.rows)

  await client.end()
}

run().catch(console.error)
