import React from 'react';
import { useStore } from '../context/StoreContext';

export default function CategoryStrip() {
  const { categories, setCurrentCategory } = useStore();

  const handleCategoryClick = (catId) => {
    setCurrentCategory(catId);
    const elem = document.getElementById('products');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Duplicate items for continuous smooth marquee
  const displayCategories = [...categories, ...categories];

  return (
    <section className="cat-strip-section" id="shopSliderSection">
      <div className="site-container">
        <h2 className="cat-section-title">Shop By Categories</h2>
        <div className="cat-marquee-wrapper">
          <div className="cat-marquee-track" id="categoryStrip">
            {displayCategories.map((cat, idx) => (
              <div 
                key={`${cat.id}-${idx}`} 
                className="cat-round-card"
                onClick={() => handleCategoryClick(cat.id)}
              >
                <div className="cat-round-img-wrap">
                  <img src={cat.icon} alt={cat.name} loading="lazy" />
                </div>
                <span className="cat-round-name">{cat.name}</span>
                <span className="cat-round-count">{cat.count} Items</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
