'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSlider from '@/components/HeroSlider';
import ProductCard from '@/components/ProductCard';
import AiAssistant from '@/components/AiAssistant';
import { Product } from '@/lib/types';
import { getClientProducts } from '@/lib/store';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setProducts(getClientProducts());

    function handleSync(e: any) {
      if (e.data && e.data.type === 'qadri_sync_products') {
        setProducts(e.data.products);
      } else {
        setProducts(getClientProducts());
      }
    }

    window.addEventListener('message', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('qadri_products_updated', handleSync);

    return () => {
      window.removeEventListener('message', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('qadri_products_updated', handleSync);
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
    const matchesTab = activeTab === 'all' || p.category.toLowerCase().includes(activeTab.toLowerCase());
    const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

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

        {/* Value Proposition Strip */}
        <section className="features-strip py-4 bg-white border-y border-slate-200">
          <div className="site-container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="feature-item p-2">
                <span className="text-xl">🚀</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1">Nationwide COD</h4>
                <p className="text-[11px] text-slate-400">Doorstep delivery across Pakistan</p>
              </div>
              <div className="feature-item p-2">
                <span className="text-xl">💰</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1">Direct Factory Rates</h4>
                <p className="text-[11px] text-slate-400">Maximum reseller profit margins</p>
              </div>
              <div className="feature-item p-2">
                <span className="text-xl">🛡️</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1">7 Days Checking Warranty</h4>
                <p className="text-[11px] text-slate-400">100% replacement guarantee</p>
              </div>
              <div className="feature-item p-2">
                <span className="text-xl">💬</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1">24/7 WhatsApp Support</h4>
                <p className="text-[11px] text-slate-400">Dedicated wholesale manager</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Products Grid */}
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
      </main>

      <Footer />
      <AiAssistant />
    </div>
  );
}
