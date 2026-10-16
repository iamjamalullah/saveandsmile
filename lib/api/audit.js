const fs = require('fs');
const path = require('path');

const AUDIT_FILE = path.join(process.cwd(), 'data', 'audit_logs.json');

function logAudit({ user = 'Admin', action = 'UPDATE', entity = 'System', entityId = '', details = '', ip = '127.0.0.1' }) {
  try {
    let logs = [];
    if (fs.existsSync(AUDIT_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
      } catch (e) {
        logs = [];
      }
    }
    const newEntry = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: typeof user === 'string' ? user : (user.email || user.username || 'Admin'),
      userName: typeof user === 'object' ? (user.name || user.username || 'Admin') : 'Admin',
      role: typeof user === 'object' ? (user.role || 'Administrator') : 'Administrator',
      action,
      entity,
      entityId: String(entityId || ''),
      details: String(details || ''),
      ip
    };
    logs.unshift(newEntry);
    if (logs.length > 500) logs = logs.slice(0, 500);
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf8');
    return newEntry;
  } catch (err) {
    console.warn('Failed to record audit log:', err.message);
    return null;
  }
}

function getAuditLogs(limit = 100) {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const logs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
      return Array.isArray(logs) ? logs.slice(0, limit) : [];
    }
  } catch (e) {}
  return [];
}

module.exports = { logAudit, getAuditLogs };
