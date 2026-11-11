import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router'
import { CITIES } from '../data'
import { useCart } from '../context/CartContext'
import { useStoreData } from '../context/StoreDataContext'
import ProductCard from '../components/ProductCard'

const readOrders = () => {
  try { return JSON.parse(localStorage.getItem('qg_orders') || '[]') } catch { return [] }
}

const statusOf = order => order.status || 'Pending'
const statusClass = status => statusOf(status).toLowerCase()

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { key: 'orders', label: 'Orders', icon: 'bi-receipt-cutoff' },
  { key: 'wishlist', label: 'Wishlist', icon: 'bi-heart' },
  { key: 'addresses', label: 'Addresses', icon: 'bi-geo-alt' },
  { key: 'details', label: 'Account details', icon: 'bi-person-gear' },
]

export default function AccountPage() {
  const { user, onLogin, onLogout } = useOutletContext()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some(t => t.key === params.get('tab')) ? params.get('tab') : 'dashboard'
  const { wishlist, addQuiet, notify, setCartOpen } = useCart()
  const { products = [] } = useStoreData()
  const orders = useMemo(readOrders, [])
  const wished = products.filter(p => wishlist.includes(p.id))

  const [form, setForm] = useState({ name: '', email: '', mobile: '', city: '', address: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      city: user.city || '',
      address: user.address || '',
    })
  }, [user])

  const setTab = key => setParams({ tab: key })
  const logout = () => { onLogout?.(); setParams({ tab: 'dashboard' }) }

  const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0)
  const activeOrders = orders.filter(order => ['Pending', 'Processing', 'Shipped'].includes(statusOf(order)))
  const initials = (user?.name || 'QG').split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()

  const reorder = order => {
    let added = 0
    ;(order.items || []).forEach(item => {
      if (item.product) { addQuiet(item.product, item.qty || 1); added += 1 }
    })
    if (added) {
      notify('Items added to your cart')
      setCartOpen(true)
    }
  }

  const saveDetails = event => {
    event.preventDefault()
    onLogin?.({ ...user, ...form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2600)
  }

  const orderCard = (order, compact = false) => (
    <article className="cp-order" key={order.id}>
      <div className="cp-order-top">
        <b>#{order.id}</b>
        <small>{order.date}</small>
        <span className={`cp-status ${statusClass(order)}`}>{statusOf(order)}</span>
      </div>
      <div className="cp-order-items">
        {(order.items || []).slice(0, compact ? 2 : 6).map((item, index) => (
          <div className="cp-order-item" key={`${order.id}-${item.product?.id || index}`}>
            <img src={item.product?.image} alt="" />
            <span>
              {item.product?.name || 'Product'}
              <small>Qty: {item.qty}</small>
            </span>
          </div>
        ))}
        {(order.items || []).length > (compact ? 2 : 6) && (
          <div className="cp-order-item"><span>+{order.items.length - (compact ? 2 : 6)} more items</span></div>
        )}
      </div>
      <div className="cp-order-bottom">
        <span className="cp-total">Total <b>Rs. {(order.total || 0).toLocaleString()}</b></span>
        <div className="cp-order-actions">
          {!compact && <Link className="cp-btn sm" to="/contact">Need help?</Link>}
          <button type="button" className="cp-btn sm soft" onClick={() => reorder(order)}>Reorder</button>
        </div>
      </div>
    </article>
  )

  const topbar = (
    <div className="cp-topbar">
      <div>
        <nav className="cp-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span>/</span><span>My Account</span>
        </nav>
        <h1>My Account</h1>
        <p>{user ? `Welcome back, ${user.name?.split(' ')[0] || 'there'} — manage your orders, wishlist and details.` : 'Sign in to manage your orders and saved details.'}</p>
      </div>
      <Link className="cp-shop-btn" to="/shop"><i className="bi bi-bag" /> Continue shopping</Link>
    </div>
  )

  if (!user) {
    return (
      <main className="cp-page">
        <div className="cp-wrap">
          {topbar}
          <div className="cp-guest">
            <div className="cp-guest-hero">
              <h2>Your wholesale account, in one place.</h2>
              <p>Track every parcel, reorder your best sellers and keep delivery details ready for a faster checkout.</p>
              <ul>
                <li><i className="bi bi-check2-circle" /> Live order tracking and order history</li>
                <li><i className="bi bi-check2-circle" /> Saved wishlist across all your devices</li>
                <li><i className="bi bi-check2-circle" /> Faster checkout with saved addresses</li>
                <li><i className="bi bi-check2-circle" /> Priority support for bulk and wholesale orders</li>
              </ul>
            </div>
            <div className="cp-guest-form">
              <h2>Sign in to continue</h2>
              <p>Use your account to see orders and saved items.</p>
              <Link className="cp-btn primary" to="/login">Login to my account</Link>
              <Link className="cp-btn" to="/signup">Create an account</Link>
              <button
                type="button"
                className="cp-guest-demo"
                onClick={() => onLogin?.({ name: 'Guest Reseller', email: 'guest@qadrigadgets.pk', city: 'Karachi' })}
              >
                Continue as demo reseller
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="cp-page">
      <div className="cp-wrap">
        {topbar}

        <div className="cp-layout">
          <aside className="cp-side">
            <div className="cp-side-hero">
              <div className="cp-avatar">{initials}</div>
              <div>
                <b>{user.name}</b>
                <small>{user.email}</small>
                <span className="cp-tier"><i className="bi bi-patch-check-fill" /> Wholesale customer</span>
              </div>
            </div>

            <nav className="cp-nav" aria-label="Account navigation">
              {TABS.map(item => (
                <button
                  key={item.key}
                  type="button"
                  className={tab === item.key ? 'on' : ''}
                  onClick={() => setTab(item.key)}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                  {item.key === 'orders' && orders.length > 0 && <b>{orders.length}</b>}
                  {item.key === 'wishlist' && wished.length > 0 && <b>{wished.length}</b>}
                </button>
              ))}
              <button type="button" className="cp-out" onClick={logout}>
                <i className="bi bi-box-arrow-right" />
                <span>Logout</span>
              </button>
            </nav>

            <div className="cp-support">
              <b>Need a hand?</b>
              <p>Our team replies on WhatsApp within working hours for bulk and delivery questions.</p>
              <Link to="/contact">Contact support →</Link>
            </div>
          </aside>

          <section className="cp-main">
            <h1>My Account</h1>

            {tab === 'dashboard' && (
              <>
                <div className="cp-stats">
                  <div className="cp-stat tone-green">
                    <i className="bi bi-receipt-cutoff" />
                    <b>{orders.length}</b>
                    <span>Total orders</span>
                  </div>
                  <div className="cp-stat tone-blue">
                    <i className="bi bi-truck" />
                    <b>{activeOrders.length}</b>
                    <span>In progress</span>
                  </div>
                  <div className="cp-stat tone-violet">
                    <i className="bi bi-heart" />
                    <b>{wished.length}</b>
                    <span>Wishlist items</span>
                  </div>
                  <div className="cp-stat tone-amber">
                    <i className="bi bi-wallet2" />
                    <b>Rs. {totalSpent.toLocaleString()}</b>
                    <span>Lifetime value</span>
                  </div>
                </div>

                <div className="cp-dash-grid">
                  <div>
                    <div className="cp-card">
                      <div className="cp-card-head">
                        <div>
                          <h2>Recent orders</h2>
                          <p>Your latest purchases and their delivery status</p>
                        </div>
                        <button type="button" className="cp-link" onClick={() => setTab('orders')}>View all →</button>
                      </div>
                      <div className="cp-card-body flush">
                        {orders.length === 0 ? (
                          <div className="cp-empty">
                            <i className="bi bi-bag" />
                            <b>No orders yet</b>
                            <p>Your first wholesale order will appear here.</p>
                            <Link className="cp-cta" to="/shop">Start shopping</Link>
                          </div>
                        ) : (
                          <div className="cp-orders">{orders.slice(0, 3).map(order => orderCard(order, true))}</div>
                        )}
                      </div>
                    </div>

                    <div className="cp-card">
                      <div className="cp-card-head">
                        <div>
                          <h2>Quick actions</h2>
                          <p>Everything you need in one click</p>
                        </div>
                      </div>
                      <div className="cp-card-body">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <Link className="cp-btn soft" to="/shop"><i className="bi bi-grid" /> Browse catalogue</Link>
                          <button type="button" className="cp-btn" onClick={() => setTab('wishlist')}><i className="bi bi-heart" /> View wishlist</button>
                          <button type="button" className="cp-btn" onClick={() => setTab('details')}><i className="bi bi-person" /> Edit profile</button>
                          <Link className="cp-btn" to="/bulk-order"><i className="bi bi-boxes" /> Bulk order</Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="cp-card">
                      <div className="cp-card-head">
                        <div>
                          <h2>Account snapshot</h2>
                          <p>Your saved contact details</p>
                        </div>
                        <button type="button" className="cp-link" onClick={() => setTab('details')}>Edit</button>
                      </div>
                      <div className="cp-card-body">
                        <div className="cp-info-list">
                          <div><span>Name</span><b>{user.name}</b></div>
                          <div><span>Email</span><b>{user.email}</b></div>
                          <div><span>Mobile</span><b>{user.mobile || 'Not added'}</b></div>
                          <div><span>City</span><b>{user.city || 'Not added'}</b></div>
                          <div><span>Address</span><b>{user.address || 'Added at checkout'}</b></div>
                        </div>
                      </div>
                    </div>

                    <div className="cp-card">
                      <div className="cp-card-head">
                        <div>
                          <h2>Support</h2>
                          <p>We are here for you</p>
                        </div>
                      </div>
                      <div className="cp-card-body">
                        <p style={{ margin: '0 0 10px', fontSize: 11.4, lineHeight: 1.5, color: '#7c9188' }}>
                          Questions about a parcel, wholesale pricing or a return? Our team can help.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                          <Link className="cp-btn sm" to="/support">Support centre</Link>
                          <Link className="cp-btn sm" to="/contact">Contact us</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === 'orders' && (
              <div className="cp-card">
                <div className="cp-card-head">
                  <div>
                    <h2>Order history</h2>
                    <p>{orders.length} order{orders.length === 1 ? '' : 's'} placed with Save &amp; Smile</p>
                  </div>
                  <Link className="cp-btn sm" to="/shop">Shop again</Link>
                </div>
                <div className="cp-card-body flush">
                  {orders.length === 0 ? (
                    <div className="cp-empty">
                      <i className="bi bi-receipt" />
                      <b>No orders yet</b>
                      <p>When you place an order it will show up here with its delivery status.</p>
                      <Link className="cp-cta" to="/shop">Browse products</Link>
                    </div>
                  ) : (
                    <div className="cp-orders">{orders.map(order => orderCard(order))}</div>
                  )}
                </div>
              </div>
            )}

            {tab === 'wishlist' && (
              <div className="cp-card">
                <div className="cp-card-head">
                  <div>
                    <h2>Wishlist</h2>
                    <p>{wished.length} saved item{wished.length === 1 ? '' : 's'}</p>
                  </div>
                  <Link className="cp-btn sm" to="/shop">Find more</Link>
                </div>
                <div className="cp-card-body">
                  {wished.length === 0 ? (
                    <div className="cp-empty">
                      <i className="bi bi-heart" />
                      <b>Your wishlist is empty</b>
                      <p>Tap the heart on any product to save it for later.</p>
                      <Link className="cp-cta" to="/shop">Discover products</Link>
                    </div>
                  ) : (
                    <div className="qcat-grid cols-3">{wished.map(product => <ProductCard key={product.id} product={product} />)}</div>
                  )}
                </div>
              </div>
            )}

            {tab === 'addresses' && (
              <div className="cp-card">
                <div className="cp-card-head">
                  <div>
                    <h2>Saved addresses</h2>
                    <p>Used to pre-fill your checkout details</p>
                  </div>
                  <Link className="cp-btn sm" to="/checkout">Update at checkout</Link>
                </div>
                <div className="cp-card-body">
                  <div className="cp-address-grid">
                    <div className="cp-address">
                      <span className="tag">DELIVERY</span>
                      <b>{user.name}</b>
                      <p>
                        {user.address || 'No street address saved yet.'}<br />
                        {user.city || 'City not set'}<br />
                        {user.mobile || 'Mobile not set'}
                      </p>
                      <button type="button" className="cp-btn sm" onClick={() => setTab('details')}>Edit details</button>
                    </div>
                    <div className="cp-address">
                      <span className="tag">ACCOUNT CONTACT</span>
                      <b>{user.name}</b>
                      <p>{user.email}<br />{user.mobile || 'Mobile not set'}</p>
                      <button type="button" className="cp-btn sm" onClick={() => setTab('details')}>Edit contact</button>
                    </div>
                  </div>
                  <p style={{ margin: '12px 0 0', fontSize: 10.8, color: '#8a9c93' }}>
                    Cash on delivery is available across Pakistan. Delivery charges are calculated at checkout.
                  </p>
                </div>
              </div>
            )}

            {tab === 'details' && (
              <div className="cp-card">
                <div className="cp-card-head">
                  <div>
                    <h2>Account details</h2>
                    <p>Keep your contact and delivery information up to date</p>
                  </div>
                </div>
                <form className="cp-card-body" onSubmit={saveDetails}>
                  <div className="cp-form">
                    <div className="cp-field">
                      <label htmlFor="cp-name">Full name</label>
                      <input id="cp-name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required />
                    </div>
                    <div className="cp-field">
                      <label htmlFor="cp-email">Email address</label>
                      <input id="cp-email" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required />
                    </div>
                    <div className="cp-field">
                      <label htmlFor="cp-mobile">Mobile number</label>
                      <input id="cp-mobile" inputMode="tel" placeholder="03XX-XXXXXXX" value={form.mobile} onChange={event => setForm({ ...form, mobile: event.target.value })} />
                    </div>
                    <div className="cp-field">
                      <label htmlFor="cp-city">City</label>
                      <select id="cp-city" value={form.city} onChange={event => setForm({ ...form, city: event.target.value })}>
                        <option value="">Select city</option>
                        {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                    <div className="cp-field full">
                      <label htmlFor="cp-address">Delivery address</label>
                      <textarea id="cp-address" rows="2" placeholder="House / street / area" value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} />
                    </div>
                    <div className="cp-form-foot">
                      <button type="submit" className="cp-btn primary">Save changes</button>
                      {saved && <span className="cp-saved"><i className="bi bi-check2-circle" /> Profile updated</span>}
                    </div>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
