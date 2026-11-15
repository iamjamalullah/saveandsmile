# SAVE & SMILE — PRODUCTION DOMAIN LAUNCH CHECKLIST
**Document ID:** `SAMS-DOM-2026`  
**Target:** Custom Production Domain Binding & Vercel Migration  
**Auditor:** Lead DevOps & Cloud Infrastructure Engineer

---

## 1. PRE-FLIGHT DOMAIN READINESS CHECKLIST

Before pointing DNS records to Vercel, ensure the following steps are prepared:

- [ ] Domain name purchased (e.g. `saveandsmile.pk` or `saveandsmile.com`) via PKNIC / Namecheap / GoDaddy.
- [ ] Vercel project access with administrative permissions to add Custom Domains.
- [ ] Supabase production project active with SSL enforcement enabled.
- [ ] Codebase cleaned of legacy `qadrigadgets.pk` references.

---

## 2. DNS CONFIGURATION GUIDE (VERCEL PRODUCTION)

Configure the following DNS records at your domain registrar or Cloudflare DNS manager:

| Type | Name / Host | Target Value | TTL | Purpose |
| :---: | :---: | :---: | :---: | :--- |
| **A** | `@` (Root) | `76.76.21.21` | Auto / 300 | Points apex root domain to Vercel Global Edge Network. |
| **CNAME** | `www` | `cname.vercel-dns.com.` | Auto / 300 | Aliases `www` subdomain to Vercel Edge. |
| **TXT** | `_vercel` | *(Vercel verification token)* | Auto | Proves domain ownership during Vercel initial binding. |

> [!IMPORTANT]
> If using Cloudflare DNS, set the Proxy status to **DNS Only (Grey Cloud)** during initial certificate generation so Let's Encrypt ACME challenges resolve directly to Vercel without SSL loop errors. Once active, Full (Strict) SSL proxy may be enabled.

---

## 3. CANONICAL REDIRECTS & SSL CERTIFICATE

1. In Vercel Project Settings ➔ **Domains**:
   - Add both `saveandsmile.pk` and `www.saveandsmile.pk`.
   - Set `www.saveandsmile.pk` as the **Primary Domain**.
   - Configure `saveandsmile.pk` to automatically 301 Redirect to `www.saveandsmile.pk` (ensures single canonical URL for Google SEO indexing).
2. **SSL / TLS Certificate:**
   - Vercel automatically provisions and renews a free Let's Encrypt wildcard SSL certificate with automated HTTP-01 challenge verification.

---

## 4. CODEBASE & CONFIGURATION UPDATES UPON DOMAIN ACTIVATION

### A. Environment Variables (Vercel Project Settings)
Update the following environment keys on Vercel Dashboard:
```env
PUBLIC_URL=https://www.saveandsmile.pk
BASE_URL=https://www.saveandsmile.pk
CORS_ORIGIN=https://www.saveandsmile.pk,https://saveandsmile.pk
```

### B. Robots.txt Canonical Update (`public/robots.txt`)
Update line 28 to point to the new custom domain:
```txt
Sitemap: https://www.saveandsmile.pk/sitemap.xml
```

### C. Dynamic Sitemap Regeneration
Update `scripts/generate-sitemap.js`:
```js
const BASE_URL = 'https://www.saveandsmile.pk'
```
Run `node scripts/generate-sitemap.js` to rebuild `public/sitemap.xml` with all 62 products and 23 categories mapped to the new canonical URL.

---

## 5. POST-LAUNCH VERIFICATION COMMANDS

Run the following terminal commands to verify SSL, headers, and redirects immediately after DNS propagation:

```bash
# 1. Verify Apex Root 301 Redirect to WWW
curl -I https://saveandsmile.pk
# Expected: HTTP/2 301 Moved Permanently -> Location: https://www.saveandsmile.pk/

# 2. Verify WWW Primary Canonical Domain
curl -I https://www.saveandsmile.pk
# Expected: HTTP/2 200 OK

# 3. Verify SSL Certificate Validity
curl -vI https://www.saveandsmile.pk 2>&1 | grep "SSL certificate verify ok"

# 4. Verify OWASP Security Headers on Custom Domain
curl -I https://www.saveandsmile.pk/api/products | grep -i "strict-transport-security"
```

---

## 6. SEARCH CONSOLE & TRACKING HANDOFF

1. **Google Search Console:** Submit `https://www.saveandsmile.pk/sitemap.xml`.
2. **Google Merchant Center:** Submit product catalog feed if running Google Shopping ads.
3. **Facebook Pixel / TikTok Pixel:** Update base domain in pixel settings to track catalog conversions.
