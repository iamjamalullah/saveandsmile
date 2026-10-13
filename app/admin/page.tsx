'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import DashboardView from '@/components/admin/DashboardView';
import ProductsView from '@/components/admin/ProductsView';
import OrdersView from '@/components/admin/OrdersView';
import SettingsView from '@/components/admin/SettingsView';
import ThemeCustomizerView from '@/components/admin/ThemeCustomizerView';
import { Product } from '@/lib/types';
import { getClientProducts } from '@/lib/store';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  function loadData() {
    setProducts(getClientProducts());

    try {
      const storedOrders = JSON.parse(localStorage.getItem('qadri_orders') || '[]');
      setOrders(storedOrders);
    } catch (e) {
      setOrders([]);
    }

    // Fetch live products from /api/products
    fetch('/api/products?t=' + Date.now(), { cache: 'no-store' })
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

    // Fetch live orders from /api/orders
    fetch('/api/orders?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data?.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
          try {
            localStorage.setItem('qadri_orders', JSON.stringify(data.orders));
          } catch (e) {}
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadData();

    window.addEventListener('qadri_products_updated', loadData);
    window.addEventListener('qadri_orders_updated', loadData);
    window.addEventListener('storage', loadData);

    return () => {
      window.removeEventListener('qadri_products_updated', loadData);
      window.removeEventListener('qadri_orders_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-800 antialiased font-sans">
      {/* 1. Next.js React Admin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              title="Open Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="text-xs font-bold text-slate-400 capitalize hidden sm:block">
              Save &amp; Smile Admin / <span className="text-slate-800 font-black">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#007382] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <span>+</span>
              <span className="hidden sm:inline">Add Product</span>
            </button>

            <a
              href="/"
              target="_blank"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <span>🌐</span>
              <span className="hidden sm:inline">Storefront</span>
            </a>
          </div>
        </header>

        {/* Dynamic Views */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {activeTab === 'dashboard' && (
            <DashboardView
              products={products}
              orders={orders}
              onNavigate={setActiveTab}
              onOpenAddProduct={() => setIsAddModalOpen(true)}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
              onRefresh={loadData}
              isAddModalOpen={isAddModalOpen}
              onCloseAddModal={() => setIsAddModalOpen(false)}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={orders}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}

          {activeTab === 'customizer' && (
            <ThemeCustomizerView />
          )}
        </main>
      </div>
    </div>
  );
}
