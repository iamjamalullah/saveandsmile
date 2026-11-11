#!/bin/bash
# ==============================================================================
# QADRI GADGETS – AUTOMATED UBUNTU VPS PRODUCTION PROVISIONING SCRIPT
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS
# Installs: Node.js 20, PostgreSQL 16, Nginx, PM2, Certbot (SSL)
# ==============================================================================

set -euo pipefail

DOMAIN="qadrigadgets.pk"
APP_DIR="/var/www/qadri-gadgets"
DB_NAME="qadri_gadgets"
DB_USER="qadri_admin"

echo "==============================================================="
echo "   STARTING QADRI GADGETS VPS DEPLOYMENT & HARDENING"
echo "==============================================================="

# 1. Update OS Packages
echo "[1/8] Updating Ubuntu system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw software-properties-common

# 2. Install Node.js 20 LTS
echo "[2/8] Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
sudo npm install -g pm2

# 3. Install & Configure PostgreSQL 16
echo "[3/8] Installing PostgreSQL 16..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "Configuring PostgreSQL user and database..."
PG_PASS=$(openssl rand -hex 16)
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${PG_PASS}';" || true
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

# 4. Configure Firewall (UFW)
echo "[4/8] Configuring UFW firewall rules..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 5. Clone / Prepare Application Directory
echo "[5/8] Preparing application directory at ${APP_DIR}..."
sudo mkdir -p ${APP_DIR} /var/www/certbot
sudo chown -R $USER:$USER ${APP_DIR}

if [ -f "${APP_DIR}/package.json" ]; then
  cd ${APP_DIR}
  echo "Installing dependencies..."
  npm ci
  echo "Compiling frontend assets..."
  npm run build
fi

# 6. Setup Production Environment Variables
echo "[6/8] Generating secure production environment variables..."
ENV_FILE="${APP_DIR}/.env.production"
APP_SECRET_VAL=$(openssl rand -hex 32)
ADMIN_PASS_VAL=$(openssl rand -base64 12)
MANAGER_PASS_VAL=$(openssl rand -base64 12)

cat <<EOF > ${ENV_FILE}
NODE_ENV=production
PORT=3001
HOST=127.0.0.1
DATABASE_URL=postgres://${DB_USER}:${PG_PASS}@127.0.0.1:5432/${DB_NAME}
APP_SECRET=${APP_SECRET_VAL}
ADMIN_EMAIL=admin@qadrigadgets.pk
ADMIN_PASSWORD=${ADMIN_PASS_VAL}
MANAGER_EMAIL=manager@qadrigadgets.pk
MANAGER_PASSWORD=${MANAGER_PASS_VAL}
ALLOWED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}
EOF
chmod 600 ${ENV_FILE}

# 7. Run Database Migration
echo "[7/8] Running PostgreSQL database schema migration and seed..."
cd ${APP_DIR}
export DATABASE_URL="postgres://${DB_USER}:${PG_PASS}@127.0.0.1:5432/${DB_NAME}"
node migrate.js

# 8. Setup Nginx & PM2
echo "[8/8] Configuring Nginx and starting PM2..."
sudo cp ${APP_DIR}/deploy/nginx.conf /etc/nginx/sites-available/qadri-gadgets
sudo ln -sf /etc/nginx/sites-available/qadri-gadgets /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Start application via PM2
pm2 start ecosystem.config.cjs --env production
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# Setup daily automated cron backup
(crontab -l 2>/dev/null; echo "0 3 * * * cd ${APP_DIR} && node pg-backup.js >> /var/log/pg-backup.log 2>&1") | crontab -

echo "==============================================================="
echo "   DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "==============================================================="
echo "Generated Staff Credentials (STORE SAFELY):"
echo "  Admin Email:     admin@qadrigadgets.pk"
echo "  Admin Password:  ${ADMIN_PASS_VAL}"
echo "  Manager Email:   manager@qadrigadgets.pk"
echo "  Manager Password: ${MANAGER_PASS_VAL}"
echo ""
echo "Next step: Run Certbot to acquire SSL certificates:"
echo "  sudo apt install -y certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "==============================================================="
