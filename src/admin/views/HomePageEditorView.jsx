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
  const [wizardBlockType, setWizardBlockType] = useState('products') // 'products' | 'banner' | 'announcement' | 'image_text' | 'countdown' | 'trust_bar'
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
    image_text: {
      image: 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp',
      imageAlt: 'Featured Showcase',
      heading: 'Premium Quality Gadgets',
      text: 'Discover innovative lifestyle accessories and smart gadgets engineered for performance and durability.',
      buttonText: 'Explore Catalog',
      buttonLink: '/shop',
      imagePosition: 'left',
      bgColor: '#ffffff',
      textColor: '#1e293b',
    },
    countdown: {
      heading: 'Limited Time Flash Sale',
      subheading: 'Special wholesale rates available until timer expires!',
      targetDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16),
      buttonText: 'Shop Deals Now',
      buttonLink: '/shop?group=hot',
      bgColor: '#0f3c28',
      textColor: '#ffffff',
    },
    trust_bar: {
      heading: 'Why Shop With Us',
      items: [
        { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders over Rs. 3,000' },
        { icon: '💬', title: '24/7 WhatsApp Help', subtitle: 'Live chat support anytime' },
        { icon: '🛡️', title: '100% Genuine Items', subtitle: 'Tested & verified products' },
        { icon: '💵', title: 'Cash on Delivery', subtitle: 'Pay when your parcel arrives' },
      ],
      bgColor: '#ffffff',
      textColor: '#1e293b',
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
      image_text: {
        image: 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp',
        imageAlt: 'Featured Showcase',
        heading: 'Premium Quality Gadgets',
        text: 'Discover innovative lifestyle accessories and smart gadgets engineered for performance and durability.',
        buttonText: 'Explore Catalog',
        buttonLink: '/shop',
        imagePosition: 'left',
        bgColor: '#ffffff',
        textColor: '#1e293b',
      },
      countdown: {
        heading: 'Limited Time Flash Sale',
        subheading: 'Special wholesale rates available until timer expires!',
        targetDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16),
        buttonText: 'Shop Deals Now',
        buttonLink: '/shop?group=hot',
        bgColor: '#0f3c28',
        textColor: '#ffffff',
      },
      trust_bar: {
        heading: 'Why Shop With Us',
        items: [
          { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders over Rs. 3,000' },
          { icon: '💬', title: '24/7 WhatsApp Help', subtitle: 'Live chat support anytime' },
          { icon: '🛡️', title: '100% Genuine Items', subtitle: 'Tested & verified products' },
          { icon: '💵', title: 'Cash on Delivery', subtitle: 'Pay when your parcel arrives' },
        ],
        bgColor: '#ffffff',
        textColor: '#1e293b',
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

  const handleWizardImageTextUpload = async (e) => {
    const files = e.target.files
    if (!files || !files.length) return
    try {
      const webp = await convertFileToWebp(files[0], 1920, 0.85)
      const urls = await uploadWebpImages([webp])
      if (urls && urls[0]) {
        setWizardData(prev => ({
          ...prev,
          image_text: {
            ...prev.image_text,
            image: urls[0],
          },
        }))
      }
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
  }

  const handleEditSectionImageUpload = async (targetPath, e) => {
    const files = e.target.files
    if (!files || !files.length) return
    try {
      const webp = await convertFileToWebp(files[0], 1920, 0.85)
      const urls = await uploadWebpImages([webp])
      if (urls && urls[0]) {
        setEditingSection(prev => {
          if (!prev) return null
          const nextSec = JSON.parse(JSON.stringify(prev.sec))
          if (!nextSec.content) nextSec.content = {}
          if (targetPath === 'banner1') {
            if (!nextSec.content.banners) nextSec.content.banners = []
            if (!nextSec.content.banners[0]) nextSec.content.banners[0] = {}
            nextSec.content.banners[0].image = urls[0]
          } else if (targetPath === 'banner2') {
            if (!nextSec.content.banners) nextSec.content.banners = []
            if (!nextSec.content.banners[1]) nextSec.content.banners[1] = {}
            nextSec.content.banners[1].image = urls[0]
          } else if (targetPath === 'image_text') {
            if (!nextSec.content.image_text) nextSec.content.image_text = {}
            nextSec.content.image_text.image = urls[0]
          }
          return { ...prev, sec: nextSec }
        })
      }
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
  }

  const handleSaveEditingSection = () => {
    if (!editingSection) return
    const updated = [...localSections]
    updated[editingSection.idx] = editingSection.sec
    setLocalSections(updated)
    setHasUnpublishedChanges(true)
    setEditingSection(null)
    if (showToast) showToast('Section updated in draft! Click "Publish Changes" to apply to live storefront.')
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
    } else if (wizardBlockType === 'image_text') {
      content = {
        image_text: {
          image: wizardData.image_text.image || 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp',
          imageAlt: wizardData.image_text.imageAlt || wizardData.title || 'Showcase',
          heading: wizardData.image_text.heading || wizardData.title || 'Premium Quality Gadgets',
          text: wizardData.image_text.text || wizardData.subtitle || 'Discover innovative lifestyle accessories and smart gadgets engineered for performance and durability.',
          buttonText: wizardData.image_text.buttonText || 'Explore Catalog',
          buttonLink: wizardData.image_text.buttonLink || '/shop',
          imagePosition: wizardData.image_text.imagePosition || 'left',
          bgColor: wizardData.image_text.bgColor || '#ffffff',
          textColor: wizardData.image_text.textColor || '#1e293b',
        },
      }
    } else if (wizardBlockType === 'countdown') {
      content = {
        countdown: {
          heading: wizardData.countdown.heading || wizardData.title || 'Limited Time Flash Sale',
          subheading: wizardData.countdown.subheading || wizardData.subtitle || 'Special wholesale rates available until timer expires!',
          targetDate: wizardData.countdown.targetDate || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          buttonText: wizardData.countdown.buttonText || 'Shop Deals Now',
          buttonLink: wizardData.countdown.buttonLink || '/shop?group=hot',
          bgColor: wizardData.countdown.bgColor || '#0f3c28',
          textColor: wizardData.countdown.textColor || '#ffffff',
        },
      }
    } else if (wizardBlockType === 'trust_bar') {
      content = {
        trust_bar: {
          heading: wizardData.trust_bar.heading || wizardData.title || 'Why Shop With Us',
          items: wizardData.trust_bar.items,
          bgColor: wizardData.trust_bar.bgColor || '#ffffff',
          textColor: wizardData.trust_bar.textColor || '#1e293b',
        },
      }
    }

    const createdSection = {
      id: newId,
      title: wizardData.title || (
        wizardBlockType === 'banner' ? 'Promotional Showcase'
        : wizardBlockType === 'image_text' ? 'Featured Story & Showcase'
        : wizardBlockType === 'countdown' ? 'Limited Time Flash Sale'
        : wizardBlockType === 'trust_bar' ? 'Why Shop With Us'
        : wizardBlockType === 'announcement' ? 'Special Announcement'
        : 'Special Collection'
      ),
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
              {/* Pinned Hero Preview */}
              <div className="rounded-3 overflow-hidden mb-3 border text-center p-2.5 bg-dark text-white">
                <span className="badge bg-secondary mb-1">Pinned Storefront Header</span>
                <div className="small fw-semibold">Hero Slider ({localHeroSlides.length} slides active)</div>
              </div>
              {/* Pinned Category Strip Preview */}
              <div className="rounded-3 overflow-hidden mb-3 border text-center p-2.5 bg-light text-dark">
                <span className="badge bg-secondary mb-1">Pinned Storefront Component</span>
                <div className="small fw-semibold">Shop By Categories &amp; Trust Bar (Support 24/7, Best Prices, Secure Payment)</div>
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
          {/* Global Pinned Storefront Header */}
          <div className="card border-0 bg-dark text-white rounded-3 p-3 mb-3 shadow-sm border-start border-4 border-info">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-window-dock text-info fs-5"></i>
                <div>
                  <div className="fw-bold text-white small">Global Site Header &amp; Navigation (Pinned Top)</div>
                  <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                    Header, White Logo, Top Notice Bar, Search Bar, Mega Menu, and Mobile Header are global non-movable components rendered across all pages.
                  </div>
                </div>
              </div>
              <span className="badge bg-info text-dark">Pinned Global Component</span>
            </div>
          </div>

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
                              {bType === 'hero' && '🎠 Hero Slider'}
                              {bType === 'categories' && '📁 Categories'}
                              {bType === 'trust_bar' && '🛡️ Trust Bar'}
                              {bType === 'products' && '🛒 Product Feed'}
                              {bType === 'banner' && '🖼️ Banner'}
                              {bType === 'announcement' && '📢 Announcement'}
                              {bType === 'image_text' && '🖼️📝 Image + Text'}
                              {bType === 'countdown' && '⏱️ Countdown Sale'}
                              {bType === 'reels' && '🎥 Watch & Shop'}
                              {bType === 'reviews' && '⭐ Customer Reviews'}
                              {bType === 'category_tabs' && '📑 Category Tabs'}
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
                                onClick={() => setEditingSection({ sec: JSON.parse(JSON.stringify(sec)), idx })}
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
                                onClick={() => setEditingSection({ sec: JSON.parse(JSON.stringify(sec)), idx })}
                              >
                                Edit Announcement Callout →
                              </button>
                            </div>
                          )}

                          {bType === 'image_text' && (
                            <div className="small text-muted">
                              <div><i className="bi bi-card-text me-1"></i>Story: <strong>{sec.content?.image_text?.heading || sec.title}</strong></div>
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-success text-decoration-none fw-semibold"
                                onClick={() => setEditingSection({ sec: JSON.parse(JSON.stringify(sec)), idx })}
                              >
                                Edit Image + Text Content →
                              </button>
                            </div>
                          )}

                          {bType === 'countdown' && (
                            <div className="small text-muted">
                              <div><i className="bi bi-clock me-1"></i>Sale: <strong>{sec.content?.countdown?.heading || sec.title}</strong></div>
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-success text-decoration-none fw-semibold"
                                onClick={() => setEditingSection({ sec: JSON.parse(JSON.stringify(sec)), idx })}
                              >
                                Edit Countdown Timer &amp; Deal →
                              </button>
                            </div>
                          )}

                          {bType === 'hero' && (
                            <div className="small text-muted">
                              <div><i className="bi bi-images me-1"></i>Hero Carousel: <strong>{localHeroSlides.length} active slides</strong></div>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm p-0 text-success text-decoration-none fw-semibold"
                                  onClick={() => setEditingSection({ sec: JSON.parse(JSON.stringify(sec)), idx })}
                                >
                                  Edit Slider Settings →
                                </button>
                                <span className="text-secondary">|</span>
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm p-0 text-primary text-decoration-none fw-semibold"
                                  onClick={() => setActiveTab('slides')}
                                >
                                  Manage Slides ({localHeroSlides.length})
                                </button>
                              </div>
                            </div>
                          )}

                          {bType === 'categories' && (
                            <div className="small text-muted">
                              <div><i className="bi bi-grid me-1"></i>Categories Carousel: <strong>{categories.length} total categories</strong></div>
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-success text-decoration-none fw-semibold"
                                onClick={() => setEditingSection({ sec: JSON.parse(JSON.stringify(sec)), idx })}
                              >
                                Edit Categories Heading &amp; Display →
                              </button>
                            </div>
                          )}

                          {bType === 'trust_bar' && (
                            <div className="small text-muted">
                              <div><i className="bi bi-shield-check me-1"></i>Benefits / Trust: <strong>{sec.content?.trust_bar?.items?.length || 3} items</strong></div>
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-success text-decoration-none fw-semibold"
                                onClick={() => setEditingSection({ sec: JSON.parse(JSON.stringify(sec)), idx })}
                              >
                                Edit Benefits / Trust Bar →
                              </button>
                            </div>
                          )}

                          {bType === 'reels' && (
                            <div className="small text-muted">
                              <div><i className="bi bi-camera-reels me-1"></i>Watch &amp; Shop: <strong>{sec.content?.reels?.maxItems || 8} video items</strong></div>
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-success text-decoration-none fw-semibold"
                                onClick={() => setEditingSection({ sec: JSON.parse(JSON.stringify(sec)), idx })}
                              >
                                Edit Watch &amp; Shop Settings →
                              </button>
                            </div>
                          )}

                          {bType === 'reviews' && (
                            <div className="small text-muted">
                              <div><i className="bi bi-chat-quote me-1"></i>Customer Testimonials: <strong>{sec.content?.reviews?.maxItems || 12} reviews</strong></div>
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-success text-decoration-none fw-semibold"
                                onClick={() => setEditingSection({ sec: JSON.parse(JSON.stringify(sec)), idx })}
                              >
                                Edit Testimonials Heading &amp; Count →
                              </button>
                            </div>
                          )}

                          {bType === 'category_tabs' && (
                            <div className="small text-muted">
                              <div><i className="bi bi-folder2-open me-1"></i>Category Tabs: <strong>{sec.content?.category_tabs?.tabs?.length || 3} tabs</strong></div>
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-success text-decoration-none fw-semibold"
                                onClick={() => setEditingSection({ sec: JSON.parse(JSON.stringify(sec)), idx })}
                              >
                                Edit Category Tabs &amp; Products →
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
                    <div className="row g-2 mb-4">
                      <div className="col-6 col-md-4">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 fw-semibold ${wizardBlockType === 'products' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setWizardBlockType('products')}
                        >
                          <i className="bi bi-bag-check me-1"></i> Product Feed
                        </button>
                      </div>
                      <div className="col-6 col-md-4">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 fw-semibold ${wizardBlockType === 'banner' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setWizardBlockType('banner')}
                        >
                          <i className="bi bi-image me-1"></i> Promo Banner
                        </button>
                      </div>
                      <div className="col-6 col-md-4">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 fw-semibold ${wizardBlockType === 'image_text' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setWizardBlockType('image_text')}
                        >
                          <i className="bi bi-card-text me-1"></i> Image + Text
                        </button>
                      </div>
                      <div className="col-6 col-md-4">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 fw-semibold ${wizardBlockType === 'countdown' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setWizardBlockType('countdown')}
                        >
                          <i className="bi bi-clock me-1"></i> Countdown Sale
                        </button>
                      </div>
                      <div className="col-6 col-md-4">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 fw-semibold ${wizardBlockType === 'trust_bar' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setWizardBlockType('trust_bar')}
                        >
                          <i className="bi bi-shield-check me-1"></i> Trust Bar
                        </button>
                      </div>
                      <div className="col-6 col-md-4">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 fw-semibold ${wizardBlockType === 'announcement' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setWizardBlockType('announcement')}
                        >
                          <i className="bi bi-megaphone me-1"></i> Announcement
                        </button>
                      </div>
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

                    {/* Form for Image + Text */}
                    {wizardBlockType === 'image_text' && (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Showcase Heading</label>
                          <input
                            type="text"
                            className="form-control"
                            value={wizardData.image_text.heading}
                            onChange={e => setWizardData({
                              ...wizardData,
                              image_text: { ...wizardData.image_text, heading: e.target.value },
                            })}
                            placeholder="e.g. Premium Smart Gadgets Engineered For Life"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Story / Feature Description</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            value={wizardData.image_text.text}
                            onChange={e => setWizardData({
                              ...wizardData,
                              image_text: { ...wizardData.image_text, text: e.target.value },
                            })}
                            placeholder="Discover innovative accessories tested and guaranteed..."
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Showcase Image URL</label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              value={wizardData.image_text.image}
                              onChange={e => setWizardData({
                                ...wizardData,
                                image_text: { ...wizardData.image_text, image: e.target.value },
                              })}
                              placeholder="https://... or upload .WebP"
                            />
                            <label className="btn btn-outline-secondary">
                              <i className="bi bi-upload me-1"></i> Upload Image
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleWizardImageTextUpload}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label fw-semibold small">Image Placement</label>
                            <select
                              className="form-select form-select-sm"
                              value={wizardData.image_text.imagePosition}
                              onChange={e => setWizardData({
                                ...wizardData,
                                image_text: { ...wizardData.image_text, imagePosition: e.target.value },
                              })}
                            >
                              <option value="left">Image on Left, Text on Right</option>
                              <option value="right">Image on Right, Text on Left</option>
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-semibold small">Button Text</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={wizardData.image_text.buttonText}
                              onChange={e => setWizardData({
                                ...wizardData,
                                image_text: { ...wizardData.image_text, buttonText: e.target.value },
                              })}
                              placeholder="Explore Catalog"
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-semibold small">Button Destination Link</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={wizardData.image_text.buttonLink}
                              onChange={e => setWizardData({
                                ...wizardData,
                                image_text: { ...wizardData.image_text, buttonLink: e.target.value },
                              })}
                              placeholder="/shop"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form for Countdown Promotion */}
                    {wizardBlockType === 'countdown' && (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Flash Sale Title / Headline</label>
                          <input
                            type="text"
                            className="form-control"
                            value={wizardData.countdown.heading}
                            onChange={e => setWizardData({
                              ...wizardData,
                              countdown: { ...wizardData.countdown, heading: e.target.value },
                            })}
                            placeholder="e.g. Ramadan Super Flash Sale – 50% OFF"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Sale Subtitle / Terms</label>
                          <input
                            type="text"
                            className="form-control"
                            value={wizardData.countdown.subheading}
                            onChange={e => setWizardData({
                              ...wizardData,
                              countdown: { ...wizardData.countdown, subheading: e.target.value },
                            })}
                            placeholder="Limited quantities available at special wholesale prices!"
                          />
                        </div>
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label fw-semibold small">Deal Expiration Date &amp; Time</label>
                            <input
                              type="datetime-local"
                              className="form-control form-control-sm"
                              value={wizardData.countdown.targetDate ? wizardData.countdown.targetDate.slice(0, 16) : ''}
                              onChange={e => setWizardData({
                                ...wizardData,
                                countdown: { ...wizardData.countdown, targetDate: new Date(e.target.value).toISOString() },
                              })}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-semibold small">Button Text</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={wizardData.countdown.buttonText}
                              onChange={e => setWizardData({
                                ...wizardData,
                                countdown: { ...wizardData.countdown, buttonText: e.target.value },
                              })}
                              placeholder="Shop Flash Deals"
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-semibold small">Button Destination Link</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={wizardData.countdown.buttonLink}
                              onChange={e => setWizardData({
                                ...wizardData,
                                countdown: { ...wizardData.countdown, buttonLink: e.target.value },
                              })}
                              placeholder="/shop?group=hot"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form for Benefits / Trust Bar */}
                    {wizardBlockType === 'trust_bar' && (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <h6 className="fw-bold mb-3">Configure 4 Benefit Cards:</h6>
                        <div className="row g-2">
                          {(wizardData.trust_bar.items || []).map((item, itemIdx) => (
                            <div className="col-12 col-md-6" key={itemIdx}>
                              <div className="p-2.5 bg-white border rounded-2">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                  <input
                                    type="text"
                                    className="form-control form-control-sm text-center"
                                    style={{ width: '45px' }}
                                    value={item.icon}
                                    onChange={e => {
                                      const newItems = [...wizardData.trust_bar.items]
                                      newItems[itemIdx] = { ...newItems[itemIdx], icon: e.target.value }
                                      setWizardData({
                                        ...wizardData,
                                        trust_bar: { ...wizardData.trust_bar, items: newItems },
                                      })
                                    }}
                                    title="Icon or Emoji"
                                  />
                                  <input
                                    type="text"
                                    className="form-control form-control-sm fw-bold"
                                    value={item.title}
                                    onChange={e => {
                                      const newItems = [...wizardData.trust_bar.items]
                                      newItems[itemIdx] = { ...newItems[itemIdx], title: e.target.value }
                                      setWizardData({
                                        ...wizardData,
                                        trust_bar: { ...wizardData.trust_bar, items: newItems },
                                      })
                                    }}
                                    placeholder={`Benefit #${itemIdx + 1} Title`}
                                  />
                                </div>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-muted"
                                  value={item.subtitle}
                                  onChange={e => {
                                    const newItems = [...wizardData.trust_bar.items]
                                    newItems[itemIdx] = { ...newItems[itemIdx], subtitle: e.target.value }
                                    setWizardData({
                                      ...wizardData,
                                      trust_bar: { ...wizardData.trust_bar, items: newItems },
                                    })
                                  }}
                                  placeholder="Subtitle (e.g. Free on orders above Rs. 3,000)"
                                />
                              </div>
                            </div>
                          ))}
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

      {/* ════════════════════════════════════════════════════════════
          EDIT EXISTING SECTION DRAWER / MODAL
         ════════════════════════════════════════════════════════════ */}
      {editingSection && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-bottom py-3 px-4">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    <i className="bi bi-pencil-square text-success me-2"></i>
                    Configure Section #{editingSection.idx + 1}: {editingSection.sec.title}
                  </h5>
                  <small className="text-muted">
                    Block Type: <strong className="text-capitalize">{editingSection.sec.blockType || 'products'}</strong> | Layout: <strong>{editingSection.sec.containerLayout || 'single'}</strong>
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingSection(null)}
                />
              </div>

              <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* 1. General Settings */}
                <div className="mb-4 pb-3 border-bottom">
                  <h6 className="fw-bold text-dark mb-3">General Settings:</h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Section Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingSection.sec.title || ''}
                        onChange={e => setEditingSection({
                          ...editingSection,
                          sec: { ...editingSection.sec, title: e.target.value }
                        })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Container Layout</label>
                      <select
                        className="form-select"
                        value={editingSection.sec.containerLayout || 'single'}
                        onChange={e => setEditingSection({
                          ...editingSection,
                          sec: { ...editingSection.sec, containerLayout: e.target.value }
                        })}
                      >
                        <option value="single">Single Column (100% Full Width)</option>
                        <option value="two_equal">Two Columns (50 / 50 Equal Split)</option>
                        <option value="two_70_30">Split Columns (70 / 30)</option>
                        <option value="two_30_70">Split Columns (30 / 70)</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Subtitle / Tagline (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingSection.sec.subtitle || ''}
                        onChange={e => setEditingSection({
                          ...editingSection,
                          sec: { ...editingSection.sec, subtitle: e.target.value }
                        })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Theme Accent Color</label>
                      <input
                        type="color"
                        className="form-control form-control-color w-100"
                        value={editingSection.sec.color || '#00998f'}
                        onChange={e => setEditingSection({
                          ...editingSection,
                          sec: { ...editingSection.sec, color: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Block Specific Content */}
                <div>
                  <h6 className="fw-bold text-dark mb-3">Content Configuration:</h6>

                  {/* BANNER */}
                  {editingSection.sec.blockType === 'banner' && (
                    <div className="bg-light p-3.5 rounded-3 border">
                      <h6 className="fw-bold mb-2">Column 1 Banner:</h6>
                      <div className="mb-2">
                        <label className="form-label small fw-semibold">Banner 1 Image URL</label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            value={editingSection.sec.content?.banners?.[0]?.image || ''}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.banners) nextSec.content.banners = []
                              if (!nextSec.content.banners[0]) nextSec.content.banners[0] = {}
                              nextSec.content.banners[0].image = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                          />
                          <label className="btn btn-outline-secondary">
                            <i className="bi bi-upload me-1"></i> Upload
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={e => handleEditSectionImageUpload('banner1', e)}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="row g-2 mb-3">
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editingSection.sec.content?.banners?.[0]?.link || '/shop'}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.banners) nextSec.content.banners = []
                              if (!nextSec.content.banners[0]) nextSec.content.banners[0] = {}
                              nextSec.content.banners[0].link = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                            placeholder="Destination Link"
                          />
                        </div>
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editingSection.sec.content?.banners?.[0]?.badge || ''}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.banners) nextSec.content.banners = []
                              if (!nextSec.content.banners[0]) nextSec.content.banners[0] = {}
                              nextSec.content.banners[0].badge = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                            placeholder="Floating Badge (e.g. HOT DEAL)"
                          />
                        </div>
                      </div>

                      {editingSection.sec.containerLayout !== 'single' && (
                        <div className="pt-3 border-top">
                          <h6 className="fw-bold mb-2">Column 2 Banner:</h6>
                          <div className="mb-2">
                            <label className="form-label small fw-semibold">Banner 2 Image URL</label>
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                value={editingSection.sec.content?.banners?.[1]?.image || ''}
                                onChange={e => {
                                  const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                                  if (!nextSec.content) nextSec.content = {}
                                  if (!nextSec.content.banners) nextSec.content.banners = []
                                  if (!nextSec.content.banners[1]) nextSec.content.banners[1] = {}
                                  nextSec.content.banners[1].image = e.target.value
                                  setEditingSection({ ...editingSection, sec: nextSec })
                                }}
                              />
                              <label className="btn btn-outline-secondary">
                                <i className="bi bi-upload me-1"></i> Upload
                                <input
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  onChange={e => handleEditSectionImageUpload('banner2', e)}
                                />
                              </label>
                            </div>
                          </div>
                          <div className="row g-2">
                            <div className="col-md-6">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editingSection.sec.content?.banners?.[1]?.link || '/shop'}
                                onChange={e => {
                                  const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                                  if (!nextSec.content) nextSec.content = {}
                                  if (!nextSec.content.banners) nextSec.content.banners = []
                                  if (!nextSec.content.banners[1]) nextSec.content.banners[1] = {}
                                  nextSec.content.banners[1].link = e.target.value
                                  setEditingSection({ ...editingSection, sec: nextSec })
                                }}
                                placeholder="Destination Link"
                              />
                            </div>
                            <div className="col-md-6">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editingSection.sec.content?.banners?.[1]?.badge || ''}
                                onChange={e => {
                                  const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                                  if (!nextSec.content) nextSec.content = {}
                                  if (!nextSec.content.banners) nextSec.content.banners = []
                                  if (!nextSec.content.banners[1]) nextSec.content.banners[1] = {}
                                  nextSec.content.banners[1].badge = e.target.value
                                  setEditingSection({ ...editingSection, sec: nextSec })
                                }}
                                placeholder="Floating Badge (e.g. NEW)"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* IMAGE + TEXT */}
                  {editingSection.sec.blockType === 'image_text' && (
                    <div className="bg-light p-3.5 rounded-3 border">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Showcase Heading</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingSection.sec.content?.image_text?.heading || editingSection.sec.title || ''}
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.image_text) nextSec.content.image_text = {}
                            nextSec.content.image_text.heading = e.target.value
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Description Text</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={editingSection.sec.content?.image_text?.text || editingSection.sec.subtitle || ''}
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.image_text) nextSec.content.image_text = {}
                            nextSec.content.image_text.text = e.target.value
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Showcase Image URL</label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            value={editingSection.sec.content?.image_text?.image || ''}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.image_text) nextSec.content.image_text = {}
                              nextSec.content.image_text.image = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                          />
                          <label className="btn btn-outline-secondary">
                            <i className="bi bi-upload me-1"></i> Upload
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={e => handleEditSectionImageUpload('image_text', e)}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Image Position</label>
                          <select
                            className="form-select form-select-sm"
                            value={editingSection.sec.content?.image_text?.imagePosition || 'left'}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.image_text) nextSec.content.image_text = {}
                              nextSec.content.image_text.imagePosition = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                          >
                            <option value="left">Image on Left</option>
                            <option value="right">Image on Right</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Button Text</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editingSection.sec.content?.image_text?.buttonText || 'Explore Catalog'}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.image_text) nextSec.content.image_text = {}
                              nextSec.content.image_text.buttonText = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Button Link</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editingSection.sec.content?.image_text?.buttonLink || '/shop'}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.image_text) nextSec.content.image_text = {}
                              nextSec.content.image_text.buttonLink = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COUNTDOWN */}
                  {editingSection.sec.blockType === 'countdown' && (
                    <div className="bg-light p-3.5 rounded-3 border">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Flash Sale Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingSection.sec.content?.countdown?.heading || editingSection.sec.title || ''}
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.countdown) nextSec.content.countdown = {}
                            nextSec.content.countdown.heading = e.target.value
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Sale Subheading</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingSection.sec.content?.countdown?.subheading || editingSection.sec.subtitle || ''}
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.countdown) nextSec.content.countdown = {}
                            nextSec.content.countdown.subheading = e.target.value
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Target Expiration Date</label>
                          <input
                            type="datetime-local"
                            className="form-control form-control-sm"
                            value={editingSection.sec.content?.countdown?.targetDate ? editingSection.sec.content.countdown.targetDate.slice(0, 16) : ''}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.countdown) nextSec.content.countdown = {}
                              nextSec.content.countdown.targetDate = new Date(e.target.value).toISOString()
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Button Text</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editingSection.sec.content?.countdown?.buttonText || 'Shop Flash Deals'}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.countdown) nextSec.content.countdown = {}
                              nextSec.content.countdown.buttonText = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Button Link</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editingSection.sec.content?.countdown?.buttonLink || '/shop?group=hot'}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.countdown) nextSec.content.countdown = {}
                              nextSec.content.countdown.buttonLink = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TRUST BAR */}
                  {editingSection.sec.blockType === 'trust_bar' && (
                    <div className="bg-light p-3.5 rounded-3 border">
                      <h6 className="fw-bold mb-3">Edit 4 Benefit Cards:</h6>
                      <div className="row g-2">
                        {((editingSection.sec.content?.trust_bar?.items) || [
                          { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders over Rs. 3,000' },
                          { icon: '💬', title: '24/7 WhatsApp Help', subtitle: 'Live chat support anytime' },
                          { icon: '🛡️', title: '100% Genuine Items', subtitle: 'Tested & verified products' },
                          { icon: '💵', title: 'Cash on Delivery', subtitle: 'Pay when your parcel arrives' },
                        ]).map((item, itemIdx) => (
                          <div className="col-12 col-md-6" key={itemIdx}>
                            <div className="p-2.5 bg-white border rounded-2">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-center"
                                  style={{ width: '45px' }}
                                  value={item.icon}
                                  onChange={e => {
                                    const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                                    if (!nextSec.content) nextSec.content = {}
                                    if (!nextSec.content.trust_bar) nextSec.content.trust_bar = {}
                                    if (!nextSec.content.trust_bar.items) nextSec.content.trust_bar.items = []
                                    nextSec.content.trust_bar.items[itemIdx] = { ...item, icon: e.target.value }
                                    setEditingSection({ ...editingSection, sec: nextSec })
                                  }}
                                />
                                <input
                                  type="text"
                                  className="form-control form-control-sm fw-bold"
                                  value={item.title}
                                  onChange={e => {
                                    const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                                    if (!nextSec.content) nextSec.content = {}
                                    if (!nextSec.content.trust_bar) nextSec.content.trust_bar = {}
                                    if (!nextSec.content.trust_bar.items) nextSec.content.trust_bar.items = []
                                    nextSec.content.trust_bar.items[itemIdx] = { ...item, title: e.target.value }
                                    setEditingSection({ ...editingSection, sec: nextSec })
                                  }}
                                />
                              </div>
                              <input
                                type="text"
                                className="form-control form-control-sm text-muted"
                                value={item.subtitle}
                                onChange={e => {
                                  const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                                  if (!nextSec.content) nextSec.content = {}
                                  if (!nextSec.content.trust_bar) nextSec.content.trust_bar = {}
                                  if (!nextSec.content.trust_bar.items) nextSec.content.trust_bar.items = []
                                  nextSec.content.trust_bar.items[itemIdx] = { ...item, subtitle: e.target.value }
                                  setEditingSection({ ...editingSection, sec: nextSec })
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ANNOUNCEMENT */}
                  {editingSection.sec.blockType === 'announcement' && (
                    <div className="bg-light p-3.5 rounded-3 border">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Main Heading</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingSection.sec.content?.announcement?.heading || editingSection.sec.title || ''}
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.announcement) nextSec.content.announcement = {}
                            nextSec.content.announcement.heading = e.target.value
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Subtitle / Message</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={editingSection.sec.content?.announcement?.subheading || editingSection.sec.subtitle || ''}
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.announcement) nextSec.content.announcement = {}
                            nextSec.content.announcement.subheading = e.target.value
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">Button Text</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editingSection.sec.content?.announcement?.buttonText || 'Shop Now'}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.announcement) nextSec.content.announcement = {}
                              nextSec.content.announcement.buttonText = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">Button Link</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editingSection.sec.content?.announcement?.buttonLink || '/shop'}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.announcement) nextSec.content.announcement = {}
                              nextSec.content.announcement.buttonLink = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HERO SLIDER */}
                  {editingSection.sec.blockType === 'hero' && (
                    <div className="bg-light p-3.5 rounded-3 border">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-dark mb-0">Hero Banner Slider Controls</h6>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm rounded-pill px-3"
                          onClick={() => {
                            setShowAddSlideModal(false)
                            setEditingSection(null)
                            setActiveTab('slides')
                          }}
                        >
                          <i className="bi bi-images me-1"></i> Manage Hero Slides Carousel ({localHeroSlides.length}) →
                        </button>
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">Auto-slide Transition Time (ms)</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editingSection.sec.content?.hero?.duration || 5200}
                            step="500"
                            min="2000"
                            max="15000"
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.hero) nextSec.content.hero = {}
                              nextSec.content.hero.duration = Number(e.target.value) || 5200
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                          />
                        </div>
                        <div className="col-md-6 d-flex align-items-center pt-3">
                          <div className="form-check form-switch fs-6">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={editingSection.sec.content?.hero?.autoplay !== false}
                              onChange={e => {
                                const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                                if (!nextSec.content) nextSec.content = {}
                                if (!nextSec.content.hero) nextSec.content.hero = {}
                                nextSec.content.hero.autoplay = e.target.checked
                                setEditingSection({ ...editingSection, sec: nextSec })
                              }}
                            />
                            <label className="form-check-label fw-semibold small ms-1">Enable Automatic Sliding</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CATEGORIES */}
                  {editingSection.sec.blockType === 'categories' && (
                    <div className="bg-light p-3.5 rounded-3 border">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Section Heading</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingSection.sec.content?.categories?.heading || editingSection.sec.title || 'Shop By Categories'}
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.categories) nextSec.content.categories = {}
                            nextSec.content.categories.heading = e.target.value
                            nextSec.title = e.target.value
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="alert alert-info py-2 px-3 small mb-0">
                        <i className="bi bi-info-circle me-1"></i> Renders all active categories ({categories.length} loaded) in an infinite smooth continuous right-to-left marquee carousel with verified image containment.
                      </div>
                    </div>
                  )}

                  {/* REELS / WATCH & SHOP */}
                  {editingSection.sec.blockType === 'reels' && (
                    <div className="bg-light p-3.5 rounded-3 border">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Section Heading</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingSection.sec.content?.reels?.heading || editingSection.sec.title || 'Watch & Shop'}
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.reels) nextSec.content.reels = {}
                            nextSec.content.reels.heading = e.target.value
                            nextSec.title = e.target.value
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Subtitle / Callout</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingSection.sec.content?.reels?.subtitle || 'In motion'}
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.reels) nextSec.content.reels = {}
                            nextSec.content.reels.subtitle = e.target.value
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="alert alert-secondary py-2 px-3 small mb-0">
                        <i className="bi bi-camera-reels me-1"></i> Video reels with audio toggle and direct cart buttons are synchronized from the Watch &amp; Shop module.
                      </div>
                    </div>
                  )}

                  {/* REVIEWS */}
                  {editingSection.sec.blockType === 'reviews' && (
                    <div className="bg-light p-3.5 rounded-3 border">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Section Heading</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingSection.sec.content?.reviews?.heading || editingSection.sec.title || 'What Our Clients Say'}
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.reviews) nextSec.content.reviews = {}
                            nextSec.content.reviews.heading = e.target.value
                            nextSec.title = e.target.value
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Subheading / Description</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={editingSection.sec.content?.reviews?.subtitle || 'Trusted by thousands of resellers and shopkeepers across Pakistan.'}
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.reviews) nextSec.content.reviews = {}
                            nextSec.content.reviews.subtitle = e.target.value
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="alert alert-secondary py-2 px-3 small mb-0">
                        <i className="bi bi-star-fill text-warning me-1"></i> Displays approved customer feedback and 5-star ratings in an auto-scrolling marquee slider.
                      </div>
                    </div>
                  )}

                  {/* CATEGORY TABS */}
                  {editingSection.sec.blockType === 'category_tabs' && (
                    <div className="bg-light p-3.5 rounded-3 border">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Section Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingSection.sec.content?.category_tabs?.heading || editingSection.sec.title || 'Category Tabs'}
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.category_tabs) nextSec.content.category_tabs = {}
                            nextSec.content.category_tabs.heading = e.target.value
                            nextSec.title = e.target.value
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Max Products Per Tab</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={editingSection.sec.content?.category_tabs?.maxProducts || 8}
                          min="4"
                          max="24"
                          onChange={e => {
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (!nextSec.content) nextSec.content = {}
                            if (!nextSec.content.category_tabs) nextSec.content.category_tabs = {}
                            nextSec.content.category_tabs.maxProducts = Number(e.target.value) || 8
                            setEditingSection({ ...editingSection, sec: nextSec })
                          }}
                        />
                      </div>
                      <div className="alert alert-success py-2 px-3 small mb-0">
                        <i className="bi bi-folder2-open me-1"></i> Renders tabbed navigation pills (Storage &amp; Organization, Jewelry &amp; Accessories, Fashion Bags) with interactive live product filtering and instant switching.
                      </div>
                    </div>
                  )}

                  {/* PRODUCTS */}
                  {editingSection.sec.blockType === 'products' && (
                    <div className="bg-light p-3.5 rounded-3 border">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Target Feed</label>
                        <select
                          className="form-select form-select-sm"
                          value={editingSection.sec.category ? `category:${editingSection.sec.category}` : (editingSection.sec.group || 'new')}
                          onChange={e => {
                            const val = e.target.value
                            const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                            if (val.startsWith('category:')) {
                              nextSec.category = val.replace('category:', '')
                              nextSec.group = null
                            } else {
                              nextSec.group = val
                              nextSec.category = null
                            }
                            setEditingSection({ ...editingSection, sec: nextSec })
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
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer bg-light border-top py-3 px-4 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary px-3"
                  onClick={() => setEditingSection(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success px-4 fw-semibold shadow"
                  onClick={handleSaveEditingSection}
                >
                  <i className="bi bi-check2-circle me-1"></i> Save Section Changes
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
