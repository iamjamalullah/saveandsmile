const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDb } = require('./db');

const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProd ? null : 'saveandsmile_dev_jwt_secret_2026');

// Helper to verify JWT token from Authorization header
function verifyAuthToken(req) {
  if (!JWT_SECRET) {
    return null;
  }
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Verify current session
  if (req.method === 'GET') {
    const user = verifyAuthToken(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
    }
    return res.status(200).json({ success: true, user });
  }

  // POST: Login
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }

      const { username, email, password } = body || {};
      const loginId = (username || email || '').trim();

      if (!loginId || !password) {
        return res.status(400).json({ success: false, error: 'Username/Email and password are required.' });
      }

      const effectiveSecret = JWT_SECRET || process.env.JWT_SECRET;
      if (!effectiveSecret) {
        return res.status(500).json({ success: false, error: 'Server misconfiguration: JWT_SECRET must be set in production.' });
      }

      const sql = getDb();
      let authenticated = false;
      let userProfile = null;

      // 1. Check Neon Database if available
      if (sql) {
        try {
          const rows = await sql`SELECT id, username, email, password_hash, role FROM admins WHERE username = ${loginId} OR email = ${loginId}`;
          if (rows && rows.length > 0) {
            const dbAdmin = rows[0];
            const isMatch = await bcrypt.compare(password, dbAdmin.password_hash);
            if (isMatch) {
              authenticated = true;
              userProfile = { id: dbAdmin.id, username: dbAdmin.username, email: dbAdmin.email, role: dbAdmin.role || 'Admin' };
            }
          }
        } catch (dbErr) {
          console.warn('Neon admin lookup error:', dbErr.message);
        }
      }

      // 2. Check environment credentials
      if (!authenticated) {
        const envAdminUser = process.env.ADMIN_USERNAME;
        const envAdminPass = process.env.ADMIN_PASSWORD;

        if (isProd) {
          // In production: STRICT check, no default fallback allowed
          if (envAdminUser && envAdminPass && loginId === envAdminUser && password === envAdminPass) {
            authenticated = true;
            userProfile = { id: 1, username: envAdminUser, email: 'admin@saveandsmile.pk', role: 'Admin' };
          }
        } else {
          // In local/development: allow configured env vars or dev defaults
          const devUser = envAdminUser || 'admin';
          const devPass = envAdminPass || 'admin123';
          if (loginId === devUser && password === devPass) {
            authenticated = true;
            userProfile = { id: 1, username: devUser, email: 'admin@saveandsmile.pk', role: 'Admin' };
          }
        }
      }

      if (!authenticated) {
        return res.status(401).json({ success: false, error: 'Invalid admin username or password.' });
      }

      // Sign JWT Token
      const token = jwt.sign(
        { id: userProfile.id, username: userProfile.username, role: userProfile.role },
        effectiveSecret,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Admin authentication successful.',
        token,
        user: userProfile
      });
    } catch (err) {
      console.error('Auth handler error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};

module.exports.verifyAuthToken = verifyAuthToken;
