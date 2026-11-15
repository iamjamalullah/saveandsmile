import fs from 'node:fs'

const BASE = 'https://saveandsmile.vercel.app'

async function runAudit() {
  console.log('=================================================================')
  console.log('   SAVE & SMILE — LIVE PRODUCTION TECHNICAL AUDIT RUNNER         ')
  console.log('=================================================================\n')

  const report = {
    timestamp: new Date().toISOString(),
    endpoints: [],
    security: [],
    performance: {
      latencies: [],
      p50: 0,
      p95: 0,
      p99: 0,
      avg: 0
    },
    counts: {},
    issues: []
  }

  async function check(name, url, options = {}, expectStatus = 200) {
    const t0 = performance.now()
    try {
      const res = await fetch(url, options)
      const durationMs = Math.round(performance.now() - t0)
      report.performance.latencies.push(durationMs)
      const passed = res.status === expectStatus
      let data = null
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        data = await res.json()
      } else {
        data = await res.text()
      }

      const item = {
        name,
        url,
        expected: expectStatus,
        status: res.status,
        durationMs,
        passed,
        headers: {
          contentType: ct,
          xFrameOptions: res.headers.get('x-frame-options'),
          xContentTypeOptions: res.headers.get('x-content-type-options'),
          xXssProtection: res.headers.get('x-xss-protection'),
          strictTransportSecurity: res.headers.get('strict-transport-security')
        },
        dataSummary: Array.isArray(data) ? `Array[${data.length}]` : typeof data === 'object' ? Object.keys(data || {}) : String(data).slice(0, 80)
      }

      report.endpoints.push(item)
      console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} -> status: ${res.status} (expected ${expectStatus}), ${durationMs}ms`)
      return { item, data }
    } catch (err) {
      console.log(`[ERROR] ${name} -> ${err.message}`)
      report.endpoints.push({ name, url, error: err.message, passed: false })
      return { item: null, data: null }
    }
  }

  // 1. Health & DB Engine
  console.log('--- 1. AUDITING BACKEND & DATABASE HEALTH ---')
  const { data: healthData } = await check('API Health Ping', `${BASE}/api/health`)
  if (healthData) {
    report.counts.dbStatus = healthData.status
    report.counts.dbEngine = healthData.engine
    console.log(`   Database: ${healthData.database} (${healthData.engine})`)
  }

  // 2. Public Catalog & Content
  console.log('\n--- 2. AUDITING PUBLIC E-COMMERCE ENDPOINTS ---')
  const { data: productsData } = await check('Products Catalog', `${BASE}/api/products`)
  if (Array.isArray(productsData)) report.counts.totalProducts = productsData.length

  const { data: categoriesData } = await check('Categories List', `${BASE}/api/categories`)
  if (Array.isArray(categoriesData)) report.counts.totalCategories = categoriesData.length

  const { data: settingsData } = await check('Store Settings', `${BASE}/api/settings`)
  const { data: sectionsData } = await check('Homepage Sections', `${BASE}/api/sections`)
  const { data: heroData } = await check('Hero Slides', `${BASE}/api/heroSlides`)
  const { data: reviewsData } = await check('Customer Reviews', `${BASE}/api/reviews`)
  const { data: releaseData } = await check('Mobile Release Info', `${BASE}/api/mobile/releases/latest`)

  // 3. Security & RBAC Guard
  console.log('\n--- 3. AUDITING SECURITY & ROUTE ACCESS CONTROL ---')
  await check('Orders Unauthenticated (401 Expected)', `${BASE}/api/orders`, {}, 401)
  await check('Releases History Unauthenticated (401 Expected)', `${BASE}/api/mobile/releases`, {}, 401)
  await check('Cleanup Status Unauthenticated (401 Expected)', `${BASE}/api/cleanup-status`, {}, 401)

  // 4. Admin Authentication & Bearer Tokens
  console.log('\n--- 4. AUDITING STAFF AUTHENTICATION & LOGIN ---')
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  })
  const loginData = await loginRes.json()
  const loginPassed = loginRes.status === 200 && !!loginData.token
  console.log(`[${loginPassed ? 'PASS' : 'FAIL'}] Admin Login -> status: ${loginRes.status}, token: ${loginData.token ? 'JWT Issued' : 'None'}`)

  if (loginData.token) {
    const authHeaders = {
      'Authorization': `Bearer ${loginData.token}`,
      'Content-Type': 'application/json'
    }

    console.log('\n--- 5. AUDITING PROTECTED ADMIN OPERATIONS ---')
    const { data: ordersData } = await check('Authorized Orders List', `${BASE}/api/orders`, { headers: authHeaders })
    if (Array.isArray(ordersData)) {
      report.counts.totalOrders = ordersData.length
      console.log(`   Total Historical Orders in DB: ${ordersData.length}`)
    }

    const { data: inqData } = await check('Authorized Customer Inquiries', `${BASE}/api/inquiries`, { headers: authHeaders })
    if (Array.isArray(inqData)) report.counts.totalInquiries = inqData.length

    const { data: couponsData } = await check('Authorized Coupons List', `${BASE}/api/coupons`, { headers: authHeaders })
    if (Array.isArray(couponsData)) report.counts.totalCoupons = couponsData.length
  }

  // 6. Latency Calculations
  const lats = report.performance.latencies.sort((a, b) => a - b)
  if (lats.length > 0) {
    report.performance.avg = Math.round(lats.reduce((a, b) => a + b, 0) / lats.length)
    report.performance.p50 = lats[Math.floor(lats.length * 0.5)]
    report.performance.p95 = lats[Math.floor(lats.length * 0.95)]
    report.performance.p99 = lats[lats.length - 1]
  }

  console.log('\n=================================================================')
  console.log('   LATENCY & BENCHMARK PROFILE')
  console.log('=================================================================')
  console.log(`Average Latency: ${report.performance.avg} ms`)
  console.log(`p50 Latency:     ${report.performance.p50} ms`)
  console.log(`p95 Latency:     ${report.performance.p95} ms`)
  console.log(`p99 Latency:     ${report.performance.p99} ms`)
  console.log(`Total Products:  ${report.counts.totalProducts || 0}`)
  console.log(`Total Orders:    ${report.counts.totalOrders || 0}`)
  console.log(`DB Engine:       ${report.counts.dbEngine || 'Unknown'}`)
  console.log('=================================================================\n')

  fs.writeFileSync('scripts/audit_output.json', JSON.stringify(report, null, 2))
}

runAudit().catch(console.error)
