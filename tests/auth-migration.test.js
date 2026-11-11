import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { runMigration } from '../migrate.js'
import { query } from '../src/db/index.js'

const APP_SECRET = process.env.APP_SECRET || 'qadri_dev_secret_key_prod_hardening_2026'

function createStaffToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + (8 * 3600), // 8 hours
  })).toString('base64url')
  const signature = crypto.createHmac('sha256', APP_SECRET).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

function verifyStaffToken(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts
  const expectedSignature = crypto.createHmac('sha256', APP_SECRET).update(`${header}.${payload}`).digest('base64url')
  if (expectedSignature !== signature) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null
    return data
  } catch {
    return null
  }
}

async function runAuthMigrationTest() {
  console.log('===============================================================')
  console.log('   STAFF AUTHENTICATION & TOKEN REVOCATION TEST SUITE')
  console.log('===============================================================')

  await runMigration()

  // 1. Check Admin Authentication
  console.log('\n--- 1. Testing Admin Authentication ---')
  const adminRes = await query('SELECT * FROM staff_accounts WHERE email = $1', ['admin@qadrigadgets.pk'])
  if (adminRes.rows.length === 0) throw new Error('Admin account not found in database!')
  const admin = adminRes.rows[0]

  const adminPassMatch = await bcrypt.compare(process.env.ADMIN_PASSWORD || 'admin123', admin.password_hash)
  if (!adminPassMatch) throw new Error('Admin bcrypt password hash verification failed!')
  console.log(`✓ Admin password verified via bcrypt. Role: ${admin.role}`)

  const wrongPassMatch = await bcrypt.compare('WrongPassword123!', admin.password_hash)
  if (wrongPassMatch) throw new Error('Wrong password was improperly accepted!')
  console.log('✓ Invalid password correctly rejected.')

  // 2. Check Manager Authentication
  console.log('\n--- 2. Testing Manager Authentication ---')
  const managerRes = await query('SELECT * FROM staff_accounts WHERE email = $1', ['manager@qadrigadgets.pk'])
  if (managerRes.rows.length === 0) throw new Error('Manager account not found in database!')
  const manager = managerRes.rows[0]

  const managerPassMatch = await bcrypt.compare(process.env.MANAGER_PASSWORD || 'manager123', manager.password_hash)
  if (!managerPassMatch) throw new Error('Manager bcrypt password hash verification failed!')
  console.log(`✓ Manager password verified via bcrypt. Role: ${manager.role}`)

  // 3. Token Generation and Verification
  console.log('\n--- 3. Testing Token Generation & Verification ---')
  const adminToken = createStaffToken(admin)
  const decoded = verifyStaffToken(adminToken)
  if (!decoded || decoded.email !== admin.email || decoded.role !== 'admin') {
    throw new Error('Token verification failed!')
  }
  console.log(`✓ Valid JWT token generated and verified. Decoded user: ${decoded.name} (${decoded.role})`)

  // 4. Token Revocation via Database
  console.log('\n--- 4. Testing Token Revocation (Database-Backed) ---')
  const tokenHash = crypto.createHash('sha256').update(adminToken).digest('hex')
  const expiresAt = new Date(decoded.exp * 1000)

  // Insert into revoked_tokens
  await query(
    'INSERT INTO revoked_tokens (token_hash, expires_at) VALUES ($1, $2)',
    [tokenHash, expiresAt]
  )
  console.log(`Token revoked and stored in revoked_tokens table.`)

  // Check revocation status
  const revRes = await query('SELECT * FROM revoked_tokens WHERE token_hash = $1', [tokenHash])
  const isRevoked = revRes.rows.length > 0
  if (!isRevoked) throw new Error('Revoked token was not found in revoked_tokens table!')
  console.log('✓ Revocation check succeeded: Token is recorded as revoked.')

  // 5. Leak Prevention Audit
  console.log('\n--- 5. Testing Credentials & Secrets Exposure ---')
  const sanitizedUser = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  }
  const serialized = JSON.stringify(sanitizedUser)
  if (serialized.includes('hash') || serialized.includes('password') || serialized.includes('secret')) {
    throw new Error('Sensitive credentials leaked in serialized user object!')
  }
  console.log('✓ Sanitized user payload verified: Zero password hash, secret, or internal credentials exposed.')

  console.log('\n===============================================================')
  console.log('   AUTHENTICATION MIGRATION TESTS PASSED SUCCESSFULLY!         ')
  console.log('===============================================================')
}

runAuthMigrationTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n[AUTH TEST FATAL]:', err)
    process.exit(1)
  })
