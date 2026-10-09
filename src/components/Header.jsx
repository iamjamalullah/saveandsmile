import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import HeaderTabsDropdown from './HeaderTabsDropdown';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { 
    storeConfig, 
    cartItemCount, 
    wishlist, 
    setIsCartOpen, 
    setIsWishlistOpen, 
    setIsSearchOpen 
  } = useStore();
  
  const location = useLocation();

  return (
    <header className="header-wrapper" id="headerSection">
      <div className="site-container">
        <div className="header-inner">
          
          {/* Left Side: 4-Dots Menu Trigger + Brand Logo */}
          <div className="header-left-group">
            <button 
              className="header-menu-btn" 
              id="headerMenuBtn" 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              title="Open Categories & Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="6" cy="6" r="2.8"/>
                <circle cx="18" cy="6" r="2.8"/>
                <circle cx="6" cy="18" r="2.8"/>
                <circle cx="18" cy="18" r="2.8"/>
              </svg>
            </button>

            {/* Brand Logo with Save & Smile Logo Image */}
            <h1 className="brand-heading-seo" style={{ margin: 0, padding: 0, lineHeight: 1 }}>
              <Link to="/" className="brand-logo" title="Save & Smile - Shop • Save • Smile | Wholesale Store Pakistan">
                <img src={storeConfig.logo || "images/save-and-smile-logo.png"} alt="Save & Smile - Wholesale Gadgets Pakistan" className="site-brand-logo" />
              </Link>
            </h1>
          </div>

          {/* Desktop Center Navigation Menu */}
          <nav className="desktop-center-nav">
            <Link to="/" className={`desktop-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
            <a href="/#flashSale" className="desktop-nav-link">
              Deals
            </a>
            <Link to="/track" className={`desktop-nav-link ${location.pathname === '/track' || location.pathname === '/track-order' ? 'active' : ''}`}>
              Track Order
            </Link>
            <Link to="/cart" className={`desktop-nav-link ${location.pathname === '/cart' ? 'active' : ''}`}>
              Cart
            </Link>
            <a 
              href={`https://wa.me/${storeConfig.whatsapp || '923162323616'}?text=Salam!%20I%20want%20to%20Buy%20in%20Wholesale`} 
              target="_blank" 
              rel="noreferrer"
              className="desktop-nav-link wholesale-pill"
            >
              Wholesale
            </a>
          </nav>

          {/* Header Actions: Search, WhatsApp, Wishlist, Cart */}
          <div className="header-actions">
            {/* Search Icon Button */}
            <button 
              className="action-icon-pill" 
              id="searchToggleBtn" 
              onClick={() => setIsSearchOpen(true)} 
              title="Search Products"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            {/* WhatsApp Hotline Icon */}
            <a 
              href={`https://wa.me/${storeConfig.whatsapp || '923162323616'}`} 
              target="_blank" 
              rel="noreferrer"
              className="action-icon-pill hotline-icon-pill" 
              title={`WhatsApp Support: ${storeConfig.phone || '0316-2323616'}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>

            {/* Wishlist Icon */}
            <button 
              className="action-icon-pill" 
              onClick={() => setIsWishlistOpen(true)} 
              title="View Wishlist"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span className="badge-counter" id="wishlistBadge">{wishlist.length}</span>
            </button>

            {/* Shopping Cart Trigger Icon */}
            <button 
              className="action-icon-pill" 
              onClick={() => setIsCartOpen(true)} 
              title="View Shopping Cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span className="badge-counter" id="cartBadge">{cartItemCount}</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2-Tab Interactive Header Dropdown Panel */}
      <HeaderTabsDropdown 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
    </header>
  );
}
