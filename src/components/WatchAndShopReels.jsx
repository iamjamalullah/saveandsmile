import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function WatchAndShopReels() {
  const { reels, addToCart, storeConfig } = useStore();
  const trackRef = useRef(null);
  const navigate = useNavigate();

  const scrollReels = (dir) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  const handleVideoHover = (e) => {
    e.target.play().catch(() => {});
  };

  const handleVideoLeave = (e) => {
    e.target.pause();
  };

  return (
    <section className="reels-section" id="HomePageReels">
      <div className="site-container">
        <div className="qadri-reels-head">
          <div>
            <span className="qadri-reels-kicker">IN MOTION</span>
            <h2 className="qadri-reels-title">Watch &amp; Shop</h2>
          </div>
          <div className="qadri-reels-nav">
            <button type="button" onClick={() => scrollReels(-1)} aria-label="Previous videos">‹</button>
            <button type="button" onClick={() => scrollReels(1)} aria-label="Next videos">›</button>
          </div>
        </div>

        {/* Video Reels Track */}
        <div className="reels-track" id="reelsTrack" ref={trackRef}>
          {reels.map(reel => (
            <article key={reel.id} className="qadri-reel-card">
              <div className="qadri-reel-media">
                <video 
                  src={reel.video} 
                  loop 
                  muted 
                  playsInline 
                  preload="metadata"
                  onMouseEnter={handleVideoHover}
                  onMouseLeave={handleVideoLeave}
                  onClick={(e) => {
                    if (e.target.paused) e.target.play();
                    else e.target.pause();
                  }}
                />
                <button 
                  type="button" 
                  className="qadri-reel-sound"
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = e.currentTarget.previousElementSibling;
                    if (video) {
                      video.muted = !video.muted;
                      e.currentTarget.innerHTML = video.muted ? '🔇 Mute' : '🔊 Sound';
                    }
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 5L6 9H3v6h3l5 4V5z"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                  Mute
                </button>
              </div>

              <div className="qadri-reel-info">
                <div className="qadri-reel-product">
                  <img src={reel.thumb} alt={reel.title} loading="lazy" />
                  <div className="qadri-reel-meta">
                    <h4>{reel.title}</h4>
                    <div className="qadri-reel-price">
                      <span>{storeConfig.currency || 'Rs.'} {reel.price.toLocaleString()}</span>
                      {reel.originalPrice && <del>{storeConfig.currency || 'Rs.'} {reel.originalPrice.toLocaleString()}</del>}
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="qadri-reel-shop-btn"
                  onClick={() => {
                    addToCart({
                      id: `reel-${reel.id}`,
                      title: reel.title,
                      price: reel.price,
                      originalPrice: reel.originalPrice,
                      image: reel.thumb,
                      code: reel.code
                    }, 1);
                  }}
                >
                  Shop Now ➔
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
