import fs from 'node:fs'
import crypto from 'node:crypto'

const file = 'backups/live-production-snapshot-2026-11-12T19-55-37-208Z.json'
const raw = fs.readFileSync(file, 'utf8')
const obj = JSON.parse(raw)

// Check different fields to see what produced 0cfad64b5138004e5ce5ce6baefc0aafa7b65d6dca9c76d3079ad2168e6c78d3
const targetHash = obj.metadata.checksum

for (const key of ['data', 'counts']) {
  const h = crypto.createHash('sha256').update(JSON.stringify(obj[key])).digest('hex')
  console.log(`Hash of ${key}:`, h, h === targetHash ? 'MATCH!' : '')
}

const copy = { ...obj }
delete copy.metadata
const hFull = crypto.createHash('sha256').update(JSON.stringify(copy)).digest('hex')
console.log('Hash of full without metadata:', hFull, hFull === targetHash ? 'MATCH!' : '')
