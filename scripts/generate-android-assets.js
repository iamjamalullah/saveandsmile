import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, '..', 'android-admin', 'assets');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. App Icon (1024 x 1024)
const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065f46" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="badge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="224" fill="url(#bg)" />

  <!-- Inner Badge Container -->
  <rect x="232" y="232" width="560" height="560" rx="140" fill="url(#badge)" filter="url(#shadow)" />

  <!-- Brand Mark 'S' -->
  <text x="512" y="620" font-family="system-ui, -apple-system, sans-serif" font-size="380" font-weight="900" fill="#ffffff" text-anchor="middle">S</text>

  <!-- Subtitle Pill -->
  <rect x="362" y="730" width="300" height="56" rx="28" fill="#064e3b" />
  <text x="512" y="767" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="800" fill="#a7f3d0" letter-spacing="3" text-anchor="middle">ADMIN</text>
</svg>
`;

// 2. Adaptive Foreground Icon (1024 x 1024, centered in safe zone)
const adaptiveIconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="badge2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Centered Inner Badge inside 432x432 safe zone -->
  <rect x="312" y="312" width="400" height="400" rx="100" fill="url(#badge2)" filter="url(#shadow2)" />
  <text x="512" y="590" font-family="system-ui, -apple-system, sans-serif" font-size="280" font-weight="900" fill="#ffffff" text-anchor="middle">S</text>
  <rect x="392" y="660" width="240" height="42" rx="21" fill="#064e3b" />
  <text x="512" y="688" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#a7f3d0" letter-spacing="3" text-anchor="middle">ADMIN</text>
</svg>
`;

// 3. Splash Screen (1242 x 2436)
const splashSvg = `
<svg width="1242" height="2436" viewBox="0 0 1242 2436" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <filter id="splashShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <rect width="1242" height="2436" fill="url(#splashBg)" />

  <!-- Center Logo Mark -->
  <rect x="471" y="940" width="300" height="300" rx="75" fill="#10b981" filter="url(#splashShadow)" />
  <text x="621" y="1150" font-family="system-ui, -apple-system, sans-serif" font-size="210" font-weight="900" fill="#ffffff" text-anchor="middle">S</text>

  <!-- Typography -->
  <text x="621" y="1340" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">Save &amp; Smile</text>
  <text x="621" y="1400" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#6ee7b7" text-anchor="middle" letter-spacing="4">OFFICIAL ADMIN APP</text>
</svg>
`;

async function generate() {
  console.log('Generating Android visual assets...');

  await sharp(Buffer.from(iconSvg))
    .png()
    .toFile(path.join(targetDir, 'icon.png'));

  await sharp(Buffer.from(adaptiveIconSvg))
    .png()
    .toFile(path.join(targetDir, 'adaptive-icon.png'));

  await sharp(Buffer.from(splashSvg))
    .png()
    .toFile(path.join(targetDir, 'splash.png'));

  await sharp(Buffer.from(iconSvg))
    .resize(48, 48)
    .png()
    .toFile(path.join(targetDir, 'favicon.png'));

  console.log('Successfully generated all Android assets in:', targetDir);
}

generate().catch(err => {
  console.error('Asset generation error:', err);
  process.exit(1);
});
