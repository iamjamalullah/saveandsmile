import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

function getItemKey(product, variant) {
  const pId = product?.id || product
  if (!variant) return String(pId)
  return `${pId}-v${variant.id || variant.sku || `${variant.color || ''}-${variant.size || ''}`}`
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => load('qg_cart', []))
  const [wishlist, setWishlist] = useState(() => load('qg_wishlist', []))
  const [cartOpen, setCartOpen] = useState(false)
  const [quickView, setQuickView] = useState(null)
  const [added, setAdded] = useState(null) // product added → success modal
  const [checkout, setCheckout] = useState(null)
  const [auth, setAuth] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => { try { localStorage.setItem('qg_cart', JSON.stringify(items)) } catch {} }, [items])
  useEffect(() => { try { localStorage.setItem('qg_wishlist', JSON.stringify(wishlist)) } catch {} }, [wishlist])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2400)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    document.body.classList.toggle('qg-noscroll', cartOpen || !!quickView || !!auth || !!checkout || !!added)
  }, [cartOpen, quickView, auth, checkout, added])

  const value = useMemo(() => ({
    items, wishlist, cartOpen, quickView, checkout, auth, added, toast,
    count: items.reduce((n, i) => n + i.qty, 0),
    total: items.reduce((n, i) => {
      const price = (i.variant?.price !== undefined && i.variant?.price !== null) ? Number(i.variant.price) : Number(i.product.price)
      return n + i.qty * price
    }, 0),
    setCartOpen, setQuickView, setCheckout, setAuth, setAdded,
    add(product, qty = 1, variant = null) {
      const itemKey = getItemKey(product, variant)
      setItems(prev => {
        const found = prev.find(i => (i.key || String(i.product.id)) === itemKey)
        if (found) return prev.map(i => (i.key || String(i.product.id)) === itemKey ? { ...i, qty: i.qty + qty } : i)
        return [...prev, { product, variant: variant || null, qty, key: itemKey }]
      })
      setAdded({ product, variant, qty })
      setToast('Added to cart')
    },
    buyNow(product, qty = 1, variant = null) {
      const itemKey = getItemKey(product, variant)
      const newItem = { product, variant: variant || null, qty, key: itemKey }
      setItems(prev => {
        const found = prev.find(i => (i.key || String(i.product.id)) === itemKey)
        if (found) return prev.map(i => (i.key || String(i.product.id)) === itemKey ? { ...i, qty: i.qty + qty } : i)
        return [...prev, newItem]
      })
      setCheckout([newItem])
    },
    addQuiet(product, qty = 1, variant = null) {
      const itemKey = getItemKey(product, variant)
      setItems(prev => {
        const found = prev.find(i => (i.key || String(i.product.id)) === itemKey)
        if (found) return prev.map(i => (i.key || String(i.product.id)) === itemKey ? { ...i, qty: i.qty + qty } : i)
        return [...prev, { product, variant: variant || null, qty, key: itemKey }]
      })
    },
    setQty(keyOrId, qty) {
      const target = String(keyOrId)
      setItems(prev => qty < 1
        ? prev.filter(i => String(i.key || i.product.id) !== target)
        : prev.map(i => String(i.key || i.product.id) === target ? { ...i, qty } : i)
      )
    },
    remove(keyOrId) {
      const target = String(keyOrId)
      setItems(prev => prev.filter(i => String(i.key || i.product.id) !== target))
    },
    clear() { setItems([]) },
    toggleWish(id) {
      setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    },
    notify: setToast,
  }), [items, wishlist, cartOpen, quickView, checkout, auth, added, toast])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
