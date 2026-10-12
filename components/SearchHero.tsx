'use client';

import React, { useState } from 'react';

interface SearchHeroProps {
  onSearch?: (query: string) => void;
}

export default function SearchHero({ onSearch }: SearchHeroProps) {
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    if (onSearch) {
      onSearch(query.trim());
    } else {
      window.location.href = `/?search=${encodeURIComponent(query.trim())}#products`;
    }
  }

  function handleQuickPill(term: string) {
    setQuery(term);
    if (onSearch) {
      onSearch(term);
    } else {
      window.location.href = `/?search=${encodeURIComponent(term)}#products`;
    }
  }

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
                <span className="suggestion-pill cursor-pointer" onClick={() => handleQuickPill('Storage')}>🔍 Storage &amp; Racks</span>
                <span className="suggestion-pill cursor-pointer" onClick={() => handleQuickPill('Watch')}>⌚ Smart Watch</span>
                <span className="suggestion-pill cursor-pointer" onClick={() => handleQuickPill('Bag')}>👜 Travel Bag</span>
                <span className="suggestion-pill cursor-pointer" onClick={() => handleQuickPill('Bottle')}>🍶 Water Bottle</span>
                <span className="suggestion-pill cursor-pointer" onClick={() => handleQuickPill('Massager')}>💆 Massage Gun</span>
              </div>
            </div>

            <div className="search-mockup-wrap">
              <div className="search-mockup">
                <div className="search-mockup-dots">
                  <span></span><span></span><span></span>
                </div>
                <form className="main-search-container" onSubmit={handleSubmit}>
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
