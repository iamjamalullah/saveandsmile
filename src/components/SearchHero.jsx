import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

export default function SearchHero() {
  const [query, setQuery] = useState('');
  const { setCurrentCategory } = useStore();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const applyQuickSearch = (catKey) => {
    setQuery(catKey);
    const lower = catKey.toLowerCase();
    if (lower.includes('storage')) setCurrentCategory('storage');
    else if (lower.includes('watch')) setCurrentCategory('smartwatches');
    else if (lower.includes('bottle')) setCurrentCategory('bottles');
    else if (lower.includes('bag')) setCurrentCategory('accessories');
    else if (lower.includes('massager')) setCurrentCategory('massager');
    else setCurrentCategory('all');

    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="search-hero-section" id="HomePageBuilder">
      <div className="site-container">
        <div className="search-hero-card">
          <div className="search-hero-layout">
            
            <div className="search-hero-copy">
              <span className="tag-label">QUICK FINDER</span>
              <h2>Find Any Product Instantly</h2>
              <p className="search-hero-subtitle">
                Search through thousands of top-selling gadgets, home organizers, smart watches, and trending electronic items in Pakistan.
              </p>
              <div className="suggestion-pills">
                <span className="suggestion-pill" onClick={() => applyQuickSearch('Storage')}>🔍 Storage &amp; Racks</span>
                <span className="suggestion-pill" onClick={() => applyQuickSearch('Watch')}>⌚ Smart Watch</span>
                <span className="suggestion-pill" onClick={() => applyQuickSearch('Bag')}>👜 Travel Bag</span>
                <span className="suggestion-pill" onClick={() => applyQuickSearch('Bottle')}>🍶 Water Bottle</span>
                <span className="suggestion-pill" onClick={() => applyQuickSearch('Massager')}>💆 Massage Gun</span>
              </div>
            </div>

            <div className="search-mockup-wrap">
              <div className="search-mockup">
                <div className="search-mockup-dots">
                  <span></span><span></span><span></span>
                </div>
                <form className="main-search-container" onSubmit={handleSearch}>
                  <input 
                    type="text" 
                    id="heroSearchInput" 
                    className="hero-search-input" 
                    placeholder="Type product name (e.g. Organizer, Smart Watch)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button type="submit" className="hero-search-btn">
                    <span>Search</span> ➔
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
