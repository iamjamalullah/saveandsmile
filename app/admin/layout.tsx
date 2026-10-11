'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [productsSubOpen, setProductsSubOpen] = useState(true);

  return (
    <div className="bg-[#f1f2f4] text-[#202223] font-sans antialiased h-screen w-screen flex overflow-hidden selection:bg-[#008060] selection:text-white">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
        ></div>
      )}

      {/* 1. LEFT SIDEBAR (SHOPIFY PRO NAVIGATION TREE) */}
      <aside 
        id="sidebarEl" 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#1a1d21] text-slate-300 flex flex-col shrink-0 border-r border-[#2a2e33] select-none transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} h-full overflow-hidden`}
      >
        {/* Shopify Store Selector Header */}
        <div className="p-3.5 border-b border-[#2a2e33] flex items-center justify-between shrink-0 bg-[#16181b]">
          <Link href="/admin" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#008060] flex items-center justify-center text-white font-black text-xs shadow-sm">
              🛍️
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight leading-none block">
                Save &amp; Smile
              </span>
              <span className="text-[10px] text-emerald-400 font-medium tracking-wide block mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Shopify Pro Edition
              </span>
            </div>
          </Link>
          <button onClick={() => setMobileSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1">✕</button>
        </div>

        {/* Scrollable Navigation Tree */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5 sidebar-scroll text-xs">
          {/* 1. Home */}
          <Link href="/admin" className="nav-item w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg font-semibold text-slate-300 hover:text-white hover:bg-[#2a2e33] transition text-left">
            <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span>Home</span>
          </Link>

          {/* 1B. Home Page & Hero Customizer */}
          <Link href="/admin/builder" className="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-cyan-300 hover:text-white hover:bg-[#2a2e33] transition text-left">
            <div className="flex items-center space-x-2.5">
              <svg className="w-4 h-4 shrink-0 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
              <span className="font-bold">Home Page &amp; Hero</span>
            </div>
            <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-black">EDIT</span>
          </Link>

          {/* 2. Orders */}
          <Link href="/admin/orders" className="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-slate-300 hover:text-white hover:bg-[#2a2e33] transition text-left">
            <div className="flex items-center space-x-2.5">
              <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              <span>Orders</span>
            </div>
            <span className="text-[10px] bg-[#008060] text-white px-1.5 py-0.5 rounded-full font-bold">
              Live
            </span>
          </Link>

          {/* 3. Products */}
          <div>
            <button 
              onClick={() => setProductsSubOpen(!productsSubOpen)} 
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-slate-300 hover:text-white hover:bg-[#2a2e33] transition text-left"
            >
              <div className="flex items-center space-x-2.5">
                <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                <span>Products</span>
              </div>
              <svg className={`w-3 h-3 text-slate-500 transform transition-transform ${productsSubOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
            {productsSubOpen && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-slate-700 ml-4 my-0.5">
                <Link href="/admin/products" className="nav-sub-item w-full block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-[#2a2e33] transition text-left">
                  All Products
                </Link>
                <Link href="/admin/products?action=new" className="w-full block px-2.5 py-1.5 rounded-md text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-[#2a2e33] transition text-left">
                  + Add Product (Pro)
                </Link>
              </div>
            )}
          </div>

          {/* External storefront link */}
          <div className="pt-4 mt-4 border-t border-[#2a2e33]">
            <Link href="/" target="_blank" className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-slate-400 hover:text-white hover:bg-[#2a2e33] transition text-left">
              <span>View Online Store</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </Link>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#2a2e33] bg-[#16181b] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
              SS
            </div>
            <span className="font-semibold text-white">Admin</span>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Connected</span>
        </div>
      </aside>

      {/* 2. MAIN ADMIN VIEW AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar Chrome */}
        <header className="h-14 bg-white border-b border-[#e1e3e5] px-4 flex items-center justify-between shrink-0 shadow-xs z-30">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)} 
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div className="text-sm font-bold text-[#202223]">Save &amp; Smile Admin Portal</div>
          </div>
          <div className="flex items-center space-x-2">
            <Link 
              href="/" 
              target="_blank" 
              className="px-3 py-1.5 rounded-lg border border-[#e1e3e5] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Live Store ↗
            </Link>
          </div>
        </header>

        {/* Scrollable Child Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
