const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', verifyToken, requireRole(['Admin', 'Manager']), createProduct);
router.put('/:id', verifyToken, requireRole(['Admin', 'Manager']), updateProduct);
router.delete('/:id', verifyToken, requireRole(['Admin']), deleteProduct);

module.exports = router;
