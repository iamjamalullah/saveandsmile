'use client';

import React, { useState, useEffect } from 'react';
import { HeroSlide } from '@/lib/types';
import { getClientHeroSlides } from '@/lib/store';

export default function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    // Initial load from client storage or defaults
    setSlides(getClientHeroSlides());

    function fetchLiveHeroBanners() {
      fetch('/api/home-customization', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data?.config?.hero_slides && Array.isArray(data.config.hero_slides) && data.config.hero_slides.length > 0) {
            setSlides(data.config.hero_slides);
            try {
              localStorage.setItem('qadri_hero_slides', JSON.stringify(data.config.hero_slides));
            } catch (e) {}
          }
        })
        .catch(() => {});
    }

    fetchLiveHeroBanners();

    // Listen to real-time sync events from Live Editor & Admin CRM
    function handleStorageOrSync(e: any) {
      if (e.data && e.data.type === 'qadri_sync_hero_slides') {
        setSlides(e.data.slides);
      } else {
        setSlides(getClientHeroSlides());
        fetchLiveHeroBanners();
      }
    }

    window.addEventListener('message', handleStorageOrSync);
    window.addEventListener('storage', handleStorageOrSync);
    window.addEventListener('qadri_hero_slides_updated', handleStorageOrSync);

    return () => {
      window.removeEventListener('message', handleStorageOrSync);
      window.removeEventListener('storage', handleStorageOrSync);
      window.removeEventListener('qadri_hero_slides_updated', handleStorageOrSync);
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [slides]);

  if (slides.length === 0) return null;

  return (
    <section className="hero-slider-wrap">
      <div className="site-container">
        <div className="hero-slider-viewport">
          {slides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              className={`hero-slide-item ${idx === currentIdx ? 'active' : ''}`}
              style={{
                display: idx === currentIdx ? 'block' : 'none',
                position: 'relative'
              }}
            >
              <a href={slide.link || '#products'} style={{ display: 'block', width: '100%', height: '100%' }}>
                <img
                  src={slide.image.startsWith('http') || slide.image.startsWith('/') ? slide.image : `/${slide.image}`}
                  alt={slide.title}
                  className="hero-slide-img"
                  style={{ width: '100%', borderRadius: '14px', objectFit: 'cover' }}
                />
              </a>
            </div>
          ))}

          {/* Dots Indicator */}
          {slides.length > 1 && (
            <div className="slider-dots-container">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIdx(i)}
                  className={`slider-dot ${i === currentIdx ? 'active' : ''}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
