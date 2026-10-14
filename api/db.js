try {
  require('dotenv').config();
} catch (e) {}

const { neon } = require('@neondatabase/serverless');

let sql = null;

function getDb() {
  const connectionString = process.env.DATABASE_URL;
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
