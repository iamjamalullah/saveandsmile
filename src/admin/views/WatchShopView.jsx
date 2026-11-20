import { useState, useEffect } from 'react'
import { useStoreData } from '../../context/StoreDataContext'
import { extractYouTubeId } from '../../components/WatchAndShop'

const EMPTY_FORM = {
  title: '',
  description: '',
  youtubeUrl: '',
  productId: '',
  price: '',
  oldPrice: '',
  image: '',
  order: 1,
  active: true,
}

export default function WatchShopView() {
  const {
    watchShop = [],
    products = [],
    storeSettings,
    loadWatchShop,
    addWatchShopItem,
    updateWatchShopItem,
    deleteWatchShopItem,
    clearAllWatchShop,
    notify,
  } = useStoreData()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [previewVideo, setPreviewVideo] = useState(null)

  useEffect(() => {
    loadWatchShop?.()
  }, [loadWatchShop])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadWatchShop?.()
      notify('Video products list refreshed.')
    } finally {
      setRefreshing(false)
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm({
      ...EMPTY_FORM,
      order: (watchShop.length || 0) + 1,
    })
    setModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingId(item.id)
    setForm({
      title: item.title || item.name || '',
      description: item.description || '',
      youtubeUrl: item.youtubeUrl || item.video || '',
      productId: item.productId ? String(item.productId) : '',
      price: item.price !== undefined ? String(item.price) : '',
      oldPrice: item.oldPrice !== undefined ? String(item.oldPrice) : '',
      image: item.image || '',
      order: item.order !== undefined ? Number(item.order) : 1,
      active: item.active !== false,
    })
    setModalOpen(true)
  }

  // Handle Catalog Product Link auto-fill
  const handleProductSelect = (pId) => {
    const selectedProd = products.find(p => String(p.id) === String(pId))
    if (!selectedProd) {
      setForm(prev => ({ ...prev, productId: '' }))
      return
    }

    setForm(prev => ({
      ...prev,
      productId: String(selectedProd.id),
      title: prev.title ? prev.title : selectedProd.name,
      description: prev.description ? prev.description : (selectedProd.description || ''),
      price: prev.price !== '' ? prev.price : String(selectedProd.price || 0),
      oldPrice: prev.oldPrice !== '' ? prev.oldPrice : String(selectedProd.oldPrice || selectedProd.price || 0),
      image: prev.image ? prev.image : (selectedProd.image || selectedProd.images?.[0] || ''),
    }))
  }

  const currentYtId = extractYouTubeId(form.youtubeUrl)
  const autoThumbnail = currentYtId ? `https://img.youtube.com/vi/${currentYtId}/hqdefault.jpg` : ''

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      notify('Please enter a product title', 'warning')
      return
    }

    const effectiveImage = form.image.trim() || autoThumbnail || '/images/banner-placeholder.webp'
    const payload = {
      title: form.title.trim(),
      name: form.title.trim(),
      description: form.description.trim(),
      youtubeUrl: form.youtubeUrl.trim(),
      video: form.youtubeUrl.trim(),
      image: effectiveImage,
      productId: form.productId ? Number(form.productId) : null,
      price: Number(form.price) || 0,
      oldPrice: Number(form.oldPrice) || Number(form.price) || 0,
      order: Number(form.order) || 1,
      active: Boolean(form.active),
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateWatchShopItem(editingId, payload)
      } else {
        await addWatchShopItem(payload)
      }
      setModalOpen(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!deleteConfirm) return
    try {
      await deleteWatchShopItem(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleClearAll = async () => {
    try {
      await clearAllWatchShop()
      setShowClearConfirm(false)
    } catch (err) {
      console.error('Clear all error:', err)
    }
  }

  return (
    <div className="watch-shop-view">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">
            <i className="bi bi-camera-reels me-2 text-danger"></i>
            Watch &amp; Shop Video Products
          </h3>
          <p className="text-muted small mb-0">
            Showcase interactive video product reels with YouTube video demonstrations on your storefront homepage
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-outline-secondary fw-semibold btn-sm px-3"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <i className={`bi bi-arrow-clockwise me-1 ${refreshing ? 'spin' : ''}`}></i>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {watchShop.length > 0 && (
            <button
              className="btn btn-outline-danger fw-semibold btn-sm px-3"
              onClick={() => setShowClearConfirm(true)}
            >
              <i className="bi bi-trash3 me-1"></i> Delete All Existing
            </button>
          )}
          <button
            className="btn btn-admin-primary fw-semibold btn-sm px-3 shadow-sm"
            onClick={openAddModal}
          >
            <i className="bi bi-plus-lg me-1"></i> Add Video Product
          </button>
        </div>
      </div>

      {/* Main Content: Empty State vs Video Cards Grid */}
      {watchShop.length === 0 ? (
        <div className="card shadow-sm border-0 p-5 text-center my-3">
          <div
            className="rounded-circle bg-danger-subtle text-danger mx-auto d-flex align-items-center justify-content-center mb-3 shadow-sm"
            style={{ width: 80, height: 80 }}
          >
            <i className="bi bi-camera-reels-fill fs-1"></i>
          </div>
          <h4 className="fw-bold mb-2 text-dark">No Video Products Found</h4>
          <p className="text-muted mx-auto mb-4" style={{ maxWidth: 520 }}>
            All previous video products have been removed as requested. You can now add new video products linked to your catalog with YouTube video links, product names, and descriptions.
          </p>
          <div>
            <button className="btn btn-admin-primary fw-bold px-4 py-2 shadow-sm" onClick={openAddModal}>
              <i className="bi bi-plus-circle me-2"></i> Add First Video Product
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {watchShop.map((item, idx) => {
            const ytId = item.videoId || extractYouTubeId(item.youtubeUrl || item.video)
            const cardImg = item.image || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '/images/banner-placeholder.webp')
            const linkedProd = products.find(p => String(p.id) === String(item.productId))
            const price = Number(item.price || linkedProd?.price || 0)
            const oldPrice = Number(item.oldPrice || linkedProd?.oldPrice || 0)

            return (
              <div key={item.id || idx} className="col-12 col-sm-6 col-md-4 col-xl-3">
                <div className="card h-100 shadow-sm border-0 overflow-hidden position-relative">
                  {/* Thumbnail / Video Preview Box */}
                  <div
                    className="position-relative bg-dark text-center cursor-pointer"
                    style={{ height: 210, overflow: 'hidden' }}
                    onClick={() => {
                      if (ytId) setPreviewVideo({ ...item, ytId })
                    }}
                    title={ytId ? 'Click to preview YouTube video' : ''}
                  >
                    <img
                      src={cardImg}
                      alt={item.title || item.name}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                      onError={(e) => { e.target.src = '/images/banner-placeholder.webp' }}
                    />

                    {/* Play Badge */}
                    <div className="position-absolute top-50 start-50 translate-middle">
                      <div
                        className="rounded-circle bg-white text-danger d-flex align-items-center justify-content-center shadow-lg"
                        style={{ width: 48, height: 48, cursor: 'pointer' }}
                      >
                        <i className="bi bi-play-fill fs-3 ms-1"></i>
                      </div>
                    </div>

                    {/* Active/Inactive Badge */}
                    <span className={`position-absolute top-0 start-0 m-2 badge ${item.active !== false ? 'bg-success' : 'bg-secondary'}`}>
                      {item.active !== false ? 'Active' : 'Hidden'}
                    </span>

                    {/* YouTube Pill */}
                    {ytId && (
                      <span className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white">
                        <i className="bi bi-youtube text-danger me-1"></i> YouTube
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="card-body p-3 d-flex flex-column">
                    <h6 className="fw-bold text-dark text-truncate mb-1" title={item.title || item.name}>
                      {item.title || item.name}
                    </h6>

                    {item.description ? (
                      <p
                        className="text-muted small mb-2"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.35',
                        }}
                      >
                        {item.description}
                      </p>
                    ) : (
                      <p className="text-muted small fst-italic mb-2">No description provided</p>
                    )}

                    {/* Linked Product Badge */}
                    {linkedProd ? (
                      <div className="mb-2">
                        <span className="badge bg-light text-primary border text-truncate d-inline-block" style={{ maxWidth: '100%' }}>
                          <i className="bi bi-link-45deg me-1"></i> Linked: {linkedProd.name}
                        </span>
                      </div>
                    ) : item.productId ? (
                      <div className="mb-2">
                        <span className="badge bg-light text-secondary border">
                          <i className="bi bi-link-45deg me-1"></i> Product #{item.productId}
                        </span>
                      </div>
                    ) : null}

                    {/* Price & Actions in Footer */}
                    <div className="mt-auto pt-2 border-top">
                      <div className="d-flex align-items-baseline justify-content-between mb-2">
                        <div>
                          <span className="fw-bold text-dark fs-6">
                            {storeSettings?.currency || 'Rs.'} {price.toLocaleString()}
                          </span>
                          {oldPrice > price && (
                            <s className="small text-muted ms-2">
                              {storeSettings?.currency || 'Rs.'} {oldPrice.toLocaleString()}
                            </s>
                          )}
                        </div>
                        <span className="badge bg-light text-dark border">
                          Order: #{item.order || idx + 1}
                        </span>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary flex-grow-1 fw-semibold"
                          onClick={() => openEditModal(item)}
                        >
                          <i className="bi bi-pencil me-1"></i> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger px-2.5"
                          onClick={() => setDeleteConfirm(item)}
                          title="Delete Video Product"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Video Product Modal */}
      {modalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-camera-reels me-2 text-danger"></i>
                  {editingId ? 'Edit Video Product' : 'Add New Video Product'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                ></button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  {/* Optional: Link Product Selector */}
                  <div className="mb-3 p-3 bg-light rounded-3 border">
                    <label className="form-label fw-bold mb-1 text-primary d-flex align-items-center">
                      <i className="bi bi-link-45deg fs-5 me-1"></i>
                      Link To Existing Store Product (Optional)
                    </label>
                    <small className="text-muted d-block mb-2">
                      Select an existing product from your store catalogue to auto-fill its name, price and details:
                    </small>
                    <select
                      className="form-select"
                      value={form.productId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                    >
                      <option value="">-- Standalone / No Linked Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.id} — {p.name} ({storeSettings?.currency || 'Rs.'} {Number(p.price || 0).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Title / Name */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Product Name / Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 360 Rotatable Multi-Purpose Cleaning Mop"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>

                  {/* Product Details / Description */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Product Detail / Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Enter product details, specifications, features and package contents..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    ></textarea>
                  </div>

                  {/* YouTube Video Link */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-youtube text-danger me-1"></i>
                      YouTube Video Link <span className="text-danger">*</span>
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Paste YouTube video or Shorts link (e.g. https://www.youtube.com/watch?v=... or https://youtube.com/shorts/...)"
                      value={form.youtubeUrl}
                      onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                      required
                    />
                    {currentYtId ? (
                      <div className="mt-2 text-success small fw-semibold d-flex align-items-center">
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Detected YouTube ID: <code>{currentYtId}</code>
                        <span className="text-muted ms-2">(Auto-thumbnail generated)</span>
                      </div>
                    ) : form.youtubeUrl.trim() ? (
                      <div className="mt-2 text-warning small fw-semibold">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        Please paste a valid YouTube watch, share or shorts link.
                      </div>
                    ) : null}
                  </div>

                  {/* Pricing Fields */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Selling Price ({storeSettings?.currency || 'Rs.'})</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="e.g. 1500"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Old / MRP Price ({storeSettings?.currency || 'Rs.'})</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="e.g. 2200"
                        value={form.oldPrice}
                        onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Thumbnail Image URL & Display Order */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-semibold">Custom Thumbnail Image URL (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Leave blank to use YouTube's high-res thumbnail"
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Display Order</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={form.order}
                        onChange={(e) => setForm({ ...form, order: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="form-check form-switch mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="videoActiveSwitch"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="videoActiveSwitch">
                      Active (Visible on Homepage Watch &amp; Shop Section)
                    </label>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary fw-semibold"
                    onClick={() => setModalOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-admin-primary fw-bold px-4"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      editingId ? 'Update Video Product' : 'Add Video Product'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-danger text-white py-3">
                <h5 className="modal-title fw-bold">Delete Video Product</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDeleteConfirm(null)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-2">Are you sure you want to delete this video product?</p>
                <div className="p-3 bg-light rounded border fw-semibold text-dark">
                  {deleteConfirm.title || deleteConfirm.name}
                </div>
                <small className="text-muted d-block mt-2">
                  This item will be removed permanently from the database and homepage video reel.
                </small>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger fw-bold px-3" onClick={handleDeleteItem}>
                  Yes, Delete Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-danger text-white py-3">
                <h5 className="modal-title fw-bold">Delete All Existing Video Products</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowClearConfirm(false)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-2 d-block"></i>
                <h5 className="fw-bold mb-2">Delete all {watchShop.length} video products?</h5>
                <p className="text-muted small mb-0">
                  This will completely wipe all currently configured video products from the database. This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger fw-bold px-4" onClick={handleClearAll}>
                  Yes, Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive YouTube Video Player Preview Modal */}
      {previewVideo && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1080 }}
          onClick={() => setPreviewVideo(null)}
          tabIndex="-1"
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content bg-dark text-white border-0 shadow-lg overflow-hidden">
              <div className="modal-header border-secondary py-2">
                <h6 className="modal-title text-truncate fw-bold">{previewVideo.title || previewVideo.name}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setPreviewVideo(null)}></button>
              </div>
              <div className="ratio ratio-16x9 bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${previewVideo.ytId}?autoplay=1&rel=0`}
                  title={previewVideo.title || 'Video Preview'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              {previewVideo.description && (
                <div className="modal-body p-3 bg-dark border-top border-secondary">
                  <p className="small text-light mb-0">{previewVideo.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
