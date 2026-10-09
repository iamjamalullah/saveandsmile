const { getAuditLogsCollection, isMongoConnected } = require('../config/mongo');

/**
 * Get audit logs with pagination and filtering
 */
async function getAuditLogs(req, res, next) {
  try {
    const { page = 1, limit = 50, action, entity } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    if (isMongoConnected()) {
      const collection = getAuditLogsCollection();
      const filter = {};
      if (action) filter.action = action;
      if (entity) filter.entity = entity;

      const total = await collection.countDocuments(filter);
      const logs = await collection
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();

      return res.json({
        success: true,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        logs
      });
    }

    return res.json({
      success: true,
      total: 0,
      page: 1,
      totalPages: 1,
      logs: []
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAuditLogs
};
