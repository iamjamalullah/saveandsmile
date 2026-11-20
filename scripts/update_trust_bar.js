import dotenv from 'dotenv'
import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'

dotenv.config()

const { Client } = pg

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  const res = await client.query('SELECT * FROM sections WHERE id = $1', ['sec-trust-bar'])
  if (res.rows.length > 0) {
    let content = typeof res.rows[0].content_json === 'string' 
      ? JSON.parse(res.rows[0].content_json) 
      : res.rows[0].content_json

    content.trust_bar = {
      heading: '',
      bgColor: 'transparent',
      textColor: '#1e293b',
      items: [
        {
          title: 'Support 24/7',
          image: '/images/trust/support-24-7.svg',
          subtitle: 'Live customer support'
        },
        {
          title: 'Best Prices',
          image: '/images/trust/best-prices.svg',
          subtitle: 'Direct wholesale rates'
        },
        {
          title: 'Secure Payment',
          image: '/images/trust/secure-payment.svg',
          subtitle: '100% Cash on Delivery'
        }
      ]
    }

    await client.query(
      'UPDATE sections SET content_json = $1 WHERE id = $2',
      [JSON.stringify(content), 'sec-trust-bar']
    )
    console.log('PostgreSQL sec-trust-bar updated successfully!')
  } else {
    console.log('sec-trust-bar row not found in PostgreSQL')
  }

  await client.end()

  const dbPath = path.resolve('db.json')
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  if (db.homepage_sections) {
    const sec = db.homepage_sections.find(s => s.id === 'sec-trust-bar')
    if (sec && sec.content && sec.content.trust_bar) {
      sec.content.trust_bar.items = [
        {
          title: 'Support 24/7',
          image: '/images/trust/support-24-7.svg',
          subtitle: 'Live customer support'
        },
        {
          title: 'Best Prices',
          image: '/images/trust/best-prices.svg',
          subtitle: 'Direct wholesale rates'
        },
        {
          title: 'Secure Payment',
          image: '/images/trust/secure-payment.svg',
          subtitle: '100% Cash on Delivery'
        }
      ]
    }
  }
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8')
  console.log('db.json sec-trust-bar updated successfully!')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
