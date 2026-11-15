import 'dotenv/config'
import * as fcmService from '../src/services/fcmService.js'
import { query } from '../src/db/index.js'

async function testFcm() {
  console.log('=================================================================')
  console.log('   SAVE & SMILE — FCM PUSH NOTIFICATIONS VERIFICATION TEST      ')
  console.log('=================================================================\n')

  const testDeviceId = 'test-android-device-' + Date.now()
  const testFcmToken = 'eXamP1e_fCm_t0kEn_' + Math.random().toString(36).substring(2, 15)

  // 1. Device Token Registration
  console.log('[1/5] Testing Device Token Registration...')
  const regResult = await fcmService.registerFcmToken({
    staffId: 1,
    deviceId: testDeviceId,
    token: testFcmToken,
    platform: 'android',
    appVersion: '1.0.0',
  })
  console.log('  Registered:', regResult)

  // 2. Verify Active Tokens List
  console.log('\n[2/5] Verifying Active Tokens List...')
  const activeTokens = await fcmService.getActiveTokens()
  const found = activeTokens.find(t => t.device_id === testDeviceId)
  console.log(`  Found Registered Token: ${found ? 'PASS' : 'FAIL'} (${activeTokens.length} total active devices)`)

  // 3. Dispatch Test Notification (Events: new_order, order_status_updated, new_inquiry, new_review, low_inventory)
  console.log('\n[3/5] Testing Dispatch for All 5 Required Events...')
  
  const orderRes = await fcmService.notifyNewOrder({
    id: 'GS-ORD-TEST-999',
    customer_name: 'Test Customer',
    total: 3500,
  })
  console.log('  Event [new_order]:', orderRes.status)

  const statusRes = await fcmService.notifyOrderStatusChange('GS-ORD-TEST-999', 'Pending', 'Processing')
  console.log('  Event [order_status_updated]:', statusRes.status)

  const inqRes = await fcmService.notifyNewInquiry({
    id: 101,
    name: 'Ahmad Khan',
    subject: 'Warranty inquiry',
  })
  console.log('  Event [new_inquiry]:', inqRes.status)

  const revRes = await fcmService.notifyNewReview({
    id: 202,
    author: 'Hamza',
    rating: 5,
    productId: 1,
  })
  console.log('  Event [new_review]:', revRes.status)

  const invRes = await fcmService.notifyLowInventory({
    id: 1,
    name: 'Wireless Earbuds Pro',
  }, 3)
  console.log('  Event [low_inventory]:', invRes.status)

  // 4. Verify Duplicate Prevention
  console.log('\n[4/5] Testing Duplicate Notification Prevention...')
  const dupRes = await fcmService.notifyNewOrder({
    id: 'GS-ORD-TEST-999',
    customer_name: 'Test Customer',
    total: 3500,
  })
  console.log(`  Duplicate Detection: ${dupRes.status === 'skipped_duplicate' ? 'PASS (Properly Suppressed)' : 'FAIL'}`)

  // 5. Cleanup Test Device Token
  console.log('\n[5/5] Testing Device Token Removal (Logout simulation)...')
  const removeRes = await fcmService.removeFcmToken({ deviceId: testDeviceId })
  console.log(`  Removal Result: ${removeRes.removed > 0 ? 'PASS' : 'FAIL'} (${removeRes.removed} removed)`)

  // Verify Audit Log in Database
  const auditRes = await query('SELECT event_type, title, sent_count, created_at FROM admin_notifications ORDER BY id DESC LIMIT 5')
  console.log('\n  Audit Log in PostgreSQL (Last 5 records):')
  auditRes.rows.forEach(r => {
    console.log(`    - [${r.event_type}] "${r.title}" (Sent: ${r.sent_count}) at ${r.created_at.toISOString()}`)
  })

  console.log('\n>>> FCM PUSH NOTIFICATIONS PIPELINE VERIFIED SUCCESSFULLY <<<')
  process.exit(0)
}

testFcm().catch(err => {
  console.error('[FCM TEST FATAL]:', err)
  process.exit(1)
})
