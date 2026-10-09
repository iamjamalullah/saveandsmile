const { getAuditLogsCollection, isMongoConnected } = require('../config/mongo');

/**
 * Audit log helper function
 */
async function logAuditEvent({ action, entity, entityId, details, performedBy, req }) {
  const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip) : 'system';
  const userAgent = req ? req.headers['user-agent'] : 'system';
  const user = performedBy || (req && req.user ? (req.user.username || req.user.email) : 'anonymous');

  const logEntry = {
    action,
    entity,
    entityId: entityId ? String(entityId) : null,
    details: details || {},
    performedBy: user,
    ipAddress,
    userAgent,
    timestamp: new Date()
  };

  try {
    if (isMongoConnected()) {
      const collection = getAuditLogsCollection();
      await collection.insertOne(logEntry);
    } else {
      console.log(`[AUDIT] [${logEntry.timestamp.toISOString()}] ${user} performed ${action} on ${entity}:${entityId || 'N/A'}`);
    }
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

/**
 * Express middleware to attach audit logger to req
 */
function auditMiddleware(req, res, next) {
  req.logAudit = (action, entity, entityId, details) => {
    return logAuditEvent({
      action,
      entity,
      entityId,
      details,
      performedBy: req.user ? (req.user.username || req.user.email) : 'anonymous',
      req
    });
  };
  next();
}

module.exports = {
  logAuditEvent,
  auditMiddleware
};
