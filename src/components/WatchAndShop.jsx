import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useCart } from '../context/CartContext'
import { useStoreData } from '../context/StoreDataContext'
import { productPath } from '../content'

export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.trim().match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i)
  return match ? match[1] : null
}

function ReelCard({ item, idx, associatedProduct, onAddToCart }) {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setIsInView(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.25 }
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  const ytId = item.videoId || extractYouTubeId(item.youtubeUrl || item.video)
  const targetProduct = associatedProduct || item
  const displayName = item.title || item.name || (associatedProduct ? associatedProduct.name : 'Featured Video Product')
  const displayImage = item.image || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : (associatedProduct ? associatedProduct.image : ''))
  const price = Number(item.price || associatedProduct?.price || 0)
  const oldPrice = Number(item.oldPrice || associatedProduct?.oldPrice || 0)
  const discount = item.discount || (oldPrice > price && price > 0 ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0)

  const handleOpenProduct = (e) => {
    e?.stopPropagation?.()
    navigate(productPath(targetProduct))
  }

  // Active autoplay when mouse hovers on desktop or scrolled into view on mobile
  const shouldPlayVideo = isHovered || isInView

  return (
    <article
      className={`qg-reel ${isHovered ? 'is-hovered' : ''}`}
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleOpenProduct}
      style={{ cursor: 'pointer' }}
    >
      <div className="qg-reel-media">
        {ytId ? (
          shouldPlayVideo ? (
            <div className="qg-reel-video-container">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0`}
                title={displayName}
                className="qg-reel-iframe"
                loading="lazy"
                tabIndex="-1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          ) : (
            <img
              src={displayImage}
              alt={displayName}
              loading="lazy"
              onError={e => {
                e.target.src = '/images/banner-placeholder.webp'
              }}
            />
          )
        ) : item.video ? (
          <video
            src={item.video}
            poster={displayImage}
            muted
            loop
            playsInline
            autoPlay={shouldPlayVideo}
            preload="metadata"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <img src={displayImage} alt={displayName} loading="lazy" />
        )}

        {discount > 0 && <span className="qg-reel-off">{discount}% OFF</span>}

        <button
          className="qg-reel-play"
          type="button"
          onClick={handleOpenProduct}
          aria-label={`Open product page for ${displayName}`}
        >
          ▶
        </button>
      </div>

      <div className="qg-reel-info" onClick={handleOpenProduct}>
        <img src={displayImage} alt={displayName} loading="lazy" width="48" height="48" />
        <span>
          <b>{displayName}</b>
          {price > 0 && (
            <span className="qg-reel-price">
              {oldPrice > price && <del>Rs. {oldPrice.toLocaleString()}</del>}
              <em>Rs. {price.toLocaleString()}</em>
            </span>
          )}
        </span>
      </div>

      <div className="qg-reel-actions-row" onClick={e => e.stopPropagation()}>
        <button
          className="qg-reel-view-btn"
          type="button"
          onClick={handleOpenProduct}
        >
          View Details
        </button>
        {(associatedProduct || (item.name && item.price)) && (
          <button
            className="qg-reel-add-btn"
            type="button"
            onClick={() => onAddToCart(associatedProduct || item)}
          >
            Add to Cart
          </button>
        )}
      </div>
    </article>
  )
}

export default function WatchAndShop({ section, onShopAll }) {
  const { watchShop = [], products = [] } = useStoreData()
  const rail = useRef(null)
  const { add } = useCart()
  const scroll = dir => rail.current?.scrollBy({ left: dir * 520, behavior: 'smooth' })

  // Resolve section items or fallback to legacy watchShop
  const sectionContent = section?.content?.reels || {}
  const rawItems = (Array.isArray(sectionContent.items) && sectionContent.items.length > 0)
    ? sectionContent.items
    : watchShop

  // Filter active items and respect maxVideos if specified
  let items = rawItems.filter(item => item.active !== false)
  if (sectionContent.maxVideos && Number(sectionContent.maxVideos) > 0) {
    items = items.slice(0, Number(sectionContent.maxVideos))
  }

  if (!items.length) return null

  const heading = section?.title || sectionContent.heading || 'Watch & Shop'
  const subtitle = sectionContent.subtitle || 'In motion'
  const description = sectionContent.description || ''

  // Associated product lookup helper
  const getAssociatedProduct = (item) => {
    if (!item) return null
    if (item.productId) {
      const match = products.find(p => String(p.id) === String(item.productId))
      if (match) return match
    }
    return null
  }

  return (
    <section className="qg-reels" id={`sec-${section?.id || 'watch-shop'}`}>
      <div className="qg-container">
        <div className="qg-reels-head">
          <div>
            <small>{subtitle}</small>
            <h2>{heading}</h2>
            {description && <p className="text-muted small mt-1 mb-0">{description}</p>}
          </div>
          <div className="qg-reels-nav">
            <button onClick={() => scroll(-1)} aria-label="Previous videos">‹</button>
            <button onClick={() => scroll(1)} aria-label="Next videos">›</button>
          </div>
        </div>

        <div className="qg-reels-rail" ref={rail}>
          {items.map((item, idx) => {
            const associatedProduct = getAssociatedProduct(item)
            return (
              <ReelCard
                key={item.id || item.videoId || idx}
                item={item}
                idx={idx}
                associatedProduct={associatedProduct}
                onAddToCart={(prod) => add(prod)}
              />
            )
          })}
        </div>

        <div className="qg-reels-foot">
          <button className="qg-pill-outline" onClick={onShopAll}>Shop all products</button>
        </div>
      </div>
    </section>
  )
}
