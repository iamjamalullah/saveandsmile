'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AiAssistant from '@/components/AiAssistant';
import Link from 'next/link';
import { Product, ProductVariant } from '@/lib/types';
import { getClientProducts, getCart, saveCart } from '@/lib/store';

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImg, setActiveImg] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const all = getClientProducts();
    const found = (id ? all.find(p => String(p.id) === String(id)) : null) || all[0];
    if (found) {
      setProduct(found);
      setActiveImg(found.image);
      if (found.variants && found.variants.length > 0) {
        setSelectedVariant(found.variants[0]);
      }
    }
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm font-bold text-slate-500">Loading product details...</p>
      </div>
    );
  }

  // Multi-Image List
  const allImages: string[] = [];
  if (product.image) allImages.push(product.image);
  if (Array.isArray(product.images)) {
    product.images.forEach(img => {
      if (img && !allImages.includes(img)) allImages.push(img);
    });
  }
  if (Array.isArray(product.variants)) {
    product.variants.forEach(v => {
      if (v.image && !allImages.includes(v.image)) allImages.push(v.image);
    });
  }

  // Variant Attributes
  const sizes: string[] = [];
  const colors: ProductVariant[] = [];
  if (Array.isArray(product.variants)) {
    product.variants.forEach(v => {
      if (v.size && !sizes.includes(v.size)) sizes.push(v.size);
      if (v.name && !colors.some(c => c.name === v.name)) colors.push(v);
    });
  }

  function handleAddToCart() {
    if (!product) return;
    const cart = getCart();
    const price = selectedVariant?.price || product.price;
    cart.push({
      id: product.id,
      title: product.title,
      price: price,
      originalPrice: product.originalPrice || product.original_price || price,
      image: activeImg || product.image,
      qty: selectedQty,
      variant: selectedVariant ? { name: selectedVariant.name, size: selectedVariant.size } : undefined
    });
    saveCart(cart);
    alert('✅ Added to Cart successfully!');
  }

  function handleOrderWhatsApp() {
    if (!product) return;
    const price = selectedVariant?.price || product.price;
    const total = price * selectedQty;
    const varInfo = selectedVariant ? ` (Variant: ${selectedVariant.name || ''} ${selectedVariant.size ? '| Size: ' + selectedVariant.size : ''})` : '';
    const msg = `Salam! I want to order this product:%0A%0A` +
                `*Product:* ${product.title}${varInfo}%0A` +
                `*Quantity:* ${selectedQty}%0A` +
                `*Price:* Rs. ${price}%0A` +
                `*Total:* Rs. ${total}%0A%0A` +
                `Please confirm my order and share delivery details.`;
    window.open(`https://wa.me/923162323616?text=${msg}`, '_blank');
  }

  function handleBulkWholesaleWhatsApp() {
    if (!product) return;
    const varInfo = selectedVariant ? ` (Variant: ${selectedVariant.name || ''} ${selectedVariant.size ? '| Size: ' + selectedVariant.size : ''})` : '';
    const msg = `Salam Save & Smile! I want to place a *Bulk Wholesale Order*:%0A%0A` +
                `*Product:* ${product.title}${varInfo}%0A` +
                `*Required Quantity:* Bulk / Wholesale Cartons%0A` +
                `*Product Code:* ${product.code || product.id}%0A%0A` +
                `Please quote the best wholesale deal and dispatch details.`;
    window.open(`https://wa.me/923162323616?text=${msg}`, '_blank');
  }

  const currentPrice = selectedVariant?.price || product.price;
  const origPrice = product.originalPrice || product.original_price || currentPrice;
  const savedPercent = Math.round(((origPrice - currentPrice) / origPrice) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Product Detail Top Sub-nav */}
      <div className="sub-nav-wrapper detail-page-subnav">
        <div className="site-container">
          <div className="sub-nav-inner flex items-center justify-between py-2">
            <Link href="/" className="detail-back-home inline-flex items-center gap-2 text-white font-semibold text-xs">
              <span>← Back to Store</span>
            </Link>
          </div>
        </div>
      </div>

      <main className="site-container my-8 flex-1">
        <div className="product-detail-layout bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left: Gallery & Thumbnails */}
          <div className="gallery-container space-y-4">
            <div className="main-image-display rounded-xl overflow-hidden border border-slate-200 p-4 bg-slate-50 flex items-center justify-center max-h-[420px]">
              <img
                src={activeImg.startsWith('http') || activeImg.startsWith('/') ? activeImg : `/${activeImg}`}
                alt={product.title}
                className="max-h-[380px] w-auto object-contain"
              />
            </div>

            {/* Gallery Thumbnails Strip */}
            {allImages.length > 1 && (
              <div className="thumbs-strip flex gap-2 overflow-x-auto pb-2">
                {allImages.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImg(src)}
                    className={`thumb-box w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 p-1 bg-white ${activeImg === src ? 'border-[#007382]' : 'border-slate-200'}`}
                  >
                    <img
                      src={src.startsWith('http') || src.startsWith('/') ? src : `/${src}`}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info & Selectors */}
          <div className="detail-info-col space-y-4">
            <span className="product-badge inline-block">{product.badge || 'SPECIAL DEAL'}</span>
            <h1 className="text-xl font-black text-slate-900 leading-snug">{product.title}</h1>

            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                ● In Stock (Ready to Dispatch)
              </span>
            </div>

            <div className="detail-pricing-box p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-baseline gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#007382] font-bold">Wholesale Price</div>
                <div className="text-2xl font-black text-[#007382]">Rs. {currentPrice.toLocaleString()}</div>
              </div>
              {origPrice > currentPrice && (
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Market Price</div>
                  <div className="text-base text-slate-400 line-through">Rs. {origPrice.toLocaleString()}</div>
                </div>
              )}
              {savedPercent > 0 && (
                <span className="discount-pill ml-auto text-xs font-bold text-white bg-rose-600 px-2 py-1 rounded-lg">
                  SAVE {savedPercent}%
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>

            {/* Size Variants */}
            {sizes.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>Select Size:</span>
                  <span className="text-[#007382]">{selectedVariant?.size || sizes[0]}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        const m = product.variants?.find(v => v.size === sz);
                        if (m) {
                          setSelectedVariant(m);
                          if (m.image) setActiveImg(m.image);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${selectedVariant?.size === sz ? 'bg-[#e6f7ec] border-[#007382] text-[#007382]' : 'bg-white border-slate-300 text-slate-700'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Variants */}
            {colors.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>Select Color:</span>
                  <span className="text-[#007382]">{selectedVariant?.name || colors[0].name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map(col => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(col);
                        if (col.image) setActiveImg(col.image);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition ${selectedVariant?.name === col.name ? 'bg-[#e6f7ec] border-[#007382] text-[#007382]' : 'bg-white border-slate-300 text-slate-700'}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: col.hex || '#111827' }} />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs font-bold text-slate-800">Quantity:</label>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  −
                </button>
                <span className="px-4 py-1 text-xs font-bold text-slate-800">{selectedQty}</span>
                <button
                  type="button"
                  onClick={() => setSelectedQty(selectedQty + 1)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="detail-action-buttons space-y-2 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="btn-detail-cart py-2.5 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  🛒 Add to Cart
                </button>
                <button
                  type="button"
                  onClick={handleOrderWhatsApp}
                  className="btn-detail-whatsapp py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  💬 WhatsApp Order
                </button>
              </div>

              <button
                type="button"
                onClick={handleBulkWholesaleWhatsApp}
                className="btn-detail-bulk-wholesale w-full py-2.5 px-4 bg-[#007382] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
              >
                <span>📦 Buy in Wholesale (Direct Factory Rate Cartons)</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <AiAssistant />
    </div>
  );
}
