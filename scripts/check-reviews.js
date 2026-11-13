import fs from 'node:fs'

const db = JSON.parse(fs.readFileSync('db.json', 'utf8'))
console.log('TOTAL REVIEWS:', (db.reviews || []).length)
console.log(JSON.stringify(db.reviews || [], null, 2))
