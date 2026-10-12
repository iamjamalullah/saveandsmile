'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HomeThemeConfig } from '@/lib/types';

interface HeaderProps {
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  onOpenTrackOrder?: () => void;
  themeConfig?: HomeThemeConfig;
}

const CATEGORIES_DATA = [
  { id: "storage", name: "Storage & Racks", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c8298306c.png", count: 142 },
  { id: "kitchen", name: "Kitchen Gadgets", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c83c8a82f.png", count: 98 },
  { id: "electronics", name: "Electronic Items", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c9bf916b9.png", count: 215 },
  { id: "smartwatches", name: "Smart Watches", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c8156be86.png", count: 64 },
  { id: "bottles", name: "Mugs & Bottles", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c804cf28a.png", count: 76 },
  { id: "beauty", name: "Beauty & Makeup", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c89c75850.png", count: 85 },
  { id: "insect-killers", name: "Insect Killers", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c7d25edb7.png", count: 32 },
  { id: "accessories", name: "Mobile Accessories", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c7db87df3.png", count: 120 }
];

export default function Header({ onOpenCart, onOpenWishlist, onOpenTrackOrder, themeConfig }: HeaderProps) {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'menu'>('categories');
  const [branding, setBranding] = useState({
    logo: '/images/save-and-smile-logo.png',
    phone: '0316-2323616',
    whatsapp: '923162323616'
  });

  useEffect(() => {
    function updateCounts() {
      try {
        const cart = JSON.parse(localStorage.getItem('qadri_cart') || '[]');
        const count = cart.reduce((sum: number, item: any) => sum + (item.qty || 1), 0);
        setCartCount(count);
      } catch (e) {
        setCartCount(0);
      }
      try {
        const wishlist = JSON.parse(localStorage.getItem('qadri_wishlist') || '[]');
        setWishlistCount(Array.isArray(wishlist) ? wishlist.length : 0);
      } catch (e) {
        setWishlistCount(0);
      }
    }
    updateCounts();

    function fetchLiveBranding() {
      fetch('/api/seo?type=settings', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data?.settings) {
            const rawLogo = data.settings.logo_url;
            const safeLogo = (rawLogo && !rawLogo.includes('saveandsmile.pk'))
              ? rawLogo
              : '/images/save-and-smile-logo.png';
            setBranding({
              logo: safeLogo,
              phone: data.settings.helpline_phone || '0316-2323616',
              whatsapp: (data.settings.helpline_phone || '03162323616').replace(/[^0-9]/g, '')
            });
          }
        })
        .catch(() => {});
    }

    fetchLiveBranding();

    window.addEventListener('qadri_cart_updated', updateCounts);
    window.addEventListener('storage', updateCounts);
    window.addEventListener('qadri_branding_updated', fetchLiveBranding);

    return () => {
      window.removeEventListener('qadri_cart_updated', updateCounts);
      window.removeEventListener('storage', updateCounts);
      window.removeEventListener('qadri_branding_updated', fetchLiveBranding);
    };
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `/?search=${encodeURIComponent(searchQuery.trim())}#products`;
  }

  const tickerEnabled = themeConfig?.announcement_ticker?.enabled !== false;
  const rawItems = themeConfig?.announcement_ticker?.items && themeConfig.announcement_ticker.items.length > 0
    ? themeConfig.announcement_ticker.items
    : [
        "🚀 Welcome to <strong>Save & Smile Wholesale Portal</strong> (Shop • Save • Smile)",
        "🔥 Direct Factory Wholesale Rates in Pakistan — Guaranteed Margin for Resellers",
        "🚚 Cash on Delivery (COD) Nationwide | Free Delivery Above Rs. 3,000",
        `📞 24/7 Helpline & WhatsApp: <strong>${branding.phone}</strong>`
      ];

  return (
    <>
      {/* 1. Top Announcement Bar / Marquee Ticker */}
      {tickerEnabled && (
        <div
          className="ticker-bar"
          id="tickerSection"
          style={{
            backgroundColor: themeConfig?.announcement_ticker?.bgColor || undefined,
            color: themeConfig?.announcement_ticker?.textColor || undefined
          }}
        >
          <div className="site-container" style={{ overflow: 'hidden', width: '100%' }}>
            <div className="ticker-track" id="tickerTrack">
              {rawItems.concat(rawItems).map((item, idx) => (
                <div
                  key={idx}
                  className="ticker-item"
                  dangerouslySetInnerHTML={{ __html: item }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Header & Dynamic Gradient Bar */}
      <header className="header-wrapper" id="headerSection">

        <div className="site-container">
          <div className="header-inner">
            {/* Left Side: 4-Dots Menu Trigger + Brand Logo */}
            <div className="header-left-group">
              <button
                type="button"
                className="header-menu-btn"
                id="headerMenuBtn"
                onClick={() => setMenuOpen(!menuOpen)}
                title="Open Categories & Menu"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="6" cy="6" r="2.8" />
                  <circle cx="18" cy="6" r="2.8" />
                  <circle cx="6" cy="18" r="2.8" />
                  <circle cx="18" cy="18" r="2.8" />
                </svg>
              </button>

              <h1 className="brand-heading-seo" style={{ margin: 0, padding: 0, lineHeight: 1 }}>
                <Link
                  href="/"
                  className="brand-logo flex items-center transition hover:opacity-90"
                  title="Save & Smile - Shop • Save • Smile | Wholesale Store Pakistan"
                >
                  <img
                    src={branding.logo || '/images/save-and-smile-logo.png'}
                    alt="Save & Smile Logo"
                    className="site-brand-logo h-8 sm:h-9 w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/save-and-smile-logo.png';
                    }}
                  />
                </Link>
              </h1>

            </div>

            {/* Desktop Center Navigation Menu */}
            <nav className="desktop-center-nav">
              <Link href="/" className="desktop-nav-link active">Home</Link>
              <a href="/#flashSale" className="desktop-nav-link">Deals</a>
              <button
                type="button"
                onClick={onOpenTrackOrder ? onOpenTrackOrder : () => { window.location.href = '/track-order'; }}
                className="desktop-nav-link bg-transparent border-none cursor-pointer"
                style={{ font: 'inherit' }}
              >
                Track Order
              </button>
              <Link href="/cart" className="desktop-nav-link">Cart</Link>
              <a
                href={`https://wa.me/${branding.whatsapp}?text=Salam!%20I%20want%20to%20Buy%20in%20Wholesale`}
                target="_blank"
                rel="noopener noreferrer"
                className="desktop-nav-link wholesale-pill"
              >
                Wholesale
              </a>
            </nav>

            {/* Header Actions */}
            <div className="header-actions">
              <button
                type="button"
                className="action-icon-pill"
                id="searchToggleBtn"
                onClick={() => setSearchOpen(!searchOpen)}
                title="Search Products"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              <a
                href={`https://wa.me/${branding.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="action-icon-pill hotline-icon-pill"
                title={`WhatsApp Support: ${branding.phone}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>

              <button
                type="button"
                className="action-icon-pill"
                onClick={onOpenWishlist ? onOpenWishlist : () => { window.location.href = '/cart'; }}
                title="View Wishlist"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="badge-counter" id="wishlistBadge">{wishlistCount}</span>
              </button>

              <button
                type="button"
                className="action-icon-pill"
                onClick={onOpenCart ? onOpenCart : () => { window.location.href = '/cart'; }}
                title="View Shopping Cart"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span className="badge-counter" id="cartBadge">{cartCount}</span>
              </button>
            </div>
          </div>

          {/* Expandable Search Bar Overlay */}
          <div className={`expand-search-bar ${searchOpen ? 'open' : ''}`} id="expandSearchBar" style={{ display: searchOpen ? 'block' : 'none' }}>
            <form className="search-input-group" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                id="searchInput"
                placeholder="Search wholesale gadgets, smart watches, racks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="search-btn" title="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
              <button type="button" className="search-close-btn" onClick={() => setSearchOpen(false)}>✕</button>
            </form>
          </div>
        </div>

        {/* 2-Tab Interactive Header Dropdown Panel (Categories & Menu) */}
        <div className={`header-tabs-dropdown ${menuOpen ? 'open' : ''}`} id="headerTabsDropdown" style={{ display: menuOpen ? 'block' : 'none' }}>
          <div className="site-container">
            <div className="dropdown-tabs-nav">
              <button
                type="button"
                className={`tab-nav-btn ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveTab('categories')}
              >
                Categories
              </button>
              <button
                type="button"
                className={`tab-nav-btn ${activeTab === 'menu' ? 'active' : ''}`}
                onClick={() => setActiveTab('menu')}
              >
                Menu
              </button>
            </div>

            {/* Tab 1: Categories Content */}
            {activeTab === 'categories' && (
              <div className="tab-pane-content active" id="tabPaneCategories">
                <div className="header-cats-grid" id="headerCatsGrid">
                  {CATEGORIES_DATA.map(cat => (
                    <div
                      key={cat.id}
                      className="header-cat-card cursor-pointer"
                      onClick={() => {
                        setMenuOpen(false);
                        window.location.href = `/?cat=${cat.id}#products`;
                      }}
                    >
                      <img src={cat.icon} alt={cat.name} />
                      <div>
                        <div className="header-cat-name">{cat.name}</div>
                        <div className="header-cat-count">{cat.count} items</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Menu Content */}
            {activeTab === 'menu' && (
              <div className="tab-pane-content active" id="tabPaneMenu">
                <div className="header-menu-links">
                  <Link href="/" className="menu-item-link" onClick={() => setMenuOpen(false)}>
                    <span>Home</span>
                  </Link>
                  <a href="/#flashSale" className="menu-item-link" onClick={() => setMenuOpen(false)}>
                    <span>Deals &amp; Discounts</span>
                  </a>
                  <button
                    type="button"
                    className="menu-item-link text-left bg-transparent border-none cursor-pointer w-full"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenTrackOrder) onOpenTrackOrder();
                      else window.location.href = '/track-order';
                    }}
                  >
                    <span>Track Order</span>
                  </button>
                  <Link href="/cart" className="menu-item-link" onClick={() => setMenuOpen(false)}>
                    <span>Shopping Cart</span>
                  </Link>
                  <a
                    href={`https://wa.me/${branding.whatsapp}?text=Salam!%20I%20want%20to%20Buy%20in%20Wholesale`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="menu-item-link wholesale-highlight"
                  >
                    <span>Buy in Wholesale</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
