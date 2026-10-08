const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('./db');
const { cookies, setCookie, clearCookie, sendJson } = require('./http');

const COOKIE = 'qg_session';
const TTL = 60 * 60 * 24 * 7;

function secret() {
  return process.env.SESSION_SECRET || 'dev-only-change-me-save-and-smile';
}

function sign(val) {
  return crypto.createHmac('sha256', secret()).update(val).digest('hex');
}

function sessionToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

async function createSession(res, user) {
  const id = sessionToken();
  const csrf = sessionToken();
  const expires = new Date(Date.now() + TTL * 1000);
  await query(
    `INSERT INTO sessions (id, user_id, csrf, expires_at) VALUES ($1,$2,$3,$4)`,
    [id, user.id, csrf, expires.toISOString()]
  );
  setCookie(res, COOKIE, id, { maxAge: TTL });
  return csrf;
}

async function destroySession(req, res) {
  const sid = cookies(req)[COOKIE];
  if (sid) await query(`DELETE FROM sessions WHERE id = $1`, [sid]);
  clearCookie(res, COOKIE);
}

async function currentUser(req) {
  const sid = cookies(req)[COOKIE];
  if (!sid) return null;
  const row = await queryOne(
    `SELECT s.id as session_id, s.csrf, s.expires_at, u.id, u.email, u.name, u.role, u.status
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1`,
    [sid]
  );
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    await query(`DELETE FROM sessions WHERE id = $1`, [sid]);
    return null;
  }
  if (row.status !== 'active') return null;
  return row;
}

function assertCsrf(req, user) {
  if (!user) return;
  const method = (req.method || 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return;
  const token = req.headers['x-csrf-token'] || req.headers['x-csrf'];
  if (!token || token !== user.csrf) {
    const err = new Error('Invalid CSRF token');
    err.status = 403;
    throw err;
  }
}

async function requireUser(req, res) {
  const user = await currentUser(req);
  if (!user) {
    sendJson(res, 401, { error: 'Authentication required' });
    return null;
  }
  try {
    assertCsrf(req, user);
  } catch (e) {
    sendJson(res, e.status || 403, { error: e.message });
    return null;
  }
  return user;
}

module.exports = {
  COOKIE, hashPassword, verifyPassword, createSession, destroySession,
  currentUser, requireUser, assertCsrf
};
