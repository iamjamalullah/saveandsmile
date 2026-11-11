import { Link } from 'react-router'
import ProductSection from './ProductSection'

/**
 * 1. Single Column Promotional Banner (100% Full-Width / Boxed)
 */
export function PromoBannerSingle({ section }) {
  const content = section.content || {}
  const banner = (content.banners && content.banners[0]) || content.banner || {
    image: section.image || section.bg || 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp',
    link: section.link || '/shop',
    title: section.title || 'Special Promotion',
    alt: section.alt || section.title || 'Promotional Offer',
    badge: content.badge || section.badge || '',
  }

  const imageSrc = banner.image || 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp'
  const linkTo = banner.link || '/shop'

  return (
    <section className="qg-custom-section qg-promo-single" id={`sec-${section.id}`}>
      <div className="qg-container">
        <div className="qg-banner-card single-col shadow-sm">
          <Link to={linkTo} className="qg-banner-link" aria-label={banner.title || 'Special Offer'}>
            <img
              src={imageSrc}
              alt={banner.alt || banner.title || 'Banner'}
              loading="lazy"
              className="qg-banner-img"
              onError={(e) => { e.target.src = 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp' }}
            />
            {banner.badge && (
              <span className="qg-banner-badge-floating">
                {banner.badge}
              </span>
            )}
          </Link>
        </div>
      </div>
    </section>
  )
}

/**
 * 2. Two Columns Promotional Banner (50/50, 70/30, 30/70)
 */
export function PromoBannerDouble({ section }) {
  const content = section.content || {}
  const banners = content.banners || []
  const banner1 = banners[0] || {
    image: 'https://www.qadrigadgets.pk/images/banners/6a7af65669503.webp',
    link: '/shop',
    title: 'Featured Collection',
    badge: 'Trending',
  }
  const banner2 = banners[1] || {
    image: 'https://www.qadrigadgets.pk/images/banners/6a7af65669d26.webp',
    link: '/shop',
    title: 'Best Sellers',
    badge: 'Popular',
  }

  const layout = section.containerLayout || 'two_equal'
  const gridClass = layout === 'two_70_30'
    ? 'qg-grid-70-30'
    : layout === 'two_30_70'
      ? 'qg-grid-30-70'
      : 'qg-grid-50-50'

  return (
    <section className="qg-custom-section qg-promo-double" id={`sec-${section.id}`}>
      <div className="qg-container">
        {section.title && section.showTitle !== false && (
          <div className="qg-custom-sec-head text-center mb-3">
            <h3 className="fw-bold fs-4 text-dark mb-1">{section.title}</h3>
            {section.subtitle && <p className="text-muted small mb-0">{section.subtitle}</p>}
          </div>
        )}
        <div className={`qg-banner-split-grid ${gridClass}`}>
          {/* Column 1 */}
          <div className="qg-banner-card col-item shadow-sm">
            <Link to={banner1.link || '/shop'} className="qg-banner-link" aria-label={banner1.title || 'Promotion 1'}>
              <img
                src={banner1.image || 'https://www.qadrigadgets.pk/images/banners/6a7af65669503.webp'}
                alt={banner1.alt || banner1.title || 'Promo Banner'}
                loading="lazy"
                className="qg-banner-img"
                onError={(e) => { e.target.src = 'https://www.qadrigadgets.pk/images/banners/6a7af65669503.webp' }}
              />
              {banner1.badge && (
                <span className="qg-banner-badge-floating">
                  {banner1.badge}
                </span>
              )}
            </Link>
          </div>

          {/* Column 2 */}
          <div className="qg-banner-card col-item shadow-sm">
            <Link to={banner2.link || '/shop'} className="qg-banner-link" aria-label={banner2.title || 'Promotion 2'}>
              <img
                src={banner2.image || 'https://www.qadrigadgets.pk/images/banners/6a7af65669d26.webp'}
                alt={banner2.alt || banner2.title || 'Promo Banner'}
                loading="lazy"
                className="qg-banner-img"
                onError={(e) => { e.target.src = 'https://www.qadrigadgets.pk/images/banners/6a7af65669d26.webp' }}
              />
              {banner2.badge && (
                <span className="qg-banner-badge-floating">
                  {banner2.badge}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * 3. Text Announcement / Callout Section
 */
export function AnnouncementSection({ section }) {
  const content = section.content || {}
  const announcement = content.announcement || {
    heading: section.title || 'Special Wholesaler Discount',
    subheading: section.subtitle || 'Order bulk packages today and receive direct delivery across Pakistan!',
    buttonText: 'Explore Wholesale',
    buttonLink: '/bulk-order',
    bgColor: section.color || '#049977',
    textColor: '#ffffff',
    align: 'center',
  }

  const bgColor = announcement.bgColor || section.color || '#049977'
  const textColor = announcement.textColor || '#ffffff'
  const textAlign = announcement.align || 'center'

  return (
    <section className="qg-custom-section qg-announcement-wrap" id={`sec-${section.id}`}>
      <div className="qg-container">
        <div
          className="qg-announcement-box shadow-sm"
          style={{
            backgroundColor: bgColor,
            color: textColor,
            textAlign: textAlign,
          }}
        >
          <div className="qg-announcement-content">
            <span className="qg-announcement-pill">
              <i className="bi bi-megaphone-fill me-1"></i> Special Offer
            </span>
            <h2 className="qg-announcement-heading" style={{ color: textColor }}>
              {announcement.heading || section.title}
            </h2>
            {(announcement.subheading || section.subtitle) && (
              <p className="qg-announcement-subheading" style={{ color: textColor, opacity: 0.9 }}>
                {announcement.subheading || section.subtitle}
              </p>
            )}
            {announcement.buttonText && (
              <Link
                to={announcement.buttonLink || '/shop'}
                className="btn qg-announcement-btn shadow-sm"
              >
                {announcement.buttonText} <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Universal Dynamic Section Switcher
 */
export default function DynamicHomeSection({ section, onViewAll, onSeeMore }) {
  if (!section || section.enabled === false || section.isVisible === false) {
    return null
  }

  const blockType = section.blockType || section.block_type || 'products'
  const containerLayout = section.containerLayout || section.container_layout || 'single'

  try {
    switch (blockType) {
      case 'banner':
      case 'banner_single':
        if (containerLayout !== 'single') {
          return <PromoBannerDouble section={section} />
        }
        return <PromoBannerSingle section={section} />

      case 'banner_double':
        return <PromoBannerDouble section={section} />

      case 'announcement':
        return <AnnouncementSection section={section} />

      case 'products':
      default:
        return (
          <ProductSection
            section={section}
            onViewAll={onViewAll}
            onSeeMore={onSeeMore}
          />
        )
    }
  } catch (err) {
    console.warn(`[DynamicHomeSection] Rendering error for section ${section.id}:`, err)
    return null
  }
}
