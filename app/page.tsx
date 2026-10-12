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
import QuickViewModal from '@/components/QuickViewModal';
import { Product, HomeThemeConfig } from '@/lib/types';

import { getClientProducts, getClientHomeConfig, DEFAULT_HOME_CONFIG } from '@/lib/store';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [liveLayout, setLiveLayout] = useState<HomeThemeConfig>(DEFAULT_HOME_CONFIG);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartOpen, setCartOpen] = useState<boolean>(false);

  useEffect(() => {
    // 1. Instant hydration from client cache
    setProducts(getClientProducts());
    setLiveLayout(getClientHomeConfig());

    // 2. Fetch live products and theme customization from backend
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

    function fetchLiveTheme() {
      fetch('/api/home-customization', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data?.config) {
            setLiveLayout(prev => ({
              ...prev,
              ...data.config,
              sections_visibility: {
                ...prev.sections_visibility,
                ...(data.config.sections_visibility || {})
              },
              sections_config: {
                ...prev.sections_config,
                ...(data.config.sections_config || {})
              }
            }));
          }
        })
        .catch(() => {});
    }

    fetchLiveProducts();
    fetchLiveTheme();

    function handleSync(e: any) {
      if (e.data && e.data.type === 'LIVE_PREVIEW_UPDATE') {
        // Instant Live PostMessage synchronization from Admin Customizer
        setLiveLayout(e.data.payload);
      } else if (e.data && e.data.type === 'qadri_sync_hero_slides') {
        setLiveLayout(prev => ({ ...prev, hero_slides: e.data.slides }));
      } else if (e.data && e.data.type === 'qadri_sync_products') {
        setProducts(e.data.products);
      } else {
        setProducts(getClientProducts());
        fetchLiveProducts();
      }
    }

    window.addEventListener('message', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('qadri_products_updated', handleSync);
    window.addEventListener('qadri_hero_slides_updated', fetchLiveTheme);

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('qadri_store_sync');
        channel.onmessage = (ev) => {
          if (ev.data?.type === 'theme_updated') {
            setLiveLayout(ev.data.config);
          } else {
            fetchLiveProducts();
            fetchLiveTheme();
          }
        };
      }
    } catch (e) {}

    // Notify parent builder if inside iframe preview
    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'PREVIEW_FRAME_READY' }, '*');
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('message', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('qadri_products_updated', handleSync);
      window.removeEventListener('qadri_hero_slides_updated', fetchLiveTheme);
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
      <Header
        onOpenCart={() => setCartOpen(true)}
        themeConfig={liveLayout}
      />

      <main className="flex-1">
        {/* Dynamic Reorderable Sections based on liveLayout.sections_order */}
        {(liveLayout.sections_order || [
          'hero_slider',
          'categories_strip',
          'trust_badges',
          'hot_selling',
          'new_arrivals',
          'flash_sale',
          'trending_picks',
          'main_catalog',
          'search_hero',
          'video_reels',
          'testimonials'
        ]).map((secKey) => {
          // Check visibility
          if (liveLayout.sections_visibility?.[secKey] === false) return null;

          switch (secKey) {
            case 'hero_slider':
              return (
                <HeroSlider key="hero_slider" customSlides={liveLayout.hero_slides} />
              );

            case 'categories_strip':
              return (
                <CategoryMarquee
                  key="categories_strip"
                  onSelectCategory={(catId) => {
                    setActiveTab(catId);
                    const el = document.getElementById('products');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              );

            case 'trust_badges':
              return (
                <TrustFeatures
                  key="trust_badges"
                  config={liveLayout.sections_config?.trust_badges}
                />
              );

            case 'hot_selling':
              if (hotSellingProducts.length === 0) return null;
              return (
                <section key="hot_selling" className="store-portion-section portion-hot-selling py-8 bg-[#fff9f5]" id="hotSelling">
                  <div className="site-container">
                    <div className="portion-header-bar mb-6">
                      <div className="portion-title-group flex items-center gap-3">
                        <span className="portion-pill-tag bg-orange-600 text-white font-black text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {liveLayout.sections_config?.hot_selling?.tag || '🔥 HOT SELLING'}
                        </span>
                        <div>
                          <h2 className="portion-heading-text text-xl font-black text-slate-900">
                            {liveLayout.sections_config?.hot_selling?.title || 'Hot Selling Wholesale Gadgets'}
                          </h2>
                          <p className="portion-subtitle-text text-xs text-slate-500">
                            {liveLayout.sections_config?.hot_selling?.subtitle || 'Fast moving products with highest reseller profit margins'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="products-grid">
                      {hotSellingProducts.slice(0, liveLayout.sections_config?.hot_selling?.limit || 4).map(product => (
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
              );

            case 'new_arrivals':
              if (newArrivalProducts.length === 0) return null;
              return (
                <section key="new_arrivals" className="store-portion-section portion-new-arrivals py-8 bg-[#f5fbf6]" id="newArrivals">
                  <div className="site-container">
                    <div className="portion-header-bar mb-6">
                      <div className="portion-title-group flex items-center gap-3">
                        <span className="portion-pill-tag bg-emerald-600 text-white font-black text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {liveLayout.sections_config?.new_arrivals?.tag || '✨ NEW ARRIVALS'}
                        </span>
                        <div>
                          <h2 className="portion-heading-text text-xl font-black text-slate-900">
                            {liveLayout.sections_config?.new_arrivals?.title || 'Latest New Arrivals'}
                          </h2>
                          <p className="portion-subtitle-text text-xs text-slate-500">
                            {liveLayout.sections_config?.new_arrivals?.subtitle || 'Fresh containers imported this week — First batch wholesale prices'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="products-grid">
                      {newArrivalProducts.slice(0, liveLayout.sections_config?.new_arrivals?.limit || 4).map(product => (
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
              );

            case 'flash_sale':
              return (
                <FlashSaleTimer key="flash_sale" config={liveLayout.sections_config?.flash_sale} />
              );

            case 'trending_picks':
              if (trendingProducts.length === 0) return null;
              return (
                <section key="trending_picks" className="store-portion-section portion-trending-gadgets py-8 bg-[#f0f9fa]" id="trendingPicks">
                  <div className="site-container">
                    <div className="portion-header-bar mb-6">
                      <div className="portion-title-group flex items-center gap-3">
                        <span className="portion-pill-tag bg-[#007382] text-white font-black text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {liveLayout.sections_config?.trending_picks?.tag || '🌟 TRENDING PICKS'}
                        </span>
                        <div>
                          <h2 className="portion-heading-text text-xl font-black text-[#00363d]">
                            {liveLayout.sections_config?.trending_picks?.title || 'Trending Wholesale Picks'}
                          </h2>
                          <p className="portion-subtitle-text text-xs text-slate-500">
                            {liveLayout.sections_config?.trending_picks?.subtitle || 'Most demanded smart watches, organizers & lifestyle essentials'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="products-grid">
                      {trendingProducts.slice(0, liveLayout.sections_config?.trending_picks?.limit || 4).map(product => (
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
              );

            case 'main_catalog':
              return (
                <section key="main_catalog" id="products" className="py-8">
                  <div className="site-container">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-black text-[#00363d]">
                          {liveLayout.sections_config?.main_catalog?.title || 'Trending Wholesale Catalog'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {liveLayout.sections_config?.main_catalog?.subtitle || `Showing ${filteredProducts.length} verified products in stock`}
                        </p>
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
              );

            case 'search_hero':
              return (
                <SearchHero
                  key="search_hero"
                  onSearch={(q) => {
                    setSearchQuery(q);
                    const el = document.getElementById('products');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              );

            case 'video_reels':
              return <VideoReels key="video_reels" />;

            case 'testimonials':
              return <Reviews key="testimonials" />;

            default:
              return null;
          }
        })}
      </main>


      {/* Cart Drawer & Quick View Modal */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <QuickViewModal />

      {/* Mobile Fixed Bottom Nav */}
      <MobileBottomNav onOpenCart={() => setCartOpen(true)} />

      <Footer />
      <AiAssistant />
    </div>
  );
}

