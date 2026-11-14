import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useStoreData } from '../../context/StoreDataContext'

export default function DashboardView({ onViewOrder, onOpenAddProduct }) {
  const { products = [], orders = [], categories = [], storeSettings = {}, toggleProductStock } = useStoreData()
  const navigate = useNavigate()
  const goTab = id => navigate(id === 'dashboard' ? '/admin' : `/admin/${id}`)

  // Calculate live metrics
  const activeOrders = orders.filter(o => o.status !== 'Cancelled')
  const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const pendingOrders = orders.filter(o => o.status === 'Pending')
  const lowStockProducts = products.filter(p => p.stock <= 5)
  const avgOrderValue = activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0

  // Order status counts
  const statusCounts = {
    pending: orders.filter(o => o.status === 'Pending').length,
    processing: orders.filter(o => o.status === 'Processing').length,
    shipped: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
  }

  // Monthly revenue mock data for the visual chart
  const monthsData = [
    { month: 'May', revenue: 165000, orders: 32 },
    { month: 'Jun', revenue: 182000, orders: 38 },
    { month: 'Jul', revenue: 210000, orders: 44 },
    { month: 'Aug', revenue: 195000, orders: 40 },
    { month: 'Sep', revenue: 235000, orders: 49 },
    { month: 'Oct', revenue: 284500, orders: 58 },
  ]
  const maxRevenue = Math.max(...monthsData.map(m => m.revenue))
  const [hoveredMonth, setHoveredMonth] = useState(null)

  // Status badge styling helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="badge badge-status badge-pending"><i className="bi bi-clock-history"></i> Pending</span>
      case 'Processing':
        return <span className="badge badge-status badge-processing"><i className="bi bi-gear-fill"></i> Processing</span>
      case 'Shipped':
        return <span className="badge badge-status badge-shipped"><i className="bi bi-truck"></i> Shipped</span>
      case 'Delivered':
        return <span className="badge badge-status badge-delivered"><i className="bi bi-check-circle-fill"></i> Delivered</span>
      case 'Cancelled':
        return <span className="badge badge-status badge-cancelled"><i className="bi bi-x-circle-fill"></i> Cancelled</span>
      default:
        return <span className="badge bg-secondary">{status}</span>
    }
  }

  return (
    <div className="dashboard-view">
      {/* Welcome Banner */}
      <div className="card border-0 shadow-sm mb-4 pnl-hero text-white">
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <span className="badge bg-warning text-dark mb-2 fw-semibold px-2.5 py-1.5">
                <i className="bi bi-shield-check me-1"></i> Administrator Access
              </span>
              <h2 className="fw-bold mb-1">Welcome back, {storeSettings?.name || 'Save & Smile'} Admin</h2>
              <p className="mb-0 text-light opacity-75">
                Here is your store summary for today. You have <strong className="text-warning">{pendingOrders.length} pending orders</strong> that require fulfillment.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <div className="d-flex gap-2 justify-content-lg-end">
                <button
                  className="btn btn-warning fw-semibold shadow-sm"
                  onClick={onOpenAddProduct}
                >
                  <i className="bi bi-plus-lg me-1"></i> Add Product
                </button>
                <button
                  className="btn btn-outline-light"
                  onClick={() => goTab('orders')}
                >
                  <i className="bi bi-box-seam me-1"></i> Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-stat-card p-3 p-md-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-semibold small text-uppercase">Total Revenue</span>
              <div className="stat-icon-wrap stat-icon-orange">
                <i className="bi bi-currency-exchange"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{storeSettings.currency} {totalRevenue.toLocaleString()}</h3>
            <div className="d-flex align-items-center text-success small fw-medium">
              <i className="bi bi-arrow-up-right me-1"></i>
              <span>+18.4% vs last month</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-stat-card p-3 p-md-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-semibold small text-uppercase">Total Orders</span>
              <div className="stat-icon-wrap stat-icon-blue">
                <i className="bi bi-cart-check"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{orders.length}</h3>
            <div className="d-flex align-items-center small">
              <span className="text-warning fw-semibold me-2">{pendingOrders.length} Pending</span>
              <span className="text-muted">| {statusCounts.delivered} Delivered</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-stat-card p-3 p-md-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-semibold small text-uppercase">Catalog Items</span>
              <div className="stat-icon-wrap stat-icon-purple">
                <i className="bi bi-boxes"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{products.length}</h3>
            <div className="d-flex align-items-center small">
              <span className="text-muted me-2">{categories.length} Categories</span>
              {lowStockProducts.length > 0 && (
                <span className="badge bg-danger-subtle text-danger fw-semibold">{lowStockProducts.length} Low Stock</span>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-stat-card p-3 p-md-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-semibold small text-uppercase">Average Order</span>
              <div className="stat-icon-wrap stat-icon-green">
                <i className="bi bi-wallet2"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{storeSettings.currency} {avgOrderValue.toLocaleString()}</h3>
            <div className="d-flex align-items-center text-muted small">
              <i className="bi bi-cash-stack me-1"></i> Cash on Delivery (COD)
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Analytics Section */}
      <div className="row g-3 mb-4">
        {/* Monthly Revenue Bar Chart */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <div>
                <h5 className="fw-bold mb-0">Sales &amp; Revenue Trends</h5>
                <small className="text-muted">Monthly performance breakdown (2026)</small>
              </div>
              <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-medium">
                Last 6 Months
              </span>
            </div>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <span className="text-muted small">Peak Month</span>
                  <div className="fw-bold text-dark fs-5">October ({storeSettings.currency} 284,500)</div>
                </div>
                <div className="d-flex gap-3 small">
                  <div className="d-flex align-items-center gap-1.5">                      <span className="d-inline-block rounded-circle" style={{ width: 10, height: 10, backgroundColor: '#049977' }}></span>
                    <span>Revenue</span>
                  </div>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div style={{ height: 230, position: 'relative' }} className="w-100">
                <svg className="w-100 h-100" viewBox="0 0 600 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 50, 100, 150].map((y, idx) => (
                    <line
                      key={idx}
                      x1="0"
                      y1={y}
                      x2="600"
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Bars */}
                  {monthsData.map((d, i) => {
                    const barWidth = 44
                    const spacing = 600 / monthsData.length
                    const x = i * spacing + (spacing - barWidth) / 2
                    const barHeight = (d.revenue / maxRevenue) * 160
                    const y = 180 - barHeight
                    const isHovered = hoveredMonth === i

                    return (
                      <g key={i} onMouseEnter={() => setHoveredMonth(i)} onMouseLeave={() => setHoveredMonth(null)} style={{ cursor: 'pointer' }}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx="6"
                          fill={isHovered ? '#037a60' : '#049977'}
                          className="transition-all"
                        />
                        <text
                          x={x + barWidth / 2}
                          y="196"
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="12"
                          fontWeight={isHovered ? '700' : '500'}
                        >
                          {d.month}
                        </text>
                      </g>
                    )
                  })}
                </svg>

                {/* Tooltip on hover */}
                {hoveredMonth !== null && (
                  <div
                    className="position-absolute bg-dark text-white p-2 rounded shadow-sm small text-center"
                    style={{
                      left: `${(hoveredMonth / monthsData.length) * 100 + 4}%`,
                      top: '10px',
                      transform: 'translateX(-50%)',
                      zIndex: 10,
                      pointerEvents: 'none',
                    }}
                  >
                    <div className="fw-bold">{monthsData[hoveredMonth].month} 2026</div>
                    <div>{storeSettings.currency} {monthsData[hoveredMonth].revenue.toLocaleString()}</div>
                    <div className="text-warning">{monthsData[hoveredMonth].orders} Orders</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown & Quick Actions */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0">Sales by Category</h5>
              <small className="text-muted">Top volume distributors</small>
            </div>
            <div className="card-body p-4">
              <div className="category-progress-list d-flex flex-column gap-3">
                <div>
                  <div className="d-flex justify-content-between small fw-medium mb-1">
                    <span>Storage &amp; Organization</span>
                    <span className="fw-bold">34%</span>
                  </div>
                  <div className="progress" style={{ height: 8 }}>
                    <div className="progress-bar bg-warning" style={{ width: '34%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="d-flex justify-content-between small fw-medium mb-1">
                    <span>Electronic Accessories</span>
                    <span className="fw-bold">26%</span>
                  </div>
                  <div className="progress" style={{ height: 8 }}>
                    <div className="progress-bar bg-primary" style={{ width: '26%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="d-flex justify-content-between small fw-medium mb-1">
                    <span>Smart Watches</span>
                    <span className="fw-bold">18%</span>
                  </div>
                  <div className="progress" style={{ height: 8 }}>
                    <div className="progress-bar bg-success" style={{ width: '18%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="d-flex justify-content-between small fw-medium mb-1">
                    <span>Perfumes &amp; Fragrances</span>
                    <span className="fw-bold">14%</span>
                  </div>
                  <div className="progress" style={{ height: 8 }}>
                    <div className="progress-bar bg-info" style={{ width: '14%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="d-flex justify-content-between small fw-medium mb-1">
                    <span>Other Categories</span>
                    <span className="fw-bold">8%</span>
                  </div>
                  <div className="progress" style={{ height: 8 }}>
                    <div className="progress-bar bg-secondary" style={{ width: '8%' }}></div>
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              <div>
                <h6 className="fw-bold mb-2 small text-uppercase text-muted">Order Status Distribution</h6>
                <div className="d-flex gap-2 text-center">
                  <div className="flex-fill p-2 rounded bg-light">
                    <div className="fw-bold text-warning fs-5">{statusCounts.pending}</div>
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>Pending</small>
                  </div>
                  <div className="flex-fill p-2 rounded bg-light">
                    <div className="fw-bold text-primary fs-5">{statusCounts.processing}</div>
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>Processing</small>
                  </div>
                  <div className="flex-fill p-2 rounded bg-light">
                    <div className="fw-bold text-info fs-5">{statusCounts.shipped}</div>
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>Shipped</small>
                  </div>
                  <div className="flex-fill p-2 rounded bg-light">
                    <div className="fw-bold text-success fs-5">{statusCounts.delivered}</div>
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>Delivered</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock alerts */}
      <div className="row g-3">
        {/* Recent Orders Table */}
        <div className="col-12 col-xl-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <div>
                <h5 className="fw-bold mb-0">Recent Orders</h5>
                <small className="text-muted">Latest purchases from your storefront</small>
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => goTab('orders')}
              >
                View All Orders <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
            <div className="table-responsive">
              <table className="table admin-table mb-0">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>City</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id}>
                      <td className="fw-semibold text-primary">{order.id}</td>
                      <td>
                        <div className="fw-medium">{order.customer?.name || order.customerName || 'Customer'}</div>
                        <small className="text-muted">{order.customer?.mobile || order.customerMobile || '—'}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-geo-alt me-1 text-danger"></i>
                          {order.customer?.city || order.customerCity || 'Pakistan'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary">
                          {(order.items || []).reduce((sum, i) => sum + (i.qty || 1), 0)} items
                        </span>
                      </td>
                      <td className="fw-bold">
                        {storeSettings.currency} {Number(order.total || 0).toLocaleString()}
                      </td>
                      <td>{renderStatusBadge(order.status)}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-light border px-2 py-1"
                          onClick={() => onViewOrder(order)}
                          title="View Order Details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock & Best Sellers */}
        <div className="col-12 col-xl-4">
          <div className="card shadow-sm mb-3">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <h5 className="fw-bold mb-0">Low Stock Alert</h5>
              <span className="badge bg-danger">{lowStockProducts.length} Needs Attention</span>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {lowStockProducts.slice(0, 4).map((p) => (
                  <li key={p.id} className="list-group-item d-flex align-items-center justify-content-between py-3">
                    <div className="d-flex align-items-center gap-2.5">
                      <img src={p.image} alt={p.name} className="admin-thumb" onError={(e) => { e.target.src = '/images/cat1.jpg' }} />
                      <div>
                        <div className="fw-medium text-truncate" style={{ maxWidth: 170 }}>{p.name}</div>
                        <small className="text-muted">{p.category}</small>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className={`badge ${p.stock === 0 ? 'bg-danger' : 'bg-warning text-dark'}`}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                      </div>
                      <div className="mt-1">
                        <button
                          className="btn btn-link btn-sm p-0 text-decoration-none"
                          onClick={() => toggleProductStock(p.id)}
                        >
                          Restock +15
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0">Quick Store Summary</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="stat-icon-wrap stat-icon-orange">
                  <i className="bi bi-shop"></i>
                </div>
                <div>
                  <div className="fw-bold">{storeSettings.name}</div>
                  <small className="text-muted">{storeSettings.tagline}</small>
                </div>
              </div>
              <p className="text-muted small mb-3">
                <i className="bi bi-telephone text-success me-1"></i> {storeSettings.phone} &nbsp;|&nbsp;
                <i className="bi bi-whatsapp text-success me-1"></i> {storeSettings.whatsapp}
              </p>
              <div className="d-grid gap-2">
                <button
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => goTab('settings')}
                >
                  <i className="bi bi-sliders me-1"></i> Manage Store Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
