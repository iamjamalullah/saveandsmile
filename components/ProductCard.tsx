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

    // Show quick toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 bg-[#00363d] text-white text-xs font-bold py-3 px-5 rounded-2xl shadow-xl z-50 transition-all';
    toast.textContent = `✅ ${product.title.substring(0, 20)}... added to Cart!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function handleOrderNow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    handleAddToCart(e);
    window.location.href = '/checkout';
  }

  const savedPercent = (product.originalPrice || product.original_price)
    ? Math.round((((product.originalPrice || product.original_price)! - product.price) / (product.originalPrice || product.original_price)!) * 100)
    : 0;

  const imgSrc = product.image.startsWith('http') || product.image.startsWith('/')
    ? product.image
    : `/${product.image}`;

  return (
    <div className="product-card group relative">
      <Link href={`/product-detail?id=${product.id}`} className="block">
        <div className="product-card-img-wrap relative overflow-hidden bg-slate-50 rounded-xl">
          <span className="product-badge absolute top-2 left-2 z-10">{product.badge || 'HOT'}</span>
          <img
            src={imgSrc}
            alt={product.title}
            className="product-card-img w-full h-48 object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        <div className="product-card-body p-3">
          <div className="product-card-cat text-[11px] text-slate-400 uppercase font-semibold">{product.category}</div>
          <h3 className="product-card-title text-xs font-bold text-slate-800 line-clamp-2 h-8 my-1" title={product.title}>
            {product.title}
          </h3>

          <div className="product-card-price-row flex items-baseline gap-2 mt-2">
            <span className="product-card-price text-sm font-black text-[#007382]">Rs. {product.price.toLocaleString()}</span>
            {(product.originalPrice || product.original_price) && (
              <span className="product-card-orig-price text-xs text-slate-400 line-through">
                Rs. {(product.originalPrice || product.original_price)!.toLocaleString()}
              </span>
            )}
            {savedPercent > 0 && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                -{savedPercent}%
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action Buttons: Order Now & Add to Cart */}
      <div className="product-card-actions px-3 pb-3 flex gap-2">
        <button
          type="button"
          onClick={handleOrderNow}
          className="btn-order-now flex-1 py-1.5 bg-[#007382] hover:bg-[#005a66] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
        >
          <span>⚡ Order Now</span>
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          className="btn-add-cart p-1.5 border border-slate-300 hover:border-[#007382] text-slate-700 hover:text-[#007382] rounded-lg transition"
          title="Add to Cart"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
