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
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const urlPath = parsedUrl.pathname;
  req.query = Object.fromEntries(parsedUrl.searchParams);

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
      } else if (urlPath.startsWith('/api/orders')) {
        const handler = require('./api/orders');
        return await handler(req, res);
      } else if (urlPath.startsWith('/api/auth')) {
        const handler = require('./api/auth');
        return await handler(req, res);
      } else if (urlPath === '/api/health' || urlPath === '/api/health/') {
        const handler = require('./api/health');
        return await handler(req, res);
      } else if (urlPath.startsWith('/api/seo')) {
        const handler = require('./api/seo');
        return await handler(req, res);
      } else if (urlPath.startsWith('/api/home-customization')) {
        const handler = require('./api/home-customization');
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

function checkActiveRedirect(reqPath) {
  try {
    const redirFile = path.join(__dirname, 'data', 'seo_redirects.json');
    if (fs.existsSync(redirFile)) {
      const redirs = JSON.parse(fs.readFileSync(redirFile, 'utf8'));
      const found = redirs.find(r => r.is_active && r.source_url.toLowerCase() === reqPath.toLowerCase());
      if (found) return found;
    }
  } catch (e) {}
  return null;
}

const server = http.createServer((req, res) => {
  // If API route
  if (req.url.startsWith('/api/')) {
    return handleApiRequest(req, res);
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let reqPath = parsedUrl.pathname;

  // 1. Technical Redirects Manager (301 / 302)
  const redirectMatch = checkActiveRedirect(reqPath);
  if (redirectMatch) {
    res.writeHead(redirectMatch.status_code || 301, {
      'Location': redirectMatch.target_url,
      'Content-Type': 'text/plain'
    });
    return res.end(`Redirecting to ${redirectMatch.target_url}`);
  }

  // 2. Dynamic XML Sitemap (/sitemap.xml)
  if (reqPath === '/sitemap.xml') {
    req.url = '/api/seo?type=sitemap';
    return handleApiRequest(req, res);
  }

  // 3. Dynamic Robots.txt (/robots.txt)
  if (reqPath === '/robots.txt') {
    req.url = '/api/seo?type=robots';
    return handleApiRequest(req, res);
  }

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
      let finalContent = content;

      // 4. Server-Side Metadata Prerendering for Product Detail Page
      if (reqPath === '/product-detail.html' || reqPath === '/product-detail') {
        try {
          const prodId = parseInt(parsedUrl.searchParams.get('id'), 10) || 203;
          let products = [];
          const prodFile = path.join(__dirname, 'products.json');
          if (fs.existsSync(prodFile)) {
            products = JSON.parse(fs.readFileSync(prodFile, 'utf8'));
          }
          const product = products.find(p => p.id === prodId) || products[0];
          if (product) {
            let htmlStr = content.toString('utf-8');
            const pTitle = `${product.seo_title || product.title} | Save & Smile Wholesale Store Pakistan`;
            const pDesc = (product.seo_description || product.description || '').replace(/"/g, '&quot;');
            const pSlug = product.slug || product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const pUrl = `https://saveandsmile.pk/product-detail?id=${product.id}&slug=${encodeURIComponent(pSlug)}`;
            const pImg = product.og_image || product.image || 'https://saveandsmile.pk/images/save-and-smile-logo.png';

            // Replace title & metadata directly in returned HTML string
            htmlStr = htmlStr.replace(/<title>.*?<\/title>/i, `<title>${pTitle}</title>`);
            htmlStr = htmlStr.replace(/id="metaDescriptionTag" content=".*?"/i, `id="metaDescriptionTag" content="${pDesc}"`);
            htmlStr = htmlStr.replace(/id="canonicalTag" href=".*?"/i, `id="canonicalTag" href="${pUrl}"`);
            htmlStr = htmlStr.replace(/id="ogTitleTag" content=".*?"/i, `id="ogTitleTag" content="${pTitle}"`);
            htmlStr = htmlStr.replace(/id="ogDescTag" content=".*?"/i, `id="ogDescTag" content="${pDesc}"`);
            htmlStr = htmlStr.replace(/id="ogUrlTag" content=".*?"/i, `id="ogUrlTag" content="${pUrl}"`);
            htmlStr = htmlStr.replace(/id="ogImageTag" content=".*?"/i, `id="ogImageTag" content="${pImg}"`);

            finalContent = Buffer.from(htmlStr, 'utf-8');
          }
        } catch (e) {
          console.warn('Prerender injection error:', e.message);
        }
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(finalContent);
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
