import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function SearchOverlay() {
  const { isSearchOpen, setIsSearchOpen, products, storeConfig } = useStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  if (!isSearchOpen) return null;

  const filtered = query.trim() ? products.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) || 
    (p.code && p.code.toLowerCase().includes(query.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 6) : [];

  const handleSelectProduct = (productId) => {
    setIsSearchOpen(false);
    navigate(`/product-detail?id=${productId}`);
  };

  return (
    <div className="expand-search-bar active" id="expandSearchBar" style={{ display: 'block' }}>
      <div className="site-container">
        <form className="search-input-group" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="text" 
            id="searchInput" 
            placeholder="Search wholesale gadgets, smart watches, racks..." 
            autoComplete="off"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="search-btn" title="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          <button type="button" className="search-close-btn" onClick={() => setIsSearchOpen(false)}>✕</button>
        </form>

        {query.trim() && (
          <div className="search-results-dropdown active" id="searchResultsDropdown" style={{ display: 'block' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '14px', color: '#64748b', fontSize: '0.88rem' }}>
                No products found matching "{query}".
              </div>
            ) : (
              filtered.map(p => (
                <div 
                  key={p.id} 
                  className="search-result-item" 
                  onClick={() => handleSelectProduct(p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                >
                  <img src={p.image} alt={p.title} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>{p.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#064C63', fontWeight: 800 }}>
                      {storeConfig.currency || 'Rs.'} {p.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
