import fs from 'node:fs'
const env = fs.readFileSync('.env', 'utf8')
const m = env.match(/postgres\.([^:]+):/)
console.log('PROJECT REF:', m ? m[1] : 'not found')
