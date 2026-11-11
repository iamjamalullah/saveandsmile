import { useState } from 'react'
import { useStoreData } from '../../context/StoreDataContext'

export default function OrderModal({ order, onClose }) {
  const { storeSettings, updateOrderStatus } = useStoreData()
  const [tracking, setTracking] = useState(order?.trackingNumber || '')
  const [notes, setNotes] = useState(order?.notes || '')

  if (!order) return null

  const itemsCount = order.items.reduce((sum, i) => sum + i.qty, 0)
  const subtotal = order.items.reduce((sum, i) => sum + i.qty * (i.variant?.price ?? i.unitPrice ?? i.product?.price ?? 0), 0)
  const shipping = order.shippingFee || 0
  const grandTotal = subtotal + shipping

  // Clean phone number for WhatsApp link
  const cleanPhone = (order.customer.mobile || '').replace(/[^0-9]/g, '')
  const waNumber = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone
  const waMessage = encodeURIComponent(`Assalam o Alaikum ${order.customer.name}, this is regarding your order ${order.id} on ${storeSettings.name}.`)
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`

  const handleStatusChange = (newStatus) => {
    updateOrderStatus(order.id, newStatus, tracking)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
          {/* Modal Header */}
          <div className="modal-header bg-dark text-white py-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-warning text-dark font-monospace fs-6">{order.id}</span>
              <h5 className="modal-title fw-bold mb-0 text-white">Order Details &amp; Fulfillment</h5>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4 printable-invoice">
            {/* Header info (Printable) */}
            <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <div className="admin-sidebar-logo" style={{ width: 32, height: 32, fontSize: '0.9rem' }}>G</div>
                  <h4 className="fw-bold mb-0 text-dark">{storeSettings.name}</h4>
                </div>
                <small className="text-muted d-block">{storeSettings.tagline}</small>
                <small className="text-muted d-block">Contact: {storeSettings.phone} | {storeSettings.email}</small>
              </div>
              <div className="text-end">
                <span className="badge bg-secondary font-monospace">INVOICE</span>
                <div className="fw-bold text-dark mt-1">Date: {order.date}</div>
                <div className="small text-muted">Payment: {order.paymentMethod}</div>
                <div className="mt-1">
                  <span className={`badge ${order.status === 'Delivered' ? 'bg-success' : order.status === 'Cancelled' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                    Status: {order.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer & Shipping Details */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-6">
                <div className="card h-100 bg-light border-0 p-3">
                  <h6 className="fw-bold text-uppercase small text-muted mb-2">Customer Information</h6>
                  <div className="fw-bold text-dark fs-6">{order.customer.name}</div>
                  <div className="small text-muted mb-1">
                    <i className="bi bi-telephone text-primary me-1"></i>
                    {order.customer.mobile}
                  </div>
                  {order.customer.email && (
                    <div className="small text-muted mb-2">
                      <i className="bi bi-envelope text-primary me-1"></i>
                      {order.customer.email}
                    </div>
                  )}
                  <div className="no-print mt-2">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-success d-inline-flex align-items-center gap-1.5"
                    >
                      <i className="bi bi-whatsapp"></i> Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="card h-100 bg-light border-0 p-3">
                  <h6 className="fw-bold text-uppercase small text-muted mb-2">Delivery Address</h6>
                  <div className="mb-1">
                    <span className="badge bg-dark mb-1">{order.customer.city}</span>
                  </div>
                  <p className="small text-dark mb-2">{order.customer.address}</p>
                  {order.trackingNumber && (
                    <div className="small text-primary fw-semibold">
                      <i className="bi bi-truck me-1"></i> Courier Tracking: {order.trackingNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items List */}
            <h6 className="fw-bold text-dark mb-2">Purchased Items ({itemsCount})</h6>
            <div className="table-responsive border rounded mb-3">
              <table className="table admin-table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Item Description</th>
                    <th>Category</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Unit Price</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => {
                    const unitPrice = Number(item.variant?.price ?? item.unitPrice ?? item.product?.price ?? 0)
                    const variantLabel = item.variantTitle || item.variant?.title || [item.variant?.color, item.variant?.size].filter(Boolean).join(' / ')
                    const skuCode = item.variant?.sku || item.sku || item.product?.sku
                    return (
                      <tr key={idx}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={item.product?.image || '/images/cat1.jpg'}
                              alt={item.product?.name}
                              className="admin-thumb"
                              onError={(e) => { e.target.src = '/images/cat1.jpg' }}
                            />
                            <div>
                              <div className="fw-semibold text-dark">{item.product?.name}</div>
                              {variantLabel && (
                                <div className="badge bg-primary-subtle text-primary border border-primary-subtle my-0.5" style={{ fontSize: '11px' }}>
                                  <i className="bi bi-tag-fill me-1"></i> {variantLabel}
                                </div>
                              )}
                              <div className="small text-muted font-monospace">
                                {skuCode ? `SKU: ${skuCode} | ` : ''}ID: {item.product?.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{item.product?.category}</span>
                        </td>
                        <td className="text-center fw-bold">{item.qty}</td>
                        <td className="text-end">
                          {storeSettings.currency} {unitPrice.toLocaleString()}
                        </td>
                        <td className="text-end fw-bold">
                          {storeSettings.currency} {(item.qty * unitPrice).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pricing Summary */}
            <div className="row justify-content-end mb-3">
              <div className="col-12 col-md-6">
                <div className="card bg-light border-0 p-3">
                  <div className="d-flex justify-content-between mb-1 small">
                    <span className="text-muted">Subtotal:</span>
                    <span className="fw-semibold">{storeSettings.currency} {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1 small">
                    <span className="text-muted">Shipping Fee:</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-success fw-bold">FREE</span>
                      ) : (
                        `${storeSettings.currency} ${shipping.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between fs-5 fw-bold text-dark">
                    <span>Total Due (COD):</span>
                    <span className="text-primary">{storeSettings.currency} {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons & Status Changer (Hidden when printing) */}
            <div className="no-print border-top pt-3 mt-4">
              <h6 className="fw-bold mb-2">Update Order Status</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  className={`btn btn-sm ${order.status === 'Pending' ? 'btn-warning fw-bold' : 'btn-outline-secondary'}`}
                  onClick={() => handleStatusChange('Pending')}
                >
                  <i className="bi bi-clock-history me-1"></i> Pending
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${order.status === 'Processing' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleStatusChange('Processing')}
                >
                  <i className="bi bi-gear-fill me-1"></i> Processing
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${order.status === 'Shipped' ? 'btn-info text-white' : 'btn-outline-info'}`}
                  onClick={() => handleStatusChange('Shipped')}
                >
                  <i className="bi bi-truck me-1"></i> Mark as Shipped
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${order.status === 'Delivered' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => handleStatusChange('Delivered')}
                >
                  <i className="bi bi-check-circle-fill me-1"></i> Mark as Delivered
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${order.status === 'Cancelled' ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => handleStatusChange('Cancelled')}
                >
                  <i className="bi bi-x-circle-fill me-1"></i> Cancel Order
                </button>
              </div>

              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-6">
                  <label className="form-label small text-muted mb-1">Courier Tracking ID (TCS / Leopard / PostEx)</label>
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. TCS-88992211"
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => updateOrderStatus(order.id, order.status, tracking)}
                    >
                      Save Tracking
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-light no-print">
            <button type="button" className="btn btn-outline-dark" onClick={handlePrint}>
              <i className="bi bi-printer me-1"></i> Print Invoice
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
