/**
 * SAVE & SMILE — Supabase Storage Service
 * 
 * Provides upload, delete, batch delete, existence check and public URL generation
 * for the `product-media` bucket in Supabase Storage.
 * 
 * Credentials are read from server-side environment variables:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * 
 * NEVER expose these in frontend code, browser bundles, logs or Git commits.
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const BUCKET = 'product-media'
const MAX_RETRIES = 3
const BASE_DELAY_MS = 300

let supabase = null

/**
 * Initialize or return the Supabase client.
 * Fails gracefully if credentials are missing.
 */
async function getClient() {
  if (supabase) return supabase

  let url = process.env.SUPABASE_URL || 'https://piocbtkjzznzzdftyelh.supabase.co'
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!key) {
    try {
      const { query } = await import('../db/index.js')
      const res = await query("SELECT value FROM system_config WHERE key = 'SUPABASE_SERVICE_ROLE_KEY'")
      if (res.rows.length > 0 && res.rows[0].value) {
        key = res.rows[0].value
        process.env.SUPABASE_SERVICE_ROLE_KEY = key
      }
    } catch (dbErr) {
      console.warn('[STORAGE] Could not query system_config table:', dbErr.message)
    }
  }

  if (!url || !key) {
    throw new Error('[STORAGE] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in environment or system_config.')
  }

  url = url.trim().split(/[\r\n]/)[0].trim()
  key = key.trim().split(/[\r\n]/)[0].trim()

  supabase = createClient(url, key)
  return supabase
}

/** Delay helper for exponential backoff */
function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

/** Retry wrapper with exponential backoff */
async function withRetry(fn, label = 'operation') {
  let lastErr
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (attempt < MAX_RETRIES - 1) {
        const wait = BASE_DELAY_MS * Math.pow(2, attempt)
        console.warn(`[STORAGE] ${label} attempt ${attempt + 1} failed, retrying in ${wait}ms...`)
        await delay(wait)
      }
    }
  }
  throw lastErr
}

/**
 * Upload a local file to Supabase Storage.
 * @param {string} localPath - Absolute path to local file
 * @param {string} destPath - Destination path in bucket (e.g. "products/image.webp")
 * @param {string} [contentType] - MIME type override
 * @returns {Promise<{path: string, publicUrl: string, size: number}>}
 */
export async function uploadFile(localPath, destPath, contentType = null) {
  const client = await getClient()
  const fileBuffer = await fs.promises.readFile(localPath)
  const size = fileBuffer.length

  if (size === 0) {
    throw new Error(`[STORAGE] File is empty: ${localPath}`)
  }

  const options = { upsert: false }
  if (contentType) options.contentType = contentType

  const result = await withRetry(async () => {
    const { data, error } = await client.storage.from(BUCKET).upload(destPath, fileBuffer, options)
    if (error) throw error
    return data
  }, `upload ${destPath}`)

  const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(destPath)
  const publicUrl = urlData?.publicUrl || null

  return { path: destPath, publicUrl, size }
}

/**
 * Upload from a Buffer (for programmatic use).
 */
export async function uploadBuffer(buffer, destPath, contentType = 'application/octet-stream') {
  const client = await getClient()
  if (!buffer || buffer.length === 0) {
    throw new Error('[STORAGE] Buffer is empty')
  }

  const result = await withRetry(async () => {
    const { data, error } = await client.storage.from(BUCKET).upload(destPath, buffer, {
      upsert: false,
      contentType,
    })
    if (error) throw error
    return data
  }, `upload buffer ${destPath}`)

  const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(destPath)
  return { path: destPath, publicUrl: urlData?.publicUrl || null, size: buffer.length }
}

/**
 * Delete a single object from storage.
 * @param {string} objectPath - Path within the bucket
 * @returns {Promise<boolean>} true if deletion succeeded
 */
export async function deleteObject(objectPath) {
  const client = await getClient()
  const result = await withRetry(async () => {
    const { data, error } = await client.storage.from(BUCKET).remove([objectPath])
    if (error) throw error
    return data
  }, `delete ${objectPath}`)
  return true
}

/**
 * Batch delete multiple objects.
 * @param {string[]} paths - Array of object paths
 * @returns {Promise<{deleted: string[], failed: string[]}>}
 */
export async function deleteBatch(paths) {
  if (!Array.isArray(paths) || paths.length === 0) {
    return { deleted: [], failed: [] }
  }

  const client = await getClient()
  try {
    const { data, error } = await client.storage.from(BUCKET).remove(paths)
    if (error) throw error
    return { deleted: paths, failed: [] }
  } catch (e) {
    console.error('[STORAGE] Batch delete error:', e.message)
    // Fallback: try individual deletions
    const deleted = []
    const failed = []
    for (const p of paths) {
      try {
        await deleteObject(p)
        deleted.push(p)
      } catch {
        failed.push(p)
      }
    }
    return { deleted, failed }
  }
}

/**
 * Check if an object exists in the bucket.
 * @param {string} objectPath
 * @returns {Promise<boolean>}
 */
export async function objectExists(objectPath) {
  const client = await getClient()
  const dir = path.posix.dirname(objectPath)
  const file = path.posix.basename(objectPath)
  const prefix = dir === '.' ? '' : dir

  try {
    const { data, error } = await client.storage.from(BUCKET).list(prefix, {
      limit: 1000,
      search: file,
    })
    if (error) throw error
    return data.some(item => item.name === file)
  } catch {
    return false
  }
}

/**
 * Get the public URL for an object.
 * @param {string} objectPath
 * @returns {string|null}
 */
export function getPublicUrl(objectPath) {
  const url = process.env.SUPABASE_URL || 'https://piocbtkjzznzzdftyelh.supabase.co'
  return `${url}/storage/v1/object/public/${BUCKET}/${objectPath}`
}

/**
 * Verify a public URL returns a valid image response.
 * @param {string} url
 * @returns {Promise<{ok: boolean, status: number, contentType: string}>}
 */
export async function verifyPublicUrl(url) {
  try {
    const resp = await fetch(url, { method: 'HEAD' })
    return {
      ok: resp.ok,
      status: resp.status,
      contentType: resp.headers.get('content-type') || '',
    }
  } catch (e) {
    return { ok: false, status: 0, contentType: '' }
  }
}

export default {
  uploadFile,
  uploadBuffer,
  deleteObject,
  deleteBatch,
  objectExists,
  getPublicUrl,
  verifyPublicUrl,
}
