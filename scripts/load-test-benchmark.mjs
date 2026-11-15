import http from 'node:http'
import { spawn } from 'node:child_process'

async function runControlledBenchmark() {
  console.log('===============================================================')
  console.log('   SAVE & SMILE — CONTROLLED LOCAL LOAD BENCHMARK (300 ORD/DAY)')
  console.log('===============================================================')

  const PORT = 4006
  const serverProc = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
    stdio: 'pipe',
  })

  let serverReady = false
  serverProc.stdout.on('data', d => {
    if (d.toString().includes(String(PORT))) serverReady = true
  })

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 400))
    if (serverReady) break
  }

  const BASE_URL = `http://localhost:${PORT}`

  // Helper to execute batch concurrent requests
  async function testConcurrency(concurrencyLevel, endpoint, label) {
    console.log(`\n--- Testing ${concurrencyLevel} Concurrent Requests: [${label}] ---`)
    const startTime = Date.now()
    const latencies = []
    let failed = 0
    let success = 0

    const tasks = Array.from({ length: concurrencyLevel }).map(async () => {
      const reqStart = Date.now()
      try {
        const res = await fetch(`${BASE_URL}${endpoint}`)
        const dur = Date.now() - reqStart
        latencies.push(dur)
        if (res.status >= 200 && res.status < 400) {
          success++
        } else {
          failed++
        }
      } catch (err) {
        failed++
      }
    })

    await Promise.all(tasks)
    const totalTime = (Date.now() - startTime) / 1000

    latencies.sort((a, b) => a - b)
    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0
    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) || 0
    const rps = (concurrencyLevel / totalTime).toFixed(1)

    console.log(`   Success: ${success} | Failed: ${failed} | Total Duration: ${totalTime.toFixed(2)}s`)
    console.log(`   RPS: ${rps} req/sec`)
    console.log(`   Latency: Avg=${avg}ms | p50=${p50}ms | p95=${p95}ms | p99=${p99}ms`)

    return { concurrencyLevel, label, success, failed, rps, avg, p50, p95, p99 }
  }

  try {
    const results = []
    // 1. Browsing Catalog (25 concurrent)
    results.push(await testConcurrency(25, '/api/products', 'Catalog Browse'))
    // 2. Browsing Categories (25 concurrent)
    results.push(await testConcurrency(25, '/api/categories', 'Categories List'))
    // 3. Search & Product Details (50 concurrent)
    results.push(await testConcurrency(50, '/api/products/1', 'Product Details'))
    // 4. Hero & Dynamic Sections (50 concurrent)
    results.push(await testConcurrency(50, '/api/sections', 'Homepage Sections'))
    // 5. Stress Concurrency (100 concurrent)
    results.push(await testConcurrency(100, '/api/heroSlides', 'High Concurrency Peak'))

    console.log('\n===============================================================')
    console.log('   BENCHMARK SUMMARY RESULTS TABLE')
    console.log('===============================================================')
    console.table(results)

  } catch (err) {
    console.error('Benchmark error:', err)
  } finally {
    serverProc.kill()
  }
}

runControlledBenchmark()
