package com.saveandsmile.admin.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

object SessionManager {

    private const val PREFS_NAME = "saveandsmile_secure_prefs"
    private const val KEY_AUTH_TOKEN = "auth_bearer_token"
    private const val KEY_USER_NAME = "auth_user_name"
    private const val KEY_USER_ROLE = "auth_user_role"
    private const val KEY_USER_EMAIL = "auth_user_email"

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

    fun logout() {
        prefs.edit().clear().apply()
    }
}
