import { useState, useMemo } from 'react'
import { useStoreData } from '../../context/StoreDataContext'
import { CITIES } from '../../data'

export default function OrdersView({ selectedOrderForModal, onSelectOrder }) {
  const { orders, storeSettings, updateOrderStatus, deleteOrder } = useStoreData()

  const [activeStatusTab, setActiveStatusTab] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('ALL')
  const [sortBy, setSortBy] = useState('newest')

  // Calculate status counts
  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'Pending').length,
      processing: orders.filter(o => o.status === 'Processing').length,
      shipped: orders.filter(o => o.status === 'Shipped').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
    }
  }, [orders])

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status Tab
      const matchesStatus = activeStatusTab === 'ALL' || o.status.toLowerCase() === activeStatusTab.toLowerCase()

      // Search
      const search = searchTerm.toLowerCase()
      const cName = o.customer?.name || o.customerName || ''
      const cMobile = o.customer?.mobile || o.customerMobile || ''
      const cCity = o.customer?.city || o.customerCity || ''
      const matchesSearch = !searchTerm ||
        o.id.toLowerCase().includes(search) ||
        cName.toLowerCase().includes(search) ||
        cMobile.includes(search) ||
        (cCity && cCity.toLowerCase().includes(search))

      // City Filter
      const matchesCity = selectedCity === 'ALL' || cCity === selectedCity

      return matchesStatus && matchesSearch && matchesCity
    }).sort((a, b) => {
      if (sortBy === 'amount-high') return b.total - a.total
      if (sortBy === 'amount-low') return a.total - b.total
      return new Date(b.date || 0) - new Date(a.date || 0)
    })
  }, [orders, activeStatusTab, searchTerm, selectedCity, sortBy])

  // Render status badge
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
    <div className="orders-view">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Customer Orders</h3>
          <p className="text-muted small mb-0">
            Track and process real-time customer purchases and fulfillment status
          </p>
        </div>
        <div className="d-flex gap-2">
          <span className="badge bg-warning-subtle text-warning border px-3 py-2 fw-semibold d-inline-flex align-items-center">
            <i className="bi bi-bell-fill me-1.5"></i> {counts.pending} Orders Need Confirmation
          </span>
        </div>
      </div>

      {/* Status Navigation Tabs */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-2 p-md-3">
          <div className="d-flex flex-wrap gap-2">
            <button
              className={`btn btn-sm ${activeStatusTab === 'ALL' ? 'btn-dark' : 'btn-light border'}`}
              onClick={() => setActiveStatusTab('ALL')}
            >
              All Orders <span className="badge bg-secondary ms-1">{counts.all}</span>
            </button>
            <button
              className={`btn btn-sm ${activeStatusTab === 'Pending' ? 'btn-warning text-dark fw-bold' : 'btn-light border'}`}
              onClick={() => setActiveStatusTab('Pending')}
            >
              Pending <span className="badge bg-light text-dark ms-1">{counts.pending}</span>
            </button>
            <button
              className={`btn btn-sm ${activeStatusTab === 'Processing' ? 'btn-primary' : 'btn-light border'}`}
              onClick={() => setActiveStatusTab('Processing')}
            >
              Processing <span className="badge bg-light text-primary ms-1">{counts.processing}</span>
            </button>
            <button
              className={`btn btn-sm ${activeStatusTab === 'Shipped' ? 'btn-info text-white' : 'btn-light border'}`}
              onClick={() => setActiveStatusTab('Shipped')}
            >
              Shipped <span className="badge bg-light text-dark ms-1">{counts.shipped}</span>
            </button>
            <button
              className={`btn btn-sm ${activeStatusTab === 'Delivered' ? 'btn-success' : 'btn-light border'}`}
              onClick={() => setActiveStatusTab('Delivered')}
            >
              Delivered <span className="badge bg-light text-success ms-1">{counts.delivered}</span>
            </button>
            <button
              className={`btn btn-sm ${activeStatusTab === 'Cancelled' ? 'btn-danger' : 'btn-light border'}`}
              onClick={() => setActiveStatusTab('Cancelled')}
            >
              Cancelled <span className="badge bg-light text-danger ms-1">{counts.cancelled}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 align-items-center">
            {/* Search */}
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by Order #, Customer Name, Mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>✕</button>
                )}
              </div>
            </div>

            {/* City Filter */}
            <div className="col-6 col-md-4">
              <select
                className="form-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="ALL">All Delivery Cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="col-6 col-md-3">
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Sort by Newest</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table admin-table mb-0">
            <thead>
              <tr>
                <th>Order ID &amp; Date</th>
                <th>Customer Info</th>
                <th>City &amp; Address</th>
                <th>Ordered Items</th>
                <th>Total (COD)</th>
                <th>Current Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-receipt fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    No orders found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="fw-bold text-primary font-monospace">{order.id}</div>
                      <small className="text-muted d-block">{order.date}</small>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{order.customer?.name || order.customerName || 'Guest Customer'}</div>
                      <div className="small text-muted d-flex align-items-center gap-1">
                        <i className="bi bi-telephone"></i>
                        <span>{order.customer?.mobile || order.customerMobile || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border mb-1">
                        <i className="bi bi-geo-alt me-1 text-danger"></i>
                        {order.customer?.city || order.customerCity || 'Pakistan'}
                      </span>
                      <small className="text-muted d-block text-truncate" style={{ maxWidth: 180 }} title={order.customer?.address || order.deliveryAddress || ''}>
                        {order.customer?.address || order.deliveryAddress || 'Standard Delivery Address'}
                      </small>
                    </td>
                    <td>
                      <div className="small">
                        <span className="fw-semibold text-dark">
                          {(order.items || []).reduce((sum, i) => sum + (i.qty || 1), 0)} items:
                        </span>
                        <div className="text-muted text-truncate" style={{ maxWidth: 200 }} title={(order.items || []).map(i => `${i.qty || 1}x ${i.product?.name || i.name || 'Product'}`).join(', ')}>
                          {(order.items || []).map(i => `${i.qty || 1}x ${i.product?.name || i.name || 'Product'}`).join(', ')}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="fw-bold fs-6 text-dark">
                        {storeSettings.currency} {Number(order.total || 0).toLocaleString()}
                      </div>
                      <small className="text-muted d-block">{order.paymentMethod || 'Cash on Delivery'}</small>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {renderStatusBadge(order.status)}
                      </div>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => onSelectOrder(order)}
                          title="View Order Details & Print Invoice"
                        >
                          <i className="bi bi-eye-fill me-1"></i> Details
                        </button>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: 116, fontSize: 11 }}
                          value={order.status}
                          onChange={(e) => {
                            const next = e.target.value
                            if (next === 'Shipped') {
                              const tracking = window.prompt(`Courier tracking ID for ${order.id} (optional):`, order.trackingNumber || '')
                              updateOrderStatus(order.id, next, tracking || '')
                            } else {
                              updateOrderStatus(order.id, next)
                            }
                          }}
                          title="Quick change status"
                          aria-label={`Update status for ${order.id}`}
                        >
                          {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          className="btn btn-sm btn-light border text-danger"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete order ${order.id}?`)) {
                              deleteOrder(order.id)
                            }
                          }}
                          title="Delete Order"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
