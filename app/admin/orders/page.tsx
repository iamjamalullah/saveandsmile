'use client';

import React, { useState, useEffect } from 'react';

interface OrderItem {
  id?: number;
  title: string;
  price: number;
  qty: number;
}

interface OrderRecord {
  orderId: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  payment?: string;
  grandTotal?: number;
  status?: string;
  date?: string;
  items?: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('qadri_placed_orders') || '[]');
      if (stored.length > 0) {
        setOrders(stored);
      } else {
        setOrders([
          {
            orderId: 'SS-484209',
            name: 'Muhammad Hammad',
            phone: '0300-1234567',
            city: 'Karachi',
            payment: 'COD',
            grandTotal: 4850,
            status: 'Preparing',
            date: new Date().toISOString()
          },
          {
            orderId: 'SS-100201',
            name: 'Ahmed Raza',
            phone: '0321-7654321',
            city: 'Lahore',
            payment: 'JazzCash',
            grandTotal: 3200,
            status: 'Shipped',
            date: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
      }
    } catch {
      // fallback
    }
  }, []);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    const updated = orders.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    try {
      localStorage.setItem('qadri_placed_orders', JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202223]">Orders &amp; Shipments</h1>
          <p className="text-xs text-[#6d7175]">Manage client orders, print receipts, and update live courier statuses</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e1e3e5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#202223]">
            <thead className="bg-slate-50 border-b border-[#e1e3e5] text-[#6d7175] uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">City</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e3e5]">
              {orders.map(o => (
                <tr key={o.orderId} className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-bold font-mono text-[#008060]">#{o.orderId}</td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{o.name}</div>
                    <div className="text-[10px] text-slate-500">{o.phone}</div>
                  </td>
                  <td className="p-3.5 font-medium">{o.city || 'Pakistan'}</td>
                  <td className="p-3.5 font-bold text-slate-900">Rs. {(o.grandTotal || 0).toLocaleString()}</td>
                  <td className="p-3.5 font-semibold text-slate-700">{o.payment || 'COD'}</td>
                  <td className="p-3.5">
                    <select 
                      value={o.status || 'Pending'} 
                      onChange={e => handleStatusChange(o.orderId, e.target.value)}
                      className="border border-slate-200 rounded px-2 py-1 font-bold text-[11px] bg-white"
                    >
                      <option value="Pending">🕒 Pending</option>
                      <option value="Confirmed">✍️ Confirmed</option>
                      <option value="Preparing">📦 Preparing (Packing)</option>
                      <option value="Shipped">🚚 Shipped (Courier)</option>
                      <option value="Delivered">✅ Delivered</option>
                      <option value="Cancelled">❌ Cancelled</option>
                    </select>
                  </td>
                  <td className="p-3.5 text-right">
                    <button 
                      onClick={() => alert(`Order details:\nID: ${o.orderId}\nCustomer: ${o.name}\nPhone: ${o.phone}\nTotal: Rs. ${o.grandTotal}`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
