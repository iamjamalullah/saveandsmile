/**
 * SAVE & SMILE — Media Service & Cleanup Queue
 * 
 * Tracks Supabase Storage objects with ownership metadata,
 * provides shared-media protection, and manages a persistent
 * cleanup queue for safe deferred deletion.
 * 
 * Tables created:
 *   media_objects   — ownership registry for uploaded storage objects
 *   cleanup_queue   — durable outbox for pending storage deletions
 */

import { query } from '../db/index.js'
import { deleteObject, objectExists } from './storageService.js'

const BUCKET = 'product-media'
const MAX_CLEANUP_ATTEMPTS = 5

/**
 * Ensure metadata and cleanup queue tables exist (idempotent).
 * Call once at server startup.
 */
export async function ensureMetadataTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS media_objects (
      id SERIAL PRIMARY KEY,
      bucket TEXT NOT NULL,
      path TEXT NOT NULL,
      filename TEXT,
      mime_type TEXT,
      size_bytes BIGINT,
      owner_type TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(bucket, path, owner_type, owner_id)
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS cleanup_queue (
      id SERIAL PRIMARY KEY,
      bucket TEXT NOT NULL,
      object_path TEXT NOT NULL,
      owner_type TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INT DEFAULT 0,
      last_error TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(bucket, object_path, owner_type, owner_id)
    )
  `)

  console.log('[MEDIA] Metadata tables ensured.')
}

/**
 * Register a media object after successful upload.
 */
export async function registerMedia({ bucket = BUCKET, path: objPath, filename, mimeType, sizeBytes, ownerType, ownerId }) {
  await query(
    `INSERT INTO media_objects (bucket, path, filename, mime_type, size_bytes, owner_type, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (bucket, path, owner_type, owner_id) DO UPDATE SET
       filename = EXCLUDED.filename,
       mime_type = EXCLUDED.mime_type,
       size_bytes = EXCLUDED.size_bytes`,
    [bucket, objPath, filename, mimeType, sizeBytes, ownerType, String(ownerId)]
  )
}

/**
 * Check if a storage object is still referenced by any active record.
 * Returns true if the object is unused and safe to delete.
 * 
 * @param {string} objectPath - The storage path to check
 * @param {string} [excludeOwnerType] - Owner type to exclude (the one being deleted)
 * @param {string} [excludeOwnerId] - Owner ID to exclude
 * @returns {Promise<boolean>}
 */
export async function isObjectUnused(objectPath, excludeOwnerType = null, excludeOwnerId = null) {
  // Check media_objects for other owners
  let moQuery = `SELECT COUNT(*) AS cnt FROM media_objects WHERE bucket = $1 AND path = $2`
  const moParams = [BUCKET, objectPath]
  if (excludeOwnerType && excludeOwnerId) {
    moQuery += ` AND NOT (owner_type = $3 AND owner_id = $4)`
    moParams.push(excludeOwnerType, String(excludeOwnerId))
  }
  const moRes = await query(moQuery, moParams)
  if (parseInt(moRes.rows[0].cnt, 10) > 0) return false

  // Cross-reference check against actual tables
  // We check URL patterns since some tables store full URLs, others store paths
  const pathLike = `%${objectPath}%`

  // Products
  const prodCheck = await query(
    `SELECT 1 FROM products WHERE image_main LIKE $1 OR images_gallery::text LIKE $1 LIMIT 1`,
    [pathLike]
  )
  if (prodCheck.rows.length > 0) return false

  // Variant images
  const varCheck = await query(
    `SELECT 1 FROM product_variant_images WHERE image_url LIKE $1 LIMIT 1`,
    [pathLike]
  )
  if (varCheck.rows.length > 0) return false

  // Categories
  const catCheck = await query(
    `SELECT 1 FROM categories WHERE image_url LIKE $1 LIMIT 1`,
    [pathLike]
  )
  if (catCheck.rows.length > 0) return false

  // Hero slides
  const heroCheck = await query(
    `SELECT 1 FROM hero_slides WHERE image_url LIKE $1 LIMIT 1`,
    [pathLike]
  )
  if (heroCheck.rows.length > 0) return false

  // Homepage sections (banner images, bg images, etc.)
  const secCheck = await query(
    `SELECT 1 FROM sections WHERE content_json::text LIKE $1 LIMIT 1`,
    [pathLike]
  )
  if (secCheck.rows.length > 0) return false

  return true
}

/**
 * Enqueue a storage object for deferred deletion.
 * Deduplicates by bucket + path + owner.
 */
export async function enqueueDeletion({ bucket = BUCKET, objectPath, ownerType, ownerId }) {
  await query(
    `INSERT INTO cleanup_queue (bucket, object_path, owner_type, owner_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (bucket, object_path, owner_type, owner_id) DO NOTHING`,
    [bucket, objectPath, ownerType, String(ownerId)]
  )
  console.log(`[CLEANUP QUEUE] Enqueued: ${objectPath} (owner: ${ownerType}/${ownerId})`)
}

/**
 * Remove the media_objects registration for a deleted entity.
 */
export async function unregisterMedia({ bucket = BUCKET, ownerType, ownerId }) {
  const res = await query(
    `DELETE FROM media_objects WHERE bucket = $1 AND owner_type = $2 AND owner_id = $3 RETURNING path`,
    [bucket, ownerType, String(ownerId)]
  )
  return res.rows.map(r => r.path)
}

/**
 * Collect all image paths associated with a product.
 * Returns an array of storage-relevant path strings.
 */
export function extractImagePaths(imageUrls) {
  if (!Array.isArray(imageUrls)) return []
  return imageUrls
    .filter(u => u && typeof u === 'string')
    .map(u => {
      // Extract the path after /product-media/
      const match = u.match(/\/product-media\/(.+)$/)
      return match ? match[1] : null
    })
    .filter(Boolean)
}

/**
 * Process pending cleanup queue jobs.
 * Call from a background worker or admin endpoint.
 * 
 * @param {number} [limit=20] - Max jobs to process per run
 * @returns {Promise<{processed: number, succeeded: number, failed: number, skipped: number}>}
 */
export async function processCleanupQueue(limit = 20) {
  const pending = await query(
    `SELECT * FROM cleanup_queue WHERE status = 'pending' AND attempts < $1 ORDER BY created_at ASC LIMIT $2`,
    [MAX_CLEANUP_ATTEMPTS, limit]
  )

  let succeeded = 0
  let failed = 0
  let skipped = 0

  for (const job of pending.rows) {
    try {
      // Re-check if object is still unused (another record may have been created)
      const unused = await isObjectUnused(job.object_path)
      if (!unused) {
        await query(
          `UPDATE cleanup_queue SET status = 'skipped_still_referenced', updated_at = NOW() WHERE id = $1`,
          [job.id]
        )
        skipped++
        continue
      }

      // Check if object actually exists in storage
      const exists = await objectExists(job.object_path)
      if (!exists) {
        await query(
          `UPDATE cleanup_queue SET status = 'success_not_found', updated_at = NOW() WHERE id = $1`,
          [job.id]
        )
        succeeded++
        continue
      }

      // Perform actual deletion
      await deleteObject(job.object_path)

      await query(
        `UPDATE cleanup_queue SET status = 'success', updated_at = NOW() WHERE id = $1`,
        [job.id]
      )
      console.log(`[CLEANUP] Deleted: ${job.object_path}`)
      succeeded++
    } catch (e) {
      console.error(`[CLEANUP] Failed ${job.object_path}:`, e.message)
      await query(
        `UPDATE cleanup_queue SET status = 'failed', attempts = attempts + 1, last_error = $2, updated_at = NOW() WHERE id = $1`,
        [job.id, e.message]
      )
      failed++
    }
  }

  return { processed: pending.rows.length, succeeded, failed, skipped }
}

/**
 * Get cleanup queue status summary for admin dashboard.
 */
export async function getCleanupQueueStatus() {
  const res = await query(`
    SELECT status, COUNT(*) as count 
    FROM cleanup_queue 
    GROUP BY status 
    ORDER BY status
  `)
  return res.rows
}

/**
 * Retry all failed cleanup jobs (reset their status to pending).
 */
export async function retryFailedCleanupJobs() {
  const res = await query(
    `UPDATE cleanup_queue SET status = 'pending', updated_at = NOW() WHERE status = 'failed' AND attempts < $1 RETURNING id`,
    [MAX_CLEANUP_ATTEMPTS]
  )
  return res.rows.length
}

export default {
  ensureMetadataTables,
  registerMedia,
  isObjectUnused,
  enqueueDeletion,
  unregisterMedia,
  extractImagePaths,
  processCleanupQueue,
  getCleanupQueueStatus,
  retryFailedCleanupJobs,
}
