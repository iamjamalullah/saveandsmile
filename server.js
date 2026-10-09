const path = require('path');
const express = require('express');
const app = require('./server/app');
const { connectMssql } = require('./server/config/mssql');
const { connectMongo } = require('./server/config/mongo');

const PORT = process.env.PORT || 5000;

// Serve static assets from Vite dist/ and public/
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// HTML routes / SPA fallback
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html'), (err) => {
  if (err) res.sendFile(path.join(__dirname, 'cart.html'));
}));

app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html'), (err) => {
  if (err) res.sendFile(path.join(__dirname, 'checkout.html'));
}));

app.get('/product-detail', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html'), (err) => {
  if (err) res.sendFile(path.join(__dirname, 'product-detail.html'));
}));

app.get('/track', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html'), (err) => {
  if (err) res.sendFile(path.join(__dirname, 'track-order.html'));
}));

app.get('/track-order', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html'), (err) => {
  if (err) res.sendFile(path.join(__dirname, 'track-order.html'));
}));

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html'), (err) => {
  if (err) res.sendFile(path.join(__dirname, 'admin.html'));
}));

// Global fallback for React Router SPA (Express 5 compatible)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  const rootIndex = path.join(__dirname, 'index.html');
  res.sendFile(distIndex, (err) => {
    if (err) {
      res.sendFile(rootIndex, (err2) => {
        if (err2) next();
      });
    }
  });
});

// Initialize DBs and start server
async function startServer() {
  console.log('Connecting to database services...');
  
  // Try connecting to MSSQL & MongoDB (non-blocking so server boots immediately)
  connectMssql().catch(err => console.warn('MSSQL connection notice:', err.message));
  connectMongo().catch(err => console.warn('MongoDB connection notice:', err.message));

  const server = app.listen(PORT, () => {
    console.log(`🚀 Save & Smile Server is running at http://localhost:${PORT}`);
    console.log(`📡 MSSQL & MongoDB Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🛒 Products API: http://localhost:${PORT}/api/products`);
    console.log(`📦 Orders API: http://localhost:${PORT}/api/orders`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = app;
