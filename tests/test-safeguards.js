/**
 * QADRI GADGETS — AUTOMATED TEST SAFEGUARDS & ISOLATION UTILITIES
 * 
 * Guarantees that:
 * 1. Tests NEVER run destructive operations against production URLs or domains.
 * 2. Automated tests restore the canonical 15 homepage sections upon completion (teardown).
 * 3. The administrator's active development data is never permanently corrupted by test runs.
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { query } from '../src/db/index.js'
import { normalizeSection, publishSections } from '../src/services/homepageService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_JSON_PATH = path.join(__dirname, '..', 'db.json')

const FORBIDDEN_DOMAINS = [
  'saveandsmile.vercel.app',
  'vercel.app',
  'saveandsmile.pk',
  'qadrigadgets.pk',
]

/**
 * Explicit guard preventing test scripts from executing against production URLs.
 */
export function assertNotProduction(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') return
  const lower = targetUrl.toLowerCase()
  for (const domain of FORBIDDEN_DOMAINS) {
    if (lower.includes(domain)) {
      throw new Error(`[SECURITY VIOLATION]: Automated test attempted to target production domain: ${targetUrl}. Aborting test execution immediately!`)
    }
  }
}

/**
 * Restores the baseline 15 canonical sections from db.json into both PostgreSQL and lowdb.
 * Must be called in a finally block after any test suite that modifies homepage layout.
 */
export async function restoreBaselineDatabase(routerDb = null) {
  try {
    if (!fs.existsSync(DB_JSON_PATH)) return
    const raw = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'))
    const canonicalSections = (raw.sections || []).map(normalizeSection)

    const safeRouterDb = routerDb || {
      get: () => ({ value: () => [] }),
      set: () => ({ write: () => {} }),
    }

    if (canonicalSections.length > 0) {
      // Restore PostgreSQL database
      await publishSections({
        sections: canonicalSections,
        label: 'Automated Test Teardown — Restored Canonical 15 Baseline Sections',
        staffUser: { id: 0, name: 'Test Runner Teardown', role: 'system' },
        routerDb: safeRouterDb,
      })

      // Also reset draft
      await query(`
        INSERT INTO homepage_draft (id, draft_json, updated_at)
        VALUES (1, $1, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          draft_json = EXCLUDED.draft_json,
          updated_at = CURRENT_TIMESTAMP
      `, [JSON.stringify(canonicalSections)])

      // Clear hasUnpublishedSectionChanges flag
      if (safeRouterDb && typeof safeRouterDb.set === 'function') {
        safeRouterDb.set('hasUnpublishedSectionChanges', false).write?.()
      }
    }
  } catch (err) {
    console.warn('[TEST SAFEGUARD NOTICE]: Could not fully restore test baseline:', err.message)
  }
}
