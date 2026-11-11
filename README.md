# Gadget Store – React Storefront & Admin Panel

An e-commerce storefront with Admin, Manager and Customer consoles (React 19 + React Router 8 + Vite + Bootstrap 5), backed by a json-server API. Tailor-made for a modern gadgets & wholesale store.

---

## 🚀 Running the Project

```bash
npm install
npm run dev       # Starts json-server (3001) + Vite (5173) together
npm run api       # API only  → http://127.0.0.1:3001
npm run web       # Vite only → http://localhost:5173
npm run build     # Production build in /dist
```

Requires **Node.js 18+**. Vite proxies `/api/*` to the local json-server, so the app always calls relative `/api` URLs.

### Data layer

`db.json` is the database: products, categories, homepage hero slides and sections, reviews, orders, coupons, Watch & Shop reels and store settings. The storefront and both consoles read and write through `src/api.js` and `src/context/StoreDataContext.jsx` — there is no hard-coded catalogue left in the frontend.

REST endpoints (json-server): `/products`, `/categories`, `/heroSlides`, `/sections`, `/reviews`, `/orders`, `/coupons`, `/watchShop`, `/settings`.

---

## 🛠️ Accessing the Admin Panel

The consoles are real routes handled by React Router:

- **Admin:** [`http://localhost:5173/admin`](http://localhost:5173/admin) (tabs: `/admin/products`, `/admin/orders`, `/admin/categories`, `/admin/analytics`, `/admin/reviews`, `/admin/watch-shop`, `/admin/settings`)
- **Manager:** [`http://localhost:5173/manager`](http://localhost:5173/manager) (tabs: `/manager/orders`, `/manager/inventory`, `/manager/reviews`, `/manager/reports`)
- **Back to Store:** use “View live store” in the sidebar or the footer panel links.

The storefront mirrors the Qadri Gadgets wholesale store: ticker, hero slider, category rail, product sections, Watch & Shop reels, reviews, category tabs, cart, wishlist, quick view, search and checkout.

### Storefront routes

| Route | Page |
| --- | --- |
| `/` | Home |
| `/shop` | Shop / all products (price filter, sorting, grid density) |
| `/category/:slug` | Category listing (e.g. `/category/smart-watches`) |
| `/product/:slug` | Product detail: multi-image gallery, optional video, wholesale price breaks, specifications, shipping and reviews |
| `/search?q=` | Search results |
| `/wishlist` | Saved products |
| `/checkout` | Delivery method, payment method, coupon codes, editable cart lines and order summary |
| `/account` | Customer dashboard, orders, wishlist, addresses |
| `/login`, `/signup` | Authentication pages |
| `/about-us`, `/contact`, `/support`, `/reviews` | Content pages |
| `/terms-conditions`, `/privacy-policy`, `/bulk-order` | Policy and wholesale pages |

### Panels

All three panels share one responsive console design (collapsible sidebar, sticky topbar, KPI cards, data tables that scroll on small screens).

| Panel | Where | What it does |
| --- | --- | --- |
| Admin | `/admin` (also `/admin/products`, `/admin/orders`, …) | Dashboard, analytics, products, categories, orders, reviews, Watch & Shop, store settings |
| Manager | `/manager` (also `/manager/orders`, `/manager/inventory`, …) | Operations overview, fulfilment queue, order status updates, stock and inventory editing, review moderation, reports |
| Customer | `/account` | Dashboard with order stats, order history and reorder, wishlist, saved addresses, editable profile |

Panels can be switched from the sidebar footer (Admin ⇄ Manager) or from the Manager/Admin links in the storefront footer. The customer panel opens from the account icon or footer. Panel data is shared through the same store context, so an order placed on the storefront appears in the admin and manager queues immediately.

---

## 💼 Professional Admin Panel Features

### 1. 📊 Executive Dashboard (`/admin`)
- **Key Metrics:** Live Total Revenue (Rs.), Total Orders, Catalog Items, and Average Order Value (AOV).
- **Interactive Revenue Chart:** Responsive monthly sales and revenue performance (SVG-powered with interactive tooltips).
- **Category Volume:** Progress bars showing contribution by categories (Storage, Electronics, Watches, Perfumes, etc.).
- **Order Status Distribution:** Pending, Processing, Shipped, Delivered counters.
- **Recent Orders Table:** Quick view of the latest customer orders with real-time status badges.
- **Low Stock Inventory Alerts:** Highlighting products with 5 or fewer items remaining.

### 2. 📦 Product Inventory Management (`/admin/products`)
- **Real-Time Filtering & Search:** Filter by category, homepage section group, stock status (In Stock, Low Stock, Out of Stock), or search by title/SKU.
- **Dual View Modes:** Seamlessly switch between **Table View** and **Responsive Grid Cards View**.
- **Full CRUD:**
  - **Add Product:** Title, Category, Section Group, Selling Price, Old Price, Stock, SKU, Description, main image, **extra gallery images** and an optional **product video** URL.
  - **Edit Product:** Instant updates with automatic discount percentage calculation.
  - **Delete Product:** Safe modal confirmation with product preview.
  - **Quick Stock Switch:** Instant one-click restock / out-of-stock toggle.
- **Export to CSV:** Download product inventory list as CSV.

### 3. 🛒 Customer Orders & Invoicing (`/admin/orders`)
- **Status Tabs:** Filter orders by All, Pending, Processing, Shipped, Delivered, or Cancelled.
- **City & Search Filters:** Filter by Pakistani cities (Karachi, Lahore, Islamabad, etc.) or search by order number or customer phone.
- **Order Details Modal:**
  - Complete customer profile with address, phone number, and direct **"Chat on WhatsApp"** button.
  - Ordered items list with images, quantities, unit prices, and line subtotals.
  - Courier tracking number management (TCS, Leopard, PostEx).
  - Status management buttons (Processing, Shipped, Delivered, Cancelled).
  - **Thermal / A4 Printable Invoice:** Print official receipt with store logo, customer details, and COD payment slip.
- **Live Sync:** Orders submitted via customer storefront checkout automatically appear in this list!

### 4. 🏷️ Categories & Display Sections (`/admin/categories`)
- **Category Manager:** Visual grid of all 23 store categories with emoji icons and assigned product counts.
- **Add / Edit / Delete Categories:** Custom icon picker and image link.
- **Homepage Section Themes:** Overview of the 8 homepage section themes (Gold, Mint, Lavender) and their group bindings.

### 5. 📈 Business Analytics & Reports (`/admin/analytics`)
- **Regional Demand:** Order distribution by Pakistani cities with visual progress bars.
- **Catalog Health:** Breakdown of healthy stock vs low stock vs out-of-stock SKUs.
- **Search Queries:** High-intent trending searches entered by customers on the storefront.
- **Wholesale Margin Estimates:** Projected margin calculations.

### 6. ⭐ Customer Reviews Moderation (`/admin/reviews`)
- **Rating Summary:** Average rating score (4.9/5 stars) and distribution.
- **Review Moderation:** Approve, hide, or delete customer testimonials.
- **Add Testimonials:** Manually record verified customer feedback.

### 7. 🎬 Watch & Shop Video Showcase (`/admin/watch-shop`)
- Update short video showcase titles, prices, and thumbnails for the storefront reel.

### 8. ⚙️ Store Configuration & Settings (`/admin/settings`)
- **Branding:** Store Name, Tagline, Currency symbol, and physical warehouse address.
- **Announcement Bar:** Update scrolling marquee message across the storefront header.
- **Contact Details:** Phone, WhatsApp number, and support email.
- **Shipping Policies:** Free shipping threshold and flat rate fees.
- **Data Utilities:** Export JSON backup and one-click factory reset.

---

## 🎨 Technology Stack

- **React 19** (Context API, Hooks, State management)
- **React Router 8** (`react-router` package — real URLs, no hash routing)
- **json-server** REST API backed by `db.json`
- **Vite 8** dev server with `/api` proxy
- **Bootstrap 5.3 & Bootstrap Icons** (Responsive Grid, Cards, Tables, Modals, Forms, Badges, Offcanvas)
- **Vite 8** (Lightning-fast builds and HMR)
- **LocalStorage Persistence** (`gs_admin_products`, `gs_admin_orders`, `gs_admin_settings`, `gs_admin_categories`, `gs_admin_reviews`)
