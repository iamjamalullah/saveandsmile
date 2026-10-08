try { require('dotenv').config(); } catch (e) {}

const fs = require('fs');
const path = require('path');

let neonSql = null;
let pglite = null;
let mode = null;
let ready = null;

function dataDir() {
  const dir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function init() {
  if (mode) return mode;
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = require('@neondatabase/serverless');
    neonSql = neon(url);
    mode = 'neon';
    return mode;
  }
  const { PGlite } = require('@electric-sql/pglite');
  pglite = new PGlite(path.join(dataDir(), 'commerce'));
  await pglite.waitReady;
  mode = 'pglite';
  return mode;
}

async function query(text, params = []) {
  await init();
  if (mode === 'neon') {
    const result = await neonSql.query(text, params);
    return Array.isArray(result) ? result : (result.rows || []);
  }
  const result = await pglite.query(text, params);
  return result.rows || [];
}

async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

async function ensureSchema() {
  await init();
  const statements = require('./schema');
  for (const sql of statements) {
    await query(sql);
  }
}

function getMode() {
  return mode;
}

module.exports = { init, query, queryOne, ensureSchema, getMode, dataDir };
