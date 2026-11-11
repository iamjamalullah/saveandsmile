# ==============================================================================
# Multi-stage Production Dockerfile for Qadri Gadgets (PostgreSQL Ready)
# ==============================================================================

# Stage 1: Build the React + Vite Frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Server Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

# Copy compiled frontend distribution
COPY --from=builder /app/dist ./dist

# Copy backend server, database layer, services, and migration tools
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/db.json ./db.json
COPY --from=builder /app/schema.sql ./schema.sql
COPY --from=builder /app/migrate.js ./migrate.js
COPY --from=builder /app/pg-backup.js ./pg-backup.js
COPY --from=builder /app/pg-restore.js ./pg-restore.js
COPY --from=builder /app/backup.js ./backup.js
COPY --from=builder /app/restore.js ./restore.js
COPY --from=builder /app/verify-db.js ./verify-db.js
COPY --from=builder /app/src ./src

# Create persistent storage directory for backups and db volume
RUN mkdir -p /app/backups /app/logs && chown -R node:node /app
USER node

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "server.js"]
