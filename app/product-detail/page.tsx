'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { STORE_CONFIG, PRODUCTS, Product } from '@/lib/data';
import { addToCart, getCartCount } from '@/lib/cart';

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [searchOverlay, setSearchOverlay] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setCartCount(getCartCount());
    const handleCartUpdate = () => setCartCount(getCartCount());
    window.addEventListener('cart-updated', handleCartUpdate);

    // Fetch product id from URL query
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const prodId = parseInt(urlParams.get('id') || '', 10) || 203;
      const found = PRODUCTS.find(p => p.id === prodId) || PRODUCTS[0];
      setProduct(found);
      setActiveImage(found ? found.image : '');
    }

    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, selectedQty);
    triggerToast(`Added ${selectedQty} × ${product.title} to cart!`);
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;
    const total = product.price * selectedQty;
    const msg = `Salam! I want to order this product:\n\n` +
      `*Product:* ${product.title}\n` +
      `*Quantity:* ${selectedQty}\n` +
      `*Price:* Rs. ${product.price.toLocaleString()}\n` +
      `*Total:* Rs. ${total.toLocaleString()}\n\n` +
      `Please confirm my order and share delivery details.`;
    window.open(`https://wa.me/${STORE_CONFIG.whatsappRaw}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleBulkInquiry = () => {
    if (!product) return;
    const msg = `Salam Save & Smile! I want to place a *Bulk Wholesale Order*:\n\n` +
      `*Product:* ${product.title}\n` +
      `*Required Quantity:* Bulk / Wholesale Cartons\n` +
      `*Product Code:* ${product.code || product.id}\n\n` +
      `Please quote the best wholesale deal and dispatch details.`;
    window.open(`https://wa.me/${STORE_CONFIG.whatsappRaw}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const related = PRODUCTS.slice(0, 4);

  if (!product) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <p>Loading Product Details...</p>
      </div>
    );
  }

  const savedPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div>
      {/* Top Announcement Bar / Marquee Ticker */}
      <div className="ticker-bar">
        <div className="site-container" style={{ overflow: 'hidden', width: '100%' }}>
          <div className="ticker-track">
            <div className="ticker-item">🚀 Welcome to <strong>Save &amp; Smile Wholesale Portal</strong></div>
            <div className="ticker-item">🔥 Direct Wholesale Rates in Pakistan — Guaranteed Margin</div>
            <div className="ticker-item">🚚 Cash on Delivery (COD) Nationwide | Free Delivery Above Rs. 3,000</div>
            <div className="ticker-item">📞 24/7 Wholesale Helpline: <strong>0316-2323616</strong></div>
            <div className="ticker-item">🚀 Welcome to <strong>Save &amp; Smile Wholesale Portal</strong></div>
            <div className="ticker-item">🔥 Direct Wholesale Rates in Pakistan — Guaranteed Margin</div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="header-wrapper">
        <div className="site-container">
          <div className="header-inner">
            <Link href="/" className="brand-logo" title="Save &amp; Smile">
              <img src="/images/save-and-smile-logo.png" alt="Save &amp; Smile" className="site-brand-logo" />
            </Link>

            {/* Desktop Live Search Box */}
            <div className="header-search">
              <form className="search-input-group" onSubmit={e => e.preventDefault()}>
                <input type="text" id="searchInput" placeholder="Search gadgets, smart watches, organizers..." autoComplete="off" />
                <button type="submit" className="search-btn" title="Search">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
              </form>
              <div className="search-results-dropdown" id="searchResultsDropdown"></div>
            </div>

            {/* Header Actions */}
            <div className="header-actions">
              <button className="action-icon-pill" onClick={() => setSearchOverlay(!searchOverlay)} title="Search Products">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>

              <a href={`https://wa.me/${STORE_CONFIG.whatsappRaw}`} target="_blank" rel="noreferrer" className="action-icon-pill hotline-icon-pill" title="WhatsApp Support: 0316-2323616">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>

              <Link href="/cart" className="action-icon-pill detail-desktop-cart" title="View Cart">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span className="badge-counter" id="cartBadge">{cartCount}</span>
              </Link>
            </div>
          </div>

          {/* Expandable Search Overlay */}
          <div className={`expand-search-bar ${searchOverlay ? 'active' : ''}`} id="expandSearchBar" style={{ display: searchOverlay ? 'block' : 'none' }}>
            <form className="search-input-group" onSubmit={e => e.preventDefault()}>
              <input type="text" id="searchInputMbl" placeholder="Search gadgets, smart watches, organizers..." autoComplete="off" />
              <button type="submit" className="search-btn" title="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
              <button type="button" className="search-close-btn" onClick={() => setSearchOverlay(false)}>✕</button>
            </form>
          </div>
        </div>
      </header>

      {/* Sub Nav Bar */}
      <div className="sub-nav-wrapper detail-page-subnav">
        <div className="site-container">
          <div className="sub-nav-inner" style={{ justifyContent: 'space-between' }}>
            <Link href="/" className="detail-back-home" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              <span>Back to Store</span>
            </Link>

            <div className="detail-social-links" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>Connect:</span>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-icon-pill" title="Facebook" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon-pill" title="Instagram" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-icon-pill" title="LinkedIn" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="site-container">
        <div className="breadcrumb-bar" style={{ padding: '0.75rem 0' }}>
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/#products" id="detailBreadcrumbCat">{product.category.toUpperCase()}</Link>
          <span>/</span>
          <strong id="detailBreadcrumbTitle" style={{ color: '#0f172a' }}>{product.title}</strong>
        </div>
      </div>

      {/* Main Product Detail View */}
      <main className="site-container">
        <div className="product-detail-layout" id="productDetailContainer">
          {/* Left: Product Photo */}
          <div className="gallery-container">
            <div className="main-image-display" id="detailImgContainer" style={{ position: 'relative', overflow: 'hidden' }}>
              <img id="detailMainImg" src={activeImage || product.image} alt={product.title} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <div className="thumbs-strip" id="detailThumbsStrip">
              <div className="thumb-box active">
                <img src={product.image} alt={product.title} />
              </div>
            </div>
          </div>

          {/* Right: Product Info & Actions */}
          <div className="detail-info-col">
            <span className="product-badge" id="detailBadge" style={{ position: 'static', display: 'inline-block', width: 'fit-content', marginBottom: '8px' }}>
              {product.badge}
            </span>
            <h1 className="detail-title" id="detailTitle">{product.title}</h1>

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#e6f7ec', color: '#047857', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '99px' }}>
                ● In Stock (Ready to Dispatch)
              </span>
            </div>

            <div className="detail-pricing-box">
              <div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#007382', fontWeight: 700, letterSpacing: '0.5px' }}>Best Price</div>
                <div className="detail-wholesale-price" id="detailPrice">Rs. {product.price.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Market Price</div>
                <div className="detail-original-price" id="detailOrigPrice">Rs. {product.originalPrice.toLocaleString()}</div>
              </div>
              <span className="discount-pill" id="detailDiscountPill">SAVE {savedPercent}%</span>
            </div>

            <p id="detailDescription" style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              {product.description}
            </p>

            {/* Quantity Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Select Quantity:</label>
              <div className="qty-control" style={{ border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '2px' }}>
                <button className="qty-btn" onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))} style={{ width: '36px', height: '36px', fontSize: '1.2rem' }}>−</button>
                <span className="qty-number" id="detailQty" style={{ minWidth: '42px', fontSize: '1.05rem', fontWeight: 700 }}>{selectedQty}</span>
                <button className="qty-btn" onClick={() => setSelectedQty(selectedQty + 1)} style={{ width: '36px', height: '36px', fontSize: '1.2rem' }}>+</button>
              </div>
            </div>

            {/* Product Action Buttons */}
            <div className="detail-action-buttons">
              <div className="detail-actions-row">
                <button className="btn-detail-cart" onClick={handleAddToCart} title="Add to Cart">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  <span>Add to Cart</span>
                </button>
                <button className="btn-detail-whatsapp" onClick={handleWhatsAppOrder} title="Order via WhatsApp">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span>Order via WhatsApp</span>
                </button>
              </div>
              <button className="btn-detail-bulk-wholesale" onClick={handleBulkInquiry} title="Bulk Wholesale Inquiry (Direct Factory Rate)">
                <span>📦 Bulk Order (Buy in Wholesale - Direct Factory Rate)</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            {/* Trust Features Mini Card */}
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                <strong>7 Days Checking Warranty:</strong> Verification &amp; replacement guarantee
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                <strong>Cash on Delivery (COD):</strong> Pay at doorstep across Pakistan
              </div>
            </div>
          </div>
        </div>

        {/* Product Specifications */}
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid #e2e8f0', marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#00363d', marginBottom: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            Product Specifications &amp; Details
          </h3>
          <div id="detailFullSpecs" style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.8 }}>
            <p>{product.description}</p>
            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}><strong>Category:</strong> {product.category}</div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}><strong>Availability:</strong> Ready to dispatch</div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}><strong>Warranty:</strong> 7 Days checking &amp; replacement</div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#00363d', marginBottom: '1.5rem' }}>
            More Products You May Like
          </h2>
          <div className="products-grid" id="relatedProductsGrid">
            {related.map(p => (
              <div key={p.id} className={`product-card cat-${p.category}`}>
                <span className="product-badge">{p.badge}</span>
                <Link href={`/product-detail?id=${p.id}`} className="product-img-wrapper" style={{ display: 'block' }}>
                  <img src={p.image} alt={p.title} />
                </Link>
                <div className="product-card-body">
                  <h3 className="product-title">
                    <Link href={`/product-detail?id=${p.id}`}>{p.title}</Link>
                  </h3>
                  <div className="product-pricing">
                    <span className="original-price">Rs. {p.originalPrice.toLocaleString()}</span>
                    <span className="wholesale-price">Rs. {p.price.toLocaleString()}</span>
                  </div>
                  <div className="product-card-actions">
                    <button className="btn-add-cart" onClick={() => addToCart(p, 1)} title="Add to Cart">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      <span className="btn-cart-text">Add to Cart</span>
                    </button>
                    <Link href="/checkout" onClick={() => addToCart(p, 1)} className="btn-buy-now" title="Direct Checkout" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span>Buy Now</span>
                    </Link>
                  </div>
                  <a href={`https://wa.me/${STORE_CONFIG.whatsappRaw}?text=${encodeURIComponent(`Salam! I want to buy *${p.title}* in Wholesale bulk quantity.`)}`} target="_blank" rel="noreferrer" className="card-wholesale-strip">
                    <span>📦 Buy in Wholesale</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="site-container">
          <div className="footer-grid">
            <div className="footer-col">
              <Link href="/" style={{ display: 'inline-block' }}>
                <img src="/images/save-and-smile-logo.png" alt="Save &amp; Smile" className="footer-brand-logo" />
              </Link>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                Pakistan&apos;s trusted online wholesale portal for trending gadgets, kitchen organizers, smart watches, and home solutions. Providing best reseller margins and doorstep Cash on Delivery across Pakistan.
              </p>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>📞 <strong>Helpline &amp; WhatsApp:</strong> 0316-2323616</div>
                <div>✉️ <strong>Email:</strong> info@saveandsmile.pk</div>
                <div>📍 <strong>Dispatch Center:</strong> Karachi &amp; Lahore, Pakistan</div>
              </div>
            </div>

            <div className="footer-col">
              <h4>Popular Categories</h4>
              <ul className="footer-links">
                <li><Link href="/#products">Storage &amp; Racks</Link></li>
                <li><Link href="/#products">Smart Watches</Link></li>
                <li><Link href="/#products">Mug &amp; Bottles</Link></li>
                <li><Link href="/#products">Insect Killers</Link></li>
                <li><Link href="/#products">Mobile Accessories</Link></li>
                <li><Link href="/#products">Electric Massagers</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Customer Care</h4>
              <ul className="footer-links">
                <li><Link href="/track-order">Track Your Order</Link></li>
                <li><a href={`https://wa.me/${STORE_CONFIG.whatsappRaw}`} target="_blank" rel="noreferrer">Wholesale Bulk Inquiries</a></li>
                <li><Link href="/#flashSale">Flash Deals</Link></li>
                <li><Link href="/cart">View My Cart</Link></li>
                <li><a href={`https://wa.me/${STORE_CONFIG.whatsappRaw}`} target="_blank" rel="noreferrer">Return &amp; Refund Policy</a></li>
                <li><a href={`https://wa.me/${STORE_CONFIG.whatsappRaw}`} target="_blank" rel="noreferrer">Terms &amp; Conditions</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Wholesale Payment Methods</h4>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                We accept Cash on Delivery (COD) across Pakistan, plus online direct transfers via JazzCash, EasyPaisa, and Bank Accounts.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>Cash On Delivery</span>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>JazzCash</span>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>EasyPaisa</span>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>Bank Transfer</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© 2026 Save &amp; Smile (Shop • Save • Smile). All Rights Reserved.</div>
            <div>Direct Wholesale Marketplace in Pakistan • 0316-2323616</div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Bar */}
      <div className="mbl-contact-fixed">
        <Link href="/" className="mbl-nav-item" style={{ textDecoration: 'none' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Home</span>
        </Link>
        <div className="mbl-nav-item" onClick={handleWhatsAppOrder}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>WhatsApp</span>
        </div>
        <Link href="/cart" className="mbl-nav-item" style={{ textDecoration: 'none' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span className="mbl-badge" id="mblCartBadge">{cartCount}</span>
          <span>Cart</span>
        </Link>
      </div>

      {/* Floating WhatsApp */}
      <a href={`https://wa.me/${STORE_CONFIG.whatsappRaw}`} target="_blank" rel="noreferrer" className="floating-whatsapp" title="Buy in Wholesale on WhatsApp">
        💬
        <div className="floating-whatsapp-tooltip">Buy in Wholesale: 0316-2323616</div>
      </a>

      {/* Toast Notice */}
      <div className={`toast-notice ${showToast ? 'active' : ''}`} id="toastNotice" style={{ display: showToast ? 'block' : 'none' }}>
        {toastMsg}
      </div>
    </div>
  );
}
