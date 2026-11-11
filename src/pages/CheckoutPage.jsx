import { useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router'
import { CITIES } from '../data'
import { useCart } from '../context/CartContext'
import { useStoreData } from '../context/StoreDataContext'

const PAYMENTS = [
  { id: 'cod', label: 'Cash on Delivery', note: 'Pay in cash when your order arrives', icon: '💵' },
  { id: 'bank', label: 'Bank Transfer', note: 'Account details shared after confirmation', icon: '🏦' },
  { id: 'wallet', label: 'Easypaisa / JazzCash', note: 'Pay from your mobile wallet', icon: '📱' },
]

export default function CheckoutPage() {
  const { items, total, setQty, remove, clear, notify } = useCart()
  const { user } = useOutletContext()
  const { coupons = [], storeSettings, addOrder } = useStoreData()
  const navigate = useNavigate()

  const [f, setF] = useState({
    name: user?.name || '', mobile: user?.mobile || '', email: user?.email || '',
    city: user?.city || '', address: '', notes: '',
  })
  const [deliveryId, setDeliveryId] = useState('standard')
  const [paymentId, setPaymentId] = useState('cod')
  const [code, setCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponMsg, setCouponMsg] = useState('')
  const [done, setDone] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const upd = k => e => setF({ ...f, [k]: e.target.value })

  const deliveryOptions = useMemo(() => [
    {
      id: 'standard',
      label: 'Standard delivery',
      note: '2–4 working days',
      fee: total >= storeSettings.freeShippingThreshold ? 0 : storeSettings.shippingFee,
    },
    { id: 'express', label: 'Express delivery', note: '1–2 working days', fee: storeSettings.expressShippingFee || 350 },
    { id: 'pickup', label: 'Store pickup', note: 'Ready in 2 hours · Saddar, Karachi', fee: 0 },
  ], [total, storeSettings])

  const delivery = deliveryOptions.find(d => d.id === deliveryId) || deliveryOptions[0]

  const discount = useMemo(() => {
    if (!coupon) return 0
    if (coupon.type === 'percent') return Math.min(Math.round(total * (coupon.value / 100)), coupon.maxDiscount || Infinity)
    if (coupon.type === 'fixed') return Math.min(coupon.value, total)
    return 0
  }, [coupon, total])

  const shipping = coupon?.type === 'shipping' ? 0 : delivery.fee
  const grand = Math.max(0, total - discount + shipping)
  const valid = f.name.trim() && /^[0-9+\-\s]{10,}$/.test(f.mobile) && f.city && (deliveryId === 'pickup' || f.address.trim())

  const applyCoupon = e => {
    e?.preventDefault()
    const value = code.trim().toUpperCase()
    if (!value) return
    const found = coupons.find(c => c.active !== false && c.code.toUpperCase() === value)
    if (!found) {
      setCoupon(null)
      setCouponMsg('That coupon code is not valid.')
      return
    }
    if (total < (found.minOrder || 0)) {
      setCoupon(null)
      setCouponMsg(`Add Rs. ${(found.minOrder - total).toLocaleString()} more to use ${found.code}.`)
      return
    }
    setCoupon(found)
    setCouponMsg(`✓ ${found.description}`)
    notify(`Coupon ${found.code} applied`)
  }

  const removeCoupon = () => {
    setCoupon(null)
    setCode('')
    setCouponMsg('')
  }

  const submit = async e => {
    e.preventDefault()
    if (!valid || !items.length || submitting) return
    setSubmitting(true)
    const orderItems = items.map(i => ({
      ...i,
      productId: i.product.id,
      variantId: i.variant?.id || null,
      variantTitle: i.variant?.title || [i.variant?.color, i.variant?.size].filter(Boolean).join(' / ') || '',
      color: i.variant?.color || '',
      size: i.variant?.size || '',
      sku: i.variant?.sku || i.product.sku,
      unitPrice: Number(i.variant?.price ?? i.product.price),
    }))

    const localOrder = {
      id: `QG-${Date.now().toString().slice(-6)}`,
      name: f.name, mobile: f.mobile, email: f.email, city: f.city, address: deliveryId === 'pickup' ? 'Store pickup · Saddar, Karachi' : f.address,
      notes: f.notes,
      items: orderItems, subtotal: total, discount, coupon: coupon?.code || '', shipping, total: grand,
      delivery: delivery.label, payment: PAYMENTS.find(p => p.id === paymentId)?.label,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    }
    try {
      try {
        const prev = JSON.parse(localStorage.getItem('qg_orders') || '[]')
        localStorage.setItem('qg_orders', JSON.stringify([localOrder, ...prev]))
      } catch {}

      const created = await addOrder({
        customer: { name: f.name, mobile: f.mobile, email: f.email, city: f.city, address: localOrder.address },
        items: orderItems,
        subtotal: total,
        discount,
        coupon: coupon?.code || '',
        shipping,
        total: grand,
        deliveryMethod: delivery.label,
        paymentMethod: PAYMENTS.find(p => p.id === paymentId)?.label,
        notes: f.notes,
      })
      setDone({
        ...localOrder,
        id: created?.id || localOrder.id,
        total: Number(created?.total ?? localOrder.total ?? 0),
        discount: Number(created?.discount ?? localOrder.discount ?? 0),
      })
      clear()
      notify('Order placed successfully!')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      notify(err.message || 'Failed to place order. Please try again.', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  if (!items.length && !done) {
    return (
      <main className="qcheckout">
        <div className="qcheckout-empty">
          <div className="qcheckout-empty-ico">🛒</div>
          <h1>Your Cart Is Empty</h1>
          <p>Browse the catalogue and add a few wholesale favourites first.</p>
          <Link className="qg-btn qg-btn-primary" to="/shop">Start Shopping</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="qcheckout">
      <div className="qg-container">
        <nav className="qcat-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span>/</span><span>Cart</span><span>/</span><span>Checkout</span>
        </nav>

        <div className="qcheckout-steps">
          <span className="done">1<em>Cart</em></span>
          <i />
          <span className={done ? 'done' : 'on'}>2<em>Delivery &amp; payment</em></span>
          <i />
          <span className={done ? 'on' : ''}>3<em>Confirmation</em></span>
        </div>

        {done ? (
          <div className="qcheckout-done">
            <span className="qcheckout-check">✓</span>
            <h1>Thank you for your order!</h1>
            <p>Your order <b>#{done.id}</b> has been received. Our team will call you on <b>{done.mobile}</b> to confirm.</p>
            <div className="qcheckout-done-box">
              <div><span>Total payable</span><b>Rs. {Number(done.total || 0).toLocaleString()}</b></div>
              <div><span>Delivery</span><b>{done.city || 'Karachi'} · {done.delivery || 'Standard delivery'}</b></div>
              <div><span>Payment</span><b>{done.payment || 'Cash on Delivery'}</b></div>
              {Number(done.discount || 0) > 0 && <div><span>Coupon ({done.coupon})</span><b className="qcheckout-save">− Rs. {Number(done.discount || 0).toLocaleString()}</b></div>}
            </div>
            {done.payment && done.payment !== 'Cash on Delivery' && (
              <div className="qcheckout-done-instructions">
                <b>Next step</b>
                <p>Our team will WhatsApp the {done.payment} account details to <b>{done.mobile}</b>. Send the payment screenshot there and we will dispatch your parcel the same working day.</p>
              </div>
            )}
            <div className="qcheckout-done-actions">
              <Link className="qg-btn qg-btn-primary" to="/shop">Continue Shopping</Link>
              <button className="qg-btn qg-btn-outline" onClick={() => navigate('/account?tab=orders')}>View My Orders</button>
            </div>
          </div>
        ) : (
          <form className="qcheckout-grid" onSubmit={submit}>
            <div className="qcheckout-form">
              <h2>My Delivery Address</h2>
              <div className="qcheckout-row">
                <label>Full Name *<input required value={f.name} onChange={upd('name')} placeholder="Your name" autoComplete="name" /></label>
                <label>Mobile Number *<input required inputMode="tel" value={f.mobile} onChange={upd('mobile')} placeholder="03XX-XXXXXXX" autoComplete="tel" /></label>
              </div>
              <div className="qcheckout-row">
                <label>City *
                  <select required value={f.city} onChange={upd('city')} autoComplete="address-level2">
                    <option value="">Select City</option>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label>Email (optional)<input type="email" value={f.email} onChange={upd('email')} placeholder="you@example.com" autoComplete="email" /></label>
              </div>
              {deliveryId !== 'pickup' && (
                <label>Complete Address *<textarea required rows="3" value={f.address} onChange={upd('address')} placeholder="House / street / area" autoComplete="street-address" /></label>
              )}

              <h2 className="qcheckout-h2">Delivery method</h2>
              <div className="qcheckout-choices">
                {deliveryOptions.map(d => (
                  <label key={d.id} className={`qcheckout-choice ${deliveryId === d.id ? 'on' : ''}`}>
                    <input type="radio" name="delivery" checked={deliveryId === d.id} onChange={() => setDeliveryId(d.id)} />
                    <span><b>{d.label}</b><small>{d.note}</small></span>
                    <em>{d.fee === 0 ? 'Free' : `Rs. ${d.fee}`}</em>
                  </label>
                ))}
              </div>

              <h2 className="qcheckout-h2">Payment method</h2>
              <div className="qcheckout-choices">
                {PAYMENTS.map(p => (
                  <label key={p.id} className={`qcheckout-choice ${paymentId === p.id ? 'on' : ''}`}>
                    <input type="radio" name="pay" checked={paymentId === p.id} onChange={() => setPaymentId(p.id)} />
                    <span><b>{p.icon} {p.label}</b><small>{p.note}</small></span>
                  </label>
                ))}
              </div>

              <label>Order notes (optional)<textarea rows="2" value={f.notes} onChange={upd('notes')} placeholder="Delivery instructions, preferred time, reseller details…" /></label>
              <p className="qcheckout-note">By placing the order you agree to our <Link to="/terms-conditions">Terms &amp; Conditions</Link> and <Link to="/privacy-policy">Privacy Policy</Link>.</p>
            </div>

            <aside className="qcheckout-summary">
              <h2>Order Summary</h2>
              <div className="qcheckout-sum-items">
                {items.map(i => {
                  const itemKey = i.key || `${i.product.id}${i.variant ? `-v${i.variant.id || i.variant.sku}` : ''}`
                  const price = i.variant?.price ?? i.product.price
                  const variantTitle = i.variant?.title || [i.variant?.color, i.variant?.size].filter(Boolean).join(' / ')
                  return (
                    <div className="qcheckout-sum-row" key={itemKey}>
                      <img src={i.variant?.image || i.product.image} alt="" />
                      <div>
                        <b>{i.product.name}</b>
                        {variantTitle && (
                          <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, margin: '1px 0 2px' }}>
                            {variantTitle}
                          </div>
                        )}
                        <small>Rs. {price.toLocaleString()} each</small>
                        <span className="qcheckout-qty">
                          <button type="button" onClick={() => setQty(itemKey, i.qty - 1)} aria-label="Decrease quantity">−</button>
                          <em>{i.qty}</em>
                          <button type="button" onClick={() => setQty(itemKey, i.qty + 1)} aria-label="Increase quantity">+</button>
                          <button type="button" className="qcheckout-remove" onClick={() => remove(itemKey)}>Remove</button>
                        </span>
                      </div>
                      <span>Rs. {(i.qty * price).toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>

              <div className="qcheckout-coupon">
                {coupon ? (
                  <div className="qcheckout-coupon-applied">
                    <div><b>{coupon.code}</b><small>{coupon.description}</small></div>
                    <button type="button" onClick={removeCoupon}>Remove</button>
                  </div>
                ) : (
                  <div className="qcheckout-coupon-row">
                    <input value={code} onChange={e => { setCode(e.target.value); setCouponMsg('') }} placeholder="Coupon code" aria-label="Coupon code" />
                    <button type="button" onClick={applyCoupon}>Apply</button>
                  </div>
                )}
                {couponMsg && <p className={coupon ? 'ok' : 'err'}>{couponMsg}</p>}
                {!coupon && !couponMsg && <p className="qcheckout-coupon-hint">Try WELCOME10, FREESHIP or BULK5</p>}
              </div>

              <div className="qcheckout-line"><span>Subtotal</span><b>Rs. {total.toLocaleString()}</b></div>
              {discount > 0 && <div className="qcheckout-line discount"><span>Coupon discount</span><b>− Rs. {discount.toLocaleString()}</b></div>}
              <div className="qcheckout-line"><span>Delivery · {delivery.label}</span><b>{shipping === 0 ? 'Free' : `Rs. ${shipping}`}</b></div>
              <div className="qcheckout-line total"><span>Total</span><b>Rs. {grand.toLocaleString()}</b></div>
              {shipping > 0 && deliveryId === 'standard' && (
                <p className="qcheckout-ship-note">Add Rs. {(storeSettings.freeShippingThreshold - total).toLocaleString()} more for free standard delivery.</p>
              )}
              <button className="qg-btn qg-btn-primary qg-btn-block" disabled={!valid || submitting}>
                {submitting ? 'Placing Order...' : `Place Order · Rs. ${grand.toLocaleString()}`}
              </button>
              <p className="qcheckout-secure">🔒 Secure checkout · Cash on delivery all over Pakistan</p>
            </aside>
          </form>
        )}
      </div>
    </main>
  )
}
