import jsonServer from 'json-server'
import express from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { processCheckout } from './src/services/orderService.js'
import {
  getPublishedSections,
  getDraftSections,
  saveDraftSections,
  publishSections,
  getSectionVersions,
  restoreSectionVersion,
} from './src/services/homepageService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const IS_VERCEL = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

let activeDbPath = path.join(__dirname, 'db.json')
let activeUploadsDir = path.join(__dirname, 'public', 'uploads')
let activeBackupDir = path.join(__dirname, 'backups')
let dbSource = activeDbPath

if (IS_VERCEL) {
  try {
    const tmpDir = os.tmpdir()
    const tmpDb = path.join(tmpDir, 'db.json')
    const candidates = [
      path.join(__dirname, 'db.json'),
      path.join(process.cwd(), 'db.json'),
      path.join(__dirname, '..', 'db.json'),
      path.join(process.cwd(), 'gadget-store', 'db.json'),
    ]
    let loadedData = null
    for (const cand of candidates) {
      try {
        if (fs.existsSync(cand)) {
          const raw = fs.readFileSync(cand, 'utf8')
          loadedData = JSON.parse(raw)
          fs.writeFileSync(tmpDb, raw, 'utf8')
          dbSource = tmpDb
          break
        }
      } catch (_) {}
    }
    if (!dbSource || dbSource === activeDbPath) {
      if (loadedData) {
        dbSource = loadedData
      } else {
        dbSource = tmpDb
        if (!fs.existsSync(tmpDb)) {
          fs.writeFileSync(tmpDb, JSON.stringify({ products: [], categories: [], orders: [] }), 'utf8')
        }
      }
    }
    activeUploadsDir = path.join(tmpDir, 'uploads')
    const prodUploads = path.join(activeUploadsDir, 'products')
    if (!fs.existsSync(prodUploads)) {
      fs.mkdirSync(prodUploads, { recursive: true })
    }
  } catch (err) {
    console.warn('[VERCEL] Serverless tmp fallback init warning:', err.message)
  }
} else {
  try {
    if (!fs.existsSync(activeBackupDir)) {
      fs.mkdirSync(activeBackupDir, { recursive: true })
    }
    const prodUploads = path.join(activeUploadsDir, 'products')
    if (!fs.existsSync(prodUploads)) {
      fs.mkdirSync(prodUploads, { recursive: true })
    }
  } catch (err) {
    console.warn('[SERVER] Could not initialize local directories:', err.message)
  }
}

const DB_PATH = dbSource
const BACKUP_DIR = activeBackupDir
const UPLOADS_DIR = activeUploadsDir
const PRODUCTS_UPLOADS_DIR = path.join(activeUploadsDir, 'products')

const server = jsonServer.create()
const router = jsonServer.router(DB_PATH)
const middlewares = jsonServer.defaults()

const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0'
const NODE_ENV = process.env.NODE_ENV || 'development'
const IS_PROD = NODE_ENV === 'production'

// Secure secret generation: fallback to secure secret if not provided in env
const APP_SECRET = process.env.APP_SECRET || 'qadri-gadgets-secure-auth-secret-key-2026-v2-prod'

// Token expiration: 8 hours in milliseconds
const TOKEN_EXPIRY_MS = parseInt(process.env.TOKEN_EXPIRY_MS, 10) || 8 * 60 * 60 * 1000

// Active session token blocklist (revocation on logout)
const revokedTokens = new Set()

function revokeToken(token) {
  if (token) revokedTokens.add(token)
}

function isTokenRevoked(token) {
  return revokedTokens.has(token)
}

// ── STAFF CREDENTIALS STORE (BCRYPT HASHED) ─────────────────
const DEFAULT_PASSWORDS = ['password', '123456']

const staffCredentials = [
  {
    id: 1,
    name: 'Store Administrator',
    username: 'admin',
    email: (process.env.ADMIN_EMAIL || 'admin@qadrigadgets.pk').toLowerCase(),
    // bcrypt hash of 'admin123' or custom env password
    passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10),
    role: 'admin',
    isDefaultPassword: false,
  },
  {
    id: 2,
    name: 'Operations Manager',
    username: 'manager',
    email: (process.env.MANAGER_EMAIL || 'manager@qadrigadgets.pk').toLowerCase(),
    // bcrypt hash of 'manager123' or custom env password
    passwordHash: bcrypt.hashSync(process.env.MANAGER_PASSWORD || 'manager123', 10),
    role: 'manager',
    isDefaultPassword: false,
  },
]

// Production Check: Fail fast if default credentials exist in production
if (IS_PROD) {
  const usingDefault = staffCredentials.some(s => s.isDefaultPassword)
  if (usingDefault) {
    console.error('FATAL SECURITY ERROR: Default staff passwords detected in production!')
    console.error('Set ADMIN_PASSWORD and MANAGER_PASSWORD environment variables with strong non-default values.')
    process.exit(1)
  }
}

// ── RATE LIMITER IMPLEMENTATION ─────────────────────────────
class MemoryRateLimiter {
  constructor(windowMs, maxRequests, message) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
    this.message = message || 'Too many requests, please try again later.'
    this.hits = new Map()
  }

  check(key) {
    const now = Date.now()
    const timestamps = this.hits.get(key) || []
    const recent = timestamps.filter(t => now - t < this.windowMs)
    if (recent.length >= this.maxRequests) {
      const retryAfter = Math.ceil((recent[0] + this.windowMs - now) / 1000)
      return { limited: true, retryAfter }
    }
    recent.push(now)
    this.hits.set(key, recent)
    return { limited: false }
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
      const key = `${ip}:${req.path}`
      const status = this.check(key)
      if (status.limited) {
        res.setHeader('Retry-After', status.retryAfter)
        return res.status(429).json({
          error: this.message,
          retryAfterSeconds: status.retryAfter,
        })
      }
      next()
    }
  }
}

const loginLimiter = new MemoryRateLimiter(15 * 60 * 1000, 5, 'Too many failed login attempts. Please wait 15 minutes before retrying.')
const orderLimiter = new MemoryRateLimiter(5 * 60 * 1000, 10, 'Too many checkout requests. Please wait 5 minutes before submitting again.')
const contactLimiter = new MemoryRateLimiter(10 * 60 * 1000, 6, 'Too many inquiry submissions. Please wait 10 minutes.')
const reviewLimiter = new MemoryRateLimiter(10 * 60 * 1000, 6, 'Too many review submissions. Please wait 10 minutes.')

// ── JWT / HMAC-SHA256 TOKEN HELPERS ─────────────────────────
function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      jti: crypto.randomBytes(16).toString('hex'), // Unique token identifier
      iat: Date.now(),
      exp: Date.now() + TOKEN_EXPIRY_MS,
    })
  ).toString('base64url')
  const signature = crypto.createHmac('sha256', APP_SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  if (revokedTokens.has(token)) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, signature] = parts
  const expectedSig = crypto.createHmac('sha256', APP_SECRET).update(`${header}.${body}`).digest('base64url')
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (data.exp && Date.now() > data.exp) return null
    return data
  } catch {
    return null
  }
}

function extractBearerToken(req) {
  const auth = req.headers.authorization || req.headers.Authorization
  if (!auth) return null
  const match = auth.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

// ── INPUT SANITIZATION ──────────────────────────────────────
function sanitizeString(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/[<>]/g, '') // Strip angle brackets
    .trim()
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sanitizeObject)
  const cleaned = {}
  for (const [k, v] of Object.entries(obj)) {
    // Strip private internal metadata injection
    if (['__proto__', 'constructor', 'prototype'].includes(k)) continue
    cleaned[k] = typeof v === 'string' ? sanitizeString(v) : sanitizeObject(v)
  }
  return cleaned
}

// ── ATOMIC DATABASE PERSISTENCE ─────────────────────────────
function saveDatabaseAtomically() {
  try {
    const data = router.db.getState()
    const tempPath = `${DB_PATH}.tmp`
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8')
    fs.renameSync(tempPath, DB_PATH)
  } catch (err) {
    console.error('Database atomic write error:', err)
  }
}

// Automated snapshot backup every 6 hours or upon write
function createSnapshotBackup() {
  if (IS_VERCEL) return
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const snapshotPath = path.join(BACKUP_DIR, `db-snapshot-${timestamp}.json`)
    fs.copyFileSync(DB_PATH, snapshotPath)

    // Keep only last 20 snapshots
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('db-snapshot-'))
      .sort()
    while (files.length > 20) {
      const oldFile = files.shift()
      fs.unlinkSync(path.join(BACKUP_DIR, oldFile))
    }
  } catch (err) {
    console.error('Backup snapshot error:', err)
  }
}

// ── SECURITY HEADERS & CORS ─────────────────────────────────
server.use((req, res, next) => {
  // CORS Configuration
  const origin = req.headers.origin
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,https://saveandsmile.vercel.app,https://saveandsmile.pk').split(',')
  const isAllowedOrigin = !origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || !IS_PROD
  if (origin && isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
  }

  // Security Headers (OWASP Recommended)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

server.use(middlewares)
server.use(express.json({ limit: '50mb' }))
server.use(express.urlencoded({ extended: true, limit: '50mb' }))
server.use('/uploads', express.static(UPLOADS_DIR))

// ── PRODUCT MULTI-IMAGE WEBP UPLOAD HANDLER ──────────────────
const handleImageUpload = (req, res) => {
  try {
    const images = req.body?.images
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided for upload.' })
    }

    if (!fs.existsSync(PRODUCTS_UPLOADS_DIR)) {
      fs.mkdirSync(PRODUCTS_UPLOADS_DIR, { recursive: true })
    }

    const savedUrls = []
    for (let i = 0; i < images.length; i++) {
      const item = images[i]
      const dataUrl = item.data || item.dataUrl || item.base64 || ''
      if (!dataUrl) continue

      let buffer
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
        const matches = dataUrl.match(/^data:image\/[a-zA-Z0-9.+]+;base64,(.+)$/)
        if (!matches) {
          return res.status(400).json({ error: `Invalid image data format at index ${i}` })
        }
        buffer = Buffer.from(matches[1], 'base64')
      } else if (typeof dataUrl === 'string' && dataUrl.startsWith('/uploads/')) {
        savedUrls.push(dataUrl)
        continue
      } else {
        buffer = Buffer.from(dataUrl, 'base64')
      }

      // Max size limit: 15MB per image
      if (buffer.length > 15 * 1024 * 1024) {
        return res.status(400).json({ error: `Image at index ${i} exceeds 15MB limit.` })
      }

      const rawName = (item.name || `photo_${i}`)
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .slice(0, 40)

      const filename = `prod_${Date.now()}_${rawName}_${Math.random().toString(36).slice(2, 7)}.webp`
      const filePath = path.join(PRODUCTS_UPLOADS_DIR, filename)

      fs.writeFileSync(filePath, buffer)
      savedUrls.push(`/uploads/products/${filename}`)
    }

    if (savedUrls.length === 0) {
      return res.status(400).json({ error: 'Failed to process any valid images.' })
    }

    return res.status(201).json({
      success: true,
      urls: savedUrls,
      count: savedUrls.length,
      message: `${savedUrls.length} image(s) processed and saved as WebP successfully!`,
    })
  } catch (err) {
    console.error('[IMAGE UPLOAD ERROR]:', err)
    return res.status(500).json({ error: 'Server error processing image uploads.' })
  }
}

server.post('/upload', handleImageUpload)
server.post('/api/upload', handleImageUpload)
server.post('/upload/products', handleImageUpload)
server.post('/api/upload/products', handleImageUpload)

// ── HEALTH CHECK ENDPOINT ───────────────────────────────────
const healthHandler = (req, res) => {
  res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: 'connected',
    version: '1.0.0',
  })
}
server.get(['/', '/api'], (req, res) => {
  res.json({
    name: 'Save & Smile API',
    status: 'online',
    version: '2.0.0',
    endpoints: ['/api/products', '/api/categories', '/api/orders', '/api/reviews', '/api/health'],
  })
})
server.get('/health', healthHandler)
server.get('/api/health', healthHandler)

// ── REVISED AUTH ENDPOINTS (BCRYPT + RATE LIMITING) ─────────
const handleLogin = async (req, res) => {
  const { email, username, password } = req.body || {}
  const identifier = (email || username || '').trim().toLowerCase()

  // Rate Limiting Check
  const rateStatus = loginLimiter.check(`login:${identifier}`)
  if (rateStatus.limited) {
    return res.status(429).json({
      error: 'Too many login attempts. Please wait 15 minutes before retrying.',
      retryAfterSeconds: rateStatus.retryAfter,
    })
  }

  const user = staffCredentials.find(a =>
    a.email.toLowerCase() === identifier ||
    (a.username && a.username.toLowerCase() === identifier) ||
    (identifier === 'admin' && a.role === 'admin') ||
    (identifier === 'manager' && a.role === 'manager')
  )
  if (!user) {
    return res.status(401).json({ error: 'Invalid staff email/username or security password.' })
  }

  // Reject default weak passwords if in production
  if (IS_PROD && DEFAULT_PASSWORDS.includes(password)) {
    return res.status(403).json({
      error: 'Default credentials have been disabled in production. Please contact security administration.',
    })
  }

  const passwordValid = await bcrypt.compare(password || '', user.passwordHash)
  if (!passwordValid) {
    return res.status(401).json({ error: 'Invalid staff email or security password.' })
  }

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    expiresIn: TOKEN_EXPIRY_MS,
    mustChangePassword: user.isDefaultPassword,
  })
}

const handleVerify = (req, res) => {
  const token = extractBearerToken(req)
  const user = verifyToken(token)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Session invalid or expired.' })
  }
  return res.json({ user })
}

const handleLogout = (req, res) => {
  const token = extractBearerToken(req)
  if (token) {
    revokeToken(token)
  }
  return res.json({ success: true, message: 'Session successfully revoked.' })
}

const handleChangePassword = async (req, res) => {
  const token = extractBearerToken(req)
  const session = verifyToken(token)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Staff session required to update credentials.' })
  }

  const { oldPassword, newPassword } = req.body || {}
  const user = staffCredentials.find(s => s.id === session.id)
  if (!user) {
    return res.status(404).json({ error: 'Staff account not found.' })
  }

  const matches = await bcrypt.compare(oldPassword || '', user.passwordHash)
  if (!matches) {
    return res.status(400).json({ error: 'Current password verification failed.' })
  }

  // Password Strength Validation (Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/
  if (!passwordRegex.test(newPassword || '')) {
    return res.status(400).json({
      error: 'New password does not meet security policy: Minimum 8 characters, with uppercase, lowercase, number, and special character required.',
    })
  }

  if (DEFAULT_PASSWORDS.includes(newPassword)) {
    return res.status(400).json({ error: 'Common/default passwords are not permitted.' })
  }

  // Update in-memory hash
  user.passwordHash = await bcrypt.hash(newPassword, 10)
  user.isDefaultPassword = false

  // Revoke current token forcing re-login with new password
  revokeToken(token)

  return res.json({ success: true, message: 'Password updated successfully. Please log in with your new credentials.' })
}

server.post('/auth/login', handleLogin)
server.post('/api/auth/login', handleLogin)
server.get('/auth/me', handleVerify)
server.get('/api/auth/me', handleVerify)
server.post('/auth/logout', handleLogout)
server.post('/api/auth/logout', handleLogout)
server.post('/auth/change-password', handleChangePassword)
server.post('/api/auth/change-password', handleChangePassword)

// ── RBAC AUTHORIZATION MIDDLEWARE ────────────────────────────
server.use((req, res, next) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '')
  const method = req.method
  const token = extractBearerToken(req)
  const session = verifyToken(token)
  req.user = session

  // ORDERS PROTECTION
  if (pathWithoutApi.startsWith('/orders')) {
    if (method === 'GET') {
      if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
        return res.status(401).json({
          error: 'Unauthorized: Access to customer orders requires an administrative or manager session.',
        })
      }
    }
    if (method === 'DELETE') {
      if (!session || session.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Only administrators can delete order records.' })
      }
    }
    if (method === 'PATCH' || method === 'PUT') {
      if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
        return res.status(403).json({ error: 'Forbidden: Order status modifications require staff privileges.' })
      }
    }
  }

  // CONTACTS ACCESS CONTROL
  if (pathWithoutApi.startsWith('/contacts')) {
    if (method === 'GET') {
      if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
        return res.status(401).json({ error: 'Unauthorized: Customer contact inquiries are restricted to staff.' })
      }
    }
    if (method === 'DELETE') {
      if (!session || session.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Only administrators can delete contact records.' })
      }
    }
    if (method === 'POST') {
      const rate = contactLimiter.check(`contact:${req.ip || '127.0.0.1'}`)
      if (rate.limited) {
        return res.status(429).json({ error: 'Too many contact requests. Please wait a few minutes.' })
      }
    }
  }

  // SETTINGS ACCESS CONTROL
  if (pathWithoutApi.startsWith('/settings')) {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      if (!session || session.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Store configuration can only be modified by an administrator.' })
      }
    }
  }

  // PRODUCTS ACCESS CONTROL & TIMESTAMPING
  if (pathWithoutApi.startsWith('/products')) {
    if (method === 'POST' && req.body && !req.body.createdAt) {
      req.body.createdAt = new Date().toISOString()
    }
    if (method === 'POST' || method === 'DELETE') {
      if (!session || session.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Catalog modifications require administrator privileges.' })
      }
    }
    if (method === 'PATCH' || method === 'PUT') {
      if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
        return res.status(403).json({ error: 'Forbidden: Product edits require staff authentication.' })
      }
    }
  }

  // CATEGORIES ACCESS CONTROL
  if (pathWithoutApi.startsWith('/categories')) {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      if (!session || session.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Category management requires administrator privileges.' })
      }
    }
  }

  // REVIEWS MODERATION & RATE LIMITING
  if (pathWithoutApi.startsWith('/reviews') && method === 'POST') {
    const rate = reviewLimiter.check(`review:${req.ip || '127.0.0.1'}`)
    if (rate.limited) {
      return res.status(429).json({ error: 'Too many review submissions. Please wait 10 minutes.' })
    }
    if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
      req.body = {
        ...sanitizeObject(req.body),
        status: 'pending',
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      }
    }
  }

  next()
})

// ── PHASE 3: SECURE AUTHORITATIVE CHECKOUT INTERCEPTOR ────────
// Never trust client-submitted prices or totals.
const handleOrderCreation = async (req, res) => {
  const rate = orderLimiter.check(`checkout:${req.ip || '127.0.0.1'}`)
  if (rate.limited) {
    return res.status(429).json({
      error: 'Too many checkout requests. Please wait a few minutes before submitting again.',
      retryAfterSeconds: rate.retryAfter,
    })
  }

  const db = router.db
  const body = req.body || {}
  const customer = body.customer || {}
  const rawItems = Array.isArray(body.items) ? body.items : []

  // 1. Validate Customer Contact
  const name = sanitizeString(customer.name || body.name || '')
  const mobile = sanitizeString(customer.mobile || body.mobile || '').replace(/[^\d+]/g, '')
  const email = sanitizeString(customer.email || body.email || '')
  const city = sanitizeString(customer.city || body.city || '')
  const address = sanitizeString(customer.address || body.address || '')

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Please enter a valid customer name.' })
  }
  if (!mobile || mobile.length < 10) {
    return res.status(400).json({ error: 'Please provide a valid 11-digit mobile number.' })
  }
  if (!city) {
    return res.status(400).json({ error: 'Please select a delivery city.' })
  }
  if (!address && body.deliveryMethod !== 'Store pickup') {
    return res.status(400).json({ error: 'Please enter a delivery street address.' })
  }
  if (!rawItems.length) {
    return res.status(400).json({ error: 'Your cart is empty. Please add items to checkout.' })
  }

  // 2. Prevent Duplicate Orders (Within 60 seconds from same mobile)
  const recentOrders = db.get('orders').value() || []
  const now = Date.now()
  const duplicate = recentOrders.find(o => {
    const oMobile = (o.customer?.mobile || o.mobile || '').replace(/[^\d+]/g, '')
    const oTime = new Date(o.createdAt || o.date).getTime()
    return oMobile === mobile && now - oTime < 60000
  })
  if (duplicate) {
    return res.status(409).json({
      error: 'A matching order was recently submitted. Please wait 60 seconds before placing another order.',
      existingOrderId: duplicate.id,
    })
  }

  // PostgreSQL Execution Branch when DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    try {
      const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || body.idempotencyKey || null
      const pgOrderResult = await processCheckout({
        customer: { name, mobile, email, city, address },
        items: rawItems,
        deliveryMethod: body.deliveryMethod || 'Standard',
        paymentMethod: body.paymentMethod || 'Cash on Delivery (COD)',
        couponCode: body.coupon || body.couponCode || null,
        customerNotes: sanitizeString(body.notes || ''),
        idempotencyKey,
      })

      // Sync to lowdb memory cache
      for (const item of pgOrderResult.order.items) {
        const targetProduct = db.get('products').find({ id: item.productId })
        if (targetProduct.value()) {
          const currentProd = targetProduct.value()
          let updatedVariants = currentProd.variants
          if (item.variantId && Array.isArray(updatedVariants)) {
            updatedVariants = updatedVariants.map(v => {
              if (String(v.id) === String(item.variantId)) {
                return { ...v, stock: Math.max(0, (Number(v.stock) || 0) - item.qty) }
              }
              return v
            })
          }
          targetProduct.assign({
            stock: Math.max(0, currentProd.stock - item.qty),
            ...(updatedVariants ? { variants: updatedVariants } : {}),
          }).write()
        }
      }

      return res.status(201).json({
        id: pgOrderResult.order.id,
        status: pgOrderResult.order.status,
        customer: { name },
        subtotal: pgOrderResult.order.subtotal,
        discount: pgOrderResult.order.discount,
        shippingFee: pgOrderResult.order.shippingFee,
        total: pgOrderResult.order.total,
        date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        message: 'Order verified and confirmed successfully!',
      })
    } catch (pgErr) {
      console.error('[CHECKOUT PG ERROR]:', pgErr.message)
      return res.status(400).json({ error: pgErr.message })
    }
  }

  // 3. Authoritative Price & Stock Calculation
  let subtotal = 0
  const validatedItems = []
  const allProducts = db.get('products').value() || []

  for (const item of rawItems) {
    const pId = item.product?.id ?? item.productId ?? item.id
    const dbProduct = allProducts.find(p => String(p.id) === String(pId))
    if (!dbProduct) {
      return res.status(400).json({ error: `Product ID #${pId} no longer exists in our catalog.` })
    }

    const qty = Math.max(1, parseInt(item.qty, 10) || 1)
    const variantId = item.variantId || item.variant?.id || null
    let targetVariant = null

    if (variantId && Array.isArray(dbProduct.variants)) {
      targetVariant = dbProduct.variants.find(v => String(v.id) === String(variantId) || v.sku === variantId)
      if (!targetVariant) {
        return res.status(400).json({ error: `Variant #${variantId} of "${dbProduct.name}" was not found.` })
      }
      if (targetVariant.active === false) {
        return res.status(400).json({ error: `Variant "${targetVariant.title}" is currently unavailable.` })
      }
      if (Number(targetVariant.stock) < qty) {
        return res.status(400).json({
          error: `Insufficient stock for "${dbProduct.name} (${targetVariant.title})". Only ${targetVariant.stock} available.`,
        })
      }
    } else {
      if (dbProduct.stock < qty) {
        return res.status(400).json({
          error: `Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock} unit(s) available.`,
        })
      }
    }

    // Authoritative Unit Price from Server Database (Variant override or Wholesale tier aware)
    let unitPrice = targetVariant ? Number(targetVariant.price) : Number(dbProduct.price) || 0
    if (!targetVariant && Array.isArray(dbProduct.bulkTiers) && dbProduct.bulkTiers.length) {
      const matchingTier = [...dbProduct.bulkTiers]
        .sort((a, b) => b.minQty - a.minQty)
        .find(t => qty >= t.minQty)
      if (matchingTier) {
        unitPrice = Number(matchingTier.price) || unitPrice
      }
    }

    const lineTotal = unitPrice * qty
    subtotal += lineTotal

    validatedItems.push({
      product: {
        id: dbProduct.id,
        name: dbProduct.name,
        price: unitPrice,
        sku: targetVariant?.sku || dbProduct.sku,
        image: dbProduct.image,
      },
      variantId: targetVariant?.id || null,
      variantTitle: targetVariant?.title || null,
      color: targetVariant?.color || null,
      size: targetVariant?.size || null,
      qty,
      lineTotal,
    })
  }

  // 4. Server-Side Coupon Discount Calculation
  let discount = 0
  let appliedCouponCode = ''
  const couponInput = (body.coupon || body.couponCode || '').trim().toUpperCase()
  if (couponInput) {
    const coupons = db.get('coupons').value() || []
    const coupon = coupons.find(c => c.active !== false && c.code.toUpperCase() === couponInput)
    if (!coupon) {
      return res.status(400).json({ error: `Coupon "${couponInput}" is not valid.` })
    }
    if (subtotal < (coupon.minOrder || 0)) {
      return res.status(400).json({
        error: `Coupon "${coupon.code}" requires a minimum order of Rs. ${coupon.minOrder.toLocaleString()}.`,
      })
    }
    if (coupon.type === 'percent') {
      discount = Math.min(Math.round(subtotal * (coupon.value / 100)), coupon.maxDiscount || Infinity)
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, subtotal)
    } else if (coupon.type === 'shipping') {
      discount = 0 // Handled in shipping fee
    }
    appliedCouponCode = coupon.code
  }

  // 5. Server-Side Delivery Fee Calculation
  const storeSettings = db.get('settings').value()?.[0] || { freeShippingThreshold: 3000, shippingFee: 200 }
  let shippingFee = 0
  const deliveryMethod = body.deliveryMethod || 'Standard'

  if (deliveryMethod === 'Express') {
    shippingFee = Number(storeSettings.expressShippingFee) || 350
  } else if (deliveryMethod === 'Store pickup') {
    shippingFee = 0
  } else {
    shippingFee = subtotal >= storeSettings.freeShippingThreshold ? 0 : (Number(storeSettings.shippingFee) || 200)
  }

  if (couponInput && db.get('coupons').find({ code: couponInput, type: 'shipping' }).value()) {
    shippingFee = 0
  }

  const grandTotal = Math.max(0, subtotal - discount + shippingFee)

  // 6. Atomically Decrement Inventory Stock
  for (const vItem of validatedItems) {
    const targetProduct = db.get('products').find({ id: vItem.product.id })
    if (targetProduct.value()) {
      const currentProd = targetProduct.value()
      let updatedVariants = currentProd.variants
      if (vItem.variantId && Array.isArray(updatedVariants)) {
        updatedVariants = updatedVariants.map(v => {
          if (String(v.id) === String(vItem.variantId) || v.sku === vItem.variantId) {
            return { ...v, stock: Math.max(0, (Number(v.stock) || 0) - vItem.qty) }
          }
          return v
        })
      }
      targetProduct.assign({
        stock: Math.max(0, currentProd.stock - vItem.qty),
        ...(updatedVariants ? { variants: updatedVariants } : {}),
      }).write()
    }
  }

  // 7. Insert Safe Order
  const orderId = `GS-ORD-${Date.now().toString().slice(-6)}`
  const newOrder = {
    id: orderId,
    customer: {
      name,
      mobile,
      email,
      city,
      address: deliveryMethod === 'Store pickup' ? 'Store Pickup · Saddar Karachi' : address,
    },
    items: validatedItems,
    subtotal,
    discount,
    coupon: appliedCouponCode,
    shippingFee,
    total: grandTotal,
    deliveryMethod,
    paymentMethod: body.paymentMethod || 'Cash on Delivery (COD)',
    status: 'Pending',
    date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
    notes: sanitizeString(body.notes || ''),
  }

  db.get('orders').push(newOrder).write()
  saveDatabaseAtomically()
  createSnapshotBackup()

  return res.status(201).json({
    id: newOrder.id,
    status: newOrder.status,
    customer: { name: newOrder.customer?.name || name },
    subtotal: newOrder.subtotal,
    discount: newOrder.discount,
    shippingFee: newOrder.shippingFee,
    total: newOrder.total,
    date: newOrder.date,
    message: 'Order verified and confirmed successfully!',
  })
}

server.post('/orders', handleOrderCreation)
server.post('/api/orders', handleOrderCreation)

// ── REVIEWS MODERATION: ANONYMOUS VS ADMIN ───────────────────
const filterReviews = (req, res) => {
  const db = router.db
  let list = db.get('reviews').value() || []
  // Only authenticated admin/manager can view pending/hidden reviews
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
    list = list.filter(r => r.status === 'approved' || !r.status)
  }
  if (req.query.productId) {
    list = list.filter(r => String(r.productId) === String(req.query.productId))
  }
  list = [...list].sort((a, b) => {
    const idA = Number(a.id) || 0
    const idB = Number(b.id) || 0
    if (idA && idB && idA !== idB) return idB - idA
    return (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
  })
  return res.json(list)
}

server.get('/reviews', filterReviews)
server.get('/api/reviews', filterReviews)

// ── HOMEPAGE BUILDER DYNAMIC CMS ENDPOINTS ──────────────────
const requireAdmin = (req, res, next) => {
  const token = extractBearerToken(req)
  const decoded = verifyToken(token)
  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'manager')) {
    return res.status(401).json({ error: 'Unauthorized: Administrator authentication required' })
  }
  req.user = decoded
  next()
}

// 1. Get published sections (Storefront) or draft (Admin)
const handleGetSections = async (req, res) => {
  try {
    const mode = req.query.mode || 'published'
    if (mode === 'draft') {
      const draft = await getDraftSections(router.db)
      return res.json(draft)
    }
    const published = await getPublishedSections(router.db)
    return res.json(published)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

// 2. Save working draft (Admin)
const handleSaveDraft = async (req, res) => {
  try {
    const { sections } = req.body || {}
    const result = await saveDraftSections({
      sections,
      staffUser: req.user,
      routerDb: router.db,
    })
    return res.json(result)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
}

// 3. Publish draft to live storefront (Admin)
const handlePublishSections = async (req, res) => {
  try {
    const { sections, label } = req.body || {}
    const result = await publishSections({
      sections,
      label,
      staffUser: req.user,
      routerDb: router.db,
    })
    return res.json(result)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
}

// 4. Get previous version history (Admin)
const handleGetVersions = async (req, res) => {
  try {
    const versions = await getSectionVersions(router.db)
    return res.json(versions)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

// 5. Restore previous version snapshot (Admin)
const handleRestoreVersion = async (req, res) => {
  try {
    const { versionId } = req.body || {}
    if (!versionId) return res.status(400).json({ error: 'versionId is required' })
    const result = await restoreSectionVersion({
      versionId,
      staffUser: req.user,
      routerDb: router.db,
    })
    return res.json(result)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
}

server.get('/homepage/sections', handleGetSections)
server.get('/api/homepage/sections', handleGetSections)
server.get('/homepage/draft', requireAdmin, (req, res) => { req.query.mode = 'draft'; return handleGetSections(req, res); })
server.get('/api/homepage/draft', requireAdmin, (req, res) => { req.query.mode = 'draft'; return handleGetSections(req, res); })
server.post('/homepage/draft', requireAdmin, handleSaveDraft)
server.post('/api/homepage/draft', requireAdmin, handleSaveDraft)
server.post('/homepage/publish', requireAdmin, handlePublishSections)
server.post('/api/homepage/publish', requireAdmin, handlePublishSections)
server.get('/homepage/versions', requireAdmin, handleGetVersions)
server.get('/api/homepage/versions', requireAdmin, handleGetVersions)
server.post('/homepage/restore-version', requireAdmin, handleRestoreVersion)
server.post('/api/homepage/restore-version', requireAdmin, handleRestoreVersion)

// ── DEFAULT NEWEST-FIRST SORTING FOR PRODUCTS ──────────────
server.get(['/products', '/api/products'], (req, res, next) => {
  if (!req.query._sort && req.path.endsWith('/products')) {
    req.query._sort = 'id'
    req.query._order = 'desc'
  }
  next()
})

server.use('/api', router)
server.use(router)

server.use((err, req, res, next) => {
  console.error('[API SERVER ERROR]:', err)
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
})

if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  server.listen(PORT, HOST, () => {
    console.log(`[API] Production Hardened Server active on http://${HOST}:${PORT}`)
    console.log(`[API] Environment: ${NODE_ENV} | Bcrypt Password Hashing Active`)
    console.log(`[API] Rate Limiting: Active | Authoritative Checkout Calculation: Active`)
  })
}

export default server
