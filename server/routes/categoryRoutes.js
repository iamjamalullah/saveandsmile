const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', getCategories);
router.post('/', verifyToken, requireRole(['Admin', 'Manager']), createCategory);
router.put('/:id', verifyToken, requireRole(['Admin', 'Manager']), updateCategory);
router.delete('/:id', verifyToken, requireRole(['Admin']), deleteCategory);

module.exports = router;
