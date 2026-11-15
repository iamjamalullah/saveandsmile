# SAVE & SMILE — SECURITY VERIFICATION REPORT
**Document ID:** `SAMS-SEC-VERIFIED-2026`  
**Security Lead:** Lead Application Security Engineer & Cybersecurity Auditor  
**Target:** `https://saveandsmile.vercel.app` & Supabase PostgreSQL (`piocbtkjzznzzdftyelh.supabase.co`)  
**Compliance Standard:** OWASP Top 10 Web Application Security Architecture  

---

## 1. ACCESS CONTROL & ROUTE PROTECTION MATRIX

| Route / Endpoint | Method | Anonymous Request | Manager Role | Admin Role | Security Mechanism |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/api/orders` | `GET` | **401 Unauthorized** | 200 OK | 200 OK | RBAC Token Middleware |
| `/api/orders/:id` | `PATCH` / `PUT`| **401 Unauthorized** | 200 OK | 200 OK | Staff Verification |
| `/api/orders/:id` | `DELETE` | **401 Unauthorized** | **403 Forbidden** | 200 OK | Strict Admin Role Check |
| `/api/settings` | `PATCH` / `PUT`| **401 Unauthorized** | **403 Forbidden** | 200 OK | Strict Admin Role Check |
| `/api/contacts` | `GET` | **401 Unauthorized** | 200 OK | 200 OK | Staff Verification |
| `/api/inquiries` | `GET` | **401 Unauthorized** | 200 OK | 200 OK | Bidirectional Alias Guard |
| `/api/contacts/:id`| `DELETE` | **401 Unauthorized** | **403 Forbidden** | 200 OK | Strict Admin Role Check |
| `/api/upload` | `POST` | **401 Unauthorized** | 200 OK | 200 OK | **NEW: Staff Token Guard** |
| `/api/upload/products`| `POST` | **401 Unauthorized** | 200 OK | 200 OK | **NEW: Staff Token Guard** |
| `/api/mobile/releases`| `POST` | **401 Unauthorized** | **403 Forbidden** | 200 OK | Strict Admin Role Check |

---

## 2. AUTHENTICATION & SESSION LIFECYCLE
1. **Password Encryption:** Passwords are hashed using `bcryptjs` with salt factor 10. Default weak passwords (`admin123`, `manager123`) are explicitly blocked in production environments (`IS_PROD` guard).
2. **JWT Signature:** Uses HMAC-SHA256 signature calculated against server-side secret (`APP_SECRET`).
3. **Session Expiry:** Access tokens carry a maximum lifespan of 24 hours (`TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000`). Expired tokens are immediately rejected by `verifyToken()`.
4. **Token Revocation:** `revoked_tokens` table exists in PostgreSQL to support instant session blacklisting on logout or credential reset.

---

## 3. LIVE OWASP SECURITY HEADERS
Headers verified on production responses from `https://saveandsmile.vercel.app`:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

- **HSTS Enforcement:** Enforces TLS encrypted transmission across all apex and subdomains for 1 year with browser preload qualification.
- **Clickjacking Guard:** `X-Frame-Options: SAMEORIGIN` prevents checkout spoofing or UI redressing inside malicious iframes.
- **MIME Sniffing Block:** `nosniff` prevents MIME confusion attacks.

---

## 4. INJECTION & SANITIZATION DEFENSE
- **SQL Injection Prevention:** Every query in `orderService.js`, `catalogService.js`, `mediaService.js`, and `homepageService.js` strictly utilizes parameterized placeholders (`$1`, `$2`, `$3`). Zero string concatenation is permitted in SQL queries.
- **Cross-Site Scripting (XSS):** React JSX automatically escapes dangerous markup. Additional protection is provided by `sanitizeString()` stripping angle brackets from customer notes, addresses, and inquiry inputs before database insertion.

---

## 5. SECRET & CREDENTIAL ISOLATION
- **Source Code Audit:** Zero API keys, database passwords, or JWT secrets are hardcoded in Git.
- **Environment Exclusions:** `.env` and local backup archives are explicitly listed in `.gitignore`.
- **Client Bundle Protection:** Vite production build was audited; neither `DATABASE_URL` nor `SUPABASE_SERVICE_ROLE_KEY` is leaked into client JavaScript chunks.
