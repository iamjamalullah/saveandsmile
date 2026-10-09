const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole(['Admin']), getAuditLogs);

module.exports = router;
