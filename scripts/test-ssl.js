import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

async function testSslOptions() {
  const dbUrl = process.env.DATABASE_URL
  console.log('--- Testing SSL configs ---')

  // Test 1: ssl: true (Default Node.js trusted root CAs)
  try {
    const p1 = new Pool({
      connectionString: dbUrl,
      ssl: true,
      connectionTimeoutMillis: 10000,
    })
    const res = await p1.query('SELECT 1 as ping')
    console.log('Result 1 (ssl: true): SUCCESS! Verified server certificate via system CA trust store.')
    await p1.end()
  } catch (err) {
    console.log('Result 1 (ssl: true) FAILED:', err.message)
  }

  // Test 2: ssl: { rejectUnauthorized: true }
  try {
    const p2 = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: true },
      connectionTimeoutMillis: 10000,
    })
    const res2 = await p2.query('SELECT 1 as ping')
    console.log('Result 2 (ssl: { rejectUnauthorized: true }): SUCCESS! Enforced strict TLS validation.')
    await p2.end()
  } catch (err) {
    console.log('Result 2 (rejectUnauthorized: true) FAILED:', err.message)
  }
}

testSslOptions()
