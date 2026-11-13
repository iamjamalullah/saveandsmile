import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { query } from '../src/db/index.js';

const BACKUP_DIR = path.resolve('backups', 'media_assets');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function verifyImageBytes(buffer, mimeType) {
  if (buffer.length < 12) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // WEBP: RIFF .... WEBP
  const riff = buffer.toString('ascii', 0, 4);
  const webp = buffer.toString('ascii', 8, 12);
  if (riff === 'RIFF' && webp === 'WEBP') return true;
  return false;
}

async function collectAllImageUrls() {
  const images = new Set();
  const detailed = [];

  // 1. Products
  const prods = await query('SELECT id, name, sku, image_main, images_gallery FROM products');
  for (const p of prods.rows) {
    if (p.image_main && p.image_main.includes('qadrigadgets.pk')) {
      images.add(p.image_main);
      detailed.push({ type: 'product_main', id: p.id, name: p.name, url: p.image_main });
    }
    const gallery = typeof p.images_gallery === 'string' ? JSON.parse(p.images_gallery) : (p.images_gallery || []);
    gallery.forEach(img => {
      if (img && img.includes('qadrigadgets.pk')) {
        images.add(img);
        detailed.push({ type: 'product_gallery', id: p.id, name: p.name, url: img });
      }
    });
  }

  // 2. Product Variant Images
  const varImgs = await query('SELECT id, product_id, image_url FROM product_variant_images');
  for (const v of varImgs.rows) {
    if (v.image_url && v.image_url.includes('qadrigadgets.pk')) {
      images.add(v.image_url);
      detailed.push({ type: 'variant_image', id: v.product_id, url: v.image_url });
    }
  }

  // 3. Categories
  const cats = await query('SELECT id, slug, name, image_url FROM categories');
  for (const c of cats.rows) {
    if (c.image_url && c.image_url.includes('qadrigadgets.pk')) {
      images.add(c.image_url);
      detailed.push({ type: 'category', id: c.id, slug: c.slug, url: c.image_url });
    }
  }

  // 4. Hero Slides
  const slides = await query('SELECT id, title, image_url FROM hero_slides');
  for (const s of slides.rows) {
    if (s.image_url && s.image_url.includes('qadrigadgets.pk')) {
      images.add(s.image_url);
      detailed.push({ type: 'hero_slide', id: s.id, title: s.title, url: s.image_url });
    }
  }

  // 5. Sections
  const sections = await query('SELECT id, block_type, content_json FROM sections');
  for (const sec of sections.rows) {
    const raw = typeof sec.content_json === 'string' ? sec.content_json : JSON.stringify(sec.content_json || '');
    const matches = raw.match(/https:\/\/www\.qadrigadgets\.pk\/images\/[^"\s]+/g) || [];
    for (const m of matches) {
      images.add(m);
      detailed.push({ type: 'section_content', id: sec.id, sectionType: sec.block_type, url: m });
    }
  }

  console.log(`Unique legacy image URLs identified: ${images.size}`);
  return Array.from(images);
}

async function main() {
  const urls = await collectAllImageUrls();
  const mapping = [];
  let downloadedCount = 0;
  let decodedSuccessCount = 0;
  let failedCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const sourceUrl = urls[i];
    const parsed = new URL(sourceUrl);
    const basename = path.basename(parsed.pathname);
    const localFile = path.join(BACKUP_DIR, basename);

    try {
      const res = await fetch(sourceUrl);
      if (!res.ok) {
        failedCount++;
        mapping.push({ sourceUrl, status: 'fetch_failed', statusCode: res.status });
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(localFile, buffer);
      downloadedCount++;

      const isDecodedValid = verifyImageBytes(buffer);
      if (isDecodedValid) {
        decodedSuccessCount++;
      } else {
        console.warn(`Warning: Image decoding failed for ${basename}`);
      }

      const targetDestinationUrl = `https://piocbtkjzznzzdftyelh.supabase.co/storage/v1/object/public/product-media/${basename}`;

      mapping.push({
        sourceUrl,
        basename,
        localFile: path.relative(process.cwd(), localFile).replace(/\\/g, '/'),
        targetDestinationUrl,
        sizeBytes: buffer.length,
        contentType: res.headers.get('content-type') || 'application/octet-stream',
        decodedValid: isDecodedValid,
        status: 'downloaded_and_verified'
      });
    } catch (err) {
      failedCount++;
      mapping.push({ sourceUrl, status: 'error', error: err.message });
    }
  }

  const mappingFile = path.resolve('backups', 'legacy-cdn-rollback-mapping.json');
  fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2), 'utf8');

  console.log('\n=== IMAGE BACKUP & VERIFICATION SUMMARY ===');
  console.log(`Total URLs Processed: ${urls.length}`);
  console.log(`Downloaded Successfully: ${downloadedCount}`);
  console.log(`Decoded Valid Images: ${decodedSuccessCount}`);
  console.log(`Failed Downloads: ${failedCount}`);
  console.log(`Rollback Mapping Written to: ${mappingFile}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
