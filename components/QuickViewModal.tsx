'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { getCart, saveCart } from '@/lib/store';

interface QuickViewModalProps {
  product?: Product | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function QuickViewModal({
  product: controlledProduct,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose
}: QuickViewModalProps) {
  const [internalProduct, setInternalProduct] = useState<Product | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');

  // Support both controlled props and global event trigger
  const activeProduct = controlledProduct !== undefined ? controlledProduct : internalProduct;
  const showModal = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    function handleOpenEvent(e: any) {
      if (e.detail) {
        setInternalProduct(e.detail);
        setActiveImage(e.detail.image || '');
        setQuantity(1);
        setInternalOpen(true);
      }
    }

    window.addEventListener('qadri_open_quick_view', handleOpenEvent);
    return () => window.removeEventListener('qadri_open_quick_view', handleOpenEvent);
  }, []);

  useEffect(() => {
    if (activeProduct) {
      setActiveImage(activeProduct.image || '');
      setQuantity(1);
    }
  }, [activeProduct]);

  if (!showModal || !activeProduct) return null;

  const origPrice = activeProduct.originalPrice || activeProduct.original_price;
  const pIdStr = String(activeProduct.id);
  const currentImg = activeImage || activeProduct.image;
  const imgSrc = currentImg.startsWith('http') || currentImg.startsWith('/')
    ? currentImg
    : `/${currentImg}`;

  const allImages: string[] = [activeProduct.image];
  if (Array.isArray(activeProduct.images)) {
    activeProduct.images.forEach(img => {
      if (img && !allImages.includes(img)) allImages.push(img);
    });
  }

  function handleAddToCart() {
    if (!activeProduct) return;
    const cart = getCart();
    const existingIdx = cart.findIndex(item => String(item.id) === String(activeProduct.id));
    if (existingIdx >= 0) {
      cart[existingIdx].qty += quantity;
    } else {
      cart.push({
        id: activeProduct.id,
        title: activeProduct.title,
        price: activeProduct.price,
        originalPrice: activeProduct.originalPrice || activeProduct.original_price || activeProduct.price,
        image: activeProduct.image,
        qty: quantity
      });
    }
    saveCart(cart);
    window.dispatchEvent(new Event('qadri_open_cart'));
    handleClose();
  }

  function handleBuyNow() {
    handleAddToCart();
    window.location.href = '/checkout';
  }

  function handleWhatsAppOrder() {
    if (!activeProduct) return;
    const msg = `Salam Save & Smile! I want to order this product from Quick View:%0A%0A` +
                `*Product:* ${activeProduct.title}%0A` +
                `*Quantity:* ${quantity}%0A` +
                `*Price:* Rs. ${activeProduct.price}%0A` +
                `*Product Code:* ${activeProduct.code || activeProduct.id}%0A%0A` +
                `Please confirm my order.`;
    window.open(`https://wa.me/923162323616?text=${msg}`, '_blank');
  }

  function handleWholesaleWhatsApp() {
    if (!activeProduct) return;
    const msg = `Salam! I want to buy this product in *Wholesale*:%0A%0A` +
                `*Product:* ${activeProduct.title}%0A` +
                `*Product Code:* ${activeProduct.code || activeProduct.id}%0A%0A` +
                `Please quote the wholesale deal for resellers.`;
    window.open(`https://wa.me/923162323616?text=${msg}`, '_blank');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative flex flex-col md:flex-row overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition"
          title="Close"
        >
          ✕
        </button>

        {/* Left Side: Product Image Display */}
        <div className="md:w-1/2 p-5 sm:p-6 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col items-center justify-center">
          <div className="w-full h-64 sm:h-72 bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center justify-center overflow-hidden shadow-xs relative">
            {activeProduct.badge && (
              <span className="absolute top-3 left-3 bg-[#007382] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                {activeProduct.badge}
              </span>
            )}
            <img
              src={imgSrc}
              alt={activeProduct.title}
              className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Thumbnails if multiple images */}
          {allImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto w-full py-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`w-12 h-12 rounded-xl border bg-white p-1 overflow-hidden shrink-0 transition ${
                    (activeImage || activeProduct.image) === img
                      ? 'border-[#007382] ring-2 ring-[#007382]/20'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={img.startsWith('http') || img.startsWith('/') ? img : `/${img}`}
                    alt="Thumbnail"
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details & Action Buttons */}
        <div className="md:w-1/2 p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {activeProduct.category || 'Wholesale Gadget'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Code: {activeProduct.code || activeProduct.id}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {activeProduct.title}
            </h2>

            {/* Price section */}
            <div className="flex items-baseline gap-3 pt-1">
              <div className="text-2xl font-black text-[#007382]">
                <span className="text-sm font-bold text-slate-500 mr-1">Rs.</span>
                {activeProduct.price.toLocaleString()}
              </div>
              {origPrice && origPrice > activeProduct.price && (
                <div className="text-sm text-slate-400 line-through">
                  Rs. {origPrice.toLocaleString()}
                </div>
              )}
            </div>

            {/* Wholesale Info Strip */}
            <div
              onClick={handleWholesaleWhatsApp}
              className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-2 text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-amber-100 transition"
            >
              <span className="flex items-center gap-1.5">
                <span>📦</span>
                <span>Buy in Wholesale</span>
              </span>
              <span className="text-amber-700 text-[11px]">Chat on WhatsApp ➔</span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-bold text-slate-600">Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1 text-slate-600 hover:bg-slate-200 font-bold transition"
                >
                  -
                </button>
                <span className="px-3 py-1 text-xs font-bold text-slate-900 min-w-[28px] text-center bg-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="px-3 py-1 text-slate-600 hover:bg-slate-200 font-bold transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons Group (Shopify Pro Style) */}
          <div className="space-y-2 pt-5 border-t border-slate-100 mt-4">
            {/* Khobsorat Buy Now Button */}
            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition transform active:scale-98 cursor-pointer"
            >
              <span className="text-base">⚡</span>
              <span>BUY NOW — FAST CHECKOUT</span>
            </button>

            {/* Add to Cart & WhatsApp in Row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="py-2.5 px-3 rounded-xl bg-[#007382] hover:bg-[#005a66] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="py-2.5 px-3 rounded-xl bg-[#25d366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <span className="text-sm">💬</span>
                <span>WhatsApp</span>
              </button>
            </div>

            {/* View Full Page Link */}
            <div className="text-center pt-2">
              <Link
                href={`/product-detail?id=${encodeURIComponent(pIdStr)}`}
                onClick={handleClose}
                className="text-xs font-bold text-[#007382] hover:underline"
              >
                View Full Product Specifications &amp; Reviews →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
