import { useState } from 'react'
import { useStoreData } from '../../context/StoreDataContext'

export default function WatchShopView() {
  const { watchShop, setWatchShop, storeSettings, showToast } = useStoreData()
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', oldPrice: '', image: '/images/v1.jpg' })

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({ name: item.name, price: item.price, oldPrice: item.oldPrice, image: item.image })
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.name || !form.price) return

    setWatchShop(prev => prev.map(item => item.id === editingItem.id ? {
      ...item,
      name: form.name,
      price: Number(form.price),
      oldPrice: Number(form.oldPrice) || Number(form.price),
      image: form.image,
    } : item))

    showToast('Video product updated!')
    setEditingItem(null)
  }

  return (
    <div className="watch-shop-view">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Watch &amp; Shop Video Feed</h3>
          <p className="text-muted small mb-0">
            Configure short engaging video showcase products displayed on the homepage
          </p>
        </div>
      </div>

      <div className="row g-3">
        {watchShop.map((item) => (
          <div key={item.id} className="col-12 col-sm-6 col-md-4 col-xl-2-4">
            <div className="card h-100 shadow-sm overflow-hidden">
              <div className="position-relative bg-dark text-center" style={{ height: 200 }}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-100 h-100"
                  style={{ objectFit: 'cover' }}
                  onError={(e) => { e.target.src = '/images/cat1.jpg' }}
                />
                <div className="position-absolute top-50 start-50 translate-middle">
                  <div
                    className="rounded-circle bg-white text-dark d-flex align-items-center justify-content-center shadow"
                    style={{ width: 44, height: 44 }}
                  >
                    <i className="bi bi-play-fill fs-4 ms-0.5 text-danger"></i>
                  </div>
                </div>
              </div>
              <div className="card-body p-3 d-flex flex-column">
                <h6 className="fw-bold text-dark text-truncate mb-2" title={item.name}>
                  {item.name}
                </h6>
                <div className="mt-auto">
                  <div className="d-flex align-items-baseline gap-2 mb-2">
                    <span className="fw-bold text-dark">
                      {storeSettings.currency} {item.price.toLocaleString()}
                    </span>
                    {item.oldPrice > item.price && (
                      <s className="small text-muted">{storeSettings.currency} {item.oldPrice.toLocaleString()}</s>
                    )}
                  </div>
                  <button
                    className="btn btn-sm btn-outline-primary w-100"
                    onClick={() => openEdit(item)}
                  >
                    <i className="bi bi-pencil me-1"></i> Edit Video Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title fw-bold">Edit Video Product</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingItem(null)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Product Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Selling Price *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Old Price</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.oldPrice}
                        onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Video Thumbnail Path</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-admin-primary fw-semibold">
                    Save Changes
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
