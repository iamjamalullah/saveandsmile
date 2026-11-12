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

export function createDefaultContentForBlockType(blockType, existingSec = {}) {
  const title = existingSec.title || 'Section'
  const subtitle = existingSec.subtitle || ''
  const color = existingSec.color || '#00998f'

  switch (blockType) {
    case 'products':
      return {
        group: existingSec.group || 'new',
        category: existingSec.category || null,
        color,
        bg: existingSec.bg || '',
        viewAll: false,
        seeMore: false,
      }
    case 'banner':
      return {
        banners: (existingSec.content?.banners && existingSec.content.banners.length > 0)
          ? existingSec.content.banners
          : [
            {
              image: existingSec.image || 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp',
              link: '/shop',
              title,
              badge: 'Exclusive',
              ctaText: 'Shop Now',
            }
          ]
      }
    case 'reels':
      return {
        reels: {
          heading: title || 'Watch & Shop',
          subtitle: subtitle || 'In motion',
          maxVideos: 8,
          items: existingSec.content?.reels?.items || [],
        }
      }
    case 'reviews':
      return {
        reviews: {
          heading: title || 'What Our Clients Say',
          subtitle: subtitle || 'Trusted by thousands of resellers and shopkeepers across Pakistan.',
          maxReviews: 12,
          selectedReviewIds: existingSec.content?.reviews?.selectedReviewIds || [],
        }
      }
    case 'category_tabs':
      return {
        category_tabs: {
          heading: title || 'Category Tabs + Product Grid',
          defaultActive: 'storage',
          maxProducts: 8,
          tabs: [
            { key: 'storage', label: ['Storage &', 'Organization'], group: 'home' },
            { key: 'jewelry', label: ['Jewelry &', 'Accessories'], group: 'jewelry' },
            { key: 'bags', label: ['Fashion Bags &', 'Travel'], group: 'like' },
          ],
        }
      }
    case 'image_text':
      return {
        image_text: {
          image: existingSec.content?.image_text?.image || 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp',
          heading: title || 'Premium Quality Gadgets',
          text: subtitle || 'Discover innovative lifestyle accessories and smart gadgets engineered for performance and durability.',
          buttonText: 'Explore Catalog',
          buttonLink: '/shop',
          imagePosition: 'left',
          bgColor: '#ffffff',
          textColor: '#1e293b',
        }
      }
    case 'countdown':
      return {
        countdown: {
          heading: title || 'Limited Time Flash Sale',
          subheading: subtitle || 'Special wholesale rates available until timer expires!',
          targetDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          buttonText: 'Shop Deals Now',
          buttonLink: '/shop?group=hot',
          bgColor: '#0f3c28',
          textColor: '#ffffff',
        }
      }
    case 'trust_bar':
      return {
        trust_bar: {
          heading: title || 'Why Shop With Us',
          items: [
            { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders over Rs. 3,000' },
            { icon: '💬', title: '24/7 WhatsApp Help', subtitle: 'Live chat support anytime' },
            { icon: '🛡️', title: '100% Genuine Items', subtitle: 'Tested & verified products' },
            { icon: '💵', title: 'Cash on Delivery', subtitle: 'Pay when your parcel arrives' },
          ],
          bgColor: '#f8fafc',
          textColor: '#1e293b',
        }
      }
    case 'announcement':
      return {
        announcement: {
          heading: title || 'Special Announcement',
          subheading: subtitle || 'Wholesale rates nationwide!',
          buttonText: 'Shop Now',
          buttonLink: '/shop',
          bgColor: color || '#049977',
          textColor: '#ffffff',
          align: 'center',
        }
      }
    case 'categories':
      return {
        categories: {
          heading: title || 'Shop By Categories',
          showAll: true,
          categorySlugs: [],
        }
      }
    case 'hero':
      return {
        hero: {
          autoplay: true,
          duration: 5200,
          showArrows: true,
          showDots: true,
        }
      }
    default:
      return {}
  }
}

export function convertSectionBlockType(sec, newBlockType) {
  const newContent = createDefaultContentForBlockType(newBlockType, sec)
  return {
    ...sec,
    blockType: newBlockType,
    content: {
      ...(sec.content || {}),
      ...newContent,
    }
  }
}

export default function HomePageEditorView() {
  const {
    heroSlides = [],
    sections = [],
    categories = [],
    products = [],
    reviews = [],
    watchShop = [],
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
  const localSectionsRef = useRef(localSections)
  localSectionsRef.current = localSections
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

  // Helper for YouTube Video ID extraction
  const extractYouTubeId = (url) => {
    if (!url || typeof url !== 'string') return null
    const match = url.trim().match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i)
    return match ? match[1] : null
  }

  // YouTube Video Manager state inside section editor
  const [ytVideoForm, setYtVideoForm] = useState({
    title: '',
    youtubeUrl: '',
    videoId: '',
    image: '',
    productId: '',
    order: 1,
    active: true,
    description: '',
  })
  const [editingYtIdx, setEditingYtIdx] = useState(null)
  const [ytUploadLoading, setYtUploadLoading] = useState(false)

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
            localSectionsRef.current = sorted
            setLocalSections(sorted)
            return
          }
        } catch (_) {}
      }
      if (sections && sections.length && (!localSectionsRef.current || localSectionsRef.current.length === 0)) {
        const sorted = [...sections].sort((a, b) => (Number(a.order) || Number(a.id) || 0) - (Number(b.order) || Number(b.id) || 0))
        localSectionsRef.current = sorted
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
      if (showToast) showToast('Hero slide deleted successfully.', 'success')
    } catch (err) {
      console.error('Delete slide error:', err)
      if (showToast) showToast('Failed to delete slide: ' + err.message, 'danger')
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
      if (showToast) showToast('Hero slides order saved successfully!', 'success')
    } catch (err) {
      console.error('Save hero slides error:', err)
      if (showToast) showToast('Failed to save slides order: ' + err.message, 'danger')
    } finally {
      setSavingHeroSlides(false)
    }
  }

  // ── Sections Management Handlers ───────────────────────────
  const handleMoveSection = async (index, direction) => {
    const currentSections = localSectionsRef.current
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= currentSections.length) return

    const updated = [...currentSections]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    const renumbered = updated.map((s, idx) => ({ ...s, order: idx + 1 }))
    localSectionsRef.current = renumbered
    setLocalSections(renumbered)
    setHasUnpublishedChanges(true)
    try {
      if (saveDraftSections) await saveDraftSections(renumbered)
      if (showToast) showToast(`Section moved ${direction < 0 ? 'up' : 'down'} and draft saved.`, 'info')
    } catch (err) {
      console.error('Move section save error:', err)
      if (showToast) showToast('Failed to save section position: ' + err.message, 'danger')
    }
  }

  const handleDuplicateSection = async (index) => {
    const currentSections = localSectionsRef.current
    const source = currentSections[index]
    if (!source) return

    const copy = {
      ...JSON.parse(JSON.stringify(source)),
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `${source.title} (Copy)`,
      order: index + 2,
    }

    const updated = [...currentSections]
    updated.splice(index + 1, 0, copy)

    const renumbered = updated.map((s, idx) => ({ ...s, order: idx + 1 }))
    localSectionsRef.current = renumbered
    setLocalSections(renumbered)
    setHasUnpublishedChanges(true)
    try {
      if (saveDraftSections) await saveDraftSections(renumbered)
      if (showToast) showToast('Section duplicated and saved to draft! Click "Publish Changes" to go live.', 'success')
    } catch (err) {
      console.error('Duplicate section save error:', err)
      if (showToast) showToast('Failed to save duplicated section: ' + err.message, 'danger')
    }
  }

  const handleToggleSectionEnabled = async (index) => {
    const currentSections = localSectionsRef.current
    if (!currentSections[index]) return
    const updated = [...currentSections]
    const current = updated[index].enabled !== false && updated[index].isVisible !== false && updated[index].is_visible !== false
    const nextState = !current
    updated[index] = {
      ...updated[index],
      enabled: nextState,
      isVisible: nextState,
      is_visible: nextState,
    }
    localSectionsRef.current = updated
    setLocalSections(updated)
    setHasUnpublishedChanges(true)
    try {
      if (saveDraftSections) await saveDraftSections(updated)
      if (showToast) showToast(`Section ${nextState ? 'enabled' : 'hidden'} in draft. Publish to apply live.`, 'info')
    } catch (err) {
      console.error('Toggle visibility save error:', err)
      if (showToast) showToast('Failed to save visibility: ' + err.message, 'danger')
    }
  }

  const handleConvertBlockType = async (index, targetType) => {
    const currentSections = localSectionsRef.current
    const current = currentSections[index]
    if (!current || current.blockType === targetType) return

    const converted = convertSectionBlockType(current, targetType)
    const updated = [...currentSections]
    updated[index] = converted
    localSectionsRef.current = updated
    setLocalSections(updated)
    setHasUnpublishedChanges(true)
    try {
      if (saveDraftSections) await saveDraftSections(updated)
      if (showToast) showToast(`Section converted to ${targetType} and draft saved!`, 'success')
    } catch (err) {
      console.error('Convert section save error:', err)
      if (showToast) showToast('Failed to save converted section: ' + err.message, 'danger')
    }
  }

  const handleConfirmDeleteSection = async () => {
    if (!sectionToDelete) return
    const deletedTitle = sectionToDelete.title || 'Section'
    const currentSections = localSectionsRef.current
    const updated = currentSections.filter(s => s.id !== sectionToDelete.id)
    const renumbered = updated.map((s, idx) => ({ ...s, order: idx + 1 }))
    localSectionsRef.current = renumbered
    setLocalSections(renumbered)
    setSectionToDelete(null)
    setHasUnpublishedChanges(true)

    try {
      if (saveDraftSections) {
        await saveDraftSections(renumbered)
      }
      if (showToast) showToast(`"${deletedTitle}" removed from draft layout. Click "Publish Changes" to apply live.`, 'info')
    } catch (err) {
      console.error('Delete section draft save error:', err)
      if (showToast) showToast(`"${deletedTitle}" removed locally. Click "Save Draft" to persist.`, 'warning')
    }
  }

  // ── Draft & Publishing Handlers ────────────────────────────
  const handleSaveDraft = async () => {
    setSavingDraft(true)
    try {
      if (saveDraftSections) {
        await saveDraftSections(localSectionsRef.current)
      } else {
        localStorage.setItem('qg_draft_sections', JSON.stringify(localSectionsRef.current))
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
        await publishHomepageSections(localSectionsRef.current, `Live deployment ${new Date().toLocaleDateString('en-GB')}`)
      } else {
        await saveSectionsLayout(localSectionsRef.current)
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
          } else if (targetPath === 'banner1_mobile') {
            if (!nextSec.content.banners) nextSec.content.banners = []
            if (!nextSec.content.banners[0]) nextSec.content.banners[0] = {}
            nextSec.content.banners[0].mobileImage = urls[0]
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

  const handleUploadYtThumbnail = async (e) => {
    const files = e.target.files
    if (!files || !files.length) return
    setYtUploadLoading(true)
    try {
      const webp = await convertFileToWebp(files[0], 1280, 0.85)
      const urls = await uploadWebpImages([webp])
      if (urls && urls[0]) {
        setYtVideoForm(prev => ({ ...prev, image: urls[0] }))
      }
    } catch (err) {
      alert('Thumbnail upload failed: ' + err.message)
    } finally {
      setYtUploadLoading(false)
    }
  }

  const handleSaveEditingSection = async () => {
    if (!editingSection) return
    const currentSec = JSON.parse(JSON.stringify(editingSection.sec))
    if (currentSec.blockType === 'reviews') {
      const headingInput = document.querySelector('.modal input[data-review-heading="true"]') || Array.from(document.querySelectorAll('.modal input[type="text"]')).find(i => i.labels?.[0]?.innerText?.includes('Section Heading') || i.parentElement?.querySelector('label')?.innerText?.includes('Section Heading'))
      if (headingInput && headingInput.value.trim()) {
        if (!currentSec.content) currentSec.content = {}
        if (!currentSec.content.reviews) currentSec.content.reviews = {}
        currentSec.content.reviews.heading = headingInput.value.trim()
        currentSec.title = headingInput.value.trim()
      }
    }
    const currentSections = localSectionsRef.current
    const updated = [...currentSections]
    updated[editingSection.idx] = currentSec
    localSectionsRef.current = updated
    setLocalSections(updated)
    setHasUnpublishedChanges(true)
    setEditingSection(null)
    try {
      if (saveDraftSections) {
        await saveDraftSections(updated)
      }
      if (showToast) showToast('Section updated and draft saved! Click "Publish Changes" to apply live.', 'success')
    } catch (err) {
      console.error('Save draft error after edit:', err)
      if (showToast) showToast('Failed to save draft after editing: ' + err.message, 'danger')
    }
  }

  const handleFinishWizard = async () => {
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
    } else {
      content = createDefaultContentForBlockType(wizardBlockType, {
        title: wizardData.title,
        subtitle: wizardData.subtitle,
        color: wizardData.color,
      })
    }

    const createdSection = {
      id: newId,
      title: wizardData.title || (
        wizardBlockType === 'banner' ? (wizardData.banner1?.title || 'Promotional Showcase')
        : wizardBlockType === 'image_text' ? (wizardData.image_text?.heading || 'Featured Story & Showcase')
        : wizardBlockType === 'countdown' ? (wizardData.countdown?.heading || 'Limited Time Flash Sale')
        : wizardBlockType === 'trust_bar' ? (wizardData.trust_bar?.heading || 'Why Shop With Us')
        : wizardBlockType === 'announcement' ? (wizardData.announcement?.heading || 'Special Announcement')
        : wizardBlockType === 'reels' ? 'Watch & Shop'
        : wizardBlockType === 'reviews' ? 'What Our Clients Say'
        : wizardBlockType === 'category_tabs' ? 'Category Tabs + Product Grid'
        : wizardBlockType === 'categories' ? 'Shop By Categories'
        : wizardBlockType === 'hero' ? 'Hero Slider'
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

    const currentSections = localSectionsRef.current
    const updated = [...currentSections]
    if (insertTargetIndex !== null && insertTargetIndex >= 0) {
      updated.splice(insertTargetIndex, 0, createdSection)
    } else {
      updated.push(createdSection)
    }

    const renumbered = updated.map((s, idx) => ({ ...s, order: idx + 1 }))
    localSectionsRef.current = renumbered
    setLocalSections(renumbered)
    setHasUnpublishedChanges(true)
    setShowWizardModal(false)
    try {
      if (saveDraftSections) await saveDraftSections(renumbered)
      if (showToast) showToast('New section added to layout and draft saved! Publish Changes to go live.', 'success')
    } catch (err) {
      console.error('Wizard draft save error:', err)
      if (showToast) showToast('Failed to save new section: ' + err.message, 'danger')
    }
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
                              const updated = [...localSectionsRef.current]
                              updated[idx] = { ...updated[idx], title: e.target.value }
                              localSectionsRef.current = updated
                              setLocalSections(updated)
                              setHasUnpublishedChanges(true)
                            }}
                            onBlur={async (e) => {
                              const trimmed = e.target.value.trim()
                              const updated = [...localSectionsRef.current]
                              updated[idx] = { ...updated[idx], title: trimmed }
                              localSectionsRef.current = updated
                              setLocalSections(updated)
                              try {
                                if (saveDraftSections) await saveDraftSections(updated)
                              } catch (err) {
                                if (showToast) showToast('Failed to auto-save title: ' + err.message, 'danger')
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur()
                            }}
                            placeholder="Section Title"
                          />
                          <div className="mt-1 d-flex align-items-center gap-1">
                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>Type:</span>
                            <select
                              className="form-select form-select-sm py-0 px-1 border-light-subtle text-muted"
                              style={{ fontSize: '0.75rem', height: '24px' }}
                              value={bType}
                              onChange={(e) => handleConvertBlockType(idx, e.target.value)}
                              title="Replace or convert this section to another block type"
                            >
                              <option value="products">🛒 Products Feed</option>
                              <option value="banner">🖼️ Promo Banner</option>
                              <option value="reels">🎥 Watch &amp; Shop</option>
                              <option value="reviews">⭐ Customer Reviews</option>
                              <option value="category_tabs">📑 Category Tabs</option>
                              <option value="image_text">🖼️📝 Image + Text</option>
                              <option value="countdown">⏱️ Countdown Sale</option>
                              <option value="trust_bar">🛡️ Trust Bar</option>
                              <option value="announcement">📢 Announcement</option>
                              <option value="categories">📁 Categories</option>
                              <option value="hero">🎠 Hero Slider</option>
                            </select>
                          </div>
                        </div>

                        {/* 3. Block Target / Configuration */}
                        <div className="col-12 col-md-4">
                          {bType === 'products' && (
                            <div>
                              <select
                                className="form-select form-select-sm mb-1"
                                value={currentValue}
                                onChange={async (e) => {
                                  const val = e.target.value
                                  const updated = [...localSectionsRef.current]
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
                                  localSectionsRef.current = updated
                                  setLocalSections(updated)
                                  setHasUnpublishedChanges(true)
                                  try {
                                    if (saveDraftSections) await saveDraftSections(updated)
                                  } catch (err) {
                                    if (showToast) showToast('Failed to auto-save product target: ' + err.message, 'danger')
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
                              <div className="small text-muted d-flex align-items-center gap-2">
                                <span><i className="bi bi-box-seam me-1"></i>{matchingCount} products</span>
                                <span>•</span>
                                <input
                                  type="color"
                                  className="form-control form-control-color form-control-sm p-0 border-0"
                                  value={sec.color || '#00998f'}
                                  onChange={async (e) => {
                                    const newColor = e.target.value
                                    const updated = [...localSectionsRef.current]
                                    updated[idx] = { ...updated[idx], color: newColor }
                                    localSectionsRef.current = updated
                                    setLocalSections(updated)
                                    setHasUnpublishedChanges(true)
                                    try {
                                      if (saveDraftSections) await saveDraftSections(updated)
                                    } catch (err) {
                                      if (showToast) showToast('Failed to auto-save color: ' + err.message, 'danger')
                                    }
                                  }}
                                  onBlur={async (e) => {
                                    const newColor = e.target.value
                                    const updated = [...localSectionsRef.current]
                                    updated[idx] = { ...updated[idx], color: newColor }
                                    localSectionsRef.current = updated
                                    setLocalSections(updated)
                                    try {
                                      if (saveDraftSections) await saveDraftSections(updated)
                                    } catch (err) {
                                      if (showToast) showToast('Failed to auto-save color: ' + err.message, 'danger')
                                    }
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
                                  onClick={() => setActiveTab('hero')}
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

                        {/* 4. Actions: Edit, Duplicate, Visibility Toggle, Delete */}
                        <div className="col-auto ms-auto d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm rounded-pill p-1.5 px-2.5"
                            onClick={() => setEditingSection({ sec: JSON.parse(JSON.stringify(sec)), idx })}
                            title="Configure section details, images, texts, links & colors"
                          >
                            <i className="bi bi-pencil-square me-1"></i> Edit
                          </button>

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
                      <div className="col-6 col-md-4">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 fw-semibold ${wizardBlockType === 'reels' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setWizardBlockType('reels')}
                        >
                          <i className="bi bi-camera-reels me-1"></i> Watch &amp; Shop
                        </button>
                      </div>
                      <div className="col-6 col-md-4">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 fw-semibold ${wizardBlockType === 'reviews' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setWizardBlockType('reviews')}
                        >
                          <i className="bi bi-chat-quote me-1"></i> Customer Reviews
                        </button>
                      </div>
                      <div className="col-6 col-md-4">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 fw-semibold ${wizardBlockType === 'category_tabs' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setWizardBlockType('category_tabs')}
                        >
                          <i className="bi bi-folder2-open me-1"></i> Category Tabs
                        </button>
                      </div>
                      <div className="col-6 col-md-4">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 fw-semibold ${wizardBlockType === 'categories' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setWizardBlockType('categories')}
                        >
                          <i className="bi bi-grid me-1"></i> Categories
                        </button>
                      </div>
                      <div className="col-6 col-md-4">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 fw-semibold ${wizardBlockType === 'hero' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                          onClick={() => setWizardBlockType('hero')}
                        >
                          <i className="bi bi-images me-1"></i> Hero Slider
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
                    {/* Form for Watch & Shop Reels */}
                    {wizardBlockType === 'reels' && (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Section Heading / Title</label>
                          <input
                            type="text"
                            className="form-control"
                            value={wizardData.title}
                            onChange={e => setWizardData({ ...wizardData, title: e.target.value })}
                            placeholder="e.g. Watch &amp; Shop"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Subtitle / Tagline</label>
                          <input
                            type="text"
                            className="form-control"
                            value={wizardData.subtitle}
                            onChange={e => setWizardData({ ...wizardData, subtitle: e.target.value })}
                            placeholder="e.g. In motion"
                          />
                        </div>
                        <div className="alert alert-info py-2 px-3 small mb-0">
                          <i className="bi bi-info-circle me-1"></i> Videos and YouTube links can be added, edited, or reordered anytime inside the Watch &amp; Shop video manager.
                        </div>
                      </div>
                    )}

                    {/* Form for Customer Reviews */}
                    {wizardBlockType === 'reviews' && (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Section Heading / Title</label>
                          <input
                            type="text"
                            className="form-control"
                            value={wizardData.title}
                            onChange={e => setWizardData({ ...wizardData, title: e.target.value })}
                            placeholder="e.g. What Our Clients Say"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Subtitle / Tagline</label>
                          <input
                            type="text"
                            className="form-control"
                            value={wizardData.subtitle}
                            onChange={e => setWizardData({ ...wizardData, subtitle: e.target.value })}
                            placeholder="e.g. Trusted by thousands of resellers across Pakistan."
                          />
                        </div>
                        <div className="alert alert-info py-2 px-3 small mb-0">
                          <i className="bi bi-info-circle me-1"></i> Renders customer review quotes and verified ratings dynamically from the store database.
                        </div>
                      </div>
                    )}

                    {/* Form for Category Tabs */}
                    {wizardBlockType === 'category_tabs' && (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Section Heading / Title</label>
                          <input
                            type="text"
                            className="form-control"
                            value={wizardData.title}
                            onChange={e => setWizardData({ ...wizardData, title: e.target.value })}
                            placeholder="e.g. Featured Category Collections"
                          />
                        </div>
                        <div className="alert alert-info py-2 px-3 small mb-0">
                          <i className="bi bi-info-circle me-1"></i> Pre-configured with dynamic category tabs. You can customize tabs and targets inside Section Configuration.
                        </div>
                      </div>
                    )}

                    {/* Form for Categories Carousel */}
                    {wizardBlockType === 'categories' && (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Section Heading / Title</label>
                          <input
                            type="text"
                            className="form-control"
                            value={wizardData.title}
                            onChange={e => setWizardData({ ...wizardData, title: e.target.value })}
                            placeholder="e.g. Shop By Categories"
                          />
                        </div>
                        <div className="alert alert-info py-2 px-3 small mb-0">
                          <i className="bi bi-info-circle me-1"></i> Automatically displays all active categories with icons and direct category links.
                        </div>
                      </div>
                    )}

                    {/* Form for Hero Slider */}
                    {wizardBlockType === 'hero' && (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <div className="mb-3">
                          <label className="form-label fw-semibold small">Section Heading / Title</label>
                          <input
                            type="text"
                            className="form-control"
                            value={wizardData.title}
                            onChange={e => setWizardData({ ...wizardData, title: e.target.value })}
                            placeholder="e.g. Main Promotional Slider"
                          />
                        </div>
                        <div className="alert alert-info py-2 px-3 small mb-0">
                          <i className="bi bi-info-circle me-1"></i> Hero banners and slides can be uploaded and reordered under the &ldquo;Hero Slides Carousel&rdquo; tab.
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
                      <label className="form-label fw-semibold small text-primary d-flex align-items-center gap-1">
                        <i className="bi bi-arrow-repeat"></i> Section Block Type (Convert / Replace)
                      </label>
                      <select
                        className="form-select border-primary-subtle"
                        value={editingSection.sec.blockType || 'products'}
                        onChange={e => {
                          const newType = e.target.value
                          const converted = convertSectionBlockType(editingSection.sec, newType)
                          setEditingSection({
                            ...editingSection,
                            sec: converted,
                          })
                        }}
                      >
                        <option value="products">🛒 Products Feed / Carousel</option>
                        <option value="banner">🖼️ Promotional Banner</option>
                        <option value="reels">🎥 Watch &amp; Shop (YouTube Reels)</option>
                        <option value="reviews">⭐ Customer Reviews / Testimonials</option>
                        <option value="category_tabs">📑 Category Tabs Grid</option>
                        <option value="image_text">🖼️📝 Image + Text Feature Story</option>
                        <option value="countdown">⏱️ Limited-Time Countdown Flash Sale</option>
                        <option value="trust_bar">🛡️ Trust Bar &amp; Benefits</option>
                        <option value="announcement">📢 Promotional Announcement Bar</option>
                        <option value="categories">📁 Shop By Categories Carousel</option>
                        <option value="hero">🎠 Hero Banner Slider</option>
                      </select>
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
                      <div className="mb-2">
                        <label className="form-label small fw-semibold">Banner 1 Mobile Image URL (Optional - Responsive)</label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Optional separate mobile banner image"
                            value={editingSection.sec.content?.banners?.[0]?.mobileImage || ''}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.banners) nextSec.content.banners = []
                              if (!nextSec.content.banners[0]) nextSec.content.banners[0] = {}
                              nextSec.content.banners[0].mobileImage = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                          />
                          <label className="btn btn-outline-secondary">
                            <i className="bi bi-upload me-1"></i> Upload Mobile
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={e => handleEditSectionImageUpload('banner1_mobile', e)}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="row g-2 mb-3">
                        <div className="col-md-4">
                          <label className="form-label small text-muted mb-1">Destination Link</label>
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
                        <div className="col-md-4">
                          <label className="form-label small text-muted mb-1">Floating Badge</label>
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
                        <div className="col-md-4">
                          <label className="form-label small text-muted mb-1">CTA Button Text (Optional)</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editingSection.sec.content?.banners?.[0]?.ctaText || ''}
                            onChange={e => {
                              const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                              if (!nextSec.content) nextSec.content = {}
                              if (!nextSec.content.banners) nextSec.content.banners = []
                              if (!nextSec.content.banners[0]) nextSec.content.banners[0] = {}
                              nextSec.content.banners[0].ctaText = e.target.value
                              setEditingSection({ ...editingSection, sec: nextSec })
                            }}
                            placeholder="Button Text (e.g. Shop Now)"
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
                            setActiveTab('hero')
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
                  {editingSection.sec.blockType === 'reels' && (() => {
                    const currentItems = editingSection.sec.content?.reels?.items || watchShop || []
                    const handleAddOrUpdateYtVideo = (e) => {
                      e.preventDefault()
                      const domUrl = document.querySelector('.modal input[data-yt-url="true"]')?.value || document.querySelector('.modal input[placeholder*="youtube.com"]')?.value || ''
                      const domTitle = document.querySelector('.modal input[data-yt-title="true"]')?.value || document.querySelector('.modal input[placeholder*="Unboxing"]')?.value || ''
                      const finalUrl = (ytVideoForm.youtubeUrl || domUrl || '').trim()
                      const finalTitle = (ytVideoForm.title || domTitle || '').trim()

                      const extractedId = ytVideoForm.videoId || extractYouTubeId(finalUrl)
                      if (!extractedId) {
                        alert('Invalid or missing YouTube URL. Please provide a standard watch, share, shorts, or embed URL.')
                        return
                      }
                      const finalItem = {
                        id: editingYtIdx !== null && currentItems[editingYtIdx]?.id ? currentItems[editingYtIdx].id : `yt-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                        title: finalTitle || 'Watch & Shop Feature',
                        youtubeUrl: finalUrl,
                        videoId: extractedId,
                        image: ytVideoForm.image.trim() || `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`,
                        productId: ytVideoForm.productId ? Number(ytVideoForm.productId) : null,
                        active: ytVideoForm.active !== false,
                        description: ytVideoForm.description.trim() || '',
                        order: editingYtIdx !== null ? (editingYtIdx + 1) : (currentItems.length + 1),
                      }

                      const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                      if (!nextSec.content) nextSec.content = {}
                      if (!nextSec.content.reels) nextSec.content.reels = {}
                      const itemsCopy = [...(nextSec.content.reels.items || currentItems)]
                      if (editingYtIdx !== null && editingYtIdx >= 0 && editingYtIdx < itemsCopy.length) {
                        itemsCopy[editingYtIdx] = finalItem
                      } else {
                        itemsCopy.push(finalItem)
                      }
                      nextSec.content.reels.items = itemsCopy
                      setEditingSection({ ...editingSection, sec: nextSec })
                      setEditingYtIdx(null)
                      setYtVideoForm({
                        title: '',
                        youtubeUrl: '',
                        videoId: '',
                        image: '',
                        productId: '',
                        order: 1,
                        active: true,
                        description: '',
                      })
                      const domUrlEl = document.querySelector('.modal input[data-yt-url="true"]') || document.querySelector('.modal input[placeholder*="youtube.com"]')
                      if (domUrlEl) domUrlEl.value = ''
                      const domTitleEl = document.querySelector('.modal input[data-yt-title="true"]') || document.querySelector('.modal input[placeholder*="Unboxing"]')
                      if (domTitleEl) domTitleEl.value = ''
                    }

                    const handleDeleteYtItem = (idx) => {
                      const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                      if (!nextSec.content) nextSec.content = {}
                      if (!nextSec.content.reels) nextSec.content.reels = {}
                      const itemsCopy = [...(nextSec.content.reels.items || currentItems)]
                      itemsCopy.splice(idx, 1)
                      nextSec.content.reels.items = itemsCopy
                      setEditingSection({ ...editingSection, sec: nextSec })
                      if (editingYtIdx === idx) {
                        setEditingYtIdx(null)
                        setYtVideoForm({ title: '', youtubeUrl: '', videoId: '', image: '', productId: '', order: 1, active: true, description: '' })
                      }
                    }

                    const handleMoveYtItem = (idx, dir) => {
                      const target = idx + dir
                      if (target < 0 || target >= currentItems.length) return
                      const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                      if (!nextSec.content) nextSec.content = {}
                      if (!nextSec.content.reels) nextSec.content.reels = {}
                      const itemsCopy = [...(nextSec.content.reels.items || currentItems)]
                      const temp = itemsCopy[idx]
                      itemsCopy[idx] = itemsCopy[target]
                      itemsCopy[target] = temp
                      nextSec.content.reels.items = itemsCopy
                      setEditingSection({ ...editingSection, sec: nextSec })
                    }

                    const handleToggleYtActive = (idx) => {
                      const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                      if (!nextSec.content) nextSec.content = {}
                      if (!nextSec.content.reels) nextSec.content.reels = {}
                      const itemsCopy = [...(nextSec.content.reels.items || currentItems)]
                      itemsCopy[idx] = { ...itemsCopy[idx], active: itemsCopy[idx].active === false ? true : false }
                      nextSec.content.reels.items = itemsCopy
                      setEditingSection({ ...editingSection, sec: nextSec })
                    }

                    const detectedId = extractYouTubeId(ytVideoForm.youtubeUrl)

                    return (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <div className="row g-3 mb-3">
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold">Section Heading</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
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
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold">Subtitle / Callout</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
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
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold">Max Visible Videos</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              min="1"
                              max="24"
                              value={editingSection.sec.content?.reels?.maxVideos || ''}
                              placeholder="Default (All active)"
                              onChange={e => {
                                const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                                if (!nextSec.content) nextSec.content = {}
                                if (!nextSec.content.reels) nextSec.content.reels = {}
                                nextSec.content.reels.maxVideos = e.target.value ? Number(e.target.value) : ''
                                setEditingSection({ ...editingSection, sec: nextSec })
                              }}
                            />
                          </div>
                        </div>

                        {/* Add / Edit YouTube Video Form */}
                        <div className="card mb-4 border-success-subtle shadow-sm">
                          <div className="card-header bg-success-subtle py-2 d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-success-emphasis small">
                              <i className="bi bi-youtube me-1 text-danger"></i>
                              {editingYtIdx !== null ? `Edit Video #${editingYtIdx + 1}` : 'Add New YouTube Video'}
                            </span>
                            {editingYtIdx !== null && (
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-muted"
                                onClick={() => {
                                  setEditingYtIdx(null)
                                  setYtVideoForm({ title: '', youtubeUrl: '', videoId: '', image: '', productId: '', order: 1, active: true, description: '' })
                                }}
                              >
                                Cancel Edit
                              </button>
                            )}
                          </div>
                          <div className="card-body p-3">
                            <div className="row g-2 mb-2">
                              <div className="col-md-6">
                                <label className="form-label small fw-semibold mb-1">YouTube URL (Watch, Shorts, youtu.be)</label>
                                <input
                                  type="text"
                                  data-yt-url="true"
                                  className="form-control form-control-sm"
                                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                                  value={ytVideoForm.youtubeUrl}
                                  onChange={e => {
                                    const val = e.target.value
                                    const exId = extractYouTubeId(val)
                                    setYtVideoForm(prev => ({
                                      ...prev,
                                      youtubeUrl: val,
                                      videoId: exId || prev.videoId,
                                      image: exId && (!prev.image || prev.image.includes('youtube.com')) ? `https://img.youtube.com/vi/${exId}/hqdefault.jpg` : prev.image,
                                    }))
                                  }}
                                />
                                {detectedId && (
                                  <span className="badge bg-success-subtle text-success border border-success mt-1 small">
                                    ✓ Video ID: {detectedId}
                                  </span>
                                )}
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small fw-semibold mb-1">Video Title / Caption</label>
                                <input
                                  type="text"
                                  data-yt-title="true"
                                  className="form-control form-control-sm"
                                  placeholder="e.g. Smart Watch Ultra 2 Unboxing"
                                  value={ytVideoForm.title}
                                  onChange={e => setYtVideoForm({ ...ytVideoForm, title: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="row g-2 mb-2">
                              <div className="col-md-6">
                                <label className="form-label small fw-semibold mb-1">Thumbnail Preview / Image URL</label>
                                <div className="input-group input-group-sm">
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Auto-resolved from YouTube or custom"
                                    value={ytVideoForm.image}
                                    onChange={e => setYtVideoForm({ ...ytVideoForm, image: e.target.value })}
                                  />
                                  <label className="btn btn-outline-secondary btn-sm">
                                    <i className="bi bi-upload"></i>
                                    <input type="file" accept="image/*" hidden onChange={handleUploadYtThumbnail} />
                                  </label>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small fw-semibold mb-1">Associated Store Product (Optional)</label>
                                <select
                                  className="form-select form-select-sm"
                                  value={ytVideoForm.productId || ''}
                                  onChange={e => setYtVideoForm({ ...ytVideoForm, productId: e.target.value })}
                                >
                                  <option value="">-- No Linked Product --</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name.slice(0, 40)}... (Rs. {Number(p.price).toLocaleString()})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="ytActiveSwitch"
                                  checked={ytVideoForm.active !== false}
                                  onChange={e => setYtVideoForm({ ...ytVideoForm, active: e.target.checked })}
                                />
                                <label className="form-check-label small" htmlFor="ytActiveSwitch">Active on Live Store</label>
                              </div>
                              <button
                                type="button"
                                className="btn btn-success btn-sm px-3 shadow-sm fw-semibold"
                                onClick={handleAddOrUpdateYtVideo}
                              >
                                <i className="bi bi-plus-circle me-1"></i>
                                {editingYtIdx !== null ? 'Update Video in List' : 'Add Video to Watch & Shop'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* List of Configured Videos */}
                        <h6 className="fw-bold small mb-2 text-dark">
                          Configured Videos ({currentItems.length} items):
                        </h6>
                        {currentItems.length === 0 ? (
                          <div className="text-muted small p-3 bg-white rounded border text-center">
                            No videos configured yet. Use the form above to add YouTube videos.
                          </div>
                        ) : (
                          <div className="table-responsive bg-white rounded border">
                            <table className="table table-sm table-hover align-middle mb-0 small">
                              <thead className="table-light">
                                <tr>
                                  <th style={{ width: '40px' }}>#</th>
                                  <th style={{ width: '60px' }}>Thumb</th>
                                  <th>Title &amp; Source</th>
                                  <th>Linked Product</th>
                                  <th style={{ width: '80px' }}>Status</th>
                                  <th style={{ width: '130px' }} className="text-end">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentItems.map((item, idx) => {
                                  const ytId = item.videoId || extractYouTubeId(item.youtubeUrl)
                                  const displayImg = item.image || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '')
                                  const linkedProd = products.find(p => String(p.id) === String(item.productId))

                                  return (
                                    <tr key={item.id || idx}>
                                      <td className="text-muted fw-bold">{idx + 1}</td>
                                      <td>
                                        {displayImg ? (
                                          <img
                                            src={displayImg}
                                            alt=""
                                            width="48"
                                            height="36"
                                            className="rounded border object-fit-cover"
                                            onError={e => { e.target.src = 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp' }}
                                          />
                                        ) : (
                                          <div className="bg-secondary text-white rounded text-center py-1" style={{ width: 48, height: 36 }}>🎬</div>
                                        )}
                                      </td>
                                      <td>
                                        <div className="fw-semibold text-truncate" style={{ maxWidth: '240px' }}>
                                          {item.title || item.name || 'Untitled Video'}
                                        </div>
                                        <div className="text-muted text-truncate" style={{ maxWidth: '240px', fontSize: '11px' }}>
                                          {ytId ? (
                                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle me-1">
                                              YouTube: {ytId}
                                            </span>
                                          ) : item.video ? (
                                            <span className="badge bg-secondary-subtle text-secondary me-1">MP4 Reel</span>
                                          ) : null}
                                          {item.youtubeUrl || item.video || ''}
                                        </div>
                                      </td>
                                      <td>
                                        {linkedProd ? (
                                          <span className="badge bg-light text-dark border">
                                            {linkedProd.name.slice(0, 20)}... (Rs. {Number(linkedProd.price).toLocaleString()})
                                          </span>
                                        ) : (
                                          <span className="text-muted">—</span>
                                        )}
                                      </td>
                                      <td>
                                        <button
                                          type="button"
                                          className={`badge border-0 ${item.active !== false ? 'bg-success text-white' : 'bg-secondary text-white'}`}
                                          onClick={() => handleToggleYtActive(idx)}
                                          title="Click to toggle status"
                                        >
                                          {item.active !== false ? 'Active' : 'Hidden'}
                                        </button>
                                      </td>
                                      <td className="text-end">
                                        <div className="btn-group btn-group-sm">
                                          <button
                                            type="button"
                                            className="btn btn-outline-secondary px-1.5"
                                            disabled={idx === 0}
                                            onClick={() => handleMoveYtItem(idx, -1)}
                                            title="Move Up"
                                          >
                                            ▲
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-outline-secondary px-1.5"
                                            disabled={idx === currentItems.length - 1}
                                            onClick={() => handleMoveYtItem(idx, 1)}
                                            title="Move Down"
                                          >
                                            ▼
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-outline-primary px-2"
                                            onClick={() => {
                                              setEditingYtIdx(idx)
                                              setYtVideoForm({
                                                title: item.title || item.name || '',
                                                youtubeUrl: item.youtubeUrl || (item.videoId ? `https://www.youtube.com/watch?v=${item.videoId}` : ''),
                                                videoId: item.videoId || '',
                                                image: item.image || '',
                                                productId: item.productId ? String(item.productId) : '',
                                                order: idx + 1,
                                                active: item.active !== false,
                                                description: item.description || '',
                                              })
                                            }}
                                            title="Edit Video"
                                          >
                                            <i className="bi bi-pencil"></i>
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-outline-danger px-2"
                                            onClick={() => handleDeleteYtItem(idx)}
                                            title="Delete Video"
                                          >
                                            <i className="bi bi-trash"></i>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* REVIEWS */}
                  {editingSection.sec.blockType === 'reviews' && (() => {
                    const selectedIds = editingSection.sec.content?.reviews?.selectedReviewIds || []
                    const handleToggleReviewSelection = (id) => {
                      const idStr = String(id)
                      const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                      if (!nextSec.content) nextSec.content = {}
                      if (!nextSec.content.reviews) nextSec.content.reviews = {}
                      let currentSelected = nextSec.content.reviews.selectedReviewIds
                      if (!Array.isArray(currentSelected) || currentSelected.length === 0) {
                        currentSelected = reviews.map(r => String(r.id)).filter(rId => rId !== idStr)
                      } else if (currentSelected.includes(idStr)) {
                        currentSelected = currentSelected.filter(rId => rId !== idStr)
                      } else {
                        currentSelected = [...currentSelected, idStr]
                      }
                      nextSec.content.reviews.selectedReviewIds = currentSelected
                      setEditingSection({ ...editingSection, sec: nextSec })
                    }

                    const handleSelectAllReviews = () => {
                      const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                      if (!nextSec.content) nextSec.content = {}
                      if (!nextSec.content.reviews) nextSec.content.reviews = {}
                      nextSec.content.reviews.selectedReviewIds = reviews.map(r => String(r.id))
                      setEditingSection({ ...editingSection, sec: nextSec })
                    }

                    const handleClearAllReviews = () => {
                      const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                      if (!nextSec.content) nextSec.content = {}
                      if (!nextSec.content.reviews) nextSec.content.reviews = {}
                      nextSec.content.reviews.selectedReviewIds = []
                      setEditingSection({ ...editingSection, sec: nextSec })
                    }

                    const isAllSelected = !Array.isArray(selectedIds) || selectedIds.length === 0 || selectedIds.length === reviews.length

                    return (
                      <div className="bg-light p-3.5 rounded-3 border">
                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">Section Heading</label>
                            <input
                              type="text"
                              data-review-heading="true"
                              className="form-control form-control-sm"
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
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">Maximum Visible Reviews</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              min="1"
                              max="30"
                              placeholder="Default (All approved)"
                              value={editingSection.sec.content?.reviews?.maxReviews || ''}
                              onChange={e => {
                                const nextSec = JSON.parse(JSON.stringify(editingSection.sec))
                                if (!nextSec.content) nextSec.content = {}
                                if (!nextSec.content.reviews) nextSec.content.reviews = {}
                                nextSec.content.reviews.maxReviews = e.target.value ? Number(e.target.value) : ''
                                setEditingSection({ ...editingSection, sec: nextSec })
                              }}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label small fw-semibold">Subheading / Description</label>
                            <textarea
                              className="form-control form-control-sm"
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
                        </div>

                        {/* Customer Reviews Selection Checklist */}
                        <div className="card border">
                          <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                            <span className="fw-bold small text-dark">
                              <i className="bi bi-star-fill text-warning me-1"></i>
                              Select Customer Reviews to Display ({Array.isArray(selectedIds) && selectedIds.length > 0 ? selectedIds.length : reviews.length} / {reviews.length} selected)
                            </span>
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className="btn btn-outline-secondary py-0.5 px-2"
                                onClick={handleSelectAllReviews}
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary py-0.5 px-2"
                                onClick={handleClearAllReviews}
                              >
                                Clear All
                              </button>
                            </div>
                          </div>
                          <div className="card-body p-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                            {reviews.length === 0 ? (
                              <p className="text-muted small p-2 mb-0">No customer reviews loaded.</p>
                            ) : (
                              <div className="list-group list-group-flush">
                                {reviews.map(r => {
                                  const isChecked = isAllSelected || (Array.isArray(selectedIds) && selectedIds.includes(String(r.id)))
                                  return (
                                    <label
                                      key={r.id}
                                      className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-2 small"
                                      style={{ cursor: 'pointer' }}
                                    >
                                      <div className="d-flex align-items-center gap-2">
                                        <input
                                          className="form-check-input mt-0"
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleToggleReviewSelection(r.id)}
                                        />
                                        <div>
                                          <strong>{r.name}</strong>
                                          <span className="text-warning ms-1">{'★'.repeat(r.rating || 5)}</span>
                                          {r.verified && <span className="badge bg-success-subtle text-success ms-1">Verified</span>}
                                          <div className="text-muted text-truncate" style={{ maxWidth: '420px', fontSize: '11px' }}>
                                            {r.title ? `"${r.title}" — ` : ''}{r.text}
                                          </div>
                                        </div>
                                      </div>
                                      <span className="text-muted" style={{ fontSize: '10px' }}>{r.date}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

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

              <div className="modal-footer bg-light border-top py-3 px-4 d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    const sec = editingSection.sec
                    setEditingSection(null)
                    setSectionToDelete(sec)
                  }}
                  title="Remove this section from homepage layout"
                >
                  <i className="bi bi-trash3 me-1"></i> Delete Section Placement
                </button>
                <div className="d-flex gap-2">
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
