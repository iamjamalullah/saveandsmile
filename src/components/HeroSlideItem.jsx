import React, { useMemo } from 'react'
import { Link } from 'react-router'
import { getResolvedSlideData } from '../utils/heroSlideData.js'

export { getResolvedSlideData }

/**
 * Universal Hero Slide Renderer
 * Shared between Storefront Hero.jsx and Admin Live Device Preview
 */
export default function HeroSlideItem({
  slide,
  isActive = true,
  device = 'auto', // 'auto' | 'desktop' | 'tablet' | 'mobile'
  priority = false,
  isPreview = false,
}) {
  const data = useMemo(() => getResolvedSlideData(slide), [slide])

  // Determine active config based on forced device or responsive auto
  const effectiveDevice = device === 'auto' ? 'desktop' : device
  const resp = data.responsive[effectiveDevice] || data.responsive.desktop
  const animStyle = data.animation[effectiveDevice] || 'fade-up'
  const isMobile = device === 'mobile'

  // Determine background image based on device mode
  const bgImage = (
    device === 'mobile' ? (data.images.mobile || data.images.desktop)
    : device === 'tablet' ? (data.images.tablet || data.images.desktop)
    : data.images.desktop
  ) || slide.image || '/images/banner-placeholder.webp'

  // Alignment helpers
  const alignClass = `text-${resp.alignment === 'center' ? 'center' : resp.alignment === 'right' ? 'end' : 'start'}`
  const justifyClass = (
    resp.verticalPos === 'top' ? 'justify-content-start'
    : resp.verticalPos === 'bottom' ? 'justify-content-end'
    : 'justify-content-center'
  )
  const itemsClass = (
    resp.alignment === 'center' ? 'align-items-center'
    : resp.alignment === 'right' ? 'align-items-end'
    : 'align-items-start'
  )

  // Overlay styles
  let overlayStyle = null
  if (data.overlay.enabled && data.overlay.type !== 'none') {
    const op = data.overlay.opacity
    if (data.overlay.type === 'dark') {
      overlayStyle = { background: `rgba(0,0,0,${op})` }
    } else if (data.overlay.type === 'light') {
      overlayStyle = { background: `rgba(255,255,255,${op})` }
    } else if (data.overlay.type === 'gradient') {
      const dir = data.overlay.direction || 'to-right'
      const dirCss = (
        dir === 'to-left' ? 'to left'
        : dir === 'to-top' ? 'to top'
        : dir === 'to-bottom' ? 'to bottom'
        : 'to right'
      )
      overlayStyle = {
        background: `linear-gradient(${dirCss}, rgba(0,0,0,${op * 1.5}) 0%, rgba(0,0,0,${op * 0.7}) 50%, transparent 100%)`,
      }
    } else if (data.overlay.type === 'custom') {
      overlayStyle = { background: data.overlay.color || 'rgba(0,0,0,0.5)' }
    }
  }

  // Animation class helper
  const getAnimClass = (baseAnim, active) => {
    if (!active || baseAnim === 'none') return ''
    return `qg-hero-anim-${baseAnim}`
  }

  const activeAnimClass = getAnimClass(animStyle, isActive)
  const hasText = Boolean(data.title || data.subtitle || data.label || data.primaryCta.show)
  const mobileLayout = resp.layout || 'overlay'

  // Content Block Elements
  const contentBlock = hasText ? (
    <div
      key={`slide-content-${slide.id || slide.image}-${isActive}`}
      className={`qg-hero-content-inner ${alignClass} ${activeAnimClass}`}
      style={{
        maxWidth: typeof resp.maxWidth === 'number' ? `${resp.maxWidth}px` : resp.maxWidth,
        color: resp.textColor || '#ffffff',
      }}
    >
      {/* Label / Eyebrow */}
      {data.label && !resp.hideLabel && (
        <div
          className={`qg-hero-eyebrow qg-hero-stagger-1 ${activeAnimClass}`}
          style={{
            fontSize: `${resp.labelSize || 12}px`,
            color: resp.textColor || '#ffffff',
          }}
        >
          <span className="qg-hero-eyebrow-badge">{data.label}</span>
        </div>
      )}

      {/* Main Heading */}
      {data.title && (
        <h2
          className={`qg-hero-heading qg-hero-stagger-2 ${activeAnimClass}`}
          style={{
            fontSize: `${resp.headingSize || (isMobile ? 22 : 40)}px`,
            color: resp.textColor || '#ffffff',
          }}
        >
          {data.title}
        </h2>
      )}

      {/* Subheading */}
      {data.subtitle && !resp.hideSubheading && (
        <p
          className={`qg-hero-subheading qg-hero-stagger-3 ${activeAnimClass}`}
          style={{
            fontSize: `${resp.subheadingSize || (isMobile ? 13.5 : 17)}px`,
            color: resp.textColor || '#ffffff',
          }}
        >
          {data.subtitle}
        </p>
      )}

      {/* CTA Buttons Row */}
      {(data.primaryCta.show || data.secondaryCta.show) && (
        <div
          className={`qg-hero-btn-row d-inline-flex flex-wrap gap-2.5 mt-3 ${itemsClass} qg-hero-stagger-4 ${activeAnimClass}`}
        >
          {/* Primary CTA */}
          {data.primaryCta.show && data.primaryCta.text && (
            isPreview ? (
              <button
                type="button"
                className={`qg-hero-btn qg-hero-btn-${data.primaryCta.style || 'filled'} qg-hero-btn-${data.primaryCta.size || 'md'}`}
              >
                <span>{data.primaryCta.text}</span>
                <i className="bi bi-arrow-right"></i>
              </button>
            ) : (
              <Link
                to={data.primaryCta.link || '/shop'}
                className={`qg-hero-btn qg-hero-btn-${data.primaryCta.style || 'filled'} qg-hero-btn-${data.primaryCta.size || 'md'}`}
              >
                <span>{data.primaryCta.text}</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            )
          )}

          {/* Secondary CTA */}
          {data.secondaryCta.show && data.secondaryCta.text && (
            isPreview ? (
              <button
                type="button"
                className={`qg-hero-btn qg-hero-btn-${data.secondaryCta.style || 'outline'} qg-hero-btn-${data.secondaryCta.size || 'md'}`}
              >
                <span>{data.secondaryCta.text}</span>
              </button>
            ) : (
              <Link
                to={data.secondaryCta.link || '/shop'}
                className={`qg-hero-btn qg-hero-btn-${data.secondaryCta.style || 'outline'} qg-hero-btn-${data.secondaryCta.size || 'md'}`}
              >
                <span>{data.secondaryCta.text}</span>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  ) : null

  // Background visual layer (Picture element for auto mode, direct img for forced device preview)
  const imageElement = (
    <div className={`qg-hero-img-wrap ${isActive && data.animation.bgZoom ? 'qg-hero-bg-zooming' : ''}`}>
      {device === 'auto' ? (
        <picture>
          {data.images.mobile && (
            <source media="(max-width: 576px)" srcSet={data.images.mobile} />
          )}
          {data.images.tablet && (
            <source media="(max-width: 992px)" srcSet={data.images.tablet} />
          )}
          <img
            src={data.images.desktop || slide.image}
            alt={slide.alt || data.title || 'Save & Smile Banner'}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            className="qg-hero-img"
            onError={(e) => { e.target.src = '/images/banner-placeholder.webp' }}
          />
        </picture>
      ) : (
        <img
          src={bgImage}
          alt={slide.alt || data.title || 'Save & Smile Banner'}
          loading={priority ? 'eager' : 'lazy'}
          className="qg-hero-img"
          onError={(e) => { e.target.src = '/images/banner-placeholder.webp' }}
        />
      )}
    </div>
  )

  // If mobile layout is 'below', stack content underneath image
  if (device === 'mobile' && mobileLayout === 'below' && hasText) {
    return (
      <div className="qg-hero-slide-stacked-wrapper">
        <div className="position-relative overflow-hidden" style={{ borderRadius: '12px 12px 0 0' }}>
          {imageElement}
          {overlayStyle && <div className="qg-hero-overlay" style={overlayStyle} />}
        </div>
        <div className="qg-hero-content-below p-3 bg-dark text-white rounded-bottom-3 shadow-sm">
          {contentBlock}
        </div>
      </div>
    )
  }

  // Default Overlay Layout
  return (
    <div className="qg-hero-slide-inner position-relative w-100 h-100 overflow-hidden">
      {/* Background Image */}
      {imageElement}

      {/* Overlay */}
      {overlayStyle && <div className="qg-hero-overlay" style={overlayStyle} />}

      {/* Text & Button Content Container */}
      {hasText && (
        <div
          className={`qg-hero-content-container d-flex flex-column ${justifyClass} ${itemsClass}`}
        >
          {contentBlock}
        </div>
      )}
    </div>
  )
}
