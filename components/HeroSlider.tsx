'use client';

import React, { useState, useEffect } from 'react';
import { HeroSlide } from '@/lib/types';
import { getClientHeroSlides } from '@/lib/store';

export default function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    // 1. Initial load from client storage or authentic defaults
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

    // 2. Listen to real-time sync events from Live Editor & Admin CRM
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

  // Auto-slide interval
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [slides]);

  const prevSlide = () => {
    setCurrentIdx(prev => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentIdx(prev => (prev + 1) % slides.length);
  };

  if (slides.length === 0) return null;

  return (
    <section className="hero-slider-section" id="heroSliderSection">
      <div className="site-container">
        <div className="slider-container" id="heroSliderContainer">
          {slides.map((slide, idx) => {
            const isActive = idx === currentIdx;
            const imgSrc = slide.image.startsWith('http') || slide.image.startsWith('/')
              ? slide.image
              : `/${slide.image}`;

            return (
              <div
                key={slide.id || idx}
                className={`slide-item ${isActive ? 'active' : ''}`}
                data-index={idx}
              >
                <a href={slide.link || '#products'} style={{ display: 'block', width: '100%', height: '100%' }}>
                  <img
                    src={imgSrc}
                    alt={slide.title || 'Save & Smile Wholesale Banner'}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </a>
              </div>
            );
          })}

          {/* Slider Left & Right Controls */}
          {slides.length > 1 && (
            <div className="slider-controls">
              <button
                type="button"
                className="slider-arrow"
                onClick={prevSlide}
                title="Previous Slide"
              >
                ‹
              </button>
              <button
                type="button"
                className="slider-arrow"
                onClick={nextSlide}
                title="Next Slide"
              >
                ›
              </button>
            </div>
          )}

          {/* Dots Indicator */}
          {slides.length > 1 && (
            <div className="slider-dots" id="sliderDots">
              {slides.map((_, i) => (
                <div
                  key={i}
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
