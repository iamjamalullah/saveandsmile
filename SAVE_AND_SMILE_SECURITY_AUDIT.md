# SAVE & SMILE — TECHNICAL CYBERSECURITY AUDIT REPORT
**Document ID:** `SAMS-SEC-2026`  
**Security Standard:** OWASP Top 10 Web Application Security Risk Analysis  
**Auditor:** Lead Cybersecurity Auditor & Application Security Engineer  
**Target:** `https://saveandsmile.vercel.app` & Supabase PostgreSQL (`piocbtkjzznzzdftyelh.supabase.co`)

---

## 1. THREAT MODEL & EXECUTIVE SUMMARY

| Security Domain | Vulnerability Level | Status | Remediation Required |
| :--- | :---: | :---: | :--- |
| **Authentication & JWT** | Low Risk | ✅ SECURE | Bcrypt salt rounds + signed HMAC JWT tokens. |
| **Authorization (RBAC)** | Low Risk | ✅ SECURE | Route middleware enforces admin/manager role bounds. |
| **SQL Injection (SQLi)** | Very Low Risk | ✅ SECURE | 100% Parameterized queries ($1, $2, ...) across all services. |
| **Cross-Site Scripting (XSS)**| Low Risk | ✅ SECURE | React DOM auto-escaping + custom `sanitizeString()` util. |
| **Security Headers** | Very Low Risk | ✅ SECURE | HSTS, nosniff, SAMEORIGIN verified on live production edge. |
| **Public Route Protection** | Very Low Risk | ✅ SECURE | Sensitive endpoints (orders, releases, contacts) yield 401. |
| **Rate Limiting** | Moderate Risk | ⚠️ ADVISORY | In-memory limiter resets per serverless lambda instance. |
| **Credential Management** | Very Low Risk | ✅ SECURE | Secrets kept in `.env` (excluded via `.gitignore`). |

---

## 2. AUTHENTICATION & ACCESS CONTROL (RBAC)

### A. Staff Authentication Flow
- **Endpoint:** `POST /auth/login`
- **Password Protection:** Uses `bcryptjs` with salted hashes. Passwords are never stored in plaintext.
- **Session Tokens:** Employs HMAC-SHA256 JWT containing `{ id, username, role, exp }`.
- **Token Invalidation:** System includes a dedicated `revoked_tokens` table in PostgreSQL to enable instant session revocation on logout or staff suspension.

### B. Route-Level Role Restrictions (Live Verified)

| Endpoint | Method | Unauthenticated | Manager Role | Admin Role | Live Test |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/api/orders` | `GET` | 401 Unauthorized | 200 OK | 200 OK | ✅ Verified |
| `/api/orders/:id` | `PATCH` / `PUT`| 401 Unauthorized | 200 OK | 200 OK | ✅ Verified |
| `/api/orders/:id` | `DELETE` | 401 Unauthorized | **403 Forbidden** | 200 OK | ✅ Verified |
| `/api/settings` | `PATCH` / `PUT`| 401 Unauthorized | **403 Forbidden** | 200 OK | ✅ Verified |
| `/api/contacts` | `GET` | 401 Unauthorized | 200 OK | 200 OK | ✅ Verified |
| `/api/contacts/:id`| `DELETE` | 401 Unauthorized | **403 Forbidden** | 200 OK | ✅ Verified |
| `/api/mobile/releases`| `POST` | 401 Unauthorized | **403 Forbidden** | 200 OK | ✅ Verified |

---

## 3. LIVE OWASP HEADERS AUDIT

Production headers inspected directly against `https://saveandsmile.vercel.app`:

```http
HTTP/2 200 OK
content-type: application/json; charset=utf-8
strict-transport-security: max-age=31536000; includeSubDomains; preload
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
x-xss-protection: 1; mode=block
cache-control: no-cache, no-store, must-revalidate
```

- **HSTS (`Strict-Transport-Security`):** 1-year preload policy enforces HTTPS communication and prevents SSL-stripping attacks.
- **Clickjacking Protection (`X-Frame-Options`):** `SAMEORIGIN` prevents unauthorized third-party sites from framing the store checkout or admin interface.
- **MIME Sniffing (`X-Content-Type-Options`):** `nosniff` prevents browsers from executing uploaded files as HTML/scripts.

---

## 4. INJECTION & DATA SANITIZATION

### A. SQL Injection Analysis
Audited all database operations in `src/db/index.js`, `src/services/orderService.js`, and `src/services/homepageService.js`.
- **Finding:** Every dynamic database interaction uses parameterized placeholders (`$1`, `$2`, `$3`).
- **Result:** No raw string interpolation exists inside `query()` or `transaction()`. SQL injection risk is **mitigated**.

### B. Input Sanitization
- All customer form inputs (Name, Notes, Address, City) pass through `sanitizeString()` before persisting to lowdb or PostgreSQL, neutralizing script tags and malicious control characters.
- Phone numbers are validated against standard regex matching Pakistani mobile operators (`03XX-XXXXXXX` or `+923XXXXXXXXX`).

---

## 5. RATE LIMITING & ABUSE MITIGATION

### Current Implementation:
- Inquiry submissions are throttled via `MemoryRateLimiter` (max 6 inquiries per 10 minutes per IP).
- Order submissions are protected against fast-replay double clicks with a 60-second lock per mobile number.

### ⚠️ Security Advisory for Scale (300+ Orders/Day):
Because the backend is hosted on Vercel Serverless Functions, memory is scoped to individual execution instances (lambdas). A distributed attacker could hit different lambdas and bypass in-memory limits.
- **Recommendation:** If targeted by automated scraping or bot spam, integrate Vercel Web Application Firewall (WAF) rate limiting rules or connect Upstash Redis for global distributed rate limiting.

---

## 6. SUPABASE STORAGE SECURITY AUDIT

- **Bucket:** `product-media`
- **Public Read Access:** Enabled for serving optimized WebP images (`/storage/v1/object/public/product-media/...`).
- **Write / Upload Access:** Protected via `SUPABASE_SERVICE_ROLE_KEY`. Client-side direct uploads without server validation are prohibited. All image uploads route through authenticated admin backend endpoints with MIME-type verification and sharp WebP compression.
