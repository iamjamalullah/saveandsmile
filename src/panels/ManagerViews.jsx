import { useMemo, useState } from 'react'
import { useStoreData } from '../context/StoreDataContext'

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

const statusTone = {
  Pending: 'warn',
  Processing: 'info',
  Shipped: 'indigo',
  Delivered: 'ok',
  Cancelled: 'bad',
}

export function StatusChip({ status }) {
  return <span className={`pnl-chip ${statusTone[status] || 'neutral'}`}>{status}</span>
}

export function ManagerOverview({ onOpenOrder, onNavigate }) {
  const { orders = [], products = [], reviews = [], storeSettings = {}, updateOrderStatus } = useStoreData()
  const currency = storeSettings?.currency || 'Rs.'

  const queue = orders.filter(o => o.status === 'Pending' || o.status === 'Processing')
  const pending = orders.filter(o => o.status === 'Pending')
  const shipped = orders.filter(o => o.status === 'Shipped')
  const delivered = orders.filter(o => o.status === 'Delivered')
  const active = orders.filter(o => o.status !== 'Cancelled')
  const revenue = active.reduce((sum, o) => sum + (o.total || 0), 0)
  const lowStock = products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock)
  const outOfStock = products.filter(p => p.stock === 0)
  const recentReviews = (reviews || []).slice(0, 3)
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const pipeline = [
    { label: 'Pending confirmation', value: pending.length, tone: '#d97706' },
    { label: 'Processing', value: orders.filter(o => o.status === 'Processing').length, tone: '#2563eb' },
    { label: 'Shipped / in transit', value: shipped.length, tone: '#4f46e5' },
    { label: 'Delivered', value: delivered.length, tone: '#049977' },
  ]
  const pipelineTotal = Math.max(orders.length, 1)

  const advance = order => {
    if (order.status === 'Pending') updateOrderStatus(order.id, 'Processing')
    else if (order.status === 'Processing') updateOrderStatus(order.id, 'Shipped')
  }

  return (
    <div>
      <div className="pnl-head">
        <div>
          <h1>Operations overview</h1>
          <p>{today} · everything that needs attention across fulfilment, stock and reviews.</p>
        </div>
        <div className="pnl-head-actions">
          <button type="button" className="pnl-btn" onClick={() => onNavigate('reviews')}>
            <i className="bi bi-star" /> Moderate reviews
          </button>
          <button type="button" className="pnl-btn primary" onClick={() => onNavigate('orders')}>
            <i className="bi bi-receipt-cutoff" /> Open order queue
          </button>
        </div>
      </div>

      <div className="pnl-kpis">
        <div className="pnl-kpi">
          <div>
            <span className="pnl-kpi-label">Orders to fulfil</span>
            <span className="pnl-kpi-value">{queue.length}</span>
            <span className="pnl-kpi-note"><span className="warn">{pending.length} awaiting</span> confirmation</span>
          </div>
          <div className="pnl-kpi-ico amber"><i className="bi bi-box-seam" /></div>
        </div>
        <div className="pnl-kpi">
          <div>
            <span className="pnl-kpi-label">In transit</span>
            <span className="pnl-kpi-value">{shipped.length}</span>
            <span className="pnl-kpi-note">Courier handovers this week</span>
          </div>
          <div className="pnl-kpi-ico blue"><i className="bi bi-truck" /></div>
        </div>
        <div className="pnl-kpi">
          <div>
            <span className="pnl-kpi-label">Order value</span>
            <span className="pnl-kpi-value">{currency} {revenue.toLocaleString()}</span>
            <span className="pnl-kpi-note">Across {active.length} active orders</span>
          </div>
          <div className="pnl-kpi-ico green"><i className="bi bi-graph-up-arrow" /></div>
        </div>
        <div className="pnl-kpi">
          <div>
            <span className="pnl-kpi-label">Low stock SKUs</span>
            <span className="pnl-kpi-value">{lowStock.length}</span>
            <span className="pnl-kpi-note"><span className="bad">{outOfStock.length} out of stock</span> right now</span>
          </div>
          <div className="pnl-kpi-ico rose"><i className="bi bi-exclamation-triangle" /></div>
        </div>
      </div>

      <div className="pnl-grid main-side">
        <div>
          <div className="pnl-card">
            <div className="pnl-card-head">
              <div>
                <h2>Fulfilment queue</h2>
                <p>Orders waiting to be confirmed, packed or shipped</p>
              </div>
              <button type="button" className="pnl-card-link" onClick={() => onNavigate('orders')}>All orders →</button>
            </div>
            {queue.length === 0 ? (
              <div className="pnl-empty"><i className="bi bi-check2-circle" />The fulfilment queue is clear.</div>
            ) : (
              <div className="pnl-table-wrap">
                <table className="pnl-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>City</th>
                      <th className="num">Total</th>
                      <th>Status</th>
                      <th className="num">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.slice(0, 7).map(order => (
                      <tr key={order.id}>
                        <td>
                          <span className="mono">{order.id}</span>
                          <span className="sub">{order.date}</span>
                        </td>
                        <td>
                          <span className="strong">{order.customer.name}</span>
                          <span className="sub">{order.customer.mobile}</span>
                        </td>
                        <td>{order.customer.city}</td>
                        <td className="num strong">{currency} {(order.total || 0).toLocaleString()}</td>
                        <td><StatusChip status={order.status} /></td>
                        <td className="num">
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button type="button" className="pnl-btn sm" onClick={() => onOpenOrder(order)} title="Open details">
                              <i className="bi bi-eye" />
                            </button>
                            <button type="button" className="pnl-btn sm soft" onClick={() => advance(order)}>
                              {order.status === 'Pending' ? 'Process' : 'Ship'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pnl-card" style={{ marginTop: 14 }}>
            <div className="pnl-card-head">
              <div>
                <h2>Delivery pipeline</h2>
                <p>Where every order currently sits</p>
              </div>
              <button type="button" className="pnl-card-link" onClick={() => onNavigate('reports')}>Reports →</button>
            </div>
            <div className="pnl-card-body">
              <div className="pnl-bars">
                {pipeline.map(stage => (
                  <div key={stage.label}>
                    <div className="pnl-bar-head">
                      <span>{stage.label}</span>
                      <b>{stage.value} orders</b>
                    </div>
                    <div className="pnl-bar">
                      <span style={{ width: `${Math.round((stage.value / pipelineTotal) * 100)}%`, background: stage.tone }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="pnl-card">
            <div className="pnl-card-head">
              <div>
                <h2>Restock alerts</h2>
                <p>{lowStock.length} products at or below 5 units</p>
              </div>
              <button type="button" className="pnl-card-link" onClick={() => onNavigate('inventory')}>Inventory →</button>
            </div>
            {lowStock.length === 0 ? (
              <div className="pnl-empty"><i className="bi bi-check2-circle" />Stock levels look healthy.</div>
            ) : (
              <div className="pnl-stock-list">
                {lowStock.slice(0, 5).map(product => (
                  <div className="pnl-stock-row" key={product.id}>
                    <img className="pnl-stock-thumb" src={product.image} alt="" />
                    <div className="info">
                      <b>{product.name}</b>
                      <small>{product.category}</small>
                    </div>
                    <div className="act">
                      <span className={`pnl-chip ${product.stock === 0 ? 'bad' : 'warn'}`}>
                        {product.stock === 0 ? 'Out' : `${product.stock} left`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pnl-card" style={{ marginTop: 14 }}>
            <div className="pnl-card-head">
              <div>
                <h2>Latest feedback</h2>
                <p>Reviews awaiting a reply or moderation</p>
              </div>
              <button type="button" className="pnl-card-link" onClick={() => onNavigate('reviews')}>Moderate →</button>
            </div>
            {recentReviews.length === 0 ? (
              <div className="pnl-empty"><i className="bi bi-chat-square-text" />No reviews yet.</div>
            ) : recentReviews.map(review => (
              <div className="pnl-review-row" key={review.id}>
                <div style={{ minWidth: 0 }}>
                  <div className="stars">{'★'.repeat(Math.min(5, review.rating || 5))}</div>
                  <b>{review.name}</b>
                  <p>“{review.text}”</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ManagerInventory() {
  const { products, categories, storeSettings, updateProduct } = useStoreData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [stockFilter, setStockFilter] = useState('ALL')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return products.filter(product => {
      const matchesTerm = !term ||
        product.name.toLowerCase().includes(term) ||
        (product.sku || '').toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term)
      const matchesCategory = category === 'ALL' || product.category === category
      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'LOW' && product.stock > 0 && product.stock <= 5) ||
        (stockFilter === 'OUT' && product.stock === 0) ||
        (stockFilter === 'HEALTHY' && product.stock > 5)
      return matchesTerm && matchesCategory && matchesStock
    })
  }, [products, query, category, stockFilter])

  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length
  const outOfStock = products.filter(p => p.stock === 0).length

  const setStock = (product, value) => {
    const next = Math.max(0, Math.min(9999, Number(value) || 0))
    if (next !== product.stock) updateProduct(product.id, { stock: next })
  }

  return (
    <div>
      <div className="pnl-head">
        <div>
          <h1>Stock &amp; inventory</h1>
          <p>Adjust on-hand units, restock low sellers and keep the catalogue accurate.</p>
        </div>
        <div className="pnl-head-actions">
          <span className="pnl-chip warn">{lowStock} low stock</span>
          <span className="pnl-chip bad">{outOfStock} out of stock</span>
        </div>
      </div>

      <div className="pnl-kpis">
        <div className="pnl-kpi">
          <div>
            <span className="pnl-kpi-label">Tracked SKUs</span>
            <span className="pnl-kpi-value">{products.length}</span>
            <span className="pnl-kpi-note">Across {categories.length} categories</span>
          </div>
          <div className="pnl-kpi-ico green"><i className="bi bi-boxes" /></div>
        </div>
        <div className="pnl-kpi">
          <div>
            <span className="pnl-kpi-label">Healthy stock</span>
            <span className="pnl-kpi-value">{products.filter(p => p.stock > 5).length}</span>
            <span className="pnl-kpi-note">More than 5 units on hand</span>
          </div>
          <div className="pnl-kpi-ico blue"><i className="bi bi-check2-circle" /></div>
        </div>
        <div className="pnl-kpi">
          <div>
            <span className="pnl-kpi-label">Units on hand</span>
            <span className="pnl-kpi-value">{products.reduce((sum, p) => sum + (p.stock || 0), 0).toLocaleString()}</span>
            <span className="pnl-kpi-note">Total sellable inventory</span>
          </div>
          <div className="pnl-kpi-ico violet"><i className="bi bi-stack" /></div>
        </div>
        <div className="pnl-kpi">
          <div>
            <span className="pnl-kpi-label">Inventory value</span>
            <span className="pnl-kpi-value">
              {storeSettings.currency} {products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0).toLocaleString()}
            </span>
            <span className="pnl-kpi-note">At current selling prices</span>
          </div>
          <div className="pnl-kpi-ico amber"><i className="bi bi-cash-stack" /></div>
        </div>
      </div>

      <div className="pnl-card">
        <div className="pnl-toolbar">
          <input
            className="pnl-input"
            placeholder="Search name, SKU or category…"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          <select className="pnl-input" value={category} onChange={event => setCategory(event.target.value)}>
            <option value="ALL">All categories</option>
            {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
          </select>
          <select className="pnl-input" value={stockFilter} onChange={event => setStockFilter(event.target.value)}>
            <option value="ALL">All stock levels</option>
            <option value="LOW">Low stock (1–5)</option>
            <option value="OUT">Out of stock</option>
            <option value="HEALTHY">Healthy (6+)</option>
          </select>
          <span className="count">{filtered.length} products</span>
        </div>

        {filtered.length === 0 ? (
          <div className="pnl-empty"><i className="bi bi-search" />No products match these filters.</div>
        ) : (
          <div className="pnl-table-wrap">
            <table className="pnl-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="num">Price</th>
                  <th className="center">On hand</th>
                  <th>Status</th>
                  <th className="num">Quick restock</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <img className="pnl-stock-thumb" src={product.image} alt="" />
                        <div style={{ minWidth: 0 }}>
                          <span className="strong" style={{ display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
                          <span className="sub">{product.sku || `GS-${1000 + product.id}`}</span>
                        </div>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td className="num">{storeSettings.currency} {product.price.toLocaleString()}</td>
                    <td className="center">
                      <input
                        key={`${product.id}-${product.stock}`}
                        className="pnl-input"
                        type="number"
                        min="0"
                        defaultValue={product.stock}
                        onBlur={event => setStock(product, event.target.value)}
                        style={{ width: 72, minHeight: 30, padding: '4px 7px', textAlign: 'center', margin: '0 auto' }}
                        aria-label={`Stock for ${product.name}`}
                      />
                    </td>
                    <td>
                      <span className={`pnl-chip ${product.stock === 0 ? 'bad' : product.stock <= 5 ? 'warn' : 'ok'}`}>
                        {product.stock === 0 ? 'Out of stock' : product.stock <= 5 ? 'Low stock' : 'In stock'}
                      </span>
                    </td>
                    <td className="num">
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button type="button" className="pnl-btn sm soft" onClick={() => updateProduct(product.id, { stock: product.stock + 10 })}>
                          +10 units
                        </button>
                        <button type="button" className="pnl-btn sm" onClick={() => setStock(product, 0)}>Set 0</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export { STATUSES }
