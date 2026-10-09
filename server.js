const http = require('http');
const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config();
} catch (e) {}

const PORT = process.env.PORT || 5000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Route API requests to serverless handlers
async function handleApiRequest(req, res) {
  const urlPath = req.url.split('?')[0];

  // Helper methods to emulate Vercel/Express response
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  // Collect request body for POST/PUT
  let bodyBuffer = '';
  req.on('data', chunk => { bodyBuffer += chunk; });
  req.on('end', async () => {
    if (bodyBuffer) {
      try {
        req.body = JSON.parse(bodyBuffer);
      } catch (e) {
        req.body = bodyBuffer;
      }
    }

    try {
      if (urlPath === '/api/products' || urlPath === '/api/products/') {
        const handler = require('./api/products');
        return await handler(req, res);
      } else if (urlPath === '/api/orders' || urlPath === '/api/orders/') {
        const handler = require('./api/orders');
        return await handler(req, res);
      } else if (urlPath === '/api/health' || urlPath === '/api/health/') {
        const handler = require('./api/health');
        return await handler(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'API endpoint not found' }));
      }
    } catch (err) {
      console.error('API Error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  });
}

const server = http.createServer((req, res) => {
  // If API route
  if (req.url.startsWith('/api/')) {
    return handleApiRequest(req, res);
  }

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath === '/cart') reqPath = '/cart.html';
  if (reqPath === '/checkout') reqPath = '/checkout.html';
  if (reqPath === '/product-detail') reqPath = '/product-detail.html';
  if (reqPath === '/track' || reqPath === '/track-order') reqPath = '/track-order.html';
  if (reqPath === '/admin') reqPath = '/admin.html';
  if (reqPath === '/admin/live-editor' || reqPath === '/live-editor') reqPath = '/live-editor.html';

  let filePath = path.join(__dirname, 'dist', reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'public', reqPath);
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, reqPath);
  }
  if (!fs.existsSync(filePath) && !path.extname(reqPath)) {
    const distIndex = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(distIndex)) {
      filePath = distIndex;
    }
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Qadri Gadgets / Save & Smile is running at http://localhost:${PORT}`);
    console.log(`📡 Neon API ready at: http://localhost:${PORT}/api/health`);
  });
}

module.exports = server;
