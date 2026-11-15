# Save & Smile Admin — Pure Native Android Application (Kotlin + Jetpack Compose)

This is the 100% genuine, pure native Android application for **Save & Smile Admin**, built with Google's official Android stack:
- **Language:** Kotlin 1.9
- **UI Framework:** Jetpack Compose + Material 3 (100% native declarative Android components, zero webviews)
- **Networking:** Retrofit 2.9 + OkHttp 4.12 with automatic JWT Bearer authentication interceptor
- **Security:** `EncryptedSharedPreferences` backed by Android Keystore (AES-256-GCM)
- **Target OS:** Android 8.0 to Android 15 (API levels 26 to 35)

---

## How to Open in Android Studio

1. Open **Android Studio**.
2. Click **Open** and select the folder:
   `d:\D New\Gaget store\gadget-store\android-native-kotlin`
3. Android Studio will automatically sync the Gradle dependencies.
4. Click **Run 'app'** (`Shift + F10`) to launch on your connected phone or emulator.

---

## How to Build the Release APK in Android Studio

1. In Android Studio, go to the top menu: **Build → Generate Signed Bundle / APK**.
2. Select **APK** and click **Next**.
3. Create or select a keystore, enter your passwords, and check **V1 (JAR Signature)** and **V2 (Full APK Signature)**.
4. Click **Finish**.
5. Your signed pure native APK will be generated in `app/build/outputs/apk/release/app-release.apk`.
