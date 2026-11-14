# Save & Smile Admin — Official Native Android Application

**Application Name:** Save & Smile Admin  
**Package Identifier:** `com.saveandsmile.admin`  
**Production Backend:** `https://saveandsmile.vercel.app/api`  
**Platform Target:** Android 13, 14, 15, and 16  
**Technology:** 100% Native React Native + Expo (TypeScript), Native Android APIs, Supabase Storage, PostgreSQL

---

## 1. Feature Parity & Module Matrix

| Module | Web Admin Panel | Native Android Admin App | Status |
| :--- | :---: | :---: | :---: |
| **Authentication & RBAC** | ✅ Yes | ✅ Yes (Hardware-backed SecureStore) | Verified |
| **Real-Time Data Sync** | ✅ Yes | ✅ Yes (Auto-sync, reconnect & backoff) | Verified |
| **Push Notifications (FCM)** | ❌ No | ✅ Yes (Foreground, Background, Closed) | Native Enhanced |
| **Notification Deep Linking** | ❌ No | ✅ Yes (Tap alert ➔ opens exact order) | Native Enhanced |
| **Dashboard KPIs & Charts** | ✅ Yes | ✅ Yes (Delivered revenue, orders, KPIs) | Verified |
| **Real-time Order Tracking** | ✅ Yes | ✅ Yes (All, Pending, Confirmed, Shipped) | Verified |
| **Order Status Workflow** | ✅ Yes | ✅ Yes (Safe optimistic updates + rollback) | Verified |
| **Direct WhatsApp / Call** | ✅ Yes | ✅ Yes (1-Tap Native Android Intent) | Verified |
| **Customer Delivery Notes** | ✅ Yes | ✅ Yes (Prominent alert banner) | Verified |
| **Product Inventory & SKU** | ✅ Yes | ✅ Yes (Full CRUD + Safeguards) | Verified |
| **Multi-Variant System** | ✅ Yes | ✅ Yes (Color swatches, sizes, matrix) | Verified |
| **Variant-Specific Images** | ✅ Yes | ✅ Yes (WebP per variant) | Verified |
| **Mandatory WebP Pipeline** | ✅ Yes | ✅ Yes (Server-side Sharp compression) | Verified |
| **Camera & Gallery Capture** | ❌ (File input only) | ✅ Yes (Native Camera/Gallery picker) | Native Enhanced |
| **Categories Management** | ✅ Yes | ✅ Yes (CRUD + product safeguards) | Verified |
| **Home Page Editor** | ✅ Yes | ✅ Yes (Hero slides & section order) | Verified |
| **Watch & Shop Video Reels** | ✅ Yes | ✅ Yes (Reels CRUD) | Verified |
| **Customer Reviews Moderation** | ✅ Yes | ✅ Yes (Approve / Reject / Delete) | Verified |
| **Customer Inquiries & Support** | ✅ Yes | ✅ Yes (Call, WhatsApp, Resolve) | Verified |
| **Discounts & Promo Coupons** | ✅ Yes | ✅ Yes (Fixed / Percentage discount) | Verified |
| **Live Sales Reports & Analytics** | ✅ Yes | ✅ Yes (Today, 7D, 30D, All-time) | Verified |
| **Store Settings & Delivery Fees**| ✅ Yes | ✅ Yes (Contact info, shipping rules) | Verified |

---

## 2. Real-Time Architecture & Push Notifications

### Connection Status:
The application features a real-time status indicator:
- 🟢 **Live Sync (Connected)**: Active synchronization with `https://saveandsmile.vercel.app/api`.
- 🔵 **Syncing**: Active bidirectional data exchange.
- 🟡 **Connecting / Reconnecting**: Exponential backoff reconnecting on network recovery.
- 🔴 **Offline**: Offline mode with clear visual indicators and cached data protection.

### Push Notifications:
- Powered by `expo-notifications` and Firebase Cloud Messaging (FCM).
- Configured with dedicated Android 13+ Notification Channels (`orders`, `inventory`, `inquiries`).
- Tapping a notification automatically routes the user directly to the relevant record (e.g. Order Detail screen).
- In-app Notification Center allows reviewing historical alerts and marking them as read.

---

## 3. Security Architecture

1. **Zero Secret Key Exposure:**  
   The application communicates exclusively with the authoritative production backend API at `https://saveandsmile.vercel.app/api`. No Supabase service-role keys or database credentials are ever embedded in the APK or AAB.

2. **Hardware-Backed Secure Storage:**  
   Session tokens and credentials are encrypted and stored via `expo-secure-store` (Android Keystore system).

3. **Role-Based Authorization:**  
   Every sensitive mutation (`orders`, `products`, `categories`, `homepage`) is cryptographically validated on the server with the administrator Bearer token.

---

## 4. Automated Cloud CI/CD Build (GitHub Actions)

A fully automated GitHub Actions workflow is provided at:
`.github/workflows/build-saveandsmile-admin-apk.yml`

When code is pushed to `main` (or triggered manually via GitHub Actions):
1. Spins up an Ubuntu runner with Node 20 and Java JDK 17.
2. Generates an official release keystore for Save & Smile.
3. Compiles the native Android application via Gradle into `app-release.apk`.
4. Publishes `SaveAndSmile-Admin.apk` to GitHub Releases (tag `v1.0.0-admin`).
5. Places the APK directly into `public/downloads/` so it is instantly downloadable from the web Admin Panel.

---

## 5. Local Build & Run Instructions

### Run Locally with Expo Go:
```bash
cd android-admin
npm install
npx expo start --android
```

### Run Automated Test Suite (23/23 tests passing):
```bash
cd android-admin
npm test
```
