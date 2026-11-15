package com.saveandsmile.admin.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.saveandsmile.admin.R
import com.saveandsmile.admin.data.SessionManager
import com.saveandsmile.admin.network.ApiClient
import com.saveandsmile.admin.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class SaveAndSmileFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "SaveAndSmileFCM"
        const val CHANNEL_ORDERS = "channel_orders"
        const val CHANNEL_INQUIRIES = "channel_inquiries"
        const val CHANNEL_INVENTORY = "channel_inventory"
        const val CHANNEL_REVIEWS = "channel_reviews"
        const val CHANNEL_GENERAL = "channel_general"

        fun createNotificationChannels(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                val ordersChannel = NotificationChannel(
                    CHANNEL_ORDERS,
                    "Customer Orders & Status",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Instant alerts for new orders and order status transitions"
                    enableVibration(true)
                    enableLights(true)
                    setShowBadge(true)
                    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                }

                val inquiriesChannel = NotificationChannel(
                    CHANNEL_INQUIRIES,
                    "Customer Inquiries",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notifications for incoming customer questions and contact forms"
                    enableVibration(true)
                    setShowBadge(true)
                }

                val inventoryChannel = NotificationChannel(
                    CHANNEL_INVENTORY,
                    "Low Inventory Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Alerts when product stocks fall below safety thresholds"
                    enableVibration(true)
                    setShowBadge(true)
                }

                val reviewsChannel = NotificationChannel(
                    CHANNEL_REVIEWS,
                    "Customer Reviews",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Notifications when customers submit product ratings and reviews"
                    setShowBadge(true)
                }

                notificationManager.createNotificationChannels(
                    listOf(ordersChannel, inquiriesChannel, inventoryChannel, reviewsChannel)
                )
                Log.d(TAG, "Notification channels successfully created.")
            }
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Refreshed FCM token received: $token")
        SessionManager.saveFcmToken(token)

        // Sync with backend API
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val deviceId = SessionManager.getDeviceId(applicationContext)
                val response = ApiClient.apiService.registerFcmToken(
                    mapOf(
                        "deviceId" to deviceId,
                        "token" to token,
                        "platform" to "android",
                        "appVersion" to "1.0.0"
                    )
                )
                if (response.isSuccessful) {
                    Log.d(TAG, "FCM token successfully registered with backend server.")
                } else {
                    Log.w(TAG, "Backend token registration response: ${response.code()}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to register refreshed token with backend", e)
            }
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "Push message received from: ${remoteMessage.from}")

        val data = remoteMessage.data
        val title = remoteMessage.notification?.title ?: data["title"] ?: "Save & Smile Admin"
        val body = remoteMessage.notification?.body ?: data["body"] ?: "New notification received."
        val channelId = data["channelId"] ?: CHANNEL_GENERAL
        val targetScreen = data["targetScreen"] ?: "dashboard"
        val orderId = data["orderId"]
        val inquiryId = data["inquiryId"]

        showNotification(title, body, channelId, targetScreen, orderId, inquiryId)
    }

    private fun showNotification(
        title: String,
        body: String,
        channelId: String,
        targetScreen: String,
        orderId: String?,
        inquiryId: String?
    ) {
        createNotificationChannels(this)

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("targetScreen", targetScreen)
            orderId?.let { putExtra("orderId", it) }
            inquiryId?.let { putExtra("inquiryId", it) }
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notificationId = (System.currentTimeMillis() % 100000).toInt()
        notificationManager.notify(notificationId, notificationBuilder.build())
    }
}
