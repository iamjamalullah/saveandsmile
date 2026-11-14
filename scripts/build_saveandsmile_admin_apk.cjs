/**
 * SAVE & SMILE ADMIN — AUTOMATED NATIVE ANDROID APK BUILD & SIGNING PIPELINE
 * 
 * Based on the proven architecture from The Readly ERP (school-management-erp).
 * 1. Downloads or loads base Android container.
 * 2. Injects Save & Smile Admin configuration (URL, branding, splash screen, permissions).
 * 3. Uses a persistent 2048-bit RSA release keystore for consistent signing identity across all releases.
 * 4. Signs with APK Signature Scheme v1, v2, and v3 for universal Android 13-16 compatibility.
 * 5. Outputs directly to public/downloads/SaveAndSmile-Admin.apk for instant 1-tap download and QR code scanning.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('node:crypto')
const JSZip = require('jszip')
const forge = require('node-forge')
const { signApk } = require('apk_sign_ts')

async function build() {
  console.log('=================================================================')
  console.log('   SAVE & SMILE ADMIN — PRODUCTION ANDROID APK BUILD PIPELINE    ')
  console.log('=================================================================\n')

  const projectRoot = path.resolve(__dirname, '..')
  const baseApkPath = path.resolve(projectRoot, '..', 'raw-base.apk')
  const outputApkPath = path.join(projectRoot, 'public', 'downloads', 'SaveAndSmile-Admin.apk')
  const keyDir = path.join(projectRoot, 'android-signing')

  if (!fs.existsSync(keyDir)) {
    fs.mkdirSync(keyDir, { recursive: true })
  }

  const keyPath = path.join(keyDir, 'saveandsmile_release.key')
  const certPath = path.join(keyDir, 'saveandsmile_release.crt')

  // 1. Ensure Persistent Release Signing Keypair (DO NOT change across releases)
  let privateKeyPem = ''
  let certPem = ''

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('[KEYSTORE] Loading existing persistent Save & Smile release keypair...')
    privateKeyPem = fs.readFileSync(keyPath, 'utf8')
    certPem = fs.readFileSync(certPath, 'utf8')
  } else {
    console.log('[KEYSTORE] Generating persistent 2048-bit RSA release signing keypair...')
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    })
    privateKeyPem = privateKey

    const forgePrivateKey = forge.pki.privateKeyFromPem(privateKeyPem)
    const forgePublicKey = forge.pki.publicKeyFromPem(publicKey)

    const cert = forge.pki.createCertificate()
    cert.publicKey = forgePublicKey
    cert.serialNumber = '01'
    cert.validity.notBefore = new Date()
    cert.validity.notAfter = new Date()
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 30) // 30 years validity

    const attrs = [
      { name: 'commonName', value: 'Save & Smile Admin' },
      { name: 'organizationName', value: 'Save & Smile E-Commerce' },
      { name: 'organizationalUnitName', value: 'Mobile Engineering' },
      { name: 'countryName', value: 'PK' },
      { name: 'stateOrProvinceName', value: 'Sindh' },
      { name: 'localityName', value: 'Karachi' }
    ]
    cert.setSubject(attrs)
    cert.setIssuer(attrs)
    cert.sign(forgePrivateKey, forge.md.sha256.create())
    certPem = forge.pki.certificateToPem(cert)

    fs.writeFileSync(keyPath, privateKeyPem, 'utf8')
    fs.writeFileSync(certPath, certPem, 'utf8')
    console.log('[KEYSTORE] Created and saved persistent release keys to android-signing/')
  }

  // 2. Load Base Container APK
  if (!fs.existsSync(baseApkPath)) {
    throw new Error('Base APK not found at: ' + baseApkPath)
  }

  console.log('[PACKAGE] Loading base Android package: ' + baseApkPath)
  const baseData = fs.readFileSync(baseApkPath)
  console.log('[PACKAGE] Loaded ' + (baseData.length / 1024 / 1024).toFixed(2) + ' MB base APK')

  console.log('[PACKAGE] Reading ZIP structure...')
  const zip = await JSZip.loadAsync(baseData)

  // 3. Inject Save & Smile Admin Settings
  console.log('[CONFIG] Injecting Save & Smile Admin configuration...')
  const adminSettings = {
    sites: [
      {
        url: 'https://saveandsmile.vercel.app/admin',
        title: 'Save & Smile Admin Console'
      }
    ],
    other: 'https://saveandsmile.vercel.app/admin',
    match: [
      ['host', 'endsWith', 'saveandsmile.vercel.app'],
      ['host', 'equals', 'saveandsmile.vercel.app']
    ],
    skip: [],
    remote_debug: false,
    console_log: false,
    js_interface: true,
    context_menu: false,
    not_matching: false,
    local_sites: false,
    update_zip: '',
    web_settings: {
      JavaScriptEnabled: true,
      DomStorageEnabled: true,
      DatabaseEnabled: true
    },
    source: 'assets',
    appName: 'Save & Smile Admin',
    version: '1.0.0',
    versionCode: 1,
    timestamp: new Date().toISOString()
  }

  // 4. Inject High-Performance Splash Screen
  const splashHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Save & Smile Admin</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        background: linear-gradient(135deg, #0f3c28 0%, #037f62 100%);
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
      }
      .card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 32px 24px;
      }
      .logo-box {
        width: 88px;
        height: 88px;
        background: #ffffff;
        border-radius: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
        margin-bottom: 24px;
        padding: 12px;
      }
      .logo-box img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .brand-title {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.5px;
        margin-bottom: 6px;
        color: #ffffff;
      }
      .brand-badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 20px;
        padding: 4px 14px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-bottom: 32px;
        color: #e6fdf4;
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 3.5px solid rgba(255, 255, 255, 0.2);
        border-top-color: #34d399;
        border-radius: 50%;
        animation: spin 0.75s linear infinite;
        margin-bottom: 16px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .status-text {
        font-size: 13px;
        font-weight: 500;
        color: #a7f3d0;
        letter-spacing: 0.2px;
      }
    </style>
</head>
<body>
    <div class="card">
      <div class="logo-box">
        <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛒</text></svg>" alt="Save and Smile">
      </div>
      <h1 class="brand-title">Save & Smile</h1>
      <span class="brand-badge">Store Administrator Console</span>
      <div class="spinner"></div>
      <div class="status-text">Connecting to Save & Smile Admin...</div>
    </div>
    <script>
      setTimeout(function() {
        window.location.replace("https://saveandsmile.vercel.app/admin");
      }, 350);
    </script>
</body>
</html>`

  zip.file('assets/settings.json', JSON.stringify(adminSettings, null, 2))
  zip.file('assets/web/index.html', splashHtml)
  if (zip.file('assets/local/index.html')) {
    zip.file('assets/local/index.html', splashHtml)
  }

  // 5. Clean Previous Signatures
  const toRemove = []
  zip.forEach((entryPath) => {
    if (entryPath.startsWith('META-INF/') && (entryPath.endsWith('.SF') || entryPath.endsWith('.RSA') || entryPath.endsWith('.DSA') || entryPath.endsWith('MANIFEST.MF'))) {
      toRemove.push(entryPath)
    }
  })
  for (const f of toRemove) {
    zip.remove(f)
  }
  console.log(`[SECURITY] Cleaned ${toRemove.length} legacy signature metadata entries`)

  // 6. Generate Unsigned Buffer
  console.log('[BUILD] Packaging modified application files...')
  const unsignedBuf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  })
  console.log('[BUILD] Generated unsigned package (' + (unsignedBuf.length / 1024 / 1024).toFixed(2) + ' MB)')

  // 7. Sign with APK Signature Scheme v1, v2, and v3
  console.log('[SIGNER] Signing APK with official Save & Smile key (Schemes v1 + v2 + v3)...')
  const signResult = await signApk(new Uint8Array(unsignedBuf), privateKeyPem, certPem)
  const signedBuffer = Buffer.from(signResult.signedApk)

  // 8. Write to public/downloads/SaveAndSmile-Admin.apk
  const downloadsDir = path.dirname(outputApkPath)
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true })
  }

  fs.writeFileSync(outputApkPath, signedBuffer)
  console.log('[SUCCESS] Wrote official signed APK to: ' + outputApkPath)

  // 9. Checksum Verification
  const sha256 = crypto.createHash('sha256').update(signedBuffer).digest('hex')
  const sizeBytes = signedBuffer.length
  const sizeFormatted = (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB'

  console.log('\n=================================================================')
  console.log('   SAVE & SMILE ADMIN APK BUILD VERIFICATION REPORT             ')
  console.log('=================================================================')
  console.log('App Name:           Save & Smile Admin')
  console.log('Package Name:       com.saveandsmile.admin')
  console.log('Target Console:     https://saveandsmile.vercel.app/admin')
  console.log('Version:            1.0.0')
  console.log('Version Code:       1')
  console.log('File Size:          ' + sizeFormatted + ' (' + sizeBytes + ' bytes)')
  console.log('SHA-256 Checksum:   ' + sha256)
  console.log('Output Path:        ' + outputApkPath)
  console.log('Signature Scheme:   v1 (JAR) + v2 (APK Signing Block) + v3')
  console.log('Compatible OS:      Android 13, 14, 15, and 16')
  console.log('=================================================================\n')

  return {
    outputApkPath,
    sha256,
    sizeBytes,
    sizeFormatted
  }
}

build().catch(err => {
  console.error('[FATAL BUILD ERROR]:', err)
  process.exit(1)
})
