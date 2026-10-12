'use client';

import React from 'react';
import Link from 'next/link';

interface AdminSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile
}: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Products & Inventory', icon: '📦' },
    { id: 'orders', label: 'Orders CRM', icon: '🛒' },
    { id: 'customizer', label: 'Store Customizer', icon: '🎨' },
    { id: 'settings', label: 'Settings & SEO', icon: '⚙️' }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#1e2329] text-white flex flex-col transition-transform duration-300 ease-in-out shrink-0 border-r border-slate-800 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-[#161a1e]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚡</span>
            <div>
              <div className="text-sm font-black tracking-wide text-white">Save &amp; Smile</div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Admin Suite v2.0</div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2">
            Store Management
          </div>

          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  isActive
                    ? 'bg-[#007382] text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2">
            Quick Links
          </div>

          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 transition text-left"
          >
            <span className="text-base">🌐</span>
            <span>View Live Store ↗</span>
          </Link>

          <a
            href="/admin.html"
            target="_blank"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition text-left"
          >
            <span className="text-base">🖥️</span>
            <span>Classic Admin View ↗</span>
          </a>
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#161a1e]">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-slate-800/50">
            <div className="w-7 h-7 rounded-full bg-[#007382] text-white flex items-center justify-center font-bold text-xs">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">Super Admin</div>
              <div className="text-[10px] text-slate-400 truncate">admin@saveandsmile.pk</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
