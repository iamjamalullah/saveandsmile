function parseUrl(req) {
  const host = req.headers.host || 'localhost';
  const u = new URL(req.url, `http://${host}`);
  const query = {};
  u.searchParams.forEach((v, k) => { query[k] = v; });
  return { pathname: u.pathname.replace(/\/+$/, '') || '/', query, searchParams: u.searchParams };
}

function send(res, status, data, extraHeaders = {}) {
  if (res.headersSent) return;
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  const headers = {
    'Content-Type': typeof data === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    ...extraHeaders
  };
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, data, extraHeaders) {
  send(res, status, data, extraHeaders);
}

async function readBody(req, limit = 12 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      const err = new Error('Payload too large');
      err.status = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(req) {
  const buf = await readBody(req);
  if (!buf.length) return {};
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch (e) {
    const err = new Error('Invalid JSON');
    err.status = 400;
    throw err;
  }
}

function cookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || '/'}`);
  parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
  parts.push('HttpOnly');
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.secure || process.env.NODE_ENV === 'production') parts.push('Secure');
  const prev = res.getHeader && res.getHeader('Set-Cookie');
  const list = prev ? (Array.isArray(prev) ? prev : [prev]) : [];
  list.push(parts.join('; '));
  res.setHeader('Set-Cookie', list);
}

function clearCookie(res, name) {
  setCookie(res, name, '', { maxAge: 0 });
}

const rateBuckets = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const b = rateBuckets.get(key) || { n: 0, t: now };
  if (now - b.t > windowMs) {
    b.n = 0;
    b.t = now;
  }
  b.n += 1;
  rateBuckets.set(key, b);
  return b.n <= max;
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120) || 'item';
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function originOf(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost';
  return `${proto}://${host}`;
}

function corsPublic(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = {
  parseUrl, send, sendJson, readBody, readJson, cookies, setCookie, clearCookie,
  rateLimit, slugify, escapeHtml, originOf, corsPublic
};
