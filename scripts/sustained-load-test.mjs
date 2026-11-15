import http from 'node:http'
import { spawn } from 'node:child_process'

async function runSustainedLoadTest() {
  console.log('===============================================================')
  console.log('   SAVE & SMILE — SUSTAINED STAGING LOAD TEST (500 REQUESTS)')
  console.log('===============================================================')

  const PORT = 4007
  const serverProc = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
    stdio: 'pipe',
  })

  let ready = false
  serverProc.stdout.on('data', d => {
    if (d.toString().includes(String(PORT))) ready = true
  })

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 400))
    if (ready) break
  }

  const BASE_URL = `http://localhost:${PORT}`
  const TOTAL_REQUESTS = 500
  const CONCURRENCY = 50

  const endpoints = [
    '/api/products',
    '/api/categories',
    '/api/products/1',
    '/api/sections',
    '/api/heroSlides',
  ]

  console.log(`Executing ${TOTAL_REQUESTS} requests across ${CONCURRENCY} concurrent workers...`)
  const startTime = Date.now()
  const latencies = []
  let successCount = 0
  let failedCount = 0

  let index = 0
  const worker = async (workerId) => {
    while (index < TOTAL_REQUESTS) {
      const currentIdx = index++
      if (currentIdx >= TOTAL_REQUESTS) break

      const endpoint = endpoints[currentIdx % endpoints.length]
      const reqStart = Date.now()
      try {
        const res = await fetch(`${BASE_URL}${endpoint}`)
        const dur = Date.now() - reqStart
        latencies.push(dur)
        if (res.status >= 200 && res.status < 400) {
          successCount++
        } else {
          failedCount++
        }
      } catch (err) {
        failedCount++
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }).map((_, id) => worker(id))
  await Promise.all(workers)

  const totalTimeSeconds = (Date.now() - startTime) / 1000
  latencies.sort((a, b) => a - b)

  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0
  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) || 0
  const rps = (TOTAL_REQUESTS / totalTimeSeconds).toFixed(1)
  const errorRate = ((failedCount / TOTAL_REQUESTS) * 100).toFixed(2)

  console.log('\n--- SUSTAINED LOAD TEST RESULTS ---')
  console.log(`Total Requests Executed: ${TOTAL_REQUESTS}`)
  console.log(`Sustained Concurrency:   ${CONCURRENCY} concurrent workers`)
  console.log(`Total Test Duration:     ${totalTimeSeconds.toFixed(2)} seconds`)
  console.log(`Throughput:              ${rps} requests/second`)
  console.log(`Successful Requests:     ${successCount}`)
  console.log(`Failed Requests:         ${failedCount}`)
  console.log(`Error Rate:              ${errorRate}%`)
  console.log(`Average Latency:         ${avg} ms`)
  console.log(`p50 (Median Latency):    ${p50} ms`)
  console.log(`p95 Latency:             ${p95} ms`)
  console.log(`p99 Latency:             ${p99} ms`)
  console.log('===============================================================')

  serverProc.kill()
}

runSustainedLoadTest()
