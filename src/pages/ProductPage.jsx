import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BRAND, TRUST_BADGES } from '../data'
import { productSlug, findProductIn, productPath } from '../content'
import { useCart } from '../context/CartContext'
import { useStoreData } from '../context/StoreDataContext'
import ProductCard from '../components/ProductCard'
import { setPageSeo } from '../utils/seo'

const PRESET_COLORS = [
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Silver', hex: '#94a3b8' },
  { name: 'Space Gray', hex: '#4b5563' },
  { name: 'Gold', hex: '#d97706' },
  { name: 'Rose Gold', hex: '#f43f5e' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Light Green', hex: '#10b981' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Orange', hex: '#ea580c' },
]

const KNOWN_COLOR_HEX = {
  black: '#111827',
  white: '#ffffff',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#10b981',
  'light green': '#10b981',
  yellow: '#eab308',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  grey: '#64748b',
  gray: '#64748b',
  silver: '#cbd5e1',
  gold: '#d97706',
  navy: '#1e3a8a',
  brown: '#78350f',
  beige: '#f5f5dc',
  cyan: '#06b6d4',
  teal: '#0d9488',
}

const Star = ({ fill = true, size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z"
      fill={fill ? '#f5b710' : 'none'} stroke="#f5b710" strokeWidth="1.4" />
  </svg>
)

function mediaList(product, selectedColor) {
  if (!product) return []
  let images = []

  if (selectedColor && product.colorImages && product.colorImages.length) {
    const colObj = product.colorImages.find(c => {
      const cName = c.color || c.colorName || ''
      return cName.toLowerCase() === selectedColor?.toLowerCase()
    })
    if (colObj && colObj.images && colObj.images.length > 0) {
      images = [...colObj.images]
    }
  }

  if (images.length === 0) {
    images = [...new Set([product.image, ...(product.images || [])].filter(Boolean))]
  }

  return [
    ...images.map((src, i) => ({ type: 'image', src, key: `img-${selectedColor || 'def'}-${i}` })),
    ...(product.video ? [{ type: 'video', src: product.video, key: 'video' }] : []),
  ]
}

export default function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { products = [], categories = [], reviews = [], loading, addReview } = useStoreData()
  const product = findProductIn(products, slug)
  const { add, buyNow, toggleWish, wishlist, notify } = useCart()
  const [qty, setQty] = useState(1)
  const [mediaIndex, setMediaIndex] = useState(0)
  const [delivery, setDelivery] = useState('karachi')
  const [tab, setTab] = useState('description')
  const [writing, setWriting] = useState(false)
  const [sent, setSent] = useState(false)
  const [review, setReview] = useState({ rating: 5, title: '', body: '', name: '' })
  const [lightbox, setLightbox] = useState(false)
  const mainActionsRef = useRef(null)
  const [showStickyBar, setShowStickyBar] = useState(false)

  const hasVariants = Boolean(product?.hasVariants && product?.variants?.length)
  const [selectedOptions, setSelectedOptions] = useState({})

  const effectiveOptions = useMemo(() => {
    if (Array.isArray(product?.options) && product.options.length > 0) {
      return product.options
    }
    if (!product?.variants || product.variants.length === 0) return []
    // Synthesize options if options metadata is absent
    const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))]
    const sizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))]
    const synth = []
    if (colors.length > 0) synth.push({ name: 'Color', values: colors })
    if (sizes.length > 0) synth.push({ name: 'Size', values: sizes })
    return synth
  }, [product?.options, product?.variants])

  // Initialize selectedOptions on product/slug change with URL param & session persistence
  useEffect(() => {
    if (product && product.hasVariants && effectiveOptions.length > 0) {
      const initial = {}
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      let savedStorage = null
      try {
        const raw = sessionStorage.getItem(`qg_pdp_opts_${slug}`)
        if (raw) savedStorage = JSON.parse(raw)
      } catch (_) {}

      effectiveOptions.forEach(opt => {
        const urlVal = urlParams?.get(opt.name.toLowerCase())
        const storageVal = savedStorage?.[opt.name]
        const firstVal = opt.values?.[0]
        const defaultVal = typeof firstVal === 'string' ? firstVal : firstVal?.name

        // Check if urlVal or storageVal matches an existing option value
        const candidate = [urlVal, storageVal].find(cand => {
          if (!cand) return false
          return opt.values?.some(v => {
            const vName = typeof v === 'string' ? v : v?.name
            return vName?.toLowerCase() === cand.toLowerCase()
          })
        })

        if (candidate) {
          const matched = opt.values?.find(v => {
            const vName = typeof v === 'string' ? v : v?.name
            return vName?.toLowerCase() === candidate.toLowerCase()
          })
          initial[opt.name] = typeof matched === 'string' ? matched : (matched?.name || candidate)
        } else if (defaultVal) {
          initial[opt.name] = defaultVal
        }
      })
      setSelectedOptions(initial)
    } else if (product && product.hasVariants && product.variants?.length > 0) {
      const firstV = product.variants[0]
      const initial = {}
      if (firstV.color) initial.Color = firstV.color
      if (firstV.size) initial.Size = firstV.size
      if (firstV.options) Object.assign(initial, firstV.options)
      setSelectedOptions(initial)
    } else {
      setSelectedOptions({})
    }
  }, [slug, product?.id, effectiveOptions])

  // Sync selectedOptions to URL query params and sessionStorage for persistence after refresh
  useEffect(() => {
    if (!product || !product.hasVariants || Object.keys(selectedOptions).length === 0) return
    try {
      sessionStorage.setItem(`qg_pdp_opts_${slug}`, JSON.stringify(selectedOptions))
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const url = new URL(window.location.href)
        Object.entries(selectedOptions).forEach(([k, v]) => {
          if (v) url.searchParams.set(k.toLowerCase(), v)
        })
        window.history.replaceState(null, '', url.pathname + url.search)
      }
    } catch (_) {}
  }, [selectedOptions, slug, product])

  const colorOption = useMemo(() => {
    return effectiveOptions.find(o => o.name.toLowerCase() === 'color') || null
  }, [effectiveOptions])

  const otherOptions = useMemo(() => {
    return effectiveOptions.filter(o => o.name.toLowerCase() !== 'color')
  }, [effectiveOptions])

  const selectedColor = useMemo(() => {
    if (!colorOption) {
      const colEntry = Object.entries(selectedOptions).find(([k]) => k.toLowerCase() === 'color')
      return colEntry ? colEntry[1] : ''
    }
    return selectedOptions[colorOption.name] || ''
  }, [colorOption, selectedOptions])

  const activeVariant = useMemo(() => {
    if (!hasVariants || !product?.variants?.length) return null
    return product.variants.find(v => {
      // Must match all currently selected options
      for (const [optName, optVal] of Object.entries(selectedOptions)) {
        if (!optVal) continue
        if (v.options && v.options[optName]) {
          if (v.options[optName].toLowerCase() !== optVal.toLowerCase()) return false
        } else if (optName.toLowerCase() === 'color') {
          if ((v.color || '').toLowerCase() !== optVal.toLowerCase()) return false
        } else if (optName.toLowerCase() === 'size') {
          if ((v.size || '').toLowerCase() !== optVal.toLowerCase()) return false
        }
      }
      return true
    }) || null
  }, [hasVariants, product?.variants, selectedOptions])

  const doesCombinationExist = useCallback((optName, valName) => {
    if (!product?.variants || product.variants.length === 0) return true
    return product.variants.some(v => {
      if (v.active === false) return false
      const vVal = v.options?.[optName] || (optName.toLowerCase() === 'color' ? v.color : optName.toLowerCase() === 'size' ? v.size : null)
      if (vVal && vVal.toLowerCase() !== valName.toLowerCase()) return false

      for (const [otherName, otherVal] of Object.entries(selectedOptions)) {
        if (otherName.toLowerCase() === optName.toLowerCase() || !otherVal) continue
        const vOtherVal = v.options?.[otherName] || (otherName.toLowerCase() === 'color' ? v.color : otherName.toLowerCase() === 'size' ? v.size : null)
        if (vOtherVal && vOtherVal.toLowerCase() !== otherVal.toLowerCase()) return false
      }
      return true
    })
  }, [product?.variants, selectedOptions])

  const isValAvailable = useCallback((optName, valName) => {
    if (!product?.variants || product.variants.length === 0) return true
    const matching = product.variants.filter(v => {
      if (v.active === false) return false
      const vVal = v.options?.[optName] || (optName.toLowerCase() === 'color' ? v.color : optName.toLowerCase() === 'size' ? v.size : null)
      if (vVal && vVal.toLowerCase() !== valName.toLowerCase()) return false

      for (const [otherName, otherVal] of Object.entries(selectedOptions)) {
        if (otherName.toLowerCase() === optName.toLowerCase() || !otherVal) continue
        const vOtherVal = v.options?.[otherName] || (otherName.toLowerCase() === 'color' ? v.color : otherName.toLowerCase() === 'size' ? v.size : null)
        if (vOtherVal && vOtherVal.toLowerCase() !== otherVal.toLowerCase()) return false
      }
      return true
    })
    return matching.some(v => Number(v.stock) > 0)
  }, [product?.variants, selectedOptions])

  // Floating sticky bar only appears when scrolled down and main Buy Now button is off screen
  useEffect(() => {
    const el = mainActionsRef.current
    if (!el) return

    let isMainVisible = false
    let isPastThreshold = typeof window !== 'undefined' ? window.scrollY > 220 : false

    const updateVisibility = () => {
      setShowStickyBar(isPastThreshold && !isMainVisible)
    }

    const handleScroll = () => {
      const past = window.scrollY > 220
      if (past !== isPastThreshold) {
        isPastThreshold = past
        updateVisibility()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    let observer
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        entries => {
          if (!entries || !entries[0]) return
          isMainVisible = entries[0].isIntersecting
          updateVisibility()
        },
        { threshold: 0 }
      )
      observer.observe(el)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (observer) observer.disconnect()
    }
  }, [product])

  const media = product ? mediaList(product, selectedColor) : []
  const activeMedia = media[Math.min(mediaIndex, Math.max(media.length - 1, 0))]

  const lensContainerRef = useRef(null)
  const lensRef = useRef(null)
  const containerRectRef = useRef(null)
  const rafIdRef = useRef(null)
  const isHoveringRef = useRef(false)

  // Zoom parameters (Desktop Only)
  const LENS_DIAMETER = 140
  const LENS_RADIUS = LENS_DIAMETER / 2
  const ZOOM_FACTOR = 2.4

  const isDesktopCapable = () => {
    if (typeof window === 'undefined') return false
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    const canHover = window.matchMedia('(hover: hover)').matches
    const isDesktopWidth = window.innerWidth >= 1024
    return isDesktopWidth && hasFinePointer && canHover
  }

  const updateLens = (clientX, clientY) => {
    const container = lensContainerRef.current
    const lens = lensRef.current
    if (!container || !lens || !isHoveringRef.current) return

    let rect = containerRectRef.current
    if (!rect || rect.width <= 0) {
      rect = container.getBoundingClientRect()
      containerRectRef.current = rect
    }
    if (rect.width <= 0 || rect.height <= 0) return

    // Clamp coordinates strictly within the container bounds
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top))

    // Lens position clamped strictly inside container bounds [0, rect.dim - LENS_DIAMETER]
    const left = Math.max(0, Math.min(rect.width - LENS_DIAMETER, x - LENS_RADIUS))
    const top = Math.max(0, Math.min(rect.height - LENS_DIAMETER, y - LENS_RADIUS))

    // Mathematically exact background position aligning pixel-for-pixel with cursor
    const bgX = (x - left) - (x * ZOOM_FACTOR)
    const bgY = (y - top) - (y * ZOOM_FACTOR)

    lens.style.transform = `translate3d(${left}px, ${top}px, 0)`
    lens.style.backgroundPosition = `${bgX}px ${bgY}px`
    lens.style.opacity = '1'
  }

  const handleMouseMove = (e) => {
    if (!isDesktopCapable()) return

    const { clientX, clientY } = e
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }
    rafIdRef.current = requestAnimationFrame(() => {
      updateLens(clientX, clientY)
      rafIdRef.current = null
    })
  }

  const handleMouseEnter = (e) => {
    if (!isDesktopCapable()) return
    isHoveringRef.current = true

    const container = lensContainerRef.current
    const lens = lensRef.current
    if (!container || !lens) return

    const rect = container.getBoundingClientRect()
    containerRectRef.current = rect

    if (rect.width > 0 && rect.height > 0) {
      const bgW = rect.width * ZOOM_FACTOR
      const bgH = rect.height * ZOOM_FACTOR
      lens.style.backgroundSize = `${bgW}px ${bgH}px`
    }

    updateLens(e.clientX, e.clientY)
  }

  const handleMouseLeave = () => {
    isHoveringRef.current = false
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    if (lensRef.current) {
      lensRef.current.style.opacity = '0'
    }
  }

  // Preload image and clean up animation frames
  useEffect(() => {
    const src = activeMedia?.src || product?.image
    if (src && isDesktopCapable()) {
      const preload = new Image()
      preload.src = src
    }
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [activeMedia?.src, product?.image])

  const related = useMemo(() => {
    if (!product) return []
    return products
      .filter(p => p.id !== product.id && (p.category === product.category || p.group === product.group))
      .slice(0, 4)
  }, [product, products])

  const productReviews = useMemo(() => {
    if (!product) return []
    // Show ONLY reviews specifically submitted for this product
    return reviews
      .filter(r => String(r.productId) === String(product.id) && (r.status === 'approved' || !r.status))
      .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
  }, [product, reviews])

  const reviewCount = productReviews.length
  const avgRating = reviewCount > 0
    ? (productReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviewCount)
    : 0

  const effectivePrice = activeVariant ? Number(activeVariant.price) : Number(product?.price || 0)
  const isProductInStock = Boolean(!hasVariants ? (Number(product?.stock || 0) > 0) : (activeVariant && activeVariant.active !== false && Number(activeVariant.stock) > 0))

  useEffect(() => {
    if (!product) return

    const productImageUrl = product.image?.startsWith('http')
      ? product.image
      : `https://saveandsmile.vercel.app${product.image}`

    const schemaObj = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      image: [productImageUrl],
      description: product.description || `${product.name} available at best wholesale and retail prices in Pakistan from Save & Smile.`,
      sku: product.sku || `GS-${product.id}`,
      brand: {
        '@type': 'Brand',
        name: (product.brand === 'Qadri Select' ? 'Save & Smile' : product.brand) || 'Save & Smile',
      },
      offers: {
        '@type': 'Offer',
        url: `https://saveandsmile.vercel.app/product/${product.slug}`,
        priceCurrency: 'PKR',
        price: effectivePrice,
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: isProductInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Save & Smile',
        },
      },
    }

    if (reviewCount > 0) {
      schemaObj.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: Number(avgRating.toFixed(1)),
        reviewCount: reviewCount,
      }
      schemaObj.review = productReviews.slice(0, 3).map(r => ({
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: Number(r.rating) || 5,
        },
        author: {
          '@type': 'Person',
          name: r.name || 'Verified Buyer',
        },
        reviewBody: r.text || r.title || 'Great product!',
      }))
    }

    setPageSeo({
      title: `${product.name} | Save & Smile`,
      description: product.description?.slice(0, 160) || `Buy ${product.name} online at wholesale prices in Pakistan from Save & Smile. Fast nationwide cash on delivery.`,
      canonical: `/product/${product.slug}`,
      ogType: 'product',
      ogImage: productImageUrl,
      structuredData: schemaObj,
    })
  }, [product, effectivePrice, isProductInStock, reviewCount, avgRating, productReviews])

  useEffect(() => {
    setMediaIndex(0)
    setQty(1)
    setTab('description')
  }, [slug])

  if (!product) {
    return (
      <main className="qpage">
        <div className="qg-container qpage-narrow">
          {loading ? (
            <>
              <h1>Loading product…</h1>
              <p>Fetching details from the store database.</p>
            </>
          ) : (
            <>
              <h1>Product not found</h1>
              <p>That product may have sold out or moved.</p>
              <Link className="qg-btn qg-btn-primary" to="/shop">Browse all products</Link>
            </>
          )}
        </div>
      </main>
    )
  }

  const isCombinationExisting = Boolean(!hasVariants || (activeVariant && activeVariant.active !== false))
  const isCombinationInStock = Boolean(!hasVariants ? (Number(product.stock) > 0) : (activeVariant && activeVariant.active !== false && Number(activeVariant.stock) > 0))
  const currentPrice = activeVariant ? Number(activeVariant.price) : Number(product.price)
  const currentOldPrice = activeVariant ? Number(activeVariant.oldPrice || activeVariant.price) : Number(product.oldPrice || product.price)
  const currentStock = activeVariant ? Number(activeVariant.stock) : Number(product.stock)
  const currentSku = activeVariant?.sku || product.sku
  const inStock = hasVariants ? (isCombinationExisting && isCombinationInStock) : (Number(product.stock) > 0)
  const lowStock = inStock && currentStock <= 5
  const off = currentOldPrice > currentPrice ? Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100) : 0
  const savings = Math.max(0, currentOldPrice - currentPrice)
  const liked = wishlist.includes(product.id)
  const stars = Math.round(avgRating)
  const category = categories.find(c => c.name === product.category)
  const specs = product.specs?.length ? product.specs : [
    { label: 'Category', value: product.category },
    { label: 'SKU', value: currentSku },
    { label: 'Stock', value: `${currentStock} units` },
  ]
  const tiers = product.bulkTiers?.length ? product.bulkTiers : [{ minQty: 1, price: currentPrice }]

  const submitReview = async e => {
    e.preventDefault()
    if (!review.name.trim()) {
      notify('Please enter your full name', 'warning')
      return
    }
    await addReview({
      productId: product.id,
      rating: review.rating || 5,
      title: review.title.trim() || 'Verified Customer Review',
      text: review.body.trim() || 'Great product!',
      name: review.name.trim(),
    })
    setSent(true)
    setWriting(false)
    notify('Thank you for your review! We appreciate your valuable feedback.')
    setReview({ rating: 5, title: '', body: '', name: '' })
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: product.name, url })
      else { await navigator.clipboard?.writeText(url); notify('Product link copied') }
    } catch { /* user cancelled */ }
  }

  return (
    <main className="qpdp">
      <div className="qg-container">
        <nav className="qcat-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span>/</span>
          <Link to="/shop">Shop</Link><span>/</span>
          {category && <><Link to={`/category/${category.slug}`}>{category.name}</Link><span>/</span></>}
          <span className="qcat-crumb-current">{product.name}</span>
        </nav>
      </div>

      <div className="qg-container">
        <div className="qpdp-top">
          {/* ── Gallery ─────────────────────────────────── */}
          <div className="qpdp-gallery">
            <div className={`qpdp-main ${activeMedia?.type === 'video' ? 'is-video' : ''}`}>
              {activeMedia?.type === 'video' ? (
                <video key={activeMedia.src} src={activeMedia.src} poster={product.image} controls autoPlay playsInline />
              ) : (
                <div
                  ref={lensContainerRef}
                  className="qpdp-lens-container"
                  onMouseMove={handleMouseMove}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => setLightbox(true)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'zoom-in',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={activeMedia?.src || product.image}
                    alt={product.name}
                    onError={(e) => {
                      if (product.image && e.target.src !== product.image) {
                        e.target.src = product.image
                      }
                    }}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      display: 'block',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    ref={lensRef}
                    className="qpdp-glass-lens"
                    style={{
                      backgroundImage: `url("${(activeMedia?.src || product.image || '').replace(/"/g, '\\"')}")`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />

                  {/* Dedicated Fullscreen / Lightbox Expand Icon */}
                  <button
                    type="button"
                    className="qpdp-expand-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLightbox(true)
                    }}
                    title="Expand to Fullscreen"
                    aria-label="Expand image to fullscreen"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                </div>
              )}
              {off > 0 && <span className="qg-card-off">{off}% OFF</span>}
              {media.length > 1 && (
                <>
                  <button className="qpdp-nav l" onClick={() => setMediaIndex(i => (i - 1 + media.length) % media.length)} aria-label="Previous image">‹</button>
                  <button className="qpdp-nav r" onClick={() => setMediaIndex(i => (i + 1) % media.length)} aria-label="Next image">›</button>
                </>
              )}
              <span className="qpdp-media-count">{mediaIndex + 1} / {media.length}</span>
            </div>

            <div className="qpdp-thumbs" role="tablist" aria-label="Product media">
              {media.map((m, i) => (
                <button
                  key={m.key}
                  type="button"
                  role="tab"
                  aria-selected={i === mediaIndex}
                  className={`${i === mediaIndex ? 'on' : ''} ${m.type === 'video' ? 'is-video' : ''}`}
                  onClick={() => setMediaIndex(i)}
                  aria-label={m.type === 'video' ? 'Play product video' : `View image ${i + 1}`}
                >
                  <img
                    src={m.type === 'video' ? product.image : m.src}
                    alt=""
                    onError={(e) => {
                      if (product.image && e.target.src !== product.image) {
                        e.target.src = product.image
                      }
                    }}
                  />
                  {m.type === 'video' && <span className="qpdp-thumb-play">▶</span>}
                </button>
              ))}
            </div>

            {product.video && (
              <button type="button" className="qpdp-video-cta" onClick={() => setMediaIndex(media.length - 1)}>
                <span>▶</span> Watch product video
              </button>
            )}
          </div>

          {/* ── Info ────────────────────────────────────── */}
          <div className="qpdp-info">
            {/* ── Dynamic Color Swatches (Positioned directly under thumbnails on mobile via flex order) ── */}
            {hasVariants && colorOption && colorOption.values?.length > 0 && (
              <div className="qpdp-color-picker-wrap">
                <div className="qpdp-color-header">
                  <span className="qpdp-color-label">
                    Color: <strong className="qpdp-color-value-green">{selectedColor}</strong>
                  </span>
                </div>
                <div className="qpdp-color-swatches">
                  {colorOption.values.map(val => {
                    const cName = typeof val === 'string' ? val : val.name
                    const rawHex = typeof val === 'object' && val.hex ? val.hex : null
                    const cHex = rawHex || KNOWN_COLOR_HEX[cName?.toLowerCase()] || '#475569'
                    const isSelected = selectedColor?.toLowerCase() === cName?.toLowerCase()
                    const exists = doesCombinationExist(colorOption.name, cName)
                    const isAvailable = exists && isValAvailable(colorOption.name, cName)

                    return (
                      <button
                        key={cName}
                        type="button"
                        onClick={() => {
                          setSelectedOptions(prev => ({ ...prev, [colorOption.name]: cName }))
                          setMediaIndex(0)
                        }}
                        title={!exists ? `${cName} (Unavailable)` : !isAvailable ? `${cName} (Out of Stock)` : cName}
                        aria-label={`Select color ${cName}`}
                        className={`qpdp-color-swatch-btn ${isSelected ? 'active' : ''}`}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: cHex,
                          border: cHex.toLowerCase() === '#ffffff' || cHex.toLowerCase() === '#fff' ? '1.5px solid #cbd5e1' : '2px solid #ffffff',
                          outline: 'none',
                          boxShadow: isSelected
                            ? '0 0 0 2px #ffffff, 0 0 0 4px #10b981'
                            : '0 0 0 1px rgba(0,0,0,0.15)',
                          cursor: exists ? 'pointer' : 'not-allowed',
                          padding: 0,
                          opacity: !exists ? 0.35 : !isAvailable ? 0.6 : 1,
                          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!exists && (
                          <span
                            style={{
                              position: 'absolute',
                              width: '100%',
                              height: '2px',
                              backgroundColor: '#ef4444',
                              transform: 'rotate(-45deg)',
                            }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="qpdp-meta">
              <span className="qpdp-meta-brand">{product.brand || 'Save & Smile'}</span>
              {category && <><i /><Link to={`/category/${category.slug}`} className="qpdp-meta-cat">{product.category}</Link></>}
            </div>
            <h1>{product.name}</h1>
            <div className="qpdp-rating">
              {reviewCount > 0 ? (
                <>
                  <span className="qpdp-stars">{Array.from({ length: 5 }).map((_, i) => <Star key={i} fill={i < stars} />)}</span>
                  <b>{avgRating.toFixed(1)}</b>
                  <button type="button" onClick={() => { document.getElementById('customer-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
                    ({reviewCount} verified review{reviewCount === 1 ? '' : 's'})
                  </button>
                </>
              ) : (
                <>
                  <span className="qpdp-stars">{Array.from({ length: 5 }).map((_, i) => <Star key={i} fill={false} />)}</span>
                  <span className="qpdp-rating-none">No reviews yet</span>
                  <span className="qpdp-rating-sep">•</span>
                  <button
                    type="button"
                    className="qpdp-write-review-btn"
                    onClick={() => { document.getElementById('customer-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
                  >
                    Write the first review
                  </button>
                </>
              )}
            </div>

            <div className="qpdp-price">
              <div className="qpdp-price-left">
                <b>Rs. {currentPrice.toLocaleString()}</b>
                {off > 0 && <del>Rs. {currentOldPrice.toLocaleString()}</del>}
                {off > 0 && <span className="qpdp-off">{off}% Off</span>}
              </div>
              <div className="qpdp-price-right">
                <span className={`qpdp-stock ${inStock ? '' : 'out'}`}><i />{!isCombinationExisting ? 'Unavailable' : inStock ? (lowStock ? `Only ${currentStock} left` : 'In Stock') : 'Out of Stock'}</span>
                <button className="qpdp-share" aria-label="Share product" onClick={share}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="18" cy="5" r="2.4" /><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="19" r="2.4" />
                    <path d="M8.2 10.9l7.6-4.5M8.2 13.1l7.6 4.5" />
                  </svg>
                </button>
              </div>
            </div>
            {savings > 0 && <p className="qpdp-saving">You save Rs. {savings.toLocaleString()} · wholesale rate</p>}

            {/* ── Dynamic Other Options (Size, Storage, Material, etc.) ── */}
            {hasVariants && otherOptions.length > 0 && (
              <div className="qpdp-other-options-wrap" style={{ margin: '14px 0 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {otherOptions.map(opt => {
                  const currentVal = selectedOptions[opt.name] || ''
                  return (
                    <div key={opt.name} className="qpdp-variant-group">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                          {opt.name}: <strong style={{ color: '#0f766e', fontWeight: 700 }}>{currentVal}</strong>
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        {(opt.values || []).map(val => {
                          const valName = typeof val === 'string' ? val : val.name
                          const isSelected = currentVal.toLowerCase() === valName.toLowerCase()
                          const exists = doesCombinationExist(opt.name, valName)
                          const isAvailable = exists && isValAvailable(opt.name, valName)

                          return (
                            <button
                              key={valName}
                              type="button"
                              onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: valName }))}
                              disabled={!exists}
                              title={!exists ? `${valName} (Unavailable)` : !isAvailable ? `${valName} (Out of Stock)` : valName}
                              style={{
                                minWidth: '44px',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                border: isSelected
                                  ? '2px solid #0d9488'
                                  : exists
                                  ? '1px solid #cbd5e1'
                                  : '1px dashed #cbd5e1',
                                backgroundColor: isSelected
                                  ? '#0d9488'
                                  : !exists
                                  ? '#f8fafc'
                                  : '#ffffff',
                                color: isSelected
                                  ? '#ffffff'
                                  : !exists
                                  ? '#94a3b8'
                                  : !isAvailable
                                  ? '#94a3b8'
                                  : '#1e293b',
                                fontSize: '13px',
                                fontWeight: isSelected ? 700 : 500,
                                cursor: exists ? 'pointer' : 'not-allowed',
                                textDecoration: (!exists || !isAvailable) ? 'line-through' : 'none',
                                opacity: !exists ? 0.45 : !isAvailable ? 0.7 : 1,
                                transition: 'all 0.15s ease',
                                boxShadow: isSelected ? '0 2px 4px rgba(13, 148, 136, 0.25)' : 'none',
                              }}
                            >
                              {valName}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <ul className="qpdp-highlights">
              {(product.highlights?.length ? product.highlights : [
                'Wholesale pricing for resellers & retailers',
                'Cash on delivery all over Pakistan',
                'Dispatched quickly with reliable tracking',
              ]).slice(0, 4).map(h => <li key={h}><span>✓</span>{h}</li>)}
            </ul>

            {/* Action Buttons matching User Request:
                Row 1: Quantity + ADD TO CART + BUY NOW (Same line, slender font)
                Row 2: BUY IN WHOLESALE + Wishlist Heart button (Same line) */}
            <div className="qpdp-actions-container" ref={mainActionsRef}>
              <div className="qpdp-action-row1">
                <div className="qpdp-qty">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(Number(currentStock) || 99, q + 1))} aria-label="Increase quantity">+</button>
                </div>
                <button
                  className="qpdp-btn-cart-teal"
                  disabled={!inStock}
                  onClick={() => add(product, qty, activeVariant)}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <span>{!isCombinationExisting ? 'UNAVAILABLE' : inStock ? 'ADD TO CART' : 'OUT OF STOCK'}</span>
                </button>
                <button
                  className="qpdp-btn-buynow-lime"
                  disabled={!inStock}
                  onClick={() => { buyNow(product, qty, activeVariant); navigate('/checkout') }}
                >
                  <span>{!isCombinationExisting ? 'UNAVAILABLE' : 'BUY NOW'}</span>
                  <span className="qpdp-arrow">→</span>
                </button>
              </div>

              <div className="qpdp-action-row2">
                <a
                  className="qpdp-btn-wholesale-pill"
                  href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
                    `Hi Save & Smile, I want to Buy in Wholesale:\n*${product.name}*${activeVariant ? `\nVariant: ${activeVariant.title}` : ''}\nProduct SKU: ${currentSku || product.id}\nQuantity: ${qty >= 5 ? qty : 10}+ pcs\nLink: https://saveandsmile.vercel.app${productPath(product)}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Buy in Wholesale on WhatsApp"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span>BUY IN WHOLESALE</span>
                </a>
                <button className={`qpdp-wish ${liked ? 'on' : ''}`} onClick={() => toggleWish(product.id)} aria-label="Add to wishlist" title={liked ? 'In Wishlist' : 'Add to Wishlist'}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill={liked ? '#e11d48' : 'none'} stroke={liked ? '#e11d48' : 'currentColor'} strokeWidth="1.8">
                    <path d="M12 20.3l-1.4-1.3C5.4 14.3 2 11.2 2 7.4 2 4.3 4.3 2 7.4 2c1.8 0 3.5.9 4.6 2.3C13.1 2.9 14.8 2 16.6 2 19.7 2 22 4.3 22 7.4c0 3.8-3.4 6.9-8.6 11.6L12 20.3z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Delivery */}
            <div className="qpdp-delivery">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p className="qpdp-label" style={{ margin: 0 }}>Estimated Delivery Schedule</p>
                <span style={{ fontSize: '11px', color: delivery === 'karachi' ? '#047857' : '#2563eb', fontWeight: 600 }}>
                  {delivery === 'karachi' ? '📍 Karachi Express Rider' : '🇵🇰 Nationwide Courier'}
                </span>
              </div>

              <div className="qpdp-dtabs">
                <button
                  type="button"
                  className={delivery === 'karachi' ? 'on' : ''}
                  onClick={() => setDelivery('karachi')}
                >
                  Within Karachi (1–2 Days)
                </button>
                <button
                  type="button"
                  className={delivery === 'city' ? 'on' : ''}
                  onClick={() => setDelivery('city')}
                >
                  Out of Karachi (2–4 Days)
                </button>
              </div>

              <div className="qpdp-timeline">
                <div className="qpdp-step">
                  <span className="qpdp-step-ico" style={{ background: '#f0fdf9', border: '1.5px solid #a7f3d0', color: '#047857' }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </span>
                  <b>Purchased</b>
                  <small>Today</small>
                </div>

                <div className="qpdp-step">
                  <span className="qpdp-step-ico" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', color: '#1d4ed8' }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" rx="1" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </span>
                  <b>Dispatch</b>
                  <small>Tomorrow</small>
                </div>

                <div className="qpdp-step">
                  <span className="qpdp-step-ico" style={{ background: delivery === 'karachi' ? '#f0fdf4' : '#fffbeb', border: delivery === 'karachi' ? '1.5px solid #86efac' : '1.5px solid #fde68a', color: delivery === 'karachi' ? '#15803d' : '#b45309' }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </span>
                  <b>Delivered</b>
                  <small>{delivery === 'karachi' ? '1–2 Days' : '2–4 Days'}</small>
                </div>
              </div>

              {/* Informative distinction box */}
              <div style={{
                marginTop: '14px',
                background: delivery === 'karachi' ? '#f0fdf4' : '#f8fafc',
                border: delivery === 'karachi' ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                fontSize: '11.5px',
                color: delivery === 'karachi' ? '#166534' : '#334155'
              }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{delivery === 'karachi' ? '⚡' : '🚚'}</span>
                <div>
                  <strong>{delivery === 'karachi' ? 'Within Karachi City Delivery:' : 'Out of Karachi (Nationwide):'}</strong>{' '}
                  {delivery === 'karachi'
                    ? 'Fast local rider delivery in 1–2 days. Doorstep Cash on Delivery (Shipping Rs. 200).'
                    : 'Dispatched via TCS / Leopards / Trax in 2–4 working days. Cash on Delivery across Pakistan (Shipping Rs. 250).'}
                </div>
              </div>
            </div>

            <div className="qpdp-trust">
              {TRUST_BADGES.map(b => (
                <div key={b.title}><img src={b.image} alt="" /><span>{b.title}</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Detail tabs ─────────────────────────────── */}
        <section className="qpdp-details" id="pdp-tabs">
          <div className="qpdp-tabbar" role="tablist">
            {[
              ['description', 'Description'],
              ['specs', 'Specifications'],
              ['shipping', 'Shipping & Payment'],
              ['reviews', `Customer Reviews (${reviewCount})`],
            ].map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                className={tab === key ? 'on' : ''}
                onClick={() => {
                  if (key === 'reviews') {
                    document.getElementById('customer-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  } else {
                    setTab(key)
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'description' && (
            <div className="qpdp-tabpanel">
              <div>
                <h2>About this product</h2>
                <p>{product.description}</p>
                <ul className="qpdp-detail-list">
                  {(product.highlights || []).map(h => <li key={h}>{h}</li>)}
                </ul>
              </div>
              {product.video && (
                <div className="qpdp-detail-video">
                  <video src={product.video} controls playsInline poster={product.image} preload="metadata" />
                  <span>Product video</span>
                </div>
              )}
            </div>
          )}

          {tab === 'specs' && (
            <div className="qpdp-tabpanel">
              <table className="qpdp-specs">
                <tbody>
                  {specs.map(row => (
                    <tr key={row.label}>
                      <th>{row.label}</th>
                      <td>{row.label?.toLowerCase() === 'brand' && row.value === 'Qadri Select' ? 'Save & Smile' : row.value}</td>
                    </tr>
                  ))}
                  <tr><th>Items per pack</th><td>1</td></tr>
                  <tr><th>Sold by</th><td>Save & Smile</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {tab === 'shipping' && (
            <div className="qpdp-tabpanel qpdp-shipping">
              <div>
                <h2>Delivery</h2>
                <p>Karachi deliveries usually arrive in <b>1–2 working days</b>. Out-of-city orders take <b>2–4 working days</b> through our courier partners. Orders confirmed before 4 PM are dispatched the same or next working day.</p>
                <p>Shipping is <b>Rs. {BRAND.shippingFee}</b> and becomes <b>free on orders above Rs. {BRAND.freeShippingThreshold.toLocaleString()}</b>. Express delivery is available at checkout.</p>
              </div>
              <div>
                <h2>Payment</h2>
                <p>Cash on Delivery (COD) is available across Pakistan. Bank transfer, Easypaisa and JazzCash are also accepted — our team shares the account details after your order is confirmed.</p>
                <p className="qpdp-note">All products are sold as-is, with no warranty, return or exchange unless stated on the product page.</p>
              </div>
            </div>
          )}
        </section>

        {/* ── Dedicated "Leave a Review" & Verified Reviews Section under Description ── */}
        <section className="qpdp-reviews-section" id="customer-reviews">
          <div className="qpdp-rev-top">
            <div className="qpdp-rev-score">
              <b>{reviewCount > 0 ? avgRating.toFixed(1) : '0.0'}</b>
              <span>{Array.from({ length: 5 }).map((_, i) => <Star key={i} fill={i < stars} />)}</span>
              <small>{reviewCount} verified review{reviewCount === 1 ? '' : 's'}</small>
            </div>
            <div className="qpdp-rev-title">
              <h2>Customer Reviews &amp; Ratings</h2>
              <p>Authentic feedback from verified shoppers and resellers</p>
            </div>
          </div>

          <div className="qpdp-rev-columns">
            {/* Left Column: Leave a Review Form */}
            <div className="qpdp-review-form-box">
              <h3>Leave a Review</h3>
              <p className="qpdp-form-subtext">Share your honest thoughts and experience with this item.</p>
              <form onSubmit={submitReview} className="qpdp-inline-form">
                <div className="qpdp-form-field">
                  <label>Your Rating *</label>
                  <div className="qpdp-form-stars">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setReview(r => ({ ...r, rating: n }))} aria-label={`${n} stars`}>
                        <Star fill={n <= review.rating} size={22} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="qpdp-form-field">
                  <label>Your Full Name *</label>
                  <input required value={review.name} onChange={e => setReview(r => ({ ...r, name: e.target.value }))} placeholder="e.g. Asad Ali" />
                </div>
                <div className="qpdp-form-field">
                  <label>Review Headline</label>
                  <input value={review.title} onChange={e => setReview(r => ({ ...r, title: e.target.value }))} placeholder="e.g. Excellent quality, fast dispatch!" />
                </div>
                <div className="qpdp-form-field">
                  <label>Feedback Message</label>
                  <textarea rows="3" value={review.body} onChange={e => setReview(r => ({ ...r, body: e.target.value }))} placeholder="Write your experience with delivery and product quality…" />
                </div>
                <button className="qpdp-btn-submit-review" type="submit">
                  Submit Review
                </button>
              </form>
              {sent && (
                <div className="qpdp-review-alert-success">
                  ✓ Thank you for your review! We appreciate your valuable feedback.
                </div>
              )}
            </div>

            {/* Right Column: Approved Product Reviews */}
            <div className="qpdp-reviews-feed">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 className="qpdp-feed-title" style={{ margin: 0 }}>
                  Verified Buyer Feedback ({productReviews.length})
                </h3>
              </div>
              {productReviews.length === 0 ? (
                <div className="qpdp-no-reviews">
                  <p>No verified reviews for this item yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="qpdp-rev-list">
                  {productReviews.map((r, i) => (
                    <article className="qpdp-rev-card" key={r.id || i}>
                      <div className="qpdp-rev-head">
                        <span className={`qpdp-avatar a${i % 5}`}>{(r.name || 'Customer').charAt(0).toUpperCase()}</span>
                        <div>
                          <b>{r.name || 'Verified Customer'}</b>
                          <span className="qpdp-rev-stars">
                            {Array.from({ length: 5 }).map((_, k) => <Star key={k} fill={k < (Number(r.rating) || 5)} size={11} />)}
                            <em>✓ Verified</em>
                          </span>
                        </div>
                      </div>
                      <div className="qpdp-rev-body">
                        {r.title && <b>{r.title}</b>}
                        <p>{r.text}</p>
                      </div>
                      <div className="qpdp-rev-foot"><span>{r.date || 'Recently'}</span><span>Verified Purchase</span></div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="qpdp-related">
            <h2>You may also like</h2>
            <div className="qcat-grid cols-4 qpdp-related-grid">
              {related.map(p => <ProductCard key={p.id} product={p} context="related" />)}
            </div>
            <div className="qg-see-more" style={{ marginTop: '22px' }}>
              <button onClick={() => navigate('/shop')}>
                See All Products <span>→</span>
              </button>
            </div>
          </section>
        )}
      </div>

      {lightbox && (
        <div className="qpdp-lightbox" role="dialog" aria-modal="true" aria-label={product.name} onClick={() => setLightbox(false)}>
          <button className="qpdp-lightbox-x" onClick={() => setLightbox(false)} aria-label="Close image">✕</button>
          <img src={activeMedia?.src || product.image} alt={product.name} onClick={e => e.stopPropagation()} />
          {media.filter(m => m.type === 'image').length > 1 && (
            <div className="qpdp-lightbox-thumbs" onClick={e => e.stopPropagation()}>
              {media.filter(m => m.type === 'image').map((m, i) => (
                <button key={m.key} className={activeMedia?.src === m.src ? 'on' : ''} onClick={() => setMediaIndex(i)}>
                  <img src={m.src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Fixed Floating Action Bar for Quick Cart / Buy Now (Appears only when main Buy Now button scrolls off screen) ── */}
      {showStickyBar && (
        <aside className="qpdp-sticky-bar" aria-label="Product quick actions">
          <div className="qpdp-sticky-qty">
            <button
              type="button"
              onClick={() => setQty(q => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span>{qty}</span>
            <button
              type="button"
              onClick={() => setQty(q => Math.min(Number(currentStock) || 99, q + 1))}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="qpdp-sticky-btn-cart"
            disabled={!inStock}
            onClick={() => add(product, qty, activeVariant)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 6h15l-1.5 9h-12z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="19" r="1.5" fill="currentColor" />
              <circle cx="18" cy="19" r="1.5" fill="currentColor" />
              <path d="M3 3h3" strokeLinecap="round" />
            </svg>
            <span>{!isCombinationExisting ? 'UNAVAILABLE' : inStock ? 'ADD TO CART' : 'OUT OF STOCK'}</span>
          </button>

          <button
            type="button"
            className="qpdp-sticky-btn-buynow"
            disabled={!inStock}
            onClick={() => {
              buyNow(product, qty, activeVariant)
              navigate('/checkout')
            }}
          >
            <span>{!isCombinationExisting ? 'UNAVAILABLE' : 'BUY NOW'}</span>
            <span className="qpdp-sticky-arrow">→</span>
          </button>

          <a
            href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
              `Hi Save & Smile, I want to order this product:\n*${product.name}*${activeVariant ? `\nVariant: ${activeVariant.title}` : ''}\nPrice: Rs. ${currentPrice}\nQuantity: ${qty}\nLink: https://saveandsmile.vercel.app${productPath(product)}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="qpdp-sticky-wa"
            title="Order directly on WhatsApp"
            aria-label="Order on WhatsApp"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15c-1.52 0-3-.4-4.31-1.16l-.31-.18-3.2.84.85-3.12-.2-.32a8.19 8.19 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.82c0 4.55-3.7 8.25-8.25 8.25zm4.52-6.17c-.25-.12-1.47-.72-1.7-.8-.23-.09-.39-.12-.56.12-.17.25-.64.8-.79.97-.15.17-.29.2-.54.07-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.45.06-.69.32-.23.25-.89.87-.89 2.12s.91 2.46 1.04 2.63c.12.17 1.79 2.73 4.34 3.83.61.26 1.08.42 1.45.54.61.19 1.17.17 1.61.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z" />
            </svg>
          </a>
        </aside>
      )}
    </main>
  )
}
