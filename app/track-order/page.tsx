'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { STORE_CONFIG } from '@/lib/data';
import { getCartCount } from '@/lib/cart';

interface OrderItem {
  id?: number;
  title: string;
  price: number;
  qty: number;
  image?: string;
}

interface OrderRecord {
  orderId: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  payment?: string;
  subtotal?: number;
  shippingFee?: number;
  grandTotal?: number;
  status?: string;
  date?: string;
  courier?: string;
  trackingNumber?: string;
  items?: OrderItem[];
}

const SAMPLE_ORDERS: OrderRecord[] = [
  {
    orderId: 'SNS-484209',
    name: 'Muhammad Hammad',
    phone: '0300-1234567',
    address: 'House #42, Street 7, Gulshan-e-Iqbal',
    city: 'Karachi',
    payment: 'Cash on Delivery (COD)',
    status: 'Preparing',
    courier: 'Leopards Courier',
    trackingNumber: 'LEOP-849201',
    grandTotal: 4850,
    date: new Date().toISOString(),
    items: [
      { title: 'T900 Ultra 2 Big Display Smart Watch', price: 2450, qty: 1, image: '/images/products/t900-ultra-2.webp' },
      { title: 'M90 Pro Wireless Gaming Earbuds', price: 2200, qty: 1, image: '/images/products/m90-pro.webp' }
    ]
  },
  {
    orderId: 'SNS-100201',
    name: 'Ahmed Raza',
    phone: '0321-7654321',
    address: 'Plaza 14, Commercial Area, DHA Phase 5',
    city: 'Lahore',
    payment: 'Cash on Delivery (COD)',
    status: 'Shipped',
    courier: 'Trax Logistics',
    trackingNumber: 'TRX-551928',
    grandTotal: 3200,
    date: new Date(Date.now() - 86400000).toISOString(),
    items: [
      { title: 'Wireless Microphone K9 Dual Lightning & Type-C', price: 3000, qty: 1, image: '/images/products/k9-mic.webp' }
    ]
  },
  {
    orderId: 'SNS-204918',
    name: 'Zubair Khan',
    phone: '0333-9876543',
    address: 'Sector F-8/2, Street 19',
    city: 'Islamabad',
    payment: 'JazzCash',
    status: 'Pending',
    courier: 'Call Courier',
    trackingNumber: 'CC-901824',
    grandTotal: 2500,
    date: new Date().toISOString(),
    items: [
      { title: 'Mini Portable Pocket Printer', price: 2300, qty: 1, image: '/images/products/mini-printer.webp' }
    ]
  }
];

export default function TrackOrderPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedOrder, setMatchedOrder] = useState<OrderRecord | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
    const handleCartUpdate = () => setCartCount(getCartCount());
    window.addEventListener('cart-updated', handleCartUpdate);

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('track') || urlParams.get('orderId') || urlParams.get('id');
      if (q) {
        setSearchInput(q);
        performSearch(q);
      }
    }
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const getStoredOrders = (): OrderRecord[] => {
    try {
      const local = JSON.parse(localStorage.getItem('qadri_placed_orders') || '[]');
      return [...local, ...SAMPLE_ORDERS];
    } catch {
      return SAMPLE_ORDERS;
    }
  };

  const performSearch = (q: string) => {
    const cleanQ = q.replace(/[#\s-]/g, '').toLowerCase();
    if (!cleanQ) return;
    setSearched(true);

    const orders = getStoredOrders();
    const cleanPhoneQ = q.replace(/[^0-9]/g, '');

    const found = orders.find(o => {
      const oId = (o.orderId || '').replace(/[#\s-]/g, '').toLowerCase();
      const tNum = (o.trackingNumber || '').replace(/[#\s-]/g, '').toLowerCase();
      const phone = (o.phone || '').replace(/[^0-9]/g, '');
      const name = (o.name || '').toLowerCase();

      return oId.includes(cleanQ) || cleanQ.includes(oId) || (tNum && tNum.includes(cleanQ)) || (cleanPhoneQ && phone.includes(cleanPhoneQ)) || name.includes(q.toLowerCase());
    });

    setMatchedOrder(found || null);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) {
      alert('Please enter an Order ID or Phone number.');
      return;
    }
    performSearch(searchInput.trim());
  };

  const renderTimeline = (o: OrderRecord) => {
    const normStatus = (o.status || 'Pending').toLowerCase().trim();
    let stageNumber = 1;
    let statusBadgeBg = '#fef3c7';
    let statusBadgeText = '#92400e';
    let statusBadgeBorder = '#fde68a';
    let statusTitle = '🕒 Order Masool / Pending Verification';
    let statusUrduNotice = 'Aap ka order system mein masool ho chuka hai. Hamari support team jald verification ke liye call ya WhatsApp par rabta karegi.';
    let stageSub = 'Verification desk par active';

    if (normStatus.includes('confirm')) {
      stageNumber = 2;
      statusBadgeBg = '#ccfbf1';
      statusBadgeText = '#0f766e';
      statusBadgeBorder = '#99f6e4';
      statusTitle = '✍️ Order Confirmed';
      statusUrduNotice = 'Aap ka order kamyabi se confirm ho gaya hai aur packaging queue mein transfer kar diya gaya hai.';
      stageSub = 'Order verified via WhatsApp/Call';
    } else if (normStatus.includes('prepar') || normStatus.includes('process') || normStatus.includes('pack')) {
      stageNumber = 3;
      statusBadgeBg = '#e0f2fe';
      statusBadgeText = '#0369a1';
      statusBadgeBorder = '#bae6fd';
      statusTitle = '📦 Parcel Prepare Ho Raha Hai (Warehouse Packaging)';
      statusUrduNotice = '📦 Hamare central warehouse mein aap ke parcel ki quality inspection, testing aur protective bubble packaging jari hai. Jald courier van ko handover kiya jaega.';
      stageSub = 'Packaging & QC inspection in progress';
    } else if (normStatus.includes('ship') || normStatus.includes('dispatch') || normStatus.includes('transit')) {
      stageNumber = 4;
      statusBadgeBg = '#e0e7ff';
      statusBadgeText = '#3730a3';
      statusBadgeBorder = '#c7d2fe';
      statusTitle = '🚚 Courier Handover / In Transit';
      statusUrduNotice = `🚚 Aap ka parcel courier partner (${o.courier || 'Leopards / Trax'}) ko handover ho chuka hai aur transit mein rawana hai.`;
      stageSub = 'In transit to your destination';
    } else if (normStatus.includes('deliver') && !normStatus.includes('out')) {
      stageNumber = 5;
      statusBadgeBg = '#dcfce7';
      statusBadgeText = '#15803d';
      statusBadgeBorder = '#bbf7d0';
      statusTitle = '✅ Parcel Successfully Delivered';
      statusUrduNotice = '🎉 Mubarak ho! Parcel kamyabi se aap ke address par pohnch gaya hai. Save & Smile par shopping karne ka shukriya!';
      stageSub = 'Order completed successfully';
    } else if (normStatus.includes('cancel')) {
      stageNumber = 0;
      statusBadgeBg = '#ffe4e6';
      statusBadgeText = '#be123c';
      statusBadgeBorder = '#fecdd3';
      statusTitle = '❌ Order Cancelled';
      statusUrduNotice = 'Yeh order cancel ho chuka hai. Mazeed maloomat ke liye hamari helpline se rabta karen.';
      stageSub = 'Cancelled';
    }

    const trackingCode = o.trackingNumber || ('LEOP-' + Math.floor(100000 + Math.random() * 900000));
    const courierName = o.courier || 'Leopards Courier Pakistan';
    const orderDate = o.date ? new Date(o.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today';

    const steps = [
      { num: 1, label: 'Order Placed', urdu: 'آرڈر موصول', desc: 'Pending' },
      { num: 2, label: 'Confirmed', urdu: 'کنفرم', desc: 'Verified' },
      { num: 3, label: 'Preparing', urdu: 'تیاری / پیکنگ', desc: 'Packaging' },
      { num: 4, label: 'In Transit', urdu: 'روانہ کوریئر', desc: 'Dispatched' },
      { num: 5, label: 'Delivered', urdu: 'ڈلیور', desc: 'Completed' }
    ];

    return (
      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', marginTop: '10px' }}>
        {/* Top Status Banner */}
        <div style={{ background: statusBadgeBg, borderBottom: `1.5px solid ${statusBadgeBorder}`, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: statusBadgeText }}>
                {statusTitle}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: statusBadgeText, opacity: 0.9, marginTop: '3px' }}>
              {stageSub} • Date: {orderDate}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>Order Tracking ID</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, fontFamily: 'monospace', color: '#064C63' }}>#{o.orderId}</div>
          </div>
        </div>

        {/* Live Notice Bar */}
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 18px', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>ℹ️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#0f172a' }}>Current Stage Update:</strong> {statusUrduNotice}
          </div>
        </div>

        {/* 5-Step Visual Stepper */}
        <div style={{ padding: '22px 14px 18px 14px', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: '580px', margin: '0 auto' }}>
            {steps.map((s, idx) => {
              const isCompleted = stageNumber >= s.num;
              const isCurrent = stageNumber === s.num;
              let circleBg = '#e2e8f0';
              let circleColor = '#64748b';
              let ringStyle = 'none';

              if (isCompleted) {
                circleBg = '#064C63';
                circleColor = '#ffffff';
              }
              if (isCurrent) {
                circleBg = '#008FAF';
                circleColor = '#ffffff';
                ringStyle = '0 0 0 4px rgba(0, 143, 175, 0.25)';
              }
              const lineActive = stageNumber > s.num;

              return (
                <div key={s.num} style={{ flex: 1, position: 'relative', textAlign: 'center' }}>
                  {idx > 0 && (
                    <div style={{ position: 'absolute', top: '16px', left: '-50%', width: '100%', height: '3px', background: lineActive ? '#064C63' : '#e2e8f0', zIndex: 1 }}></div>
                  )}
                  <div style={{ position: 'relative', zIndex: 2, width: '34px', height: '34px', margin: '0 auto 6px', borderRadius: '50%', background: circleBg, color: circleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 800, boxShadow: ringStyle, transition: 'all 0.3s' }}>
                    {isCompleted && !isCurrent ? '✓' : (s.num === 3 ? '📦' : (s.num === 4 ? '🚚' : (s.num === 5 ? '🏠' : s.num)))}
                  </div>
                  <div style={{ fontSize: '0.76rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#064C63' : (isCompleted ? '#0f172a' : '#94a3b8'), lineHeight: 1.2 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: isCurrent ? '#008FAF' : '#94a3b8', marginTop: '2px' }}>
                    {s.urdu}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Courier & Destination Details */}
        <div style={{ padding: '16px 18px', background: '#fafbfc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '0.83rem' }}>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Courier Service</div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🚚</span> <span>{courierName}</span>
              </div>
              <div style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#0284c7', fontWeight: 700 }}>
                Tracking CN: {trackingCode}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Delivery Destination</div>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>{o.name || 'Valued Customer'}</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                {o.address || 'Address provided'}, {o.city || 'Pakistan'}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                📞 {o.phone || 'N/A'}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Summary</div>
              <div style={{ fontWeight: 900, color: '#064C63', fontSize: '1.05rem' }}>Rs. {(o.grandTotal || 0).toLocaleString()}</div>
              <div style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 700, marginTop: '2px' }}>
                ✓ Mode: {o.payment || 'Cash on Delivery (COD)'}
              </div>
            </div>
          </div>
        </div>

        {/* Items in Order */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontSize: '0.83rem' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Order Items ({(o.items || []).length}):</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(o.items || []).map((i, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {i.image && <img src={i.image} alt={i.title} style={{ width: '34px', height: '34px', objectFit: 'contain', borderRadius: '6px', background: 'white', border: '1px solid #e2e8f0' }} />}
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{i.title}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Qty: {i.qty || 1} unit(s)</div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>Rs. {((i.price || 0) * (i.qty || 1)).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div style={{ padding: '14px 18px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Koi sawal ya issue hai? Hamari team se WhatsApp par fori rabta karen.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a 
              href={`https://wa.me/${STORE_CONFIG.whatsappRaw}?text=${encodeURIComponent(`Salam! Mera Save & Smile Order #${o.orderId} (${stageSub}) k baray mein inquiry chahiye.`)}`} 
              target="_blank" 
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#25D366', color: 'white', padding: '9px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.83rem', textDecoration: 'none', boxShadow: '0 2px 6px rgba(37,211,102,0.25)' }}
            >
              <span>WhatsApp Support</span>
            </a>
            <button 
              onClick={() => { setSearchInput(''); setSearched(false); setMatchedOrder(null); }} 
              style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '9px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer' }}
            >
              Track Another Order
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Top Announcement Bar */}
      <aside className="top-announcement-bar">
        <div className="site-container announcement-content">
          <div className="announcement-item">
            <span className="announce-icon">🚀</span>
            <span>Welcome to <strong>Save &amp; Smile Wholesale Portal</strong></span>
          </div>
          <div className="announcement-item">
            <span className="announce-icon">🔥</span>
            <span>Direct Factory Rates &amp; High Reseller Profit Margins</span>
          </div>
          <div className="announcement-item">
            <span className="announce-icon">🚚</span>
            <span>Cash on Delivery (COD) Across Pakistan</span>
          </div>
        </div>
      </aside>

      {/* Main Header */}
      <header className="header-wrapper" id="headerSection">
        <div className="site-container">
          <div className="header-inner">
            <div className="header-left-group">
              <h1 className="brand-heading-seo" style={{ margin: 0, padding: 0, lineHeight: 1 }}>
                <Link href="/" className="brand-logo" title="Save & Smile - Shop • Save • Smile | Wholesale Store Pakistan">
                  <img src="/images/save-and-smile-logo.png" alt="Save &amp; Smile - Wholesale Gadgets Pakistan" className="site-brand-logo" />
                </Link>
              </h1>
            </div>

            {/* Desktop Center Navigation Menu */}
            <nav className="desktop-center-nav">
              <Link href="/" className="desktop-nav-link">Home</Link>
              <Link href="/#flashSale" className="desktop-nav-link">Deals</Link>
              <Link href="/track-order" className="desktop-nav-link active">Track Order</Link>
              <Link href="/cart" className="desktop-nav-link">Cart</Link>
              <a href={`https://wa.me/${STORE_CONFIG.whatsappRaw}?text=Salam!%20I%20want%20to%20Buy%20in%20Wholesale`} target="_blank" rel="noreferrer" className="desktop-nav-link wholesale-pill">Wholesale</a>
            </nav>

            {/* Right Header Icons */}
            <div className="header-actions">
              <a href={`https://wa.me/${STORE_CONFIG.whatsappRaw}`} target="_blank" rel="noreferrer" className="action-icon-pill hotline-icon-pill" title="WhatsApp Support">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <Link href="/cart" className="action-icon-pill" title="View Cart">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <span className="badge-counter" id="cartBadge">{cartCount}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="track-hero">
        <div className="site-container">
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Real-Time Courier &amp; Fulfillment
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '10px 0 6px 0', letterSpacing: '-0.5px' }}>
            Track Your Order &amp; Parcel Status
          </h1>
          <p style={{ fontSize: '0.95rem', opacity: 0.9, maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
            Check whether your parcel is in <strong>Pending</strong>, currently being <strong>Prepared in Warehouse</strong>, or <strong>Dispatched with Courier</strong>.
          </p>

          <form onSubmit={handleSearchSubmit} className="track-search-box">
            <input 
              type="text" 
              id="pageTrackInput" 
              className="track-input-large" 
              placeholder="Enter Order ID (e.g. SNS-484209) or Mobile Number..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit" className="track-btn-large">
              <span>Track Parcel</span>
              <span>🔍</span>
            </button>
          </form>

          <div className="track-chips">
            <span style={{ opacity: 0.85 }}>Sample Orders:</span>
            <button type="button" className="track-chip-btn" onClick={() => { setSearchInput('SNS-484209'); performSearch('SNS-484209'); }}>#SNS-484209 (Preparing)</button>
            <button type="button" className="track-chip-btn" onClick={() => { setSearchInput('SNS-100201'); performSearch('SNS-100201'); }}>#SNS-100201 (Shipped)</button>
            <button type="button" className="track-chip-btn" onClick={() => { setSearchInput('SNS-204918'); performSearch('SNS-204918'); }}>#SNS-204918 (Pending)</button>
          </div>
        </div>
      </section>

      {/* Tracking Result Area */}
      <main className="track-display-wrap">
        <div id="pageTrackResultContainer">
          {!searched && (
            <div style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '14px', padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📦</div>
              <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>Live Parcel Tracking Ready</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 16px auto', lineHeight: 1.6 }}>
                Upar Order ID ya phone number likh kar <strong>&quot;Track Parcel&quot;</strong> par click karen. Aap ko parcel ki mukammal live status (Pending, Packing, Shipped, Delivered) nazar aayegi.
              </p>
            </div>
          )}

          {searched && !matchedOrder && (
            <div style={{ background: '#fff', border: '1.5px dashed #cbd5e1', borderRadius: '14px', padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>Koi Order Nahi Mila</h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 16px auto', lineHeight: 1.6 }}>
                Aap ka darj kardah number <strong>&quot;{searchInput}&quot;</strong> system mein match nahi hua. Barah-e-karam apna durust Order ID ya Phone number darj karen.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => { setSearchInput('SNS-484209'); performSearch('SNS-484209'); }} style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.8rem', color: '#064C63', cursor: 'pointer' }}>Test #SNS-484209</button>
                <button onClick={() => { setSearchInput('SNS-100201'); performSearch('SNS-100201'); }} style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.8rem', color: '#064C63', cursor: 'pointer' }}>Test #SNS-100201</button>
              </div>
            </div>
          )}

          {searched && matchedOrder && renderTimeline(matchedOrder)}
        </div>
      </main>
    </div>
  );
}
