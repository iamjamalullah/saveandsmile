import http from 'node:http'
import { spawn } from 'node:child_process'

async function testInquiriesAlias() {
  console.log('Testing inquiries route alias...')
  
  // Start server locally on port 4005
  const serverProc = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: '4005', NODE_ENV: 'test' },
    stdio: 'pipe'
  })

  let serverStarted = false

  serverProc.stdout.on('data', data => {
    const msg = data.toString()
    if (msg.includes('http://localhost:4005') || msg.includes('4005')) {
      serverStarted = true
    }
  })

  // Wait for server to boot
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500))
    if (serverStarted) break
  }

  try {
    // 1. Unauthenticated GET /api/inquiries (Should return 401 Unauthorized, NOT 404!)
    const unauthRes = await fetch('http://localhost:4005/api/inquiries')
    console.log(`GET /api/inquiries status: ${unauthRes.status} (Expected: 401)`)
    const unauthBody = await unauthRes.json()
    console.log('Response body:', unauthBody)

    // 2. Unauthenticated GET /api/contacts (Should also return 401 Unauthorized!)
    const contactsRes = await fetch('http://localhost:4005/api/contacts')
    console.log(`GET /api/contacts status: ${contactsRes.status} (Expected: 401)`)

    if (unauthRes.status === 401 && contactsRes.status === 401) {
      console.log('✅ PASS: Both /api/inquiries and /api/contacts behave identically with 401 protection!')
    } else {
      console.error('❌ FAIL: Status mismatch!')
    }
  } catch (err) {
    console.error('Test error:', err.message)
  } finally {
    serverProc.kill()
  }
}

testInquiriesAlias()
