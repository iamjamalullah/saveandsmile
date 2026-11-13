import fs from 'node:fs'
const p = JSON.parse(fs.readFileSync('db.json', 'utf8')).products.find(x => x.id === 907)
console.log(JSON.stringify(p.colorImages, null, 2))
