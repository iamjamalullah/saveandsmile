/**
 * Upload single image and return WebP asset info
 */
async function uploadImage(req, res, next) {
  try {
    if (!req.processedFile) {
      return res.status(400).json({ success: false, message: 'No image file uploaded or format not supported.' });
    }

    if (req.logAudit) {
      req.logAudit('UPLOAD_IMAGE', 'Media', null, { filename: req.processedFile.filename, size: req.processedFile.size });
    }

    return res.status(201).json({
      success: true,
      message: 'Image uploaded and converted to WebP successfully.',
      file: {
        filename: req.processedFile.filename,
        url: req.processedFile.url,
        size: req.processedFile.size,
        mimetype: req.processedFile.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadImage
};
