const express = require('express');
const router = express.Router();
const { login, register, getMe } = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, login);
router.post('/register', verifyToken, requireRole(['Admin']), register);
router.get('/me', verifyToken, getMe);

module.exports = router;
