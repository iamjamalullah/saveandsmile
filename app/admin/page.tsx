'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Truck,
  RefreshCw,
  PlusCircle,
  FileText,
  Sliders,
  ChevronRight,
  ExternalLink,
  Boxes
} from 'lucide-react';

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  qty: number;
  total: number;
}

interface Order {
  id: string | number;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  grandTotal: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
}

interface Product {
  id: string | number;
  title: string;
  price: number;
  stock: number;
  category: string;
  image: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [ordRes, prodRes] = await Promise.all([
        fetch('/api/orders', { cache: 'no-store' }),
        fetch('/api/products', { cache: 'no-store' })
      ]);

      const ordData = await ordRes.json();
      const prodData = await prodRes.json();

      if (ordData?.orders && Array.isArray(ordData.orders)) {
        setOrders(ordData.orders);
      }
      if (prodData?.products && Array.isArray(prodData.products)) {
        setProducts(prodData.products);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute live KPIs
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
  const totalDelivered = orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
  const totalProcessing = orders.filter(o => ['processing', 'pending'].includes((o.status || '').toLowerCase())).length;
  const totalShipped = orders.filter(o => (o.status || '').toLowerCase() === 'shipped').length;
  const totalCancelled = orders.filter(o => ['cancelled', 'canceled'].includes((o.status || '').toLowerCase())).length;

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 5);
  const outOfStockProducts = products.filter(p => (Number(p.stock) || 0) === 0);

  // Distinct customers count
  const customerPhones = new Set(orders.map(o => o.customerPhone).filter(Boolean));
  const totalCustomers = Math.max(customerPhones.size, 1);

  // Profit calculation (Wholesale margin ~ 30%)
  const estimatedProfit = Math.round(totalRevenue * 0.32);

  // Recent 6 orders
  const recentOrders = orders.slice(0, 6);

  // Top products from catalog
  const topProducts = products.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Store Performance Overview
            {refreshing && <RefreshCw className="w-4 h-4 text-teal-600 animate-spin" />}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time analytics and commerce operations for Save & Smile Pakistan
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Date Filters */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            {(['7d', '30d', '90d', 'all'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 rounded-lg uppercase transition ${
                  timeRange === t
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {t === 'all' ? 'All Time' : t}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            title="Refresh Dashboard"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Sales</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#007382] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              Rs. {totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Est. Net Margin: Rs. {estimatedProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {totalOrders} Orders
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="text-amber-600 font-bold">{totalProcessing} Active</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold">{totalDelivered} Delivered</span>
            </div>
          </div>
        </div>

        {/* Catalog Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Products</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {totalProducts} Items
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              {lowStockProducts.length > 0 ? (
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {lowStockProducts.length} low stock
                </span>
              ) : (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Optimal stock levels
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Customers</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {totalCustomers} Profiles
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Nationwide COD fulfillment
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Breakdown Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Fulfillment Status Pipeline
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-amber-50/60 border border-amber-200/60 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">{totalProcessing}</div>
              <div className="text-[11px] font-bold text-amber-700">Processing / Confirmed</div>
            </div>
          </div>

          <div className="bg-blue-50/60 border border-blue-200/60 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">{totalShipped}</div>
              <div className="text-[11px] font-bold text-blue-700">In Transit (Courier)</div>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/60 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">{totalDelivered}</div>
              <div className="text-[11px] font-bold text-emerald-700">Delivered & Paid</div>
            </div>
          </div>

          <div className="bg-rose-50/60 border border-rose-200/60 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">{totalCancelled}</div>
              <div className="text-[11px] font-bold text-rose-700">Cancelled / Returned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Operations Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-sm tracking-tight text-white">Quick Commerce Actions</h3>
          <p className="text-xs text-slate-400 mt-0.5">Instant short-cuts to daily store management workflows</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#007382] hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add New Product
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition border border-slate-700"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Process Orders ({totalProcessing})
          </Link>
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition border border-slate-700"
          >
            <Boxes className="w-3.5 h-3.5" />
            Stock Adjustments
          </Link>
          <Link
            href="/admin/seo"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-xl transition border border-slate-700"
          >
            <Sliders className="w-3.5 h-3.5" />
            Rank Math SEO
          </Link>
          <Link
            href="/admin/builder"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition border border-slate-700"
          >
            <FileText className="w-3.5 h-3.5" />
            Edit Homepage
          </Link>
        </div>
      </div>

      {/* Grid: Recent Orders & Top Catalog Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Recent Customer Orders</h2>
              <p className="text-xs text-slate-500">Live order flow with courier details</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#007382] hover:underline flex items-center gap-1"
            >
              View All Orders ({orders.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Order Code</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">City</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No customer orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => {
                    const statusLower = (ord.status || 'processing').toLowerCase();
                    const statusBadgeClass =
                      statusLower === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : statusLower === 'shipped'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : statusLower === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200';

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-bold text-slate-900 font-mono">
                          {ord.orderCode || `ORD-${ord.id}`}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">
                          {ord.customerName || 'Customer'}
                        </td>
                        <td className="p-3.5 text-slate-500">{ord.customerCity || 'Karachi'}</td>
                        <td className="p-3.5 font-bold text-slate-900">
                          Rs. {(Number(ord.grandTotal) || 0).toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadgeClass}`}
                          >
                            {ord.status || 'Processing'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <Link
                            href={`/admin/orders?code=${ord.orderCode || ord.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007382] hover:underline"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Catalog Products (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Top Products</h2>
              <p className="text-xs text-slate-500">Fast moving catalog items</p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-[#007382] hover:underline flex items-center gap-1"
            >
              All Items <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {topProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition"
              >
                <img
                  src={p.image || '/images/placeholder.jpg'}
                  alt={p.title}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">{p.title}</div>
                  <div className="text-[11px] text-slate-500 capitalize">{p.category}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-black text-[#007382]">
                      Rs. {Number(p.price).toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        (p.stock || 0) <= 5
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      Stock: {p.stock ?? 50}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <Link
              href="/admin/products"
              className="block text-center w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Manage Full 32 Products Catalog →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
