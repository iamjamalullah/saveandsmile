require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Microsoft SQL Server Configuration
  MSSQL: {
    user: process.env.MSSQL_USER || 'sa',
    password: process.env.MSSQL_PASSWORD || '',
    server: process.env.MSSQL_SERVER || 'localhost',
    port: parseInt(process.env.MSSQL_PORT, 10) || 1433,
    database: process.env.MSSQL_DATABASE || 'SaveAndSmileDB',
    options: {
      encrypt: process.env.MSSQL_ENCRYPT === 'true', // true for Azure, false for local
      trustServerCertificate: process.env.MSSQL_TRUST_CERT !== 'false', // true for local dev
      enableArithAbort: true,
      connectTimeout: 8000
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  },

  // MongoDB Configuration
  MONGO_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/saveandsmile',
  MONGO_DB_NAME: process.env.MONGODB_DB_NAME || 'saveandsmile',

  // Security & JWT
  JWT_SECRET: process.env.JWT_SECRET || 'save-and-smile-super-secure-jwt-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ADMIN_DEFAULT_EMAIL: process.env.ADMIN_EMAIL || 'admin@saveandsmile.pk',
  ADMIN_DEFAULT_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@SaveAndSmile2026!',

  // Optional Neon Postgres URL (for backward compatibility if configured)
  DATABASE_URL: process.env.DATABASE_URL || ''
};
