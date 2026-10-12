'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSlider from '@/components/HeroSlider';
import CategoryMarquee from '@/components/CategoryMarquee';
import TrustFeatures from '@/components/TrustFeatures';
import SearchHero from '@/components/SearchHero';
import FlashSaleTimer from '@/components/FlashSaleTimer';
import ProductCard from '@/components/ProductCard';
import VideoReels from '@/components/VideoReels';
import Reviews from '@/components/Reviews';
import CartDrawer from '@/components/CartDrawer';
import MobileBottomNav from '@/components/MobileBottomNav';
import AiAssistant from '@/components/AiAssistant';
import { Product } from '@/lib/types';
import { getClientProducts } from '@/lib/store';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartOpen, setCartOpen] = useState<boolean>(false);

  useEffect(() => {
    // 1. Instant hydration from client cache
    setProducts(getClientProducts());

    // 2. Fetch live products from backend API (database / sync file)
    function fetchLiveProducts() {
      fetch('/api/products', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.products) && data.products.length > 0) {
            try {
              localStorage.setItem('save_and_smile_server_products', JSON.stringify(data.products));
            } catch (e) {}
            setProducts(getClientProducts());
          }
        })
        .catch(() => {});
    }

    fetchLiveProducts();

    function handleSync(e: any) {
      if (e.data && e.data.type === 'qadri_sync_products') {
        setProducts(e.data.products);
      } else {
        setProducts(getClientProducts());
        fetchLiveProducts();
      }
    }

    window.addEventListener('message', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('qadri_products_updated', handleSync);

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('qadri_store_sync');
        channel.onmessage = () => fetchLiveProducts();
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('message', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('qadri_products_updated', handleSync);
      if (channel) channel.close();
    };
  }, []);

  const categories = [
    { key: 'all', label: 'All Wholesale Items' },
    { key: 'storage', label: 'Storage & Racks' },
    { key: 'household', label: 'Household' },
    { key: 'kitchen', label: 'Kitchen Gadgets' },
    { key: 'smart-watch', label: 'Smart Watches' },
    { key: 'bottles', label: 'Mug & Bottles' }
  ];

  const filteredProducts = products.filter(p => {
    const matchesTab = activeTab === 'all' || (p.category && p.category.toLowerCase().includes(activeTab.toLowerCase()));
    const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  // Categorized sections for rich storefront display
  const hotSellingProducts = products.filter(p => p.badge?.toLowerCase().includes('hot') || p.isFlashSale).slice(0, 4);
  const newArrivalProducts = products.slice(0, 4);
  const trendingProducts = products.filter(p => p.badge?.toLowerCase().includes('trending') || p.badge?.toLowerCase().includes('sale') || Number(p.price) > 300).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onOpenCart={() => setCartOpen(true)} />

      {/* Sub Nav / Category Strip */}
      <div className="sub-nav-wrapper">
        <div className="site-container">
          <div className="sub-nav-inner flex items-center justify-between overflow-x-auto py-2">
            <div className="flex gap-2">
              {categories.map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActiveTab(c.key)}
                  className={`sub-nav-btn px-3 py-1 rounded-full text-xs font-bold transition ${activeTab === c.key ? 'bg-white text-[#007382] shadow-sm' : 'text-white/80 hover:text-white'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* In-strip Quick Search */}
            <div className="relative min-w-[200px]">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs py-1 px-3 pl-7 rounded-full bg-white/20 text-white placeholder-white/70 outline-none focus:bg-white focus:text-slate-900 transition"
              />
              <span className="absolute left-2.5 top-1.5 text-xs text-white/70">🔍</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Dynamic Hero Slider */}
        <HeroSlider />

        {/* Circular Category Strip / Marquee */}
        <CategoryMarquee onSelectCategory={(catId) => {
          setActiveTab(catId);
          const el = document.getElementById('products');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }} />

        {/* Trust & Value Proposition Features */}
        <TrustFeatures />

        {/* PORTION 1: Hot Selling Products */}
        {hotSellingProducts.length > 0 && (
          <section className="store-portion-section portion-hot-selling py-8 bg-[#fff9f5]" id="hotSelling">
            <div className="site-container">
              <div className="portion-header-bar mb-6">
                <div className="portion-title-group flex items-center gap-3">
                  <span className="portion-pill-tag bg-orange-600 text-white font-black text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider">🔥 HOT SELLING</span>
                  <div>
                    <h2 className="portion-heading-text text-xl font-black text-slate-900">Hot Selling Wholesale Gadgets</h2>
                    <p className="portion-subtitle-text text-xs text-slate-500">Fast moving products with highest reseller profit margins</p>
                  </div>
                </div>
              </div>
              <div className="products-grid">
                {hotSellingProducts.map(product => (
                  <ProductCard key={`hot-${product.id}`} product={product} />
                ))}
              </div>
              <div className="portion-bottom-action flex justify-center mt-6">
                <a href="#products" onClick={() => setActiveTab('all')} className="portion-view-all px-5 py-2 rounded-full border border-orange-500 text-orange-600 text-xs font-bold hover:bg-orange-600 hover:text-white transition">
                  See All Hot Items →
                </a>
              </div>
            </div>
          </section>
        )}

        {/* PORTION 2: New Arrivals */}
        {newArrivalProducts.length > 0 && (
          <section className="store-portion-section portion-new-arrivals py-8 bg-[#f5fbf6]" id="newArrivals">
            <div className="site-container">
              <div className="portion-header-bar mb-6">
                <div className="portion-title-group flex items-center gap-3">
                  <span className="portion-pill-tag bg-emerald-600 text-white font-black text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider">✨ NEW ARRIVALS</span>
                  <div>
                    <h2 className="portion-heading-text text-xl font-black text-slate-900">Latest New Arrivals</h2>
                    <p className="portion-subtitle-text text-xs text-slate-500">Fresh containers imported this week — First batch wholesale prices</p>
                  </div>
                </div>
              </div>
              <div className="products-grid">
                {newArrivalProducts.map(product => (
                  <ProductCard key={`new-${product.id}`} product={product} />
                ))}
              </div>
              <div className="portion-bottom-action flex justify-center mt-6">
                <a href="#products" onClick={() => setActiveTab('all')} className="portion-view-all px-5 py-2 rounded-full border border-emerald-500 text-emerald-600 text-xs font-bold hover:bg-emerald-600 hover:text-white transition">
                  See All New Arrivals →
                </a>
              </div>
            </div>
          </section>
        )}

        {/* PORTION 3: Flash Sale with Live Timer */}
        <FlashSaleTimer />

        {/* PORTION 4: Trending Wholesale Picks */}
        {trendingProducts.length > 0 && (
          <section className="store-portion-section portion-trending-gadgets py-8 bg-[#f0f9fa]" id="trendingPicks">
            <div className="site-container">
              <div className="portion-header-bar mb-6">
                <div className="portion-title-group flex items-center gap-3">
                  <span className="portion-pill-tag bg-[#007382] text-white font-black text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider">🌟 TRENDING PICKS</span>
                  <div>
                    <h2 className="portion-heading-text text-xl font-black text-[#00363d]">Trending Wholesale Picks</h2>
                    <p className="portion-subtitle-text text-xs text-slate-500">Most demanded smart watches, organizers &amp; lifestyle essentials</p>
                  </div>
                </div>
              </div>
              <div className="products-grid">
                {trendingProducts.map(product => (
                  <ProductCard key={`trend-${product.id}`} product={product} />
                ))}
              </div>
              <div className="portion-bottom-action flex justify-center mt-6">
                <a href="#products" onClick={() => setActiveTab('all')} className="portion-view-all px-5 py-2 rounded-full border border-[#007382] text-[#007382] text-xs font-bold hover:bg-[#007382] hover:text-white transition">
                  See All Trending →
                </a>
              </div>
            </div>
          </section>
        )}

        {/* PORTION 5: Main Products Catalog */}
        <section id="products" className="py-8">
          <div className="site-container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-[#00363d]">Trending Wholesale Catalog</h2>
                <p className="text-xs text-slate-500 mt-0.5">Showing {filteredProducts.length} verified products in stock</p>
              </div>
            </div>

            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <span className="text-3xl">🔍</span>
                <p className="text-sm font-bold text-slate-700 mt-2">No products found matching your search.</p>
                <button
                  onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
                  className="mt-3 px-4 py-1.5 bg-[#007382] text-white rounded-lg text-xs font-bold"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Quick Finder Search Hero */}
        <SearchHero onSearch={(q) => {
          setSearchQuery(q);
          const el = document.getElementById('products');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }} />

        {/* PORTION 6: Watch & Shop Video Reels */}
        <VideoReels />

        {/* PORTION 7: Verified Client Reviews */}
        <Reviews />
      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Mobile Fixed Bottom Nav */}
      <MobileBottomNav onOpenCart={() => setCartOpen(true)} />

      <Footer />
      <AiAssistant />
    </div>
  );
}
