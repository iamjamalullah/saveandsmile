/**
 * MongoDB Collections and Document Structure for Flexible Supporting Data
 */

const MONGO_COLLECTIONS = {
  AUDIT_LOGS: 'audit_logs',
  STORE_SETTINGS: 'store_settings',
  ACTIVITY_EVENTS: 'activity_events',
  SEARCH_ANALYTICS: 'search_analytics'
};

// Document schema structures
const AuditLogSchema = {
  event: String,          // e.g. 'ORDER_STATUS_UPDATED', 'PRODUCT_PRICE_CHANGED'
  entityType: String,     // 'ORDER', 'PRODUCT', 'SETTINGS', 'AUTH'
  entityId: String,       // 'SS-100482', '203'
  details: Object,        // Structured delta or JSON details
  performedBy: String,    // User Email / System
  ipAddress: String,
  userAgent: String,
  timestamp: Date
};

const StoreSettingsSchema = {
  settingKey: String,     // e.g. 'main_store_config', 'homepage_banners'
  data: Object,           // Store name, tagline, WhatsApp, free shipping rules
  updatedBy: String,
  updatedAt: Date
};

module.exports = {
  MONGO_COLLECTIONS,
  AuditLogSchema,
  StoreSettingsSchema
};
