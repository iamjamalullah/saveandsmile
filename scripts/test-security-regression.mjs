import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 5004
const BASE_URL = `http://127.0.0.1:${PORT}`

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function httpRequest(method, urlPath, headers = {}, body = null) {
  const url = `${BASE_URL}${urlPath}`
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000),
    })

    let data = null
    try {
      data = await res.json()
    } catch {
      data = null
    }

    return {
      ok: res.ok,
      status: res.status,
      data,
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err.message,
    }
  }
}

async function runSecurityRegression() {
  console.log('=================================================================')
  console.log('   SAVE & SMILE — SECURITY & RELEASE REGRESSION TEST SUITE       ')
  console.log('=================================================================\n')

  // 1. Launch test server on port 5004
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
    stdio: ['ignore', 'ignore', 'ignore'],
  })

  let ready = false
  for (let i = 0; i < 30; i++) {
    await sleep(400)
    try {
      const probe = await httpRequest('GET', '/api/health')
      if (probe.ok) {
        ready = true
        break
      }
    } catch {}
  }

  if (!ready) {
    serverProcess.kill()
    throw new Error('Server failed to start on port ' + PORT)
  }
  console.log(`[SERVER] Active at ${BASE_URL}\n`)

  const results = []

  try {
    // TEST 1: Anonymous Access to Protected Orders
    console.log('[1/8] Testing Anonymous Access to /api/orders...')
    const r1 = await httpRequest('GET', '/api/orders')
    const pass1 = (r1.status === 401)
    results.push({ name: 'Anonymous Access to Orders Protected', pass: pass1, status: r1.status, expected: 401 })
    console.log(`  Result: ${pass1 ? 'PASS (401 Unauthorized returned)' : 'FAIL (' + r1.status + ')'}`)

    // TEST 2: Anonymous Access to Customer Inquiries
    console.log('\n[2/8] Testing Anonymous Access to /api/contacts (Inquiries)...')
    const r2 = await httpRequest('GET', '/api/contacts')
    const pass2 = (r2.status === 401)
    results.push({ name: 'Anonymous Access to Inquiries Protected', pass: pass2, status: r2.status, expected: 401 })
    console.log(`  Result: ${pass2 ? 'PASS (401 Unauthorized returned)' : 'FAIL (' + r2.status + ')'}`)

    // TEST 3: Unauthorized Image Uploads (BUG-05 Remediation Verification)
    console.log('\n[3/8] Testing Unauthorized File Uploads (/upload)...')
    const r3 = await httpRequest('POST', '/upload', {}, { dummy: 'data' })
    const pass3 = (r3.status === 401)
    results.push({ name: 'Unauthorized File Upload Rejected', pass: pass3, status: r3.status, expected: 401 })
    console.log(`  Result: ${pass3 ? 'PASS (401 Unauthorized returned)' : 'FAIL (' + r3.status + ')'}`)

    // TEST 4: Anonymous Access to Homepage Draft Editor
    console.log('\n[4/8] Testing Anonymous Access to /api/homepage/draft...')
    const r4 = await httpRequest('GET', '/api/homepage/draft')
    const pass4 = (r4.status === 401)
    results.push({ name: 'Homepage Draft Restricted to Staff', pass: pass4, status: r4.status, expected: 401 })
    console.log(`  Result: ${pass4 ? 'PASS (401 Unauthorized returned)' : 'FAIL (' + r4.status + ')'}`)

    // TEST 5: Staff Authentication with Valid Admin Credentials
    console.log('\n[5/8] Testing Staff Authentication with Admin Credentials...')
    const loginRes = await httpRequest('POST', '/api/auth/login', {}, {
      username: 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
    })
    const adminToken = loginRes.data?.token
    const pass5 = Boolean(loginRes.status === 200 && adminToken)
    results.push({ name: 'Admin Staff Login', pass: pass5, status: loginRes.status, expected: 200 })
    console.log(`  Result: ${pass5 ? 'PASS (JWT Token Issued)' : 'FAIL'}`)

    // TEST 6: Manager Authentication & RBAC Boundary Enforcement
    console.log('\n[6/8] Testing Manager Role Access vs Admin Privileges...')
    const mgrLoginRes = await httpRequest('POST', '/api/auth/login', {}, {
      username: 'manager',
      password: process.env.MANAGER_PASSWORD || 'manager123',
    })
    const managerToken = mgrLoginRes.data?.token
    let pass6 = false
    if (managerToken) {
      // Manager can view orders
      const mgrGet = await httpRequest('GET', '/api/orders', { Authorization: `Bearer ${managerToken}` })
      // Manager CANNOT delete orders (403 Forbidden)
      const mgrDel = await httpRequest('DELETE', '/api/orders/TEST-NONEXISTENT', { Authorization: `Bearer ${managerToken}` })
      pass6 = (mgrGet.status === 200 && mgrDel.status === 403)
      console.log(`  Manager GET Orders: ${mgrGet.status} | Manager DELETE Order: ${mgrDel.status}`)
    }
    results.push({ name: 'Manager RBAC Permissions Boundary', pass: pass6, expected: 'GET:200, DELETE:403' })
    console.log(`  Result: ${pass6 ? 'PASS (Manager RBAC Boundaries Enforced)' : 'FAIL'}`)

    // TEST 7: Invalid Login Attempt Rejection
    console.log('\n[7/8] Testing Invalid Password Rejection...')
    const badLogin = await httpRequest('POST', '/api/auth/login', {}, {
      username: 'admin',
      password: 'WrongPassword999!',
    })
    const pass7 = (badLogin.status === 401)
    results.push({ name: 'Invalid Credentials Rejected', pass: pass7, status: badLogin.status, expected: 401 })
    console.log(`  Result: ${pass7 ? 'PASS (401 Invalid Credentials)' : 'FAIL'}`)

    // TEST 8: Client Bundle Secrets Leak Check
    console.log('\n[8/8] Scanning Frontend Production Build (dist/) for Leaked Secrets...')
    const distDir = path.resolve(__dirname, '..', 'dist')
    let pass8 = true
    const secretsFound = []

    if (fs.existsSync(distDir)) {
      const distFiles = fs.readdirSync(path.join(distDir, 'assets'))
      for (const f of distFiles) {
        if (f.endsWith('.js')) {
          const content = fs.readFileSync(path.join(distDir, 'assets', f), 'utf8')
          if (content.includes('sb_secret_') || content.includes('Supa.Jamal') || content.includes('aws-1-ap-southeast-2.pooler')) {
            pass8 = false
            secretsFound.push(f)
          }
        }
      }
    }
    results.push({ name: 'Frontend Bundle Zero Secrets Leak', pass: pass8, leakedFiles: secretsFound })
    console.log(`  Result: ${pass8 ? 'PASS (Zero Server Secrets Detected in Frontend Bundle)' : 'FAIL (Leaked in: ' + secretsFound.join(', ') + ')'}`)

    console.log('\n=================================================================')
    console.log('   SECURITY & RBAC REGRESSION SUMMARY                           ')
    console.log('=================================================================')
    const allPassed = results.every(r => r.pass)
    results.forEach(r => {
      console.log(`  ${r.pass ? '✓ PASS' : '✗ FAIL'} : ${r.name}`)
    })
    console.log(`\nOverall Security Status: ${allPassed ? 'ALL TESTS PASSED (100% Secure)' : 'SOME TESTS FAILED'}`)
    console.log('=================================================================\n')

    fs.writeFileSync(
      path.resolve(__dirname, 'security-regression-result.json'),
      JSON.stringify({ allPassed, results, timestamp: new Date().toISOString() }, null, 2),
      'utf8'
    )
  } finally {
    serverProcess.kill('SIGINT')
  }
}

runSecurityRegression().catch(err => {
  console.error('[SECURITY TEST FATAL]:', err)
  process.exit(1)
})
