const express = require('express');
const router = express.Router();
const {
  getInventoryStatus,
  adjustStock,
  getMovements
} = require('../controllers/inventoryController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/status', verifyToken, requireRole(['Admin', 'Manager', 'Staff']), getInventoryStatus);
router.post('/adjust', verifyToken, requireRole(['Admin', 'Manager']), adjustStock);
router.get('/movements', verifyToken, requireRole(['Admin', 'Manager']), getMovements);

module.exports = router;
