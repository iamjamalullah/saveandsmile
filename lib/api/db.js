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

module.exports = {
  getDb
};
