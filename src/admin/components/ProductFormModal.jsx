import { useState, useEffect } from 'react'
import { useStoreData } from '../../context/StoreDataContext'
import { convertFileToWebp, uploadWebpImages } from '../../utils/imageUpload'

const PRESET_OPTION_NAMES = ['Color', 'Size', 'Storage', 'Material', 'Capacity', 'Style', 'Model']

const PRESET_COLORS = [
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Silver', hex: '#94a3b8' },
  { name: 'Space Gray', hex: '#4b5563' },
  { name: 'Gold', hex: '#d97706' },
  { name: 'Rose Gold', hex: '#f43f5e' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Orange', hex: '#ea580c' },
]

const PRESET_SIZES = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  shoes: ['38', '39', '40', '41', '42', '43', '44', '45'],
  gadgets: ['Small', 'Medium', 'Large', 'Standard', 'Pro', 'Ultra'],
  storage: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
}

// Cartesian product generator for any number of options
function cartesianProduct(arrays) {
  if (!arrays.length) return []
  return arrays.reduce((acc, curr) => acc.flatMap(c => curr.map(n => [...c, n])), [[]])
}

export default function ProductFormModal({ product, isOpen, onClose }) {
  const { categories, addProduct, updateProduct, storeSettings } = useStoreData()

  const [form, setForm] = useState({
    name: '',
    category: 'Storage & Organization',
    group: 'new',
    price: '',
    oldPrice: '',
    stock: 20,
    sku: '',
    image: '',
    images: '',
    video: '',
    description: '',
    featured: false,
  })

  // Dynamic Shopify-style Options:
  // Array of { id, name, values: [{ id, name, hex }] }
  const [options, setOptions] = useState([])
  const [newOptionName, setNewOptionName] = useState('')
  const [showAddOptionInput, setShowAddOptionInput] = useState(false)
  const [newValueInputs, setNewValueInputs] = useState({}) // { [optionId]: { name: '', hex: '#111827' } }

  // Individual Color Galleries:
  // Array of { colorName, hex, images: string[], primaryImage: string }
  const [colorGalleries, setColorGalleries] = useState([])

  // Purchasable Variants Matrix:
  // Array of { id, title, sku, price, oldPrice, stock, active, barcode, options: { [optName]: optVal } }
  const [variantsList, setVariantsList] = useState([])

  // Bulk edit states
  const [bulkPriceInput, setBulkPriceInput] = useState('')
  const [bulkStockInput, setBulkStockInput] = useState('')

  // Gallery & Upload State
  const [galleryList, setGalleryList] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [showManualUrl, setShowManualUrl] = useState(false)
  const [manualUrlInput, setManualUrlInput] = useState('')
  const [errors, setErrors] = useState({})
  const [showImagePicker, setShowImagePicker] = useState(false)

  // Populate form when editing or resetting
  useEffect(() => {
    if (product) {
      const existingImages = [...new Set([product.image, ...(product.images || [])].filter(Boolean))]
      setGalleryList(existingImages)
      setForm({
        name: product.name || '',
        category: product.category || 'Storage & Organization',
        group: product.group || 'new',
        price: product.price || '',
        oldPrice: product.oldPrice || '',
        stock: product.stock !== undefined ? product.stock : 20,
        sku: product.sku || `GS-${product.id}`,
        image: product.image || existingImages[0] || '',
        images: existingImages.join('\n'),
        video: product.video || '',
        description: product.description || '',
        featured: Boolean(product.featured),
      })

      // 1. Hydrate Dynamic Options
      let loadedOptions = []
      if (product.options && Array.isArray(product.options) && product.options.length > 0) {
        loadedOptions = product.options.map((opt, optIdx) => ({
          id: opt.id || `opt-${optIdx + 1}`,
          name: opt.name || 'Option',
          values: (opt.values || []).map((v, vIdx) => {
            if (typeof v === 'string') {
              const matchedPreset = PRESET_COLORS.find(c => c.name.toLowerCase() === v.toLowerCase())
              return { id: `val-${optIdx}-${vIdx}`, name: v, hex: matchedPreset?.hex || '' }
            }
            return {
              id: v.id || `val-${optIdx}-${vIdx}`,
              name: v.name || String(v),
              hex: v.hex || '',
            }
          })
        }))
      }
      setOptions(loadedOptions)

      // 2. Hydrate Individual Color Galleries
      let loadedGalleries = []
      if (product.colorImages && Array.isArray(product.colorImages) && product.colorImages.length > 0) {
        loadedGalleries = product.colorImages.map(ci => ({
          colorName: ci.color || ci.colorName,
          hex: ci.hex || '',
          images: ci.images || [],
          primaryImage: ci.primaryImage || ci.images?.[0] || '',
        }))
      } else {
        // Find if color option exists
        const colorOpt = loadedOptions.find(o => o.name.toLowerCase() === 'color')
        if (colorOpt) {
          loadedGalleries = colorOpt.values.map(v => ({
            colorName: v.name,
            hex: v.hex || '',
            images: [],
            primaryImage: '',
          }))
        }
      }
      setColorGalleries(loadedGalleries)

      // 3. Hydrate Variants List
      if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        setVariantsList(product.variants.map((v, idx) => ({
          id: v.id || idx + 1,
          title: v.title || `Variant ${idx + 1}`,
          sku: v.sku || `${product.sku || 'GS'}-${idx + 1}`,
          price: v.price !== undefined ? v.price : (product.price || 0),
          oldPrice: v.oldPrice !== undefined ? v.oldPrice : (product.oldPrice || product.price || 0),
          stock: v.stock !== undefined ? v.stock : 10,
          active: v.active !== false,
          barcode: v.barcode || '',
          color: v.color || v.options?.Color || '',
          size: v.size || v.options?.Size || '',
          options: v.options || {
            ...(v.color ? { Color: v.color } : {}),
            ...(v.size ? { Size: v.size } : {}),
          },
        })))
      } else {
        setVariantsList([])
      }
    } else {
      setGalleryList([])
      setForm({
        name: '',
        category: categories[0]?.name || 'Storage & Organization',
        group: 'new',
        price: '',
        oldPrice: '',
        stock: 20,
        sku: `GS-${Math.floor(1000 + Math.random() * 9000)}`,
        image: '',
        images: '',
        video: '',
        description: '',
        featured: false,
      })
      setOptions([])
      setColorGalleries([])
      setVariantsList([])
    }
    setErrors({})
    setUploading(false)
    setUploadMsg('')
  }, [product, isOpen, categories])

  if (!isOpen) return null

  // Calculate live discount percentage
  const numPrice = Number(form.price) || 0
  const numOldPrice = Number(form.oldPrice) || 0
  const discount = numOldPrice > numPrice ? Math.round(((numOldPrice - numPrice) / numOldPrice) * 100) : 0

  // File Upload & WebP Conversion Handler for Main Product
  const handleFiles = async (files) => {
    if (!files || !files.length) return
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!fileArray.length) {
      setErrors(prev => ({ ...prev, upload: 'Please select valid image files (JPG, PNG, WebP, etc.).' }))
      return
    }

    try {
      setUploading(true)
      setErrors(prev => ({ ...prev, upload: '', image: '' }))

      const webpList = []
      for (let i = 0; i < fileArray.length; i++) {
        setUploadMsg(`Converting ${i + 1} of ${fileArray.length} to WebP format...`)
        const webp = await convertFileToWebp(fileArray[i], 1600, 0.85)
        webpList.push(webp)
      }

      setUploadMsg(`Uploading ${webpList.length} WebP image(s) to server...`)
      const uploadedUrls = await uploadWebpImages(webpList)

      setGalleryList(prev => {
        const nextList = [...new Set([...prev, ...uploadedUrls])]
        setForm(f => {
          if (!f.image || f.image === '/images/p1.jpg') {
            return { ...f, image: uploadedUrls[0] }
          }
          return f
        })
        return nextList
      })

      setUploadMsg('')
    } catch (err) {
      console.error('Upload failed:', err)
      setErrors(prev => ({ ...prev, upload: err.message || 'Image upload failed. Please try again.' }))
    } finally {
      setUploading(false)
      setUploadMsg('')
    }
  }

  // Upload handler for Color-specific images
  const handleColorImagesUpload = async (colorName, files) => {
    if (!files || !files.length) return
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!fileArray.length) return

    try {
      setUploading(true)
      setUploadMsg(`Converting ${fileArray.length} image(s) for ${colorName}...`)

      const webpList = []
      for (let i = 0; i < fileArray.length; i++) {
        const webp = await convertFileToWebp(fileArray[i], 1600, 0.85)
        webpList.push(webp)
      }

      setUploadMsg(`Uploading WebP images to server...`)
      const uploadedUrls = await uploadWebpImages(webpList)

      setColorGalleries(prev => {
        const existingIdx = prev.findIndex(cg => cg.colorName.toLowerCase() === colorName.toLowerCase())
        if (existingIdx >= 0) {
          const copy = [...prev]
          const existing = copy[existingIdx]
          const nextImgs = [...new Set([...(existing.images || []), ...uploadedUrls])]
          copy[existingIdx] = {
            ...existing,
            images: nextImgs,
            primaryImage: existing.primaryImage || nextImgs[0] || '',
          }
          return copy
        } else {
          return [
            ...prev,
            {
              colorName,
              hex: PRESET_COLORS.find(c => c.name.toLowerCase() === colorName.toLowerCase())?.hex || '',
              images: uploadedUrls,
              primaryImage: uploadedUrls[0] || '',
            }
          ]
        }
      })
    } catch (err) {
      console.error('Color image upload failed:', err)
      alert(`Failed to upload color images: ${err.message}`)
    } finally {
      setUploading(false)
      setUploadMsg('')
    }
  }

  // ── DYNAMIC OPTION MANAGEMENT ─────────────────────────────────────
  const addOption = (name) => {
    const trimmed = (name || newOptionName).trim()
    if (!trimmed) return
    if (options.some(o => o.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Option "${trimmed}" already exists.`)
      return
    }

    const newOpt = {
      id: `opt-${Date.now()}`,
      name: trimmed,
      values: []
    }
    const updatedOptions = [...options, newOpt]
    setOptions(updatedOptions)
    setNewOptionName('')
    setShowAddOptionInput(false)
  }

  const removeOption = (optId) => {
    const target = options.find(o => o.id === optId)
    if (!window.confirm(`Delete option "${target?.name}" and all its values?`)) return
    const updated = options.filter(o => o.id !== optId)
    setOptions(updated)

    // If removing Color option, clean color galleries
    if (target?.name.toLowerCase() === 'color') {
      setColorGalleries([])
    }
    regenerateCombinations(updated)
  }

  const addOptionValue = (optId, valName, valHex = '') => {
    const trimmed = (valName || newValueInputs[optId]?.name || '').trim()
    const hex = valHex || newValueInputs[optId]?.hex || ''
    if (!trimmed) return

    setOptions(prev => {
      const copy = prev.map(o => {
        if (o.id !== optId) return o
        if (o.values.some(v => v.name.toLowerCase() === trimmed.toLowerCase())) {
          return o
        }
        return {
          ...o,
          values: [...o.values, { id: `val-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: trimmed, hex }]
        }
      })

      // Sync color galleries if option is Color
      const opt = prev.find(o => o.id === optId)
      if (opt && opt.name.toLowerCase() === 'color') {
        setColorGalleries(cgPrev => {
          if (!cgPrev.some(cg => cg.colorName.toLowerCase() === trimmed.toLowerCase())) {
            return [...cgPrev, { colorName: trimmed, hex, images: [], primaryImage: '' }]
          }
          return cgPrev
        })
      }

      return copy
    })

    setNewValueInputs(prev => ({
      ...prev,
      [optId]: { name: '', hex: '#111827' }
    }))
  }

  const removeOptionValue = (optId, valId) => {
    setOptions(prev => {
      const copy = prev.map(o => {
        if (o.id !== optId) return o
        const removed = o.values.find(v => v.id === valId)
        if (o.name.toLowerCase() === 'color' && removed) {
          setColorGalleries(cgPrev => cgPrev.filter(cg => cg.colorName.toLowerCase() !== removed.name.toLowerCase()))
        }
        return {
          ...o,
          values: o.values.filter(v => v.id !== valId)
        }
      })
      return copy
    })
  }

  // ── VARIANT COMBINATIONS GENERATOR ─────────────────────────────────
  // Generates Cartesian product while PRESERVING existing configured variant records!
  const regenerateCombinations = (currentOptions = options) => {
    const activeOptions = currentOptions.filter(o => o.values.length > 0)
    if (!activeOptions.length) {
      setVariantsList([])
      return
    }

    const baseSku = form.sku || `GS-${Date.now().toString().slice(-4)}`
    const basePrice = Number(form.price) || 0
    const baseOldPrice = Number(form.oldPrice) || basePrice

    // Build map of existing variants by composite option signature
    const existingMap = new Map()
    variantsList.forEach(v => {
      const sig = Object.entries(v.options || {})
        .sort(([k1], [k2]) => k1.localeCompare(k2))
        .map(([k, val]) => `${k.toLowerCase()}:${val.toLowerCase()}`)
        .join('|')
      if (sig) existingMap.set(sig, v)
    })

    // Cartesian product of option value objects
    const optionValuesArrays = activeOptions.map(opt =>
      opt.values.map(val => ({ optionName: opt.name, valueName: val.name, hex: val.hex }))
    )
    const combinations = cartesianProduct(optionValuesArrays)

    const nextVariants = combinations.map((combo, idx) => {
      const optMap = {}
      combo.forEach(c => {
        optMap[c.optionName] = c.valueName
      })

      const sig = Object.entries(optMap)
        .sort(([k1], [k2]) => k1.localeCompare(k2))
        .map(([k, val]) => `${k.toLowerCase()}:${val.toLowerCase()}`)
        .join('|')

      const existing = existingMap.get(sig)
      const title = combo.map(c => c.valueName).join(' / ')
      const skuSuffix = combo.map(c => c.valueName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '')).join('-')

      if (existing) {
        return {
          ...existing,
          title,
          options: optMap,
          color: optMap.Color || '',
          size: optMap.Size || '',
        }
      }

      return {
        id: idx + 1,
        title,
        sku: `${baseSku}-${skuSuffix}`,
        price: basePrice,
        oldPrice: baseOldPrice,
        stock: 10,
        active: true,
        barcode: '',
        color: optMap.Color || '',
        size: optMap.Size || '',
        options: optMap,
      }
    })

    setVariantsList(nextVariants)
  }

  // Matrix field update
  const handleVariantFieldChange = (idx, field, value) => {
    setVariantsList(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  // Bulk actions
  const applyBulkPrice = () => {
    const p = Number(bulkPriceInput)
    if (isNaN(p) || p < 0) return
    setVariantsList(prev => prev.map(v => ({ ...v, price: p })))
    setBulkPriceInput('')
  }

  const applyBulkStock = () => {
    const s = Number(bulkStockInput)
    if (isNaN(s) || s < 0) return
    setVariantsList(prev => prev.map(v => ({ ...v, stock: s })))
    setBulkStockInput('')
  }

  const toggleAllVariantsActive = (status) => {
    setVariantsList(prev => prev.map(v => ({ ...v, active: status })))
  }

  // Image helpers
  const setAsFrontImage = (imgUrl) => {
    setForm(prev => ({ ...prev, image: imgUrl }))
  }

  const removeImage = (imgUrl) => {
    setGalleryList(prev => {
      const filtered = prev.filter(item => item !== imgUrl)
      if (form.image === imgUrl) {
        setForm(f => ({ ...f, image: filtered[0] || '' }))
      }
      return filtered
    })
  }

  const handleAddManualUrl = () => {
    const trimmed = manualUrlInput.trim()
    if (!trimmed) return
    setGalleryList(prev => {
      const nextList = [...new Set([...prev, trimmed])]
      if (!form.image) {
        setForm(f => ({ ...f, image: trimmed }))
      }
      return nextList
    })
    setManualUrlInput('')
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Product name is required'
    if (!form.price || Number(form.price) <= 0) errs.price = 'Valid price is required'
    const frontImg = form.image || galleryList[0]
    if (!frontImg) errs.image = 'At least one product photo is required'

    if (options.length > 0) {
      const emptyOpt = options.find(o => o.values.length === 0)
      if (emptyOpt) {
        errs.variants = `Option "${emptyOpt.name}" has no values. Please add at least one value or remove the option.`
      }
      if (variantsList.length === 0) {
        errs.variants = 'Please click "Generate Combinations" to create variant rows.'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const frontImage = form.image || galleryList[0] || '/images/p1.jpg'
    const allImages = [...new Set([frontImage, ...galleryList].filter(Boolean))]

    const hasVars = options.length > 0 && variantsList.length > 0
    const totalVariantStock = hasVars
      ? variantsList.reduce((sum, v) => sum + (v.active ? Number(v.stock) || 0 : 0), 0)
      : Number(form.stock) || 0

    // Determine variantConfig
    const hasColor = options.some(o => o.name.toLowerCase() === 'color')
    const hasSize = options.some(o => o.name.toLowerCase() === 'size')
    const variantConfig = !hasVars ? 'none' : (hasColor && hasSize ? 'both' : (hasColor ? 'color' : (hasSize ? 'size' : 'custom')))

    // Format formattedVariants
    const formattedVariants = hasVars ? variantsList.map((v, i) => ({
      id: v.id || i + 1,
      sku: v.sku?.trim() || `${form.sku || 'GS'}-${i + 1}`,
      title: v.title || `Variant ${i + 1}`,
      color: v.color || v.options?.Color || '',
      size: v.size || v.options?.Size || '',
      options: v.options || {},
      price: Number(v.price) >= 0 ? Number(v.price) : Number(form.price),
      oldPrice: Number(v.oldPrice) >= 0 ? Number(v.oldPrice) : (Number(form.oldPrice) || Number(form.price)),
      stock: Number(v.stock) || 0,
      active: v.active !== false,
      barcode: v.barcode || '',
    })) : []

    const payload = {
      ...form,
      image: frontImage,
      images: allImages,
      price: Number(form.price),
      oldPrice: Number(form.oldPrice) || Number(form.price),
      stock: totalVariantStock,
      video: form.video.trim(),
      hasVariants: hasVars,
      variantConfig,
      options: hasVars ? options : [],
      variants: formattedVariants,
      colorImages: hasVars ? colorGalleries : [],
    }

    if (product) updateProduct(product.id, payload)
    else addProduct(payload)
    onClose()
  }

  const availableImages = Array.from({ length: 36 }, (_, i) => `/images/p${i + 1}.jpg`)
  const colorOption = options.find(o => o.name.toLowerCase() === 'color')

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: 'rgba(0,0,0,0.65)',
        zIndex: 1060,
        overflowY: 'auto',
      }}
      tabIndex="-1"
    >
      <div
        className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable my-3"
        style={{
          maxHeight: 'calc(100vh - 40px)',
        }}
      >
        <div
          className="modal-content shadow-lg border-0"
          style={{
            maxHeight: 'calc(100vh - 60px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="modal-header bg-dark text-white py-3" style={{ flexShrink: 0 }}>
            <h5 className="modal-title fw-bold">
              <i className={`bi ${product ? 'bi-pencil-square' : 'bi-plus-circle'} me-2 text-warning`}></i>
              {product ? `Edit Product: ${product.name}` : 'Add New Gadget to Catalog'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <div
              className="modal-body p-4"
              style={{
                overflowY: 'auto',
                flex: 1,
                minHeight: 0,
              }}
            >
              <div className="row g-3">
                {/* Product Name */}
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Product Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control form-control-lg ${errors.name ? 'is-invalid' : ''}`}
                    placeholder="e.g. T900 Ultra 2 Smartwatch with Bluetooth Calling"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                {/* Category Selection */}
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-semibold">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.icon || '📦'} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Catalog Group */}
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-semibold">Catalog Section Group</label>
                  <select
                    className="form-select"
                    value={form.group}
                    onChange={(e) => setForm({ ...form, group: e.target.value })}
                  >
                    <option value="new">🆕 New Arrivals</option>
                    <option value="trending">🔥 Trending Wholesale Gadgets</option>
                    <option value="bestseller">⭐ Best Sellers</option>
                    <option value="audio">🎧 Smart Audio &amp; Wireless</option>
                    <option value="accessories">🔌 Cables, Hubs &amp; Accessories</option>
                  </select>
                </div>

                {/* Price (PKR) */}
                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label fw-semibold">
                    Base Wholesale Price (Rs.) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-bold">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                      placeholder="1450"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                    {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                  </div>
                </div>

                {/* Old / Retail Compare Price */}
                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label fw-semibold">
                    Retail / Compare Price (Rs.)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-bold">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      placeholder="2100"
                      value={form.oldPrice}
                      onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                    />
                  </div>
                  {discount > 0 && (
                    <small className="text-success fw-bold d-block mt-1">
                      <i className="bi bi-tag-fill me-1"></i> {discount}% off shown on storefront
                    </small>
                  )}
                </div>

                {/* Stock Quantity */}
                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label fw-semibold">
                    {options.length > 0 && variantsList.length > 0 ? 'Total Inventory (All Variants)' : 'Stock Quantity'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="e.g. 25"
                    value={
                      options.length > 0 && variantsList.length > 0
                        ? variantsList.reduce((sum, v) => sum + (v.active ? Number(v.stock) || 0 : 0), 0)
                        : form.stock
                    }
                    readOnly={options.length > 0 && variantsList.length > 0}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                  <small className="text-muted d-block mt-1">
                    {options.length > 0 && variantsList.length > 0
                      ? 'Automatically calculated from active variants'
                      : Number(form.stock) === 0
                        ? <span className="text-danger">Marked as Out of Stock</span>
                        : Number(form.stock) <= 5
                          ? <span className="text-warning">Low stock warning active</span>
                          : 'In Stock'
                    }
                  </small>
                </div>

                {/* SKU Code */}
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-semibold">Base SKU / Item Code</label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    placeholder="e.g. GS-1025"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>

                {/* Product Video URL */}
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-semibold">Product Video URL <span className="text-muted">(optional)</span></label>
                  <input
                    type="url"
                    className="form-control font-monospace"
                    placeholder="https://…/product-video.mp4"
                    value={form.video}
                    onChange={(e) => setForm({ ...form, video: e.target.value })}
                  />
                </div>

                {/* ── MULTI-IMAGE UPLOAD & FRONT IMAGE SECTION ──────── */}
                <div className="col-12">
                  <div className="card border p-3 bg-light-subtle rounded-3">
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                      <label className="form-label fw-bold mb-0 fs-6">
                        <i className="bi bi-images me-1 text-primary"></i> Main Product Photos &amp; Catalog Gallery
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <div className="d-flex gap-2">
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                          <i className="bi bi-magic me-1"></i> Auto-Converts to .WebP
                        </span>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary py-0 px-2"
                          style={{ fontSize: '12px' }}
                          onClick={() => setShowManualUrl(!showManualUrl)}
                        >
                          {showManualUrl ? 'Hide URL Input' : 'Presets & URLs ▾'}
                        </button>
                      </div>
                    </div>

                    {/* Drag & Drop Upload Zone */}
                    <div
                      className={`p-4 border-2 rounded text-center transition-all ${
                        dragOver ? 'border-primary bg-primary-subtle' : 'border-secondary-subtle bg-white'
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDragOver(false)
                        handleFiles(e.dataTransfer.files)
                      }}
                      style={{ borderStyle: 'dashed', cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => document.getElementById('product-images-input')?.click()}
                    >
                      <input
                        id="product-images-input"
                        type="file"
                        multiple
                        accept="image/*"
                        className="d-none"
                        onChange={(e) => handleFiles(e.target.files)}
                        disabled={uploading}
                      />

                      <div className="py-2">
                        <i className="bi bi-cloud-arrow-up display-5 text-primary"></i>
                        <h6 className="fw-bold mt-2 mb-1">
                          {uploading ? uploadMsg : 'Click to Upload Images or Drag & Drop Here'}
                        </h6>
                        <p className="text-muted small mb-0">
                          Upload 1 or multiple pictures (PNG, JPG, JPEG, WEBP). Automatically converted to high-speed WebP!
                        </p>
                      </div>
                    </div>

                    {uploading && (
                      <div className="progress mt-2" style={{ height: '6px' }}>
                        <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
                      </div>
                    )}

                    {errors.upload && <div className="text-danger small mt-2">{errors.upload}</div>}
                    {errors.image && <div className="text-danger small mt-2">{errors.image}</div>}

                    {/* Optional URL & Preset Drawer */}
                    {showManualUrl && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <div className="d-flex gap-2 mb-2">
                          <input
                            type="text"
                            className="form-control form-control-sm font-monospace"
                            placeholder="Paste external image URL or path"
                            value={manualUrlInput}
                            onChange={(e) => setManualUrlInput(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={handleAddManualUrl}
                          >
                            Add URL
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary text-nowrap"
                            onClick={() => setShowImagePicker(!showImagePicker)}
                          >
                            Pick Preset ▾
                          </button>
                        </div>

                        {showImagePicker && (
                          <div className="d-flex flex-wrap gap-2 pt-2 border-top" style={{ maxHeight: 120, overflowY: 'auto' }}>
                            {availableImages.map((img) => (
                              <button
                                type="button"
                                key={img}
                                className="btn p-1 border rounded bg-light"
                                onClick={() => {
                                  setGalleryList(prev => [...new Set([...prev, img])])
                                  if (!form.image) setForm(f => ({ ...f, image: img }))
                                  setShowImagePicker(false)
                                }}
                              >
                                <img src={img} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Uploaded Gallery Grid */}
                    {galleryList.length > 0 && (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="fw-bold text-muted text-uppercase">
                            Uploaded Photos ({galleryList.length}) · Click ⭐ "Front Image" to select main cover photo
                          </small>
                        </div>

                        <div className="row g-2">
                          {galleryList.map((imgUrl, index) => {
                            const isFront = (form.image || galleryList[0]) === imgUrl
                            return (
                              <div key={`${imgUrl}-${index}`} className="col-6 col-sm-4 col-md-3">
                                <div
                                  className={`card h-100 position-relative border ${
                                    isFront ? 'border-success border-2 shadow-sm' : 'border-secondary-subtle'
                                  }`}
                                  style={{ overflow: 'hidden', background: '#ffffff' }}
                                >
                                  {isFront && (
                                    <span
                                      className="position-absolute top-0 start-0 badge bg-success m-1 d-flex align-items-center gap-1 shadow-sm"
                                      style={{ zIndex: 2, fontSize: '11px' }}
                                    >
                                      <i className="bi bi-star-fill"></i> Front Image
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm"
                                    style={{ width: '24px', height: '24px', zIndex: 2 }}
                                    title="Remove this picture"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeImage(imgUrl)
                                    }}
                                  >
                                    <i className="bi bi-x"></i>
                                  </button>

                                  <div style={{ height: '110px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img
                                      src={imgUrl}
                                      alt=""
                                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                      onError={(e) => { e.target.src = '/images/cat1.jpg' }}
                                    />
                                  </div>

                                  <div className="card-footer p-1 bg-white text-center border-top-0">
                                    {isFront ? (
                                      <span className="badge text-success small py-1">
                                        <i className="bi bi-check-circle-fill me-1"></i> Main Cover Photo
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        className="btn btn-xs btn-outline-primary w-100 py-1"
                                        style={{ fontSize: '11px' }}
                                        onClick={() => setAsFrontImage(imgUrl)}
                                      >
                                        <i className="bi bi-star me-1"></i> Set as Front
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ══════════════════════════════════════════════════════════ */}
                {/* ── ADVANCED SHOPIFY-STYLE PRODUCT OPTIONS / VARIANTS ───── */}
                {/* ══════════════════════════════════════════════════════════ */}
                <div className="col-12">
                  <div className="card border-primary border-opacity-25 shadow-sm rounded-3 overflow-hidden">
                    <div className="card-header bg-primary bg-opacity-10 py-3 border-primary border-opacity-25">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                          <h6 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                            <i className="bi bi-layers-half fs-5"></i> Product Options / Variants
                          </h6>
                          <small className="text-muted">
                            Create dynamic options (Color, Size, Material, Storage, etc.) with custom values, color-specific image galleries, and pricing matrices.
                          </small>
                        </div>

                        {/* Quick Presets & Add Option Actions */}
                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => addOption('Color')}
                            disabled={options.some(o => o.name.toLowerCase() === 'color')}
                          >
                            + Add Color
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => addOption('Size')}
                            disabled={options.some(o => o.name.toLowerCase() === 'size')}
                          >
                            + Add Size
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => setShowAddOptionInput(!showAddOptionInput)}
                          >
                            <i className="bi bi-plus-lg me-1"></i> Add Custom Option
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="card-body p-3 p-md-4">
                      {errors.variants && (
                        <div className="alert alert-danger py-2 small mb-3">
                          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errors.variants}
                        </div>
                      )}

                      {/* Custom Option Prompt */}
                      {showAddOptionInput && (
                        <div className="p-3 mb-3 bg-light rounded border border-primary border-opacity-25">
                          <label className="form-label fw-bold small text-dark mb-1">
                            New Option Name (e.g. Storage, Material, Capacity, Style)
                          </label>
                          <div className="d-flex gap-2 mb-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="e.g. Storage, Material, Volume"
                              value={newOptionName}
                              onChange={(e) => setNewOptionName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addOption()
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-primary text-nowrap"
                              onClick={() => addOption()}
                            >
                              Add Option
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setShowAddOptionInput(false)}
                            >
                              Cancel
                            </button>
                          </div>
                          <div className="d-flex flex-wrap gap-1 align-items-center">
                            <span className="small text-muted me-1">Suggestions:</span>
                            {PRESET_OPTION_NAMES.map(name => (
                              <button
                                key={name}
                                type="button"
                                className="btn btn-xs btn-outline-secondary py-0 px-2"
                                style={{ fontSize: '11px' }}
                                onClick={() => addOption(name)}
                                disabled={options.some(o => o.name.toLowerCase() === name.toLowerCase())}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {options.length === 0 ? (
                        <div className="text-center py-4 text-muted border rounded bg-light">
                          <i className="bi bi-box-seam fs-1 text-secondary opacity-50 d-block mb-2"></i>
                          <h6>Simple Product (Single SKU &amp; Single Stock)</h6>
                          <p className="small mb-3">
                            This product currently has no variants. Click <strong>+ Add Color</strong>, <strong>+ Add Size</strong>, or <strong>Add Custom Option</strong> above to enable dynamic multi-attribute inventory.
                          </p>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-4">
                          {/* ── 1. DYNAMIC OPTIONS LIST ─────────────────────── */}
                          <div className="d-flex flex-column gap-3">
                            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                              <i className="bi bi-sliders text-primary"></i> 1. Configure Product Options &amp; Values
                            </h6>

                            {options.map((opt) => {
                              const isColor = opt.name.toLowerCase() === 'color'
                              const inputState = newValueInputs[opt.id] || { name: '', hex: '#111827' }

                              return (
                                <div key={opt.id} className="card border p-3 rounded-3 bg-white shadow-sm">
                                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="badge bg-primary px-2 py-1 fs-6">
                                        {opt.name}
                                      </span>
                                      <small className="text-muted">({opt.values.length} value{opt.values.length === 1 ? '' : 's'})</small>
                                    </div>

                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-danger py-0 px-2"
                                      style={{ fontSize: '12px' }}
                                      onClick={() => removeOption(opt.id)}
                                      title={`Delete option ${opt.name}`}
                                    >
                                      <i className="bi bi-trash me-1"></i> Remove Option
                                    </button>
                                  </div>

                                  {/* Quick value suggestions for Color or Size */}
                                  {isColor && (
                                    <div className="mb-2 p-2 bg-light rounded border">
                                      <small className="text-muted d-block mb-1">Click to add preset colors:</small>
                                      <div className="d-flex flex-wrap gap-1">
                                        {PRESET_COLORS.map(c => (
                                          <button
                                            key={c.name}
                                            type="button"
                                            className="btn btn-xs btn-outline-secondary d-flex align-items-center gap-1.5 py-0 px-2"
                                            style={{ fontSize: '11px' }}
                                            onClick={() => addOptionValue(opt.id, c.name, c.hex)}
                                            disabled={opt.values.some(v => v.name.toLowerCase() === c.name.toLowerCase())}
                                          >
                                            <span
                                              style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                backgroundColor: c.hex,
                                                border: '1px solid #cbd5e1',
                                                display: 'inline-block',
                                              }}
                                            />
                                            {c.name}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {opt.name.toLowerCase() === 'size' && (
                                    <div className="mb-2 p-2 bg-light rounded border">
                                      <small className="text-muted d-block mb-1">Click to add preset sizes:</small>
                                      <div className="d-flex flex-wrap gap-1">
                                        {PRESET_SIZES.clothing.map(s => (
                                          <button
                                            key={s}
                                            type="button"
                                            className="btn btn-xs btn-outline-secondary py-0 px-2"
                                            style={{ fontSize: '11px' }}
                                            onClick={() => addOptionValue(opt.id, s)}
                                            disabled={opt.values.some(v => v.name.toLowerCase() === s.toLowerCase())}
                                          >
                                            + {s}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Add value input row */}
                                  <div className="row g-2 align-items-center mb-2">
                                    <div className={`col-12 ${isColor ? 'col-sm-5' : 'col-sm-8'}`}>
                                      <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder={`Enter ${opt.name} value (e.g. ${isColor ? 'Space Gray' : 'Medium'})`}
                                        value={inputState.name}
                                        onChange={(e) => setNewValueInputs(prev => ({
                                          ...prev,
                                          [opt.id]: { ...inputState, name: e.target.value }
                                        }))}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault()
                                            addOptionValue(opt.id)
                                          }
                                        }}
                                      />
                                    </div>

                                    {isColor && (
                                      <div className="col-6 col-sm-4">
                                        <div className="d-flex align-items-center gap-1">
                                          <input
                                            type="color"
                                            className="form-control form-control-color form-control-sm p-1"
                                            value={inputState.hex || '#111827'}
                                            onChange={(e) => setNewValueInputs(prev => ({
                                              ...prev,
                                              [opt.id]: { ...inputState, hex: e.target.value }
                                            }))}
                                            style={{ width: '38px', height: '31px' }}
                                            title="Choose swatch color"
                                          />
                                          <input
                                            type="text"
                                            className="form-control form-control-sm font-monospace"
                                            placeholder="#111827"
                                            value={inputState.hex || '#111827'}
                                            onChange={(e) => setNewValueInputs(prev => ({
                                              ...prev,
                                              [opt.id]: { ...inputState, hex: e.target.value }
                                            }))}
                                            style={{ width: '85px' }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    <div className={`col-6 ${isColor ? 'col-sm-3' : 'col-sm-4'}`}>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-primary w-100"
                                        onClick={() => addOptionValue(opt.id)}
                                      >
                                        <i className="bi bi-plus-lg me-1"></i> Add Value
                                      </button>
                                    </div>
                                  </div>

                                  {/* List of configured values */}
                                  <div className="d-flex flex-wrap gap-2 pt-2 border-top">
                                    {opt.values.length === 0 ? (
                                      <span className="small text-muted fst-italic">No values added yet. Add at least one value above.</span>
                                    ) : (
                                      opt.values.map((val) => (
                                        <span
                                          key={val.id}
                                          className="badge bg-light text-dark border px-2 py-1.5 fs-6 d-inline-flex align-items-center gap-2 shadow-2xs"
                                        >
                                          {val.hex && (
                                            <span
                                              style={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: '50%',
                                                backgroundColor: val.hex,
                                                border: '1px solid #cbd5e1',
                                                display: 'inline-block',
                                              }}
                                            />
                                          )}
                                          {val.name}
                                          <button
                                            type="button"
                                            className="btn-close btn-close-xs ms-1"
                                            style={{ fontSize: '8px' }}
                                            onClick={() => removeOptionValue(opt.id, val.id)}
                                            aria-label={`Remove value ${val.name}`}
                                          ></button>
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* ── 2. INDIVIDUAL COLOR GALLERIES ────────────────── */}
                          {colorOption && colorOption.values.length > 0 && (
                            <div className="card border p-3 rounded-3 bg-white shadow-sm">
                              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                  <i className="bi bi-images text-danger"></i> 2. Individual Color Image Galleries
                                </h6>
                                <span className="badge bg-secondary-subtle text-secondary">
                                  {colorOption.values.length} Color{colorOption.values.length === 1 ? '' : 's'} to configure
                                </span>
                              </div>
                              <p className="small text-muted mb-3">
                                Upload dedicated high-resolution photos for each color. When a customer selects that color on the storefront, the product gallery immediately switches to that color's images.
                              </p>

                              <div className="d-flex flex-column gap-3">
                                {colorOption.values.map((colVal) => {
                                  const gallery = colorGalleries.find(cg => cg.colorName.toLowerCase() === colVal.name.toLowerCase()) || {
                                    colorName: colVal.name,
                                    hex: colVal.hex || '',
                                    images: [],
                                    primaryImage: '',
                                  }

                                  return (
                                    <div key={colVal.id} className="p-3 bg-light-subtle rounded-3 border">
                                      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                                        <div className="d-flex align-items-center gap-2">
                                          <span
                                            style={{
                                              width: 20,
                                              height: 20,
                                              borderRadius: '50%',
                                              backgroundColor: colVal.hex || '#111827',
                                              border: '1.5px solid #ffffff',
                                              boxShadow: '0 0 0 1px #94a3b8',
                                              display: 'inline-block',
                                            }}
                                          />
                                          <strong className="fs-6 text-dark">{colVal.name} Images</strong>
                                          <span className="badge bg-secondary-subtle text-secondary small">
                                            {gallery.images.length} photo{gallery.images.length === 1 ? '' : 's'}
                                          </span>
                                        </div>

                                        <div className="d-flex align-items-center gap-2">
                                          <label
                                            htmlFor={`color-upload-${colVal.id}`}
                                            className="btn btn-xs btn-outline-primary py-1 px-2 cursor-pointer mb-0"
                                            style={{ fontSize: '12px' }}
                                          >
                                            <i className="bi bi-cloud-arrow-up me-1"></i> Upload {colVal.name} Photos
                                          </label>
                                          <input
                                            id={`color-upload-${colVal.id}`}
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="d-none"
                                            onChange={(e) => handleColorImagesUpload(colVal.name, e.target.files)}
                                            disabled={uploading}
                                          />
                                        </div>
                                      </div>

                                      {/* Color gallery preview thumbnails */}
                                      {gallery.images.length > 0 ? (
                                        <div className="d-flex flex-wrap gap-2 align-items-center p-2 bg-white rounded border">
                                          {gallery.images.map((img, imgIdx) => {
                                            const isPrimary = (gallery.primaryImage || gallery.images[0]) === img
                                            return (
                                              <div
                                                key={imgIdx}
                                                className={`position-relative rounded border ${isPrimary ? 'border-primary border-2 shadow-sm' : ''}`}
                                                style={{ width: 72, height: 72, overflow: 'hidden', backgroundColor: '#f8fafc' }}
                                              >
                                                <img
                                                  src={img}
                                                  alt=""
                                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />

                                                {/* Primary badge */}
                                                {isPrimary && (
                                                  <span
                                                    className="position-absolute bottom-0 start-0 w-100 bg-primary text-white text-center py-0"
                                                    style={{ fontSize: '9px', fontWeight: 700 }}
                                                  >
                                                    COVER
                                                  </span>
                                                )}

                                                {/* Delete image button */}
                                                <button
                                                  type="button"
                                                  className="btn btn-danger btn-xs position-absolute top-0 end-0 p-0 rounded-circle m-1"
                                                  style={{ width: 16, height: 16, fontSize: 10, lineHeight: 1 }}
                                                  onClick={() => {
                                                    setColorGalleries(prev => {
                                                      return prev.map(cg => {
                                                        if (cg.colorName.toLowerCase() !== colVal.name.toLowerCase()) return cg
                                                        const newImgs = cg.images.filter((_, i) => i !== imgIdx)
                                                        return {
                                                          ...cg,
                                                          images: newImgs,
                                                          primaryImage: cg.primaryImage === img ? (newImgs[0] || '') : cg.primaryImage,
                                                        }
                                                      })
                                                    })
                                                  }}
                                                  title="Remove image"
                                                >
                                                  ×
                                                </button>

                                                {/* Reorder Left */}
                                                {imgIdx > 0 && (
                                                  <button
                                                    type="button"
                                                    className="btn btn-dark btn-xs position-absolute top-0 start-0 p-0 rounded-circle m-1 opacity-75"
                                                    style={{ width: 16, height: 16, fontSize: 9, lineHeight: 1 }}
                                                    onClick={() => {
                                                      setColorGalleries(prev => prev.map(cg => {
                                                        if (cg.colorName.toLowerCase() !== colVal.name.toLowerCase()) return cg
                                                        const nextList = [...cg.images]
                                                        const temp = nextList[imgIdx - 1]
                                                        nextList[imgIdx - 1] = nextList[imgIdx]
                                                        nextList[imgIdx] = temp
                                                        return { ...cg, images: nextList }
                                                      }))
                                                    }}
                                                    title="Move left"
                                                  >
                                                    ‹
                                                  </button>
                                                )}

                                                {/* Make Cover Button */}
                                                {!isPrimary && (
                                                  <button
                                                    type="button"
                                                    className="btn btn-light btn-xs position-absolute bottom-0 start-0 w-100 p-0 text-primary border-top"
                                                    style={{ fontSize: '9px' }}
                                                    onClick={() => {
                                                      setColorGalleries(prev => prev.map(cg => {
                                                        if (cg.colorName.toLowerCase() !== colVal.name.toLowerCase()) return cg
                                                        return { ...cg, primaryImage: img }
                                                      }))
                                                    }}
                                                  >
                                                    Make Cover
                                                  </button>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      ) : (
                                        <div className="p-2 bg-white rounded border text-muted small fst-italic">
                                          No dedicated photos uploaded for {colVal.name} yet. (Will fall back to main catalog photos).
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* ── 3. PURCHASABLE VARIANTS PRICING & INVENTORY MATRIX ─ */}
                          <div className="card border p-3 rounded-3 bg-white shadow-sm">
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                              <div>
                                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                                  <i className="bi bi-table text-primary"></i> 3. Variant Combinations &amp; Individual Pricing Matrix
                                </h6>
                                <small className="text-muted">
                                  Enable or disable specific combinations, define individual regular/sale prices, SKUs, and stock.
                                </small>
                              </div>

                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => regenerateCombinations()}
                              >
                                <i className="bi bi-arrow-repeat me-1"></i> Generate / Synchronize Combinations
                              </button>
                            </div>

                            {/* Bulk Update Controls */}
                            {variantsList.length > 0 && (
                              <div className="p-2 mb-3 bg-light rounded border d-flex flex-wrap align-items-center gap-3">
                                <span className="small fw-bold text-muted text-uppercase">Bulk Actions:</span>

                                <div className="d-flex align-items-center gap-1">
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    placeholder="Price (Rs.)"
                                    style={{ width: '100px' }}
                                    value={bulkPriceInput}
                                    onChange={(e) => setBulkPriceInput(e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary text-nowrap"
                                    onClick={applyBulkPrice}
                                  >
                                    Apply Price
                                  </button>
                                </div>

                                <div className="d-flex align-items-center gap-1">
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    placeholder="Stock"
                                    style={{ width: '90px' }}
                                    value={bulkStockInput}
                                    onChange={(e) => setBulkStockInput(e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary text-nowrap"
                                    onClick={applyBulkStock}
                                  >
                                    Apply Stock
                                  </button>
                                </div>

                                <div className="ms-auto d-flex gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline-success py-1 px-2"
                                    onClick={() => toggleAllVariantsActive(true)}
                                  >
                                    Enable All
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline-secondary py-1 px-2"
                                    onClick={() => toggleAllVariantsActive(false)}
                                  >
                                    Disable All
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Matrix Table */}
                            {variantsList.length === 0 ? (
                              <div className="text-center py-4 text-muted border rounded bg-light">
                                <p className="mb-2">Click <strong>"Generate / Synchronize Combinations"</strong> to create purchasable variant rows.</p>
                              </div>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-sm table-bordered align-middle mb-0">
                                  <thead className="table-light">
                                    <tr>
                                      <th style={{ width: 80 }} className="text-center">Exists / Active</th>
                                      <th>Combination Title</th>
                                      <th style={{ width: 170 }}>SKU Code</th>
                                      <th style={{ width: 130 }}>Price (Rs.)</th>
                                      <th style={{ width: 130 }}>Compare (Rs.)</th>
                                      <th style={{ width: 100 }}>Stock</th>
                                      <th style={{ width: 130 }}>Barcode</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {variantsList.map((v, vIdx) => (
                                      <tr key={v.id || vIdx} className={!v.active ? 'table-secondary opacity-60' : ''}>
                                        <td className="text-center">
                                          <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={v.active !== false}
                                            onChange={(e) => handleVariantFieldChange(vIdx, 'active', e.target.checked)}
                                            title="Uncheck if this combination does not actually exist or is unavailable"
                                          />
                                        </td>
                                        <td>
                                          <div className="d-flex align-items-center gap-2">
                                            {v.options?.Color && (
                                              <span
                                                style={{
                                                  width: 14,
                                                  height: 14,
                                                  borderRadius: '50%',
                                                  backgroundColor: PRESET_COLORS.find(c => c.name.toLowerCase() === v.options.Color.toLowerCase())?.hex || '#94a3b8',
                                                  border: '1px solid #64748b',
                                                  display: 'inline-block',
                                                  flexShrink: 0,
                                                }}
                                              />
                                            )}
                                            <span className="fw-semibold text-dark">
                                              {v.title}
                                            </span>
                                            {!v.active && (
                                              <span className="badge bg-secondary-subtle text-secondary small py-0 px-1" style={{ fontSize: '10px' }}>
                                                Non-Existent
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm font-monospace"
                                            value={v.sku}
                                            onChange={(e) => handleVariantFieldChange(vIdx, 'sku', e.target.value)}
                                          />
                                        </td>
                                        <td>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light p-1">Rs.</span>
                                            <input
                                              type="number"
                                              min="0"
                                              className="form-control form-control-sm"
                                              value={v.price}
                                              onChange={(e) => handleVariantFieldChange(vIdx, 'price', Number(e.target.value))}
                                            />
                                          </div>
                                        </td>
                                        <td>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light p-1">Rs.</span>
                                            <input
                                              type="number"
                                              min="0"
                                              className="form-control form-control-sm"
                                              value={v.oldPrice}
                                              onChange={(e) => handleVariantFieldChange(vIdx, 'oldPrice', Number(e.target.value))}
                                            />
                                          </div>
                                        </td>
                                        <td>
                                          <input
                                            type="number"
                                            min="0"
                                            className="form-control form-control-sm"
                                            value={v.stock}
                                            onChange={(e) => handleVariantFieldChange(vIdx, 'stock', Number(e.target.value))}
                                          />
                                        </td>
                                        <td>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm font-monospace"
                                            placeholder="Optional"
                                            value={v.barcode || ''}
                                            onChange={(e) => handleVariantFieldChange(vIdx, 'barcode', e.target.value)}
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Product Description</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Enter key product features, dimensions, material, specifications, etc."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  ></textarea>
                </div>

                {/* Featured Switch */}
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="featuredSwitch"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="featuredSwitch">
                      Highlight as Featured Product on Storefront
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light" style={{ flexShrink: 0 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-admin-primary fw-semibold px-4" disabled={uploading}>
                <i className="bi bi-check-lg me-1"></i> {product ? 'Save Changes' : 'Publish Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
