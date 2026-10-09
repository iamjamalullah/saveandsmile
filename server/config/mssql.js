const sql = require('mssql');
const config = require('./env');

let pool = null;
let isConnecting = false;
let connectionStatus = {
  connected: false,
  error: null,
  database: config.MSSQL.database,
  server: config.MSSQL.server
};

async function connectMSSQL() {
  if (pool && pool.connected) {
    return pool;
  }
  if (isConnecting) return null;

  isConnecting = true;
  try {
    pool = await new sql.ConnectionPool(config.MSSQL).connect();
    connectionStatus.connected = true;
    connectionStatus.error = null;
    console.log(`✅ Microsoft SQL Server Connected: [${config.MSSQL.server}:${config.MSSQL.port}/${config.MSSQL.database}]`);
    return pool;
  } catch (err) {
    connectionStatus.connected = false;
    connectionStatus.error = err.message;
    console.warn(`⚠️ Microsoft SQL Server not reachable (${err.message}). Application running with resilient store adapter.`);
    pool = null;
    return null;
  } finally {
    isConnecting = false;
  }
}

function getPool() {
  return pool;
}

function getStatus() {
  return {
    ...connectionStatus,
    configured: Boolean(config.MSSQL.server && config.MSSQL.database)
  };
}

// SQL Query helper with parameterized inputs
async function executeQuery(queryText, parameters = {}) {
  const currentPool = await connectMSSQL();
  if (!currentPool) {
    throw new Error(`MSSQL_DISCONNECTED: ${connectionStatus.error || 'Database connection unavailable'}`);
  }

  const request = currentPool.request();
  for (const [key, value] of Object.entries(parameters)) {
    request.input(key, value);
  }

  return await request.query(queryText);
}

module.exports = {
  sql,
  connectMSSQL,
  connectMssql: connectMSSQL,
  getPool,
  getStatus,
  executeQuery,
  query: executeQuery,
  isMssqlConnected: () => Boolean(pool && pool.connected)
};
