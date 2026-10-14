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

import { getClientProducts, getClientHomeConfig, DEFAULT_HOME_CONFIG, DEFAULT_PRODUCTS } from '@/lib/store';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [liveLayout, setLiveLayout] = useState<HomeThemeConfig>(DEFAULT_HOME_CONFIG);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartOpen, setCartOpen] = useState<boolean>(false);

  useEffect(() => {
    // Clean up any stale or corrupted localStorage keys from old prototype
    try {
      localStorage.removeItem('qadri_deleted_products');
      localStorage.removeItem('qadri_product_overrides');
      localStorage.removeItem('qadri_custom_products');
      const cached = JSON.parse(localStorage.getItem('save_and_smile_server_products') || '[]');
      if (Array.isArray(cached) && cached.length < 10) {
        localStorage.removeItem('save_and_smile_server_products');
      }
    } catch (e) {}

    // 1. Instant hydration from client cache
    setProducts(getClientProducts());
    setLiveLayout(getClientHomeConfig());

    // 2. Fetch live products and theme customization from backend
    function fetchLiveProducts() {
      fetch('/api/products', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.products) && data.products.length >= 10) {
            try {
              localStorage.setItem('save_and_smile_server_products', JSON.stringify(data.products));
            } catch (e) {}
            setProducts(data.products);
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

    // Live continuous polling: Refresh products every 6s and whenever tab is focused
    const pollInterval = setInterval(() => {
      fetchLiveProducts();
    }, 6000);

    const handleFocus = () => {
      fetchLiveProducts();
      fetchLiveTheme();
    };
    window.addEventListener('focus', handleFocus);

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('qadri_store_sync');
        channel.onmessage = (ev) => {
          if (ev.data?.type === 'theme_updated' && ev.data.config) {
            setLiveLayout(prev => ({
              ...prev,
              ...ev.data.config,
              sections_visibility: {
                ...prev.sections_visibility,
                ...(ev.data.config.sections_visibility || {})
              },
              sections_config: {
                ...prev.sections_config,
                ...(ev.data.config.sections_config || {})
              }
            }));
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
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
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
    const pCat = (p.category || p.tab || '').toLowerCase();
    const targetTab = activeTab.toLowerCase();
    const matchesTab = targetTab === 'all' || pCat.includes(targetTab) || targetTab.includes(pCat);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || pCat.includes(q) || (p.code && p.code.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  // Categorized sections for rich storefront display
  const hotSellingProducts = (products.filter(p => p.badge?.toLowerCase().includes('hot') || p.badge?.toLowerCase().includes('deal') || p.isFlashSale).length > 0
    ? products.filter(p => p.badge?.toLowerCase().includes('hot') || p.badge?.toLowerCase().includes('deal') || p.isFlashSale)
    : products.slice(0, 4)
  ).slice(0, 4);

  const newArrivalProducts = (products.filter(p => p.badge?.toLowerCase().includes('new') || p.badge?.toLowerCase().includes('arrival')).length > 0
    ? products.filter(p => p.badge?.toLowerCase().includes('new') || p.badge?.toLowerCase().includes('arrival'))
    : products.slice(4, 8)
  ).slice(0, 4);

  const trendingProducts = (products.filter(p => p.badge?.toLowerCase().includes('trend') || p.badge?.toLowerCase().includes('sale') || Number(p.price) > 300).length > 0
    ? products.filter(p => p.badge?.toLowerCase().includes('trend') || p.badge?.toLowerCase().includes('sale') || Number(p.price) > 300)
    : products.slice(8, 12)
  ).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        onOpenCart={() => setCartOpen(true)}
        themeConfig={liveLayout}
      />

      <main className="flex-1">
        {/* Dynamic Reorderable Sections based on liveLayout.sections_order */}
        {(() => {
          const raw = liveLayout.sections_order && liveLayout.sections_order.length > 0
            ? liveLayout.sections_order
            : [
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
              ];
          const list = [...raw];
          if (!list.includes('main_catalog') && !list.includes('shop_by_category')) {
            list.push('main_catalog');
          }
          return list;
        })().map((secKey) => {
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
            case 'featured_products':
              if (hotSellingProducts.length === 0) return null;
              const hotCfg = liveLayout.sections_config?.hot_selling;
              return (
                <section key="hot_selling" className="store-portion-section portion-hot-selling py-8 bg-[#fff9f5]" id="hotSelling">
                  <div className="site-container">
                    <div className="portion-header-bar mb-6 flex-wrap gap-4 justify-between">
                      <div className="portion-title-group flex items-center gap-3">
                        <span className="portion-pill-tag bg-orange-600 text-white font-black text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {hotCfg?.tag || '🔥 HOT SELLING'}
                        </span>
                        <div>
                          <h2 className="portion-heading-text text-xl font-black text-slate-900">
                            {hotCfg?.title || 'Hot Selling Wholesale Gadgets'}
                          </h2>
                          <p className="portion-subtitle-text text-xs text-slate-500">
                            {hotCfg?.subtitle || 'Fast moving products with highest reseller profit margins'}
                          </p>
                        </div>
                      </div>

                      {/* Optional Interactive Coupon Badge */}
                      {hotCfg?.show_coupon && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3.5 py-1.5 rounded-xl shadow-xs border border-orange-400">
                          <span className="text-base">🎟️</span>
                          <div>
                            <div className="text-[10px] font-medium opacity-90 leading-tight">
                              {hotCfg.coupon_text || 'Use code at checkout for bulk discount:'}
                            </div>
                            <div className="text-xs font-black tracking-wider font-mono">
                              {hotCfg.coupon_code || 'SAVE500'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="products-grid">
                      {hotSellingProducts.slice(0, hotCfg?.limit || 4).map(product => (
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
            case 'front_tabs':
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
            case 'flash_deals':
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
            case 'shop_by_category':
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
            case 'customer_reviews':
              return <Reviews key="testimonials" />;

            default: {
              // Check if secKey matches any custom section
              const customSec = (liveLayout.custom_sections || []).find(cs => cs.id === secKey);
              if (!customSec) return null;

              if (customSec.type === 'promo_banner') {
                return (
                  <section key={customSec.id} className="py-6 bg-white">
                    <div className="site-container">
                      {customSec.title && (
                        <div className="mb-4 text-center">
                          {customSec.tag && (
                            <span className="inline-block bg-[#007382]/10 text-[#007382] font-black text-[11px] px-3 py-0.5 rounded-full uppercase tracking-wider mb-1">
                              {customSec.tag}
                            </span>
                          )}
                          <h2 className="text-xl font-black text-slate-900">{customSec.title}</h2>
                          {customSec.subtitle && <p className="text-xs text-slate-500 mt-1">{customSec.subtitle}</p>}
                        </div>
                      )}
                      <a
                        href={customSec.banner_link || '#products'}
                        className="block relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-md group hover:shadow-xl transition"
                      >
                        <img
                          src={customSec.banner_image || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80'}
                          alt={customSec.title || 'Promotional Banner'}
                          className="w-full h-auto max-h-[380px] object-cover group-hover:scale-[1.01] transition duration-500"
                        />
                      </a>
                    </div>
                  </section>
                );
              }

              if (customSec.type === 'two_column') {
                return (
                  <section key={customSec.id} className="py-8 bg-slate-50 border-y border-slate-200/60">
                    <div className="site-container">
                      {customSec.title && (
                        <div className="text-center mb-6">
                          {customSec.tag && (
                            <span className="inline-block bg-[#007382]/10 text-[#007382] font-black text-[11px] px-3 py-0.5 rounded-full uppercase tracking-wider mb-1">
                              {customSec.tag}
                            </span>
                          )}
                          <h2 className="text-xl font-black text-[#00363d]">{customSec.title}</h2>
                          {customSec.subtitle && <p className="text-xs text-slate-500 mt-1">{customSec.subtitle}</p>}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Column 1 */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                          <div>
                            {customSec.col1_image && (
                              <div className="h-44 w-full rounded-xl overflow-hidden mb-4 bg-slate-100">
                                <img src={customSec.col1_image} alt={customSec.col1_title || 'Column 1'} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <h3 className="text-lg font-black text-slate-900 mb-2">{customSec.col1_title || 'Wholesale Deals'}</h3>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">{customSec.col1_text || 'Get the lowest bulk prices direct from importers across Pakistan.'}</p>
                          </div>
                          <div>
                            <a
                              href={customSec.col1_btn_link || '#products'}
                              className="inline-block px-5 py-2 rounded-xl bg-[#007382] text-white text-xs font-bold hover:bg-[#005a66] transition shadow-sm"
                            >
                              {customSec.col1_btn_text || 'Shop Now →'}
                            </a>
                          </div>
                        </div>

                        {/* Column 2 */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                          <div>
                            {customSec.col2_image && (
                              <div className="h-44 w-full rounded-xl overflow-hidden mb-4 bg-slate-100">
                                <img src={customSec.col2_image} alt={customSec.col2_title || 'Column 2'} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <h3 className="text-lg font-black text-slate-900 mb-2">{customSec.col2_title || 'Fast Bulk Dispatch'}</h3>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">{customSec.col2_text || 'Reliable 24-48 hours delivery with full cash on delivery verification.'}</p>
                          </div>
                          <div>
                            <a
                              href={customSec.col2_btn_link || '#products'}
                              className="inline-block px-5 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition shadow-sm"
                            >
                              {customSec.col2_btn_text || 'Learn More →'}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              }

              if (customSec.type === 'custom_coupon') {
                return (
                  <section key={customSec.id} className="py-6 bg-gradient-to-r from-teal-900 via-[#00505b] to-emerald-900 text-white shadow-inner">
                    <div className="site-container flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-center sm:text-left">
                        <span className="text-3xl">🎁</span>
                        <div>
                          <div className="text-sm font-black uppercase tracking-wider text-cyan-200">
                            {customSec.title || 'Special Reseller Discount'}
                          </div>
                          <div className="text-xs text-slate-200">
                            {customSec.coupon_text || 'Use code at checkout to claim wholesale discount:'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 px-4 py-2 rounded-xl">
                        <span className="text-xs text-slate-200 font-medium">Coupon:</span>
                        <span className="text-sm font-black font-mono tracking-widest text-amber-300">
                          {customSec.coupon_code || 'SAVE500'}
                        </span>
                        {customSec.coupon_discount && (
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
                            {customSec.coupon_discount}
                          </span>
                        )}
                      </div>
                    </div>
                  </section>
                );
              }

              return null;
            }
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

