import { useEffect, useState } from 'react'
import { useStoreData } from '../../context/StoreDataContext'

export default function ReviewsView() {
  const { reviews = [], products = [], addReview, loadReviews, updateReviewStatus, toggleReviewStatus, deleteReview } = useStoreData()
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ name: '', title: '', text: '', rating: 5, productId: '' })
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadReviews?.()
  }, [loadReviews])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadReviews?.()
    setRefreshing(false)
  }

  const pendingCount = reviews.filter(r => r.status === 'pending').length
  const approvedCount = reviews.filter(r => r.status === 'approved' || !r.status).length
  const hiddenCount = reviews.filter(r => r.status === 'hidden').length

  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending') return r.status === 'pending'
    if (filter === 'approved') return r.status === 'approved' || !r.status
    if (filter === 'hidden') return r.status === 'hidden'
    return true
  })

  // Ensure latest reviews always appear at the top
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    const idA = Number(a.id) || 0
    const idB = Number(b.id) || 0
    if (idA && idB && idA !== idB) return idB - idA

    const dateA = a.date ? Date.parse(a.date) || 0 : 0
    const dateB = b.date ? Date.parse(b.date) || 0 : 0
    if (dateA !== dateB) return dateB - dateA

    return 0
  })

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name || !form.text) return
    addReview({ ...form, status: 'approved' })
    setForm({ name: '', title: '', text: '', rating: 5, productId: '' })
    setShowAddModal(false)
  }

  return (
    <div className="reviews-view">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Customer Reviews &amp; Testimonials</h3>
          <p className="text-muted small mb-0">
            Moderate, approve and showcase authentic customer reviews on product pages
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary fw-semibold" onClick={handleRefresh} disabled={refreshing}>
            <i className={`bi bi-arrow-clockwise me-1 ${refreshing ? 'spin' : ''}`}></i>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-admin-primary fw-semibold" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus-lg me-1"></i> Add Verified Review
          </button>
        </div>
      </div>

      {/* Reviews Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm h-100 p-4 text-center">
            <h1 className="display-4 fw-bold text-warning mb-1">4.9</h1>
            <div className="text-warning fs-5 mb-2">
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
            </div>
            <p className="text-muted small mb-0">Overall Customer Satisfaction Score</p>
          </div>
        </div>

        <div className="col-12 col-md-8">
          <div className="card shadow-sm h-100 p-4">
            <h6 className="fw-bold mb-3">Moderation Status</h6>
            <div className="row g-3 text-center">
              <div className="col-4">
                <div className="p-3 rounded bg-light border">
                  <div className="fs-3 fw-bold text-dark">{reviews.length}</div>
                  <small className="text-muted">Total Reviews</small>
                </div>
              </div>
              <div className="col-4">
                <div className="p-3 rounded bg-warning bg-opacity-10 border border-warning">
                  <div className="fs-3 fw-bold text-warning">{pendingCount}</div>
                  <small className="text-dark fw-medium">Pending Approval</small>
                </div>
              </div>
              <div className="col-4">
                <div className="p-3 rounded bg-success bg-opacity-10 border border-success">
                  <div className="fs-3 fw-bold text-success">{approvedCount}</div>
                  <small className="text-dark fw-medium">Approved &amp; Live</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <ul className="nav nav-pills mb-3 gap-2">
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'all' ? 'active bg-dark text-white' : 'bg-white border text-dark'}`}
            onClick={() => setFilter('all')}
          >
            All Reviews ({reviews.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'pending' ? 'active bg-warning text-dark' : 'bg-white border text-dark'}`}
            onClick={() => setFilter('pending')}
          >
            Pending Approval ({pendingCount})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'approved' ? 'active bg-success text-white' : 'bg-white border text-dark'}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({approvedCount})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'hidden' ? 'active bg-secondary text-white' : 'bg-white border text-dark'}`}
            onClick={() => setFilter('hidden')}
          >
            Hidden ({hiddenCount})
          </button>
        </li>
      </ul>

      {/* Reviews List */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Customer Feedback ({sortedReviews.length})</h5>
          {pendingCount > 0 && filter !== 'pending' && (
            <span className="badge bg-warning text-dark">
              {pendingCount} review{pendingCount > 1 ? 's' : ''} awaiting moderation
            </span>
          )}
        </div>
        <div className="table-responsive">
          <table className="table admin-table mb-0 align-middle">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Target Product</th>
                <th>Rating &amp; Title</th>
                <th>Feedback Text</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedReviews.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No reviews in this view.
                  </td>
                </tr>
              ) : (
                sortedReviews.map((rev, idx) => {
                  const targetProduct = rev.productId ? products.find(p => p.id === rev.productId) : null
                  return (
                    <tr key={rev.id || idx}>
                      <td>
                        <div className="fw-bold text-dark">{rev.name}</div>
                        <small className="text-muted">Verified Customer</small>
                      </td>
                      <td>
                        {targetProduct ? (
                          <div className="small fw-semibold text-truncate" style={{ maxWidth: 160 }} title={targetProduct.name}>
                            {targetProduct.name}
                          </div>
                        ) : (
                          <span className="small text-muted">Store General</span>
                        )}
                      </td>
                      <td>
                        <div className="text-warning small mb-1">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                            <i key={i} className="bi bi-star-fill me-0.5"></i>
                          ))}
                        </div>
                        <strong className="text-dark small">{rev.title}</strong>
                      </td>
                      <td>
                        <p className="small text-muted mb-0" style={{ maxWidth: 320 }}>
                          "{rev.text}"
                        </p>
                      </td>
                      <td className="small text-muted">{rev.date}</td>
                      <td>
                        {rev.status === 'pending' ? (
                          <span className="badge bg-warning text-dark">Pending</span>
                        ) : rev.status === 'hidden' ? (
                          <span className="badge bg-secondary">Hidden</span>
                        ) : (
                          <span className="badge bg-success">Approved</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          {rev.status === 'pending' ? (
                            <>
                              <button
                                className="btn btn-sm btn-success fw-semibold"
                                onClick={async () => {
                                  await updateReviewStatus(rev.id || idx, 'approved')
                                  await loadReviews?.()
                                }}
                                title="Approve and Publish Review"
                              >
                                ✓ Approve
                              </button>
                              <button
                                className="btn btn-sm btn-light border"
                                onClick={async () => {
                                  await updateReviewStatus(rev.id || idx, 'hidden')
                                  await loadReviews?.()
                                }}
                                title="Hide / Reject"
                              >
                                ✕ Hide
                              </button>
                            </>
                          ) : rev.status === 'hidden' ? (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={async () => {
                                await updateReviewStatus(rev.id || idx, 'approved')
                                await loadReviews?.()
                              }}
                              title="Publish Review"
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={async () => {
                                await updateReviewStatus(rev.id || idx, 'hidden')
                                await loadReviews?.()
                              }}
                              title="Hide Review"
                            >
                              Hide
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={async () => {
                              if (window.confirm('Delete this review permanently?')) {
                                await deleteReview(rev.id || idx)
                                await loadReviews?.()
                              }
                            }}
                            title="Delete Review"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title fw-bold">Add Verified Testimonial / Review</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAdd}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Customer Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Zahida Fareed"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Review Headline</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Excellent quality, fast delivery"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Rating (Stars)</label>
                    <select
                      className="form-select"
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 Stars - Excellent)</option>
                      <option value="4">⭐⭐⭐⭐ (4 Stars - Very Good)</option>
                      <option value="3">⭐⭐⭐ (3 Stars - Average)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Assign to Product (Optional)</label>
                    <select
                      className="form-select"
                      value={form.productId}
                      onChange={(e) => setForm({ ...form, productId: e.target.value ? Number(e.target.value) : '' })}
                    >
                      <option value="">Store General Review</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Feedback Comment *</label>
                    <textarea
                      rows="3"
                      className="form-control"
                      placeholder="Write customer feedback..."
                      value={form.text}
                      onChange={(e) => setForm({ ...form, text: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-admin-primary fw-semibold">
                    Add &amp; Publish Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
