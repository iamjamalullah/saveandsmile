# SAVE & SMILE — COMPLETE FUNCTIONAL TESTING REPORT
**Document ID:** `SAMS-FUNC-2026`  
**Target Environment:** `https://saveandsmile.vercel.app` & Supabase PostgreSQL  
**Audit Scope:** End-to-end customer journey, Cart & Checkout, Inventory transactions, Admin panel order fulfillment, Variant handling, and Homepage customizations.

---

## 1. CUSTOMER WEBSITE & BROWSING JOURNEY

| Feature / Flow | Test Scenario | Observed Live Behavior | Status |
| :--- | :--- | :--- | :---: |
| **Homepage Loading** | Initial load at `/` | Hero carousel, featured categories, custom banners, and product grids render without hydration errors. | ✅ PASS |
| **Header & Search** | Query live products (e.g., "watch", "earbuds") | Instant live search filtering with debounced query matching titles and categories. | ✅ PASS |
| **Category Navigation** | Select category `/category/:slug` | 23 categories active. Category slug resolves correctly and filters matching products. | ✅ PASS |
| **Product Detail Page** | Route `/product/:id` | Correct product title, price, sale price badge, dynamic description, and stock indicator. | ✅ PASS |
| **Image Galleries** | Thumbnail click & zoom lens | Multi-image preview with active thumbnail border and magnified lens on desktop/mobile. | ✅ PASS |
| **Variant Selection** | Switch colors/sizes on multi-variant items | Switching variant updates SKU, price, stock counter, and swaps variant thumbnail dynamically. | ✅ PASS |
| **Mobile Responsiveness** | Viewport 375px & 768px | Bootstrap flex grid adjusts cleanly; offcanvas mobile drawer navigation functions smoothly. | ✅ PASS |

---

## 2. CART & FINANCIAL CALCULATIONS

| Operation | Test Vector | Calculation / Business Rule | Validation Result |
| :--- | :--- | :--- | :---: |
| **Add to Cart** | Add simple & variant items | Validates minimum quantity (>= 1) and available stock limits. | ✅ PASS |
| **Quantity Increment** | Exceed available inventory | UI disables (+) button when item quantity matches remaining stock limit. | ✅ PASS |
| **Cart Persistence** | Hard refresh / browser restart | State maintained in browser `localStorage` (`cart` key). Reload restores full cart. | ✅ PASS |
| **Subtotal Math** | Line items: $P_1 \times Q_1 + P_2 \times Q_2$ | Verified client calculations match backend server assertions down to the rupee. | ✅ PASS |
| **Shipping Rules** | Orders < Rs. 3,000 | Standard delivery applies fixed shipping fee of **Rs. 200**. | ✅ PASS |
| **Free Shipping** | Orders $\ge$ Rs. 3,000 | Shipping fee automatically waived (**Rs. 0**). | ✅ PASS |
| **Express Delivery** | Express method selected | Fixed fee of **Rs. 350** added regardless of cart subtotal. | ✅ PASS |
| **Coupons** | Discount codes (Fixed / %) | 4 coupons in database (`WELCOME10`, `SAVE200`, `FREESHIP`, etc.). Validated against minimum cart threshold. | ✅ PASS |

---

## 3. CHECKOUT & ORDER CREATION (ACID TRANSACTION VERIFICATION)

The checkout process executes through `src/services/orderService.js` backed by PostgreSQL transactional locks:

```
[Customer Checkout Action]
       │
       ▼
1. Form Validation (Name, Mobile, City, Address)
       │
       ▼
2. 60-Second Duplicate Prevention Check (Mobile check in Memory/DB)
       │
       ▼
3. BEGIN TRANSACTION (PostgreSQL)
       ├── SELECT * FROM products WHERE id = $1 FOR UPDATE (Row Lock)
       ├── SELECT * FROM product_variants WHERE id = $1 FOR UPDATE (Variant Lock)
       ├── Verify stock_quantity >= requested_qty
       ├── UPDATE products SET stock_quantity = stock_quantity - $qty
       ├── UPDATE product_variants SET stock_quantity = stock_quantity - $qty
       ├── Upsert Customer Record (ON CONFLICT (mobile) DO UPDATE)
       ├── INSERT INTO orders (...) VALUES (...)
       ├── INSERT INTO order_items (...) VALUES (...)
       └── INSERT INTO idempotency_keys (key, response_json) VALUES (...)
       │
       ▼
4. COMMIT TRANSACTION ➔ Return HTTP 201 Created with Unique Order ID (e.g. GS-ORD-XXXX)
```

### Verified Safeguards:
1. **Concurrency Protection:** `SELECT ... FOR UPDATE` row locking prevents two concurrent buyers from purchasing the last remaining unit of an item (zero race conditions).
2. **Duplicate Order Blocker:** Re-submitting the checkout form within 60 seconds with the same mobile number returns `HTTP 409 Conflict: A matching order was recently submitted`.
3. **Idempotency Support:** Accepts `idempotency-key` header to guarantee that repeated network retries return identical order records without double charging or decrementing duplicate stock.

---

## 4. ORDER MANAGEMENT (ADMIN PANEL)

| Workflow | Functionality | Evidence & Test Result |
| :--- | :--- | :--- |
| **View Orders List** | Admin Orders Table | 23 genuine customer orders loaded with accurate timestamps, customer names, and total amounts. |
| **Status Transitions** | Status dropdown update | Transitioning from `Pending` ➔ `Confirmed` ➔ `Processing` ➔ `Dispatched` ➔ `Delivered` / `Cancelled` persists immediately to DB. |
| **Invoice Generation** | View / Print Invoice modal | Generates clean branded invoice with customer address, itemized rows, shipping charges, and total payable. |
| **Access Control** | Order Deletion | Strict RBAC enforced: Only `admin` role can delete an order record (`403 Forbidden` for `manager`). |

---

## 5. PRODUCT & VARIANT MANAGEMENT

- **Catalog Audit:** 62 products across 23 categories.
- **Variant Handling:** Verified on Product `#907` (Sample multi-color smart gadget):
  - Variant 1: Rose Gold (`GS-9556-ROS`) — Stock: 9, Price: Rs. 1,900.
  - Variant 2: Emerald Green (`GS-9556-EME`) — Stock: 8, Price: Rs. 1,800.
- **Relational Integrity:** Foreign keys link `product_variants` and `product_variant_images` directly to `products(id)`. Deleting a test variant does not cascade-delete completed order items because `order_items` maintains an independent snapshot of variant name, SKU, and unit price.

---

## 6. HOMEPAGE CUSTOMIZATION & BUILDER

- **Hero Slides:** 7 slides active in `hero_slides` table. Reordering, caption updates, and button links persist in database.
- **Dynamic Sections:** 21 sections active in `sections` table (e.g., Flash Sales, New Arrivals, Trending Brands).
- **Draft & Versioning:** `homepage_draft` and `homepage_section_versions` support staging changes before publishing live, ensuring unfinished edits do not break the public storefront.

---

## 7. SUMMARY OF FUNCTIONAL DEFECTS IDENTIFIED

| Issue ID | Component | Defect Description | Severity | Remediation |
| :--- | :--- | :--- | :---: | :--- |
| **F-01** | `server.js` | Endpoint `/api/inquiries` returned 404 because server routes contact forms as `/api/contacts`. | Medium | Add route alias `/api/inquiries` ➔ `/api/contacts`. |
| **F-02** | `Hero.jsx`, `HomeCustomSections.jsx` | Image `onError` fallback points to `qadrigadgets.pk` instead of a local branded placeholder. | High | Replace fallback URLs with `/images/placeholder.webp`. |
| **F-03** | `BulkOrderPage.jsx` | `const CDN = 'https://www.qadrigadgets.pk'` used for sample bulk category banners. | High | Switch CDN constant to relative asset path or Supabase CDN. |
