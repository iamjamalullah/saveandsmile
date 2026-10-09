const express = require('express');
const cors = require('cors');
const path = require('path');
const { apiLimiter } = require('./middleware/rateLimiter');
const { auditMiddleware } = require('./middleware/auditLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route handlers
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const auditRoutes = require('./routes/auditRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Enable CORS for frontend clients
app.use(cors({
  origin: true,
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Audit Logger & Rate Limiting on API routes
app.use('/api', apiLimiter);
app.use(auditMiddleware);

// Mount API Endpoints
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler for API routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
