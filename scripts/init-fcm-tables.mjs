import 'dotenv/config'
import { query } from '../src/db/index.js'

async function init() {
  console.log('[FCM INIT] Ensuring FCM tables in PostgreSQL...')

  await query(`
    CREATE TABLE IF NOT EXISTS fcm_tokens (
      id SERIAL PRIMARY KEY,
      staff_id INTEGER REFERENCES staff_accounts(id) ON DELETE SET NULL,
      device_id VARCHAR(255) NOT NULL UNIQUE,
      token TEXT NOT NULL,
      platform VARCHAR(50) DEFAULT 'android',
      app_version VARCHAR(50) DEFAULT '1.0.0',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_notifications (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      data_json JSONB,
      sent_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `)

  console.log('[FCM INIT] ✓ fcm_tokens & admin_notifications tables verified.')
  process.exit(0)
}

init().catch(err => {
  console.error('[FCM INIT ERROR]:', err)
  process.exit(1)
})
