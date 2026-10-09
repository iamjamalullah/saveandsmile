const express = require('express');
const router = express.Router();
const {
  createOrder,
  trackOrder,
  getOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { checkoutLimiter } = require('../middleware/rateLimiter');

router.post('/', checkoutLimiter, createOrder);
router.get('/track/:identifier', trackOrder);
router.get('/', verifyToken, requireRole(['Admin', 'Manager', 'Staff']), getOrders);
router.put('/:id/status', verifyToken, requireRole(['Admin', 'Manager', 'Staff']), updateOrderStatus);

module.exports = router;
