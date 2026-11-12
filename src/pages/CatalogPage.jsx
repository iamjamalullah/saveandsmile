import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { SORT_OPTIONS, findCategoryIn } from '../content'
import { useCart } from '../context/CartContext'
import { useStoreData } from '../context/StoreDataContext'
import ProductCard from '../components/ProductCard'

const PRICE_MIN = 0
const PRICE_MAX = 15000

export default function CatalogPage({ mode = 'shop' }) {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const { wishlist } = useCart()
  const { products = [], categories = [], sections = [], loading } = useStoreData()

  const category = mode === 'category' ? findCategoryIn(categories, slug) : null
  const group = params.get('group') || ''
  const query = params.get('q') || ''
  const initialMax = Number(params.get('max')) || PRICE_MAX

  const [min, setMin] = useState(PRICE_MIN)
  const [max, setMax] = useState(initialMax)
  const [sort, setSort] = useState('featured')
  const [inStock, setInStock] = useState(false)
  const [cols, setCols] = useState(4)

  useEffect(() => {
    setMin(PRICE_MIN)
    setMax(initialMax)
  }, [initialMax, slug, mode, group, query])

  const title = mode === 'category'
    ? category?.name || 'Category'
    : mode === 'wishlist'
      ? 'My Wishlist'
      : mode === 'search'
        ? `Search: “${query}”`
        : sections.find(s => s.group === group)?.title || 'Shop'

  useEffect(() => {
    document.title = `${title} | Save & Smile`
  }, [title])

  const results = useMemo(() => {
    let list = [...products]
    if (mode === 'wishlist') list = list.filter(p => wishlist.includes(p.id))
    if (category) list = list.filter(p => p.category === category.name)
    if (group) list = list.filter(p => p.group === group)
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    list = list.filter(p => p.price >= min && p.price <= max)
    if (inStock) list = list.filter(p => p.stock > 0)
    switch (sort) {
      case 'low': list.sort((a, b) => a.price - b.price); break
      case 'high': list.sort((a, b) => b.price - a.price); break
      case 'az': list.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'za': list.sort((a, b) => b.name.localeCompare(a.name)); break
      case 'discount': list.sort((a, b) => (b.oldPrice - b.price) / b.oldPrice - (a.oldPrice - a.price) / a.oldPrice); break
      case 'new':
      case 'featured':
      default:
        list.sort((a, b) => {
          if (b.createdAt && a.createdAt) {
            const diff = new Date(b.createdAt) - new Date(a.createdAt)
            if (diff !== 0) return diff
          }
          return (Number(b.id) || 0) - (Number(a.id) || 0)
        })
        break
    }
    return list
  }, [category, group, query, min, max, sort, inStock, mode, wishlist, products])

  const clearAll = () => { setMin(PRICE_MIN); setMax(PRICE_MAX); setInStock(false); setSort('featured') }

  return (
    <main className="qcat">
      <div className="qg-container">
        <nav className="qcat-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          {mode === 'category' ? <Link to={`/category/${slug}`}>{title}</Link> : <span>{title}</span>}
        </nav>
      </div>

      <div className="qg-container qcat-main">
        <div className="qcat-head">
          <h1>{title}</h1>

          <div className="qcat-price">
            <span className="qcat-price-label">Price</span>
            <div className="qcat-slider">
              <div className="qcat-slider-track" />
              <div
                className="qcat-slider-fill"
                style={{
                  left: `${((min - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                  right: `${100 - ((max - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                }}
              />
              <input
                type="range" min={PRICE_MIN} max={PRICE_MAX} step="100" value={min}
                onChange={e => setMin(Math.min(Number(e.target.value), max - 100))}
                aria-label="Minimum price"
              />
              <input
                type="range" min={PRICE_MIN} max={PRICE_MAX} step="100" value={max}
                onChange={e => setMax(Math.max(Number(e.target.value), min + 100))}
                aria-label="Maximum price"
              />
            </div>
            <div className="qcat-price-inputs">
              <label><span>Rs.</span><input type="number" value={min} min={PRICE_MIN} max={max}
                onChange={e => setMin(Math.min(Number(e.target.value) || 0, max - 100))} aria-label="Minimum price value" /></label>
              <em>–</em>
              <label><span>Rs.</span><input type="number" value={max} min={min} max={PRICE_MAX}
                onChange={e => setMax(Math.max(Number(e.target.value) || 0, min + 100))} aria-label="Maximum price value" /></label>
            </div>
          </div>

          <div className="qcat-views" role="group" aria-label="Products per row">
            {[2, 3, 4].map(n => (
              <button key={n} className={cols === n ? 'on' : ''} onClick={() => setCols(n)} aria-label={`${n} columns`} aria-pressed={cols === n}>
                {Array.from({ length: n }).map((_, i) => <i key={i} />)}
              </button>
            ))}
          </div>
        </div>

        <div className="qcat-sortbar">
          <b>Sort By:</b>
          {SORT_OPTIONS.slice(0, 5).map(o => (
            <button key={o.key} className={sort === o.key ? 'on' : ''} onClick={() => setSort(o.key)}>{o.label}</button>
          ))}
          <button className={inStock ? 'on' : ''} onClick={() => setInStock(v => !v)}>Availability</button>
          <span className="qcat-count">{results.length} product{results.length === 1 ? '' : 's'}</span>
        </div>

        {loading && !products.length ? (
          <div className="qcat-empty"><p>Loading products from the store database…</p></div>
        ) : results.length === 0 ? (
          <div className="qcat-empty">
            <p>
              {mode === 'wishlist' ? 'Your wishlist is empty.' : `No products found${mode === 'category' && category ? ` in ${category.name}` : ''} matching your filters.`}
            </p>
            <div>
              <button className="qg-btn qg-btn-outline" onClick={clearAll}>Clear All</button>
              <Link className="qg-btn qg-btn-primary" to="/shop">Continue shopping</Link>
            </div>
          </div>
        ) : (
          <div className={`qcat-grid cols-${cols}`}>
            {results.map(p => <ProductCard key={p.id} product={p} context="catalog" />)}
          </div>
        )}

        <div className="qcat-foot">
          <p>Showing {results.length} of {products.length} products · Wholesale prices · Cash on delivery all over Pakistan</p>
        </div>
      </div>
    </main>
  )
}
