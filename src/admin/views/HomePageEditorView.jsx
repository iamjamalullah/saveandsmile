import { useState, useEffect, useRef } from 'react'
import { useStoreData } from '../../context/StoreDataContext'
import { convertFileToWebp, uploadWebpImages } from '../../utils/imageUpload'
import DynamicHomeSection from '../../components/HomeCustomSections'

const PRESET_GROUPS = [
  { key: 'new', label: 'Catalog Group: New Arrivals' },
  { key: 'hot', label: 'Catalog Group: Hot Selling Products' },
  { key: 'home', label: 'Catalog Group: Home Essentials Organizers' },
  { key: 'like', label: 'Catalog Group: You May Also Like' },
  { key: 'perfume', label: 'Catalog Group: Top Picks Fragrances' },
  { key: 'trending', label: 'Catalog Group: Trending Now' },
  { key: 'jewelry', label: 'Catalog Group: Elegant Jewelry & Accessories' },
  { key: 'watch', label: 'Catalog Group: Exclusive Watches' },
]

export default function HomePageEditorView() {
  const {
    heroSlides = [],
    sections = [],
    categories = [],
    products = [],
    addHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    saveSectionsLayout,
    loadDraftSections,
    saveDraftSections,
    publishHomepageSections,
    loadSectionVersions,
    restoreSectionVersion,
    reload,
    showToast,
  } = useStoreData()

  const [activeTab, setActiveTab] = useState('sections') // Default to 'sections' builder

  // ── Hero Slides State ──────────────────────────────────────
  const [localHeroSlides, setLocalHeroSlides] = useState([])
  const [hasUnsavedHeroSlides, setHasUnsavedHeroSlides] = useState(false)
  const [savingHeroSlides, setSavingHeroSlides] = useState(false)
  const [showAddSlideModal, setShowAddSlideModal] = useState(false)
  const [slideToDelete, setSlideToDelete] = useState(null)
  const [slidePosition, setSlidePosition] = useState('first')
  const [newSlide, setNewSlide] = useState({ image: '', alt: '', link: '/shop' })
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploadError, setUploadError] = useState('')

  // ── Sections Builder State ─────────────────────────────────
  const [localSections, setLocalSections] = useState([])
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Viewport Preview Mode ('desktop' | 'tablet' | 'mobile' | 'hidden')
  const [previewViewport, setPreviewViewport] = useState('hidden')

  // Version History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [versionsList, setVersionsList] = useState([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [restoringVersionId, setRestoringVersionId] = useState(null)

  // Delete Section Modal State
  const [sectionToDelete, setSectionToDelete] = useState(null)

  // 2-Step Creation Wizard Modal State
  const [showWizardModal, setShowWizardModal] = useState(false)
  const [wizardStep, setWizardStep] = useState(1) // 1 = Container Layout, 2 = Content Block
  const [insertTargetIndex, setInsertTargetIndex] = useState(null) // index where new section should be inserted

  // New Section Draft in Wizard
  const [wizardContainerLayout, setWizardContainerLayout] = useState('single') // 'single' | 'two_equal' | 'two_70_30' | 'two_30_70'
  const [wizardBlockType, setWizardBlockType] = useState('products') // 'products' | 'banner' | 'announcement'
  const [wizardData, setWizardData] = useState({
    title: '',
    subtitle: '',
    category: '',
    group: 'new',
    color: '#00998f',
    bg: '',
    banner1: { image: '', link: '/shop', title: '', badge: '' },
    banner2: { image: '', link: '/shop', title: '', badge: '' },
    announcement: {
      heading: '',
      subheading: '',
      buttonText: 'Shop Wholesale',
      buttonLink: '/shop',
      bgColor: '#049977',
      textColor: '#ffffff',
    },
  })

  // Edit Existing Section Modal
  const [editingSection, setEditingSection] = useState(null)

  // Sync heroSlides
  useEffect(() => {
    if (heroSlides && heroSlides.length) {
      const sorted = [...heroSlides].sort((a, b) => (Number(a.order) || Number(a.id) || 0) - (Number(b.order) || Number(b.id) || 0))
      setLocalHeroSlides(sorted)
    }
  }, [heroSlides])

  // Initial load of working draft or published sections
  useEffect(() => {
    async function initSections() {
      if (loadDraftSections) {
        try {
          const draft = await loadDraftSections()
          if (draft && draft.length > 0) {
            const sorted = [...draft].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
            setLocalSections(sorted)
            return
          }
        } catch (_) {}
      }
      if (sections && sections.length) {
        const sorted = [...sections].sort((a, b) => (Number(a.order) || Number(a.id) || 0) - (Number(b.order) || Number(b.id) || 0))
        setLocalSections(sorted)
      }
    }
    initSections()
  }, [sections, loadDraftSections])

  // ── Hero Slides Handlers ───────────────────────────────────
  const handleFileUpload = async (e) => {
    const files = e.target.files
    if (!files || !files.length) return

    setUploading(true)
    setUploadError('')
    setUploadMsg('Converting banner to high-efficiency .WebP...')

    try {
      const webp = await convertFileToWebp(files[0], 1920, 0.85)
      setUploadMsg('Uploading WebP slide banner to server...')
      const urls = await uploadWebpImages([webp])
      if (urls && urls[0]) {
        setNewSlide(prev => ({ ...prev, image: urls[0] }))
        setUploadMsg('')
      } else {
        throw new Error('Upload succeeded but no image URL was returned.')
      }
    } catch (err) {
      console.error('Slide upload error:', err)
      setUploadError(err.message || 'Image upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadMsg('')
    }
  }

  const handleSaveNewSlide = async (e) => {
    e.preventDefault()
    if (!newSlide.image.trim()) {
      setUploadError('Please select or upload a banner image')
      return
    }

    try {
      await addHeroSlide({
        image: newSlide.image.trim(),
        alt: newSlide.alt.trim() || 'Hero Banner Promotion',
        link: newSlide.link.trim() || '/shop',
        position: slidePosition,
      })
      setShowAddSlideModal(false)
      setNewSlide({ image: '', alt: '', link: '/shop' })
      setHasUnsavedHeroSlides(false)
      if (reload) reload()
    } catch (err) {
      setUploadError(err.message)
    }
  }

  const handleConfirmDeleteSlide = async () => {
    if (!slideToDelete) return
    try {
      await deleteHeroSlide(slideToDelete.id)
      setLocalHeroSlides(prev => prev.filter(s => s.id !== slideToDelete.id))
      setSlideToDelete(null)
      if (reload) reload()
    } catch (err) {
      console.error('Delete slide error:', err)
    }
  }

  const handleMoveSlide = (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= localHeroSlides.length) return

    const reordered = [...localHeroSlides]
    const temp = reordered[index]
    reordered[index] = reordered[targetIndex]
    reordered[targetIndex] = temp

    setLocalHeroSlides(reordered)
    setHasUnsavedHeroSlides(true)
  }

  const handleSaveHeroSlides = async () => {
    setSavingHeroSlides(true)
    try {
      await reorderHeroSlides(localHeroSlides)
      setHasUnsavedHeroSlides(false)
      if (reload) reload()
    } catch (err) {
      console.error('Save hero slides error:', err)
    } finally {
      setSavingHeroSlides(false)
    }
  }

  // ── Sections Management Handlers ───────────────────────────
  const handleMoveSection = (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= localSections.length) return

    const updated = [...localSections]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    const renumbered = updated.map((s, idx) => ({ ...s, order: idx + 1 }))
    setLocalSections(renumbered)
    setHasUnpublishedChanges(true)
  }

  const handleDuplicateSection = (index) => {
    const source = localSections[index]
    if (!source) return

    const copy = {
      ...JSON.parse(JSON.stringify(source)),
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `${source.title} (Copy)`,
      order: index + 2,
    }

    const updated = [...localSections]
    updated.splice(index + 1, 0, copy)

    const renumbered = updated.map((s, idx) => ({ ...s, order: idx + 1 }))
    setLocalSections(renumbered)
    setHasUnpublishedChanges(true)
    if (showToast) showToast('Section duplicated successfully! Save Draft or Publish to apply.')
  }

  const handleToggleSectionEnabled = (index) => {
    const updated = [...localSections]
    const current = updated[index].enabled !== false && updated[index].isVisible !== false
    updated[index] = {
      ...updated[index],
      enabled: !current,
      isVisible: !current,
    }
    setLocalSections(updated)
    setHasUnpublishedChanges(true)
  }

  const handleConfirmDeleteSection = () => {
    if (!sectionToDelete) return
    const updated = localSections.filter(s => s.id !== sectionToDelete.id)
    const renumbered = updated.map((s, idx) => ({ ...s, order: idx + 1 }))
    setLocalSections(renumbered)
    setSectionToDelete(null)
    setHasUnpublishedChanges(true)
    if (showToast) showToast('Section removed from draft layout.')
  }

  // ── Draft & Publishing Handlers ────────────────────────────
  const handleSaveDraft = async () => {
    setSavingDraft(true)
    try {
      if (saveDraftSections) {
        await saveDraftSections(localSections)
      } else {
        localStorage.setItem('qg_draft_sections', JSON.stringify(localSections))
        if (showToast) showToast('Draft saved successfully!')
      }
      setHasUnpublishedChanges(true) // Still unpublished to live store
    } catch (err) {
      console.error('Save draft error:', err)
      if (showToast) showToast(err.message, 'danger')
    } finally {
      setSavingDraft(false)
    }
  }

  const handlePublishLive = async () => {
    setPublishing(true)
    try {
      if (publishHomepageSections) {
        await publishHomepageSections(localSections, `Live deployment ${new Date().toLocaleDateString('en-GB')}`)
      } else {
        await saveSectionsLayout(localSections)
      }
      setHasUnpublishedChanges(false)
      if (reload) reload()
    } catch (err) {
      console.error('Publish error:', err)
      if (showToast) showToast(err.message, 'danger')
    } finally {
      setPublishing(false)
    }
  }

  const handleOpenHistoryModal = async () => {
    setShowHistoryModal(true)
    setLoadingVersions(true)
    try {
      if (loadSectionVersions) {
        const versions = await loadSectionVersions()
        setVersionsList(versions || [])
      }
    } catch (err) {
      console.error('Fetch versions error:', err)
    } finally {
      setLoadingVersions(false)
    }
  }

  const handleRestoreVersion = async (versionId) => {
    if (!window.confirm('Are you sure you want to restore this previous version? This will restore and publish it live to the store.')) return

    setRestoringVersionId(versionId)
    try {
      if (restoreSectionVersion) {
        const res = await restoreSectionVersion(versionId)
        if (res && res.sections) {
          setLocalSections(res.sections)
        }
      }
      setShowHistoryModal(false)
      setHasUnpublishedChanges(false)
      if (reload) reload()
    } catch (err) {
      console.error('Restore version error:', err)
      if (showToast) showToast(err.message, 'danger')
    } finally {
      setRestoringVersionId(null)
    }
  }

  // ── 2-Step Creation Wizard ─────────────────────────────────
  const handleOpenAddWizard = (insertIndex = null) => {
    setInsertTargetIndex(insertIndex)
    setWizardStep(1)
    setWizardContainerLayout('single')
    setWizardBlockType('products')
    setWizardData({
      title: '',
      subtitle: '',
      category: '',
      group: 'new',
      color: '#00998f',
      bg: '',
      banner1: { image: '', link: '/shop', title: '', badge: '' },
      banner2: { image: '', link: '/shop', title: '', badge: '' },
      announcement: {
        heading: 'Special Promotion Offer',
        subheading: 'Order today and enjoy fast direct dispatch across Pakistan!',
        buttonText: 'Shop Wholesale',
        buttonLink: '/shop',
        bgColor: '#049977',
        textColor: '#ffffff',
      },
    })
    setShowWizardModal(true)
  }

  const handleWizardBannerUpload = async (bannerKey, e) => {
    const files = e.target.files
    if (!files || !files.length) return
    try {
      const webp = await convertFileToWebp(files[0], 1920, 0.85)
      const urls = await uploadWebpImages([webp])
      if (urls && urls[0]) {
        setWizardData(prev => ({
          ...prev,
          [bannerKey]: {
            ...prev[bannerKey],
            image: urls[0],
          },
        }))
      }
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
  }

  const handleFinishWizard = () => {
    const newId = `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    let content = {}

    if (wizardBlockType === 'products') {
      content = {
        category: wizardData.category || null,
        group: wizardData.group || 'new',
        color: wizardData.color || '#00998f',
        bg: wizardData.bg || '',
      }
    } else if (wizardBlockType === 'banner') {
      content = {
        banners: wizardContainerLayout === 'single'
          ? [wizardData.banner1]
          : [wizardData.banner1, wizardData.banner2],
      }
    } else if (wizardBlockType === 'announcement') {
      content = {
        announcement: wizardData.announcement,
      }
    }

    const createdSection = {
      id: newId,
      title: wizardData.title || (wizardBlockType === 'banner' ? 'Promotional Showcase' : 'Special Collection'),
      subtitle: wizardData.subtitle || '',
      containerLayout: wizardContainerLayout,
      blockType: wizardBlockType,
      enabled: true,
      isVisible: true,
      isPublished: true,
      color: wizardData.color || '#00998f',
      bg: wizardData.bg || '',
      category: wizardData.category || null,
      group: wizardData.group || null,
      content,
      responsiveSettings: {
        mobileStack: true,
        hideOnMobile: false,
      },
    }

    const updated = [...localSections]
    if (insertTargetIndex !== null && insertTargetIndex >= 0) {
      updated.splice(insertTargetIndex, 0, createdSection)
    } else {
      updated.push(createdSection)
    }

    const renumbered = updated.map((s, idx) => ({ ...s, order: idx + 1 }))
    setLocalSections(renumbered)
    setHasUnpublishedChanges(true)
    setShowWizardModal(false)
    if (showToast) showToast('New section added to layout! Save Draft or Publish Changes to go live.')
  }

  // Count matching products helper
  const getMatchingCount = (sec) => {
    return products.filter(p => {
      if (sec.category && (p.category === sec.category || p.categorySlug === sec.category)) return true
      if (sec.group && p.group === sec.group) return true
      return false
    }).length
  }

  return (
    <div className="homepage-editor-view">
      {/* ── Page Header ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h3 className="fw-bold mb-0 text-dark">
              <i className="bi bi-window-stack text-success me-2"></i>
              Elementor-Style Dynamic Homepage Builder
            </h3>
            {activeTab === 'sections' && (
              <span className={`badge ${hasUnpublishedChanges ? 'bg-warning text-dark' : 'bg-success text-white'}`}>
                {hasUnpublishedChanges ? '● Unpublished Draft Changes' : '✓ All Changes Published Live'}
              </span>
            )}
          </div>
          <p className="text-muted small mb-0">
            Build containers (1-col, 2-col 50/50, 70/30, 30/70), bind product feeds or banners, and preview responsively before publishing
          </p>
        </div>

        {/* Top Control Bar Actions */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          {activeTab === 'sections' && (
            <>
              {/* Responsive Viewport Switcher */}
              <div className="btn-group btn-group-sm border rounded-pill p-1 bg-white shadow-sm" role="group">
                <button
                  type="button"
                  className={`btn rounded-pill px-2.5 py-1 ${previewViewport === 'desktop' ? 'btn-success text-white' : 'btn-light text-muted'}`}
                  onClick={() => setPreviewViewport(prev => prev === 'desktop' ? 'hidden' : 'desktop')}
                  title="Desktop Preview (1200px)"
                >
                  <i className="bi bi-display me-1"></i> Desktop
                </button>
                <button
                  type="button"
                  className={`btn rounded-pill px-2.5 py-1 ${previewViewport === 'tablet' ? 'btn-success text-white' : 'btn-light text-muted'}`}
                  onClick={() => setPreviewViewport(prev => prev === 'tablet' ? 'hidden' : 'tablet')}
                  title="Tablet Preview (768px)"
                >
                  <i className="bi bi-tablet me-1"></i> Tablet
                </button>
                <button
                  type="button"
                  className={`btn rounded-pill px-2.5 py-1 ${previewViewport === 'mobile' ? 'btn-success text-white' : 'btn-light text-muted'}`}
                  onClick={() => setPreviewViewport(prev => prev === 'mobile' ? 'hidden' : 'mobile')}
                  title="Mobile Phone Preview (375px)"
                >
                  <i className="bi bi-phone me-1"></i> Mobile
                </button>
              </div>

              {/* Version History Button */}
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5"
                onClick={handleOpenHistoryModal}
                title="View previous published versions and restore snapshots"
              >
                <i className="bi bi-clock-history text-primary"></i>
                <span>History / Rollback</span>
              </button>

              {/* Save Draft Button */}
              <button
                type="button"
                className="btn btn-outline-dark btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5"
                onClick={handleSaveDraft}
                disabled={savingDraft}
              >
                <i className="bi bi-file-earmark-arrow-down"></i>
                <span>{savingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
              </button>

              {/* Publish Live Button */}
              <button
                type="button"
                className="btn btn-success btn-sm rounded-pill px-3.5 fw-semibold d-flex align-items-center gap-1.5 shadow"
                onClick={handlePublishLive}
                disabled={publishing}
              >
                <i className="bi bi-cloud-arrow-up-fill"></i>
                <span>{publishing ? 'Publishing Live...' : 'Publish Changes'}</span>
              </button>

              {/* Add Section Button */}
              <button
                type="button"
                className="btn btn-dark btn-sm rounded-pill px-3.5 fw-semibold d-flex align-items-center gap-1.5"
                onClick={() => handleOpenAddWizard(localSections.length)}
              >
                <i className="bi bi-plus-lg"></i>
                <span>+ Add Section</span>
              </button>
            </>
          )}

          {activeTab === 'hero' && (
            <>
              <button
                type="button"
                className={`btn fw-semibold px-4 d-flex align-items-center gap-2 ${hasUnsavedHeroSlides ? 'btn-success shadow' : 'btn-outline-success'}`}
                onClick={handleSaveHeroSlides}
                disabled={savingHeroSlides}
              >
                <i className="bi bi-floppy"></i>
                {savingHeroSlides ? 'Saving Slides...' : hasUnsavedHeroSlides ? 'Save Slides Order *' : 'Slides Order Saved'}
              </button>
              <button
                type="button"
                className="btn btn-success fw-semibold px-3 d-flex align-items-center gap-2"
                onClick={() => {
                  setNewSlide({ image: '', alt: '', link: '/shop' })
                  setSlidePosition('first')
                  setUploadError('')
                  setShowAddSlideModal(true)
                }}
              >
                <i className="bi bi-plus-lg"></i>
                Add New Slide
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Main Tab Navigation ── */}
      <ul className="nav nav-pills gap-2 mb-4 p-1.5 bg-light rounded-3 border">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fw-semibold px-4 d-flex align-items-center gap-2 ${activeTab === 'sections' ? 'active shadow-sm' : 'text-dark'}`}
            onClick={() => setActiveTab('sections')}
          >
            <i className="bi bi-grid-1x2"></i>
            Homepage Sections &amp; Containers ({localSections.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fw-semibold px-4 d-flex align-items-center gap-2 ${activeTab === 'hero' ? 'active shadow-sm' : 'text-dark'}`}
            onClick={() => setActiveTab('hero')}
          >
            <i className="bi bi-images"></i>
            Hero Slides Carousel ({localHeroSlides.length})
          </button>
        </li>
      </ul>

      {/* ════════════════════════════════════════════════════════════
          RESPONSIVE LIVE PREVIEW FRAME (DESKTOP, TABLET, MOBILE)
         ════════════════════════════════════════════════════════════ */}
      {activeTab === 'sections' && previewViewport !== 'hidden' && (
        <div className="card border-0 shadow-lg mb-4 rounded-4 overflow-hidden bg-dark">
          <div className="card-header bg-dark text-white d-flex align-items-center justify-content-between py-2.5 px-3 border-secondary">
            <div className="d-flex align-items-center gap-2 small">
              <span className="badge bg-success">Live Viewport Preview</span>
              <span className="text-secondary">|</span>
              <span className="text-light text-capitalize">
                {previewViewport === 'desktop' && 'Desktop Device (100% full width)'}
                {previewViewport === 'tablet' && 'Tablet Device Viewport (768px)'}
                {previewViewport === 'mobile' && 'Mobile Phone Viewport (375px compact)'}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-outline-light btn-sm py-0.5 px-2"
              onClick={() => setPreviewViewport('hidden')}
              title="Close Preview Frame"
            >
              <i className="bi bi-x-lg"></i> Close Preview
            </button>
          </div>
          <div className="card-body p-3 d-flex justify-content-center bg-secondary-subtle" style={{ minHeight: '380px', maxHeight: '600px', overflowY: 'auto' }}>
            <div
              className="bg-white shadow rounded-3 transition-all p-3"
              style={{
                width: previewViewport === 'mobile' ? '375px' : previewViewport === 'tablet' ? '768px' : '100%',
                maxWidth: '100%',
              }}
            >
              <div className="text-center text-muted small pb-2 border-bottom mb-3">
                <i className="bi bi-eye me-1"></i> Interactive Draft Preview Mode (Exact Storefront Appearance)
              </div>
              {localSections.map((sec, idx) => (
                <div key={sec.id || idx} className="mb-4">
                  <DynamicHomeSection section={sec} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 1: HOMEPAGE SECTIONS & CONTAINERS BUILDER
         ════════════════════════════════════════════════════════════ */}
      {activeTab === 'sections' && (
        <div>
          {/* Top Insert Divider */}
          <div className="d-flex align-items-center justify-content-center my-3">
            <button
              type="button"
              className="btn btn-outline-success btn-sm rounded-pill px-3 shadow-sm bg-white"
              onClick={() => handleOpenAddWizard(0)}
            >
              <i className="bi bi-plus-circle me-1"></i> + Add Section Here (At Top #1)
            </button>
          </div>

          <div className="d-flex flex-column gap-3">
            {localSections.map((sec, idx) => {
              const matchingCount = getMatchingCount(sec)
              const isEnabled = sec.enabled !== false && sec.isVisible !== false
              const currentValue = sec.category ? `category:${sec.category}` : (sec.group || 'new')
              const layout = sec.containerLayout || 'single'
              const bType = sec.blockType || 'products'

              return (
                <div key={sec.id || idx}>
                  <div
                    className={`card border rounded-3 transition-all shadow-sm ${isEnabled ? 'bg-white' : 'bg-light opacity-75'}`}
                    style={{ borderLeft: `6px solid ${sec.color || '#00998f'}` }}
                  >
                    <div className="card-body p-3 p-md-3.5">
                      <div className="row g-3 align-items-center">
                        {/* 1. Position & Move Controls */}
                        <div className="col-auto d-flex align-items-center gap-2">
                          <span className="badge bg-dark text-white rounded-pill px-2.5 py-2 fs-6">
                            #{idx + 1}
                          </span>
                          <div className="btn-group-vertical btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary p-1"
                              onClick={() => handleMoveSection(idx, -1)}
                              disabled={idx === 0}
                              title="Move section up"
                            >
                              <i className="bi bi-chevron-up"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary p-1"
                              onClick={() => handleMoveSection(idx, 1)}
                              disabled={idx === localSections.length - 1}
                              title="Move section down"
                            >
                              <i className="bi bi-chevron-down"></i>
                            </button>
                          </div>
                        </div>

                        {/* 2. Container & Block Type Badges */}
                        <div className="col-12 col-md-3">
                          <div className="d-flex flex-wrap gap-1 mb-1.5">
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                              {layout === 'single' && '100% Single Col'}
                              {layout === 'two_equal' && '50/50 Dual Col'}
                              {layout === 'two_70_30' && '70/30 Split'}
                              {layout === 'two_30_70' && '30/70 Split'}
                            </span>
                            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                              {bType === 'products' && '🛒 Product Feed'}
                              {bType === 'banner' && '🖼️ Banner'}
                              {bType === 'announcement' && '📢 Announcement'}
                            </span>
                          </div>
                          <input
                            type="text"
                            className="form-control form-control-sm fw-bold text-dark"
                            value={sec.title || ''}
                            onChange={(e) => {
                              const updated = [...localSections]
                              updated[idx] = { ...updated[idx], title: e.target.value }
                              setLocalSections(updated)
                              setHasUnpublishedChanges(true)
                            }}
                            placeholder="Section Title"
                          />
                        </div>

                        {/* 3. Block Target / Configuration */}
                        <div className="col-12 col-md-4">
                          {bType === 'products' && (
                            <div>
                              <select
                                className="form-select form-select-sm mb-1"
                                value={currentValue}
                                onChange={(e) => {
                                  const val = e.target.value
                                  const updated = [...localSections]
                                  if (val.startsWith('category:')) {
                                    updated[idx] = {
                                      ...updated[idx],
                                      category: val.replace('category:', ''),
                                      group: null,
                                    }
                                  } else {
                                    updated[idx] = {
                                      ...updated[idx],
                                      group: val,
                                      category: null,
                                    }
                                  }
                                  setLocalSections(updated)
                                  setHasUnpublishedChanges(true)
                                }}
                              >
                                <optgroup label="Catalog Groups">
                                  {PRESET_GROUPS.map(g => (
                                    <option key={g.key} value={g.key}>{g.label}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Store Categories">
                                  {categories.map(c => (
                                    <option key={c.id || c.name} value={`category:${c.name}`}>
                                      Category: {c.name}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                              <div className="small text-muted d-flex align-items-center gap-2">
                                <span><i className="bi bi-box-seam me-1"></i>{matchingCount} products</span>
                                <span>•</span>
                                <input
                                  type="color"
                                  className="form-control form-control-color form-control-sm p-0 border-0"
                                  value={sec.color || '#00998f'}
                                  onChange={(e) => {
                                    const updated = [...localSections]
                                    updated[idx] = { ...updated[idx], color: e.target.value }
                                    setLocalSections(updated)
                                    setHasUnpublishedChanges(true)
                                  }}
                                  title="Theme color"
                                  style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                                />
                              </div>
                            </div>
                          )}

                          {bType === 'banner' && (
                            <div className="small text-muted">
                              <div><i className="bi bi-link-45deg me-1"></i>Destination: <code>{sec.content?.banners?.[0]?.link || '/shop'}</code></div>
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-success text-decoration-none fw-semibold"
                                onClick={() => setEditingSection({ sec, idx })}
                              >
                                Edit Banner Images &amp; Links →
                              </button>
                            </div>
                          )}

                          {bType === 'announcement' && (
                            <div className="small text-muted">
                              <div>Heading: <strong>{sec.content?.announcement?.heading || sec.title}</strong></div>
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-success text-decoration-none fw-semibold"
                                onClick={() => setEditingSection({ sec, idx })}
                              >
                                Edit Announcement Callout →
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 4. Actions: Duplicate, Visibility Toggle, Delete */}
                        <div className="col-auto ms-auto d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm rounded-pill p-1.5 px-2.5"
                            onClick={() => handleDuplicateSection(idx)}
                            title="Duplicate section"
                          >
                            <i className="bi bi-copy me-1"></i> Clone
                          </button>

                          <div className="form-check form-switch fs-5 mb-0" title="Active on live store">
                            <input
                              className="form-check-input cursor-pointer"
                              type="checkbox"
                              role="switch"
                              checked={isEnabled}
                              onChange={() => handleToggleSectionEnabled(idx)}
                              id={`sec-switch-${sec.id || idx}`}
                            />
                          </div>

                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm rounded-pill p-1.5 px-2.5"
                            onClick={() => setSectionToDelete(sec)}
                            title="Delete section"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Between-Sections Insert Divider */}
                  <div className="d-flex align-items-center justify-content-center my-2.5">
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm rounded-pill px-3 py-1 shadow-sm bg-white border-dashed"
                      onClick={() => handleOpenAddWizard(idx + 1)}
                    >
                      <i className="bi bi-plus-circle me-1"></i> + Add Section Here (Between #{idx + 1} &amp; #{idx + 2})
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 2: HERO SLIDES CAROUSEL
         ════════════════════════════════════════════════════════════ */}
      {activeTab === 'hero' && (
        <div>
          <div className="alert alert-info py-2.5 px-3 rounded-3 shadow-sm mb-4 small">
            <i className="bi bi-info-circle-fill me-2"></i>
            Hero Slides appear right below the header. Manage high-resolution promotional banners, destinations, and drag order.
          </div>

          <div className="row g-3">
            {localHeroSlides.map((slide, idx) => (
              <div className="col-12 col-md-6 col-lg-4" key={slide.id || idx}>
                <div className="card h-100 border rounded-3 shadow-sm overflow-hidden">
                  <div className="position-relative">
                    <img
                      src={slide.image}
                      alt={slide.alt || 'Hero Slide'}
                      className="card-img-top"
                      style={{ aspectRatio: '1536/538', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp' }}
                    />
                    <span className="badge bg-dark position-absolute top-0 start-0 m-2 rounded-pill px-2 py-1">
                      #{idx + 1}
                    </span>
                  </div>
                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                      <p className="fw-semibold text-dark small mb-1 text-truncate">
                        {slide.alt || 'Hero Slide Banner'}
                      </p>
                      <small className="text-muted text-truncate d-block mb-2">
                        Link: {slide.link || '/shop'}
                      </small>
                    </div>
                    <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handleMoveSlide(idx, -1)}
                          disabled={idx === 0}
                          title="Move Left"
                        >
                          <i className="bi bi-arrow-left"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handleMoveSlide(idx, 1)}
                          disabled={idx === localHeroSlides.length - 1}
                          title="Move Right"
                        >
                          <i className="bi bi-arrow-right"></i>
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => setSlideToDelete(slide)}
                      >
                        <i className="bi bi-trash3 me-1"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          2-STEP CREATION WIZARD MODAL (ELEMENTOR CONCEPT)
         ════════════════════════════════════════════════════════════ */}
      {showWizardModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              {/* Modal Header */}
              <div className="modal-header bg-light border-bottom py-3 px-4">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    <i className="bi bi-plus-square-fill text-success me-2"></i>
                    Add New Homepage Section — Step {wizardStep} of 2
                  </h5>
                  <small className="text-muted">
                    {wizardStep === 1 ? 'Select Container Layout & Structure' : 'Select Content Block & Configuration'}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowWizardModal(false)}
                />
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4">
                {/* ── STEP 1: SELECT CONTAINER LAYOUT ── */}
                {wizardStep === 1 && (
                  <div>
                    <h6 className="fw-bold text-dark mb-3">1. Select Container Column Structure:</h6>
                    <div className="row g-3">
                      {/* Option 1: Single Column 100% */}
                      <div className="col-12 col-md-6">
                        <div
                          className={`p-3 border rounded-3 cursor-pointer text-center h-100 transition-all ${wizardContainerLayout === 'single' ? 'border-success bg-success-subtle shadow-sm' : 'border-light-subtle bg-white'}`}
                          onClick={() => setWizardContainerLayout('single')}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="bg-success text-white py-3 rounded-2 fw-bold mb-2">100% Full Width Column</div>
                          <h6 className="fw-bold mb-1">Single Container (1 Column)</h6>
                          <small className="text-muted">Ideal for category products carousel, full-width banner, or announcement bar</small>
                        </div>
                      </div>

                      {/* Option 2: Two Columns 50/50 */}
                      <div className="col-12 col-md-6">
                        <div
                          className={`p-3 border rounded-3 cursor-pointer text-center h-100 transition-all ${wizardContainerLayout === 'two_equal' ? 'border-success bg-success-subtle shadow-sm' : 'border-light-subtle bg-white'}`}
                          onClick={() => setWizardContainerLayout('two_equal')}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex gap-2 mb-2">
                            <div className="bg-success text-white py-3 rounded-2 fw-bold flex-fill">50%</div>
                            <div className="bg-success text-white py-3 rounded-2 fw-bold flex-fill">50%</div>
                          </div>
                          <h6 className="fw-bold mb-1">Two Equal Columns (50 / 50)</h6>
                          <small className="text-muted">Perfect for two side-by-side promotional offer banners</small>
                        </div>
                      </div>

                      {/* Option 3: Two Columns 70/30 */}
                      <div className="col-12 col-md-6">
                        <div
                          className={`p-3 border rounded-3 cursor-pointer text-center h-100 transition-all ${wizardContainerLayout === 'two_70_30' ? 'border-success bg-success-subtle shadow-sm' : 'border-light-subtle bg-white'}`}
                          onClick={() => setWizardContainerLayout('two_70_30')}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex gap-2 mb-2">
                            <div className="bg-success text-white py-3 rounded-2 fw-bold" style={{ flex: '7' }}>70%</div>
                            <div className="bg-success text-white py-3 rounded-2 fw-bold" style={{ flex: '3' }}>30%</div>
                          </div>
                          <h6 className="fw-bold mb-1">Split Columns (70 / 30)</h6>
                          <small className="text-muted">Large featured banner on left, compact highlight card on right</small>
                        </div>
                      </div>

                      {/* Option 4: Two Columns 30/70 */}
                      <div className="col-12 col-md-6">
                        <div
                          className={`p-3 border rounded-3 cursor-pointer text-center h-100 transition-all ${wizardContainerLayout === 'two_30_70' ? 'border-success bg-success-subtle shadow-sm' : 'border-light-subtle bg-white'}`}
                          onClick={() => setWizardContainerLayout('two_30_70')}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex gap-2 mb-2">
                            <div className="bg-success text-white py-3 rounded-2 fw-bold" style={{ flex: '3' }}>30%</div>
                            <div className="bg-success text-white py-3 rounded-2 fw-bold" style={{ flex: '7' }}>70%</div>
                          </div>
                          <h6 className="fw-bold mb-1">Split Columns (30 / 70)</h6>
                          <small className="text-muted">Compact card on left, wide promotional showcase on right</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: SELECT CONTENT BLOCK & CONFIGURE ── */}
                {wizardStep === 2 && (
                  <div>
                    <h6 className="fw-bold text-dark mb-3">2. Choose Content Block Type:</h6>
                    <div className="d-flex gap-2 mb-4">
                      <button
                        type="button"
                        className={`btn flex-fill py-2.5 fw-semibold ${wizardBlockType === 'products' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                        onClick={() => setWizardBlockType('products')}
                      >
                        <i className="bi bi-bag-check me-1"></i> Product Category Feed
                      </button>
                      <button
                        type="button"
                        className={`btn flex-fill py-2.5 fw-semibold ${wizardBlockType === 'banner' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                        onClick={() => setWizardBlockType('banner')}
                      >
                        <i className="bi bi-image me-1"></i> Promotional Banner
                      </button>
                      <button
                        type="button"
                        className={`btn flex-fill py-2.5 fw-semibold ${wizardBlockType === 'announcement' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                        onClick={() => setWizardBlockType('announcement')}
                      >
                        <i className="bi bi-megaphone me-1"></i> Text Announcement
                      </button>
                    </div>

                    {/* Form for Product Feed */}
                    {wizardBlockType === 'products' && (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Section Heading / Title</label>
                          <input
                            type="text"
                            className="form-control"
                            value={wizardData.title}
                            onChange={e => setWizardData({ ...wizardData, title: e.target.value })}
                            placeholder="e.g. Smart Watch Deals &amp; Accessories"
                          />
                        </div>
                        <div className="row g-3">
                          <div className="col-12 col-md-8">
                            <label className="form-label fw-semibold small">Category / Product Feed Target</label>
                            <select
                              className="form-select"
                              value={wizardData.category ? `category:${wizardData.category}` : wizardData.group}
                              onChange={e => {
                                const val = e.target.value
                                if (val.startsWith('category:')) {
                                  setWizardData({ ...wizardData, category: val.replace('category:', ''), group: '' })
                                } else {
                                  setWizardData({ ...wizardData, group: val, category: '' })
                                }
                              }}
                            >
                              <optgroup label="Catalog Groups">
                                {PRESET_GROUPS.map(g => (
                                  <option key={g.key} value={g.key}>{g.label}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Store Categories">
                                {categories.map(c => (
                                  <option key={c.id || c.name} value={`category:${c.name}`}>
                                    Category: {c.name}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                          <div className="col-12 col-md-4">
                            <label className="form-label fw-semibold small">Theme Accent Color</label>
                            <input
                              type="color"
                              className="form-control form-control-color w-100"
                              value={wizardData.color}
                              onChange={e => setWizardData({ ...wizardData, color: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form for Banner */}
                    {wizardBlockType === 'banner' && (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <h6 className="fw-bold mb-3">Banner Details:</h6>
                        <div className="row g-3">
                          <div className="col-12">
                            <label className="form-label fw-semibold small">Column 1 Banner Image URL</label>
                            <div className="input-group mb-2">
                              <input
                                type="text"
                                className="form-control"
                                value={wizardData.banner1.image}
                                onChange={e => setWizardData({
                                  ...wizardData,
                                  banner1: { ...wizardData.banner1, image: e.target.value },
                                })}
                                placeholder="https://... or upload .WebP"
                              />
                              <label className="btn btn-outline-secondary">
                                <i className="bi bi-upload me-1"></i> Upload Image
                                <input
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  onChange={e => handleWizardBannerUpload('banner1', e)}
                                />
                              </label>
                            </div>
                            <div className="row g-2">
                              <div className="col-md-6">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={wizardData.banner1.link}
                                  onChange={e => setWizardData({
                                    ...wizardData,
                                    banner1: { ...wizardData.banner1, link: e.target.value },
                                  })}
                                  placeholder="Link Destination (e.g. /category/watches)"
                                />
                              </div>
                              <div className="col-md-6">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={wizardData.banner1.badge}
                                  onChange={e => setWizardData({
                                    ...wizardData,
                                    banner1: { ...wizardData.banner1, badge: e.target.value },
                                  })}
                                  placeholder="Floating Badge (e.g. HOT DEAL, 40% OFF)"
                                />
                              </div>
                            </div>
                          </div>

                          {wizardContainerLayout !== 'single' && (
                            <div className="col-12 pt-3 border-top">
                              <label className="form-label fw-semibold small">Column 2 Banner Image URL</label>
                              <div className="input-group mb-2">
                                <input
                                  type="text"
                                  className="form-control"
                                  value={wizardData.banner2.image}
                                  onChange={e => setWizardData({
                                    ...wizardData,
                                    banner2: { ...wizardData.banner2, image: e.target.value },
                                  })}
                                  placeholder="https://... or upload .WebP"
                                />
                                <label className="btn btn-outline-secondary">
                                  <i className="bi bi-upload me-1"></i> Upload Image
                                  <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={e => handleWizardBannerUpload('banner2', e)}
                                  />
                                </label>
                              </div>
                              <div className="row g-2">
                                <div className="col-md-6">
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={wizardData.banner2.link}
                                    onChange={e => setWizardData({
                                      ...wizardData,
                                      banner2: { ...wizardData.banner2, link: e.target.value },
                                    })}
                                    placeholder="Link Destination (e.g. /shop)"
                                  />
                                </div>
                                <div className="col-md-6">
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={wizardData.banner2.badge}
                                    onChange={e => setWizardData({
                                      ...wizardData,
                                      banner2: { ...wizardData.banner2, badge: e.target.value },
                                    })}
                                    placeholder="Floating Badge (e.g. NEW ARRIVAL)"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Form for Announcement */}
                    {wizardBlockType === 'announcement' && (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Main Heading</label>
                          <input
                            type="text"
                            className="form-control"
                            value={wizardData.announcement.heading}
                            onChange={e => setWizardData({
                              ...wizardData,
                              announcement: { ...wizardData.announcement, heading: e.target.value },
                            })}
                            placeholder="e.g. Pakistan's Leading Wholesaler of Smart Gadgets"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Subtitle / Marketing Message</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            value={wizardData.announcement.subheading}
                            onChange={e => setWizardData({
                              ...wizardData,
                              announcement: { ...wizardData.announcement, subheading: e.target.value },
                            })}
                            placeholder="Order bulk lots with cash on delivery across Pakistan..."
                          />
                        </div>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold small">Button Text</label>
                            <input
                              type="text"
                              className="form-control"
                              value={wizardData.announcement.buttonText}
                              onChange={e => setWizardData({
                                ...wizardData,
                                announcement: { ...wizardData.announcement, buttonText: e.target.value },
                              })}
                              placeholder="Shop Wholesale Now"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold small">Button Destination Link</label>
                            <input
                              type="text"
                              className="form-control"
                              value={wizardData.announcement.buttonLink}
                              onChange={e => setWizardData({
                                ...wizardData,
                                announcement: { ...wizardData.announcement, buttonLink: e.target.value },
                              })}
                              placeholder="/bulk-order"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light border-top py-3 px-4 d-flex justify-content-between">
                {wizardStep === 2 ? (
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-3"
                    onClick={() => setWizardStep(1)}
                  >
                    ← Back to Container
                  </button>
                ) : (
                  <div />
                )}

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary px-3"
                    onClick={() => setShowWizardModal(false)}
                  >
                    Cancel
                  </button>
                  {wizardStep === 1 ? (
                    <button
                      type="button"
                      className="btn btn-success px-4 fw-semibold"
                      onClick={() => setWizardStep(2)}
                    >
                      Next: Choose Content Block →
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-success px-4 fw-semibold shadow"
                      onClick={handleFinishWizard}
                    >
                      <i className="bi bi-check-lg me-1"></i> Add Section to Layout
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          VERSION HISTORY & ROLLBACK SNAPSHOTS MODAL
         ════════════════════════════════════════════════════════════ */}
      {showHistoryModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-bottom py-3 px-4">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    <i className="bi bi-clock-history text-primary me-2"></i>
                    Published Homepage Versions &amp; Rollback History
                  </h5>
                  <small className="text-muted">
                    Restore any previous published version with 1-click if you want to undo changes
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowHistoryModal(false)}
                />
              </div>
              <div className="modal-body p-4">
                {loadingVersions ? (
                  <div className="text-center py-5 text-muted">
                    <div className="spinner-border text-primary mb-2" role="status"></div>
                    <p className="mb-0">Loading version history snapshots...</p>
                  </div>
                ) : versionsList.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-archive fs-1 d-block mb-2 text-secondary"></i>
                    <p className="mb-0">No archived versions found yet. A snapshot will be saved automatically each time you click &ldquo;Publish Changes&rdquo;.</p>
                  </div>
                ) : (
                  <div className="list-group">
                    {versionsList.map((ver, idx) => (
                      <div
                        key={ver.id || idx}
                        className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 rounded-3 mb-2 border"
                      >
                        <div>
                          <div className="fw-bold text-dark mb-1">
                            {ver.version_label || `Version #${ver.id}`}
                          </div>
                          <small className="text-muted">
                            <i className="bi bi-calendar3 me-1"></i>
                            {new Date(ver.created_at).toLocaleString('en-GB')}
                            <span className="mx-2">•</span>
                            <i className="bi bi-person me-1"></i>
                            {ver.published_by || 'Admin'}
                          </small>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm rounded-pill px-3"
                          onClick={() => handleRestoreVersion(ver.id)}
                          disabled={restoringVersionId === ver.id}
                        >
                          {restoringVersionId === ver.id ? 'Restoring...' : 'Restore Version'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light border-top py-2 px-4">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Section Confirmation Modal ── */}
      {sectionToDelete && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Delete Section
                </h5>
                <button type="button" className="btn-close" onClick={() => setSectionToDelete(null)} />
              </div>
              <div className="modal-body p-4">
                <p className="mb-2">Are you sure you want to delete this section from your layout?</p>
                <div className="p-3 bg-light rounded-2 border">
                  <strong>{sectionToDelete.title}</strong>
                  <div className="small text-muted">
                    Layout: {sectionToDelete.containerLayout || 'Single'} | Type: {sectionToDelete.blockType || 'Products'}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top py-2 px-3">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSectionToDelete(null)}>Cancel</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleConfirmDeleteSection}>Delete Section</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Slide Modal (Hero Slides) ── */}
      {showAddSlideModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-plus-circle text-success me-2"></i>
                  Add New Hero Slide Banner
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAddSlideModal(false)} />
              </div>
              <form onSubmit={handleSaveNewSlide}>
                <div className="modal-body p-4">
                  {uploadError && <div className="alert alert-danger py-2 small">{uploadError}</div>}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Upload Slide Banner (.WebP Automatic)</label>
                    <input type="file" className="form-control" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                    {uploadMsg && <div className="text-success small mt-1">{uploadMsg}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Image URL</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newSlide.image}
                      onChange={e => setNewSlide({ ...newSlide, image: e.target.value })}
                      placeholder="https://..."
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Slide Alt / Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newSlide.alt}
                      onChange={e => setNewSlide({ ...newSlide, alt: e.target.value })}
                      placeholder="e.g. Special Eid Gadgets Promotion"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Click Destination URL</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newSlide.link}
                      onChange={e => setNewSlide({ ...newSlide, link: e.target.value })}
                      placeholder="/shop"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Slide Placement</label>
                    <select className="form-select" value={slidePosition} onChange={e => setSlidePosition(e.target.value)}>
                      <option value="first">Show as 1st Slide (Featured)</option>
                      <option value="last">Append to End</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top py-2 px-3">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddSlideModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success btn-sm px-3" disabled={uploading || !newSlide.image}>Save &amp; Publish Slide</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Slide Modal ── */}
      {slideToDelete && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title fw-bold text-danger">Delete Slide</h5>
                <button type="button" className="btn-close" onClick={() => setSlideToDelete(null)} />
              </div>
              <div className="modal-body p-4">
                <p>Are you sure you want to delete this hero slide banner?</p>
                <img src={slideToDelete.image} alt="" className="img-fluid rounded border mb-2" style={{ maxHeight: '140px', width: '100%', objectFit: 'cover' }} />
              </div>
              <div className="modal-footer border-top py-2 px-3">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSlideToDelete(null)}>Cancel</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleConfirmDeleteSlide}>Delete Slide</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
