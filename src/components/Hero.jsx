import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useStoreData } from '../context/StoreDataContext'
import HeroSlideItem, { getResolvedSlideData } from './HeroSlideItem'

const DEFAULT_AUTOPLAY_MS = 5200

export default function Hero() {
  const { heroSlides = [] } = useStoreData()
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hidden, setHidden] = useState(false)
  const startX = useRef(null)

  const sortedSlides = useMemo(() => {
    return [...heroSlides].sort((a, b) => (Number(a.order) || Number(a.id) || 0) - (Number(b.order) || Number(b.id) || 0))
  }, [heroSlides])

  const count = sortedSlides.length

  const go = useCallback(n => {
    if (!count) return
    setI((n + count) % count)
  }, [count])

  useEffect(() => {
    if (i >= count) setI(0)
  }, [count, i])

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (paused || hidden || count < 2) return undefined
    const activeSlide = sortedSlides[i]
    const resolved = activeSlide ? getResolvedSlideData(activeSlide) : null
    const duration = resolved?.animation?.duration || DEFAULT_AUTOPLAY_MS

    const timer = window.setInterval(() => setI(v => (v + 1) % count), duration)
    return () => window.clearInterval(timer)
  }, [paused, hidden, count, i, sortedSlides])

  if (!count) {
    return <section className="qg-hero qg-hero-skeleton" aria-label="Featured offers loading"><span /></section>
  }

  const onKeyDown = e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1) }
  }

  return (
    <section
      className="qg-hero"
      aria-roledescription="carousel"
      aria-label="Featured offers"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="qg-hero-track"
        style={{ transform: `translate3d(-${i * 100}%, 0, 0)` }}
        onTouchStart={e => { startX.current = e.touches[0].clientX }}
        onTouchCancel={() => { startX.current = null }}
        onTouchEnd={e => {
          if (startX.current == null) return
          const dx = e.changedTouches[0].clientX - startX.current
          if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1))
          startX.current = null
        }}
      >
        {sortedSlides.map((s, idx) => {
          const isCurrent = idx === i
          const resolved = getResolvedSlideData(s)
          const hasCta = resolved.primaryCta.show && resolved.primaryCta.text

          return (
            <div
              className={`qg-hero-slide ${isCurrent ? 'is-active' : ''}`}
              key={s.id || s.image || idx}
              aria-hidden={!isCurrent}
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${count}`}
            >
              {s.link && !hasCta ? (
                <Link to={s.link} style={{ display: 'block', width: '100%', height: '100%', textDecoration: 'none' }}>
                  <HeroSlideItem slide={s} isActive={isCurrent} priority={idx === 0} device="auto" />
                </Link>
              ) : (
                <HeroSlideItem slide={s} isActive={isCurrent} priority={idx === 0} device="auto" />
              )}
            </div>
          )
        })}
      </div>

      <button className="qg-hero-arrow l" onClick={() => go(i - 1)} aria-label="Previous slide">‹</button>
      <button className="qg-hero-arrow r" onClick={() => go(i + 1)} aria-label="Next slide">›</button>

      <div className="qg-hero-dots" role="tablist" aria-label="Choose a slide">
        {sortedSlides.map((s, idx) => (
          <button
            key={s.id || s.image || idx}
            role="tab"
            aria-selected={idx === i}
            className={idx === i ? 'on' : ''}
            onClick={() => setI(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      <div className={`qg-hero-progress ${paused ? 'is-paused' : ''}`} key={`${i}-${paused}`} aria-hidden="true" />
    </section>
  )
}
