import React, { useState, useEffect, useMemo } from 'react'
import { convertFileToWebp, uploadWebpImages } from '../../utils/imageUpload'
import HeroSlideItem, { getResolvedSlideData } from '../../components/HeroSlideItem'

const VIEWPORT_PRESETS = [
  { label: 'Desktop 1920px', width: 1280, device: 'desktop' },
  { label: 'Desktop 1366px', width: 1024, device: 'desktop' },
  { label: 'Tablet 768px', width: 768, device: 'tablet' },
  { label: 'Mobile 414px', width: 414, device: 'mobile' },
  { label: 'Mobile 390px', width: 390, device: 'mobile' },
  { label: 'Mobile 375px', width: 375, device: 'mobile' },
  { label: 'Mobile 360px', width: 360, device: 'mobile' },
  { label: 'Mobile 320px', width: 320, device: 'mobile' },
]

export default function HeroSlideEditorModal({
  isOpen,
  onClose,
  slide = null,
  onSave,
  slidePosition = 'first',
  setSlidePosition,
}) {
  const isEditing = Boolean(slide && slide.id)

  // Selected device editing tab: 'desktop' | 'tablet' | 'mobile'
  const [deviceTab, setDeviceTab] = useState('desktop')

  // Settings sub-tab: 'content' | 'images' | 'typography' | 'overlay' | 'animation'
  const [settingsTab, setSettingsTab] = useState('content')

  // Live Preview viewport
  const [previewWidth, setPreviewWidth] = useState(1280)
  const [previewDevice, setPreviewDevice] = useState('desktop')

  // Uploading state
  const [uploadingTarget, setUploadingTarget] = useState(null) // 'desktop' | 'tablet' | 'mobile'
  const [uploadError, setUploadError] = useState('')
  const [uploadMsg, setUploadMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // Full rich slide form state
  const [form, setForm] = useState(() => getResolvedSlideData(slide || {}))

  useEffect(() => {
    if (slide) {
      setForm(getResolvedSlideData(slide))
    } else {
      setForm(getResolvedSlideData({
        title: 'Make Your Home Smarter',
        subtitle: 'Discover innovative products that make everyday living easier.',
        link: '/shop',
      }))
    }
    setDeviceTab('desktop')
    setSettingsTab('content')
    setPreviewWidth(1280)
    setPreviewDevice('desktop')
    setUploadError('')
    setUploadMsg('')
  }, [slide, isOpen])

  // Sync preview device when device tab changes
  const handleDeviceTabChange = (dev) => {
    setDeviceTab(dev)
    setPreviewDevice(dev)
    if (dev === 'desktop') setPreviewWidth(1280)
    else if (dev === 'tablet') setPreviewWidth(768)
    else if (dev === 'mobile') setPreviewWidth(375)
  }

  // Handle Image Upload for specific target
  const handleImageUpload = async (target, e) => {
    const files = e.target.files
    if (!files || !files.length) return

    setUploadingTarget(target)
    setUploadError('')
    setUploadMsg(`Converting ${target} image to WebP...`)

    try {
      const maxDim = target === 'mobile' ? 1080 : target === 'tablet' ? 1400 : 1920
      const webp = await convertFileToWebp(files[0], maxDim, 0.85)
      setUploadMsg(`Uploading ${target} banner to cloud storage...`)
      const urls = await uploadWebpImages([webp])
      if (urls && urls[0]) {
        setForm(prev => ({
          ...prev,
          images: {
            ...prev.images,
            [target]: urls[0],
          },
        }))
        setUploadMsg('')
      } else {
        throw new Error('Upload succeeded but no URL was returned.')
      }
    } catch (err) {
      console.error('Hero slide upload error:', err)
      setUploadError(err.message || 'Image upload failed. Please try again.')
    } finally {
      setUploadingTarget(null)
      setUploadMsg('')
      if (e.target) e.target.value = ''
    }
  }

  // Update device specific responsive setting
  const updateRespSetting = (field, value) => {
    setForm(prev => ({
      ...prev,
      responsive: {
        ...prev.responsive,
        [deviceTab]: {
          ...prev.responsive[deviceTab],
          [field]: value,
        },
      },
    }))
  }

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.images.desktop && !slide?.image) {
      setUploadError('Please provide at least a Desktop Background Image.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        image: form.images.desktop || slide?.image || '/images/banner-placeholder.webp',
        tabletImage: form.images.tablet || '',
        mobileImage: form.images.mobile || '',
        alt: form.title || form.label || 'Hero Slide Banner',
        title: form.title || '',
        subtitle: form.subtitle || '',
        link: form.primaryCta?.link || '/shop',
        position: slidePosition,
        slideData: {
          label: form.label,
          title: form.title,
          subtitle: form.subtitle,
          primaryCta: form.primaryCta,
          secondaryCta: form.secondaryCta,
          images: form.images,
          overlay: form.overlay,
          animation: form.animation,
          responsive: form.responsive,
        },
      }

      await onSave(payload)
      onClose()
    } catch (err) {
      console.error('Save slide error:', err)
      setUploadError(err.message || 'Failed to save hero slide')
    } finally {
      setSaving(false)
    }
  }

  // Active slide state formatted for preview
  const previewSlideObj = useMemo(() => {
    return {
      id: slide?.id || 999999,
      image: form.images.desktop || slide?.image || '/images/banner-placeholder.webp',
      tabletImage: form.images.tablet || '',
      mobileImage: form.images.mobile || '',
      alt: form.title || form.label || 'Hero Banner',
      title: form.title,
      subtitle: form.subtitle,
      link: form.primaryCta?.link || '/shop',
      slideData: form,
    }
  }, [form, slide])

  if (!isOpen) return null

  const activeResp = form.responsive[deviceTab] || form.responsive.desktop

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060, overflowY: 'auto' }}
    >
      <div className="modal-dialog modal-fullscreen-lg-down modal-xl modal-dialog-centered my-3">
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
          {/* Modal Header */}
          <div className="modal-header bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="modal-title fw-bold mb-0 d-flex align-items-center gap-2">
                <i className={`bi ${isEditing ? 'bi-pencil-square text-warning' : 'bi-plus-circle text-success'}`}></i>
                <span>{isEditing ? `Edit Hero Slide #${slide.order || slide.id}` : 'Create Advanced Animated Hero Slide'}</span>
              </h5>
              <small className="text-white-50">
                Independent Desktop, Tablet &amp; Mobile Responsive Controls with Live Preview
              </small>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={saving} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-0">
              {/* Device Mode Switcher Bar */}
              <div className="bg-light border-bottom py-2.5 px-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
                {/* Device Tabs */}
                <div className="d-flex align-items-center gap-2">
                  <span className="small fw-bold text-muted text-uppercase me-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                    Editing Device:
                  </span>
                  <div className="btn-group btn-group-sm shadow-sm" role="group">
                    <button
                      type="button"
                      className={`btn px-3 fw-semibold ${deviceTab === 'desktop' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                      onClick={() => handleDeviceTabChange('desktop')}
                    >
                      <i className="bi bi-display me-1.5"></i> Desktop
                    </button>
                    <button
                      type="button"
                      className={`btn px-3 fw-semibold ${deviceTab === 'tablet' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                      onClick={() => handleDeviceTabChange('tablet')}
                    >
                      <i className="bi bi-tablet me-1.5"></i> Tablet
                    </button>
                    <button
                      type="button"
                      className={`btn px-3 fw-semibold ${deviceTab === 'mobile' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                      onClick={() => handleDeviceTabChange('mobile')}
                    >
                      <i className="bi bi-phone me-1.5"></i> Mobile Phone
                    </button>
                  </div>
                </div>

                {/* Viewport Width Preset Buttons for Live Preview */}
                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                  <span className="small text-muted me-1" style={{ fontSize: '11px' }}>
                    <i className="bi bi-eye me-1"></i>Viewport:
                  </span>
                  {VIEWPORT_PRESETS.map((vp) => (
                    <button
                      key={vp.label}
                      type="button"
                      className={`btn btn-xs py-0.5 px-2 rounded-pill ${
                        previewWidth === vp.width ? 'btn-dark text-white fw-bold' : 'btn-outline-secondary text-muted'
                      }`}
                      style={{ fontSize: '11px' }}
                      onClick={() => {
                        setPreviewWidth(vp.width)
                        setPreviewDevice(vp.device)
                      }}
                    >
                      {vp.width}px
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`btn btn-xs py-0.5 px-2 rounded-pill ${previewWidth === 1280 ? 'btn-dark text-white' : 'btn-outline-secondary'}`}
                    style={{ fontSize: '11px' }}
                    onClick={() => {
                      setPreviewWidth(1280)
                      setPreviewDevice('desktop')
                    }}
                  >
                    Full (100%)
                  </button>
                </div>
              </div>

              {/* Top: Live Interactive Responsive Preview Window */}
              <div
                className="p-3 bg-secondary bg-opacity-10 border-bottom d-flex flex-column align-items-center justify-content-center"
                style={{ minHeight: '260px' }}
              >
                <div className="d-flex align-items-center justify-content-between w-100 mb-2 px-2" style={{ maxWidth: '1280px' }}>
                  <span className="small fw-semibold text-muted d-flex align-items-center gap-1.5">
                    <span className="badge bg-dark rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
                      LIVE {previewDevice.toUpperCase()} PREVIEW
                    </span>
                    <span>• Viewport: {previewWidth === 1280 ? 'Fluid 100%' : `${previewWidth}px`}</span>
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted" style={{ fontSize: '11px' }}>Custom Width:</span>
                    <input
                      type="range"
                      min="320"
                      max="1280"
                      step="10"
                      value={previewWidth}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setPreviewWidth(val)
                        if (val <= 576) setPreviewDevice('mobile')
                        else if (val <= 992) setPreviewDevice('tablet')
                        else setPreviewDevice('desktop')
                      }}
                      style={{ width: '100px' }}
                    />
                    <span className="font-monospace small text-muted" style={{ fontSize: '11px', width: '42px' }}>
                      {previewWidth}px
                    </span>
                  </div>
                </div>

                {/* Container for Preview with exact border framing */}
                <div
                  className="shadow-md rounded-4 overflow-hidden border bg-dark"
                  style={{
                    width: previewWidth === 1280 ? '100%' : `${previewWidth}px`,
                    maxWidth: '100%',
                    transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <HeroSlideItem
                    slide={previewSlideObj}
                    isActive={true}
                    device={previewDevice}
                    priority={true}
                    isPreview={true}
                  />
                </div>
              </div>

              {/* Status Messages */}
              {uploadError && (
                <div className="alert alert-danger m-3 py-2 small d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{uploadError}</span>
                </div>
              )}
              {uploadMsg && (
                <div className="alert alert-info m-3 py-2 small d-flex align-items-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>{uploadMsg}</span>
                </div>
              )}

              {/* Bottom: Tabbed Settings Drawer */}
              <div className="p-4">
                {/* Sub-tabs navigation */}
                <ul className="nav nav-pills nav-fill bg-light p-1 rounded-3 mb-4 border">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link py-2 fw-semibold small ${settingsTab === 'content' ? 'active shadow-sm' : ''}`}
                      onClick={() => setSettingsTab('content')}
                    >
                      <i className="bi bi-fonts me-1.5"></i> 1. Content &amp; Buttons
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link py-2 fw-semibold small ${settingsTab === 'images' ? 'active shadow-sm' : ''}`}
                      onClick={() => setSettingsTab('images')}
                    >
                      <i className="bi bi-images me-1.5"></i> 2. Responsive Images
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link py-2 fw-semibold small ${settingsTab === 'typography' ? 'active shadow-sm' : ''}`}
                      onClick={() => setSettingsTab('typography')}
                    >
                      <i className="bi bi-sliders me-1.5"></i> 3. {deviceTab.toUpperCase()} Layout &amp; Text
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link py-2 fw-semibold small ${settingsTab === 'overlay' ? 'active shadow-sm' : ''}`}
                      onClick={() => setSettingsTab('overlay')}
                    >
                      <i className="bi bi-circle-half me-1.5"></i> 4. Overlay &amp; Contrast
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link py-2 fw-semibold small ${settingsTab === 'animation' ? 'active shadow-sm' : ''}`}
                      onClick={() => setSettingsTab('animation')}
                    >
                      <i className="bi bi-magic me-1.5"></i> 5. Animation &amp; Timing
                    </button>
                  </li>
                </ul>

                {/* ── SUB-TAB 1: CONTENT & BUTTONS ── */}
                {settingsTab === 'content' && (
                  <div className="row g-3">
                    {/* Small Label / Eyebrow */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Small Label / Eyebrow (Optional)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. NEW COLLECTION, 50% OFF"
                        value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                      />
                    </div>

                    {/* Main Heading */}
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-semibold small">
                        Main Heading <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Make Your Home Smarter"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>

                    {/* Subheading / Description */}
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Subheading / Description</label>
                      <textarea
                        rows="2"
                        className="form-control form-control-sm"
                        placeholder="e.g. Discover innovative products that make everyday living easier."
                        value={form.subtitle}
                        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      />
                    </div>

                    {/* Primary CTA Button Box */}
                    <div className="col-12 col-md-6">
                      <div className="card p-3 border rounded-3 bg-light h-100">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold small text-dark">
                            <i className="bi bi-check2-circle text-success me-1"></i> Primary CTA Button
                          </span>
                          <div className="form-check form-switch mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={form.primaryCta.show}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  primaryCta: { ...form.primaryCta, show: e.target.checked },
                                })
                              }
                            />
                          </div>
                        </div>

                        {form.primaryCta.show && (
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small text-muted mb-1">Button Text</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="SHOP NOW"
                                value={form.primaryCta.text}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    primaryCta: { ...form.primaryCta, text: e.target.value },
                                  })
                                }
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small text-muted mb-1">Link Destination</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="/shop"
                                value={form.primaryCta.link}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    primaryCta: { ...form.primaryCta, link: e.target.value },
                                  })
                                }
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small text-muted mb-1">Button Style</label>
                              <select
                                className="form-select form-select-sm"
                                value={form.primaryCta.style || 'filled'}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    primaryCta: { ...form.primaryCta, style: e.target.value },
                                  })
                                }
                              >
                                <option value="filled">Filled (Primary Accent)</option>
                                <option value="outline">Outline (White Border)</option>
                                <option value="glass">Glassmorphism (Frosted)</option>
                              </select>
                            </div>
                            <div className="col-6">
                              <label className="form-label small text-muted mb-1">Size</label>
                              <select
                                className="form-select form-select-sm"
                                value={form.primaryCta.size || 'md'}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    primaryCta: { ...form.primaryCta, size: e.target.value },
                                  })
                                }
                              >
                                <option value="sm">Small (Compact)</option>
                                <option value="md">Medium (Default)</option>
                                <option value="lg">Large (Prominent)</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Secondary CTA Button Box */}
                    <div className="col-12 col-md-6">
                      <div className="card p-3 border rounded-3 bg-light h-100">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold small text-dark">
                            <i className="bi bi-box-arrow-up-right text-primary me-1"></i> Secondary CTA Button (Optional)
                          </span>
                          <div className="form-check form-switch mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={form.secondaryCta.show}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  secondaryCta: { ...form.secondaryCta, show: e.target.checked },
                                })
                              }
                            />
                          </div>
                        </div>

                        {form.secondaryCta.show && (
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small text-muted mb-1">Button Text</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="EXPLORE COLLECTION"
                                value={form.secondaryCta.text}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    secondaryCta: { ...form.secondaryCta, text: e.target.value },
                                  })
                                }
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small text-muted mb-1">Link Destination</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="/category/watches"
                                value={form.secondaryCta.link}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    secondaryCta: { ...form.secondaryCta, link: e.target.value },
                                  })
                                }
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small text-muted mb-1">Button Style</label>
                              <select
                                className="form-select form-select-sm"
                                value={form.secondaryCta.style || 'outline'}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    secondaryCta: { ...form.secondaryCta, style: e.target.value },
                                  })
                                }
                              >
                                <option value="outline">Outline (White Border)</option>
                                <option value="glass">Glassmorphism (Frosted)</option>
                                <option value="filled">Filled (Primary Accent)</option>
                              </select>
                            </div>
                            <div className="col-6">
                              <label className="form-label small text-muted mb-1">Size</label>
                              <select
                                className="form-select form-select-sm"
                                value={form.secondaryCta.size || 'md'}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    secondaryCta: { ...form.secondaryCta, size: e.target.value },
                                  })
                                }
                              >
                                <option value="sm">Small (Compact)</option>
                                <option value="md">Medium (Default)</option>
                                <option value="lg">Large (Prominent)</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SUB-TAB 2: SEPARATE RESPONSIVE IMAGES ── */}
                {settingsTab === 'images' && (
                  <div className="row g-4">
                    {/* Desktop Image */}
                    <div className="col-12 col-md-4">
                      <div className="card h-100 p-3 border rounded-3 bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold small text-dark">
                            <i className="bi bi-display text-success me-1"></i> Desktop Background
                          </span>
                          <span className="badge bg-dark" style={{ fontSize: '10px' }}>1920 × 800</span>
                        </div>
                        <div className="mb-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control form-control-sm mb-1"
                            disabled={uploadingTarget === 'desktop'}
                            onChange={(e) => handleImageUpload('desktop', e)}
                          />
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Or paste Desktop image URL"
                            value={form.images.desktop}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                images: { ...form.images, desktop: e.target.value },
                              })
                            }
                          />
                        </div>
                        {form.images.desktop && (
                          <div className="mt-auto pt-2 border-top">
                            <img
                              src={form.images.desktop}
                              alt="Desktop Preview"
                              className="img-fluid rounded border"
                              style={{ maxHeight: '100px', width: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tablet Image */}
                    <div className="col-12 col-md-4">
                      <div className="card h-100 p-3 border rounded-3 bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold small text-dark">
                            <i className="bi bi-tablet text-primary me-1"></i> Tablet Image (Optional)
                          </span>
                          <span className="badge bg-secondary" style={{ fontSize: '10px' }}>4:3 Ratio</span>
                        </div>
                        <div className="mb-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control form-control-sm mb-1"
                            disabled={uploadingTarget === 'tablet'}
                            onChange={(e) => handleImageUpload('tablet', e)}
                          />
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Fallback: Uses Desktop Image"
                            value={form.images.tablet}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                images: { ...form.images, tablet: e.target.value },
                              })
                            }
                          />
                        </div>
                        {form.images.tablet ? (
                          <div className="mt-auto pt-2 border-top">
                            <img
                              src={form.images.tablet}
                              alt="Tablet Preview"
                              className="img-fluid rounded border"
                              style={{ maxHeight: '100px', width: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <small className="text-muted d-block mt-auto pt-2 border-top" style={{ fontSize: '11px' }}>
                            <i className="bi bi-info-circle me-1"></i> If empty, the desktop image will be automatically fitted.
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Mobile Image */}
                    <div className="col-12 col-md-4">
                      <div className="card h-100 p-3 border rounded-3 bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold small text-dark">
                            <i className="bi bi-phone text-warning me-1"></i> Mobile Image (Portrait)
                          </span>
                          <span className="badge bg-warning text-dark" style={{ fontSize: '10px' }}>4:5 / 1:1</span>
                        </div>
                        <div className="mb-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control form-control-sm mb-1"
                            disabled={uploadingTarget === 'mobile'}
                            onChange={(e) => handleImageUpload('mobile', e)}
                          />
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Fallback: Uses Desktop Image"
                            value={form.images.mobile}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                images: { ...form.images, mobile: e.target.value },
                              })
                            }
                          />
                        </div>
                        {form.images.mobile ? (
                          <div className="mt-auto pt-2 border-top">
                            <img
                              src={form.images.mobile}
                              alt="Mobile Preview"
                              className="img-fluid rounded border"
                              style={{ maxHeight: '100px', width: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <small className="text-muted d-block mt-auto pt-2 border-top" style={{ fontSize: '11px' }}>
                            <i className="bi bi-info-circle me-1"></i> Uploading a dedicated vertical mobile banner ensures your products look sharp and never cropped on phone screens!
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SUB-TAB 3: DEVICE TYPOGRAPHY & LAYOUT (Controls Active Device Tab) ── */}
                {settingsTab === 'typography' && (
                  <div>
                    <div className="alert alert-light border py-2 px-3 small d-flex align-items-center justify-content-between mb-3">
                      <span>
                        <i className="bi bi-gear-fill me-1 text-primary"></i> Currently Editing Layout for:{' '}
                        <strong className="text-uppercase text-dark">{deviceTab}</strong>
                      </span>
                      <span className="text-muted" style={{ fontSize: '11px' }}>
                        Settings adjust independently per device without overwriting other screen sizes.
                      </span>
                    </div>

                    <div className="row g-3">
                      {/* Font Sizes */}
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Heading Size ({activeResp.headingSize}px)</label>
                        <input
                          type="range"
                          min="16"
                          max="72"
                          value={activeResp.headingSize || 36}
                          onChange={(e) => updateRespSetting('headingSize', Number(e.target.value))}
                          className="form-range"
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Subheading Size ({activeResp.subheadingSize}px)</label>
                        <input
                          type="range"
                          min="12"
                          max="28"
                          value={activeResp.subheadingSize || 16}
                          onChange={(e) => updateRespSetting('subheadingSize', Number(e.target.value))}
                          className="form-range"
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Eyebrow Label Size ({activeResp.labelSize}px)</label>
                        <input
                          type="range"
                          min="10"
                          max="18"
                          value={activeResp.labelSize || 12}
                          onChange={(e) => updateRespSetting('labelSize', Number(e.target.value))}
                          className="form-range"
                        />
                      </div>

                      {/* Positioning */}
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Horizontal Alignment</label>
                        <div className="btn-group btn-group-sm w-100">
                          <button
                            type="button"
                            className={`btn ${activeResp.alignment === 'left' ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => updateRespSetting('alignment', 'left')}
                          >
                            <i className="bi bi-text-left"></i> Left
                          </button>
                          <button
                            type="button"
                            className={`btn ${activeResp.alignment === 'center' ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => updateRespSetting('alignment', 'center')}
                          >
                            <i className="bi bi-text-center"></i> Center
                          </button>
                          <button
                            type="button"
                            className={`btn ${activeResp.alignment === 'right' ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => updateRespSetting('alignment', 'right')}
                          >
                            <i className="bi bi-text-right"></i> Right
                          </button>
                        </div>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Vertical Alignment</label>
                        <div className="btn-group btn-group-sm w-100">
                          <button
                            type="button"
                            className={`btn ${activeResp.verticalPos === 'top' ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => updateRespSetting('verticalPos', 'top')}
                          >
                            Top
                          </button>
                          <button
                            type="button"
                            className={`btn ${activeResp.verticalPos === 'center' ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => updateRespSetting('verticalPos', 'center')}
                          >
                            Center
                          </button>
                          <button
                            type="button"
                            className={`btn ${activeResp.verticalPos === 'bottom' ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => updateRespSetting('verticalPos', 'bottom')}
                          >
                            Bottom
                          </button>
                        </div>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Text Color</label>
                        <div className="input-group input-group-sm">
                          <input
                            type="color"
                            className="form-control form-control-color"
                            value={activeResp.textColor || '#ffffff'}
                            onChange={(e) => updateRespSetting('textColor', e.target.value)}
                          />
                          <input
                            type="text"
                            className="form-control"
                            value={activeResp.textColor || '#ffffff'}
                            onChange={(e) => updateRespSetting('textColor', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Mobile Layout Mode */}
                      {deviceTab === 'mobile' && (
                        <div className="col-12 col-md-6">
                          <label className="form-label small fw-semibold">Mobile Content Layout Mode</label>
                          <select
                            className="form-select form-select-sm"
                            value={activeResp.layout || 'overlay'}
                            onChange={(e) => updateRespSetting('layout', e.target.value)}
                          >
                            <option value="overlay">Text Overlay on Image (Standard)</option>
                            <option value="below">Text Below Image (Dedicated Card - Great for Phones!)</option>
                          </select>
                        </div>
                      )}

                      {/* Visibility Toggles for this device */}
                      <div className="col-12 col-md-6 d-flex align-items-center gap-4 mt-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={!activeResp.hideSubheading}
                            onChange={(e) => updateRespSetting('hideSubheading', !e.target.checked)}
                          />
                          <label className="form-check-label small">Show Subheading on {deviceTab}</label>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={!activeResp.hideLabel}
                            onChange={(e) => updateRespSetting('hideLabel', !e.target.checked)}
                          />
                          <label className="form-check-label small">Show Label on {deviceTab}</label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SUB-TAB 4: OVERLAY & CONTRAST ── */}
                {settingsTab === 'overlay' && (
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Overlay Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={form.overlay.type}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            overlay: {
                              ...form.overlay,
                              type: e.target.value,
                              enabled: e.target.value !== 'none',
                            },
                          })
                        }
                      >
                        <option value="none">None (Raw Background)</option>
                        <option value="dark">Dark Tint (Classic Contrast)</option>
                        <option value="light">Light Tint (Clean Airy)</option>
                        <option value="gradient">Linear Gradient (Recommended)</option>
                        <option value="custom">Custom Color Tint</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">
                        Overlay Opacity ({Math.round(form.overlay.opacity * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={form.overlay.opacity}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            overlay: { ...form.overlay, opacity: Number(e.target.value) },
                          })
                        }
                        className="form-range"
                      />
                    </div>

                    {form.overlay.type === 'gradient' && (
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Gradient Direction</label>
                        <select
                          className="form-select form-select-sm"
                          value={form.overlay.direction || 'to-right'}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              overlay: { ...form.overlay, direction: e.target.value },
                            })
                          }
                        >
                          <option value="to-right">To Right (Left text protected)</option>
                          <option value="to-left">To Left (Right text protected)</option>
                          <option value="to-bottom">To Bottom (Top text protected)</option>
                          <option value="to-top">To Top (Bottom text protected)</option>
                        </select>
                      </div>
                    )}

                    <div className="col-12 col-md-4 mt-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={form.animation.bgZoom}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              animation: { ...form.animation, bgZoom: e.target.checked },
                            })
                          }
                        />
                        <label className="form-check-label small fw-semibold">
                          Ken-Burns Background Slow Zoom
                        </label>
                      </div>
                      <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                        Image smoothly scales from 1.06 to 1.00 for a luxury cinematic feeling.
                      </small>
                    </div>
                  </div>
                )}

                {/* ── SUB-TAB 5: ANIMATION & TIMING ── */}
                {settingsTab === 'animation' && (
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Desktop Animation</label>
                      <select
                        className="form-select form-select-sm"
                        value={form.animation.desktop || 'fade-up'}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            animation: { ...form.animation, desktop: e.target.value },
                          })
                        }
                      >
                        <option value="fade-up">Fade Up (Smooth Upward)</option>
                        <option value="slide-left">Slide From Left</option>
                        <option value="slide-right">Slide From Right</option>
                        <option value="fade-in">Fade In (Opacity Only)</option>
                        <option value="zoom-in">Zoom In (Scale Up)</option>
                        <option value="none">None (Static)</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Tablet Animation</label>
                      <select
                        className="form-select form-select-sm"
                        value={form.animation.tablet || 'fade-up'}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            animation: { ...form.animation, tablet: e.target.value },
                          })
                        }
                      >
                        <option value="fade-up">Fade Up (Smooth Upward)</option>
                        <option value="slide-left">Slide From Left</option>
                        <option value="slide-right">Slide From Right</option>
                        <option value="fade-in">Fade In (Opacity Only)</option>
                        <option value="zoom-in">Zoom In (Scale Up)</option>
                        <option value="none">None (Static)</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Mobile Phone Animation</label>
                      <select
                        className="form-select form-select-sm"
                        value={form.animation.mobile || 'fade-up'}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            animation: { ...form.animation, mobile: e.target.value },
                          })
                        }
                      >
                        <option value="fade-up">Fade Up (Smooth Upward)</option>
                        <option value="slide-left">Slide From Left</option>
                        <option value="fade-in">Fade In (Opacity Only)</option>
                        <option value="zoom-in">Zoom In (Scale Up)</option>
                        <option value="none">None (Disable on Phones)</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Slide Duration (Autoplay Timer)</label>
                      <div className="input-group input-group-sm">
                        <input
                          type="number"
                          className="form-control"
                          min="2000"
                          max="15000"
                          step="500"
                          value={form.animation.duration || 5200}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              animation: { ...form.animation, duration: Number(e.target.value) },
                            })
                          }
                        />
                        <span className="input-group-text">ms ({((form.animation.duration || 5200) / 1000).toFixed(1)}s)</span>
                      </div>
                    </div>

                    {!isEditing && setSlidePosition && (
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Slide Placement</label>
                        <select
                          className="form-select form-select-sm"
                          value={slidePosition}
                          onChange={(e) => setSlidePosition(e.target.value)}
                        >
                          <option value="first">Show as 1st Slide (Featured Front)</option>
                          <option value="last">Append to End of Carousel</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer bg-light border-top py-2.5 px-4 d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                <i className="bi bi-shield-check text-success me-1"></i>
                Settings persist directly to PostgreSQL database.
              </span>
              <div className="d-flex align-items-center gap-2">
                <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success btn-sm px-4 fw-semibold d-flex align-items-center gap-1.5"
                  disabled={saving || uploadingTarget !== null}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Saving to PostgreSQL...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-arrow-up-fill"></i>
                      <span>{isEditing ? 'Save & Publish Changes' : 'Create & Publish Hero Slide'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
