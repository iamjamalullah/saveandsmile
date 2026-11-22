import { useState } from 'react'
import { useStoreData } from '../../context/StoreDataContext'
import { convertFileToWebp, uploadWebpImages } from '../../utils/imageUpload'

export default function CategoriesView() {
  const { categories, products, sections = [], addCategory, updateCategory, deleteCategory } = useStoreData()

  const [modalMode, setModalMode] = useState(null) // 'add' | 'edit' | null
  const [targetCategory, setTargetCategory] = useState(null)
  const [form, setForm] = useState({ name: '', icon: '📦', image: '/images/cat1.jpg' })

  // Image upload states
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploadError, setUploadError] = useState('')

  // Emojis for quick icon selection
  const quickIcons = ['🧸', '🍱', '🧼', '🥤', '💄', '🧴', '🚰', '🗄️', '💍', '👜', '🍳', '⌚', '🎧', '📚', '⚡', '💎', '🔪', '🍼']

  const openAdd = () => {
    setForm({ name: '', icon: '📦', image: '' })
    setTargetCategory(null)
    setUploadError('')
    setUploadMsg('')
    setModalMode('add')
  }

  const openEdit = (cat) => {
    setForm({ name: cat.name, icon: cat.icon || '📦', image: cat.image || '' })
    setTargetCategory(cat)
    setUploadError('')
    setUploadMsg('')
    setModalMode('edit')
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).')
      return
    }

    setUploadError('')
    setUploading(true)
    setUploadMsg('Optimizing image to WebP...')

    try {
      const webp = await convertFileToWebp(file, 1200, 0.85)
      setUploadMsg('Uploading image to cloud storage...')
      const urls = await uploadWebpImages([webp])
      if (urls && urls[0]) {
        setForm(prev => ({ ...prev, image: urls[0] }))
        setUploadMsg('Image uploaded successfully!')
        setTimeout(() => setUploadMsg(''), 2500)
      } else {
        throw new Error('Upload returned no URL.')
      }
    } catch (err) {
      console.error('Category image upload failed:', err)
      setUploadError(err.message || 'Image upload failed. Please try again.')
    } finally {
      setUploading(false)
      // reset file input
      e.target.value = ''
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    if (modalMode === 'add') {
      const success = addCategory(form)
      if (success) setModalMode(null)
    } else if (modalMode === 'edit' && targetCategory) {
      updateCategory(targetCategory.name, form)
      setModalMode(null)
    }
  }

  const handleDelete = (catName) => {
    const assignedProducts = products.filter(p => p.category === catName || (Array.isArray(p.categories) && p.categories.includes(catName)))
    if (assignedProducts.length > 0) {
      if (!window.confirm(`Category "${catName}" has ${assignedProducts.length} products assigned to it. Deleting it will keep the products. Continue?`)) {
        return
      }
    } else {
      if (!window.confirm(`Delete category "${catName}"?`)) return
    }
    deleteCategory(catName)
  }

  return (
    <div className="categories-view">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Product Categories &amp; Sections</h3>
          <p className="text-muted small mb-0">
            Organize catalog classifications and homepage display sections
          </p>
        </div>
        <button className="btn btn-admin-primary fw-semibold" onClick={openAdd}>
          <i className="bi bi-plus-lg me-1"></i> Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="row g-3 mb-5">
        {categories.map((cat) => {
          const count = products.filter(p => p.category === cat.name || (Array.isArray(p.categories) && p.categories.includes(cat.name))).length
          return (
            <div key={cat.name} className="col-12 col-sm-6 col-md-4 col-xl-3">
              <div className="card h-100 shadow-sm border">
                <div className="card-body p-3 d-flex flex-column">
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="rounded-3 object-fit-cover border shadow-sm"
                          style={{ width: 52, height: 52 }}
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : null}
                      <div
                        className="d-flex align-items-center justify-content-center bg-light rounded-3 shadow-sm border"
                        style={{ width: 52, height: 52, fontSize: '1.75rem' }}
                      >
                        {cat.icon || '📦'}
                      </div>
                    </div>
                    <span className="badge bg-secondary-subtle text-secondary fw-semibold">
                      {count} Products
                    </span>
                  </div>

                  <h6 className="fw-bold text-dark mb-1">{cat.name}</h6>

                  {cat.image && (
                    <div className="small text-muted mb-3 font-monospace text-truncate">
                      <i className="bi bi-image me-1"></i> {cat.image}
                    </div>
                  )}

                  <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                    <span className="small text-muted">ID: {cat.name.replace(/\s+/g, '-').toLowerCase()}</span>
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-light border text-primary"
                        onClick={() => openEdit(cat)}
                        title="Edit Category"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-light border text-danger"
                        onClick={() => handleDelete(cat.name)}
                        title="Delete Category"
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

      {/* Homepage Display Sections Info Card */}
      <div className="card shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0">Homepage Sections Configuration</h5>
          <small className="text-muted">Sections currently rendered on the storefront homepage</small>
        </div>
        <div className="table-responsive">
          <table className="table admin-table mb-0">
            <thead>
              <tr>
                <th>Section Order</th>
                <th>Display Title</th>
                <th>Product Group Binding</th>
                <th>Color Theme</th>
                <th>View All Link</th>
                <th>Matching Items</th>
              </tr>
            </thead>
            <tbody>
              {sections.filter(s => typeof s === 'object').map((s, idx) => {
                const groupCount = products.filter(p => p.group === s.group).length
                return (
                  <tr key={s.group}>
                    <td className="fw-bold font-monospace text-muted">#{idx + 1}</td>
                    <td className="fw-semibold text-dark">{s.title}</td>
                    <td>
                      <span className="badge bg-dark font-monospace">{s.group}</span>
                    </td>
                    <td>
                      <span className={`badge ${s.theme === 'gold' ? 'bg-warning text-dark' : s.theme === 'mint' ? 'bg-success' : 'bg-purple text-white'}`} style={s.theme === 'lavender' ? { backgroundColor: '#8b5cf6' } : {}}>
                        {s.theme}
                      </span>
                    </td>
                    <td>
                      {s.viewAll ? (
                        <span className="text-success"><i className="bi bi-check-circle-fill me-1"></i> Enabled</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{groupCount} Products</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {modalMode && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title fw-bold">
                  {modalMode === 'add' ? 'Add New Category' : `Edit Category: ${targetCategory?.name}`}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setModalMode(null)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Category Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Kitchen Storage & Accessories"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Category Icon / Emoji</label>
                    <div className="input-group mb-2">
                      <span className="input-group-text fs-5">{form.icon}</span>
                      <input
                        type="text"
                        className="form-control"
                        value={form.icon}
                        onChange={(e) => setForm({ ...form, icon: e.target.value })}
                        placeholder="Emoji icon"
                      />
                    </div>
                    {/* Quick Emojis */}
                    <div className="d-flex flex-wrap gap-1.5 p-2 bg-light rounded border">
                      {quickIcons.map((ico) => (
                        <button
                          type="button"
                          key={ico}
                          className="btn btn-sm btn-white border"
                          onClick={() => setForm({ ...form, icon: ico })}
                        >
                          {ico}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1">
                      <span>Category Picture / Image</span>
                      {form.image && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                          onClick={() => setForm({ ...form, image: '' })}
                        >
                          <i className="bi bi-x-circle me-1"></i> Remove
                        </button>
                      )}
                    </label>

                    {/* Image Preview if present */}
                    {form.image && (
                      <div className="d-flex align-items-center gap-3 p-2 mb-2 bg-light rounded border">
                        <img
                          src={form.image}
                          alt="Category preview"
                          className="rounded border shadow-sm object-fit-cover"
                          style={{ width: 68, height: 68 }}
                          onError={(e) => { e.currentTarget.style.opacity = '0.5' }}
                        />
                        <div className="small flex-grow-1 text-truncate">
                          <strong className="d-block text-dark mb-1">Current Picture</strong>
                          <span className="text-muted font-monospace text-truncate d-block" style={{ maxWidth: 260 }}>
                            {form.image}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Upload Button & Area */}
                    <div className="d-flex flex-column gap-2">
                      <div>
                        <input
                          type="file"
                          id="category-image-upload-input"
                          className="d-none"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        <label
                          htmlFor="category-image-upload-input"
                          className={`btn btn-outline-primary btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 ${uploading ? 'disabled' : ''}`}
                          style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
                        >
                          {uploading ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              <span>{uploadMsg || 'Uploading...'}</span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-cloud-arrow-up-fill fs-6"></i>
                              <span className="fw-semibold">
                                {form.image ? 'Change / Upload New Picture' : 'Click to Upload Category Picture'}
                              </span>
                            </>
                          )}
                        </label>
                      </div>

                      {uploadError && (
                        <div className="alert alert-danger py-2 px-3 small mb-1" role="alert">
                          <i className="bi bi-exclamation-triangle-fill me-1"></i> {uploadError}
                        </div>
                      )}

                      {uploadMsg && !uploading && (
                        <div className="text-success small fw-semibold">
                          <i className="bi bi-check-circle-fill me-1"></i> {uploadMsg}
                        </div>
                      )}

                      {/* Manual URL input fallback */}
                      <div className="mt-1">
                        <label className="form-text small text-muted mb-1 d-block">
                          Or enter image URL / path manually:
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="https://... or /images/cat1.jpg"
                          value={form.image}
                          onChange={(e) => setForm({ ...form, image: e.target.value })}
                          disabled={uploading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalMode(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-admin-primary fw-semibold">
                    {modalMode === 'add' ? 'Create Category' : 'Save Changes'}
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
