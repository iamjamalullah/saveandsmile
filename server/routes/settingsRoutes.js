const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', getSettings);
router.put('/', verifyToken, requireRole(['Admin']), updateSettings);

module.exports = router;
