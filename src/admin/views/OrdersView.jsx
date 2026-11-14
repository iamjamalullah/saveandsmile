import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useStoreData } from '../../context/StoreDataContext'
import { CITIES } from '../../data'

export default function OrdersView({ selectedOrderForModal, onSelectOrder }) {
  const { orders, storeSettings, updateOrderStatus, deleteOrder } = useStoreData()

  const [activeStatusTab, setActiveStatusTab] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('ALL')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  // Table horizontal scrolling & synchronization refs & states
  const tableContainerRef = useRef(null)
  const stickyScrollbarRef = useRef(null)
  const isSyncingRef = useRef(false)

  const [tableScrollWidth, setTableScrollWidth] = useState(0)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Update scroll boundaries & overflow
  const updateScrollState = useCallback(() => {
    if (!tableContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current
    setTableScrollWidth(scrollWidth)
    const overflow = scrollWidth > clientWidth + 3
    setHasOverflow(overflow)
    setCanScrollLeft(scrollLeft > 3)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 3)
  }, [])

  // Sync scroll from table to sticky scrollbar
  const handleTableScroll = () => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    if (stickyScrollbarRef.current && tableContainerRef.current) {
      stickyScrollbarRef.current.scrollLeft = tableContainerRef.current.scrollLeft
    }
    updateScrollState()
    requestAnimationFrame(() => {
      isSyncingRef.current = false
    })
  }

  // Sync scroll from sticky scrollbar to table
  const handleStickyScroll = () => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    if (tableContainerRef.current && stickyScrollbarRef.current) {
      tableContainerRef.current.scrollLeft = stickyScrollbarRef.current.scrollLeft
    }
    updateScrollState()
    requestAnimationFrame(() => {
      isSyncingRef.current = false
    })
  }

  // Smooth scroll helper for left/right nudge buttons
  const scrollTable = (offset) => {
    if (!tableContainerRef.current) return
    tableContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

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
        String(o.id || '').toLowerCase().includes(search) ||
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeStatusTab, searchTerm, selectedCity, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, currentPage, pageSize])

  // Monitor table and container dimensions with ResizeObserver
  useEffect(() => {
    updateScrollState()

    const container = tableContainerRef.current
    if (!container) return

    const ro = new ResizeObserver(() => {
      updateScrollState()
    })

    ro.observe(container)
    const tableEl = container.querySelector('table')
    if (tableEl) ro.observe(tableEl)

    window.addEventListener('resize', updateScrollState)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateScrollState)
    }
  }, [paginatedOrders, currentPage, updateScrollState])

  // Export to Excel / CSV
  const exportToExcel = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      alert('No orders available to export.')
      return
    }
    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Mobile Number',
      'City',
      'Delivery Address',
      'Total Items',
      'Ordered Products',
      'Total Amount (Rs)',
      'Payment Method',
      'Status',
      'Tracking Number',
      'Customer Notes'
    ]
    const rows = filteredOrders.map(o => {
      const itemsSummary = (o.items || []).map(i => {
        const v = i.variant?.title || i.variant_title ? ` [${i.variant?.title || i.variant_title}]` : ''
        return `${i.qty || 1}x ${i.product?.name || i.name || 'Product'}${v}`
      }).join('; ')

      return [
        `"${o.id || ''}"`,
        `"${o.date || ''}"`,
        `"${(o.customer?.name || o.customerName || '').replace(/"/g, '""')}"`,
        `"${o.customer?.mobile || o.customerMobile || ''}"`,
        `"${(o.customer?.city || o.customerCity || '').replace(/"/g, '""')}"`,
        `"${(o.customer?.address || o.deliveryAddress || '').replace(/"/g, '""')}"`,
        (o.items || []).reduce((sum, i) => sum + (i.qty || 1), 0),
        `"${itemsSummary.replace(/"/g, '""')}"`,
        Number(o.total || 0),
        `"${o.paymentMethod || 'Cash on Delivery'}"`,
        `"${o.status || 'Pending'}"`,
        `"${o.trackingNumber || ''}"`,
        `"${(o.notes || '').replace(/"/g, '""')}"`
      ]
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SaveAndSmile_Orders_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Render status badge with high contrast & bright colors
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span 
            className="badge badge-status badge-pending" 
            style={{ backgroundColor: '#fef3c7', color: '#78350f', border: '1px solid #fde68a', fontWeight: 600 }}
          >
            <i className="bi bi-clock-history"></i> Pending
          </span>
        )
      case 'Processing':
        return (
          <span 
            className="badge badge-status badge-processing"
            style={{ backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', fontWeight: 600 }}
          >
            <i className="bi bi-gear-fill"></i> Processing
          </span>
        )
      case 'Shipped':
        return (
          <span 
            className="badge badge-status badge-shipped"
            style={{ backgroundColor: '#ede9fe', color: '#5b21b6', border: '1px solid #c4b5fd', fontWeight: 600 }}
          >
            <i className="bi bi-truck"></i> Shipped
          </span>
        )
      case 'Delivered':
        return (
          <span 
            className="badge badge-status badge-delivered"
            style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 600 }}
          >
            <i className="bi bi-check-circle-fill"></i> Delivered
          </span>
        )
      case 'Cancelled':
        return (
          <span 
            className="badge badge-status badge-cancelled"
            style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 600 }}
          >
            <i className="bi bi-x-circle-fill"></i> Cancelled
          </span>
        )
      default:
        return <span className="badge bg-secondary">{status}</span>
    }
  }

  return (
    <div className="orders-view">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h3 className="fw-semibold mb-0.5" style={{ fontSize: '1.2rem' }}>Customer Orders</h3>
          <p className="text-muted small mb-0" style={{ fontSize: '11px' }}>
            Track and process real-time customer purchases and fulfillment status
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1.5 shadow-sm bg-white"
            style={{ fontSize: '11px', height: '30px', padding: '3px 9px' }}
            onClick={exportToExcel}
            title="Download Customer Orders to Excel / CSV"
          >
            <i className="bi bi-file-earmark-excel-fill text-success fs-6"></i>
            <span className="fw-medium">Export to Excel</span>
          </button>
          <span 
            className="badge border px-2.5 py-1.5 fw-medium d-inline-flex align-items-center"
            style={{ backgroundColor: '#fef3c7', color: '#78350f', borderColor: '#fde68a', fontSize: '10.5px' }}
          >
            <i className="bi bi-bell-fill me-1 text-warning"></i> {counts.pending} Orders Need Confirmation
          </span>
        </div>
      </div>

      {/* Status Navigation Tabs */}
      <div className="card shadow-sm mb-3">
        <div className="card-body p-2 p-md-2.5">
          <div className="d-flex flex-wrap gap-1.5">
            <button
              className={`btn btn-sm ${activeStatusTab === 'ALL' ? 'btn-dark' : 'btn-light border'}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
              onClick={() => setActiveStatusTab('ALL')}
            >
              All Orders <span className="badge bg-secondary ms-1">{counts.all}</span>
            </button>
            <button
              className={`btn btn-sm ${activeStatusTab === 'Pending' ? 'btn-warning text-dark fw-bold' : 'btn-light border'}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
              onClick={() => setActiveStatusTab('Pending')}
            >
              Pending <span className="badge bg-light text-dark ms-1">{counts.pending}</span>
            </button>
            <button
              className={`btn btn-sm ${activeStatusTab === 'Processing' ? 'btn-primary' : 'btn-light border'}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
              onClick={() => setActiveStatusTab('Processing')}
            >
              Processing <span className="badge bg-light text-primary ms-1">{counts.processing}</span>
            </button>
            <button
              className={`btn btn-sm ${activeStatusTab === 'Shipped' ? 'btn-info text-white' : 'btn-light border'}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
              onClick={() => setActiveStatusTab('Shipped')}
            >
              Shipped <span className="badge bg-light text-dark ms-1">{counts.shipped}</span>
            </button>
            <button
              className={`btn btn-sm ${activeStatusTab === 'Delivered' ? 'btn-success' : 'btn-light border'}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
              onClick={() => setActiveStatusTab('Delivered')}
            >
              Delivered <span className="badge bg-light text-success ms-1">{counts.delivered}</span>
            </button>
            <button
              className={`btn btn-sm ${activeStatusTab === 'Cancelled' ? 'btn-danger' : 'btn-light border'}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
              onClick={() => setActiveStatusTab('Cancelled')}
            >
              Cancelled <span className="badge bg-light text-danger ms-1">{counts.cancelled}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm mb-3">
        <div className="card-body p-2.5 p-md-3">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  style={{ fontSize: '11px' }}
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
                className="form-select form-select-sm"
                style={{ fontSize: '11px' }}
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
                className="form-select form-select-sm"
                style={{ fontSize: '11px' }}
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
        <div 
          className="table-responsive orders-table-wrapper"
          ref={tableContainerRef}
          onScroll={handleTableScroll}
        >
          <table className="table admin-table orders-table mb-0" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th style={{ width: 118 }}>Order ID &amp; Date</th>
                <th style={{ width: 120 }}>Customer Info</th>
                <th style={{ width: 142, minWidth: 135 }}>City &amp; Address</th>
                <th style={{ width: 160, minWidth: 150 }}>Ordered Items</th>
                <th style={{ width: 86 }}>Total (COD)</th>
                <th className="text-center" style={{ width: 100 }}>Current Status</th>
                <th className="text-center" style={{ width: 156 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-receipt fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    No orders found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ width: 118 }}>
                      <div className="fw-semibold text-primary font-monospace" style={{ fontSize: '0.78rem' }}>{order.id}</div>
                      <small className="text-muted d-block" style={{ fontSize: '10px' }}>{order.date}</small>
                    </td>
                    <td style={{ width: 120 }}>
                      <div className="fw-medium text-dark" style={{ fontSize: '0.8rem' }}>{order.customer?.name || order.customerName || 'Guest Customer'}</div>
                      <div className="small text-muted d-flex align-items-center gap-1" style={{ fontSize: '10.5px' }}>
                        <i className="bi bi-telephone"></i>
                        <span>{order.customer?.mobile || order.customerMobile || '—'}</span>
                      </div>
                    </td>
                    <td style={{ width: 142, minWidth: 135 }}>
                      <span className="badge bg-light text-dark border mb-1 fw-normal" style={{ fontSize: '10px' }}>
                        <i className="bi bi-geo-alt me-1 text-danger"></i>
                        {order.customer?.city || order.customerCity || 'Pakistan'}
                      </span>
                      <small className="text-muted d-block" style={{ fontSize: '10.5px', wordBreak: 'break-word' }} title={order.customer?.address || order.deliveryAddress || ''}>
                        {order.customer?.address || order.deliveryAddress || 'Standard Delivery Address'}
                      </small>
                      {order.notes && (
                        <div className="mt-0.5" title={`Customer note: ${order.notes}`}>
                          <span 
                            className="badge border d-inline-block text-wrap" 
                            style={{ fontSize: '10px', fontWeight: 500, backgroundColor: '#fef3c7', color: '#78350f', borderColor: '#fde68a', maxWidth: '100%' }}
                          >
                            <i className="bi bi-chat-left-quote-fill me-1"></i>
                            {order.notes}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ width: 160, minWidth: 150 }}>
                      <div className="small">
                        <span className="fw-medium text-dark" style={{ fontSize: '10.5px' }}>
                          {(order.items || []).reduce((sum, i) => sum + (i.qty || 1), 0)} items:
                        </span>
                        <div className="text-muted" style={{ fontSize: '10.5px', wordBreak: 'break-word' }} title={(order.items || []).map(i => `${i.qty || 1}x ${i.product?.name || i.name || 'Product'}`).join(', ')}>
                          {(order.items || []).map(i => `${i.qty || 1}x ${i.product?.name || i.name || 'Product'}`).join(', ')}
                        </div>
                      </div>
                    </td>
                    <td style={{ width: 86, whiteSpace: 'nowrap' }}>
                      <div className="fw-medium text-dark" style={{ fontSize: '0.78rem' }}>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>{storeSettings?.currency || 'Rs.'}</span> {Number(order.total || 0).toLocaleString()}
                      </div>
                      <small className="text-muted d-block" style={{ fontSize: '9.5px' }}>{order.paymentMethod || 'Cash on Delivery'}</small>
                    </td>
                    <td className="text-center" style={{ width: 100 }}>
                      <div className="d-flex justify-content-center align-items-center">
                        {renderStatusBadge(order.status)}
                      </div>
                    </td>
                    <td className="text-center" style={{ width: 156, whiteSpace: 'nowrap' }}>
                      <div className="d-flex justify-content-center align-items-center gap-1">
                        <button
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                          style={{ width: '28px', height: '28px', padding: 0 }}
                          onClick={() => onSelectOrder(order)}
                          title="View Order Details & Print Invoice"
                          aria-label={`View order ${order.id}`}
                        >
                          <i className="bi bi-eye" style={{ fontSize: '13px' }}></i>
                        </button>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: 92, fontSize: 10, height: '28px', padding: '2px 4px' }}
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
                          className="btn btn-sm btn-light border text-danger d-inline-flex align-items-center justify-content-center"
                          style={{ width: '28px', height: '28px', padding: 0 }}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete order ${order.id}?`)) {
                              deleteOrder(order.id)
                            }
                          }}
                          title="Delete Order"
                          aria-label={`Delete order ${order.id}`}
                        >
                          <i className="bi bi-trash" style={{ fontSize: '12px' }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Persistent Sticky Synchronized Horizontal Scrollbar */}
        {hasOverflow && (
          <div 
            className="orders-sticky-scrollbar-wrap"
            role="region"
            aria-label="Orders table horizontal scrollbar"
          >
            <button
              type="button"
              className="orders-sticky-scroll-btn"
              onClick={() => scrollTable(-260)}
              disabled={!canScrollLeft}
              title="Scroll table left"
              aria-label="Scroll table left"
            >
              <i className="bi bi-chevron-left"></i>
            </button>

            <div 
              className="orders-sticky-scrollbar-track" 
              ref={stickyScrollbarRef} 
              onScroll={handleStickyScroll}
              title="Drag horizontal scrollbar to navigate columns"
            >
              <div style={{ width: `${tableScrollWidth}px`, height: '1px' }} />
            </div>

            <button
              type="button"
              className="orders-sticky-scroll-btn"
              onClick={() => scrollTable(260)}
              disabled={!canScrollRight}
              title="Scroll table right"
              aria-label="Scroll table right"
            >
              <i className="bi bi-chevron-right"></i>
            </button>

            <div className="orders-scroll-hint d-none d-sm-flex align-items-center gap-1 text-muted small ms-1" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
              <i className="bi bi-arrows-expand text-primary" style={{ transform: 'rotate(45deg)' }}></i>
              <span>Scroll columns</span>
            </div>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredOrders.length > 0 && (
          <div className="card-footer bg-white border-top d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 p-3">
            <span className="small text-muted">
              Showing <strong>{((currentPage - 1) * pageSize) + 1}</strong>–<strong>{Math.min(currentPage * pageSize, filteredOrders.length)}</strong> of <strong>{filteredOrders.length}</strong> orders
            </span>
            {totalPages > 1 && (
              <nav aria-label="Orders pagination">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1}
                      aria-label="Previous"
                    >
                      &laquo; Prev
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <li key={pg} className={`page-item ${currentPage === pg ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(pg)}>
                        {pg}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages}
                      aria-label="Next"
                    >
                      Next &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
