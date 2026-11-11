import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { BRAND, HEADER_ICONS, SEARCH_BANNER } from '../data'
import { productPath } from '../content'
import { useCart } from '../context/CartContext'
import { useStoreData } from '../context/StoreDataContext'

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'All Products', to: '/shop' },
  { label: 'Product Categories', to: '/shop', mega: true },
  { label: 'Wholesale & Bulk Buying', to: '/bulk-order', pill: true },
  { label: 'Reviews', to: '/reviews' },
  { label: 'Contact Us', to: '/contact' },
]

function Count({ n }) {
  return n > 0 ? <span className="qh-count">{n}</span> : null
}

export default function Header({ user, onLogout }) {
  const { count, wishlist, setCartOpen } = useCart()
  const { categories = [], products = [] } = useStoreData()
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [tab, setTab] = useState('categories')
  const [mega, setMega] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [sticky, setSticky] = useState(false)
  const searchRef = useRef(null)
  const accountRef = useRef(null)

  useEffect(() => {
    if (!searchOpen) return
    const timer = setTimeout(() => searchRef.current?.focus(), 40)
    return () => clearTimeout(timer)
  }, [searchOpen])

  useEffect(() => {
    const onDoc = e => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 30)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setSearchOpen(false)
    setMenuOpen(false)
    setAccountOpen(false)
    setMega(false)
  }, [location.pathname, location.search])

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return products.filter(p => p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s)).slice(0, 6)
  }, [q, products])

  const submitSearch = e => {
    e.preventDefault()
    const term = q.trim()
    setSearchOpen(false)
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/shop')
  }

  const ticker = (
    <div className="qh-ticker-item">
      <span>{BRAND.announcement}</span>
      <span className="qh-ticker-div">|</span>
    </div>
  )

  return (
    <>
      <div className="qh-ticker">
        <div className="qh-ticker-track">
          {Array.from({ length: 8 }).map((_, i) => <div className="qh-ticker-group" key={i}>{ticker}</div>)}
        </div>
      </div>

      <header className={`qh-section ${sticky ? 'is-sticky' : ''}`}>
        <div className="qh-bar">
          <div className="qh-row">
            <div className="qh-left">
              <button className="qh-menu-btn" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="6" cy="6" r="2.8" />
                  <circle cx="18" cy="6" r="2.8" />
                  <circle cx="6" cy="18" r="2.8" />
                  <circle cx="18" cy="18" r="2.8" />
                </svg>
              </button>
              <Link to="/" className="qh-logo" aria-label={BRAND.name}>
                <img
                  src={BRAND.logo}
                  alt={BRAND.name}
                  style={{ maxHeight: '46px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                />
              </Link>
            </div>

            <nav className="qh-nav" aria-label="Main navigation">
              <ul>
                {NAV.map(l => l.mega ? (
                  <li
                    key={l.label}
                    className={`qh-pcat ${mega ? 'is-open' : ''}`}
                    onMouseEnter={() => setMega(true)}
                    onMouseLeave={() => setMega(false)}
                  >
                    <button
                      type="button"
                      className="qh-link qh-pcat-toggle"
                      aria-haspopup="true"
                      aria-expanded={mega}
                      onClick={() => setMega(v => !v)}
                    >
                      {l.label}
                      <svg className="qh-chev" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div
                      className="qh-pcat-menu"
                      style={mega ? { opacity: 1, visibility: 'visible', pointerEvents: 'auto', transform: 'translateY(0)' } : undefined}
                    >
                      <div className="qh-pcat-panel">
                        <div className="qh-pcat-head">
                          <div>
                            <b>Shop by category</b>
                            <span>{categories.length} wholesale departments</span>
                          </div>
                          <Link to="/shop" onClick={() => setMega(false)}>View all products <em>→</em></Link>
                        </div>
                        <ul className="qh-pcat-list">
                          {categories.map(c => (
                            <li className="qh-pcat-item" key={c.slug}>
                              <Link className="qh-pcat-link" to={`/category/${c.slug}`} onClick={() => setMega(false)}>
                                <img src={c.image} alt="" loading="lazy" />
                                <span>{c.name}</span>
                                <i aria-hidden="true">›</i>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <div className="qh-pcat-foot">
                          <Link to="/bulk-order" onClick={() => setMega(false)}><span>📦</span> Wholesale &amp; bulk buying</Link>
                          <Link to="/shop" onClick={() => setMega(false)}><span>🏷️</span> Best wholesale prices</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ) : (
                  <li key={l.label}>
                    <Link to={l.to} className={`qh-link ${l.pill ? 'qh-link-pill' : ''}`}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="qh-actions">
              <button className="qh-icon" type="button" aria-label="Search" onClick={() => setSearchOpen(v => !v)}>
                <img src={HEADER_ICONS.search} width="24" height="24" alt="" />
              </button>
              <Link className="qh-icon" to="/wishlist" aria-label="Wishlist">
                <img src={HEADER_ICONS.wishlist} width="24" height="24" alt="" />
                <Count n={wishlist.length} />
              </Link>

              <div className="qh-account" ref={accountRef}>
                <button className="qh-icon" type="button" aria-label="Account" onClick={() => setAccountOpen(v => !v)}>
                  <img src={HEADER_ICONS.user} width="24" height="24" alt="" />
                </button>
                {accountOpen && (
                  <div className="qh-account-drop">
                    <div className="qh-account-hero">
                      <span className="qh-account-avatar">
                        {user ? user.name.charAt(0).toUpperCase() : (
                          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" /><path d="M5.5 19c.8-3.2 3.3-5 6.5-5s5.7 1.8 6.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                        )}
                      </span>
                      <span className="qh-account-copy">
                        <strong>{user ? `Hi, ${user.name}` : 'Welcome'}</strong>
                        <small>{user ? 'Manage your account & orders' : 'Sign in for faster checkout and order tracking'}</small>
                      </span>
                    </div>
                    {user ? (
                      <div className="qh-account-body">
                        <Link className="qh-account-row" to="/account"><span>👤</span>My Account<i /></Link>
                        <Link className="qh-account-row" to="/wishlist"><span>♡</span>My Wishlist<i /></Link>
                        <Link className="qh-account-row" to="/account?tab=orders"><span>📦</span>My Orders<i /></Link>
                        <button className="qh-account-row qh-account-logout" onClick={() => { setAccountOpen(false); onLogout() }}><span>⏻</span>Logout</button>
                      </div>
                    ) : (
                      <div className="qh-account-body qh-account-guest">
                        <Link className="qh-account-btn qh-account-solid" to="/login">Login</Link>
                        <Link className="qh-account-btn qh-account-outline" to="/signup">Sign Up</Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button className="qh-icon qh-cart-btn" type="button" aria-label="Cart" onClick={() => setCartOpen(true)}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1.5" />
                  <circle cx="20" cy="21" r="1.5" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <Count n={count} />
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="qh-search-pop" role="dialog" aria-label="Search">
            <form className="qh-search-form" onSubmit={submitSearch}>
              <input
                ref={searchRef}
                type="search"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search for products…"
                aria-label="Search products"
              />
              <button type="submit" aria-label="Search">
                <img src={HEADER_ICONS.search} alt="" />
              </button>
              <button type="button" className="qh-search-x" onClick={() => setSearchOpen(false)} aria-label="Close search">✕</button>
            </form>
            <div className="qh-suggest">
              {!q ? (
                <>
                  <p className="qh-suggest-title">Trending searches</p>
                  <div className="qh-chips">
                    {SEARCH_BANNER.trending.map(t => (
                      <button key={t.q} type="button" onClick={() => setQ(t.q)}>{t.label}</button>
                    ))}
                  </div>
                </>
              ) : matches.length ? (
                matches.map(p => (
                  <Link key={p.id} className="qh-suggest-row" to={productPath(p)} onClick={() => setSearchOpen(false)}>
                    <img src={p.image} alt="" />
                    <span>{p.name}</span>
                    <b>Rs. {p.price.toLocaleString()}</b>
                  </Link>
                ))
              ) : (
                <p className="qh-noresult">No products found for “{q}”.</p>
              )}
            </div>
          </div>
        )}
      </header>

      {menuOpen && (
        <div className="qh-drawer-wrap" onClick={() => setMenuOpen(false)}>
          <aside className="qh-side" onClick={e => e.stopPropagation()}>
            <div className="qh-side-head">
              <img src={BRAND.logo} alt={BRAND.name} />
              <button className="qh-side-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
            </div>
            <div className="qh-side-auth">
              {user ? (
                <p>Hi, <b>{user.name}</b> · <button onClick={() => { setMenuOpen(false); onLogout() }}>Logout</button></p>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
            <div className="qh-side-tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'categories'} className={tab === 'categories' ? 'on' : ''} onClick={() => setTab('categories')}>CATEGORIES</button>
              <button role="tab" aria-selected={tab === 'menu'} className={tab === 'menu' ? 'on' : ''} onClick={() => setTab('menu')}>MENU</button>
            </div>
            <div className="qh-side-body">
              {tab === 'categories' ? (
                categories.map(c => (
                  <Link key={c.slug} className="qh-side-cat" to={`/category/${c.slug}`} onClick={() => setMenuOpen(false)}>
                    <img src={c.image} alt="" />
                    <span>{c.name}</span>
                    <b>›</b>
                  </Link>
                ))
              ) : (
                <div className="qh-side-links">
                  <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
                  <Link to="/shop" onClick={() => setMenuOpen(false)}>All Products</Link>
                  <Link to="/about-us" onClick={() => setMenuOpen(false)}>About Us</Link>
                  <Link to="/reviews" onClick={() => setMenuOpen(false)}>Reviews</Link>
                  <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact Us</Link>
                  <Link to="/bulk-order" onClick={() => setMenuOpen(false)}>Wholesale &amp; Bulk Buying</Link>
                  <Link to="/wishlist" onClick={() => setMenuOpen(false)}>My Wishlist</Link>
                  <Link to="/account?tab=orders" onClick={() => setMenuOpen(false)}>Track Order</Link>
                  <div className="qh-side-price">
                    <p>Shop by price</p>
                    <div>
                      {[500, 1000, 2000, 5000].map(v => (
                        <Link key={v} to={`/shop?max=${v}`} onClick={() => setMenuOpen(false)}>Under {v}</Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
