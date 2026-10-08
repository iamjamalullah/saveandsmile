const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { query, queryOne } = require('./db');

const ALLOWED = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm'
]);
const MAX_BYTES = 12 * 1024 * 1024;
const SIZES = { thumbnail: 160, small: 320, medium: 640, large: 1280 };

function uploadRoot() {
  const dir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function publicUrl(id, file) {
  return `/uploads/${id}/${file}`;
}

function pickMime(name, declared) {
  const ext = path.extname(name || '').toLowerCase();
  if (declared && ALLOWED.has(declared)) return declared;
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  return declared || 'application/octet-stream';
}

async function processBuffer(buffer, opts = {}) {
  if (!buffer || !buffer.length) {
    const err = new Error('Empty file');
    err.status = 400;
    throw err;
  }
  if (buffer.length > MAX_BYTES) {
    const err = new Error('File too large (max 12MB)');
    err.status = 413;
    throw err;
  }
  const mime = pickMime(opts.filename, opts.mime);
  if (!ALLOWED.has(mime)) {
    const err = new Error('Unsupported file type');
    err.status = 400;
    throw err;
  }

  const id = crypto.randomUUID();
  const dir = path.join(uploadRoot(), id);
  fs.mkdirSync(dir, { recursive: true });

  const isVideo = mime.startsWith('video/');
  const origExt = mime === 'image/png' ? 'png' : isVideo ? (mime === 'video/webm' ? 'webm' : 'mp4') : mime === 'image/webp' ? 'webp' : mime === 'image/gif' ? 'gif' : 'jpg';
  fs.writeFileSync(path.join(dir, `original.${origExt}`), buffer);

  const variants = { original: publicUrl(id, `original.${origExt}`) };
  let width = null;
  let height = null;

  if (!isVideo && mime !== 'image/gif') {
    let sharp;
    try { sharp = require('sharp'); } catch (e) { sharp = null; }
    if (sharp) {
      const meta = await sharp(buffer).metadata();
      width = meta.width || null;
      height = meta.height || null;
      for (const [name, w] of Object.entries(SIZES)) {
        const file = `${name}.webp`;
        await sharp(buffer)
          .rotate()
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toFile(path.join(dir, file));
        variants[name] = publicUrl(id, file);
        variants[`${name}_webp`] = variants[name];
      }
      try {
        await sharp(buffer)
          .rotate()
          .resize({ width: 640, withoutEnlargement: true })
          .avif({ quality: 48 })
          .toFile(path.join(dir, 'medium.avif'));
        variants.avif = publicUrl(id, 'medium.avif');
      } catch (e) {
        variants.avif_error = e.message;
      }
    }
  }

  const row = {
    id,
    title: opts.title || opts.filename || id,
    alt: opts.alt || '',
    caption: opts.caption || '',
    description: opts.description || '',
    original_name: opts.filename || '',
    mime,
    size_bytes: buffer.length,
    width,
    height,
    url: variants.medium || variants.original,
    variants,
    source: opts.source || 'upload',
    folder_id: opts.folder_id || null
  };

  await query(
    `INSERT INTO media (id, folder_id, title, alt, caption, description, original_name, mime, size_bytes, width, height, url, variants, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14)`,
    [row.id, row.folder_id, row.title, row.alt, row.caption, row.description, row.original_name, row.mime, row.size_bytes, row.width, row.height, row.url, JSON.stringify(row.variants), row.source]
  );
  return queryOne(`SELECT * FROM media WHERE id = $1`, [id]);
}

async function importFromUrl(url, opts = {}) {
  if (!url || !/^https?:\/\//i.test(url)) {
    const err = new Error('Valid http(s) URL required');
    err.status = 400;
    throw err;
  }
  const id = crypto.randomUUID();
  const variants = { original: url };
  await query(
    `INSERT INTO media (id, title, alt, original_name, mime, url, variants, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,'url')`,
    [id, opts.title || url, opts.alt || '', url, opts.mime || 'image/jpeg', url, JSON.stringify(variants)]
  );
  try {
    const res = await fetch(url);
    if (!res.ok) return queryOne(`SELECT * FROM media WHERE id = $1`, [id]);
    const mime = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
    if (!ALLOWED.has(mime) || mime.startsWith('video/')) {
      return queryOne(`SELECT * FROM media WHERE id = $1`, [id]);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) return queryOne(`SELECT * FROM media WHERE id = $1`, [id]);
    const processed = await processBuffer(buf, {
      filename: path.basename(new URL(url).pathname) || 'remote.jpg',
      mime,
      alt: opts.alt,
      title: opts.title,
      source: 'url'
    });
    await query(`DELETE FROM media WHERE id = $1`, [id]);
    return processed;
  } catch (e) {
    return queryOne(`SELECT * FROM media WHERE id = $1`, [id]);
  }
}

function srcsetFrom(media) {
  if (!media) return { src: '', srcset: '', width: '', height: '' };
  let variants = media.variants;
  if (typeof variants === 'string') {
    try { variants = JSON.parse(variants); } catch (e) { variants = {}; }
  }
  variants = variants || {};
  const src = variants.medium || media.url || variants.original || '';
  const parts = [];
  if (variants.small) parts.push(`${variants.small} 320w`);
  if (variants.medium) parts.push(`${variants.medium} 640w`);
  if (variants.large) parts.push(`${variants.large} 1280w`);
  return {
    src,
    srcset: parts.join(', '),
    width: media.width || '',
    height: media.height || ''
  };
}

module.exports = { processBuffer, importFromUrl, srcsetFrom, ALLOWED, MAX_BYTES, uploadRoot };
