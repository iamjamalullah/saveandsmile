import { useState } from 'react'
import { useStoreData } from '../../context/StoreDataContext'

export default function SettingsView() {
  const { storeSettings, updateStoreSettings, resetToDefaults, products, orders, categories } = useStoreData()

  const [form, setForm] = useState({
    name: storeSettings.name || 'Gadget Store',
    tagline: storeSettings.tagline || 'Gadgets Wholesaler',
    announcement: storeSettings.announcement || '',
    phone: storeSettings.phone || '',
    whatsapp: storeSettings.whatsapp || '',
    email: storeSettings.email || '',
    currency: storeSettings.currency || 'Rs.',
    shippingFee: storeSettings.shippingFee || 200,
    freeShippingThreshold: storeSettings.freeShippingThreshold || 3000,
    address: storeSettings.address || 'Wholesale Market, Karachi, Pakistan',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateStoreSettings({
      ...form,
      shippingFee: Number(form.shippingFee),
      freeShippingThreshold: Number(form.freeShippingThreshold),
    })
  }

  const handleDownloadBackup = () => {
    const backupData = {
      storeSettings: form,
      products,
      orders,
      categories,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gadget_store_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="settings-view">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Store &amp; System Settings</h3>
          <p className="text-muted small mb-0">
            Customize branding, announcement marquee, contact channels, and fulfillment rules
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Form: Main Settings */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0">General Store Configuration</h5>
              <small className="text-muted">Changes here update the live customer storefront</small>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* Branding Section */}
                <h6 className="fw-bold text-uppercase small text-muted mb-3">Store Branding</h6>
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Store Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Tagline</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.tagline}
                      onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Currency Symbol</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Warehouse / Physical Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                </div>

                {/* Announcement Bar */}
                <h6 className="fw-bold text-uppercase small text-muted mb-3">Announcement Marquee Banner</h6>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Top Banner Announcement Text</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    value={form.announcement}
                    onChange={(e) => setForm({ ...form, announcement: e.target.value })}
                  ></textarea>
                  <small className="text-muted mt-1 d-block">
                    This message scrolls continuously at the top of the storefront header.
                  </small>
                </div>

                {/* Contact Information */}
                <h6 className="fw-bold text-uppercase small text-muted mb-3">Contact Channels &amp; WhatsApp</h6>
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">WhatsApp Number (International)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 923XXXXXXXXX"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    />
                    <small className="text-muted">No + or dashes for WhatsApp API</small>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Support Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Shipping Rules */}
                <h6 className="fw-bold text-uppercase small text-muted mb-3">Shipping &amp; Delivery Rules</h6>
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Flat Shipping Rate ({form.currency})</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.shippingFee}
                      onChange={(e) => setForm({ ...form, shippingFee: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Free Delivery Threshold ({form.currency})</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.freeShippingThreshold}
                      onChange={(e) => setForm({ ...form, freeShippingThreshold: e.target.value })}
                    />
                    <small className="text-muted">Orders equal to or above this amount get free shipping</small>
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-admin-primary px-4 fw-semibold">
                    <i className="bi bi-save me-1"></i> Save Store Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Admin Profile & Data Utilities */}
        <div className="col-12 col-lg-4">
          {/* Admin Profile */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0">Admin Account</h5>
            </div>
            <div className="card-body p-4 text-center">
              <div
                className="rounded-circle bg-dark text-warning d-inline-flex align-items-center justify-content-center shadow mb-3"
                style={{ width: 72, height: 72, fontSize: '1.75rem' }}
              >
                <i className="bi bi-person-fill"></i>
              </div>
              <h5 className="fw-bold mb-1">Store Administrator</h5>
              <div className="badge bg-warning text-dark mb-2">Super Admin</div>
              <p className="text-muted small mb-3">admin@gadgetstore.pk</p>

              <div className="p-3 bg-light rounded text-start small">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Role:</span>
                  <span className="fw-semibold">Full Access (Store &amp; CMS)</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Status:</span>
                  <span className="text-success fw-semibold"><i className="bi bi-circle-fill me-1" style={{ fontSize: 8 }}></i> Online</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Session:</span>
                  <span className="fw-semibold">Active Local Mode</span>
                </div>
              </div>
            </div>
          </div>

          {/* Backup & Factory Reset */}
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0">System Maintenance &amp; Backup</h5>
            </div>
            <div className="card-body p-4">
              <p className="small text-muted mb-3">
                Export all store products, orders, categories, and settings as a JSON file, or restore factory defaults.
              </p>

              <div className="d-grid gap-2 mb-3">
                <button className="btn btn-outline-dark" onClick={handleDownloadBackup}>
                  <i className="bi bi-file-earmark-arrow-down me-1"></i> Export Store JSON Backup
                </button>
              </div>

              <hr />

              <div className="p-3 bg-danger-subtle rounded border border-danger-subtle">
                <h6 className="fw-bold text-danger mb-1">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i> Factory Reset
                </h6>
                <p className="small text-danger mb-2">
                  Reset catalog products, demo orders, and settings back to original clean defaults.
                </p>
                <button
                  type="button"
                  className="btn btn-danger btn-sm w-100 fw-semibold"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to restore original default store data? All your edits will be reset.')) {
                      resetToDefaults()
                    }
                  }}
                >
                  Reset to Original Sample Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
