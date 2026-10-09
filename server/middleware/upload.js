const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Store in memory buffer so sharp can process before writing to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, AVIF) are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter
});

// Middleware to convert buffer to WebP and save to disk
const processImageWebp = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;
    const outputPath = path.join(uploadDir, filename);

    await sharp(req.file.buffer)
      .webp({ quality: 85 })
      .toFile(outputPath);

    // Attach processed file info to req
    req.processedFile = {
      filename,
      path: outputPath,
      url: `/uploads/${filename}`,
      size: fs.statSync(outputPath).size,
      mimetype: 'image/webp'
    };

    next();
  } catch (error) {
    console.error('Image processing error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process image', error: error.message });
  }
};

module.exports = {
  upload,
  processImageWebp
};
