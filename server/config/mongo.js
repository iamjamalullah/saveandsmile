const { MongoClient } = require('mongodb');
const config = require('./env');

let client = null;
let db = null;
let isConnecting = false;
let connectionStatus = {
  connected: false,
  error: null,
  database: config.MONGO_DB_NAME
};

async function connectMongo() {
  if (db && connectionStatus.connected) {
    return db;
  }
  if (isConnecting) return null;

  isConnecting = true;
  try {
    client = new MongoClient(config.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000
    });
    await client.connect();
    db = client.db(config.MONGO_DB_NAME);
    connectionStatus.connected = true;
    connectionStatus.error = null;
    console.log(`✅ MongoDB Connected: [${config.MONGO_URI}] -> DB: [${config.MONGO_DB_NAME}]`);
    return db;
  } catch (err) {
    connectionStatus.connected = false;
    connectionStatus.error = err.message;
    console.warn(`⚠️ MongoDB not reachable (${err.message}). Audit & settings will use local buffer adapter.`);
    db = null;
    return null;
  } finally {
    isConnecting = false;
  }
}

function getDb() {
  return db;
}

function getStatus() {
  return {
    ...connectionStatus,
    configured: Boolean(config.MONGO_URI)
  };
}

function isMongoConnected() {
  return Boolean(db && connectionStatus.connected);
}

function getAuditLogsCollection() {
  if (!db) throw new Error('MongoDB is not connected');
  return db.collection('audit_logs');
}

function getStoreSettingsCollection() {
  if (!db) throw new Error('MongoDB is not connected');
  return db.collection('store_settings');
}

function getSearchAnalyticsCollection() {
  if (!db) throw new Error('MongoDB is not connected');
  return db.collection('search_analytics');
}

async function initMongoIndexes() {
  if (!db) return;
  try {
    await db.collection('audit_logs').createIndex({ timestamp: -1 });
    await db.collection('audit_logs').createIndex({ entity: 1, action: 1 });
    await db.collection('store_settings').createIndex({ key: 1 }, { unique: true });
    await db.collection('search_analytics').createIndex({ query: 1 });
  } catch (e) {
    console.warn('Index creation notice:', e.message);
  }
}

module.exports = {
  connectMongo,
  getDb,
  getStatus,
  isMongoConnected,
  getAuditLogsCollection,
  getStoreSettingsCollection,
  getSearchAnalyticsCollection,
  initMongoIndexes
};
