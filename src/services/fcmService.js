import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { query } from '../db/index.js'

let isFirebaseInitialized = false
let firebaseInitError = null

// Initialize Firebase Admin SDK from environment
function initFirebase() {
  if (isFirebaseInitialized || (getApps() && getApps().length > 0)) {
    isFirebaseInitialized = true
    return true
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      let serviceAccount
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      } catch {
        serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      }
      initializeApp({
        credential: cert(serviceAccount),
      })
      isFirebaseInitialized = true
      console.log('[FCM] Firebase Admin SDK successfully initialized via FIREBASE_SERVICE_ACCOUNT_KEY.')
      return true
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      })
      isFirebaseInitialized = true
      console.log('[FCM] Firebase Admin SDK successfully initialized via granular env credentials.')
      return true
    } else {
      console.log('[FCM] Firebase credentials not detected. FCM Service operating in Staging/Queue Mode.')
      return false
    }
  } catch (err) {
    firebaseInitError = err.message
    console.warn('[FCM] Warning initializing Firebase Admin:', err.message)
    return false
  }
}

// Attempt initial setup
initFirebase()

// In-memory deduplication cache: key -> timestamp
const deduplicationCache = new Map()
const DEDUP_WINDOW_MS = 5000

function isDuplicate(key) {
  const now = Date.now()
  if (deduplicationCache.has(key)) {
    const prev = deduplicationCache.get(key)
    if (now - prev < DEDUP_WINDOW_MS) {
      return true
    }
  }
  deduplicationCache.set(key, now)
  // Prune cache periodically
  if (deduplicationCache.size > 500) {
    for (const [k, v] of deduplicationCache.entries()) {
      if (now - v > DEDUP_WINDOW_MS) deduplicationCache.delete(k)
    }
  }
  return false
}

function getChannelId(eventType) {
  switch (eventType) {
    case 'new_order':
    case 'order_status_updated':
      return 'channel_orders'
    case 'new_inquiry':
      return 'channel_inquiries'
    case 'low_inventory':
      return 'channel_inventory'
    case 'new_review':
      return 'channel_reviews'
    default:
      return 'channel_general'
  }
}

/**
 * Register or update device FCM token
 */
export async function registerFcmToken({ staffId = null, deviceId, token, platform = 'android', appVersion = '1.0.0' }) {
  if (!deviceId || !token) {
    throw new Error('deviceId and token are required for FCM registration.')
  }

  const res = await query(
    `INSERT INTO fcm_tokens (staff_id, device_id, token, platform, app_version, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (device_id) 
     DO UPDATE SET token = EXCLUDED.token, 
                   staff_id = COALESCE(EXCLUDED.staff_id, fcm_tokens.staff_id),
                   platform = EXCLUDED.platform,
                   app_version = EXCLUDED.app_version,
                   updated_at = NOW()
     RETURNING id, device_id, platform, updated_at`,
    [staffId, deviceId, token, platform, appVersion]
  )

  console.log(`[FCM] Device token registered for device: ${deviceId} (Staff #${staffId || 'anonymous'})`)
  return res.rows[0]
}

/**
 * Unregister device FCM token on logout
 */
export async function removeFcmToken({ deviceId = null, token = null }) {
  if (!deviceId && !token) {
    throw new Error('Either deviceId or token is required to unregister device.')
  }

  let res
  if (deviceId) {
    res = await query('DELETE FROM fcm_tokens WHERE device_id = $1 RETURNING id', [deviceId])
  } else {
    res = await query('DELETE FROM fcm_tokens WHERE token = $1 RETURNING id', [token])
  }

  console.log(`[FCM] Removed ${res.rows.length} FCM device registration(s).`)
  return { removed: res.rows.length }
}

/**
 * Get all active registered device tokens
 */
export async function getActiveTokens() {
  const res = await query('SELECT DISTINCT token, device_id FROM fcm_tokens WHERE token IS NOT NULL AND LENGTH(token) > 10')
  return res.rows
}

/**
 * Core dispatch function for sending push notifications
 */
export async function dispatchNotification({ eventType, title, body, data = {} }) {
  const dedupKey = `${eventType}:${JSON.stringify(data)}:${title}`
  if (isDuplicate(dedupKey)) {
    console.log(`[FCM] Skipped duplicate notification: ${dedupKey}`)
    return { status: 'skipped_duplicate' }
  }

  // 1. Persist notification in admin_notifications audit table
  let notificationRecordId = null
  try {
    const auditRes = await query(
      `INSERT INTO admin_notifications (event_type, title, body, data_json, sent_count)
       VALUES ($1, $2, $3, $4, 0) RETURNING id`,
      [eventType, title, body, JSON.stringify(data)]
    )
    notificationRecordId = auditRes.rows[0]?.id
  } catch (err) {
    console.warn('[FCM] Error saving notification audit record:', err.message)
  }

  // 2. Fetch target device tokens
  const tokenRows = await getActiveTokens()
  if (tokenRows.length === 0) {
    console.log(`[FCM] No registered devices for event [${eventType}]. Notification queued in database.`)
    return {
      status: 'queued_no_devices',
      notificationId: notificationRecordId,
      sentCount: 0,
    }
  }

  // 3. If Firebase Admin is not initialized, record and return status
  const ready = initFirebase()
  if (!ready) {
    console.log(`[FCM] Firebase credentials not configured. Notification recorded in audit log for ${tokenRows.length} registered device(s).`)
    return {
      status: 'recorded_in_queue',
      notificationId: notificationRecordId,
      devicesCount: tokenRows.length,
      mode: 'audit_queue',
    }
  }

  // 4. Send Multicast via Firebase Cloud Messaging
  const tokens = tokenRows.map(r => r.token)
  const channelId = getChannelId(eventType)

  const message = {
    tokens,
    notification: {
      title,
      body,
    },
    data: {
      ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      channelId,
      timestamp: String(Date.now()),
    },
    android: {
      priority: 'high',
      notification: {
        channelId,
        sound: 'default',
        priority: 'max',
        visibility: 'public',
        defaultVibrateTimings: true,
        defaultSound: true,
      },
    },
  }

  try {
    const messaging = getMessaging()
    const response = await messaging.sendEachForMulticast(message)
    console.log(`[FCM MULTICAST] Success: ${response.successCount}, Failures: ${response.failureCount}`)

    // Cleanup expired or invalid tokens automatically
    if (response.failureCount > 0) {
      const invalidTokens = []
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token'
          ) {
            invalidTokens.push(tokens[idx])
          }
        }
      })

      if (invalidTokens.length > 0) {
        console.log(`[FCM] Automatically pruning ${invalidTokens.length} expired device token(s)...`)
        await query('DELETE FROM fcm_tokens WHERE token = ANY($1)', [invalidTokens])
      }
    }

    // Update sent_count in audit table
    if (notificationRecordId) {
      await query('UPDATE admin_notifications SET sent_count = $1 WHERE id = $2', [
        response.successCount,
        notificationRecordId,
      ])
    }

    return {
      status: 'sent',
      successCount: response.successCount,
      failureCount: response.failureCount,
      notificationId: notificationRecordId,
    }
  } catch (err) {
    console.error('[FCM ERROR]: Failed to send multicast message:', err.message)
    return {
      status: 'failed',
      error: err.message,
      notificationId: notificationRecordId,
    }
  }
}

// ── Specific Event Helpers ─────────────────────────────────────

export async function notifyNewOrder(order) {
  const customerName = order.customer_name || order.customer?.name || 'Customer'
  const total = Number(order.total || 0).toLocaleString()
  return dispatchNotification({
    eventType: 'new_order',
    title: 'New Customer Order 🛒',
    body: `Order #${order.id} for Rs. ${total} from ${customerName}`,
    data: {
      type: 'new_order',
      orderId: String(order.id),
      targetScreen: 'orders',
    },
  })
}

export async function notifyOrderStatusChange(orderId, oldStatus, newStatus) {
  return dispatchNotification({
    eventType: 'order_status_updated',
    title: 'Order Status Changed 📦',
    body: `Order #${orderId} changed from "${oldStatus}" to "${newStatus}"`,
    data: {
      type: 'order_status_updated',
      orderId: String(orderId),
      targetScreen: 'orders',
    },
  })
}

export async function notifyNewInquiry(inquiry) {
  const sender = inquiry.name || 'Customer'
  const subject = inquiry.subject || inquiry.message?.substring(0, 40) || 'General Inquiry'
  return dispatchNotification({
    eventType: 'new_inquiry',
    title: 'New Customer Inquiry 💬',
    body: `${sender}: ${subject}`,
    data: {
      type: 'new_inquiry',
      inquiryId: String(inquiry.id),
      targetScreen: 'inquiries',
    },
  })
}

export async function notifyNewReview(review) {
  const author = review.author || 'A verified customer'
  const rating = review.rating ? `${review.rating}★` : ''
  return dispatchNotification({
    eventType: 'new_review',
    title: 'New Product Review ⭐',
    body: `${author} left a ${rating} review on product #${review.productId || review.product_id}`,
    data: {
      type: 'new_review',
      productId: String(review.productId || review.product_id),
      targetScreen: 'reviews',
    },
  })
}

export async function notifyLowInventory(product, remainingStock) {
  return dispatchNotification({
    eventType: 'low_inventory',
    title: 'Low Inventory Alert ⚠️',
    body: `"${product.name}" stock is low: only ${remainingStock} unit(s) remaining!`,
    data: {
      type: 'low_inventory',
      productId: String(product.id),
      targetScreen: 'products',
    },
  })
}
