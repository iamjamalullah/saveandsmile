package com.saveandsmile.admin.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.util.UUID

object SessionManager {

    private const val PREFS_NAME = "saveandsmile_secure_prefs"
    private const val KEY_AUTH_TOKEN = "auth_bearer_token"
    private const val KEY_USER_NAME = "auth_user_name"
    private const val KEY_USER_ROLE = "auth_user_role"
    private const val KEY_USER_EMAIL = "auth_user_email"
    private const val KEY_DEVICE_ID = "fcm_device_id"
    private const val KEY_FCM_TOKEN = "fcm_registration_token"

    private lateinit var prefs: SharedPreferences

    fun init(context: Context) {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            prefs = EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            // Fallback for devices without keystore hardware backing
            prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    fun saveSession(token: String, name: String, role: String, email: String) {
        prefs.edit()
            .putString(KEY_AUTH_TOKEN, token)
            .putString(KEY_USER_NAME, name)
            .putString(KEY_USER_ROLE, role)
            .putString(KEY_USER_EMAIL, email)
            .apply()
    }

    fun getToken(): String? = prefs.getString(KEY_AUTH_TOKEN, null)

    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "Administrator") ?: "Administrator"

    fun getUserRole(): String = prefs.getString(KEY_USER_ROLE, "admin") ?: "admin"

    fun isLoggedIn(): Boolean = !getToken().isNullOrBlank()

    fun saveFcmToken(token: String) {
        prefs.edit().putString(KEY_FCM_TOKEN, token).apply()
    }

    fun getFcmToken(): String? = prefs.getString(KEY_FCM_TOKEN, null)

    fun getDeviceId(context: Context): String {
        if (!::prefs.isInitialized) {
            init(context)
        }
        var deviceId = prefs.getString(KEY_DEVICE_ID, null)
        if (deviceId.isNullOrBlank()) {
            deviceId = "android-" + UUID.randomUUID().toString()
            prefs.edit().putString(KEY_DEVICE_ID, deviceId).apply()
        }
        return deviceId
    }

    fun logout() {
        val deviceId = prefs.getString(KEY_DEVICE_ID, null)
        prefs.edit().clear().apply()
        // Preserve deviceId across logouts
        if (!deviceId.isNullOrBlank()) {
            prefs.edit().putString(KEY_DEVICE_ID, deviceId).apply()
        }
    }
}
