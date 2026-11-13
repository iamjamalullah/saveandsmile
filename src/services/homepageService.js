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
export const VALID_BLOCK_TYPES = ['products', 'banner', 'announcement', 'image_text', 'countdown', 'trust_bar', 'categories', 'reels', 'reviews', 'category_tabs', 'hero']

/**
 * Extract 11-character YouTube video ID from standard URLs (watch, share, shorts, embed)
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null
  const clean = url.trim()
  const match = clean.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i)
  return match ? match[1] : null
}

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
    : blockType === 'hero' ? 'Hero Banner Slider'
    : blockType === 'categories' ? 'Shop By Categories'
    : blockType === 'reels' ? 'Watch & Shop'
    : blockType === 'reviews' ? 'What Our Clients Say'
    : blockType === 'category_tabs' ? 'Category Tabs + Product Grid'
    : 'Featured Collection'
  )
  const order = typeof s.order === 'number' ? s.order : index + 1

  const existingContent = s.content || {}

  // Bidirectional resolution: extract attributes from top-level, content, or legacy group_name
  const group = s.group || existingContent.group || (
    s.group_name && !String(s.group_name).startsWith('custom-') ? s.group_name : null
  ) || null
  const category = s.category || existingContent.category || null
  const color = s.color || existingContent.color || '#00998f'
  const bg = s.bg !== undefined ? s.bg : (existingContent.bg !== undefined ? existingContent.bg : '')
  const viewAll = s.viewAll !== undefined ? Boolean(s.viewAll) : Boolean(existingContent.viewAll)
  const seeMore = s.seeMore !== undefined ? Boolean(s.seeMore) : Boolean(existingContent.seeMore)

  const defaultContent = {
    // 1. Banners
    banners: s.banners || existingContent.banners || (s.banner ? [s.banner] : []),
    // 2. Announcement Callout
    announcement: existingContent.announcement || s.announcement || {
      heading: s.title || '',
      subheading: s.subtitle || '',
      buttonText: s.buttonText || 'Shop Now',
      buttonLink: s.buttonLink || '/shop',
      bgColor: color || '#049977',
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
      bgColor: color || '#0f3c28',
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
      bgColor: color || '#f8fafc',
      textColor: '#1e293b',
    },
    // 6. Hero Slider
    hero: existingContent.hero || s.hero || {
      autoplay: true,
      duration: 5200,
      showArrows: true,
      showDots: true,
    },
    // 7. Categories Carousel
    categories: existingContent.categories || s.categories || {
      heading: s.title || 'Shop By Categories',
      showAll: true,
      categorySlugs: [],
    },
    // 8. Watch & Shop Reels
    reels: existingContent.reels || s.reels || {
      heading: s.title || 'Watch & Shop',
      subtitle: s.subtitle || 'In motion',
      maxItems: 8,
    },
    // 9. Reviews / Testimonials
    reviews: existingContent.reviews || s.reviews || {
      heading: s.title || 'What Our Clients Say',
      tag: 'Reviews',
      subtitle: s.subtitle || 'Trusted by thousands of resellers and shopkeepers across Pakistan.',
      maxItems: 12,
    },
    // 10. Category Tabs
    category_tabs: existingContent.category_tabs || s.category_tabs || {
      heading: s.title || 'Category Tabs',
      defaultActive: 'storage',
      maxProducts: 8,
      tabs: [
        { key: 'storage', label: ['Storage &', 'Organization'], group: 'home' },
        { key: 'jewelry', label: ['Jewelry &', 'Accessories'], group: 'jewelry' },
        { key: 'bags', label: ['Fashion Bags &', 'Travel'], group: 'like' },
      ],
    },
  }

  const isVis = s.enabled !== false && s.isVisible !== false && s.is_visible !== false

  return {
    id,
    order,
    title,
    subtitle: String(s.subtitle || '').trim(),
    containerLayout,
    blockType,
    enabled: isVis,
    isVisible: isVis,
    is_visible: isVis,
    isPublished: s.isPublished !== false && s.is_published !== false,
    color,
    bg,
    category,
    group,
    viewAll,
    seeMore,
    content: {
      ...defaultContent,
      ...existingContent,
      group,
      category,
      color,
      bg,
      viewAll,
      seeMore,
    },
    responsiveSettings: s.responsiveSettings || {
      mobileStack: true,
      hideOnMobile: false,
    },
  }
}

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

        const groupVal = content.group || (row.group_name && !String(row.group_name).startsWith('custom-') ? row.group_name : null) || null
        const categoryVal = content.category || null
        const colorVal = content.color || '#00998f'
        const bgVal = content.bg !== undefined ? content.bg : ''
        const viewAllVal = content.viewAll !== undefined ? Boolean(content.viewAll) : false
        const seeMoreVal = content.seeMore !== undefined ? Boolean(content.seeMore) : false

        return normalizeSection({
          id: row.id,
          order: row.sort_order || idx + 1,
          title: row.title,
          subtitle: row.subtitle,
          containerLayout: row.container_layout,
          blockType: row.block_type,
          enabled: row.is_visible,
          isPublished: row.is_published,
          group: groupVal,
          category: categoryVal,
          color: colorVal,
          bg: bgVal,
          viewAll: viewAllVal,
          seeMore: seeMoreVal,
          content: {
            ...content,
            group: groupVal,
            category: categoryVal,
            color: colorVal,
            bg: bgVal,
            viewAll: viewAllVal,
            seeMore: seeMoreVal,
          },
          responsiveSettings,
        }, idx)
      })
    }
  } catch (err) {
    if (process.env.DATABASE_URL) {
      console.error('[HOMEPAGE SERVICE] PostgreSQL query failed:', err.message)
      throw new Error('Database query failed: Could not fetch sections from PostgreSQL: ' + err.message)
    }
    console.warn('[HOMEPAGE SERVICE] Postgres query fallback to db.json:', err.message)
  }

  // Fallback to db.json
  const raw = routerDb.get('sections').value() || []
  return raw
    .filter(s => s.enabled !== false && s.isVisible !== false && s.is_visible !== false && s.isPublished !== false)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map(normalizeSection)
}

export async function getAllSections(routerDb) {
  try {
    const res = await query(
      `SELECT * FROM sections ORDER BY sort_order ASC`
    )
    if (res && res.rows && res.rows.length > 0) {
      return res.rows.map((row, idx) => {
        let content = {}
        try { content = typeof row.content_json === 'string' ? JSON.parse(row.content_json) : (row.content_json || {}) } catch (_) {}
        let responsiveSettings = {}
        try { responsiveSettings = typeof row.responsive_settings_json === 'string' ? JSON.parse(row.responsive_settings_json) : (row.responsive_settings_json || {}) } catch (_) {}

        const groupVal = content.group || (row.group_name && !String(row.group_name).startsWith('custom-') ? row.group_name : null) || null
        const categoryVal = content.category || null
        const colorVal = content.color || '#00998f'
        const bgVal = content.bg !== undefined ? content.bg : ''
        const viewAllVal = content.viewAll !== undefined ? Boolean(content.viewAll) : false
        const seeMoreVal = content.seeMore !== undefined ? Boolean(content.seeMore) : false

        return normalizeSection({
          id: row.id,
          order: row.sort_order || idx + 1,
          title: row.title,
          subtitle: row.subtitle,
          containerLayout: row.container_layout,
          blockType: row.block_type,
          enabled: row.is_visible,
          isVisible: row.is_visible,
          is_visible: row.is_visible,
          isPublished: row.is_published,
          group: groupVal,
          category: categoryVal,
          color: colorVal,
          bg: bgVal,
          viewAll: viewAllVal,
          seeMore: seeMoreVal,
          content: {
            ...content,
            group: groupVal,
            category: categoryVal,
            color: colorVal,
            bg: bgVal,
            viewAll: viewAllVal,
            seeMore: seeMoreVal,
          },
          responsiveSettings,
        }, idx)
      })
    }
  } catch (err) {
    console.warn('[HOMEPAGE SERVICE] Postgres getAllSections fallback to db.json:', err.message)
  }

  // Fallback to db.json
  const raw = routerDb.get('sections').value() || []
  return raw
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map(normalizeSection)
}

export async function getDraftSections(routerDb) {
  // 1. Check PostgreSQL homepage_draft table first
  try {
    const res = await query('SELECT draft_json FROM homepage_draft WHERE id = 1')
    if (res && res.rows && res.rows.length > 0 && res.rows[0].draft_json) {
      const parsed = JSON.parse(res.rows[0].draft_json)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeSection)
      }
    }
  } catch (err) {
    console.warn('[HOMEPAGE SERVICE] Postgres draft read fallback:', err.message)
  }

  // 2. Check routerDb / db.json
  const draftList = routerDb.get('homepageDraftSections').value()
  if (Array.isArray(draftList) && draftList.length > 0) {
    return draftList.map(normalizeSection)
  }

  // 3. Otherwise fallback to all sections (preserving inactive/hidden states in the builder)
  return getAllSections(routerDb)
}

/**
 * Save draft sections without altering live storefront
 */
export async function saveDraftSections({ sections, staffUser, routerDb }) {
  if (!Array.isArray(sections)) {
    throw new Error('Sections must be an array')
  }

  const normalized = sections.map((s, idx) => normalizeSection(s, idx))

  // 1. Persist to PostgreSQL homepage_draft table
  try {
    await query(`
      INSERT INTO homepage_draft (id, draft_json, updated_at)
      VALUES (1, $1, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        draft_json = EXCLUDED.draft_json,
        updated_at = CURRENT_TIMESTAMP
    `, [JSON.stringify(normalized)])
  } catch (pgErr) {
    if (process.env.DATABASE_URL) {
      console.error('[HOMEPAGE SERVICE] PostgreSQL draft save failed:', pgErr.message)
      throw new Error('Database persistence failed: Could not save draft to PostgreSQL: ' + pgErr.message)
    }
    console.warn('[HOMEPAGE SERVICE] Postgres draft save fallback:', pgErr.message)
  }

  // 2. Persist draft in router.db and db.json
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
        const effectiveGroup = s.group || s.content?.group || `custom-${numId}`
        const fullContent = {
          ...(s.content || {}),
          group: s.group || null,
          category: s.category || null,
          color: s.color || '#00998f',
          bg: s.bg || '',
          viewAll: Boolean(s.viewAll),
          seeMore: Boolean(s.seeMore),
        }
        await client.query(
          `INSERT INTO sections (
             id, group_name, title, subtitle, sort_order,
             container_layout, block_type, content_json,
             responsive_settings_json, is_visible, is_published,
             has_unpublished_changes
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             group_name = EXCLUDED.group_name,
             title = EXCLUDED.title,
             sort_order = EXCLUDED.sort_order,
             container_layout = EXCLUDED.container_layout,
             block_type = EXCLUDED.block_type,
             content_json = EXCLUDED.content_json,
             is_visible = EXCLUDED.is_visible,
             is_published = EXCLUDED.is_published`,
          [
            numId,
            effectiveGroup,
            s.title,
            s.subtitle || '',
            s.order || i + 1,
            s.containerLayout,
            s.blockType,
            JSON.stringify(fullContent),
            JSON.stringify(s.responsiveSettings || {}),
            s.enabled !== false && s.isVisible !== false && s.is_visible !== false,
            true,
            false,
          ]
        )
      }

      // Also update draft in PostgreSQL to match newly published layout
      await client.query(
        `INSERT INTO homepage_draft (id, draft_json, updated_at)
         VALUES (1, $1, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           draft_json = EXCLUDED.draft_json,
           updated_at = CURRENT_TIMESTAMP`,
        [JSON.stringify(normalized)]
      )
    })
  } catch (pgErr) {
    if (process.env.DATABASE_URL) {
      console.error('[HOMEPAGE SERVICE] PostgreSQL publish transaction failed:', pgErr.message)
      throw new Error('Database publish failed: PostgreSQL transaction error: ' + pgErr.message)
    }
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
