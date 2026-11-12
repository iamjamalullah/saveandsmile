import { useEffect, useRef } from 'react'
import { useStoreData } from '../context/StoreDataContext'
import ProductCard from './ProductCard'

export default function ProductSection({ section, onViewAll, onSeeMore }) {
  const { products = [] } = useStoreData()

  // New Arrivals slider refs
  const railNew = useRef(null)
  const isHoveredNew = useRef(false)

  // Hot Selling dual-row counter-moving slider refs (Mobile View)
  const railHot1 = useRef(null)
  const railHot2 = useRef(null)
  const isHoveredHot = useRef(false)

  const effectiveGroup = section?.group || section?.content?.group || (
    section?.title?.toLowerCase().includes('new arrival') ? 'new'
    : section?.title?.toLowerCase().includes('hot selling') ? 'hot'
    : section?.title?.toLowerCase().includes('home essential') ? 'home'
    : section?.title?.toLowerCase().includes('you may also like') ? 'like'
    : (section?.title?.toLowerCase().includes('fragrance') || section?.title?.toLowerCase().includes('perfume')) ? 'perfume'
    : section?.title?.toLowerCase().includes('trending') ? 'trending'
    : section?.title?.toLowerCase().includes('jewelry') ? 'jewelry'
    : section?.title?.toLowerCase().includes('watch') ? 'watch'
    : null
  )

  const effectiveCategory = section?.category || section?.content?.category || null
  const effectiveCategoryId = section?.categoryId || section?.content?.categoryId || null

  const items = products.filter(p => {
    if (effectiveCategory && (p.category === effectiveCategory || p.categorySlug === effectiveCategory)) return true
    if (effectiveCategoryId && (p.categoryId === effectiveCategoryId || p.category_id === effectiveCategoryId)) return true
    if (effectiveGroup && p.group === effectiveGroup) return true
    return false
  })

  const isNewArrivals = effectiveGroup === 'new'
  const isHotSelling = effectiveGroup === 'hot' || section?.id === '2' || (section?.title && section.title.toLowerCase().includes('hot selling'))
  const isFourGrid = !isNewArrivals && !isHotSelling

  // For New Arrivals: duplicate list 3 times for endless seamless looping conveyor belt
  const displayItems = isFourGrid
    ? items.slice(0, 4)
    : isNewArrivals
      ? (items.length > 1 ? [...items, ...items, ...items] : items)
      : items

  // Hot Selling Rows for Mobile Dual Slider
  const hotRow1Items = items.length > 1 ? [...items, ...items, ...items] : items
  const offsetItems = items.length >= 4
    ? [items[2], items[3], items[0], items[1]]
    : [...items].reverse()
  const hotRow2Items = items.length > 1 ? [...offsetItems, ...offsetItems, ...offsetItems] : items

  // ── New Arrivals Animation Loop (Right to Left, identical responsiveness to CategoryStrip) ──
  useEffect(() => {
    if (!isNewArrivals || items.length < 2) return undefined
    const el = railNew.current
    if (!el) return undefined

    let animationFrameId
    const speed = 0.75 // smooth gentle drift matching Shop By Category

    const step = () => {
      if (!isHoveredNew.current && el) {
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
  }, [isNewArrivals, items.length])

  // ── Hot Selling Dual Slider Animation Loop (Row 1 Left, Row 2 Right, instant pause & resume) ──
  useEffect(() => {
    if (!isHotSelling || items.length < 2) return undefined

    const el1 = railHot1.current
    const el2 = railHot2.current

    // Initialize Row 2 to middle set so it has room to move left-to-right (decreasing scrollLeft)
    if (el2) {
      const singleSetWidth2 = el2.scrollWidth / 3
      if (singleSetWidth2 > 0 && el2.scrollLeft <= 10) {
        el2.scrollLeft = singleSetWidth2
      }
    }

    let animationFrameId
    const speed = 0.75 // smooth drift matching CategoryStrip

    const stepHot = () => {
      if (!isHoveredHot.current) {
        // Row 1: Right to Left (scrollLeft increases)
        if (el1) {
          const singleSetWidth1 = el1.scrollWidth / 3
          if (singleSetWidth1 > 0 && el1.scrollLeft >= singleSetWidth1 * 2) {
            el1.scrollLeft -= singleSetWidth1
          } else {
            el1.scrollLeft += speed
          }
        }

        // Row 2: Left to Right (scrollLeft decreases)
        if (el2) {
          const singleSetWidth2 = el2.scrollWidth / 3
          if (singleSetWidth2 > 0 && el2.scrollLeft <= 5) {
            el2.scrollLeft += singleSetWidth2
          } else {
            el2.scrollLeft -= speed
          }
        }
      }

      animationFrameId = requestAnimationFrame(stepHot)
    }

    animationFrameId = requestAnimationFrame(stepHot)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isHotSelling, items.length])

  const handleScrollNew = () => {
    const el = railNew.current
    if (!el || items.length < 2) return
    const singleSetWidth = el.scrollWidth / 3
    if (singleSetWidth > 0) {
      if (el.scrollLeft >= singleSetWidth * 2) {
        el.scrollLeft -= singleSetWidth
      } else if (el.scrollLeft <= 5) {
        el.scrollLeft += singleSetWidth
      }
    }
  }

  const scroll = dir => {
    if (!railNew.current) return
    isHoveredNew.current = true
    railNew.current.scrollBy({ left: dir * (railNew.current.clientWidth * 0.8), behavior: 'smooth' })
    setTimeout(() => { isHoveredNew.current = false }, 500)
  }

  if (!items.length) {
    if (typeof window !== 'undefined' && console && console.warn) {
      console.warn('[ProductSection] No matching products found for section:', section?.id, section?.title, 'effectiveGroup:', effectiveGroup, 'effectiveCategory:', effectiveCategory)
    }
    return null
  }

  return (
    <section className="qg-prod-section" style={{ backgroundImage: `url(${section.bg})` }}>
      <div className="qg-container">
        <div className="qg-sec-head">
          <h2 className="qg-sec-title" style={{ color: section.color }}>
            <span className="qg-line" style={{ background: section.color }} />
            <button type="button" className="qg-sec-link" onClick={() => onViewAll?.(effectiveGroup)}>{section.title}</button>
            <span className="qg-line" style={{ background: section.color }} />
          </h2>
          {section.viewAll && !isNewArrivals && (
            <button className="qg-viewall" onClick={() => onViewAll?.(section.group)}>View All</button>
          )}
        </div>

        {isHotSelling ? (
          <>
            {/* Desktop: 4 products in a row */}
            <div className="qg-four-grid qg-hot-desktop">
              {items.slice(0, 4).map((p, idx) => (
                <ProductCard key={`${p.id}-${idx}`} product={p} context="home" />
              ))}
            </div>

            {/* Mobile View: Two counter-moving conveyor rows (Instant pause on touch/hover, instant resume on leave) */}
            <div
              className="qg-hot-mobile-dual"
              onMouseEnter={() => { isHoveredHot.current = true }}
              onMouseLeave={() => { isHoveredHot.current = false }}
              onTouchStart={() => { isHoveredHot.current = true }}
              onTouchEnd={() => { isHoveredHot.current = false }}
              onTouchCancel={() => { isHoveredHot.current = false }}
            >
              {/* Row 1: Right-to-Left (moves left) */}
              <div
                className="qg-rail-wrap"
                onMouseEnter={() => { isHoveredHot.current = true }}
                onMouseLeave={() => { isHoveredHot.current = false }}
                onTouchStart={() => { isHoveredHot.current = true }}
                onTouchEnd={() => { isHoveredHot.current = false }}
                onTouchCancel={() => { isHoveredHot.current = false }}
              >
                <div className="qg-rail-slider" ref={railHot1}>
                  {hotRow1Items.map((p, idx) => (
                    <ProductCard key={`h1-${p.id}-${idx}`} product={p} context="home" />
                  ))}
                </div>
              </div>

              {/* Row 2: Left-to-Right (moves right) */}
              <div
                className="qg-rail-wrap"
                onMouseEnter={() => { isHoveredHot.current = true }}
                onMouseLeave={() => { isHoveredHot.current = false }}
                onTouchStart={() => { isHoveredHot.current = true }}
                onTouchEnd={() => { isHoveredHot.current = false }}
                onTouchCancel={() => { isHoveredHot.current = false }}
              >
                <div className="qg-rail-slider" ref={railHot2}>
                  {hotRow2Items.map((p, idx) => (
                    <ProductCard key={`h2-${p.id}-${idx}`} product={p} context="home" />
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : isFourGrid ? (
          /* Standard 4-Product Grid: Desktop 4 in a row, Mobile 2x2 grid */
          <div className="qg-four-grid">
            {displayItems.map((p, idx) => (
              <ProductCard key={`${p.id}-${idx}`} product={p} />
            ))}
          </div>
        ) : (
          /* New Arrivals Infinite Conveyor Slider (Instant pause on touch/hover, instant resume on leave) */
          <div
            className="qg-rail-wrap"
            onMouseEnter={() => { isHoveredNew.current = true }}
            onMouseLeave={() => { isHoveredNew.current = false }}
            onTouchStart={() => { isHoveredNew.current = true }}
            onTouchEnd={() => { isHoveredNew.current = false }}
            onTouchCancel={() => { isHoveredNew.current = false }}
          >
            <button className="qg-rail-arrow l" onClick={() => scroll(-1)} aria-label="Previous products">‹</button>
            <div className="qg-rail-slider" ref={railNew} onScroll={handleScrollNew}>
              {displayItems.map((p, idx) => (
                <ProductCard key={`${p.id}-${idx}`} product={p} context="home" />
              ))}
            </div>
            <button className="qg-rail-arrow r" onClick={() => scroll(1)} aria-label="Next products">›</button>
          </div>
        )}

        {/* Compact, beautiful "See All Products" button */}
        <div className="qg-see-more">
          <button onClick={() => (onViewAll ? onViewAll(effectiveGroup) : onSeeMore?.())}>
            See All Products <span>→</span>
          </button>
        </div>
      </div>
    </section>
  )
}
