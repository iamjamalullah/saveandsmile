'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalSales: 148500,
    totalOrders: 38,
    activeProducts: 36,
    lowStock: 4
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e1e3e5] shadow-xs">
          <div className="text-xs font-semibold text-[#6d7175] uppercase tracking-wider">Total Sales</div>
          <div className="text-2xl font-black text-[#202223] mt-2">Rs. {stats.totalSales.toLocaleString()}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">↑ +14.2% vs last week</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e1e3e5] shadow-xs">
          <div className="text-xs font-semibold text-[#6d7175] uppercase tracking-wider">Total Orders</div>
          <div className="text-2xl font-black text-[#202223] mt-2">{stats.totalOrders}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">↑ +8 new orders today</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e1e3e5] shadow-xs">
          <div className="text-xs font-semibold text-[#6d7175] uppercase tracking-wider">Active Products</div>
          <div className="text-2xl font-black text-[#202223] mt-2">{stats.activeProducts}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Ready for fulfillment</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e1e3e5] shadow-xs">
          <div className="text-xs font-semibold text-[#6d7175] uppercase tracking-wider">Low Stock Alerts</div>
          <div className="text-2xl font-black text-amber-600 mt-2">{stats.lowStock}</div>
          <div className="text-xs text-amber-700 font-semibold mt-1">Restock required</div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="bg-white p-6 rounded-xl border border-[#e1e3e5] shadow-xs">
        <h2 className="text-base font-bold text-[#202223] mb-4">Quick Management Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link 
            href="/admin/builder" 
            className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100/50 transition flex items-center space-x-3"
          >
            <span className="text-2xl">🎨</span>
            <div>
              <div className="font-bold text-sm text-cyan-900">Homepage &amp; Hero Editor</div>
              <div className="text-xs text-cyan-700">Sliders, Layout Order, Category Strips</div>
            </div>
          </Link>

          <Link 
            href="/admin/products" 
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 transition flex items-center space-x-3"
          >
            <span className="text-2xl">📦</span>
            <div>
              <div className="font-bold text-sm text-emerald-900">Product Catalog</div>
              <div className="text-xs text-emerald-700">Manage Pricing, Photos, SEO, Inventory</div>
            </div>
          </Link>

          <Link 
            href="/admin/orders" 
            className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 transition flex items-center space-x-3"
          >
            <span className="text-2xl">🚚</span>
            <div>
              <div className="font-bold text-sm text-blue-900">Orders &amp; Courier Dispatch</div>
              <div className="text-xs text-blue-700">Print Airway Bills, Track Shipments</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
