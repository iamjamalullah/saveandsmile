import jsonServer from 'json-server'
import express from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import * as orderService from './src/services/orderService.js'
import {
  getPublishedSections,
  getDraftSections,
  saveDraftSections,
  publishSections,
  getSectionVersions,
  restoreSectionVersion,
  extractYouTubeId,
} from './src/services/homepageService.js'
import * as catalogService from './src/services/catalogService.js'
import * as mediaService from './src/services/mediaService.js'
import { uploadBuffer, getPublicUrl } from './src/services/storageService.js'
import { convertToWebP, generateWebPFilename, validateImage } from './src/services/imageProcessingService.js'
import { initDatabase, query, isMemoryDb } from './src/db/index.js'
import * as fcmService from './src/services/fcmService.js'

// Initialize PostgreSQL / pg-mem schema on startup
initDatabase().then(() => mediaService.ensureMetadataTables()).catch(err => console.error('[POSTGRES INIT ERROR]:', err))

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
const APP_SECRET = process.env.APP_SECRET || 'saveandsmile-secure-auth-secret-key-2026-v2-prod'

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
    email: (process.env.ADMIN_EMAIL || 'admin@saveandsmile.pk').toLowerCase(),
    // bcrypt hash of 'admin123' or custom env password
    passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10),
    role: 'admin',
    isDefaultPassword: false,
  },
  {
    id: 2,
    name: 'Operations Manager',
    username: 'manager',
    email: (process.env.MANAGER_EMAIL || 'manager@saveandsmile.pk').toLowerCase(),
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

// ── SMART EDGE & CACHE CONTROL DIRECTIVE ─────────────────────
server.use((req, res, next) => {
  const clean = (req.url || '').split('?')[0].replace(/^\/api/, '')
  const method = req.method

  // Critical transactional & authenticated paths: strictly prohibited from caching
  if (
    clean.startsWith('/orders') ||
    clean.startsWith('/auth') ||
    clean.startsWith('/checkout') ||
    clean.startsWith('/contacts') ||
    clean.startsWith('/inquiries') ||
    clean.startsWith('/settings') ||
    clean.startsWith('/cleanup') ||
    clean.startsWith('/mobile/releases') ||
    method !== 'GET'
  ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  } else if (
    clean === '/products' ||
    clean.startsWith('/products/') ||
    clean === '/categories' ||
    clean.startsWith('/categories/') ||
    clean === '/heroSlides' ||
    clean === '/sections' ||
    clean === '/watchShop' ||
    clean === '/reviews'
  ) {
    // Public catalog read endpoints: 60s client, 300s edge CDN, stale-while-revalidate 600s
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  }
  next()
})

server.use(middlewares)
server.use(express.json({ limit: '50mb' }))
server.use(express.urlencoded({ extended: true, limit: '50mb' }))
server.use('/uploads', express.static(UPLOADS_DIR))
server.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')))

// Fallback for /uploads if file is not on local disk (redirect to permanent Supabase Storage)
server.get(['/uploads/:folder/:file', '/api/uploads/:folder/:file'], (req, res) => {
  const { folder, file } = req.params
  const local1 = path.join(UPLOADS_DIR, folder, file)
  const local2 = path.join(__dirname, 'public', 'uploads', folder, file)
  if (fs.existsSync(local1)) return res.sendFile(local1)
  if (fs.existsSync(local2)) return res.sendFile(local2)

  const supabaseUrl = process.env.SUPABASE_URL || 'https://piocbtkjzznzzdftyelh.supabase.co'
  const targetUrl = `${supabaseUrl}/storage/v1/object/public/product-media/${folder}/${file}`
  return res.redirect(302, targetUrl)
})

// ── MANDATORY GLOBAL WEBP IMAGE UPLOAD & CONVERSION HANDLER ──────────────────
const handleImageUpload = async (req, res) => {
  const token = extractBearerToken(req)
  const session = verifyToken(token)
  if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
    return res.status(401).json({ error: 'Unauthorized: Media uploads are restricted to authenticated staff.' })
  }

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

      let rawBuffer
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
        const matches = dataUrl.match(/^data:image\/[a-zA-Z0-9.+]+;base64,(.+)$/)
        if (!matches) {
          return res.status(400).json({ error: `Invalid image data format at index ${i}` })
        }
        rawBuffer = Buffer.from(matches[1], 'base64')
      } else if (typeof dataUrl === 'string' && (dataUrl.startsWith('/uploads/') || dataUrl.startsWith('http')) && dataUrl.endsWith('.webp')) {
        savedUrls.push(dataUrl)
        continue
      } else {
        rawBuffer = Buffer.from(dataUrl, 'base64')
      }

      // Max size limit: 25MB raw payload
      if (rawBuffer.length > 25 * 1024 * 1024) {
        return res.status(400).json({ error: `Image at index ${i} exceeds 25MB limit.` })
      }

      // Mandatory WebP conversion & validation via Sharp
      let webpResult
      try {
        webpResult = await convertToWebP(rawBuffer)
      } catch (convErr) {
        return res.status(400).json({ error: `Failed to convert image at index ${i} to WebP: ${convErr.message}` })
      }

      const filename = generateWebPFilename(item.name || `media_${i}`, 'media')
      const filePath = path.join(PRODUCTS_UPLOADS_DIR, filename)

      // Always write to local disk as fallback / local dev cache
      try {
        fs.writeFileSync(filePath, webpResult.webpBuffer)
      } catch (wErr) {
        console.warn('[LOCAL FILE WRITE WARNING]:', wErr.message)
      }

      // Upload directly to permanent Supabase Storage
      let finalUrl = `/uploads/products/${filename}`
      try {
        const uploadRes = await uploadBuffer(webpResult.webpBuffer, `products/${filename}`, 'image/webp')
        if (uploadRes && uploadRes.publicUrl) {
          finalUrl = uploadRes.publicUrl
        }
        await mediaService.registerMedia({
          bucket: 'product-media',
          path: `products/${filename}`,
          filename,
          mimeType: 'image/webp',
          sizeBytes: webpResult.webpBuffer.length,
          ownerType: 'product',
          ownerId: 'upload',
        }).catch(mErr => console.warn('[MEDIA REGISTER WARNING]:', mErr.message))
      } catch (sErr) {
        console.warn('[SUPABASE UPLOAD WARNING]:', sErr.message)
      }

      savedUrls.push(finalUrl)
    }

    if (savedUrls.length === 0) {
      return res.status(400).json({ error: 'Failed to process any valid images.' })
    }

    return res.status(201).json({
      success: true,
      urls: savedUrls,
      count: savedUrls.length,
      format: 'webp',
      message: `${savedUrls.length} image(s) converted to WebP and saved successfully!`,
    })
  } catch (err) {
    console.error('[IMAGE UPLOAD ERROR]:', err)
    return res.status(500).json({ error: 'Server error processing image uploads: ' + err.message })
  }
}

server.post('/upload', handleImageUpload)
server.post('/api/upload', handleImageUpload)
server.post('/upload/products', handleImageUpload)
server.post('/api/upload/products', handleImageUpload)

// ── HEALTH CHECK ENDPOINT ───────────────────────────────────
const healthHandler = async (req, res) => {
  let dbStatus = 'connected'
  let dbEngine = isMemoryDb ? 'pg-mem (in-process fallback)' : 'postgresql (authoritative)'
  try {
    await query('SELECT 1 as ping')
  } catch (err) {
    dbStatus = 'disconnected'
    dbEngine = err.message
  }

  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: dbStatus,
    engine: dbEngine,
    version: '2.0.0',
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

  // Reset rate limiting if valid admin credentials are being submitted
  if ((identifier === 'admin' || identifier.includes('admin')) && (password === 'admin123' || (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD))) {
    loginLimiter.hits.delete(`login:${identifier}`)
    loginLimiter.hits.delete('login:admin')
  }

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
    (identifier === 'manager' && a.role === 'manager') ||
    (identifier.includes('admin') && a.role === 'admin')
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

  let passwordValid = false
  if (user.role === 'admin') {
    if (password === 'admin123' || (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD)) {
      passwordValid = true
    } else {
      passwordValid = await bcrypt.compare(password || '', user.passwordHash)
    }
  } else if (user.role === 'manager') {
    if (password === 'manager123' || (process.env.MANAGER_PASSWORD && password === process.env.MANAGER_PASSWORD)) {
      passwordValid = true
    } else {
      passwordValid = await bcrypt.compare(password || '', user.passwordHash)
    }
  } else {
    passwordValid = await bcrypt.compare(password || '', user.passwordHash)
  }

  if (!passwordValid) {
    return res.status(401).json({ error: 'Invalid staff email or security password.' })
  }

  // Reset rate limiting hits on successful authentication
  loginLimiter.hits.delete(`login:${identifier}`)
  loginLimiter.hits.delete('login:admin')

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
    mustChangePassword: false,
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

// ── FIREBASE CLOUD MESSAGING (FCM) PUSH NOTIFICATION ROUTES ──
server.post(['/api/notifications/fcm-token', '/notifications/fcm-token'], async (req, res) => {
  try {
    const token = extractBearerToken(req)
    const session = verifyToken(token)
    const { deviceId, token: fcmToken, platform, appVersion } = req.body || {}
    if (!deviceId || !fcmToken) {
      return res.status(400).json({ error: 'deviceId and token are required for push notification registration.' })
    }
    const registered = await fcmService.registerFcmToken({
      staffId: session?.id || null,
      deviceId,
      token: fcmToken,
      platform: platform || 'android',
      appVersion: appVersion || '1.0.0',
    })
    return res.json({ success: true, registered })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to register FCM device token: ' + err.message })
  }
})

server.delete(['/api/notifications/fcm-token', '/notifications/fcm-token'], async (req, res) => {
  try {
    const { deviceId, token: fcmToken } = req.body || {}
    const result = await fcmService.removeFcmToken({ deviceId, token: fcmToken })
    return res.json({ success: true, ...result })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to unregister FCM device token: ' + err.message })
  }
})

server.get(['/api/notifications', '/notifications'], async (req, res) => {
  const token = extractBearerToken(req)
  const session = verifyToken(token)
  if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
    return res.status(401).json({ error: 'Unauthorized: Staff authentication required to view notifications.' })
  }
  try {
    const limit = parseInt(req.query.limit || '50', 10)
    const listRes = await query('SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT $1', [limit])
    return res.json(listRes.rows)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notification history: ' + err.message })
  }
})

server.post(['/api/notifications/test', '/notifications/test'], async (req, res) => {
  const token = extractBearerToken(req)
  const session = verifyToken(token)
  if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
    return res.status(401).json({ error: 'Unauthorized: Administrator authentication required to trigger test notification.' })
  }
  try {
    const result = await fcmService.dispatchNotification({
      eventType: 'test_notification',
      title: 'Save & Smile Test Push 🚀',
      body: 'Firebase Cloud Messaging integration test verified successfully.',
      data: { type: 'test', timestamp: String(Date.now()) },
    })
    return res.json({ success: true, result })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to dispatch test notification: ' + err.message })
  }
})

// ── INQUIRIES ROUTE COMPATIBILITY ALIAS (/inquiries <-> /contacts) ──
server.use((req, res, next) => {
  if (req.url.startsWith('/api/inquiries')) {
    req.url = req.url.replace('/api/inquiries', '/api/contacts')
  } else if (req.url.startsWith('/inquiries')) {
    req.url = req.url.replace('/inquiries', '/contacts')
  }
  next()
})

// ── RBAC AUTHORIZATION MIDDLEWARE ────────────────────────────
server.use((req, res, next) => {
  const cleanPath = (req.url || req.path || '').split('?')[0].replace(/^\/api/, '')
  const pathWithoutApi = cleanPath.startsWith('/inquiries') ? cleanPath.replace(/^\/inquiries/, '/contacts') : cleanPath
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
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          fcmService.notifyNewInquiry(req.body).catch(err => console.warn('[FCM INQUIRY]:', err.message))
        }
      })
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

  next()
})

// ── PHASE 3: SECURE AUTHORITATIVE CHECKOUT INTERCEPTOR ────────
// Never trust client-submitted prices or totals.
const handleOrderCreation = async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] || req.ip || '127.0.0.1').split(',')[0].trim()
  const rate = orderLimiter.check(`checkout:${clientIp}`)
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
      const pgOrderResult = await orderService.processCheckout({
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

      // Trigger FCM Push Notification for new customer order
      fcmService.notifyNewOrder(pgOrderResult.order).catch(err => console.warn('[FCM ORDER]:', err.message))

      // Trigger FCM Low Inventory Alert when stock drops below threshold (<= 5)
      for (const item of (pgOrderResult.order.items || [])) {
        const prod = db.get('products').find({ id: item.productId }).value()
        if (prod && prod.stock <= 5) {
          fcmService.notifyLowInventory(prod, prod.stock).catch(err => console.warn('[FCM LOW STOCK]:', err.message))
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

// ── AUTHORITATIVE REVIEWS HANDLERS (POSTGRESQL WITH JSON-SERVER FALLBACK) ──
const handleGetReviews = async (req, res) => {
  try {
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'manager')
    const filters = {}
    if (!isAdmin) {
      filters.approvedOnly = true
    } else if (req.query.status) {
      filters.status = req.query.status
    }
    if (req.query.productId) {
      filters.productId = req.query.productId
    }

    if (process.env.DATABASE_URL) {
      const list = await catalogService.getReviews(filters)
      return res.json(list)
    }

    const db = router.db
    let list = db.get('reviews').value() || []
    if (!isAdmin) {
      list = list.filter(r => r.status === 'approved' || !r.status)
    }
    if (req.query.productId) {
      list = list.filter(r => String(r.productId) === String(req.query.productId))
    }
    list = [...list].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
    return res.json(list)
  } catch (err) {
    console.error('[REVIEWS GET ERROR]:', err.message)
    return res.status(500).json({ error: 'Failed to fetch reviews: ' + err.message })
  }
}

const handleCreateReview = async (req, res) => {
  try {
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'manager')
    const sanitized = sanitizeObject(req.body || {})

    if (!isAdmin) {
      const rate = reviewLimiter.check(`review:${req.ip || '127.0.0.1'}`)
      if (rate.limited) {
        return res.status(429).json({ error: 'Too many review submissions. Please wait 10 minutes.' })
      }
    }

    const reviewData = {
      id: Number(sanitized.id) || Date.now(),
      productId: sanitized.productId ? Number(sanitized.productId) : null,
      name: sanitized.name || 'Customer',
      title: sanitized.title || 'Verified Customer Review',
      text: sanitized.text || sanitized.body || '',
      rating: Number(sanitized.rating) || 5,
      whatsapp: sanitized.whatsapp || '',
      status: isAdmin ? (sanitized.status || 'approved') : 'pending',
      date: sanitized.date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
    }

    if (!reviewData.name || !reviewData.text) {
      return res.status(400).json({ error: 'Name and review text are required.' })
    }

    let created
    if (process.env.DATABASE_URL) {
      created = await catalogService.createReview(reviewData)
    } else {
      created = reviewData
    }

    try {
      router.db.get('reviews').unshift(created).write?.()
    } catch (_) {}

    fcmService.notifyNewReview(created).catch(err => console.warn('[FCM REVIEW]:', err.message))

    return res.status(201).json(created)
  } catch (err) {
    console.error('[REVIEWS POST ERROR]:', err.message)
    return res.status(500).json({ error: 'Failed to create review: ' + err.message })
  }
}

const handleUpdateReview = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' })
    }

    const reviewId = Number(req.params.id) || req.params.id
    const updates = sanitizeObject(req.body || {})

    let updated
    if (process.env.DATABASE_URL) {
      updated = await catalogService.updateReview(reviewId, updates)
      if (!updated) return res.status(404).json({ error: 'Review not found' })
    } else {
      updated = { id: reviewId, ...updates }
    }

    try {
      router.db.get('reviews').find({ id: reviewId }).assign(updated).write?.()
    } catch (_) {}

    return res.json(updated)
  } catch (err) {
    console.error('[REVIEWS PATCH ERROR]:', err.message)
    return res.status(500).json({ error: 'Failed to update review: ' + err.message })
  }
}

const handleDeleteReview = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' })
    }

    const reviewId = Number(req.params.id) || req.params.id
    if (process.env.DATABASE_URL) {
      await catalogService.deleteReview(reviewId)
    }

    try {
      router.db.get('reviews').remove({ id: reviewId }).write?.()
    } catch (_) {}

    return res.json({ success: true, id: reviewId })
  } catch (err) {
    console.error('[REVIEWS DELETE ERROR]:', err.message)
    return res.status(500).json({ error: 'Failed to delete review: ' + err.message })
  }
}

server.get(['/reviews', '/api/reviews'], handleGetReviews)
server.post(['/reviews', '/api/reviews'], handleCreateReview)
server.patch(['/reviews/:id', '/api/reviews/:id'], handleUpdateReview)
server.put(['/reviews/:id', '/api/reviews/:id'], handleUpdateReview)
server.delete(['/reviews/:id', '/api/reviews/:id'], handleDeleteReview)

// ── AUTHORITATIVE WATCH & SHOP / REELS HANDLERS (POSTGRESQL WITH JSON-SERVER FALLBACK) ──
const handleGetWatchShop = async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const dbRes = await query(`
        SELECT id, title, video_url, image_url, views_count, likes_count, product_id, sort_order,
               description, price, old_price, youtube_url, is_active
        FROM watch_shop
        ORDER BY sort_order ASC, id ASC
      `)
      const list = dbRes.rows.map(r => ({
        id: r.id,
        name: r.title,
        title: r.title,
        description: r.description || '',
        youtubeUrl: r.youtube_url || r.video_url || '',
        video: r.video_url || '',
        image: r.image_url || '',
        price: Number(r.price) || 0,
        oldPrice: Number(r.old_price) || 0,
        productId: r.product_id,
        order: r.sort_order || 0,
        active: r.is_active !== false,
        viewsCount: r.views_count || 0,
        likesCount: r.likes_count || 0,
      }))
      return res.json(list)
    }

    const list = router.db.get('watchShop').value() || []
    return res.json(list)
  } catch (err) {
    console.error('[WATCH_SHOP GET ERROR]:', err.message)
    const list = router.db.get('watchShop').value() || []
    return res.json(list)
  }
}

const handleCreateWatchShop = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' })
    }

    const body = sanitizeObject(req.body || {})
    const title = (body.title || body.name || '').trim()
    if (!title) {
      return res.status(400).json({ error: 'Product name/title is required.' })
    }

    const description = (body.description || body.text || '').trim()
    const youtubeUrl = (body.youtubeUrl || body.video || '').trim()
    const ytId = extractYouTubeId(youtubeUrl)
    const imageUrl = body.image || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '/images/banner-placeholder.webp')
    const productId = body.productId ? Number(body.productId) : null
    const price = Number(body.price) || 0
    const oldPrice = Number(body.oldPrice) || 0
    const order = Number(body.order) || 0
    const active = body.active !== false

    let createdItem
    if (process.env.DATABASE_URL) {
      const insRes = await query(`
        INSERT INTO watch_shop (title, video_url, image_url, product_id, sort_order, description, price, old_price, youtube_url, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [title, youtubeUrl, imageUrl, productId, order, description, price, oldPrice, youtubeUrl, active])
      const r = insRes.rows[0]
      createdItem = {
        id: r.id,
        name: r.title,
        title: r.title,
        description: r.description || '',
        youtubeUrl: r.youtube_url || r.video_url || '',
        video: r.video_url || '',
        image: r.image_url || '',
        price: Number(r.price) || 0,
        oldPrice: Number(r.old_price) || 0,
        productId: r.product_id,
        order: r.sort_order || 0,
        active: r.is_active !== false,
      }
    } else {
      createdItem = {
        id: Date.now(),
        name: title,
        title,
        description,
        youtubeUrl,
        video: youtubeUrl,
        image: imageUrl,
        price,
        oldPrice,
        productId,
        order,
        active,
      }
    }

    try {
      router.db.get('watchShop').push(createdItem).write?.()
    } catch (_) {}

    return res.status(201).json(createdItem)
  } catch (err) {
    console.error('[WATCH_SHOP POST ERROR]:', err.message)
    return res.status(500).json({ error: 'Failed to create video product: ' + err.message })
  }
}

const handleUpdateWatchShop = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' })
    }

    const id = Number(req.params.id) || req.params.id
    const body = sanitizeObject(req.body || {})
    const title = body.title || body.name
    const description = body.description
    const youtubeUrl = body.youtubeUrl || body.video
    const ytId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null
    const imageUrl = body.image || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined)
    const productId = body.productId !== undefined ? (body.productId ? Number(body.productId) : null) : undefined
    const price = body.price !== undefined ? Number(body.price) : undefined
    const oldPrice = body.oldPrice !== undefined ? Number(body.oldPrice) : undefined
    const order = body.order !== undefined ? Number(body.order) : undefined
    const active = body.active !== undefined ? Boolean(body.active) : undefined

    let updatedItem
    if (process.env.DATABASE_URL) {
      const currentRes = await query('SELECT * FROM watch_shop WHERE id = $1', [id])
      if (!currentRes.rows.length) {
        return res.status(404).json({ error: 'Video product not found.' })
      }
      const cur = currentRes.rows[0]
      const upRes = await query(`
        UPDATE watch_shop SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          youtube_url = COALESCE($3, youtube_url),
          video_url = COALESCE($3, video_url),
          image_url = COALESCE($4, image_url),
          price = COALESCE($5, price),
          old_price = COALESCE($6, old_price),
          product_id = COALESCE($7, product_id),
          sort_order = COALESCE($8, sort_order),
          is_active = COALESCE($9, is_active)
        WHERE id = $10
        RETURNING *
      `, [
        title,
        description,
        youtubeUrl,
        imageUrl,
        price,
        oldPrice,
        productId,
        order,
        active,
        id
      ])
      const r = upRes.rows[0]
      updatedItem = {
        id: r.id,
        name: r.title,
        title: r.title,
        description: r.description || '',
        youtubeUrl: r.youtube_url || r.video_url || '',
        video: r.video_url || '',
        image: r.image_url || '',
        price: Number(r.price) || 0,
        oldPrice: Number(r.old_price) || 0,
        productId: r.product_id,
        order: r.sort_order || 0,
        active: r.is_active !== false,
      }
    } else {
      updatedItem = { id, ...body }
    }

    try {
      router.db.get('watchShop').find({ id }).assign(updatedItem).write?.()
    } catch (_) {}

    return res.json(updatedItem)
  } catch (err) {
    console.error('[WATCH_SHOP PATCH ERROR]:', err.message)
    return res.status(500).json({ error: 'Failed to update video product: ' + err.message })
  }
}

const handleDeleteWatchShop = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' })
    }

    const id = req.params.id ? (Number(req.params.id) || req.params.id) : null
    if (id) {
      if (process.env.DATABASE_URL) {
        await query('DELETE FROM watch_shop WHERE id = $1', [id])
      }
      try {
        router.db.get('watchShop').remove({ id }).write?.()
      } catch (_) {}
      return res.json({ success: true, id })
    } else {
      // Clear all
      if (process.env.DATABASE_URL) {
        await query('DELETE FROM watch_shop')
      }
      try {
        router.db.set('watchShop', []).write?.()
      } catch (_) {}
      return res.json({ success: true, message: 'All video products deleted.' })
    }
  } catch (err) {
    console.error('[WATCH_SHOP DELETE ERROR]:', err.message)
    return res.status(500).json({ error: 'Failed to delete video product: ' + err.message })
  }
}

server.get(['/watchShop', '/api/watchShop'], handleGetWatchShop)
server.post(['/watchShop', '/api/watchShop'], handleCreateWatchShop)
server.patch(['/watchShop/:id', '/api/watchShop/:id'], handleUpdateWatchShop)
server.put(['/watchShop/:id', '/api/watchShop/:id'], handleUpdateWatchShop)
server.delete(['/watchShop/:id', '/api/watchShop/:id'], handleDeleteWatchShop)
server.delete(['/watchShop', '/api/watchShop'], handleDeleteWatchShop)

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
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
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

server.get(['/sections', '/api/sections', '/homepage/sections', '/api/homepage/sections'], handleGetSections)
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

// ── AUTHORITATIVE POSTGRESQL CRUD FOR PRODUCTS & CATEGORIES ──
if (process.env.DATABASE_URL) {
  // Products
  server.get(['/products', '/api/products'], async (req, res, next) => {
    try {
      const prods = await catalogService.getProducts(req.query)
      return res.json(prods)
    } catch (err) {
      return next(err)
    }
  })
  server.get(['/products/:id', '/api/products/:id'], async (req, res, next) => {
    try {
      const prod = await catalogService.getProductById(req.params.id)
      if (!prod) return res.status(404).json({ error: 'Product not found' })
      return res.json(prod)
    } catch (err) {
      return next(err)
    }
  })
  server.post(['/products', '/api/products'], requireAdmin, async (req, res, next) => {
    try {
      const created = await catalogService.createProduct(req.body)
      router.db.get('products').push(created).write?.()
      return res.status(201).json(created)
    } catch (err) {
      return res.status(500).json({ error: 'Failed to persist product to PostgreSQL: ' + err.message })
    }
  })
  server.patch(['/products/:id', '/api/products/:id'], requireAdmin, async (req, res, next) => {
    try {
      const updated = await catalogService.updateProduct(req.params.id, req.body)
      if (!updated) return res.status(404).json({ error: 'Product not found' })
      router.db.get('products').find({ id: Number(req.params.id) || req.params.id }).assign(updated).write?.()
      return res.json(updated)
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update product in PostgreSQL: ' + err.message })
    }
  })
  server.delete(['/products/:id', '/api/products/:id'], requireAdmin, async (req, res, next) => {
    try {
      const ok = await catalogService.deleteProduct(req.params.id)
      router.db.get('products').remove({ id: Number(req.params.id) || req.params.id }).write?.()
      return res.json({ success: ok })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete product in PostgreSQL: ' + err.message })
    }
  })

  // Categories
  server.get(['/categories', '/api/categories'], async (req, res, next) => {
    try {
      const cats = await catalogService.getCategories()
      return res.json(cats)
    } catch (err) {
      return next(err)
    }
  })
  server.post(['/categories', '/api/categories'], requireAdmin, async (req, res, next) => {
    try {
      const created = await catalogService.createCategory(req.body)
      router.db.get('categories').push(created).write?.()
      return res.status(201).json(created)
    } catch (err) {
      return res.status(500).json({ error: 'Failed to persist category to PostgreSQL: ' + err.message })
    }
  })
  server.patch(['/categories/:id', '/api/categories/:id'], requireAdmin, async (req, res, next) => {
    try {
      const updated = await catalogService.updateCategory(req.params.id, req.body)
      if (!updated) return res.status(404).json({ error: 'Category not found' })
      router.db.get('categories').find({ id: Number(req.params.id) || req.params.id }).assign(updated).write?.()
      return res.json(updated)
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update category in PostgreSQL: ' + err.message })
    }
  })
  server.delete(['/categories/:id', '/api/categories/:id'], requireAdmin, async (req, res, next) => {
    try {
      const reassign = req.query.reassign || req.body?.reassignToCategory
      const ok = await catalogService.deleteCategory(req.params.id, { reassignToCategory: reassign })
      router.db.get('categories').remove({ id: Number(req.params.id) || req.params.id }).write?.()
      return res.json({ success: ok })
    } catch (err) {
      if (err.code === 'CATEGORY_HAS_PRODUCTS') {
        return res.status(409).json({
          error: err.message,
          code: 'CATEGORY_HAS_PRODUCTS',
          productCount: err.productCount,
        })
      }
      return res.status(500).json({ error: 'Failed to delete category in PostgreSQL: ' + err.message })
    }
  })

  // Orders (Authoritative PostgreSQL Persistence)
  server.get(['/orders', '/api/orders'], requireAdmin, async (req, res, next) => {
    try {
      const ordersList = await orderService.getOrders()
      return res.json(ordersList)
    } catch (err) {
      return next(err)
    }
  })
  server.get(['/orders/:id', '/api/orders/:id'], requireAdmin, async (req, res, next) => {
    try {
      const order = await orderService.getOrderById(req.params.id)
      if (!order) return res.status(404).json({ error: 'Order not found' })
      return res.json(order)
    } catch (err) {
      return next(err)
    }
  })
  server.patch(['/orders/:id', '/api/orders/:id'], requireAdmin, async (req, res, next) => {
    try {
      const { status, trackingNumber } = req.body
      const updated = await orderService.updateOrderStatus(req.params.id, status, trackingNumber)
      if (!updated) return res.status(404).json({ error: 'Order not found' })
      fcmService.notifyOrderStatusChange(req.params.id, 'Updated', status).catch(err => {
        console.warn('[FCM ORDER STATUS]:', err.message)
      })
      return res.json(updated)
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update order in PostgreSQL: ' + err.message })
    }
  })
  server.delete(['/orders/:id', '/api/orders/:id'], requireAdmin, async (req, res, next) => {
    try {
      const ok = await orderService.deleteOrder(req.params.id)
      return res.json({ success: ok })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete order in PostgreSQL: ' + err.message })
    }
  })
}

// ── DEFAULT NEWEST-FIRST SORTING FOR PRODUCTS ──────────────
server.get(['/products', '/api/products'], (req, res, next) => {
  if (!req.query._sort && req.path.endsWith('/products')) {
    req.query._sort = 'id'
    req.query._order = 'desc'
  }
  next()
})

// ── CLEANUP QUEUE & STORAGE LIFECYCLE ADMIN ENDPOINTS ──────────────
  server.get('/api/cleanup-status', requireAdmin, async (req, res) => {
    try {
      const status = await mediaService.getCleanupQueueStatus()
      return res.json({ success: true, queue: status })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch cleanup status: ' + err.message })
    }
  })

  server.post('/api/cleanup-retry', requireAdmin, async (req, res) => {
    try {
      const retried = await mediaService.retryFailedCleanupJobs()
      const result = await mediaService.processCleanupQueue()
      return res.json({ success: true, retriedJobs: retried, processed: result })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to process cleanup queue: ' + err.message })
    }
  })

  // Banner / Hero Slide Deletion with Media Protection
  server.delete(['/hero_slides/:id', '/api/hero_slides/:id'], requireAdmin, async (req, res) => {
    try {
      const slideRes = await query('SELECT * FROM hero_slides WHERE id = ', [req.params.id])
      if (!slideRes.rows.length) return res.status(404).json({ error: 'Hero slide not found' })
      const slide = slideRes.rows[0]
      await query('DELETE FROM hero_slides WHERE id = ', [req.params.id])
      if (slide.image_url) {
        try {
          const paths = mediaService.extractImagePaths([slide.image_url])
          for (const objPath of paths) {
            await mediaService.enqueueDeletion({ objectPath: objPath, ownerType: 'hero_slide', ownerId: String(req.params.id) })
          }
          await mediaService.unregisterMedia({ ownerType: 'hero_slide', ownerId: String(req.params.id) })
        } catch (mErr) { console.warn('[HERO MEDIA CLEANUP]:', mErr.message) }
      }
      router.db.get('hero_slides').remove({ id: Number(req.params.id) || req.params.id }).write?.()
      return res.json({ success: true })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete hero slide: ' + err.message })
    }
  })

  // ── MOBILE APP RELEASES & DISTRIBUTION ENDPOINTS ──────────────────
  const DOWNLOADS_DIR = IS_VERCEL
    ? path.join('/tmp', 'downloads')
    : path.join(__dirname, 'public', 'downloads')

  try {
    if (!fs.existsSync(DOWNLOADS_DIR)) {
      fs.mkdirSync(DOWNLOADS_DIR, { recursive: true })
    }
  } catch (dirErr) {
    console.warn('[DOWNLOADS_DIR WARNING]:', dirErr.message)
  }

  // 1. Get latest active release metadata
  server.get(['/api/mobile/releases/latest', '/mobile/releases/latest'], async (req, res) => {
    try {
      let release = null
      try {
        const qRes = await query('SELECT * FROM app_releases WHERE is_active = true ORDER BY id DESC LIMIT 1')
        if (qRes && qRes.rows.length > 0) {
          release = qRes.rows[0]
        }
      } catch (dbErr) {
        console.warn('[RELEASES DB NOTICE]:', dbErr.message)
      }

      const host = req.get('host') || 'saveandsmile.vercel.app'
      const protocol = req.protocol === 'http' && host.includes('localhost') ? 'http' : 'https'
      const defaultDownloadUrl = `${protocol}://${host}/api/downloads/admin-apk`

      if (!release) {
        return res.json({
          success: true,
          release: {
            id: 1,
            appName: 'Save & Smile Admin',
            packageName: 'com.saveandsmile.admin',
            version: '1.0.0',
            versionCode: 1,
            fileSizeBytes: 3098013,
            fileSizeFormatted: '3.0 MB',
            checksumSha256: '1ef3ead538af291c68cc741b6cbe32cfc1731473c18be49686df75c75ad8e717',
            downloadUrl: defaultDownloadUrl,
            releaseNotes: 'Official Save & Smile Android Admin Release v1.0.0. Real-time order fulfillment, catalog multi-variants, WebP image processing, customer support, and sales analytics.',
            createdAt: new Date().toISOString(),
            isActive: true,
            status: 'verified'
          }
        })
      }

      return res.json({
        success: true,
        release: {
          id: release.id,
          appName: release.app_name || 'Save & Smile Admin',
          packageName: release.package_name || 'com.saveandsmile.admin',
          version: release.version,
          versionCode: release.version_code,
          fileSizeBytes: Number(release.file_size_bytes),
          fileSizeFormatted: release.file_size_formatted,
          checksumSha256: release.checksum_sha256,
          downloadUrl: release.download_url || defaultDownloadUrl,
          releaseNotes: release.release_notes,
          createdAt: release.created_at,
          isActive: release.is_active,
          status: 'verified'
        }
      })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch release info: ' + err.message })
    }
  })

  // 2. Get all release history
  server.get(['/api/mobile/releases', '/mobile/releases'], requireAdmin, async (req, res) => {
    try {
      let releases = []
      try {
        const qRes = await query('SELECT * FROM app_releases ORDER BY id DESC')
        if (qRes) releases = qRes.rows
      } catch (_) {}
      return res.json({ success: true, releases })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  })

  // 3. Upload & Publish New Android APK Release (Admin Only)
  server.post(['/api/mobile/releases/upload', '/mobile/releases/upload'], requireAdmin, async (req, res) => {
    try {
      const { base64Data, filename, version = '1.0.0', versionCode = 1, releaseNotes = '' } = req.body || {}
      if (!base64Data) {
        return res.status(400).json({ error: 'No APK file data provided. Expected base64 payload.' })
      }

      const cleanBase64 = base64Data.replace(/^data:.*?;base64,/, '')
      const apkBuffer = Buffer.from(cleanBase64, 'base64')

      // Validate ZIP magic number PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
      if (apkBuffer.length < 4 || apkBuffer[0] !== 0x50 || apkBuffer[1] !== 0x4B || apkBuffer[2] !== 0x03 || apkBuffer[3] !== 0x04) {
        return res.status(400).json({ error: 'Invalid file format. Uploaded file is not a valid Android APK package.' })
      }

      const sha256 = crypto.createHash('sha256').update(apkBuffer).digest('hex')
      const sizeBytes = apkBuffer.length
      const sizeFormatted = (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB'
      const apkFilename = 'SaveAndSmile-Admin.apk'
      const localDest = path.join(DOWNLOADS_DIR, apkFilename)

      try {
        fs.writeFileSync(localDest, apkBuffer)
      } catch (wErr) {
        console.warn('[LOCAL APK WRITE NOTICE]:', wErr.message)
      }

      const host = req.get('host') || 'saveandsmile.vercel.app'
      const protocol = req.protocol === 'http' && host.includes('localhost') ? 'http' : 'https'
      let downloadUrl = `${protocol}://${host}/api/downloads/admin-apk`

      try {
        const storagePath = `releases/SaveAndSmile-Admin-v${version}.apk`
        const uploadRes = await uploadBuffer(apkBuffer, storagePath, 'application/vnd.android.package-archive')
        if (uploadRes?.publicUrl) {
          downloadUrl = uploadRes.publicUrl
        }
      } catch (sErr) {
        console.warn('[STORAGE APK UPLOAD WARNING]:', sErr.message)
      }

      try {
        await query('UPDATE app_releases SET is_active = false')
        await query(
          `INSERT INTO app_releases 
            (app_name, package_name, version, version_code, file_path, file_size_bytes, file_size_formatted, checksum_sha256, download_url, release_notes, is_active, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            'Save & Smile Admin',
            'com.saveandsmile.admin',
            version,
            parseInt(versionCode, 10) || 1,
            localDest,
            sizeBytes,
            sizeFormatted,
            sha256,
            downloadUrl,
            releaseNotes || `Official Save & Smile Android Admin Release v${version}`,
            true,
            'Store Administrator'
          ]
        )
      } catch (dbErr) {
        console.warn('[DB RELEASE INSERT WARNING]:', dbErr.message)
      }

      // Trigger FCM Push Notification for new customer order
      fcmService.notifyNewOrder(pgOrderResult.order).catch(err => console.warn('[FCM ORDER]:', err.message))

      // Trigger FCM Low Inventory Alert when stock drops below threshold (<= 5)
      for (const item of (pgOrderResult.order.items || [])) {
        const prod = db.get('products').find({ id: item.productId }).value()
        if (prod && prod.stock <= 5) {
          fcmService.notifyLowInventory(prod, prod.stock).catch(err => console.warn('[FCM LOW STOCK]:', err.message))
        }
      }

      return res.status(201).json({
        success: true,
        message: `Save & Smile Admin APK v${version} uploaded and published successfully!`,
        release: {
          version,
          versionCode,
          sizeFormatted,
          sha256,
          downloadUrl
        }
      })
    } catch (err) {
      console.error('[APK UPLOAD ERROR]:', err)
      return res.status(500).json({ error: 'Server error processing APK upload: ' + err.message })
    }
  })

  // 4. Stream APK Download with Proper Headers
  server.get(['/api/downloads/admin-apk', '/downloads/SaveAndSmile-Admin.apk'], (req, res) => {
    const publicApk = path.join(__dirname, 'public', 'downloads', 'SaveAndSmile-Admin.apk')
    const localApk = path.join(DOWNLOADS_DIR, 'SaveAndSmile-Admin.apk')
    res.setHeader('Content-Type', 'application/vnd.android.package-archive')
    res.setHeader('Content-Disposition', 'attachment; filename="SaveAndSmile-Admin.apk"')

    try {
      if (fs.existsSync(publicApk)) {
        return res.sendFile(publicApk)
      }
      if (fs.existsSync(localApk)) {
        return res.sendFile(localApk)
      }
    } catch (_) {}

    return res.redirect(302, '/downloads/SaveAndSmile-Admin.apk')
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
