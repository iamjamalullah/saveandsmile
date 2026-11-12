import { query, transaction } from '../db/index.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_JSON_PATH = path.join(__dirname, '..', '..', 'db.json')

/**
 * Validates container layout
 * Supported layouts:
 * - 'single': 100% full-width column
 * - 'two_equal': 50% / 50% split
 * - 'two_70_30': 70% left / 30% right
 * - 'two_30_70': 30% left / 70% right
 */
export const VALID_CONTAINER_LAYOUTS = ['single', 'two_equal', 'two_70_30', 'two_30_70']

/**
 * Validates block types:
 * - 'products': Product category or catalog group feed
 * - 'banner': Single or dual promotional banner
 * - 'announcement': Rich text / promotional announcement callout
 */
export const VALID_BLOCK_TYPES = ['products', 'banner', 'announcement', 'image_text', 'countdown', 'trust_bar']

/**
 * Normalize and sanitize a section object for storage
 */
export function normalizeSection(s, index = 0) {
  const containerLayout = VALID_CONTAINER_LAYOUTS.includes(s.containerLayout || s.container_layout)
    ? (s.containerLayout || s.container_layout)
    : 'single'

  const blockType = VALID_BLOCK_TYPES.includes(s.blockType || s.block_type)
    ? (s.blockType || s.block_type)
    : 'products'

  const id = s.id ? String(s.id) : `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const title = String(s.title || '').trim() || (
    blockType === 'banner' ? 'Promotional Banner'
    : blockType === 'image_text' ? 'Featured Story & Showcase'
    : blockType === 'countdown' ? 'Limited Time Flash Sale'
    : blockType === 'trust_bar' ? 'Why Shop With Us'
    : 'Featured Collection'
  )
  const order = typeof s.order === 'number' ? s.order : index + 1

  const existingContent = s.content || {}

  const defaultContent = {
    // 1. Banners
    banners: s.banners || existingContent.banners || (s.banner ? [s.banner] : []),
    // 2. Announcement Callout
    announcement: existingContent.announcement || s.announcement || {
      heading: s.title || '',
      subheading: s.subtitle || '',
      buttonText: s.buttonText || 'Shop Now',
      buttonLink: s.buttonLink || '/shop',
      bgColor: s.color || '#049977',
      textColor: '#ffffff',
      align: 'center',
    },
    // 3. Image + Text Section
    image_text: existingContent.image_text || s.image_text || {
      image: s.image || existingContent.image || 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp',
      imageAlt: s.imageAlt || s.title || 'Featured Showcase',
      heading: s.title || 'Premium Quality Gadgets & Electronics',
      text: s.text || s.subtitle || 'Discover innovative lifestyle accessories and smart gadgets engineered for performance and durability. Tested and verified for authentic quality.',
      buttonText: s.buttonText || 'Explore Catalog',
      buttonLink: s.buttonLink || '/shop',
      imagePosition: s.imagePosition || existingContent.imagePosition || 'left', // 'left' | 'right'
      bgColor: s.bgColor || '#ffffff',
      textColor: s.textColor || '#1e293b',
    },
    // 4. Countdown Promotion Section
    countdown: existingContent.countdown || s.countdown || {
      heading: s.title || 'Mega Flash Sale – Limited Hours Only',
      subheading: s.subtitle || 'Special discounted wholesale rates available until timer expires!',
      targetDate: s.targetDate || existingContent.targetDate || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      buttonText: s.buttonText || 'Shop Sale Now',
      buttonLink: s.buttonLink || '/shop?group=hot',
      bgColor: s.color || '#0f3c28',
      textColor: '#ffffff',
    },
    // 5. Benefits / Trust Bar Section
    trust_bar: existingContent.trust_bar || s.trust_bar || {
      heading: s.title || '',
      items: (existingContent.trust_bar && existingContent.trust_bar.items) || s.items || [
        { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders over Rs. 3,000' },
        { icon: '💬', title: '24/7 WhatsApp Help', subtitle: 'Live chat support anytime' },
        { icon: '🛡️', title: '100% Genuine Items', subtitle: 'Tested & verified products' },
        { icon: '💵', title: 'Cash on Delivery', subtitle: 'Pay when your parcel arrives' },
      ],
      bgColor: s.color || '#f8fafc',
      textColor: '#1e293b',
    },
  }

  return {
    id,
    order,
    title,
    subtitle: String(s.subtitle || '').trim(),
    containerLayout,
    blockType,
    enabled: s.enabled !== false && s.isVisible !== false && s.is_visible !== false,
    isPublished: s.isPublished !== false && s.is_published !== false,
    color: s.color || '#00998f',
    bg: s.bg || '',
    category: s.category || null,
    group: s.group || null,
    viewAll: Boolean(s.viewAll),
    seeMore: Boolean(s.seeMore),
    content: {
      ...defaultContent,
      ...existingContent,
    },
    responsiveSettings: s.responsiveSettings || {
      mobileStack: true,
      hideOnMobile: false,
    },
  }
}

/**
 * Fetch published sections currently visible on storefront
 */
export async function getPublishedSections(routerDb) {
  try {
    const res = await query(
      `SELECT * FROM sections WHERE is_visible = true AND is_published = true ORDER BY sort_order ASC`
    )
    if (res && res.rows && res.rows.length > 0) {
      return res.rows.map((row, idx) => {
        let content = {}
        try { content = typeof row.content_json === 'string' ? JSON.parse(row.content_json) : (row.content_json || {}) } catch (_) {}
        let responsiveSettings = {}
        try { responsiveSettings = typeof row.responsive_settings_json === 'string' ? JSON.parse(row.responsive_settings_json) : (row.responsive_settings_json || {}) } catch (_) {}

        return normalizeSection({
          id: row.id,
          order: row.sort_order || idx + 1,
          title: row.title,
          subtitle: row.subtitle,
          containerLayout: row.container_layout,
          blockType: row.block_type,
          enabled: row.is_visible,
          isPublished: row.is_published,
          content,
          responsiveSettings,
          ...content, // Preserve legacy keys (color, bg, category, group, etc.)
        }, idx)
      })
    }
  } catch (err) {
    console.warn('[HOMEPAGE SERVICE] Postgres query fallback to db.json:', err.message)
  }

  // Fallback to db.json
  const raw = routerDb.get('sections').value() || []
  return raw
    .filter(s => s.enabled !== false && s.isPublished !== false)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map(normalizeSection)
}

/**
 * Fetch draft working sections for admin builder
 */
export async function getDraftSections(routerDb) {
  // Check if draft exists in db.json first
  const draftList = routerDb.get('homepageDraftSections').value()
  if (Array.isArray(draftList) && draftList.length > 0) {
    return draftList.map(normalizeSection)
  }

  // Otherwise fallback to published sections
  return getPublishedSections(routerDb)
}

/**
 * Save draft sections without altering live storefront
 */
export async function saveDraftSections({ sections, staffUser, routerDb }) {
  if (!Array.isArray(sections)) {
    throw new Error('Sections must be an array')
  }

  const normalized = sections.map((s, idx) => normalizeSection(s, idx))

  // Persist draft in router.db and db.json
  routerDb.set('homepageDraftSections', normalized).write()
  try {
    routerDb.set('homepageDraftStatus', { hasUnpublishedSectionChanges: true }).write()
  } catch (_) {}

  return {
    success: true,
    message: 'Homepage draft saved successfully. Live storefront remains unchanged until published.',
    draftSections: normalized,
  }
}

/**
 * Publish sections live to storefront with atomic transaction and rollback snapshot
 */
export async function publishSections({ sections, label, staffUser, routerDb }) {
  if (!Array.isArray(sections)) {
    throw new Error('Sections must be an array')
  }

  const normalized = sections.map((s, idx) => {
    const sec = normalizeSection(s, idx)
    sec.isPublished = true
    return sec
  })

  const versionLabel = label || `Published by ${staffUser?.name || 'Admin'} on ${new Date().toLocaleString('en-GB')}`

  // 1. Transactional PostgreSQL update and version snapshot
  try {
    await transaction(async client => {
      // Create version snapshot before overwriting
      await client.query(
        `INSERT INTO homepage_section_versions (version_label, sections_snapshot_json, published_by)
         VALUES ($1, $2, $3)`,
        [versionLabel, JSON.stringify(normalized), staffUser?.name || 'Administrator']
      )

      // Clean or update sections table in transaction
      await client.query(`DELETE FROM sections`)
      for (let i = 0; i < normalized.length; i++) {
        const s = normalized[i]
        const numId = i + 1
        await client.query(
          `INSERT INTO sections (
             id, group_name, title, subtitle, sort_order,
             container_layout, block_type, content_json,
             responsive_settings_json, is_visible, is_published,
             has_unpublished_changes
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             sort_order = EXCLUDED.sort_order,
             container_layout = EXCLUDED.container_layout,
             block_type = EXCLUDED.block_type,
             content_json = EXCLUDED.content_json,
             is_visible = EXCLUDED.is_visible,
             is_published = EXCLUDED.is_published`,
          [
            numId,
            s.group || `custom-${numId}`,
            s.title,
            s.subtitle || '',
            s.order || i + 1,
            s.containerLayout,
            s.blockType,
            JSON.stringify(s.content || s),
            JSON.stringify(s.responsiveSettings || {}),
            s.enabled !== false,
            true,
            false,
          ]
        )
      }
    })
  } catch (pgErr) {
    console.warn('[HOMEPAGE SERVICE] Postgres publish transaction warning:', pgErr.message)
  }

  // 2. Synchronize router.db and db.json
  routerDb.set('sections', normalized).write()
  routerDb.set('homepageDraftSections', normalized).write()
  try {
    routerDb.set('homepageDraftStatus', { hasUnpublishedSectionChanges: false }).write()
  } catch (_) {}

  // Also maintain versions in db.json for fallback
  const versions = routerDb.get('homepageSectionVersions').value() || []
  const newVersion = {
    id: Date.now(),
    version_label: versionLabel,
    published_by: staffUser?.name || 'Administrator',
    created_at: new Date().toISOString(),
    sections_count: normalized.length,
    snapshot: normalized,
  }
  routerDb.set('homepageSectionVersions', [newVersion, ...versions.slice(0, 19)]).write()

  return {
    success: true,
    message: 'Homepage sections published live to storefront successfully!',
    sections: normalized,
    version: newVersion,
  }
}

/**
 * Get published version history snapshots
 */
export async function getSectionVersions(routerDb) {
  try {
    const res = await query(
      `SELECT id, version_label, published_by, created_at
       FROM homepage_section_versions
       ORDER BY created_at DESC
       LIMIT 20`
    )
    if (res && res.rows && res.rows.length > 0) {
      return res.rows
    }
  } catch (err) {
    console.warn('[HOMEPAGE SERVICE] Postgres versions query fallback:', err.message)
  }

  // Fallback to db.json
  const versions = routerDb.get('homepageSectionVersions').value() || []
  return versions.map(v => ({
    id: v.id,
    version_label: v.version_label,
    published_by: v.published_by,
    created_at: v.created_at,
    sections_count: v.sections_count || (v.snapshot ? v.snapshot.length : 0),
  }))
}

/**
 * Restore a previous version snapshot
 */
export async function restoreSectionVersion({ versionId, staffUser, routerDb }) {
  let restoredSections = null

  // 1. Try PostgreSQL lookup
  try {
    const res = await query(
      `SELECT sections_snapshot_json FROM homepage_section_versions WHERE id = $1`,
      [parseInt(versionId, 10)]
    )
    if (res && res.rows && res.rows.length > 0) {
      restoredSections = JSON.parse(res.rows[0].sections_snapshot_json)
    }
  } catch (err) {
    console.warn('[HOMEPAGE SERVICE] Postgres version restore fallback:', err.message)
  }

  // 2. Try db.json lookup if not found
  if (!restoredSections) {
    const versions = routerDb.get('homepageSectionVersions').value() || []
    const match = versions.find(v => String(v.id) === String(versionId))
    if (match && Array.isArray(match.snapshot)) {
      restoredSections = match.snapshot
    }
  }

  if (!restoredSections || !Array.isArray(restoredSections)) {
    throw new Error(`Version snapshot ${versionId} not found or corrupted`)
  }

  // Publish restored sections
  return publishSections({
    sections: restoredSections,
    label: `Restored from snapshot #${versionId} by ${staffUser?.name || 'Admin'}`,
    staffUser,
    routerDb,
  })
}
