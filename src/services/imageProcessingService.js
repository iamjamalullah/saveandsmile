/**
 * SAVE & SMILE — Centralized Server-Side Image Processing & WebP Conversion Service
 * 
 * Enforces the Mandatory Global Image Format Policy:
 * "Every image uploaded, migrated, replaced, or newly generated for website content
 *  MUST be stored and served in WebP format."
 * 
 * Features:
 * 1. Accepts JPEG, JPG, PNG, GIF, BMP, TIFF, SVG, and modern web formats.
 * 2. Validates binary signatures and actual file content.
 * 3. Converts all supported images into WebP (quality 82, lossless if needed, alpha preserved).
 * 4. Preserves transparency for PNG/WebP.
 * 5. Handles animated GIFs: converts to animated WebP or safely preserves multi-frame data.
 * 6. Downscales excessively huge images (e.g. >2560px width) while maintaining crisp quality.
 * 7. Strips unnecessary EXIF/IPTC metadata to reduce payload size.
 * 8. Rejects corrupted or invalid non-image files.
 * 9. Rejects videos from image endpoints.
 */

import sharp from 'sharp'
import path from 'node:path'
import crypto from 'node:crypto'

export const WEBP_QUALITY = 82
export const MAX_DIMENSION = 2560 // Max width/height to prevent memory exhaustion

/**
 * Validates whether a buffer is a supported image and returns its metadata.
 * Throws an error if the buffer is not a valid image.
 */
export async function validateImage(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Image buffer is empty or invalid.')
  }

  // Reject common video headers
  const isVideo = buffer.subarray(0, 12).toString('hex').includes('66747970') // 'ftyp'
  if (isVideo) {
    throw new Error('Video files are not allowed in image conversion service.')
  }

  try {
    const metadata = await sharp(buffer).metadata()
    if (!metadata || !metadata.format) {
      throw new Error('File is not a valid or recognized image format.')
    }
    return metadata
  } catch (err) {
    throw new Error(`Corrupted or unsupported image file: ${err.message}`)
  }
}

/**
 * Converts any supported image buffer into an optimized WebP buffer.
 * Preserves alpha/transparency and animation where applicable.
 * 
 * @param {Buffer} inputBuffer - Source image buffer
 * @param {Object} [options] - Optional overrides { quality, maxWidth, maxHeight }
 * @returns {Promise<{ webpBuffer: Buffer, format: 'webp', width: number, height: number, sizeBytes: number, isAnimated: boolean }>}
 */
export async function convertToWebP(inputBuffer, options = {}) {
  const metadata = await validateImage(inputBuffer)
  const isAnimated = (metadata.pages && metadata.pages > 1) || Boolean(metadata.pageHeight)

  let pipeline = sharp(inputBuffer, { animated: isAnimated })

  // Auto-rotate according to EXIF orientation
  pipeline = pipeline.rotate()

  // Resize if excessively large
  const targetMax = options.maxWidth || MAX_DIMENSION
  if ((metadata.width && metadata.width > targetMax) || (metadata.height && metadata.height > targetMax)) {
    pipeline = pipeline.resize({
      width: metadata.width > metadata.height ? targetMax : null,
      height: metadata.height >= metadata.width ? targetMax : null,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  // WebP options
  const webpOptions = {
    quality: options.quality || WEBP_QUALITY,
    alphaQuality: 90,
    effort: 4, // Good balance of compression speed and size
  }

  // If animated (like GIF), configure animated WebP
  if (isAnimated) {
    webpOptions.pageHeight = metadata.pageHeight
    webpOptions.loop = metadata.loop ?? 0
  }

  pipeline = pipeline.webp(webpOptions)

  const webpBuffer = await pipeline.toBuffer()
  const resultMeta = await sharp(webpBuffer, { animated: isAnimated }).metadata()

  return {
    webpBuffer,
    format: 'webp',
    mimeType: 'image/webp',
    width: resultMeta.width || metadata.width,
    height: resultMeta.height || metadata.height,
    sizeBytes: webpBuffer.length,
    isAnimated,
  }
}

/**
 * Generate a clean, deterministic WebP filename.
 * E.g. `product_1780920646_a1b2c3d4.webp`
 */
export function generateWebPFilename(originalName = 'image', prefix = 'media') {
  const baseName = path.basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 50)
  const hash = crypto.randomBytes(4).toString('hex')
  return `${prefix}_${Date.now()}_${baseName}_${hash}.webp`
}

export default {
  validateImage,
  convertToWebP,
  generateWebPFilename,
  WEBP_QUALITY,
}
