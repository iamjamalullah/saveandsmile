# SAVE & SMILE — PRODUCTION DOMAIN LAUNCH CHECKLIST
**Document ID:** `SAMS-DOM-CHECKLIST-2026`  
**DevOps & Infrastructure Lead:** Senior DevOps Engineer  
**Scope:** Custom Production Domain Binding, DNS Routing, and Vercel Deployment  

---

## 1. PRE-FLIGHT OWNER DOMAIN CONFIRMATION

> [!IMPORTANT]
> The platform code has been completely decoupled from temporary or legacy domains and now dynamically adapts to **any custom domain** approved and registered by the owner (e.g. `saveandsmile.pk`, `saveandsmile.com`, or `saveandsmile.store`). Do not change DNS records until the confirmed registrar domain is active in your control panel.

### Checklist:
- [ ] Domain name purchased via PKNIC / Namecheap / GoDaddy / Cloudflare.
- [ ] Vercel dashboard access with Administrator role on `saveandsmile` project.
- [ ] Production branch `feature/final-production-readiness` (or `main` after owner merge) deployed.

---

## 2. DNS CONFIGURATION RECORDS (VERCEL PRODUCTION)

Add these records at your DNS management panel (Cloudflare / PKNIC / Namecheap):

| Record Type | Host / Name | Target / Destination | TTL | Purpose |
| :---: | :---: | :---: | :---: | :--- |
| **A** | `@` (Apex) | `76.76.21.21` | Auto / 300 | Routes root domain traffic directly to Vercel Global Edge. |
| **CNAME** | `www` | `cname.vercel-dns.com.` | Auto / 300 | Routes `www` traffic to Vercel Edge. |
| **TXT** | `_vercel` | *(Issued by Vercel)* | Auto | Verifies domain ownership during binding. |

> [!TIP]
> If using Cloudflare DNS, set the Proxy status to **DNS Only (Grey Cloud)** for the initial Let's Encrypt SSL issuance. Once Vercel issues the certificate, you may switch to Proxied (Orange Cloud) with Full (Strict) SSL.

---

## 3. VERCEL CANONICAL REDIRECT & SSL PROVISIONING

1. In Vercel Project ➔ **Settings** ➔ **Domains**:
   - Add your apex domain: `YOUR_DOMAIN.pk`
   - Add your `www` subdomain: `www.YOUR_DOMAIN.pk`
   - Select `www.YOUR_DOMAIN.pk` as **Recommended / Primary Domain**.
   - Configure apex `YOUR_DOMAIN.pk` to **Redirect (301 Permanent)** to `www.YOUR_DOMAIN.pk`.
2. **Automated SSL:**
   - Vercel automatically negotiates with Let's Encrypt and provisions a free wildcard SSL certificate. Renewal is 100% automated.

---

## 4. ONE-CLICK SITEMAP & ENVIRONMENT REGENERATION

Once your custom domain is connected, run:
```bash
# Example: If your domain is https://www.saveandsmile.pk
node scripts/generate-sitemap.js https://www.saveandsmile.pk
```
This regenerates `public/sitemap.xml` with all 93 canonical URLs mapped to your new domain.

The frontend client-side utility `src/utils/seo.js` (`getBaseUrl()`) will **automatically detect the custom domain from the live browser origin** and output the correct canonical tags, OpenGraph URLs, and Schema.org JSON-LD without any manual code changes!

---

## 5. POST-LAUNCH VERIFICATION COMMANDS

Run these commands in PowerShell or terminal once DNS propagates:

```bash
# 1. Verify Apex Root 301 Redirect to WWW
curl -I https://YOUR_DOMAIN.pk
# Output: HTTP/2 301 -> location: https://www.YOUR_DOMAIN.pk/

# 2. Verify WWW Primary Canonical Domain
curl -I https://www.YOUR_DOMAIN.pk
# Output: HTTP/2 200 OK

# 3. Verify SSL Certificate Chain
curl -vI https://www.YOUR_DOMAIN.pk 2>&1 | grep "SSL certificate verify ok"

# 4. Verify OWASP Security Headers on Custom Domain
curl -I https://www.YOUR_DOMAIN.pk/api/products | grep -i "strict-transport-security"
```
