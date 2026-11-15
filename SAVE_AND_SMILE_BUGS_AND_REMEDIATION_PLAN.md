# SAVE & SMILE — BUGS & REMEDIATION PLAN
**Document ID:** `SAMS-BUGS-2026`  
**Classification System:** Critical (P0), High (P1), Medium (P2), Low (P3)  
**Objective:** Provide exact code patches and verification commands for all identified pre-launch issues.

---

## 1. PRIORITIZED DEFECT INVENTORY

| Bug ID | Severity | Category | Affected File(s) | Impact Summary |
| :---: | :---: | :---: | :--- | :--- |
| **BUG-01** | **High (P1)** | Brand Decoupling | `Hero.jsx`, `HomeCustomSections.jsx`, `Modals.jsx`, `WatchAndShop.jsx`, `BulkOrderPage.jsx`, `homepageService.js` | Legacy domain `qadrigadgets.pk` referenced in fallback image URLs. |
| **BUG-02** | **Medium (P2)** | API Compatibility | `server.js` | `/api/inquiries` returns 404 because backend route is registered as `/contacts`. |
| **BUG-03** | **Medium (P2)** | SEO & Indexing | `public/robots.txt`, `public/sitemap.xml`, `scripts/generate-sitemap.js` | Hardcoded `saveandsmile.vercel.app` canonical URLs need custom domain mapping. |
| **BUG-04** | **Low (P3)** | Latency / UX | Vercel Serverless Lifecycle | 2.2s p95 cold start after 15 minutes of store inactivity. |
| **BUG-05** | **Low (P3)** | Security / Scale | `server.js` (MemoryRateLimiter) | Rate limits are in-memory per lambda rather than distributed across instances. |

---

## 2. DETAILED REMEDIATION SPECIFICATIONS

### BUG-01: Remove Legacy Domain `qadrigadgets.pk` Fallbacks
- **Severity:** High (P1)
- **Root Cause:** When the project was branched from its earlier prototype, default `onError` and placeholder fallback URLs were left pointing to `https://www.qadrigadgets.pk/images/banners/...`.
- **Affected Files:**
  1. `src/components/Hero.jsx` (Line 81)
  2. `src/components/HomeCustomSections.jsx` (Lines 16, 25, 41, 69, 75, 102, 106, 120, 124, 202, 228, 232)
  3. `src/components/Modals.jsx` (Line 320)
  4. `src/components/WatchAndShop.jsx` (Line 103)
  5. `src/pages/BulkOrderPage.jsx` (Line 6)
  6. `src/services/homepageService.js` (Line 91)
- **Remediation Code:**
  Replace hardcoded URLs with local static assets or clean placeholder SVG/WebP:
  ```js
  // BEFORE:
  onError={(e) => { e.target.src = 'https://www.qadrigadgets.pk/images/banners/default.webp' }}
  
  // AFTER:
  onError={(e) => { e.target.src = '/images/banner-placeholder.webp' }}
  ```
  In `BulkOrderPage.jsx`:
  ```js
  // BEFORE:
  const CDN = 'https://www.qadrigadgets.pk'
  
  // AFTER:
  const CDN = '' // Use local relative paths or Supabase Storage public CDN
  ```

---

### BUG-02: Add Route Alias for `/api/inquiries`
- **Severity:** Medium (P2)
- **Root Cause:** The admin contact inquiry UI and client-side contact forms query `/api/inquiries`, but json-server mounts the collection as `/contacts` and `/api/contacts`.
- **Affected File:** `server.js`
- **Remediation Code:**
  Add alias rewrite in `server.js` before router mounting:
  ```js
  // Route alias: /api/inquiries -> /api/contacts
  server.use((req, res, next) => {
    if (req.url.startsWith('/api/inquiries')) {
      req.url = req.url.replace('/api/inquiries', '/api/contacts')
    } else if (req.url.startsWith('/inquiries')) {
      req.url = req.url.replace('/inquiries', '/contacts')
    }
    next()
  })
  ```
- **Verification:**
  ```bash
  curl -I https://saveandsmile.vercel.app/api/inquiries
  # Expected: HTTP/2 401 Unauthorized (Auth guard verified) instead of 404 Not Found.
  ```

---

### BUG-03: Custom Domain SEO Canonical Synchronization
- **Severity:** Medium (P2)
- **Root Cause:** XML sitemaps and robots.txt explicitly specify `https://saveandsmile.vercel.app/`.
- **Affected Files:** `public/robots.txt`, `public/sitemap.xml`, `scripts/generate-sitemap.js`.
- **Remediation Step:**
  Once the custom domain (e.g. `https://www.saveandsmile.pk`) is activated in Vercel:
  1. Update `BASE_URL` in `scripts/generate-sitemap.js`.
  2. Run `node scripts/generate-sitemap.js`.
  3. Commit and push the generated `public/sitemap.xml` and updated `public/robots.txt`.

---

### BUG-04: Serverless Cold Start Elimination (p95 = 2.2s)
- **Severity:** Low (P3)
- **Root Cause:** Vercel puts idle lambdas to sleep after 15 minutes of zero requests.
- **Remediation Step:**
  Set up a free keepalive HTTP monitor (e.g. UptimeRobot or GitHub Actions Scheduled Workflow) pinging:
  ```
  GET https://saveandsmile.vercel.app/api/heroSlides
  Frequency: Every 5 minutes
  ```
  This keeps the Node.js runtime and Supabase connection pool hot in memory, dropping response latency to under 300ms for all visitors.

---

### BUG-05: Distributed Rate Limiting for Scale
- **Severity:** Low (P3)
- **Root Cause:** `MemoryRateLimiter` is in-process memory. Multiple Vercel lambdas have separate memory spaces.
- **Remediation Step (Future Enhancement):**
  When traffic exceeds 500+ orders/day, add Upstash Redis (`@upstash/ratelimit`) to synchronize rate limits globally across all edge locations.

---

## 3. REGRESSION TEST VERIFICATION CHECKLIST

After applying the above patches, execute this 3-step verification:

1. [ ] **Brand Check:** Run `Select-String -Path 'src\**\*.*' -Pattern 'qadrigadgets'` to ensure 0 matching lines exist in `src/`.
2. [ ] **Inquiries Check:** Call `GET /api/inquiries` and confirm status 401/200 rather than 404.
3. [ ] **Build Check:** Run `npm run build` to confirm zero Vite compilation errors.
