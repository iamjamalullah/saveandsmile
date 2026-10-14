/**
 * Save & Smile - Centralized Cross-Origin Resource Sharing (CORS) Configuration
 */

const ALLOWED_ORIGINS = [
  'https://saveandsmile.vercel.app',
  'https://saveandsmile.pk',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000'
];

function setCorsHeaders(req, res) {
  const headers = req && req.headers ? req.headers : {};
  const origin = headers.origin || headers.Origin;

  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

module.exports = { setCorsHeaders, ALLOWED_ORIGINS };
