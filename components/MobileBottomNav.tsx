'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MobileBottomNavProps {
  onOpenCart?: () => void;
  onOpenCategories?: () => void;
}

export default function MobileBottomNav({ onOpenCart, onOpenCategories }: MobileBottomNavProps) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('qadri_cart') || '[]');
        const count = cart.reduce((sum: number, item: any) => sum + (item.qty || 1), 0);
        setCartCount(count);
      } catch (e) {
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener('qadri_cart_updated', updateCount);
    window.addEventListener('storage', updateCount);

    return () => {
      window.removeEventListener('qadri_cart_updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  return (
    <div className="mbl-contact-fixed">
      <div className="mbl-nav-item active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Home</span>
      </div>

      <div className="mbl-nav-item" onClick={onOpenCategories || (() => window.scrollTo({ top: 400, behavior: 'smooth' }))}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        <span>Categories</span>
      </div>

      <div className="mbl-nav-item" onClick={() => window.open('https://wa.me/923162323616', '_blank')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <span>WhatsApp</span>
      </div>

      <div className="mbl-nav-item" onClick={onOpenCart || (() => { window.location.href = '/cart'; })}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span className="mbl-badge" id="mblCartBadge">{cartCount}</span>
        <span>Cart</span>
      </div>
    </div>
  );
}
