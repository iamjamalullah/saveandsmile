# Save & Smile Admin — Official Android Application

**Application Name:** Save & Smile Admin  
**Package Identifier:** `com.saveandsmile.admin`  
**Production Backend:** `https://saveandsmile.vercel.app/api`  
**Platform Target:** Android 13, 14, 15, and 16  
**Architecture:** React Native + Expo (TypeScript), Native Modules, Supabase Storage, PostgreSQL

---

## 1. Feature Parity Matrix

| Module | Web Admin Panel | Android Admin App | Status |
| :--- | :---: | :---: | :---: |
| **Authentication & RBAC** | ✅ Yes | ✅ Yes (SecureStore JWT) | Verified |
| **Dashboard KPIs & Charts** | ✅ Yes | ✅ Yes (Revenue, Orders, Low Stock) | Verified |
| **Real-time Order Tracking** | ✅ Yes | ✅ Yes (Pull-to-refresh & Sync) | Verified |
| **Order Status Workflow** | ✅ Yes | ✅ Yes (Pending ➔ Delivered) | Verified |
| **Direct WhatsApp / Call Customer** | ✅ Yes | ✅ Yes (1-Tap Native Intent) | Verified |
| **Customer Special Delivery Notes** | ✅ Yes | ✅ Yes (Highlighted Banner) | Verified |
| **Product Inventory & SKU** | ✅ Yes | ✅ Yes (Create, Edit, Delete) | Verified |
| **Multi-Variant System** | ✅ Yes | ✅ Yes (Colors, Sizes, Matrix) | Verified |
| **Variant-Specific Images** | ✅ Yes | ✅ Yes (WebP per variant) | Verified |
| **Mandatory WebP Image Upload** | ✅ Yes | ✅ Yes (Server Sharp Pipeline) | Verified |
| **Camera & Gallery Capture** | ❌ (Browser file only) | ✅ Yes (Native Camera/Gallery) | Enhanced |
| **Categories Management** | ✅ Yes | ✅ Yes (CRUD + Safeguards) | Verified |
| **Home Page Editor & Publishing**| ✅ Yes | ✅ Yes (Hero Slides & Sections)| Verified |
| **Watch & Shop Video Reels** | ✅ Yes | ✅ Yes (Reels CRUD) | Verified |
| **Customer Reviews Moderation** | ✅ Yes | ✅ Yes (Approve / Reject) | Verified |
| **Store Settings & Delivery Fees**| ✅ Yes | ✅ Yes (Contact, COD & Rules)| Verified |
| **Export to CSV / Invoices** | ✅ Yes | ✅ Yes (Native Share & CSV) | Verified |

---

## 2. Security Architecture

1. **Zero Secret Key Exposure:**  
   The application communicates exclusively with the authoritative production backend API at `https://saveandsmile.vercel.app/api`. No Supabase service-role keys or database credentials are ever embedded in the APK or AAB.

2. **Hardware-Backed Secure Storage:**  
   Session tokens and credentials are encrypted and stored via `expo-secure-store` (Android Keystore system).

3. **Role-Based Authorization:**  
   Every sensitive mutation (`orders`, `products`, `categories`, `homepage`) is cryptographically validated on the server with the administrator Bearer token.

---

## 3. Mandatory WebP Image System

Every product image, gallery item, variant photo, and category thumbnail captured via Camera or selected from Gallery is transmitted to the server's centralized WebP conversion endpoint (`POST /api/upload`).
- The server processes the image via Sharp.
- Converts to optimized WebP format with preserved alpha channel.
- Directly uploads to Supabase Storage and returns permanent CDN URLs.

---

## 4. Building the Installable APK and Google Play AAB

### Prerequisites:
Install EAS CLI globally (if not already installed):
```bash
npm install -g eas-cli
```

### Build Installable APK (For Direct Device Testing):
```bash
cd android-admin
eas build --platform android --profile preview
```
*This produces a standalone `.apk` file that can be installed directly on any Android device.*

### Build Google Play Store AAB (App Bundle):
```bash
cd android-admin
eas build --platform android --profile production
```
*This produces an optimized `.aab` file ready for upload to Google Play Console.*

### Local Android Studio Build (Optional):
```bash
npx expo prebuild -p android
cd android
./gradlew assembleRelease
```
*The resulting APK will be at `android/app/build/outputs/apk/release/app-release.apk`.*

---

## 5. Running the Application Locally (Expo Go):
```bash
cd android-admin
npm install
npx expo start --android
```
Scan the QR code in the Expo Go app on your Android device to test live with instant hot-reload.
