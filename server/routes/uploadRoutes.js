const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');
const { upload, processImageWebp } = require('../middleware/upload');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post(
  '/',
  verifyToken,
  requireRole(['Admin', 'Manager']),
  upload.single('image'),
  processImageWebp,
  uploadImage
);

module.exports = router;
