package com.saveandsmile.admin

import android.app.Application
import com.saveandsmile.admin.data.SessionManager
import com.saveandsmile.admin.network.ApiClient

class SaveAndSmileApp : Application() {

    override fun onCreate() {
        super.onCreate()
        SessionManager.init(this)
        ApiClient.init(this)
    }
}
