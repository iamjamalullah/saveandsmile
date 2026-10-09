/**
 * Global API Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]:', err);

  // MSSQL Specific Errors
  if (err.number) {
    if (err.number === 2627 || err.number === 2601) {
      return res.status(409).json({
        success: false,
        message: 'A record with these unique details (such as SKU, email, or slug) already exists.',
        error: err.message
      });
    }
    if (err.number === 547) {
      return res.status(400).json({
        success: false,
        message: 'Foreign key constraint violation: referenced record does not exist or is in use.',
        error: err.message
      });
    }
  }

  // Multer Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum allowed limit (5MB).'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }

  const statusCode = err.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

/**
 * 404 Not Found Handler for unmatched API routes
 */
function notFoundHandler(req, res, next) {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.originalUrl} not found.`
    });
  }
  next();
}

module.exports = {
  errorHandler,
  notFoundHandler
};
