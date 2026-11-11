# QADRI GADGETS — PRODUCTION DEPLOYMENT & GO-LIVE CHECKLIST

Use this step-by-step technical checklist before and during deployment to production.

---

## 1. Pre-Deployment Configuration Checklist

- [x] **Repository Audit:** Clean git working tree, no orphaned scratch files or debug test scripts committed.
- [x] **Frontend Production Build:** Verified clean `npm run build` (Rollup vendor splitting into `vendor-react`, `vendor-libs`, `vendor-ui`).
- [x] **Asset Optimization:** Gzip / Brotli compression configured; images, SVG, and Bootstrap icons verified.
- [x] **Docker Ignore:** `.dockerignore` file created to exclude `node_modules`, `.git`, `.env*`, and temporary files from build context.
- [x] **Database Schema:** `schema.sql` syntax and constraints verified for PostgreSQL 13+.
- [x] **Migration Script:** `migrate.js` verified with 100% data parity against `db.json`.
- [x] **Data Safety:** `db.json` preserved intact as a rollback fallback.

---

## 2. Server & Infrastructure Provisioning (Ubuntu VPS / Cloud)

- [ ] **Operating System:** Ubuntu 22.04 LTS or 24.04 LTS updated (`sudo apt update && sudo apt upgrade -y`).
- [ ] **Node.js Runtime:** Node.js 20.x LTS installed via NodeSource.
- [ ] **PostgreSQL 16:** Installed and running (`sudo systemctl status postgresql`).
- [ ] **Database & User Provisioning:**
  ```bash
  sudo -u postgres psql -c "CREATE USER qadri_admin WITH PASSWORD '<SECURE_RANDOM_PASSWORD>';"
  sudo -u postgres psql -c "CREATE DATABASE qadri_gadgets OWNER qadri_admin;"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE qadri_gadgets TO qadri_admin;"
  ```
- [ ] **Process Manager:** PM2 installed globally (`sudo npm install -g pm2`).
- [ ] **Web Server:** Nginx installed and configured with `deploy/nginx.conf`.
- [ ] **Firewall Hardening (UFW):**
  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 'Nginx Full'
  sudo ufw --force enable
  ```
- [ ] **SSL / TLS Certificate:** Certbot installed and certificates issued for domain:
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d qadrigadgets.pk -d www.qadrigadgets.pk
  ```

---

## 3. Environment Variables & Secrets Checklist

Create `/var/www/qadri-gadgets/.env.production` with strict permissions (`chmod 600`):

| Variable | Required Value / Purpose | Verified |
| :--- | :--- | :---: |
| `NODE_ENV` | `production` | [ ] |
| `PORT` | `3001` | [ ] |
| `HOST` | `127.0.0.1` | [ ] |
| `DATABASE_URL` | `postgres://qadri_admin:<PASSWORD>@127.0.0.1:5432/qadri_gadgets` | [ ] |
| `APP_SECRET` | Cryptographically random 64-char hex string (`openssl rand -hex 32`) | [ ] |
| `ADMIN_EMAIL` | `admin@qadrigadgets.pk` | [ ] |
| `ADMIN_PASSWORD` | Strong password (Min 12 chars, upper, lower, digit, symbol) | [ ] |
| `MANAGER_EMAIL` | `manager@qadrigadgets.pk` | [ ] |
| `MANAGER_PASSWORD`| Strong password (Min 12 chars, upper, lower, digit, symbol) | [ ] |
| `ALLOWED_ORIGINS`| `https://qadrigadgets.pk,https://www.qadrigadgets.pk` | [ ] |
| `TOKEN_EXPIRY_MS`| `28800000` (8 hours) | [ ] |

---

## 4. Application Deployment Execution

- [ ] **Clone Codebase:** Deploy to `/var/www/qadri-gadgets`.
- [ ] **Clean Install:** Execute `npm ci --production=false`.
- [ ] **Compile Frontend:** Execute `npm run build`.
- [ ] **Run Data Migration:**
  ```bash
  export DATABASE_URL="postgres://qadri_admin:<PASSWORD>@127.0.0.1:5432/qadri_gadgets"
  npm run migrate
  ```
- [ ] **Verify Record Counts:** Confirm source and target match for all 13 collections.
- [ ] **Start PM2 Cluster:**
  ```bash
  pm2 start ecosystem.config.cjs --env production
  pm2 save
  sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
  ```
- [ ] **Reload Nginx:** `sudo nginx -t && sudo systemctl reload nginx`.

---

## 5. Post-Deployment Verification Checklist

- [ ] **Health Endpoint:** `curl -I https://qadrigadgets.pk/api/health` returns HTTP 200 `status: healthy`.
- [ ] **Catalog Loading:** Homepage loads products, categories, hero slides, and watch reels.
- [ ] **Security Headers:** Inspect response headers for `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`.
- [ ] **Anonymous Protection:** `curl -I https://qadrigadgets.pk/orders` returns HTTP 401 Unauthorized.
- [ ] **Staff Login:** Log into `/admin` with production admin credentials.
- [ ] **Customer Checkout:** Place a test order on the live site; verify order ID format `GS-ORD-*`, stock decrement in database, and confirmation email/SMS if integrated.
- [ ] **Automated Backup Cron:** Verify daily backup job in crontab or PM2:
  ```bash
  crontab -l | grep pg-backup
  ```

---

## 6. Disaster Recovery & Rollback Runbook

### Fast Rollback to File-Based Database (`db.json`)
If PostgreSQL connectivity fails in production:
```bash
pm2 stop qadri-gadgets-api
sed -i '/DATABASE_URL/d' /var/www/qadri-gadgets/.env.production
pm2 restart qadri-gadgets-api --update-env
```
The server will automatically fall back to serving from `db.json`.

### Restoring PostgreSQL Database from Snapshot
```bash
cd /var/www/qadri-gadgets
node pg-restore.js
npm run test:integrity
```
