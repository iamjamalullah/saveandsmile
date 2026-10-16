try {
  require('dotenv').config();
} catch (e) {}

const { neon } = require('@neondatabase/serverless');

const FALLBACK_DB_URL = 'postgresql://neondb_owner:npg_dLxnE4Qfyz3I@ep-dry-heart-avk6e7u4-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require';

let sql = null;

function getDb() {
  const connectionString = process.env.DATABASE_URL || FALLBACK_DB_URL;
  if (!connectionString) {
    return null;
  }
  if (!sql) {
    sql = neon(connectionString);
  }
  return sql;
}

async function getSetting(id, defaultVal = null) {
  const db = getDb();
  if (db) {
    try {
      const rows = await db`SELECT data FROM saveandsmile.settings WHERE id = ${String(id)} LIMIT 1`;
      if (rows && rows.length > 0 && rows[0].data !== undefined && rows[0].data !== null) {
        return rows[0].data;
      }
    } catch (e) {
      console.warn(`[getSetting] Error reading ${id}:`, e.message);
    }
  }
  return defaultVal;
}

async function saveSetting(id, data) {
  const db = getDb();
  if (db) {
    try {
      const payload = JSON.stringify(data);
      await db`
        INSERT INTO saveandsmile.settings (id, data, updated_at)
        VALUES (${String(id)}, ${payload}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = NOW()
      `;
      return true;
    } catch (e) {
      console.warn(`[saveSetting] Error saving ${id}:`, e.message);
      return false;
    }
  }
  return false;
}

module.exports = {
  getDb,
  getSetting,
  saveSetting
};

