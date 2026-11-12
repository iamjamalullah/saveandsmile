import { useEffect, useRef } from 'react'
import { TRUST_BADGES } from '../data'
import { useStoreData } from '../context/StoreDataContext'
import { useNavigate } from 'react-router'

/**
 * 1. Independent Shop By Categories Circles Section
 */
export function CategoryCirclesSection({ section, onShopCategory }) {
  const { categories = [] } = useStoreData()
  const navigate = useNavigate()
  const rail = useRef(null)
  const isHovered = useRef(false)

  const sectionTitle = section?.title || section?.content?.categories?.heading || 'Shop By Categories'

  const move = dir => {
    const el = rail.current
    if (!el) return
    const card = el.querySelector('.qg-cat')
    const step = (card?.offsetWidth || 140) + 20
    const max = Math.max(0, el.scrollWidth - el.clientWidth)
    const target = Math.max(0, Math.min(max, el.scrollLeft + dir * step * 2))
    el.scrollTo({ left: target, behavior: 'smooth' })
  }

  // Smooth continuous right-to-left marquee movement with seamless infinite wrap
  useEffect(() => {
    const el = rail.current
    if (!el || categories.length < 3) return undefined

    let animationFrameId
    const speed = 0.75 // smooth gentle drift

    const step = () => {
      if (!isHovered.current && el) {
        const singleSetWidth = el.scrollWidth / 3
        if (singleSetWidth > 0 && el.scrollLeft >= singleSetWidth * 2) {
          el.scrollLeft -= singleSetWidth
        } else {
          el.scrollLeft += speed
        }
      }
      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [categories.length])

  const handleScroll = () => {
    const el = rail.current
    if (!el || categories.length < 3) return
    const singleSetWidth = el.scrollWidth / 3
    if (singleSetWidth > 0) {
      if (el.scrollLeft >= singleSetWidth * 2) {
        el.scrollLeft -= singleSetWidth
      } else if (el.scrollLeft <= 5) {
        el.scrollLeft += singleSetWidth
      }
    }
  }

  // Duplicate list 3 times to allow 100% seamless infinite loop without snapping back
  const displayCategories = categories.length > 0 ? [...categories, ...categories, ...categories] : []

  return (
    <section className="qg-section qg-categories" id="categories">
      <div className="qg-container">
        <div className="qg-cat-headrow">
          <h2 className="qg-cat-title">{sectionTitle}</h2>
        </div>
        <div
          className="qg-cat-wrap"
          onMouseEnter={() => { isHovered.current = true }}
          onMouseLeave={() => { isHovered.current = false }}
          onTouchStart={() => { isHovered.current = true }}
          onTouchEnd={() => { setTimeout(() => { isHovered.current = false }, 1200) }}
        >
          <button className="qg-cat-arrow l" onClick={() => move(-1)} aria-label="Previous categories">‹</button>
          <div className="qg-cat-rail" ref={rail} onScroll={handleScroll}>
            {displayCategories.map((c, idx) => (
              <button
                key={`${c.slug}-${idx}`}
                className="qg-cat"
                onClick={() => onShopCategory ? onShopCategory(c.name) : navigate(`/category/${c.slug}`)}
                aria-label={`Shop ${c.name}`}
              >
                <div className="qg-cat-circle-wrap">
                  <img src={c.image} alt={c.name} loading="lazy" width="105" height="105" />
                </div>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
          <button className="qg-cat-arrow r" onClick={() => move(1)} aria-label="Next categories">›</button>
        </div>
      </div>
    </section>
  )
}

/**
 * 2. Independent Trust / Service Badges Bar Section
 */
export function TrustBarSection({ section }) {
  const content = section?.content || {}
  const trustData = content.trust_bar || {}
  const rawItems = trustData.items || content.items || TRUST_BADGES
  const bgColor = trustData.bgColor || section?.color || 'transparent'
  const textColor = trustData.textColor || '#1e293b'

  const items = Array.isArray(rawItems) && rawItems.length > 0 ? rawItems : TRUST_BADGES

  return (
    <section
      className="qg-trust"
      id="HomePageFooterIcons"
      style={{ backgroundColor: bgColor !== 'transparent' ? bgColor : undefined }}
    >
      <div className="qg-container">
        {trustData.heading && (
          <div className="text-center mb-3">
            <h3 className="fw-bold fs-5 mb-0" style={{ color: textColor }}>{trustData.heading}</h3>
          </div>
        )}
        <div className="qg-trust-row">
          {items.map((t, idx) => (
            <div className="qg-trust-item" key={t.title || idx}>
              {t.image ? (
                <img src={t.image} alt={t.title || 'Trust item'} loading="lazy" width="46" height="46" />
              ) : (
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '6px' }}>
                  {t.icon || '✨'}
                </span>
              )}
              <p style={{ color: textColor }}>{t.title}</p>
              {t.subtitle && <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{t.subtitle}</small>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * 3. Backward Compatible Combined Component
 */
export default function CategoryStrip() {
  return (
    <>
      <CategoryCirclesSection />
      <TrustBarSection />
    </>
  )
}
