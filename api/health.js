const { getDb } = require('./db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const sql = getDb();

  let dbConnected = false;
  let dbTime = null;
  let dbError = null;

  if (sql) {
    try {
      const result = await sql`SELECT NOW() as current_time`;
      dbConnected = true;
      dbTime = result[0].current_time;
    } catch (e) {
      dbError = e.message;
    }
  }

  res.status(200).json({
    status: 'online',
    platform: process.env.VERCEL ? 'Vercel' : 'Node Server / Edge',
    neonDatabase: {
      connected: dbConnected,
      configured: Boolean(process.env.DATABASE_URL),
      time: dbTime,
      error: dbError
    },
    timestamp: new Date().toISOString()
  });
};
