/**
 * SAVE & SMILE — Safe Homepage Cleanup Service
 * 
 * Replaces the dangerous SQL regex-based product ID cleanup with safe
 * structured JSON parsing. Based on actual inspection of the sections table:
 * 
 * Homepage sections use these content structures:
 * - products sections: { group, color, bg, viewAll, seeMore }
 * - hero sections: { hero: { slides: [...] } }
 * - banner sections: { banners: [...] }
 * - reels sections: { reels: { items: [{ productId, ... }] } }
 * - reviews sections: { reviews: { reviewIds: [...] } }
 * - category_tabs: { category_tabs: {...} }
 * 
 * Product references are found in:
 * - reels.items[].productId  (Watch & Shop videos linked to products)
 * - Potentially featured product ID lists in future sections
 * 
 * This service ONLY modifies confirmed product-reference fields.
 */

import { query } from '../db/index.js'

/**
 * Remove references to a deleted product ID from all homepage sections.
 * Uses structured JSON parsing — never regex on raw SQL strings.
 * 
 * @param {number|string} productId - The product ID to remove
 * @returns {Promise<{updatedSections: number, skippedSections: number, errors: string[]}>}
 */
export async function removeProductFromHomepage(productId) {
  const pid = Number(productId)
  if (isNaN(pid)) {
    console.warn('[HOMEPAGE CLEANUP] Invalid product ID:', productId)
    return { updatedSections: 0, skippedSections: 0, errors: ['Invalid product ID'] }
  }

  const res = await query('SELECT id, content_json, block_type FROM sections WHERE content_json IS NOT NULL')
  
  let updatedCount = 0
  let skippedCount = 0
  const errors = []

  for (const row of res.rows) {
    const { id, content_json, block_type } = row
    
    let jsonObj
    try {
      jsonObj = typeof content_json === 'object' ? content_json : JSON.parse(content_json)
    } catch (e) {
      console.warn(`[HOMEPAGE CLEANUP] Section ${id} has malformed JSON — skipping.`)
      skippedCount++
      errors.push(`Section ${id}: malformed JSON`)
      continue
    }

    let changed = false

    // 1. Reels/Watch&Shop: Remove product references from video items
    if (jsonObj.reels && Array.isArray(jsonObj.reels.items)) {
      const beforeLen = jsonObj.reels.items.length
      // Don't remove the video item entirely — just null out the product link
      jsonObj.reels.items = jsonObj.reels.items.map(item => {
        if (item && Number(item.productId) === pid) {
          return { ...item, productId: null }
        }
        return item
      })
      const nulled = jsonObj.reels.items.filter(i => i && i.productId === null).length
      if (nulled > 0) changed = true
    }

    // 2. Featured product ID arrays (if any section stores them)
    const productArrayKeys = ['productIds', 'featuredProductIds']
    for (const key of productArrayKeys) {
      if (Array.isArray(jsonObj[key])) {
        const before = jsonObj[key].length
        jsonObj[key] = jsonObj[key].filter(id => Number(id) !== pid)
        if (jsonObj[key].length !== before) changed = true
      }
    }

    // 3. Category tabs with product references
    if (jsonObj.category_tabs && Array.isArray(jsonObj.category_tabs.tabs)) {
      for (const tab of jsonObj.category_tabs.tabs) {
        if (Array.isArray(tab.productIds)) {
          const before = tab.productIds.length
          tab.productIds = tab.productIds.filter(id => Number(id) !== pid)
          if (tab.productIds.length !== before) changed = true
        }
      }
    }

    // IMPORTANT: Do NOT modify:
    // - group names (they are strings like "new", "hot", etc.)
    // - color values, bg URLs
    // - sort_order, viewAll, seeMore booleans
    // - banner image arrays
    // - hero slide configurations
    // - review IDs (they reference reviews, not products)

    if (changed) {
      try {
        const updatedJson = JSON.stringify(jsonObj)
        await query('UPDATE sections SET content_json = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [updatedJson, id])
        updatedCount++
        console.log(`[HOMEPAGE CLEANUP] Section ${id} updated — removed product ${pid} reference`)
      } catch (updateErr) {
        console.error(`[HOMEPAGE CLEANUP] Failed to update section ${id}:`, updateErr.message)
        errors.push(`Section ${id}: update failed — ${updateErr.message}`)
      }
    }
  }

  return { updatedSections: updatedCount, skippedSections: skippedCount, errors }
}

/**
 * Safe entry point for product deletion workflow.
 * Called by catalogService.deleteProduct after DB deletion succeeds.
 */
export async function handleProductDeletion(productId) {
  try {
    const result = await removeProductFromHomepage(productId)
    console.log(
      `[HOMEPAGE CLEANUP] Product ${productId}: ${result.updatedSections} sections updated, ` +
      `${result.skippedSections} skipped, ${result.errors.length} errors`
    )
    return result
  } catch (e) {
    // Cleanup failures must not block product deletion
    console.error('[HOMEPAGE CLEANUP ERROR]:', e.message)
    return { updatedSections: 0, skippedSections: 0, errors: [e.message] }
  }
}
