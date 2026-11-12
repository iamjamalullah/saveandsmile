import { useState, useEffect } from 'react'
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
 * 4. Image + Text Split Showcase Section (50/50, 70/30, 30/70)
 */
export function ImageTextSection({ section }) {
  const content = section.content || {}
  const data = content.image_text || {
    image: section.image || 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp',
    imageAlt: section.title || 'Showcase',
    heading: section.title || 'Premium Quality Gadgets',
    text: section.subtitle || 'Discover innovative lifestyle accessories and smart gadgets engineered for performance and durability.',
    buttonText: 'Explore Catalog',
    buttonLink: '/shop',
    imagePosition: 'left',
    bgColor: '#ffffff',
    textColor: '#1e293b',
  }

  const layout = section.containerLayout || 'two_equal'
  const isRight = data.imagePosition === 'right'

  const gridClass = layout === 'two_70_30'
    ? (isRight ? 'qg-grid-30-70' : 'qg-grid-70-30')
    : layout === 'two_30_70'
      ? (isRight ? 'qg-grid-70-30' : 'qg-grid-30-70')
      : 'qg-grid-50-50'

  return (
    <section className="qg-custom-section qg-imagetext-wrap" id={`sec-${section.id}`} style={{ backgroundColor: data.bgColor || 'transparent' }}>
      <div className="qg-container">
        <div className={`qg-imagetext-grid ${gridClass} ${isRight ? 'is-reversed' : ''}`}>
          <div className="qg-imagetext-media">
            <img
              src={data.image || 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp'}
              alt={data.imageAlt || data.heading}
              loading="lazy"
              className="qg-imagetext-img shadow-sm"
              onError={e => { e.target.src = 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp' }}
            />
          </div>
          <div className="qg-imagetext-body" style={{ color: data.textColor || '#1e293b' }}>
            <span className="qg-imagetext-badge">Featured Story</span>
            <h2 className="qg-imagetext-heading" style={{ color: data.textColor || '#1e293b' }}>{data.heading || section.title}</h2>
            <p className="qg-imagetext-desc">{data.text || section.subtitle}</p>
            {data.buttonText && (
              <Link to={data.buttonLink || '/shop'} className="btn qg-imagetext-btn shadow-sm">
                {data.buttonText} <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * 5. Countdown Promotion Section (Live Ticking Countdown Timer)
 */
export function CountdownSection({ section }) {
  const content = section.content || {}
  const data = content.countdown || {
    heading: section.title || 'Limited Time Flash Sale',
    subheading: section.subtitle || 'Special wholesale pricing ends soon!',
    targetDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    buttonText: 'Shop Deals Now',
    buttonLink: '/shop?group=hot',
    bgColor: section.color || '#0f3c28',
    textColor: '#ffffff',
  }

  const calculateTimeLeft = (target) => {
    const diff = Math.max(0, new Date(target).getTime() - Date.now())
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / 1000 / 60) % 60)
    const seconds = Math.floor((diff / 1000) % 60)
    return { days, hours, minutes, seconds, expired: diff <= 0 }
  }

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(data.targetDate))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(data.targetDate))
    }, 1000)
    return () => clearInterval(timer)
  }, [data.targetDate])

  return (
    <section className="qg-custom-section qg-countdown-wrap" id={`sec-${section.id}`}>
      <div className="qg-container">
        <div
          className="qg-countdown-box shadow-sm"
          style={{ backgroundColor: data.bgColor || section.color || '#0f3c28', color: data.textColor || '#ffffff' }}
        >
          <div className="qg-countdown-content">
            <span className="qg-countdown-badge">⚡ Flash Sale</span>
            <h2 className="qg-countdown-heading" style={{ color: data.textColor || '#ffffff' }}>
              {data.heading || section.title}
            </h2>
            {(data.subheading || section.subtitle) && (
              <p className="qg-countdown-subheading" style={{ color: data.textColor || '#ffffff', opacity: 0.9 }}>
                {data.subheading || section.subtitle}
              </p>
            )}

            <div className="qg-countdown-timer">
              <div className="qg-countdown-unit">
                <span className="qg-countdown-val">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="qg-countdown-lbl">Days</span>
              </div>
              <span className="qg-countdown-sep">:</span>
              <div className="qg-countdown-unit">
                <span className="qg-countdown-val">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="qg-countdown-lbl">Hours</span>
              </div>
              <span className="qg-countdown-sep">:</span>
              <div className="qg-countdown-unit">
                <span className="qg-countdown-val">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="qg-countdown-lbl">Mins</span>
              </div>
              <span className="qg-countdown-sep">:</span>
              <div className="qg-countdown-unit">
                <span className="qg-countdown-val">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="qg-countdown-lbl">Secs</span>
              </div>
            </div>

            {data.buttonText && (
              <Link to={data.buttonLink || '/shop?group=hot'} className="btn qg-countdown-btn shadow-sm">
                {data.buttonText} <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * 6. Benefits / Trust Bar Section
 */
export function TrustBarSection({ section }) {
  const content = section.content || {}
  const data = content.trust_bar || {
    heading: section.title || '',
    items: [
      { icon: '🚚', title: 'Free Nationwide Shipping', subtitle: 'On all orders above Rs. 3,000' },
      { icon: '📞', title: '24/7 WhatsApp Support', subtitle: 'Dedicated customer care' },
      { icon: '🛡️', title: '100% Genuine Gadgets', subtitle: 'Quality checked & tested' },
      { icon: '💵', title: 'Cash on Delivery', subtitle: 'Pay when you receive' },
    ],
    bgColor: '#f8fafc',
    textColor: '#1e293b',
  }

  const items = Array.isArray(data.items) && data.items.length ? data.items : [
    { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders over Rs. 3,000' },
    { icon: '💬', title: '24/7 WhatsApp Help', subtitle: 'Live chat support anytime' },
    { icon: '🛡️', title: '100% Genuine Items', subtitle: 'Tested & verified products' },
    { icon: '💵', title: 'Cash on Delivery', subtitle: 'Pay when your parcel arrives' },
  ]

  return (
    <section className="qg-custom-section qg-trustbar-wrap" id={`sec-${section.id}`} style={{ backgroundColor: data.bgColor || 'transparent' }}>
      <div className="qg-container">
        {data.heading && (
          <div className="text-center mb-3">
            <h3 className="fw-bold fs-5 text-dark mb-0">{data.heading}</h3>
          </div>
        )}
        <div className="qg-trustbar-grid">
          {items.map((item, idx) => (
            <div key={idx} className="qg-trustbar-item shadow-sm">
              <span className="qg-trustbar-icon" role="img" aria-label={item.title}>{item.icon || '✨'}</span>
              <div className="qg-trustbar-info">
                <h4 className="qg-trustbar-title">{item.title}</h4>
                {item.subtitle && <p className="qg-trustbar-sub">{item.subtitle}</p>}
              </div>
            </div>
          ))}
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

      case 'image_text':
        return <ImageTextSection section={section} />

      case 'countdown':
        return <CountdownSection section={section} />

      case 'trust_bar':
      case 'benefits':
        return <TrustBarSection section={section} />

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
