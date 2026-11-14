import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BRAND, CITIES } from '../data'
import { productPath } from '../content'
import { useCart } from '../context/CartContext'
import { useStoreData } from '../context/StoreDataContext'

const Close = ({ onClick, className = '' }) => (
  <button type="button" className={`qg-close ${className}`} onClick={onClick} aria-label="Close">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg>
  </button>
)

export function CartDrawer() {
  const { cartOpen, setCartOpen, items, setQty, remove, total } = useCart()
  const navigate = useNavigate()
  if (!cartOpen) return null
  const savings = items.reduce((n, i) => {
    const price = i.variant?.price ?? i.product.price
    const oldPrice = i.variant?.oldPrice ?? i.product.oldPrice
    return n + Math.max(0, (oldPrice || price) - price) * i.qty
  }, 0)
  return (
    <div className="qg-overlay" onClick={() => setCartOpen(false)}>
      <aside className="qg-cart" onClick={e => e.stopPropagation()} role="dialog" aria-label="Shopping cart">
        <div className="qg-cart-head">
          <div>
            <b>Shopping Cart</b>
            <small>{items.length} item{items.length === 1 ? '' : 's'}</small>
          </div>
          <button className="qg-cart-close" onClick={() => setCartOpen(false)} aria-label="Close cart">✕</button>
        </div>

        <div className="qg-cart-body">
          {items.length === 0 ? (
            <div className="qg-cart-empty">
              <div className="qg-cart-empty-icon">🛍️</div>
              <p>Your cart is empty!</p>
              <span>Browse the store and add products to your cart.</span>
              <button className="qg-btn qg-btn-primary" onClick={() => setCartOpen(false)}>Return To Shop</button>
            </div>
          ) : items.map((item) => {
            const { product, qty, variant } = item
            const itemKey = item.key || `${product.id}${variant ? `-v${variant.id || variant.sku}` : ''}`
            const price = variant?.price ?? product.price
            const oldPrice = variant?.oldPrice ?? product.oldPrice
            const variantTitle = variant?.title || [variant?.color, variant?.size].filter(Boolean).join(' / ')
            return (
              <div className="qg-cart-row" key={itemKey}>
                <img src={variant?.image || product.image} alt={product.name} className="qg-cart-thumb" width="56" height="56" />
                <div className="qg-cart-info">
                  <b>{product.name}</b>
                  {variantTitle && (
                    <span className="qg-cart-variant-tag" style={{ display: 'inline-block', fontSize: '11px', background: '#f1f5f9', color: '#334155', padding: '1px 6px', borderRadius: '4px', margin: '2px 0 3px' }}>
                      {variantTitle}
                    </span>
                  )}
                  <span className="qg-cart-prices">
                    <em>Rs. {price.toLocaleString()}</em>
                    {oldPrice > price && <del>Rs. {oldPrice.toLocaleString()}</del>}
                  </span>
                  <div className="qg-qty">
                    <button onClick={() => setQty(itemKey, qty - 1)} aria-label="Decrease quantity">−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty(itemKey, qty + 1)} aria-label="Increase quantity">+</button>
                  </div>
                </div>
                <button className="qg-cart-remove" onClick={() => remove(itemKey)} aria-label="Remove item">🗑</button>
              </div>
            )
          })}
        </div>

        {items.length > 0 && (
          <div className="qg-cart-foot">
            {savings > 0 && <p className="qg-cart-save">You save Rs. {savings.toLocaleString()} on this order 🎉</p>}
            <div className="qg-cart-total"><span>Subtotal</span><b>Rs. {total.toLocaleString()}</b></div>
            <button className="qg-btn qg-btn-primary qg-btn-block" onClick={() => { setCartOpen(false); navigate('/checkout') }}>
              Checkout · Rs. {total.toLocaleString()}
            </button>
            <button className="qg-cart-continue" onClick={() => setCartOpen(false)}>Continue shopping</button>
          </div>
        )}
      </aside>
    </div>
  )
}

export function AddedModal() {
  const { added, setAdded, setCartOpen } = useCart()
  if (!added) return null
  const { product, variant } = added
  const price = variant?.price ?? product.price
  const variantTitle = variant?.title || [variant?.color, variant?.size].filter(Boolean).join(' / ')
  return (
    <div className="qg-overlay" onClick={() => setAdded(null)}>
      <div className="qg-modal qg-added" onClick={e => e.stopPropagation()} role="dialog" aria-label="Added to cart">
        <Close onClick={() => setAdded(null)} />
        <h3>Your Item has been added to Cart</h3>
        <div className="qg-added-body">
          <img src={variant?.image || product.image} alt={product.name} width="64" height="64" />
          <div>
            <b>{product.name}</b>
            {variantTitle && (
              <span style={{ display: 'inline-block', fontSize: '12px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', margin: '3px 0' }}>
                {variantTitle}
              </span>
            )}
            <p>Rs. {price.toLocaleString()}</p>
          </div>
        </div>
        <div className="qg-added-actions">
          <button className="qg-btn qg-btn-outline" onClick={() => setAdded(null)}>Continue Shopping</button>
          <button className="qg-btn qg-btn-primary" onClick={() => { setAdded(null); setCartOpen(true) }}>View Cart</button>
        </div>
      </div>
    </div>
  )
}

export function QuickView() {
  const { quickView: p, setQuickView, add, buyNow, toggleWish, wishlist } = useCart()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  if (!p) return null
  const liked = wishlist.includes(p.id)
  const close = () => { setQuickView(null); setQty(1) }
  const off = p.oldPrice > p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0
  return (
    <div className="qg-overlay" onClick={close}>
      <div className="qg-modal qg-quick" onClick={e => e.stopPropagation()} role="dialog" aria-label="Quick view">
        <Close onClick={close} />
        <div className="qg-quick-grid">
          <div className="qg-quick-media">
            <img src={p.image} alt={p.name} />
          </div>
          <div className="qg-quick-info">
            <p className="qg-quick-cat">{p.category}</p>
            <h3>{p.name}</h3>
            <div className="qg-quick-rating">
              <span className="qg-stars">{'★★★★★'}</span>
              <small>({p.reviewsCount || 12} reviews)</small>
              <small className="qg-stock">In stock</small>
            </div>
            <div className="qg-quick-price">
              <b>Rs. {p.price.toLocaleString()}</b>
              {off > 0 && <del>Rs. {p.oldPrice.toLocaleString()}</del>}
              {off > 0 && <span>Save {off}%</span>}
            </div>
            <p className="qg-quick-desc">
              Premium quality product, checked before dispatch. Cash on delivery available all over Pakistan.
            </p>
            <div className="qg-quick-buy">
              <div className="qg-qty lg">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} aria-label="Increase">+</button>
              </div>
              <button className="qg-btn qg-btn-primary" onClick={() => { add(p, qty); close() }}>Add to cart</button>
              <button className="qg-btn qg-btn-dark" onClick={() => { close(); buyNow(p, qty); navigate('/checkout') }}>Buy Now</button>
            </div>
            <button className={`qg-quick-wish ${liked ? 'on' : ''}`} onClick={() => toggleWish(p.id)}>
              <span>♡</span> {liked ? 'Saved to wishlist' : 'Add to wishlist'}
            </button>
            <Link className="qg-quick-more" to={productPath(p)} onClick={close}>View full details →</Link>
            <div className="qg-quick-trust">
              <span>🚚 Fast delivery</span><span>💵 Cash on delivery</span><span>↩️ Easy returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CheckoutModal({ onPlaced }) {
  const { checkout, setCheckout, clear, notify } = useCart()
  const storeData = useStoreData()
  const [f, setF] = useState({ name: '', mobile: '', city: '', address: '', notes: '' })
  const [done, setDone] = useState(null)
  if (!checkout) return null
  const subtotal = checkout.reduce((n, i) => n + i.qty * i.product.price, 0)
  const shipping = subtotal >= BRAND.freeShippingThreshold ? 0 : BRAND.shippingFee
  const total = subtotal + shipping
  const upd = k => e => setF({ ...f, [k]: e.target.value })
  const valid = f.name.trim() && /^[0-9+\-\s]{10,}$/.test(f.mobile) && f.city && f.address.trim()
  const close = () => { setCheckout(null); setDone(null) }

  const submit = e => {
    e.preventDefault()
    if (!valid) return
    const order = {
      id: `QG-${Date.now().toString().slice(-6)}`,
      name: f.name, mobile: f.mobile, city: f.city, address: f.address, notes: f.notes,
      items: checkout, subtotal, shipping, total,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    }
    try {
      const prev = JSON.parse(localStorage.getItem('qg_orders') || '[]')
      localStorage.setItem('qg_orders', JSON.stringify([order, ...prev]))
    } catch {}
    storeData?.addOrder?.({ name: f.name, mobile: f.mobile, city: f.city, address: f.address, items: checkout, total, notes: f.notes })
    clear()
    setDone(order)
    onPlaced?.(order)
    notify('Order placed successfully!')
  }

  return (
    <div className="qg-overlay" onClick={close}>
      <div className="qg-modal qg-checkout" onClick={e => e.stopPropagation()} role="dialog" aria-label="Checkout">
        <Close onClick={close} />
        <div className="qg-checkout-head">
          <h3>Place Order</h3>
          <p>Cash on delivery · Free delivery over Rs. {BRAND.freeShippingThreshold.toLocaleString()}</p>
        </div>
        {done ? (
          <div className="qg-checkout-done">
            <div className="qg-done-icon">✓</div>
            <h3>Thank you for your order!</h3>
            <p>Your order <b>#{done.id}</b> has been received. Our team will call you on <b>{done.mobile}</b> to confirm.</p>
            <div className="qg-done-sum">
              <span>Total (pay on delivery)</span><b>Rs. {done.total.toLocaleString()}</b>
            </div>
            <button className="qg-btn qg-btn-primary" onClick={close}>Continue Shopping</button>
          </div>
        ) : (
          <form className="qg-checkout-grid" onSubmit={submit}>
            <div className="qg-form">
              <label>Full Name *<input value={f.name} onChange={upd('name')} required placeholder="Your name" /></label>
              <label>Mobile Number *<input value={f.mobile} onChange={upd('mobile')} inputMode="tel" required placeholder="03XX-XXXXXXX" /></label>
              <label>City *
                <select value={f.city} onChange={upd('city')} required>
                  <option value="">Select City</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label>Complete Address *<textarea rows="3" value={f.address} onChange={upd('address')} required placeholder="House / street / area" /></label>
              <label>Order Notes<textarea rows="2" value={f.notes} onChange={upd('notes')} placeholder="Optional" /></label>
              <div className="qg-pay-option">
                <span className="qg-pay-radio" /> <b>Cash on Delivery (COD)</b>
                <small>Pay when you receive your order</small>
              </div>
            </div>
            <aside className="qg-summary">
              <h4>Order Summary</h4>
              {checkout.map(i => (
                <div className="qg-sum-row" key={i.product.id}>
                  <img src={i.product.image} alt={i.product.name} width="48" height="48" />
                  <div><b>{i.product.name}</b><small>Qty: {i.qty}</small></div>
                  <span>Rs. {(i.qty * i.product.price).toLocaleString()}</span>
                </div>
              ))}
              <div className="qg-sum-line"><span>Subtotal</span><b>Rs. {subtotal.toLocaleString()}</b></div>
              <div className="qg-sum-line"><span>Shipping</span><b>{shipping === 0 ? 'Free' : `Rs. ${shipping}`}</b></div>
              <div className="qg-sum-line total"><span>Total</span><b>Rs. {total.toLocaleString()}</b></div>
              <button className="qg-btn qg-btn-primary qg-btn-block" disabled={!valid}>Place Order</button>
              <p className="qg-sum-note">By placing the order you agree to our Terms &amp; Conditions.</p>
            </aside>
          </form>
        )}
      </div>
    </div>
  )
}

export function AuthModal({ onLogin }) {
  const { auth: mode, setAuth, notify } = useCart()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  if (!mode) return null
  const close = () => setAuth(null)
  const upd = k => e => setForm({ ...form, [k]: e.target.value })
  const submit = e => {
    e.preventDefault()
    const user = { name: mode === 'signup' ? form.name : (form.email.split('@')[0] || 'Reseller'), email: form.email }
    onLogin?.(user)
    notify(mode === 'login' ? `Welcome back, ${user.name}!` : 'Account created successfully!')
    close()
  }
  return (
    <div className="qg-overlay" onClick={close}>
      <div className="qg-modal qg-auth" onClick={e => e.stopPropagation()} role="dialog" aria-label={mode === 'login' ? 'Login' : 'Sign Up'}>
        <Close onClick={close} />
        <div className="qg-auth-head">
          <img src={BRAND.logo} alt={BRAND.name} height="46" />
          <h3>{mode === 'login' ? 'Login to your account' : 'Create your account'}</h3>
          <p>{mode === 'login' ? 'Welcome back! Please enter your details.' : 'Join thousands of resellers shopping at wholesale rates.'}</p>
        </div>
        <form className="qg-form" onSubmit={submit}>
          {mode === 'signup' && <label>Full Name<input value={form.name} onChange={upd('name')} required placeholder="Your name" /></label>}
          <label>Email or Mobile<input value={form.email} onChange={upd('email')} required placeholder="you@example.com" /></label>
          <label>Password<input type="password" value={form.password} onChange={upd('password')} required minLength={4} placeholder="••••••••" /></label>
          <button className="qg-btn qg-btn-primary qg-btn-block">{mode === 'login' ? 'Login' : 'Sign Up'}</button>
        </form>
        <p className="qg-auth-switch">
          {mode === 'login'
            ? <>New here? <button onClick={() => setAuth('signup')}>Create an account</button></>
            : <>Already registered? <button onClick={() => setAuth('login')}>Login</button></>}
        </p>
      </div>
    </div>
  )
}

export function WelcomePopup() {
  const { setAuth } = useCart()
  const [open, setOpen] = useState(() => {
    if (new URLSearchParams(window.location.search).has('nopopup')) return false
    try { return !sessionStorage.getItem('qg_welcome_seen') } catch { return true }
  })
  const browse = () => {
    try { sessionStorage.setItem('qg_welcome_seen', '1') } catch {}
    setOpen(false)
  }
  if (!open) return null
  return (
    <div className="qg-overlay qg-welcome-overlay" onClick={browse}>
      <div className="qg-welcome" onClick={e => e.stopPropagation()} role="dialog" aria-label="Welcome offer">
        <button className="qg-welcome-close" onClick={browse} aria-label="Close">✕</button>
        <img src="https://www.qadrigadgets.pk/images/banners/69d3c0cacfc5f.webp" alt="Welcome to Save &amp; Smile – reseller information" />
      </div>
    </div>
  )
}

export function InfoModal({ info, onClose }) {
  if (!info) return null
  const copy = {
    about: { h: 'About Us', p: 'Save & Smile is a wholesale and retail supplier of gadgets, home organizers, beauty accessories and electronic items in Pakistan. We serve resellers and shoppers with reliable quality at the best wholesale rates.' },
    terms: { h: 'Terms & Conditions', p: 'Orders are accepted from resellers and shopkeepers only. Product images are for reference; colours may vary. Prices are subject to change without notice. Delivery time is 2–4 working days.' },
    privacy: { h: 'Privacy Policy', p: 'We only collect the information required to process your order (name, phone number and address). We never sell or share your data with third parties.' },
    support: { h: 'Support', p: 'Need help with an order, product availability or wholesale pricing? Call us at 0321-8273588 or message us on WhatsApp — our team is available 24/7.' },
    account: { h: 'My Account', p: 'Login to track your orders, save addresses and manage your wishlist. If you are a new reseller, create an account to get wholesale pricing.' },
  }[info] || { h: 'Contact Us', p: 'Reach us on WhatsApp or call us any time.' }

  return (
    <div className="qg-overlay" onClick={onClose}>
      <div className="qg-modal qg-info" onClick={e => e.stopPropagation()} role="dialog" aria-label={copy.h}>
        <Close onClick={onClose} />
        <h3>{copy.h}</h3>
        <p>{copy.p}</p>
        <div className="qg-info-actions">
          <a className="qg-btn qg-btn-primary" href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp us</a>
          <a className="qg-btn qg-btn-outline" href={`tel:${BRAND.tel}`}>Call {BRAND.phone}</a>
        </div>
      </div>
    </div>
  )
}

export function MyOrdersModal({ open, onClose }) {
  const [orders] = useState(() => { try { return JSON.parse(localStorage.getItem('qg_orders') || '[]') } catch { return [] } })
  if (!open) return null
  return (
    <div className="qg-overlay" onClick={onClose}>
      <div className="qg-modal qg-orders" onClick={e => e.stopPropagation()} role="dialog" aria-label="My orders">
        <Close onClick={onClose} />
        <h3>My Orders</h3>
        {orders.length === 0 ? (
          <p className="qg-muted">You have not placed any orders yet. Start shopping and your orders will appear here.</p>
        ) : orders.map(o => (
          <div className="qg-order-card" key={o.id}>
            <div className="qg-order-top"><b>#{o.id}</b><span>{o.date}</span><em>Pending</em></div>
            <p>{o.items.length} item{o.items.length > 1 ? 's' : ''} · Rs. {o.total.toLocaleString()} · {o.city}</p>
            <div className="qg-order-thumbs">{o.items.map(i => <img key={i.product.id} src={i.product.image} alt="" />)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Toast() {
  const { toast } = useCart()
  return toast ? <div className="qg-toast" role="status">{toast}</div> : null
}

