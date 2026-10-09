const { isMssqlConnected, query } = require('../config/mssql');
const { isMongoConnected } = require('../config/mongo');

/**
 * Health check endpoint for MSSQL, MongoDB, and Express
 */
async function getHealth(req, res) {
  const mssqlStatus = isMssqlConnected();
  const mongoStatus = isMongoConnected();

  let mssqlLatency = null;
  if (mssqlStatus) {
    const start = Date.now();
    try {
      await query('SELECT 1 AS health');
      mssqlLatency = `${Date.now() - start}ms`;
    } catch (e) {
      // Query error
    }
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    databases: {
      mssql: {
        connected: mssqlStatus,
        latency: mssqlLatency,
        database: process.env.MSSQL_DATABASE || 'SaveAndSmileDB'
      },
      mongodb: {
        connected: mongoStatus,
        database: process.env.MONGODB_DB_NAME || 'save_and_smile'
      }
    }
  });
}

module.exports = {
  getHealth
};
