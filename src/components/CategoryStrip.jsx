import { useEffect, useRef } from 'react'
import { TRUST_BADGES } from '../data'
import { useStoreData } from '../context/StoreDataContext'
import { useNavigate } from 'react-router'

export default function CategoryStrip() {
  const { categories = [] } = useStoreData()
  const navigate = useNavigate()
  const rail = useRef(null)
  const isHovered = useRef(false)

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
    <>
      <section className="qg-section qg-categories" id="categories">
        <div className="qg-container">
          <div className="qg-cat-headrow">
            <h2 className="qg-cat-title">Shop By Categories</h2>
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
                  onClick={() => navigate(`/category/${c.slug}`)}
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

      <section className="qg-trust" id="HomePageFooterIcons">
        <div className="qg-container">
          <div className="qg-trust-row">
            {TRUST_BADGES.map(t => (
              <div className="qg-trust-item" key={t.title}>
                <img src={t.image} alt={t.title} loading="lazy" width="46" height="46" />
                <p>{t.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
