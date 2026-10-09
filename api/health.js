const { getDb } = require('./db');
const { isMssqlConnected, query } = require('../server/config/mssql');
const { isMongoConnected } = require('../server/config/mongo');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const sqlNeon = getDb();

  let neonConnected = false;
  let neonTime = null;
  let neonError = null;

  if (sqlNeon) {
    try {
      const result = await sqlNeon`SELECT NOW() as current_time`;
      neonConnected = true;
      neonTime = result[0].current_time;
    } catch (e) {
      neonError = e.message;
    }
  }

  const mssqlStatus = isMssqlConnected();
  const mongoStatus = isMongoConnected();

  res.status(200).json({
    status: 'online',
    platform: process.env.VERCEL ? 'Vercel Serverless' : 'Node Express Server',
    databases: {
      mssql: {
        connected: mssqlStatus,
        configured: Boolean(process.env.MSSQL_SERVER)
      },
      mongodb: {
        connected: mongoStatus,
        configured: Boolean(process.env.MONGODB_URI)
      },
      neonDatabase: {
        connected: neonConnected,
        configured: Boolean(process.env.DATABASE_URL),
        time: neonTime,
        error: neonError
      }
    },
    timestamp: new Date().toISOString()
  });
};
