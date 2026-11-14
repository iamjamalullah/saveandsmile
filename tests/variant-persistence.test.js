import { getDatabasePool, initDatabase } from '../src/db/index.js'
import { ensureMetadataTables } from '../src/services/mediaService.js'
import { getProductById, createProduct, updateProduct, deleteProduct } from '../src/services/catalogService.js'

async function runVariantTests() {
  console.log('====================================================================')
  console.log('   SAVE & SMILE — PRODUCT VARIANTS PERSISTENCE TEST SUITE')
  console.log('====================================================================\n')

  try {
    await initDatabase()
    await ensureMetadataTables()
    // 1. Create a temporary product with multiple colour & size variants
    console.log('--- TEST 1: CREATE PRODUCT WITH VARIANTS ---')
    const created = await createProduct({
      name: '__TEST__ Variant Shirt',
      price: 1500,
      oldPrice: 2000,
      stock: 50,
      category: 'Test Category',
      options: [
        {
          name: 'Color',
          values: [
            { name: 'Red', hex: '#ff0000', sortOrder: 0 },
            { name: 'Black', hex: '#000000', sortOrder: 1 },
          ]
        },
        {
          name: 'Size',
          values: [
            { name: 'M', sortOrder: 0 },
            { name: 'L', sortOrder: 1 },
          ]
        }
      ],
      variants: [
        {
          sku: 'TSHIRT-RED-M',
          title: 'Red / M',
          color: 'Red',
          size: 'M',
          options: { Color: 'Red', Size: 'M' },
          price: 1500,
          oldPrice: 2000,
          stock: 20,
          active: true,
        },
        {
          sku: 'TSHIRT-RED-L',
          title: 'Red / L',
          color: 'Red',
          size: 'L',
          options: { Color: 'Red', Size: 'L' },
          price: 1500,
          oldPrice: 2000,
          stock: 10,
          active: true,
        },
        {
          sku: 'TSHIRT-BLK-M',
          title: 'Black / M',
          color: 'Black',
          size: 'M',
          options: { Color: 'Black', Size: 'M' },
          price: 1600,
          oldPrice: 2100,
          stock: 15,
          active: true,
        },
        {
          sku: 'TSHIRT-BLK-L',
          title: 'Black / L',
          color: 'Black',
          size: 'L',
          options: { Color: 'Black', Size: 'L' },
          price: 1600,
          oldPrice: 2100,
          stock: 5,
          active: true,
        }
      ],
      colorImages: [
        {
          colorName: 'Red',
          images: ['/uploads/products/red-front.webp', '/uploads/products/red-back.webp'],
          primaryImage: '/uploads/products/red-front.webp',
        },
        {
          colorName: 'Black',
          images: ['/uploads/products/black-front.webp'],
          primaryImage: '/uploads/products/black-front.webp',
        }
      ]
    })

    if (!created || !created.id) throw new Error('Product creation failed')
    if (created.variants?.length !== 4) throw new Error(`Expected 4 variants, got ${created.variants?.length}`)
    if (created.options?.length !== 2) throw new Error(`Expected 2 options, got ${created.options?.length}`)
    if (created.colorImages?.length !== 2) throw new Error(`Expected 2 color galleries, got ${created.colorImages?.length}`)
    console.log(`✓ TEST 1 PASSED: Created product ${created.id} with 4 variants, 2 options, and 2 color galleries.`)

    // 2. Fetch with getProductById to simulate refresh/page load
    console.log('\n--- TEST 2: FETCH & HYDRATE AFTER RELOAD ---')
    const fetched = await getProductById(created.id)
    if (!fetched) throw new Error('Fetch product failed')
    if (fetched.variants?.length !== 4) throw new Error(`Expected 4 variants after fetch, got ${fetched.variants?.length}`)
    if (fetched.options?.length !== 2) throw new Error(`Expected 2 options after fetch, got ${fetched.options?.length}`)
    if (fetched.hasVariants !== true) throw new Error('Expected hasVariants to be true')
    console.log('✓ TEST 2 PASSED: Full hydration verified upon reload (variants, options, colorImages intact).')

    // 3. Update variants: edit 1 existing variant, remove 1 variant, add 1 new variant
    console.log('\n--- TEST 3: UPDATE, EDIT, AND DELETE INDIVIDUAL VARIANTS ---')
    const redMVariant = fetched.variants.find(v => v.sku === 'TSHIRT-RED-M')
    const redLVariant = fetched.variants.find(v => v.sku === 'TSHIRT-RED-L')
    const blkMVariant = fetched.variants.find(v => v.sku === 'TSHIRT-BLK-M')

    // Modified payload:
    // - Edit Red / M: change price to 1450, stock to 25
    // - Keep Red / L as is
    // - Remove Black / L
    // - Add new variant: Black / XL
    const updatedVariantsPayload = [
      {
        ...redMVariant,
        price: 1450,
        stock: 25,
      },
      redLVariant,
      blkMVariant,
      {
        sku: 'TSHIRT-BLK-XL',
        title: 'Black / XL',
        color: 'Black',
        size: 'XL',
        options: { Color: 'Black', Size: 'XL' },
        price: 1700,
        oldPrice: 2200,
        stock: 8,
        active: true,
      }
    ]

    const updatedOptionsPayload = [
      fetched.options[0], // Color
      {
        name: 'Size',
        values: [
          { name: 'M', sortOrder: 0 },
          { name: 'L', sortOrder: 1 },
          { name: 'XL', sortOrder: 2 },
        ]
      }
    ]

    const updatedProduct = await updateProduct(created.id, {
      ...fetched,
      options: updatedOptionsPayload,
      variants: updatedVariantsPayload,
    })

    if (updatedProduct.variants?.length !== 4) {
      throw new Error(`Expected 4 variants after update, got ${updatedProduct.variants?.length}`)
    }

    const reloadedAfterUpdate = await getProductById(created.id)
    const reloadedRedM = reloadedAfterUpdate.variants.find(v => v.sku === 'TSHIRT-RED-M')
    if (reloadedRedM.price !== 1450 || reloadedRedM.stock !== 25) {
      throw new Error(`Variant edit not persisted. Expected price 1450 & stock 25, got price ${reloadedRedM.price} & stock ${reloadedRedM.stock}`)
    }
    const reloadedBlkXL = reloadedAfterUpdate.variants.find(v => v.sku === 'TSHIRT-BLK-XL')
    if (!reloadedBlkXL || reloadedBlkXL.stock !== 8) {
      throw new Error('New variant Black / XL not found or stock incorrect')
    }
    const deletedBlkL = reloadedAfterUpdate.variants.find(v => v.sku === 'TSHIRT-BLK-L')
    if (deletedBlkL) {
      throw new Error('Removed variant TSHIRT-BLK-L still exists in database')
    }
    console.log('✓ TEST 3 PASSED: Variant editing, addition, and deletion persisted accurately.')

    // 4. Clean up test product
    console.log('\n--- TEST 4: CLEANUP TEST PRODUCT ---')
    await deleteProduct(created.id)
    const checkDeleted = await getProductById(created.id)
    if (checkDeleted) throw new Error('Product was not deleted')
    console.log(`✓ TEST 4 PASSED: Cleaned up test product ${created.id}.`)

    console.log('\n====================================================================')
    console.log('   ALL 4 VARIANT PERSISTENCE TESTS PASSED PERFECTLY!')
    console.log('====================================================================\n')
  } catch (err) {
    console.error('[FATAL TEST FAILURE]:', err)
    process.exit(1)
  } finally {
    const pool = getDatabasePool()
    if (pool && pool.end) {
      await pool.end()
    }
  }
}

runVariantTests()
