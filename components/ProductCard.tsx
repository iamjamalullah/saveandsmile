'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { getCart, saveCart } from '@/lib/store';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const cart = getCart();
    const existingIdx = cart.findIndex(item => String(item.id) === String(product.id));
    if (existingIdx >= 0) {
      cart[existingIdx].qty += 1;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        originalPrice: product.originalPrice || product.original_price || product.price,
        image: product.image,
        qty: 1
      });
    }
    saveCart(cart);
    window.dispatchEvent(new Event('qadri_open_cart'));

    // Trigger toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 bg-[#00363d] text-white text-xs font-bold py-3 px-5 rounded-2xl shadow-xl z-50 transition-all';
    toast.textContent = `✅ ${product.title.substring(0, 22)}... added to Cart!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    handleAddToCart(e);
    window.location.href = '/checkout';
  }

  function handleWhatsAppDirect(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const msg = `Salam Save & Smile! I want to order this product:%0A%0A` +
                `*Product:* ${product.title}%0A` +
                `*Price:* Rs. ${product.price}%0A` +
                `*Product Code:* ${product.code || product.id}%0A%0A` +
                `Please confirm my order.`;
    window.open(`https://wa.me/923162323616?text=${msg}`, '_blank');
  }

  function handleWholesaleStrip(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const msg = `Salam! I want to buy this product in *Wholesale / Bulk Cartons*:%0A%0A` +
                `*Product:* ${product.title}%0A` +
                `*Product Code:* ${product.code || product.id}%0A%0A` +
                `Please share wholesale carton rate and minimum quantity.`;
    window.open(`https://wa.me/923162323616?text=${msg}`, '_blank');
  }

  const origPrice = product.originalPrice || product.original_price;
  const pIdStr = String(product.id);
  const imgSrc = product.image.startsWith('http') || product.image.startsWith('/')
    ? product.image
    : `/${product.image}`;

  return (
    <div className={`product-card cat-${product.category || 'storage'}`}>
      {product.badge && <span className="product-badge">{product.badge}</span>}

      <div
        className="product-img-wrapper"
        onClick={() => { window.location.href = `/product-detail?id=${encodeURIComponent(pIdStr)}`; }}
      >
        <img src={imgSrc} alt={product.title} loading="lazy" />
      </div>

      <div className="card-quick-actions">
        <button
          type="button"
          className="action-icon-circle"
          title="Add to Wishlist"
          onClick={(e) => {
            e.stopPropagation();
            try {
              const wishlist = JSON.parse(localStorage.getItem('qadri_wishlist') || '[]');
              const exists = wishlist.some((w: any) => String(w) === pIdStr);
              const updated = exists ? wishlist.filter((w: any) => String(w) !== pIdStr) : [...wishlist, pIdStr];
              localStorage.setItem('qadri_wishlist', JSON.stringify(updated));
              window.dispatchEvent(new Event('storage'));
            } catch (err) {}
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <button
          type="button"
          className="action-icon-circle"
          title="Quick View (Forn Dekhein)"
          onClick={(e) => {
            e.stopPropagation();
            if (onQuickView) {
              onQuickView(product);
            } else {
              window.dispatchEvent(new CustomEvent('qadri_open_quick_view', { detail: product }));
            }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>


      <div className="product-card-body">
        <h3
          className="product-title"
          onClick={() => { window.location.href = `/product-detail?id=${encodeURIComponent(pIdStr)}`; }}
        >
          {product.title}
        </h3>

        <div className="product-pricing">
          {origPrice && (
            <span className="original-price">
              <span className="currency-symbol">Rs.</span> {origPrice.toLocaleString()}
            </span>
          )}
          <span className="wholesale-price">
            <span className="currency-symbol">Rs.</span> {product.price.toLocaleString()}
          </span>
        </div>

        <div className="product-card-actions">
          <button type="button" className="btn-add-cart" onClick={handleAddToCart} title="Add to Cart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="btn-cart-text">Add</span>
          </button>
          <button type="button" className="btn-buy-now" onClick={handleBuyNow} title="Buy Now & Checkout">
            <span className="btn-buy-text">⚡ Buy Now</span>
          </button>
          <button type="button" className="btn-whatsapp-direct" onClick={handleWhatsAppDirect} title="Order via WhatsApp">
            <svg viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </button>
        </div>

        <div className="card-wholesale-strip" onClick={handleWholesaleStrip}>
          <span>📦 Buy in Wholesale</span>
        </div>

      </div>
    </div>
  );
}
