import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';

export default function HeroSlider() {
  const { banners } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!banners || banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners]);

  const prevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % banners.length);
  };

  return (
    <section className="hero-slider-section" id="heroSliderSection">
      <div className="site-container">
        <div className="slider-container" id="heroSliderContainer">
          {banners.map((banner, index) => (
            <div 
              key={banner.id}
              className={`slide-item ${index === currentSlide ? 'active' : ''}`}
              data-index={index}
            >
              <a href={banner.link || "#products"}>
                <img 
                  src={banner.image} 
                  alt={banner.title} 
                  loading={index === 0 ? 'eager' : 'lazy'} 
                />
              </a>
            </div>
          ))}
        </div>

        <div className="slider-controls">
          <button className="slider-arrow" onClick={prevSlide} title="Previous Slide">‹</button>
          <button className="slider-arrow" onClick={nextSlide} title="Next Slide">›</button>
        </div>

        <div className="slider-dots" id="sliderDots">
          {banners.map((_, index) => (
            <div 
              key={index}
              className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
