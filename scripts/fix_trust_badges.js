import dotenv from 'dotenv'
import pg from 'pg'
import fs from 'fs'

dotenv.config()
const { Client } = pg

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  const res = await client.query("SELECT id, block_type, content_json FROM sections WHERE block_type = 'trust_bar' OR content_json LIKE '%Support 24/7%'")
  console.log(`Found ${res.rows.length} trust bar sections in Postgres`)

  for (const row of res.rows) {
    let content = typeof row.content_json === 'string' ? JSON.parse(row.content_json) : row.content_json
    if (content.trust_bar && Array.isArray(content.trust_bar.items)) {
      content.trust_bar.items = [
        { title: 'Support 24/7', image: '/images/trust/support-24-7.svg', subtitle: 'Live customer support' },
        { title: 'Best Prices', image: '/images/trust/best-prices.svg', subtitle: 'Direct wholesale rates' },
        { title: 'Secure Payment', image: '/images/trust/secure-payment.svg', subtitle: '100% Cash on Delivery' }
      ]
      await client.query("UPDATE sections SET content_json = $1 WHERE id = $2", [JSON.stringify(content), row.id])
      console.log(`Updated section ${row.id} trust_bar.items to clean SVGs`)
    }
  }

  await client.end()

  // Also fix db.json
  const dbPath = './db.json'
  if (fs.existsSync(dbPath)) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
    let changed = false
    if (Array.isArray(db.sections)) {
      for (const s of db.sections) {
        if (s.blockType === 'trust_bar' || (s.content && s.content.trust_bar)) {
          if (s.content && s.content.trust_bar && Array.isArray(s.content.trust_bar.items)) {
            s.content.trust_bar.items = [
              { title: 'Support 24/7', image: '/images/trust/support-24-7.svg', subtitle: 'Live customer support' },
              { title: 'Best Prices', image: '/images/trust/best-prices.svg', subtitle: 'Direct wholesale rates' },
              { title: 'Secure Payment', image: '/images/trust/secure-payment.svg', subtitle: '100% Cash on Delivery' }
            ]
            changed = true
          }
        }
      }
    }
    if (changed) {
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8')
      console.log('Updated db.json trust_bar items to clean SVGs')
    }
  }
}

run().catch(console.error)
