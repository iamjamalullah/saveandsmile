import { useRef, useState } from 'react'
import { useCart } from '../context/CartContext'
import { useStoreData } from '../context/StoreDataContext'

export default function WatchAndShop({ onShopAll }) {
  const { watchShop = [] } = useStoreData()
  const rail = useRef(null)
  const [muted, setMuted] = useState(true)
  const { add, setQuickView } = useCart()
  const scroll = dir => rail.current?.scrollBy({ left: dir * 520, behavior: 'smooth' })

  if (!watchShop.length) return null

  return (
    <section className="qg-reels" id="watch-shop">
      <div className="qg-container">
        <div className="qg-reels-head">
          <div>
            <small>In motion</small>
            <h2>Watch &amp; Shop</h2>
          </div>
          <div className="qg-reels-nav">
            <button onClick={() => scroll(-1)} aria-label="Previous videos">‹</button>
            <button onClick={() => scroll(1)} aria-label="Next videos">›</button>
          </div>
        </div>

        <div className="qg-reels-rail" ref={rail}>
          {watchShop.map(item => {
            const discount = item.discount || (item.oldPrice > item.price
              ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100) : 0)
            return (
              <article className="qg-reel" key={item.id}>
                <div className="qg-reel-media">
                  <video
                    src={item.video}
                    poster={item.image}
                    muted={muted}
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                    onMouseEnter={e => e.currentTarget.play().catch(() => {})}
                  />
                  <button className="qg-reel-sound" onClick={() => setMuted(m => !m)} aria-label={muted ? 'Unmute video' : 'Mute video'}>
                    {muted ? '🔇' : '🔊'}
                  </button>
                  {discount > 0 && <span className="qg-reel-off">{discount}% OFF</span>}
                  <button className="qg-reel-play" onClick={() => setQuickView(item)} aria-label={`View ${item.name}`}>▶</button>
                </div>
                <button className="qg-reel-info" onClick={() => setQuickView(item)}>
                  <img src={item.image} alt={item.name} loading="lazy" width="48" height="48" />
                  <span>
                    <b>{item.name}</b>
                    <span className="qg-reel-price">
                      <del>Rs. {item.oldPrice.toLocaleString()}</del>
                      <em>Rs. {item.price.toLocaleString()}</em>
                    </span>
                  </span>
                </button>
                <button className="qg-reel-add" onClick={() => add(item)}>Add to cart</button>
              </article>
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
