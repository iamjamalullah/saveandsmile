import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'

const StoreDataContext = createContext(null)
export const useStoreData = () => useContext(StoreDataContext)

const DEFAULT_SETTINGS = {
  name: 'Save & Smile',
  tagline: 'Your Trusted Online Shopping Hub',
  phone: '0333-7221552',
  whatsapp: '923337221552',
  email: null,
  address: 'Karachi, Pakistan',
  currency: 'Rs.',
  freeShippingThreshold: 3000,
  shippingFee: 200,
  expressShippingFee: 350,
  taxRate: 0,
  allowGuestCheckout: true,
  announcement: 'Join Our Community Group Today Send Your Name, City & Area to 0333-7221552',
}

const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const makeSlug = (name, sku) => `${slugify(name).slice(0, 70)}--${String(sku).toLowerCase()}`

const EMPTY = {
  products: [],
  categories: [],
  heroSlides: [],
  sections: [],
  reviews: [],
  orders: [],
  contacts: [],
  watchShop: [],
  coupons: [],
  settings: [],
}

export function StoreDataProvider({ children }) {
  const [data, setData] = useState(EMPTY)
  const [storeSettings, setStoreSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adminToast, setAdminToast] = useState(null)
  const [notifications, setNotifications] = useState([])

  const toastTimerRef = useRef(null)

  const notify = useCallback((message, variant = 'success') => {
    setAdminToast({ message, variant })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setAdminToast(null), 3200)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  // ── Public Storefront Bootstrap (EXCLUDES SENSITIVE CUSTOMER ORDERS) ──
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [products, categories, heroSlides, sections, reviews, watchShop, coupons, settings] = await Promise.all([
        api.list('products'),
        api.list('categories'),
        api.list('heroSlides'),
        api.list('sections'),
        api.list('reviews'),
        api.list('watchShop'),
        api.list('coupons'),
        api.list('settings'),
      ])
      const rawProducts = Array.isArray(products) ? products : []
      const sortedProducts = [...rawProducts].sort((a, b) => {
        if (b.createdAt && a.createdAt) {
          const diff = new Date(b.createdAt) - new Date(a.createdAt)
          if (diff !== 0) return diff
        }
        return (Number(b.id) || 0) - (Number(a.id) || 0)
      })
      setData(prev => ({
        ...prev,
        products: sortedProducts,
        categories: categories || [],
        heroSlides: heroSlides || [],
        sections: sections || [],
        reviews: reviews || [],
        watchShop: watchShop || [],
        coupons: coupons || [],
        settings: settings || [],
      }))
      setStoreSettings({ ...DEFAULT_SETTINGS, ...(settings?.[0] || {}) })
    } catch (err) {
      console.warn('Bootstrap data fetch warning:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── helpers ───────────────────────────────────────────────
  const replaceLocal = useCallback((resource, updater) => {
    setData(prev => ({ ...prev, [resource]: updater(prev[resource] || []) }))
  }, [])

  const patch = useCallback(async (resource, id, fields, message = 'Saved successfully') => {
    let before
    setData(prev => {
      before = prev[resource]
      return {
        ...prev,
        [resource]: (prev[resource] || []).map(item => (item.id === id ? { ...item, ...fields } : item)),
      }
    })
    try {
      const saved = await api.patch(resource, id, fields)
      replaceLocal(resource, list => list.map(item => (item.id === id ? saved : item)))
      if (message) notify(message)
      return saved
    } catch (err) {
      if (before) replaceLocal(resource, () => before)
      notify(err.message, 'danger')
      return null
    }
  }, [replaceLocal, notify])

  // ── orders (Authorized Staff Only) ────────────────────────
  const loadOrders = useCallback(async () => {
    try {
      const orders = await api.list('orders')
      const orderList = Array.isArray(orders) ? orders : []
      setData(prev => ({ ...prev, orders: orderList }))
      return orderList
    } catch (err) {
      console.warn('Orders access error:', err.message)
      return []
    }
  }, [])

  const addOrder = useCallback(async orderData => {
    const subtotal = orderData.subtotal ?? orderData.total ?? 0
    const shipping = orderData.shipping ?? (subtotal >= storeSettings.freeShippingThreshold ? 0 : storeSettings.shippingFee)
    const newOrder = {
      id: `GS-ORD-${Date.now().toString().slice(-6)}`,
      customer: {
        name: orderData.customer?.name || orderData.name || 'Guest Customer',
        mobile: orderData.customer?.mobile || orderData.mobile || '',
        email: orderData.customer?.email || orderData.email || '',
        city: orderData.customer?.city || orderData.city || '',
        address: orderData.customer?.address || orderData.address || '',
      },
      items: orderData.items || [],
      subtotal,
      discount: orderData.discount || 0,
      coupon: orderData.coupon || '',
      shippingFee: shipping,
      total: orderData.total ?? subtotal + shipping,
      deliveryMethod: orderData.deliveryMethod || 'Standard',
      paymentMethod: orderData.paymentMethod || 'Cash on Delivery (COD)',
      status: 'Pending',
      date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      notes: orderData.notes || '',
    }
    try {
      const created = await api.create('orders', newOrder)
      const mergedOrder = {
        ...newOrder,
        ...(created || {}),
        customer: newOrder.customer,
        items: newOrder.items,
      }
      replaceLocal('orders', list => [mergedOrder, ...list])
      const customerName = created?.customer?.name || newOrder.customer?.name || 'Customer'
      setNotifications(prev => [{
        id: Date.now(),
        title: `New order ${created?.id || mergedOrder.id} received from ${customerName}`,
        time: 'Just now',
        unread: true,
        type: 'order',
      }, ...prev])
      return mergedOrder
    } catch (err) {
      notify(err.message, 'danger')
      return null
    }
  }, [storeSettings, replaceLocal, notify])

  const updateOrderStatus = useCallback((orderId, status, trackingNumber = '') =>
    patch('orders', orderId, { status, ...(trackingNumber ? { trackingNumber } : {}) }, `Order ${orderId} updated to ${status}`),
    [patch]
  )

  const deleteOrder = useCallback(async orderId => {
    try {
      await api.remove('orders', orderId)
      replaceLocal('orders', list => list.filter(o => o.id !== orderId))
      notify(`Order ${orderId} deleted`, 'warning')
      return true
    } catch (err) {
      notify(err.message, 'danger')
      return false
    }
  }, [replaceLocal, notify])

  // ── products ──────────────────────────────────────────────
  const addProduct = useCallback(async p => {
    const productsList = data.products || []
    const nextId = productsList.length ? Math.max(...productsList.map(x => Number(x.id) || 0)) + 1 : 1
    const sku = p.sku || `QGW-${1000 + nextId}`
    const image = p.image || '/images/p1.jpg'
    const body = {
      id: nextId,
      name: p.name,
      slug: makeSlug(p.name, sku),
      category: p.category || 'General',
      group: p.group || 'new',
      price: Number(p.price) || 0,
      oldPrice: Number(p.oldPrice) || Number(p.price) || 0,
      image,
      images: p.images?.length ? p.images : [image],
      video: p.video || '',
      stock: Number(p.stock) || 10,
      sku,
      brand: (p.brand === 'Qadri Select' ? 'Save & Smile' : p.brand) || 'Save & Smile',
      description: p.description || '',
      highlights: p.highlights || [],
      specs: p.specs || [],
      bulkTiers: p.bulkTiers || [{ minQty: 1, price: Number(p.price) || 0 }],
      featured: Boolean(p.featured),
      rating: 5,
      reviewsCount: 0,
      hasVariants: Boolean(p.hasVariants),
      variantConfig: p.variantConfig || 'none',
      options: p.options || [],
      variants: p.variants || [],
      colorImages: p.colorImages || [],
      createdAt: p.createdAt || new Date().toISOString(),
    }
    try {
      const created = await api.create('products', body)
      replaceLocal('products', list => [created, ...list.filter(item => item.id !== created.id)])
      notify(`Product "${created.name}" added successfully!`)
      return created
    } catch (err) {
      notify(err.message, 'danger')
      return null
    }
  }, [data.products, replaceLocal, notify])

  const deleteProduct = useCallback(async id => {
    const target = (data.products || []).find(p => p.id === id)
    try {
      await api.remove('products', id)
      replaceLocal('products', list => list.filter(p => p.id !== id))
      notify(`Product "${target?.name || id}" removed.`, 'warning')
      return true
    } catch (err) {
      notify(err.message, 'danger')
      return false
    }
  }, [data.products, replaceLocal, notify])

  const toggleProductStock = useCallback(id => {
    const product = (data.products || []).find(p => p.id === id)
    return patch('products', id, { stock: product?.stock > 0 ? 0 : 15 }, 'Stock status toggled')
  }, [data.products, patch])

  // ── categories ────────────────────────────────────────────
  const addCategory = useCallback(async cat => {
    const cats = data.categories || []
    if (cats.some(c => c.name.toLowerCase() === cat.name.trim().toLowerCase())) {
      notify('A category with this name already exists', 'danger')
      return false
    }
    const body = {
      id: cats.length ? Math.max(...cats.map(c => Number(c.id) || 0)) + 1 : 1,
      name: cat.name.trim(),
      slug: slugify(cat.name),
      icon: cat.icon || '📦',
      image: cat.image || '/images/cat1.jpg',
    }
    try {
      const created = await api.create('categories', body)
      replaceLocal('categories', list => [...list, created])
      notify(`Category "${created.name}" added!`)
      return true
    } catch (err) {
      notify(err.message, 'danger')
      return false
    }
  }, [data.categories, replaceLocal, notify])

  const updateCategory = useCallback(async (oldName, fields) => {
    const category = (data.categories || []).find(c => c.name === oldName)
    if (!category) return
    const next = { ...fields, ...(fields.name ? { slug: slugify(fields.name) } : {}) }
    const saved = await patch('categories', category.id, next, 'Category updated')
    if (saved && fields.name && fields.name !== oldName) {
      const affected = (data.products || []).filter(p => p.category === oldName)
      replaceLocal('products', list => list.map(p => (p.category === oldName ? { ...p, category: fields.name } : p)))
      affected.forEach(p => api.patch('products', p.id, { category: fields.name }).catch(() => {}))
    }
  }, [data.categories, data.products, patch, replaceLocal])

  const deleteCategory = useCallback(async catName => {
    const category = (data.categories || []).find(c => c.name === catName)
    if (!category) return
    try {
      await api.remove('categories', category.id)
      replaceLocal('categories', list => list.filter(c => c.name !== catName))
      notify(`Category "${catName}" deleted`, 'warning')
    } catch (err) {
      notify(err.message, 'danger')
    }
  }, [data.categories, replaceLocal, notify])

  // ── reviews ───────────────────────────────────────────────
  const loadReviews = useCallback(async () => {
    try {
      const list = await api.list('reviews')
      const revList = Array.isArray(list) ? list : []
      const sorted = [...revList].sort((a, b) => {
        const idA = Number(a.id) || 0
        const idB = Number(b.id) || 0
        if (idA && idB && idA !== idB) return idB - idA
        return (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
      })
      setData(prev => ({ ...prev, reviews: sorted }))
      return sorted
    } catch (err) {
      console.warn('Reviews load error:', err.message)
      return []
    }
  }, [])

  const addReview = useCallback(async rev => {
    const body = {
      id: Date.now(),
      name: rev.name || 'Customer',
      title: rev.title || 'Review',
      text: rev.text || rev.content || rev.body || '',
      rating: Number(rev.rating) || 5,
      whatsapp: rev.whatsapp || '',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'pending',
      ...(rev.productId ? { productId: rev.productId } : {}),
    }
    try {
      const created = await api.create('reviews', body)
      const finalReview = created || body
      replaceLocal('reviews', list => [finalReview, ...list])
      setNotifications(prev => [{
        id: Date.now(),
        title: `New review submitted by ${finalReview.name} (${finalReview.rating}★)`,
        time: 'Just now',
        unread: true,
        type: 'review',
      }, ...prev])
      notify('Thank you for your review! We appreciate your valuable feedback.')
      return finalReview
    } catch (err) {
      notify(err.message, 'danger')
      return null
    }
  }, [replaceLocal, notify])

  const toggleReviewStatus = useCallback(async indexOrId => {
    const review = (data.reviews || []).find((r, i) => r.id === indexOrId || i === indexOrId)
    if (!review) return
    return patch('reviews', review.id, { status: review.status === 'approved' ? 'hidden' : 'approved' }, 'Review status changed')
  }, [data.reviews, patch])

  const updateReviewStatus = useCallback(async (indexOrId, newStatus) => {
    const review = (data.reviews || []).find((r, i) => r.id === indexOrId || i === indexOrId)
    if (!review) return
    return patch('reviews', review.id, { status: newStatus }, `Review marked as ${newStatus}`)
  }, [data.reviews, patch])

  const deleteReview = useCallback(async indexOrId => {
    const review = (data.reviews || []).find((r, i) => r.id === indexOrId || i === indexOrId)
    if (!review) return
    try {
      await api.remove('reviews', review.id)
      replaceLocal('reviews', list => list.filter(r => r.id !== review.id))
      notify('Review removed', 'warning')
    } catch (err) {
      notify(err.message, 'danger')
    }
  }, [data.reviews, replaceLocal, notify])

  // ── contacts / inquiries ───────────────────────────────────
  const submitContact = useCallback(async payload => {
    const body = {
      id: Date.now(),
      ...payload,
      createdAt: new Date().toISOString(),
      dateFormatted: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }
    try {
      const created = await api.create('contacts', body)
      replaceLocal('contacts', list => [created, ...list])
      return created
    } catch (err) {
      notify(err.message, 'danger')
      throw err
    }
  }, [replaceLocal, notify])

  const loadContacts = useCallback(async () => {
    try {
      const contacts = await api.list('contacts')
      const list = Array.isArray(contacts) ? contacts : []
      setData(prev => ({ ...prev, contacts: list }))
      return list
    } catch (err) {
      console.warn('Contacts fetch error:', err.message)
      return []
    }
  }, [])

  // ── settings / misc ───────────────────────────────────────
  const updateStoreSettings = useCallback(async newSettings => {
    const before = storeSettings
    setStoreSettings(prev => ({ ...prev, ...newSettings }))
    try {
      const saved = await api.patch('settings', before.id || 1, newSettings)
      setStoreSettings(prev => ({ ...prev, ...(saved || {}) }))
      notify('Store settings updated successfully!')
    } catch (err) {
      setStoreSettings(before)
      notify(err.message, 'danger')
    }
  }, [storeSettings, notify])

  const setWatchShop = useCallback(async next => {
    const list = typeof next === 'function' ? next(data.watchShop || []) : next
    replaceLocal('watchShop', () => list)
    try {
      await Promise.all(list.map((item, i) => api.patch('watchShop', item.id ?? i + 1, item)))
    } catch (err) {
      notify(err.message, 'danger')
    }
  }, [data.watchShop, replaceLocal, notify])

  const resetToDefaults = useCallback(async () => {
    notify('Reloading catalogue data…', 'info')
    await load()
    notify('Data reloaded from the database', 'info')
  }, [load, notify])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }, [])

  const addHeroSlide = useCallback(async (slide) => {
    try {
      const position = slide.position || 'first'
      const newSlide = {
        id: Date.now(),
        image: slide.image,
        alt: slide.alt || 'Promotional Banner',
        link: slide.link || '/shop',
        title: slide.title || '',
        order: position === 'first' ? 1 : (data.heroSlides?.length || 0) + 1,
      }
      const created = await api.create('heroSlides', newSlide)

      let updatedList = []
      if (position === 'first') {
        const sortedExisting = [...(data.heroSlides || [])].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
        updatedList = [created, ...sortedExisting.map((s, idx) => ({ ...s, order: idx + 2 }))]
        replaceLocal('heroSlides', () => updatedList)
        await Promise.all(sortedExisting.map((s, idx) => api.patch('heroSlides', s.id, { ...s, order: idx + 2 })))
      } else {
        updatedList = [...(data.heroSlides || []), created]
        replaceLocal('heroSlides', () => updatedList)
      }
      notify('Hero slide added and published successfully!')
      return created
    } catch (err) {
      notify(err.message, 'danger')
      throw err
    }
  }, [data.heroSlides, replaceLocal, notify])

  const deleteHeroSlide = useCallback(async (id) => {
    const before = data.heroSlides
    const filtered = (data.heroSlides || []).filter(s => s.id !== id)
    replaceLocal('heroSlides', () => filtered)
    try {
      await api.remove('heroSlides', id)
      notify('Hero slide deleted successfully!')
    } catch (err) {
      replaceLocal('heroSlides', () => before)
      notify(err.message, 'danger')
      throw err
    }
  }, [data.heroSlides, replaceLocal, notify])

  const reorderHeroSlides = useCallback(async (slidesList) => {
    const before = data.heroSlides
    const ordered = slidesList.map((s, idx) => ({ ...s, order: idx + 1 }))
    replaceLocal('heroSlides', () => ordered)
    try {
      await Promise.all(ordered.map((s) => api.patch('heroSlides', s.id, { ...s, order: s.order })))
      notify('Hero slides order saved and published live!')
    } catch (err) {
      replaceLocal('heroSlides', () => before)
      notify(err.message, 'danger')
      throw err
    }
  }, [data.heroSlides, replaceLocal, notify])

  const saveSectionsLayout = useCallback(async (sectionsList) => {
    const before = data.sections
    replaceLocal('sections', () => sectionsList)
    try {
      await api.homepage.publish(sectionsList, 'Sections layout updated')
      notify('Homepage sections layout saved and published live!')
    } catch (err) {
      replaceLocal('sections', () => before)
      notify(err.message, 'danger')
      throw err
    }
  }, [data.sections, replaceLocal, notify])

  const loadDraftSections = useCallback(async () => {
    try {
      const draft = await api.homepage.getDraft()
      return Array.isArray(draft) ? draft : []
    } catch (err) {
      console.warn('Failed to load draft sections:', err.message)
      return data.sections || []
    }
  }, [data.sections])

  const saveDraftSections = useCallback(async (sectionsList) => {
    try {
      const res = await api.homepage.saveDraft(sectionsList)
      notify('Draft saved! Live storefront remains unchanged until published.', 'info')
      return res
    } catch (err) {
      notify(err.message, 'danger')
      throw err
    }
  }, [notify])

  const publishHomepageSections = useCallback(async (sectionsList, label) => {
    try {
      const res = await api.homepage.publish(sectionsList, label)
      replaceLocal('sections', () => res.sections || sectionsList)
      notify('Homepage published live to storefront successfully!')
      return res
    } catch (err) {
      notify(err.message, 'danger')
      throw err
    }
  }, [replaceLocal, notify])

  const loadSectionVersions = useCallback(async () => {
    try {
      const versions = await api.homepage.getVersions()
      return Array.isArray(versions) ? versions : []
    } catch (err) {
      console.warn('Failed to load section versions:', err.message)
      return []
    }
  }, [])

  const restoreSectionVersion = useCallback(async (versionId) => {
    try {
      const res = await api.homepage.restoreVersion(versionId)
      if (res && res.sections) {
        replaceLocal('sections', () => res.sections)
      }
      notify('Homepage restored to previous version and published live!')
      return res
    } catch (err) {
      notify(err.message, 'danger')
      throw err
    }
  }, [replaceLocal, notify])

  const value = useMemo(() => ({
    ...data,
    storeSettings,
    loading,
    error,
    reload: load,
    loadOrders,
    loadContacts,
    loadReviews,
    submitContact,
    notifications,
    adminToast,
    addProduct,
    updateProduct: (id, fields) => patch('products', id, fields, 'Product updated successfully!'),
    deleteProduct,
    toggleProductStock,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    addCategory,
    updateCategory,
    deleteCategory,
    addReview,
    updateReviewStatus,
    toggleReviewStatus,
    deleteReview,
    updateStoreSettings,
    setWatchShop,
    resetToDefaults,
    showToast: notify,
    notify,
    markAllNotificationsRead,
    addHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    saveSectionsLayout,
    loadDraftSections,
    saveDraftSections,
    publishHomepageSections,
    loadSectionVersions,
    restoreSectionVersion,
  }), [
    data,
    storeSettings,
    loading,
    error,
    notifications,
    adminToast,
    load,
    loadOrders,
    loadContacts,
    loadReviews,
    submitContact,
    addProduct,
    patch,
    deleteProduct,
    toggleProductStock,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    addCategory,
    updateCategory,
    deleteCategory,
    addReview,
    updateReviewStatus,
    toggleReviewStatus,
    deleteReview,
    updateStoreSettings,
    setWatchShop,
    resetToDefaults,
    notify,
    markAllNotificationsRead,
    addHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    saveSectionsLayout,
    loadDraftSections,
    saveDraftSections,
    publishHomepageSections,
    loadSectionVersions,
    restoreSectionVersion,
  ])

  return <StoreDataContext.Provider value={value}>{children}</StoreDataContext.Provider>
}
