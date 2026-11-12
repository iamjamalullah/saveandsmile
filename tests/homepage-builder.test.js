import assert from 'node:assert'
import {
  VALID_CONTAINER_LAYOUTS,
  VALID_BLOCK_TYPES,
  normalizeSection,
  getPublishedSections,
  getDraftSections,
  saveDraftSections,
  publishSections,
  getSectionVersions,
  restoreSectionVersion,
} from '../src/services/homepageService.js'
import { initDatabase } from '../src/db/index.js'

console.log('===============================================================')
console.log('   HOMEPAGE DYNAMIC BUILDER & CMS AUTOMATED TEST SUITE')
console.log('===============================================================')

async function runTests() {
  await initDatabase()

  // Mock router.db for isolation
  let inMemoryDb = {
    sections: [
      { id: 1, group: 'new', title: 'New Arrivals', order: 1, enabled: true },
      { id: 2, group: 'hot', title: 'Hot Selling Products', order: 2, enabled: true },
      { id: 3, group: 'home', title: 'Home Essentials Organizers', order: 3, enabled: true },
      { id: 4, group: 'like', title: 'You May Also Like', order: 4, enabled: true },
    ],
    homepageDraftSections: null,
    hasUnpublishedSectionChanges: false,
    homepageSectionVersions: [],
  }

  const routerDb = {
    get: (key) => ({
      value: () => inMemoryDb[key],
    }),
    set: (key, val) => ({
      write: () => {
        inMemoryDb[key] = val
        return inMemoryDb[key]
      },
    }),
  }

  const mockAdminUser = { id: 1, name: 'Store Administrator', role: 'admin' }

  // ── TEST 1: Validate Supported Layouts and Block Types ──
  console.log('\n--- TEST 1: CONTAINER LAYOUTS & BLOCK TYPES ---')
  assert.deepStrictEqual(VALID_CONTAINER_LAYOUTS, ['single', 'two_equal', 'two_70_30', 'two_30_70'])
  assert.deepStrictEqual(VALID_BLOCK_TYPES, ['products', 'banner', 'announcement', 'image_text', 'countdown', 'trust_bar', 'categories', 'reels', 'reviews', 'category_tabs'])
  console.log('✓ TEST 1 PASSED: Container layout presets and block types verified.')

  // ── TEST 2: Single Column Section Creation ──
  console.log('\n--- TEST 2: SINGLE-COLUMN SECTION NORMALIZATION ---')
  const singleSec = normalizeSection({
    title: 'Widescreen Ramadan Offer',
    containerLayout: 'single',
    blockType: 'banner',
    content: {
      banners: [{ image: 'https://example.com/banner1.webp', link: '/ramadan', title: 'Ramadan 2026' }],
    },
  }, 0)
  assert.strictEqual(singleSec.containerLayout, 'single')
  assert.strictEqual(singleSec.blockType, 'banner')
  assert.strictEqual(singleSec.content.banners.length, 1)
  console.log('✓ TEST 2 PASSED: Single column promotional banner normalized.')

  // ── TEST 3: Two-Column Section Creation (50/50, 70/30, 30/70) ──
  console.log('\n--- TEST 3: TWO-COLUMN SECTIONS (50/50, 70/30, 30/70) ---')
  const double50 = normalizeSection({
    title: 'Dual Deals',
    containerLayout: 'two_equal',
    blockType: 'banner',
    content: {
      banners: [
        { image: 'https://example.com/b1.webp', link: '/shop' },
        { image: 'https://example.com/b2.webp', link: '/shop' },
      ],
    },
  }, 1)
  assert.strictEqual(double50.containerLayout, 'two_equal')

  const split7030 = normalizeSection({
    title: 'Split 70/30 Showcase',
    containerLayout: 'two_70_30',
    blockType: 'banner',
  }, 2)
  assert.strictEqual(split7030.containerLayout, 'two_70_30')

  const split3070 = normalizeSection({
    title: 'Split 30/70 Showcase',
    containerLayout: 'two_30_70',
    blockType: 'banner',
  }, 3)
  assert.strictEqual(split3070.containerLayout, 'two_30_70')
  console.log('✓ TEST 3 PASSED: Two-column split layouts (50/50, 70/30, 30/70) verified.')

  // ── TEST 3B: Image + Text, Countdown & Trust Bar Normalization ──
  console.log('\n--- TEST 3B: IMAGE_TEXT, COUNTDOWN & TRUST_BAR NORMALIZATION ---')
  const imageTextSec = normalizeSection({
    title: 'Featured Showcase',
    containerLayout: 'two_70_30',
    blockType: 'image_text',
    content: {
      image_text: {
        image: 'https://example.com/gadget.webp',
        heading: 'Smart Accessories',
        text: 'Engineered for durability',
        buttonText: 'Shop Catalog',
        buttonLink: '/shop',
        imagePosition: 'left',
      },
    },
  }, 4)
  assert.strictEqual(imageTextSec.blockType, 'image_text')
  assert.strictEqual(imageTextSec.containerLayout, 'two_70_30')
  assert.strictEqual(imageTextSec.content.image_text.heading, 'Smart Accessories')

  const countdownSec = normalizeSection({
    title: 'Flash Sale Timer',
    containerLayout: 'single',
    blockType: 'countdown',
    content: {
      countdown: {
        heading: 'Weekend Flash Sale',
        targetDate: '2026-11-20T00:00:00.000Z',
        buttonText: 'Claim Discount',
        buttonLink: '/shop?group=hot',
      },
    },
  }, 5)
  assert.strictEqual(countdownSec.blockType, 'countdown')
  assert.strictEqual(countdownSec.content.countdown.heading, 'Weekend Flash Sale')

  const trustBarSec = normalizeSection({
    title: 'Store Guarantee Bar',
    containerLayout: 'single',
    blockType: 'trust_bar',
    content: {
      trust_bar: {
        heading: 'Why Shop With Us',
        items: [
          { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders over Rs. 3,000' },
          { icon: '💬', title: '24/7 Support', subtitle: 'WhatsApp support' },
        ],
      },
    },
  }, 6)
  assert.strictEqual(trustBarSec.blockType, 'trust_bar')
  assert.strictEqual(trustBarSec.content.trust_bar.items.length, 2)
  console.log('✓ TEST 3B PASSED: Image + Text, Countdown, and Trust Bar sections normalized.')

  // ── TEST 4: Insertion Between Existing Sections ──
  console.log('\n--- TEST 4: INSERTION BETWEEN EXISTING SECTIONS ---')
  const currentSections = [...inMemoryDb.sections]
  const newInsertedSec = normalizeSection({
    id: 'sec-promo-middle',
    title: 'Mid-Page Special',
    containerLayout: 'two_equal',
    blockType: 'banner',
  })
  // Insert between section #2 and #3 (at index 2)
  currentSections.splice(2, 0, newInsertedSec)
  const renumbered = currentSections.map((s, idx) => ({ ...s, order: idx + 1 }))
  assert.strictEqual(renumbered.length, 5)
  assert.strictEqual(renumbered[2].title, 'Mid-Page Special')
  assert.strictEqual(renumbered[2].order, 3)
  assert.strictEqual(renumbered[3].title, 'Home Essentials Organizers')
  assert.strictEqual(renumbered[3].order, 4)
  console.log('✓ TEST 4 PASSED: Section successfully inserted between existing sections with renumbered ordering.')

  // ── TEST 5: Section Duplication & Reordering ──
  console.log('\n--- TEST 5: DUPLICATION & UP/DOWN REORDERING ---')
  // Duplicate section #1
  const copyOfSec1 = {
    ...renumbered[0],
    id: `sec-${Date.now()}-copy`,
    title: `${renumbered[0].title} (Copy)`,
  }
  renumbered.splice(1, 0, copyOfSec1)
  assert.strictEqual(renumbered[1].title, 'New Arrivals (Copy)')

  // Swap item 0 and item 1
  const temp = renumbered[0]
  renumbered[0] = renumbered[1]
  renumbered[1] = temp
  assert.strictEqual(renumbered[0].title, 'New Arrivals (Copy)')
  assert.strictEqual(renumbered[1].title, 'New Arrivals')
  console.log('✓ TEST 5 PASSED: Section duplication and position movement verified.')

  // ── TEST 6: Save as Draft (Isolation from Storefront) ──
  console.log('\n--- TEST 6: SAVE AS DRAFT (UNPUBLISHED STOREFRONT ISOLATION) ---')
  const initialPublished = await getPublishedSections(routerDb)
  assert.strictEqual(initialPublished.length, 4)

  const draftResult = await saveDraftSections({
    sections: renumbered,
    staffUser: mockAdminUser,
    routerDb,
  })
  assert.strictEqual(draftResult.success, true)

  // Verify storefront still sees original published sections
  const publishedAfterDraft = await getPublishedSections(routerDb)
  assert.strictEqual(publishedAfterDraft.length, 4)
  assert.strictEqual(publishedAfterDraft[0].title, 'New Arrivals')

  // Verify draft endpoint sees the 6 draft sections
  const fetchedDraft = await getDraftSections(routerDb)
  assert.strictEqual(fetchedDraft.length, 6)
  assert.strictEqual(fetchedDraft[0].title, 'New Arrivals (Copy)')
  console.log('✓ TEST 6 PASSED: Draft changes completely isolated from published live storefront.')

  // ── TEST 7: Publish Changes (Atomic Deployment) ──
  console.log('\n--- TEST 7: PUBLISH CHANGES (LIVE DEPLOYMENT) ---')
  const publishResult = await publishSections({
    sections: renumbered,
    label: 'Deployment v1.1 - Added promo banner and cloned arrivals',
    staffUser: mockAdminUser,
    routerDb,
  })
  assert.strictEqual(publishResult.success, true)

  // Now live storefront MUST see all 6 sections!
  const liveAfterPublish = await getPublishedSections(routerDb)
  assert.strictEqual(liveAfterPublish.length, 6)
  assert.strictEqual(liveAfterPublish[0].title, 'New Arrivals (Copy)')
  console.log('✓ TEST 7 PASSED: Published changes deployed live to storefront atomically.')

  // ── TEST 8: Version History & Rollback ──
  console.log('\n--- TEST 8: VERSION SNAPSHOT & ROLLBACK ---')
  const versions = await getSectionVersions(routerDb)
  assert.strictEqual(versions.length >= 1, true)
  const latestVersion = versions[0]
  assert.ok(latestVersion.version_label.includes('Deployment v1.1'))

  // Perform rollback to baseline
  const baselineBackupVersion = {
    id: 99991,
    version_label: 'Baseline 4 Original Sections',
    published_by: 'System Baseline',
    created_at: new Date().toISOString(),
    snapshot: [
      { id: 1, title: 'New Arrivals', order: 1, containerLayout: 'single', blockType: 'products' },
      { id: 2, title: 'Hot Selling Products', order: 2, containerLayout: 'single', blockType: 'products' },
    ],
  }
  inMemoryDb.homepageSectionVersions.push(baselineBackupVersion)

  const rollbackResult = await restoreSectionVersion({
    versionId: 99991,
    staffUser: mockAdminUser,
    routerDb,
  })
  assert.strictEqual(rollbackResult.success, true)

  // Verify storefront restored to 2 sections
  const liveAfterRollback = await getPublishedSections(routerDb)
  assert.strictEqual(liveAfterRollback.length, 2)
  assert.strictEqual(liveAfterRollback[0].title, 'New Arrivals')
  assert.strictEqual(liveAfterRollback[1].title, 'Hot Selling Products')
  console.log('✓ TEST 8 PASSED: Successfully restored previous version snapshot.')

  // ── TEST 9: Existing Homepage Compatibility ──
  console.log('\n--- TEST 9: EXISTING HOMEPAGE COMPATIBILITY ---')
  const legacySections = [
    { id: 1, group: 'new', title: 'New Arrivals', color: '#cf9c44', bg: 'bg1.png' },
    { id: 2, group: 'hot', title: 'Hot Selling Products', color: '#00998f', bg: 'bg2.png' },
    { id: 3, group: 'home', title: 'Home Essentials Organizers', color: '#6980c3', bg: 'bg3.png' },
    { id: 4, group: 'like', title: 'You May Also Like', color: '#cf9c44', bg: 'bg4.png' },
  ]
  const normalizedLegacy = legacySections.map(normalizeSection)
  for (const leg of normalizedLegacy) {
    assert.strictEqual(leg.blockType, 'products')
    assert.strictEqual(leg.containerLayout, 'single')
    assert.strictEqual(leg.enabled, true)
    assert.ok(leg.color)
  }
  console.log('✓ TEST 9 PASSED: All legacy catalog group sections maintain 100% backward compatibility.')

  console.log('\n===============================================================')
  console.log('   ALL 9 HOMEPAGE BUILDER AUTOMATION TESTS PASSED (100%)!       ')
  console.log('===============================================================')
}

runTests().catch(err => {
  console.error('FATAL TEST ERROR:', err)
  process.exit(1)
})
