'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  Boxes,
  Truck,
  ShoppingCart,
  Users,
  Percent,
  Palette,
  FileText,
  Image as ImageIcon,
  Globe,
  BarChart3,
  ShieldCheck,
  Bell,
  Settings,
  CreditCard,
  Cpu,
  History,
  Activity,
  ExternalLink,
  Search,
  Menu,
  X,
  ChevronRight,
  Store,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const MENU_ITEMS = [
  { name: '1. Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: '2. Products', href: '/admin/products', icon: Package },
  { name: '3. Categories', href: '/admin/categories', icon: Layers },
  { name: '4. Brands & Attributes', href: '/admin/brands', icon: Tag },
  { name: '5. Inventory', href: '/admin/inventory', icon: Boxes },
  { name: '6. Suppliers & POs', href: '/admin/suppliers', icon: Truck },
  { name: '7. Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: '8. Customers / CRM', href: '/admin/customers', icon: Users },
  { name: '9. Discounts & Marketing', href: '/admin/discounts', icon: Percent },
  { name: '10. Website Builder', href: '/admin/builder', icon: Palette },
  { name: '11. Pages & Content', href: '/admin/pages', icon: FileText },
  { name: '12. Media Library', href: '/admin/media', icon: ImageIcon },
  { name: '13. SEO Control Center', href: '/admin/seo', icon: Globe, highlight: true },
  { name: '14. Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
  { name: '15. Staff & Permissions', href: '/admin/staff', icon: ShieldCheck },
  { name: '16. Notifications', href: '/admin/notifications', icon: Bell },
  { name: '17. Store Settings', href: '/admin/settings', icon: Settings },
  { name: '18. Shipping & Payments', href: '/admin/shipping', icon: CreditCard },
  { name: '19. Integrations', href: '/admin/integrations', icon: Cpu },
  { name: '20. Audit Logs', href: '/admin/audit-logs', icon: History },
  { name: '21. Help & System Status', href: '/admin/help', icon: Activity },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [unreadAlerts, setUnreadAlerts] = useState(3);
  const [systemOnline, setSystemOnline] = useState(true);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const filteredMenu = MENU_ITEMS.filter(item =>
    item.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 shadow-xl`}
      >
        {/* Brand & Store Switcher */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#007382] to-teal-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-teal-500/20">
              S
            </div>
            <div>
              <div className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                Save & Smile
                <span className="text-[10px] font-bold bg-[#007382]/30 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Operations Console</p>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Menu Search */}
        <div className="p-3 border-b border-slate-800/60">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search 20 modules..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#007382] text-white shadow-md shadow-[#007382]/30'
                    : item.highlight
                    ? 'text-teal-300 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    SEO
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-slate-600">
                MJ
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">M. Jamalullah</div>
                <div className="text-[10px] text-teal-400 font-medium truncate">Owner / Super Admin</div>
              </div>
            </div>
            <Link
              href="/"
              target="_blank"
              title="Open Live Storefront"
              className="text-slate-400 hover:text-teal-300 p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <Store className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Sticky Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Admin</span>
              <span>/</span>
              <span className="text-[#007382] font-bold capitalize">
                {pathname === '/admin' ? 'Dashboard Overview' : pathname.replace('/admin/', '').replace(/-/g, ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Store Link Button */}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#007382] bg-teal-50 hover:bg-teal-100 border border-teal-200 transition"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Live Store</span>
              <ExternalLink className="w-3 h-3 text-[#007382]/70" />
            </Link>

            {/* Notification Bell */}
            <Link
              href="/admin/notifications"
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </Link>

            {/* System Status Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Synced</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
