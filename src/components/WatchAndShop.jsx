import { useRef, useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useStoreData } from '../context/StoreDataContext'

export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.trim().match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i)
  return match ? match[1] : null
}

export default function WatchAndShop({ section, onShopAll }) {
  const { watchShop = [], products = [] } = useStoreData()
  const rail = useRef(null)
  const [muted, setMuted] = useState(true)
  const [activeYtVideo, setActiveYtVideo] = useState(null)
  const { add, setQuickView } = useCart()
  const scroll = dir => rail.current?.scrollBy({ left: dir * 520, behavior: 'smooth' })

  // Keyboard listener to close modal on Escape
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') setActiveYtVideo(null)
    }
    if (activeYtVideo) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeYtVideo])

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
            const ytId = item.videoId || extractYouTubeId(item.youtubeUrl)
            const associatedProduct = getAssociatedProduct(item)

            const displayName = item.title || item.name || (associatedProduct ? associatedProduct.name : 'Featured Gadget')
            const displayImage = item.image || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : (associatedProduct ? associatedProduct.image : ''))
            const price = Number(associatedProduct?.price || item.price || 0)
            const oldPrice = Number(associatedProduct?.oldPrice || item.oldPrice || 0)
            const discount = item.discount || (oldPrice > price && price > 0 ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0)

            const handleCardClick = () => {
              if (ytId) {
                setActiveYtVideo({ ...item, videoId: ytId, title: displayName, associatedProduct })
              } else if (associatedProduct) {
                setQuickView(associatedProduct)
              } else if (item.name && item.price) {
                setQuickView(item)
              }
            }

            return (
              <article className="qg-reel" key={item.id || ytId || idx}>
                <div className="qg-reel-media" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
                  {ytId ? (
                    <img
                      src={displayImage}
                      alt={displayName}
                      loading="lazy"
                      onError={e => {
                        e.target.src = 'https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp'
                      }}
                    />
                  ) : item.video ? (
                    <video
                      src={item.video}
                      poster={displayImage}
                      muted={muted}
                      loop
                      playsInline
                      autoPlay
                      preload="metadata"
                      onMouseEnter={e => e.currentTarget.play().catch(() => {})}
                    />
                  ) : (
                    <img src={displayImage} alt={displayName} loading="lazy" />
                  )}

                  {item.video && !ytId && (
                    <button
                      className="qg-reel-sound"
                      onClick={e => { e.stopPropagation(); setMuted(m => !m); }}
                      aria-label={muted ? 'Unmute video' : 'Mute video'}
                    >
                      {muted ? '🔇' : '🔊'}
                    </button>
                  )}

                  {discount > 0 && <span className="qg-reel-off">{discount}% OFF</span>}
                  <button
                    className="qg-reel-play"
                    onClick={e => { e.stopPropagation(); handleCardClick(); }}
                    aria-label={`Play ${displayName}`}
                  >
                    ▶
                  </button>
                </div>

                <button className="qg-reel-info" onClick={handleCardClick}>
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
                </button>

                {(associatedProduct || (item.name && item.price)) && (
                  <button
                    className="qg-reel-add"
                    onClick={() => add(associatedProduct || item)}
                  >
                    Add to cart
                  </button>
                )}
              </article>
            )
          })}
        </div>

        <div className="qg-reels-foot">
          <button className="qg-pill-outline" onClick={onShopAll}>Shop all products</button>
        </div>
      </div>

      {/* YouTube Responsive Modal Player */}
      {activeYtVideo && (
        <div className="qg-yt-backdrop" onClick={() => setActiveYtVideo(null)} role="dialog" aria-modal="true">
          <div className="qg-yt-dialog" onClick={e => e.stopPropagation()}>
            <button className="qg-yt-close" onClick={() => setActiveYtVideo(null)} aria-label="Close video player">✕</button>
            <div className="qg-yt-player-box">
              <iframe
                src={`https://www.youtube.com/embed/${activeYtVideo.videoId}?autoplay=1&rel=0`}
                title={activeYtVideo.title || 'YouTube Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="qg-yt-footer">
              <div className="qg-yt-meta">
                <h4>{activeYtVideo.title}</h4>
                {activeYtVideo.description && (
                  <p className="text-secondary small mb-0 mt-1">{activeYtVideo.description}</p>
                )}
              </div>
              {activeYtVideo.associatedProduct && (
                <div className="qg-yt-product">
                  <img
                    src={activeYtVideo.associatedProduct.image || activeYtVideo.associatedProduct.images?.[0]}
                    alt={activeYtVideo.associatedProduct.name}
                  />
                  <div className="qg-yt-product-info">
                    <span className="qg-yt-product-title">{activeYtVideo.associatedProduct.name}</span>
                    <span className="qg-yt-product-price">Rs. {Number(activeYtVideo.associatedProduct.price).toLocaleString()}</span>
                  </div>
                  <button
                    className="btn btn-sm btn-success ms-2"
                    onClick={() => {
                      add(activeYtVideo.associatedProduct)
                      setActiveYtVideo(null)
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
