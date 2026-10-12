'use client';

import React from 'react';
import { Product } from '@/lib/types';

interface DashboardViewProps {
  products: Product[];
  orders: any[];
  onNavigate: (tab: string) => void;
  onOpenAddProduct: () => void;
}

export default function DashboardView({
  products,
  orders,
  onNavigate,
  onOpenAddProduct
}: DashboardViewProps) {
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.grandTotal || o.total) || 0), 0);
  const pendingOrders = orders.filter(o => (o.status || 'Pending').toLowerCase().includes('pending') || (o.status || '').toLowerCase().includes('process')).length;
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#004f59] to-[#007382] text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
            Wholesale CRM Suite
          </span>
          <h1 className="text-xl md:text-2xl font-black mt-2">Welcome to Save &amp; Smile Admin</h1>
          <p className="text-xs text-white/80 mt-1 max-w-xl">
            Real-time management for nationwide wholesale orders, live inventory catalog, customer inquiries, and factory pricing.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onOpenAddProduct}
            className="px-4 py-2.5 bg-white text-[#007382] rounded-xl text-xs font-bold shadow-sm hover:bg-slate-100 transition flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Add New Product</span>
          </button>
          <button
            onClick={() => onNavigate('orders')}
            className="px-4 py-2.5 bg-black/30 hover:bg-black/40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>🛒</span>
            <span>Manage Orders</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Total Revenue</span>
            <span className="text-lg">💰</span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            Rs. {totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            ● Lifetime Store Orders
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Total Orders</span>
            <span className="text-lg">📦</span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {orders.length}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            {pendingOrders} orders processing
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Active Products</span>
            <span className="text-lg">🏷️</span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {products.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            ● In Stock &amp; Visible
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Pending Dispatch</span>
            <span className="text-lg">🚚</span>
          </div>
          <div className="text-xl font-black text-amber-600 mt-2">
            {pendingOrders}
          </div>
          <div className="text-[11px] text-amber-600 font-bold mt-1">
            Requires COD booking
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">Recent Customer Orders</h2>
            <p className="text-xs text-slate-400">Live feed of orders placed on Save &amp; Smile storefront</p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-bold text-[#007382] hover:underline"
          >
            View All ({orders.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No orders placed yet. As customers order from the storefront, they will show here instantly.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-3.5 pl-5">Tracking ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">City</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentOrders.map((ord, idx) => {
                  const id = ord.trackingId || ord.id || `SNS-${idx + 100}`;
                  const name = ord.customer?.name || 'Customer';
                  const city = ord.customer?.city || 'Pakistan';
                  const phone = ord.customer?.phone || '';
                  const total = Number(ord.grandTotal || ord.total || 0);
                  const itemCount = Array.isArray(ord.items) ? ord.items.reduce((s: number, i: any) => s + (i.qty || 1), 0) : 1;
                  const status = ord.status || 'Processing';

                  return (
                    <tr key={id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">
                        {id}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {name}
                        {phone && <div className="text-[10px] text-slate-400 font-normal">{phone}</div>}
                      </td>
                      <td className="p-3.5 text-slate-600">{city}</td>
                      <td className="p-3.5">{itemCount} items</td>
                      <td className="p-3.5 font-black text-[#007382]">Rs. {total.toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ● {status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        {phone ? (
                          <a
                            href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Salam%20${encodeURIComponent(name)}!%20Regarding%20your%20Save%20%26%20Smile%20order%20%23${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#25D366] hover:underline"
                          >
                            <span>WhatsApp</span> ↗
                          </a>
                        ) : (
                          <button onClick={() => onNavigate('orders')} className="text-[11px] font-bold text-[#007382] hover:underline">
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
