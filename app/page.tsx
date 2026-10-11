'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  STORE_CONFIG,
  BANNERS,
  CATEGORIES,
  FRONT_TABS,
  PRODUCTS,
  REELS_DATA,
  REVIEWS_DATA,
  Product,
} from '@/lib/data';
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartQty,
  getCartTotal,
  getCartCount,
  CartItem,
} from '@/lib/cart';

export default function StorefrontHomePage() {
  // --- State variables ---
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFrontTab, setActiveFrontTab] = useState('storage');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [activeHeaderTab, setActiveHeaderTab] = useState<'categories' | 'menu'>('categories');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [wishlist, setWishlist] = useState<(number | string)[]>([]);
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [trackInput, setTrackInput] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Assistant Chat State
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    {
      sender: 'bot',
      text: 'Assalam-o-Alaikum! 👋 Main Save & Smile ka AI Assistant hoon.\nAap mujh se store delivery, wholesale rates, tracking ya kisi bhi gadget k baray mein pooch sakte hain!',
    },
  ]);
  const [aiInput, setAiInput] = useState('');

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 42, seconds: 19 });

  // Custom home configuration (from API sync)
  const [homeConfig, setHomeConfig] = useState<any>(null);

  // Sync cart & wishlist on mount
  useEffect(() => {
    setCart(getCart());
    const onCartUpdate = () => setCart(getCart());
    window.addEventListener('cartUpdated', onCartUpdate);

    try {
      const storedWl = localStorage.getItem('qadri_wishlist');
      if (storedWl) setWishlist(JSON.parse(storedWl));
    } catch (e) {}

    // Fetch dynamic home customization
    fetch('/api/home-customization')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.config) {
          setHomeConfig(data.config);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('cartUpdated', onCartUpdate);
    };
  }, []);

  // Flash sale countdown timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 14, minutes: 42, seconds: 19 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hero banner auto-rotate interval
  const activeBanners = homeConfig?.hero_slides || BANNERS;
  useEffect(() => {
    if (!activeBanners || activeBanners.length <= 1) return;
    const bannerInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % activeBanners.length);
    }, 5500);
    return () => clearInterval(bannerInterval);
  }, [activeBanners]);

  // Toast notification trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cart operations
  const handleAddToCart = (product: Product, qty: number = 1) => {
    addToCart(product, qty);
    setCart(getCart());
    showToast(`✓ "${product.title.slice(0, 24)}..." added to cart!`);
  };

  const handleUpdateQty = (id: number | string, delta: number) => {
    updateCartQty(id, delta);
    setCart(getCart());
  };

  const handleRemoveItem = (id: number | string) => {
    removeFromCart(id);
    setCart(getCart());
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const isFreeDelivery = cartTotal >= STORE_CONFIG.freeShippingThreshold;
  const deliveryFee = isFreeDelivery ? 0 : STORE_CONFIG.shippingFee;
  const grandTotal = cartTotal + deliveryFee;
  const progressPercent = Math.min(
    100,
    Math.round((cartTotal / STORE_CONFIG.freeShippingThreshold) * 100)
  );

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q))
    ).slice(0, 8);
    setSearchResults(matches);
  }, [searchQuery]);

  // Wishlist toggle
  const toggleWishlist = (id: number | string) => {
    let updated: (number | string)[];
    if (wishlist.includes(id)) {
      updated = wishlist.filter((item) => item !== id);
      showToast('Removed from wishlist');
    } else {
      updated = [...wishlist, id];
      showToast('❤️ Added to wishlist!');
    }
    setWishlist(updated);
    try {
      localStorage.setItem('qadri_wishlist', JSON.stringify(updated));
    } catch (e) {}
  };

  // WhatsApp Checkout
  const checkoutWhatsApp = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    let msg = `Salam Save & Smile! I want to order these wholesale items:\n\n`;
    cart.forEach((it, idx) => {
      msg += `${idx + 1}. ${it.title} (Qty: ${it.qty}) - Rs. ${(it.price * it.qty).toLocaleString()}\n`;
    });
    msg += `\n*Subtotal:* Rs. ${cartTotal.toLocaleString()}\n*Shipping:* ${isFreeDelivery ? 'FREE' : 'Rs. ' + deliveryFee}\n*Total Payable:* Rs. ${grandTotal.toLocaleString()}\n\nPlease confirm my order.`;
    window.open(`https://wa.me/${STORE_CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Order tracking handler
  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackInput.trim()) return;
    setTrackLoading(true);
    setTrackResult(null);
    try {
      const res = await fetch(`/api/orders?query=${encodeURIComponent(trackInput.trim())}`);
      const data = await res.json();
      if (data && data.order) {
        setTrackResult(data.order);
      } else {
        setTrackResult({ error: 'No order found with this Tracking ID or Phone Number.' });
      }
    } catch (err) {
      setTrackResult({ error: 'Could not connect to tracking server. Please check your internet connection.' });
    } finally {
      setTrackLoading(false);
    }
  };

  // AI Chat query handler
  const handleAiSend = (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;
    const newMessages = [...aiMessages, { sender: 'user' as const, text: q }];
    setAiMessages(newMessages);
    setAiInput('');

    let reply =
      'Shukriya aap ke sawal ka! Hamari customer care team WhatsApp (0316-2323616) par 24/7 available hai direct wholesale discount aur instant order confirm karne k liye.';
    const lower = q.toLowerCase();
    if (lower.includes('deliver') || lower.includes('din') || lower.includes('time')) {
      reply =
        '🚚 Delivery Timing: Karachi aur Lahore mein 24 se 48 ghante, jabke nationwide baqi shehron mein 2-3 working days mein Cash on Delivery (COD) parcel pohnch jata hai.';
    } else if (lower.includes('wholesale') || lower.includes('discount') || lower.includes('rate')) {
      reply =
        '📦 Wholesale Bulk Rates: Save & Smile direct factory importer hai. Rs. 3,000 se zyada k order par FREE Home Delivery milti hai aur cartons par extra wholesale margin diya jata hai!';
    } else if (lower.includes('payment') || lower.includes('cod') || lower.includes('paise')) {
      reply =
        '💳 Payment Methods: Cash on Delivery (COD) Pakistan k har chotay baray shehar mein dastiyaab hai. Sath JazzCash, EasyPaisa aur Bank Transfer se bhi advance payment ki ja sakti hai.';
    } else if (lower.includes('track') || lower.includes('order')) {
      reply =
        '📍 Order Tracking: Aap ooper "Track Order" button daba kar apna Tracking ID (e.g. QG-100234) ya Phone Number daal kar live parcel status dekh sakte hain!';
    }

    setTimeout(() => {
      setAiMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    }, 400);
  };

  // Filter products by category
  const filteredProducts =
    selectedCategory === 'all'
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === selectedCategory);

  // Hot Selling Products
  const hotSellingProducts = PRODUCTS.filter((p) => p.badge?.includes('HOT') || p.rating! >= 4.7).slice(0, 8);

  // New Arrivals Products
  const newArrivalsProducts = PRODUCTS.slice(8, 16);

  // Trending Products
  const trendingProducts = PRODUCTS.filter((p) => p.badge?.includes('TRENDING') || p.reviews! > 80).slice(0, 8);

  // Flash Sale Products
  const flashSaleProducts = PRODUCTS.filter((p) => p.isFlashSale).slice(0, 8);

  // Active categories for strip
  const customSelectedCatIds = homeConfig?.sections_config?.categories_strip?.selected_categories;
  const categoriesToDisplay =
    Array.isArray(customSelectedCatIds) && customSelectedCatIds.length > 0
      ? CATEGORIES.filter((c) => customSelectedCatIds.includes(c.id))
      : CATEGORIES;
  const repeatedCategories = [...categoriesToDisplay, ...categoriesToDisplay, ...categoriesToDisplay];

  return (
    <>
      {/* ==========================================
           1. Top Announcement Bar / Marquee Ticker
           ========================================== */}
      <div className="ticker-bar" id="tickerSection">
        <div className="site-container" style={{ overflow: 'hidden', width: '100%' }}>
          <div className="ticker-track" id="tickerTrack">
            {homeConfig?.announcement_ticker?.items && homeConfig.announcement_ticker.items.length > 0 ? (
              <>
                {homeConfig.announcement_ticker.items.map((it: string, i: number) => (
                  <div key={i} className="ticker-item" dangerouslySetInnerHTML={{ __html: it }} />
                ))}
                {homeConfig.announcement_ticker.items.map((it: string, i: number) => (
                  <div key={`dup-${i}`} className="ticker-item" dangerouslySetInnerHTML={{ __html: it }} />
                ))}
              </>
            ) : (
              <>
                <div className="ticker-item">
                  🚀 Welcome to <strong>Save &amp; Smile Wholesale Portal</strong> (Shop • Save • Smile)
                </div>
                <div className="ticker-item">
                  🔥 Direct Factory Wholesale Rates in Pakistan — Guaranteed Margin for Resellers
                </div>
                <div className="ticker-item">
                  🚚 Cash on Delivery (COD) Nationwide | Free Delivery Above Rs. 3,000
                </div>
                <div className="ticker-item">
                  📞 24/7 Helpline &amp; WhatsApp: <strong>0316-2323616</strong>
                </div>
                <div className="ticker-item">
                  🚀 Welcome to <strong>Save &amp; Smile Wholesale Portal</strong> (Shop • Save • Smile)
                </div>
                <div className="ticker-item">
                  🔥 Direct Factory Wholesale Rates in Pakistan — Guaranteed Margin for Resellers
                </div>
                <div className="ticker-item">
                  🚚 Cash on Delivery (COD) Nationwide | Free Delivery Above Rs. 3,000
                </div>
                <div className="ticker-item">
                  📞 24/7 Helpline &amp; WhatsApp: <strong>0316-2323616</strong>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================
           2. Main Header & Dynamic Gradient Bar
           ========================================== */}
      <header className="header-wrapper" id="headerSection">
        <div className="site-container">
          <div className="header-inner">
            {/* Left Side: 4-Dots Menu Trigger + Brand Logo */}
            <div className="header-left-group">
              <button
                className="header-menu-btn"
                id="headerMenuBtn"
                onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                title="Open Categories & Menu"
                type="button"
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
                  className="brand-logo"
                  title="Save & Smile - Shop • Save • Smile | Wholesale Store Pakistan"
                >
                  <img
                    src="/images/save-and-smile-logo.png"
                    alt="Save & Smile - Wholesale Gadgets Pakistan"
                    className="site-brand-logo"
                  />
                </Link>
              </h1>
            </div>

            {/* Desktop Center Navigation Menu */}
            <nav className="desktop-center-nav">
              <Link href="/" className="desktop-nav-link active">
                Home
              </Link>
              <a href="#flashSale" className="desktop-nav-link">
                Deals
              </a>
              <button
                type="button"
                className="desktop-nav-link bg-transparent border-0 cursor-pointer"
                onClick={() => setTrackModalOpen(true)}
              >
                Track Order
              </button>
              <Link href="/cart" className="desktop-nav-link">
                Cart
              </Link>
              <a
                href={`https://wa.me/${STORE_CONFIG.whatsapp}?text=Salam!%20I%20want%20to%20Buy%20in%20Wholesale`}
                target="_blank"
                rel="noreferrer"
                className="desktop-nav-link wholesale-pill"
              >
                Wholesale
              </a>
            </nav>

            {/* Header Actions */}
            <div className="header-actions">
              <button
                className="action-icon-pill"
                id="searchToggleBtn"
                onClick={() => setSearchOpen(!searchOpen)}
                title="Search Products"
                type="button"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              <a
                href={`https://wa.me/${STORE_CONFIG.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="action-icon-pill hotline-icon-pill"
                title="WhatsApp Support: 0316-2323616"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>

              <button
                className="action-icon-pill"
                onClick={() => setWishlistModalOpen(true)}
                title="View Wishlist"
                type="button"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="badge-counter" id="wishlistBadge">
                  {wishlist.length}
                </span>
              </button>

              <button
                className="action-icon-pill"
                onClick={() => setCartOpen(true)}
                title="View Shopping Cart"
                type="button"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span className="badge-counter" id="cartBadge">
                  {getCartCount()}
                </span>
              </button>
            </div>
          </div>

          {/* Expandable Search Bar Overlay */}
          <div
            className="expand-search-bar"
            id="expandSearchBar"
            style={{ display: searchOpen ? 'block' : 'none' }}
          >
            <form
              className="search-input-group"
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  const target = document.getElementById('products');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <input
                type="text"
                id="searchInput"
                placeholder="Search wholesale gadgets, smart watches, racks..."
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn" title="Search">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
              <button
                type="button"
                className="search-close-btn"
                onClick={() => setSearchOpen(false)}
              >
                ✕
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="search-results-dropdown" id="searchResultsDropdown" style={{ display: 'block' }}>
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="search-result-item"
                    onClick={() => {
                      setQuickViewProduct(item);
                      setSearchOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#008060', fontWeight: 800 }}>
                        Rs. {item.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2-Tab Interactive Header Dropdown Panel */}
        <div
          className={`header-tabs-dropdown ${headerMenuOpen ? 'open' : ''}`}
          id="headerTabsDropdown"
          style={{ display: headerMenuOpen ? 'block' : 'none' }}
        >
          <div className="site-container">
            <div className="dropdown-tabs-nav">
              <button
                type="button"
                className={`tab-nav-btn ${activeHeaderTab === 'categories' ? 'active' : ''}`}
                id="tabNavBtnCat"
                onClick={() => setActiveHeaderTab('categories')}
              >
                Categories
              </button>
              <button
                type="button"
                className={`tab-nav-btn ${activeHeaderTab === 'menu' ? 'active' : ''}`}
                id="tabNavBtnMenu"
                onClick={() => setActiveHeaderTab('menu')}
              >
                Menu
              </button>
            </div>

            {/* Tab 1: Categories Content */}
            <div
              className={`tab-pane-content ${activeHeaderTab === 'categories' ? 'active' : ''}`}
              id="tabPaneCategories"
            >
              <div className="header-cats-grid" id="headerCatsGrid">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className="header-cat-card"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setHeaderMenuOpen(false);
                      const el = document.getElementById('products');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
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

            {/* Tab 2: Menu Content */}
            <div
              className={`tab-pane-content ${activeHeaderTab === 'menu' ? 'active' : ''}`}
              id="tabPaneMenu"
            >
              <div className="header-menu-links">
                <Link href="/" className="menu-item-link" onClick={() => setHeaderMenuOpen(false)}>
                  <span>Home</span>
                </Link>
                <a
                  href="#flashSale"
                  className="menu-item-link"
                  onClick={() => setHeaderMenuOpen(false)}
                >
                  <span>Deals &amp; Discounts</span>
                </a>
                <button
                  type="button"
                  className="menu-item-link text-left bg-transparent border-0 w-full cursor-pointer"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setTrackModalOpen(true);
                  }}
                >
                  <span>Track Order</span>
                </button>
                <Link href="/cart" className="menu-item-link" onClick={() => setHeaderMenuOpen(false)}>
                  <span>Shopping Cart</span>
                </Link>
                <a
                  href={`https://wa.me/${STORE_CONFIG.whatsapp}?text=Salam!%20I%20want%20to%20Buy%20in%20Wholesale`}
                  target="_blank"
                  rel="noreferrer"
                  className="menu-item-link wholesale-highlight"
                >
                  <span>Buy in Wholesale</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Reorderable Homepage Sections Wrapper */}
      <main id="homepageSectionsContainer" className="homepage-sections-wrapper">
        {/* ==========================================
             4. Hero Main Banner Slider
             ========================================== */}
        <section className="hero-slider-section" id="heroSliderSection">
          <div className="site-container">
            <div className="slider-container" id="heroSliderContainer" style={{ position: 'relative' }}>
              {activeBanners.map((slide: any, idx: number) => (
                <div
                  key={slide.id || idx}
                  className={`slide ${idx === activeSlide ? 'active' : ''}`}
                  style={{
                    display: idx === activeSlide ? 'block' : 'none',
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    borderRadius: '16px',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div className="slide-content">
                    {slide.badge && <span className="slide-badge">{slide.badge}</span>}
                    <h2>{slide.title}</h2>
                    {slide.subtitle && <p>{slide.subtitle}</p>}
                    <a
                      href={slide.link || '#products'}
                      className="btn-primary"
                      onClick={() => {
                        const el = document.getElementById('products');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      {slide.btn_text || 'Shop Wholesale Now'}
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="slider-controls">
              <button
                type="button"
                className="slider-arrow"
                onClick={() =>
                  setActiveSlide((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1))
                }
                title="Previous Slide"
              >
                ‹
              </button>
              <button
                type="button"
                className="slider-arrow"
                onClick={() => setActiveSlide((prev) => (prev + 1) % activeBanners.length)}
                title="Next Slide"
              >
                ›
              </button>
            </div>
            <div className="slider-dots" id="sliderDots">
              {activeBanners.map((_: any, idx: number) => (
                <span
                  key={idx}
                  className={`dot ${idx === activeSlide ? 'active' : ''}`}
                  onClick={() => setActiveSlide(idx)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
             5. "Shop By Categories" Round Slider Strip
             ========================================== */}
        <section className="cat-strip-section" id="shopSliderSection">
          <div className="site-container">
            <h2 className="cat-section-title">
              {homeConfig?.sections_config?.categories_strip?.title || 'Shop By Categories'}
            </h2>
            <div className="cat-marquee-wrapper">
              <div className="cat-marquee-track" id="categoryStrip">
                {repeatedCategories.map((cat, idx) => (
                  <div
                    key={`${cat.id}-${idx}`}
                    className="cat-circle-card"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      const el = document.getElementById('products');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <div className="cat-circle-img-wrap">
                      <img src={cat.icon} alt={cat.name} />
                    </div>
                    <div className="cat-circle-title">{cat.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
             6. Trust Features Bar (HomePageFooterIcons)
             ========================================== */}
        <section className="trust-features-section" id="HomePageFooterIcons">
          <div className="site-container">
            <div className="trust-features-grid">
              <div className="trust-feature-card support">
                <div className="trust-feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                </div>
                <div className="trust-feature-text">
                  <h4>{homeConfig?.sections_config?.trust_badges?.badge1_title || 'Support 24/7'}</h4>
                  <p>
                    {homeConfig?.sections_config?.trust_badges?.badge1_desc ||
                      'Direct WhatsApp & Call wholesale assistance'}
                  </p>
                </div>
              </div>

              <div className="trust-feature-card prices">
                <div className="trust-feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                </div>
                <div className="trust-feature-text">
                  <h4>{homeConfig?.sections_config?.trust_badges?.badge2_title || 'Best Prices'}</h4>
                  <p>
                    {homeConfig?.sections_config?.trust_badges?.badge2_desc ||
                      'Direct factory prices for bulk & retail'}
                  </p>
                </div>
              </div>

              <div className="trust-feature-card payment">
                <div className="trust-feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div className="trust-feature-text">
                  <h4>{homeConfig?.sections_config?.trust_badges?.badge3_title || 'Secure Payment'}</h4>
                  <p>
                    {homeConfig?.sections_config?.trust_badges?.badge3_desc ||
                      'Cash on delivery & verified digital transfers'}
                  </p>
                </div>
              </div>

              <div className="trust-feature-card warranty">
                <div className="trust-feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </div>
                <div className="trust-feature-text">
                  <h4>
                    {homeConfig?.sections_config?.trust_badges?.badge4_title || '7 Days Replacement'}
                  </h4>
                  <p>
                    {homeConfig?.sections_config?.trust_badges?.badge4_desc ||
                      'Hassle-free product verification & exchange'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
             7. Front Categories Tabs Section (HomePageTabs)
             ========================================== */}
        <section className="front-cat-tabs-section" id="HomePageTabs">
          <div className="site-container">
            <div className="front-cat-nav-list" id="frontTabsNav">
              {FRONT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`front-cat-nav-btn ${activeFrontTab === tab.key ? 'active' : ''}`}
                  onClick={() => {
                    setActiveFrontTab(tab.key);
                    setSelectedCategory(tab.key);
                    const el = document.getElementById('products');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
             PORTION 1: 🔥 Hot Selling Products
             ========================================== */}
        <section className="store-portion-section portion-hot-selling" id="hotSelling">
          <div className="site-container">
            <div className="portion-header-bar">
              <div className="portion-title-group">
                <span className="portion-pill-tag">
                  {homeConfig?.sections_config?.hot_selling?.tag || '🔥 HOT SELLING'}
                </span>
                <div>
                  <h2 className="portion-heading-text">
                    {homeConfig?.sections_config?.hot_selling?.title || 'Hot Selling Wholesale Gadgets'}
                  </h2>
                  <p className="portion-subtitle-text">
                    {homeConfig?.sections_config?.hot_selling?.subtitle ||
                      'Fast moving products with highest reseller profit margins'}
                  </p>
                </div>
              </div>
              <a
                href="#products"
                className="portion-view-all"
                onClick={() => setSelectedCategory('all')}
              >
                See All Hot Items →
              </a>
            </div>
            <div className="products-grid" id="hotSellingGrid">
              {hotSellingProducts.map((product) => renderProductCard(product))}
            </div>
          </div>
        </section>

        {/* ==========================================
             PORTION 2: ✨ New Arrivals
             ========================================== */}
        <section className="store-portion-section portion-new-arrivals" id="newArrivals">
          <div className="site-container">
            <div className="portion-header-bar">
              <div className="portion-title-group">
                <span className="portion-pill-tag">
                  {homeConfig?.sections_config?.new_arrivals?.tag || '✨ NEW ARRIVALS'}
                </span>
                <div>
                  <h2 className="portion-heading-text">
                    {homeConfig?.sections_config?.new_arrivals?.title || 'Latest New Arrivals'}
                  </h2>
                  <p className="portion-subtitle-text">
                    {homeConfig?.sections_config?.new_arrivals?.subtitle ||
                      'Fresh containers imported this week — First batch wholesale prices'}
                  </p>
                </div>
              </div>
              <a
                href="#products"
                className="portion-view-all"
                onClick={() => setSelectedCategory('all')}
              >
                See All New Arrivals →
              </a>
            </div>
            <div className="products-grid" id="newArrivalsGrid">
              {newArrivalsProducts.map((product) => renderProductCard(product))}
            </div>
          </div>
        </section>

        {/* ==========================================
             PORTION 3: ⚡ Today's Flash Sale with Countdown
             ========================================== */}
        <section className="flash-sale-section" id="flashSale">
          <div className="site-container">
            <div className="flash-sale-header">
              <div className="flash-title-area">
                <span style={{ fontSize: '1.5rem' }}>⚡</span>
                <div>
                  <h2>{homeConfig?.sections_config?.flash_sale?.title || "TODAY'S FLASH SALE"}</h2>
                  <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                    {homeConfig?.sections_config?.flash_sale?.subtitle ||
                      'Limited quantity left at discounted wholesale prices!'}
                  </p>
                </div>
              </div>
              <div className="countdown-timer">
                <span style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '6px' }}>
                  Ends In:
                </span>
                <div className="timer-box" id="timerHours">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <span className="timer-sep">:</span>
                <div className="timer-box" id="timerMinutes">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <span className="timer-sep">:</span>
                <div className="timer-box" id="timerSeconds">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className="products-grid" style={{ marginTop: '1.5rem' }}>
              {flashSaleProducts.map((product) => renderProductCard(product))}
            </div>
          </div>
        </section>

        {/* ==========================================
             PORTION 4: 🌟 Trending Wholesale Picks
             ========================================== */}
        <section className="store-portion-section portion-trending-gadgets" id="trendingPicks">
          <div className="site-container">
            <div className="portion-header-bar">
              <div className="portion-title-group">
                <span className="portion-pill-tag">
                  {homeConfig?.sections_config?.trending_picks?.tag || '🌟 TRENDING PICKS'}
                </span>
                <div>
                  <h2 className="portion-heading-text">
                    {homeConfig?.sections_config?.trending_picks?.title || 'Trending Wholesale Picks'}
                  </h2>
                  <p className="portion-subtitle-text">
                    {homeConfig?.sections_config?.trending_picks?.subtitle ||
                      'Most demanded smart watches, organizers & lifestyle essentials'}
                  </p>
                </div>
              </div>
              <a
                href="#products"
                className="portion-view-all"
                onClick={() => setSelectedCategory('all')}
              >
                See All Trending →
              </a>
            </div>
            <div className="products-grid" id="trendingGrid">
              {trendingProducts.map((product) => renderProductCard(product))}
            </div>
          </div>
        </section>

        {/* ==========================================
             PORTION 5: 🛍️ Complete Product Catalog Section
             ========================================== */}
        <section className="catalog-section" id="products">
          <div className="site-container">
            <div className="catalog-header">
              <div className="catalog-title">
                <h2>{homeConfig?.sections_config?.main_catalog?.title || 'All Wholesale Products'}</h2>
              </div>
              <div className="filter-tabs-list">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'storage', label: 'Storage & Racks' },
                  { id: 'smartwatches', label: 'Smart Watches' },
                  { id: 'bottles', label: 'Mugs & Bottles' },
                  { id: 'insect-killers', label: 'Insect Killers' },
                  { id: 'beauty', label: 'Beauty & Care' },
                  { id: 'accessories', label: 'Accessories' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`tab-btn ${selectedCategory === tab.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="products-grid" id="productsGrid">
              {filteredProducts.map((product) => renderProductCard(product))}
            </div>
          </div>
        </section>

        {/* ==========================================
             10. Interactive Search Hero (HomePageBuilder)
             ========================================== */}
        <section className="search-hero-section" id="HomePageBuilder">
          <div className="site-container">
            <div className="search-hero-card">
              <div className="search-hero-layout">
                <div className="search-hero-copy">
                  <span className="tag-label">QUICK FINDER</span>
                  <h2>
                    {homeConfig?.sections_config?.search_hero?.title || 'Find Any Product Instantly'}
                  </h2>
                  <p className="search-hero-subtitle">
                    {homeConfig?.sections_config?.search_hero?.subtitle ||
                      'Search through thousands of top-selling gadgets, home organizers, smart watches, and trending electronic items in Pakistan.'}
                  </p>
                  <div className="suggestion-pills">
                    {['Storage', 'Watch', 'Bag', 'Bottle', 'Massager'].map((keyword) => (
                      <span
                        key={keyword}
                        className="suggestion-pill"
                        onClick={() => {
                          setSearchQuery(keyword);
                          setSearchOpen(true);
                          const el = document.getElementById('products');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        🔍 {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="search-mockup-wrap">
                  <div className="search-mockup">
                    <div className="search-mockup-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <form
                      className="main-search-container"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const el = document.getElementById('products');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <input
                        type="text"
                        id="heroSearchInput"
                        className="hero-search-input"
                        placeholder="Type product name (e.g. Organizer, Smart Watch)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* ==========================================
             11. "Watch & Shop" Video Reels (HomePageReels)
             ========================================== */}
        <section className="reels-section" id="HomePageReels">
          <div className="site-container">
            <div className="qadri-reels-head">
              <div>
                <span className="qadri-reels-kicker">
                  {homeConfig?.sections_config?.video_reels?.tag || 'IN MOTION'}
                </span>
                <h2 className="qadri-reels-title">
                  {homeConfig?.sections_config?.video_reels?.title || 'Watch & Shop'}
                </h2>
              </div>
              <div className="qadri-reels-nav">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('reelsTrack');
                    if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
                  }}
                  aria-label="Previous videos"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('reelsTrack');
                    if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
                  }}
                  aria-label="Next videos"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="reels-track" id="reelsTrack">
              {REELS_DATA.map((reel) => (
                <div key={reel.id} className="reel-card">
                  <div className="reel-video-wrap">
                    <video
                      src={reel.video}
                      poster={reel.thumb}
                      loop
                      muted
                      playsInline
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                    />
                    <div className="reel-play-indicator">▶</div>
                  </div>
                  <div className="reel-meta">
                    <div className="reel-title">{reel.title}</div>
                    <div className="reel-price">
                      <strong>Rs. {reel.price.toLocaleString()}</strong>
                      {reel.originalPrice && (
                        <del style={{ marginLeft: '6px', opacity: 0.6 }}>
                          Rs. {reel.originalPrice.toLocaleString()}
                        </del>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
             12. What Our Clients Say (HomePageClientTestimonials)
             ========================================== */}
        <section className="testimonials-section" id="testimonialsSection">
          <div className="site-container">
            <div className="section-head-center">
              <span className="kicker-badge">FEEDBACK</span>
              <h2>{homeConfig?.sections_config?.testimonials?.title || 'What Our Clients Say'}</h2>
              <p>
                {homeConfig?.sections_config?.testimonials?.subtitle ||
                  'Real stories and verified reviews from our valued wholesale customers across Pakistan'}
              </p>
            </div>

            <div className="reviews-marquee-lane">
              <div className="reviews-track" id="reviewsTrack">
                {REVIEWS_DATA.concat(REVIEWS_DATA).map((review, idx) => (
                  <div key={idx} className="review-card">
                    <div className="review-stars">{'★'.repeat(review.stars)}</div>
                    <h3 className="review-title">{review.title}</h3>
                    <p className="review-text">{review.text}</p>
                    <div className="review-author">
                      <div className="review-avatar" style={{ backgroundColor: review.color }}>
                        {review.initial}
                      </div>
                      <div>
                        <strong>{review.name}</strong>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{review.date}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ==========================================
           13. Shopping Cart Offcanvas Drawer
           ========================================== */}
      <div
        className={`cart-drawer-overlay ${cartOpen ? 'open' : ''}`}
        id="cartDrawerOverlay"
        onClick={() => setCartOpen(false)}
        style={{ display: cartOpen ? 'block' : 'none' }}
      />
      <div
        className={`cart-drawer ${cartOpen ? 'open' : ''}`}
        id="cartDrawer"
        style={{
          transform: cartOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s ease',
        }}
      >
        <div className="drawer-header">
          <h3>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Shopping Cart
          </h3>
          <button type="button" className="drawer-close-btn" onClick={() => setCartOpen(false)}>
            ✕
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="free-shipping-progress">
          <div id="freeShippingText">
            {isFreeDelivery
              ? '🎉 Congratulations! You have unlocked FREE Delivery!'
              : `Add Rs. ${(STORE_CONFIG.freeShippingThreshold - cartTotal).toLocaleString()} for FREE Delivery`}
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              id="freeShippingBar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="drawer-body" id="cartDrawerItems">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>Your cart is empty.</p>
              <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>Add wholesale items to begin.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="drawer-item"
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={{ color: '#008060', fontWeight: 800, fontSize: '0.85rem', margin: '4px 0' }}>
                    Rs. {item.price.toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="qty-control" style={{ display: 'inline-flex' }}>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleUpdateQty(item.id, -1)}
                      >
                        −
                      </button>
                      <span className="qty-number">{item.qty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleUpdateQty(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary & Checkout Buttons */}
        <div className="drawer-footer">
          <div className="summary-line">
            <span>Subtotal:</span>
            <strong id="cartSubtotal">Rs. {cartTotal.toLocaleString()}</strong>
          </div>
          <div className="summary-line">
            <span>Standard Shipping:</span>
            <strong id="cartShipping">{isFreeDelivery ? 'FREE' : `Rs. ${deliveryFee}`}</strong>
          </div>
          <div className="summary-line total">
            <span>Total Payable:</span>
            <span id="cartTotal">Rs. {grandTotal.toLocaleString()}</span>
          </div>

          <div className="drawer-actions">
            <Link href="/checkout" className="btn-checkout" onClick={() => setCartOpen(false)}>
              💳 Proceed to Checkout
            </Link>
            <Link
              href="/cart"
              className="btn-checkout"
              onClick={() => setCartOpen(false)}
              style={{
                background: '#f1f5f9',
                color: '#1e293b',
                border: '1.5px solid #cbd5e1',
                boxShadow: 'none',
              }}
            >
              🛒 View Full Cart Page
            </Link>
            <button type="button" className="btn-whatsapp-order" onClick={checkoutWhatsApp}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Quick Order via WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
           14. Quick View Modal
           ========================================== */}
      {quickViewProduct && (
        <div
          className="modal-overlay"
          id="genericModal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuickViewProduct(null);
          }}
          style={{ display: 'flex' }}
        >
          <div className="modal-content-card" style={{ maxWidth: '640px', padding: '1.5rem' }}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setQuickViewProduct(null)}
            >
              ✕
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.title}
                  style={{
                    width: '140px',
                    height: '140px',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <div>
                  {quickViewProduct.badge && (
                    <span
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {quickViewProduct.badge}
                    </span>
                  )}
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '6px', color: '#0f172a' }}>
                    {quickViewProduct.title}
                  </h2>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>
                    Code: <strong>{quickViewProduct.code}</strong>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#008060', marginTop: '8px' }}>
                    Rs. {quickViewProduct.price.toLocaleString()}
                    {quickViewProduct.originalPrice && (
                      <del
                        style={{
                          fontSize: '0.9rem',
                          color: '#94a3b8',
                          marginLeft: '8px',
                          fontWeight: 500,
                        }}
                      >
                        Rs. {quickViewProduct.originalPrice.toLocaleString()}
                      </del>
                    )}
                  </div>
                </div>
              </div>

              {quickViewProduct.description && (
                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6 }}>
                  {quickViewProduct.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                <div className="qty-control">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuickViewQty((prev) => Math.max(1, prev - 1))}
                  >
                    −
                  </button>
                  <span className="qty-number">{quickViewQty}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuickViewQty((prev) => prev + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px', textAlign: 'center' }}
                  onClick={() => {
                    handleAddToCart(quickViewProduct, quickViewQty);
                    setQuickViewProduct(null);
                  }}
                >
                  🛒 Add to Cart
                </button>
                <Link
                  href={`/product-detail?id=${quickViewProduct.id}`}
                  className="action-pill-btn"
                  style={{ padding: '12px 18px', textAlign: 'center' }}
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Track Order Modal */}
      {trackModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTrackModalOpen(false);
          }}
          style={{ display: 'flex' }}
        >
          <div className="modal-content-card" style={{ maxWidth: '520px', padding: '2rem' }}>
            <button type="button" className="modal-close-btn" onClick={() => setTrackModalOpen(false)}>
              ✕
            </button>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '2.5rem' }}>📦</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '6px' }}>Track Your Order</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Enter your Order Tracking ID (e.g. QG-100234) or phone number
              </p>
            </div>

            <form onSubmit={handleTrackSubmit}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Order ID / Phone Number..."
                  value={trackInput}
                  onChange={(e) => setTrackInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                  required
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '12px 20px', borderRadius: '10px' }}
                  disabled={trackLoading}
                >
                  {trackLoading ? 'Searching...' : 'Track'}
                </button>
              </div>
            </form>

            {trackResult && (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '14px',
                  borderRadius: '10px',
                  background: trackResult.error ? '#fef2f2' : '#f0fdf4',
                  border: trackResult.error ? '1px solid #fecaca' : '1px solid #bbf7d0',
                }}
              >
                {trackResult.error ? (
                  <p style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                    {trackResult.error}
                  </p>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>Status:</strong>
                      <span
                        style={{
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                        }}
                      >
                        {trackResult.status || 'Verified & Processing'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      <div>Order ID: <strong>{trackResult.order_id || trackResult.id}</strong></div>
                      <div>Customer: <strong>{trackResult.customer_name}</strong></div>
                      <div>City: <strong>{trackResult.city}</strong></div>
                      <div>Total: <strong>Rs. {Number(trackResult.total_amount).toLocaleString()}</strong></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wishlist Modal */}
      {wishlistModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setWishlistModalOpen(false);
          }}
          style={{ display: 'flex' }}
        >
          <div className="modal-content-card" style={{ maxWidth: '600px', padding: '2rem' }}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setWishlistModalOpen(false)}
            >
              ✕
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>
              ❤️ My Wishlist ({wishlist.length})
            </h2>
            {wishlist.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>
                Your wishlist is empty. Browse gadgets and click the heart icon to save!
              </p>
            ) : (
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {PRODUCTS.filter((p) => wishlist.includes(p.id)).map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <img
                      src={p.image}
                      alt={p.title}
                      style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '8px' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.title}
                      </div>
                      <div style={{ color: '#008060', fontWeight: 800, fontSize: '0.85rem' }}>
                        Rs. {p.price.toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="tab-btn active"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => {
                        handleAddToCart(p);
                        setWishlistModalOpen(false);
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
           15. Mobile Fixed Bottom Navigation Bar
           ========================================== */}
      <div className="mbl-contact-fixed">
        <div
          className="mbl-nav-item active"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </div>
        <div className="mbl-nav-item" onClick={() => setHeaderMenuOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Categories</span>
        </div>
        <div
          className="mbl-nav-item"
          onClick={() => window.open(`https://wa.me/${STORE_CONFIG.whatsapp}`, '_blank')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>WhatsApp</span>
        </div>
        <div className="mbl-nav-item" onClick={() => setCartOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span className="mbl-badge" id="mblCartBadge">
            {getCartCount()}
          </span>
          <span>Cart</span>
        </div>
      </div>

      {/* ==========================================
           16. AI Store Assistant Robot
           ========================================== */}
      <button
        type="button"
        className="floating-ai-robot"
        id="aiRobotToggleBtn"
        onClick={() => setAiChatOpen(!aiChatOpen)}
        title="Ask Save & Smile AI Assistant"
      >
        <span className="ai-robot-icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="10" rx="3" />
            <circle cx="9" cy="16" r="1.5" fill="currentColor" />
            <circle cx="15" cy="16" r="1.5" fill="currentColor" />
            <path d="M8 7l4-4 4 4" />
            <line x1="12" y1="3" x2="12" y2="11" />
            <line x1="2" y1="16" x2="3" y2="16" />
            <line x1="21" y1="16" x2="22" y2="16" />
          </svg>
        </span>
        <span className="ai-status-pulse" />
        <div className="floating-ai-tooltip">Need Help? Ask AI Robot!</div>
      </button>

      {/* Interactive AI Assistant Modal / Popup */}
      <div className={`ai-chat-window ${aiChatOpen ? 'open' : ''}`} id="aiChatWindow" style={{ display: aiChatOpen ? 'flex' : 'none' }}>
        <div className="ai-chat-header">
          <div className="ai-header-info">
            <div className="ai-header-avatar">🤖</div>
            <div>
              <div className="ai-header-title">Save &amp; Smile AI Assistant</div>
              <div className="ai-header-status">● Online • 24/7 Store Support</div>
            </div>
          </div>
          <button type="button" className="ai-close-btn" onClick={() => setAiChatOpen(false)}>
            ✕
          </button>
        </div>
        <div className="ai-chat-messages" id="aiChatMessages">
          {aiMessages.map((msg, i) => (
            <div key={i} className={`ai-msg ${msg.sender}`}>
              <div className="ai-msg-bubble" style={{ whiteSpace: 'pre-line' }}>
                {msg.text}
              </div>
            </div>
          ))}
          <div className="ai-suggestions-quick">
            <button type="button" onClick={() => handleAiSend('Delivery kitne din mein aati hai?')}>
              🚚 Delivery time?
            </button>
            <button type="button" onClick={() => handleAiSend('Wholesale bulk discounts?')}>
              📦 Wholesale discounts?
            </button>
            <button type="button" onClick={() => handleAiSend('Payment methods kon se hain?')}>
              💳 Payment methods?
            </button>
            <button type="button" onClick={() => handleAiSend('Order track kaise karein?')}>
              📍 Track order?
            </button>
          </div>
        </div>
        <form
          className="ai-chat-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleAiSend(aiInput);
          }}
        >
          <input
            type="text"
            id="aiUserInput"
            placeholder="Poochiye (e.g. delivery, watch, discount)..."
            autoComplete="off"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
          />
          <button type="submit" className="ai-send-btn" title="Send message">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice show" id="toastNotice">
          {toastMessage}
        </div>
      )}

      {/* ==========================================
           17. Footer
           ========================================== */}
      <footer className="site-footer">
        <div className="site-container">
          <div className="footer-grid">
            <div className="footer-col">
              <Link href="/" style={{ display: 'inline-block' }}>
                <img
                  src="/images/save-and-smile-logo.png"
                  alt="Save & Smile"
                  className="footer-brand-logo"
                />
              </Link>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                Pakistan's trusted online wholesale portal for trending gadgets, kitchen organizers,
                smart watches, and home solutions. Providing best reseller margins and doorstep Cash
                on Delivery across Pakistan.
              </p>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>
                  📞 <strong>Helpline &amp; WhatsApp:</strong> 0316-2323616
                </div>
                <div>
                  ✉️ <strong>Email:</strong> info@saveandsmile.pk
                </div>
                <div>
                  📍 <strong>Dispatch Center:</strong> Karachi &amp; Lahore, Pakistan
                </div>
              </div>
            </div>

            <div className="footer-col">
              <h4>Popular Categories</h4>
              <ul className="footer-links">
                {['storage', 'smartwatches', 'bottles', 'insect-killers', 'accessories', 'massager'].map(
                  (cid) => (
                    <li key={cid}>
                      <a
                        href="#products"
                        onClick={() => {
                          setSelectedCategory(cid);
                          const el = document.getElementById('products');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        {CATEGORIES.find((c) => c.id === cid)?.name || cid}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="footer-col">
              <h4>Customer Care</h4>
              <ul className="footer-links">
                <li>
                  <button
                    type="button"
                    className="text-left bg-transparent border-0 p-0 text-inherit cursor-pointer hover:underline"
                    onClick={() => setTrackModalOpen(true)}
                  >
                    Track Your Order
                  </button>
                </li>
                <li>
                  <a href={`https://wa.me/${STORE_CONFIG.whatsapp}`} target="_blank" rel="noreferrer">
                    Wholesale Bulk Inquiries
                  </a>
                </li>
                <li>
                  <a href="#flashSale">Flash Deals</a>
                </li>
                <li>
                  <button
                    type="button"
                    className="text-left bg-transparent border-0 p-0 text-inherit cursor-pointer hover:underline"
                    onClick={() => setWishlistModalOpen(true)}
                  >
                    My Wishlist
                  </button>
                </li>
                <li>
                  <a href={`https://wa.me/${STORE_CONFIG.whatsapp}`} target="_blank" rel="noreferrer">
                    Return &amp; Refund Policy
                  </a>
                </li>
                <li>
                  <a href={`https://wa.me/${STORE_CONFIG.whatsapp}`} target="_blank" rel="noreferrer">
                    Terms &amp; Conditions
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Wholesale Payment Methods</h4>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                We accept Cash on Delivery (COD) across Pakistan, plus online direct transfers via
                JazzCash, EasyPaisa, and Bank Accounts.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                  }}
                >
                  Cash On Delivery
                </span>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                  }}
                >
                  JazzCash
                </span>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                  }}
                >
                  EasyPaisa
                </span>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                  }}
                >
                  Bank Transfer
                </span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© 2026 Save &amp; Smile (Shop • Save • Smile). All Rights Reserved.</div>
            <div>Direct Wholesale Marketplace in Pakistan • 0316-2323616</div>
          </div>
        </div>
      </footer>
    </>
  );

  // Helper function to render a product card exactly matching index.html
  function renderProductCard(product: Product) {
    const isWished = wishlist.includes(product.id);
    return (
      <div key={product.id} className="product-card">
        <div className="product-img-wrap">
          {product.badge && <span className="product-badge">{product.badge}</span>}
          <button
            type="button"
            className={`wishlist-btn ${isWished ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            title="Add to Wishlist"
          >
            {isWished ? '❤️' : '♡'}
          </button>
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            onClick={() => setQuickViewProduct(product)}
            style={{ cursor: 'pointer' }}
          />
        </div>

        <div className="product-info">
          {product.code && <div className="product-code">{product.code}</div>}
          <Link
            href={`/product-detail?id=${product.id}`}
            className="product-title"
            title={product.title}
          >
            {product.title}
          </Link>

          <div className="product-price-row">
            <span className="price-current">Rs. {product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="price-original">
                Rs. {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <div className="product-actions-group">
            <button
              type="button"
              className="btn-add-cart"
              onClick={() => handleAddToCart(product)}
            >
              <span>+ Add to Cart</span>
            </button>
            <button
              type="button"
              className="btn-quick-view"
              onClick={() => setQuickViewProduct(product)}
              title="Quick View"
            >
              👁
            </button>
          </div>
        </div>
      </div>
    );
  }
}
