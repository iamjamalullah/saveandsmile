'use client';

import React, { useState } from 'react';

interface OrdersViewProps {
  orders: any[];
  onRefresh: () => void;
}

export default function OrdersView({ orders, onRefresh }: OrdersViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const filtered = orders.filter(o => {
    const tracking = String(o.trackingId || o.id || '').toLowerCase();
    const name = String(o.customer?.name || '').toLowerCase();
    const phone = String(o.customer?.phone || '');
    const status = String(o.status || 'Processing').toLowerCase();

    const matchesSearch = !search || tracking.includes(search.toLowerCase()) || name.includes(search.toLowerCase()) || phone.includes(search);
    const matchesStatus = statusFilter === 'all' || status.includes(statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  async function handleUpdateStatus(orderId: string, newStatus: string) {
    try {
      const token = localStorage.getItem('save_and_smile_admin_token');
      await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderId, status: newStatus })
      });
    } catch (e) {}

    const all = JSON.parse(localStorage.getItem('qadri_orders') || '[]');
    const updated = all.map((o: any) => {
      if (String(o.trackingId || o.orderCode || o.id) === String(orderId)) {
        return { ...o, status: newStatus };
      }
      return o;
    });

    localStorage.setItem('qadri_orders', JSON.stringify(updated));
    if (selectedOrder && String(selectedOrder.trackingId || selectedOrder.orderCode || selectedOrder.id) === String(orderId)) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    window.dispatchEvent(new Event('qadri_orders_updated'));
    window.dispatchEvent(new Event('storage'));
    onRefresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Orders &amp; Customer CRM</h1>
          <p className="text-xs text-slate-400">Total {orders.length} orders placed on Save &amp; Smile</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by Tracking ID, Phone, Customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs p-2.5 pl-8 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
          />
          <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
        </div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize shrink-0 transition ${
                statusFilter === st
                  ? 'bg-[#007382] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-3.5 pl-5">Tracking ID</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">City &amp; Address</th>
                <th className="p-3.5">Items</th>
                <th className="p-3.5">Grand Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(ord => {
                const id = ord.trackingId || ord.id;
                const name = ord.customer?.name || 'Customer';
                const phone = ord.customer?.phone || '';
                const city = ord.customer?.city || 'Pakistan';
                const total = Number(ord.grandTotal || ord.total || 0);
                const status = ord.status || 'Processing';
                const itemCount = Array.isArray(ord.items) ? ord.items.reduce((s: number, i: any) => s + (i.qty || 1), 0) : 1;

                return (
                  <tr key={id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">{id}</td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {name}
                      {phone && <div className="text-[10px] text-slate-400 font-normal">{phone}</div>}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div className="font-semibold">{city}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{ord.customer?.address || 'COD Destination'}</div>
                    </td>
                    <td className="p-3.5">{itemCount} items</td>
                    <td className="p-3.5 font-black text-[#007382]">Rs. {total.toLocaleString()}</td>
                    <td className="p-3.5">
                      <select
                        value={status}
                        onChange={e => handleUpdateStatus(id, e.target.value)}
                        className="text-[11px] font-bold p-1 rounded-lg border border-slate-200 bg-white outline-none"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        View Order
                      </button>
                      {phone && (
                        <a
                          href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Salam%20${encodeURIComponent(name)}!%20Your%20Save%20%26%20Smile%20order%20%23${id}%20status%20is:%20*${status}*`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold"
                        >
                          💬 WhatsApp
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs">
              No orders found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Order Details</span>
                <h3 className="text-sm font-black text-slate-900 font-mono">
                  {selectedOrder.trackingId || selectedOrder.id}
                </h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400">Customer:</span>
                <div className="font-bold text-slate-800">{selectedOrder.customer?.name}</div>
              </div>
              <div>
                <span className="text-slate-400">Phone:</span>
                <div className="font-bold text-slate-800">{selectedOrder.customer?.phone}</div>
              </div>
              <div>
                <span className="text-slate-400">City:</span>
                <div className="font-bold text-slate-800">{selectedOrder.customer?.city}</div>
              </div>
              <div>
                <span className="text-slate-400">Payment:</span>
                <div className="font-bold text-slate-800">{(selectedOrder.paymentMethod || 'COD').toUpperCase()}</div>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Delivery Address:</span>
                <div className="font-semibold text-slate-800">{selectedOrder.customer?.address}</div>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs mb-2">Ordered Items:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 text-xs">
                    <div className="font-semibold text-slate-800 truncate max-w-xs">{item.title}</div>
                    <div className="text-slate-500 font-mono">Qty: {item.qty} × Rs. {item.price}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Total Bill:</span>
                <div className="text-base font-black text-[#007382]">
                  Rs. {Number(selectedOrder.grandTotal || selectedOrder.total || 0).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
