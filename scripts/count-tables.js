import fs from 'node:fs'

const sql = fs.readFileSync('schema.sql', 'utf8')
const matches = [...sql.matchAll(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_]+)/gi)]
console.log('TOTAL TABLES IN SCHEMA.SQL:', matches.length)
matches.forEach((m, i) => console.log(`${i + 1}. ${m[1]}`))
