'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  RefreshCw,
  Printer,
  FileText,
  Phone,
  MapPin,
  X,
  MessageCircle
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
  customerAddress?: string;
  customerCity: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
  status: string;
  courier?: string;
  trackingNumber?: string;
  createdAt: string;
  items?: OrderItem[];
  notes?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Status update modal
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('shipped');
  const [courierName, setCourierName] = useState('Trax Logistics');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data?.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // 5s live polling for new customer orders
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenStatusModal = (ord: Order) => {
    setUpdatingOrder(ord);
    setNewStatus(ord.status || 'shipped');
    setCourierName(ord.courier || 'Leopards Courier Service');
    setTrackingNumber(ord.trackingNumber || `TRX-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingOrder) return;
    setSavingStatus(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: updatingOrder.orderCode || updatingOrder.id,
          id: updatingOrder.id,
          status: newStatus,
          courier: courierName,
          trackingNumber: trackingNumber
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order status updated to ${newStatus}`);
        setUpdatingOrder(null);
        loadOrders();
      } else {
        showToast(data.error || 'Failed to update order status');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating order');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Order Code', 'Date', 'Customer Name', 'Phone', 'City', 'Status', 'Courier', 'Tracking No', 'Grand Total (PKR)'];
    const rows = orders.map(o => [
      o.orderCode || o.id,
      `"${new Date(o.createdAt).toLocaleDateString()}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      o.customerPhone,
      `"${o.customerCity || ''}"`,
      o.status,
      `"${o.courier || ''}"`,
      o.trackingNumber || '',
      o.grandTotal
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `save-and-smile-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Orders exported to CSV');
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      (o.orderCode || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customerPhone || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customerCity || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || (o.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Order Management Console
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {orders.length} Total Orders
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time Cash on Delivery checkout orders, tracking assignment & invoice printing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={loadOrders}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search order code, customer name, phone or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007382]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:border-[#007382]"
          >
            <option value="all">All Orders</option>
            <option value="processing">Processing / Pending</option>
            <option value="shipped">Shipped / In Transit</option>
            <option value="delivered">Delivered & Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
              <tr>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Customer & Phone</th>
                <th className="p-3.5">City & Address</th>
                <th className="p-3.5">Grand Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Courier Info</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No orders found matching filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const s = (ord.status || 'processing').toLowerCase();
                  const badgeClass =
                    s === 'delivered'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : s === 'shipped'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : s === 'cancelled'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-bold font-mono text-slate-900">{ord.orderCode || `ORD-${ord.id}`}</div>
                        <div className="text-[10px] text-slate-400">{new Date(ord.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{ord.customerName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{ord.customerPhone}</div>
                      </td>
                      <td className="p-3.5 max-w-[200px]">
                        <div className="font-bold text-teal-800">{ord.customerCity || 'Karachi'}</div>
                        <div className="text-[10px] text-slate-500 truncate" title={ord.customerAddress}>
                          {ord.customerAddress || 'Delivery Address'}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-black text-slate-900">Rs. {Number(ord.grandTotal).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{ord.paymentMethod || 'COD'}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badgeClass}`}>
                          {ord.status || 'Processing'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {ord.courier ? (
                          <div>
                            <div className="font-semibold text-slate-800">{ord.courier}</div>
                            <div className="text-[10px] font-mono text-slate-400">{ord.trackingNumber}</div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Not assigned</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => { setActiveOrder(ord); setIsInvoiceOpen(true); }}
                            title="Print Invoice"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenStatusModal(ord)}
                            className="px-2.5 py-1 bg-[#007382] hover:bg-teal-600 text-white rounded-lg text-xs font-bold transition"
                          >
                            Update
                          </button>
                          {ord.customerPhone && (
                            <a
                              href={`https://wa.me/${ord.customerPhone.replace(/[^0-9]/g, '')}?text=Assalam-o-Alaikum%20${encodeURIComponent(ord.customerName)},%20your%20Save%20%26%20Smile%20order%20(${ord.orderCode})%20status%20is%20${ord.status}.%20Track%20here:%20https://saveandsmile.vercel.app/track-order?tracking=${ord.orderCode}`}
                              target="_blank"
                              title="Chat on WhatsApp"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPDATE STATUS MODAL */}
      {updatingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-black text-slate-900">
                Update Order: {updatingOrder.orderCode || updatingOrder.id}
              </h2>
              <button onClick={() => setUpdatingOrder(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveStatus} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fulfillment Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="Processing">Processing / Confirmed</option>
                  <option value="Shipped">Shipped (Dispatched to Courier)</option>
                  <option value="Delivered">Delivered & Payment Received</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Courier Service</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="Leopards Courier Service">Leopards Courier Service</option>
                  <option value="Trax Logistics">Trax Logistics</option>
                  <option value="TCS Express">TCS Express</option>
                  <option value="PostEx Logistics">PostEx Logistics</option>
                  <option value="M&P Express">M&P Express Logistics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Courier Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TRAX-PK-883921"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUpdatingOrder(null)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="px-4 py-1.5 bg-[#007382] hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {savingStatus ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE MODAL */}
      {isInvoiceOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-sm font-black text-slate-900">Tax Invoice: {activeOrder.orderCode || activeOrder.id}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#007382] text-white text-xs font-bold rounded-lg"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button onClick={() => setIsInvoiceOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800" id="printable-invoice">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-6 border-slate-200">
                <div>
                  <div className="text-xl font-black text-slate-900 tracking-tight">SAVE & SMILE</div>
                  <p className="text-[11px] text-slate-500">Pakistan Leading Wholesale Gadgets Portal</p>
                  <p className="text-[11px] text-slate-500 mt-1">Helpline / WhatsApp: 0316-2323616</p>
                  <p className="text-[11px] text-slate-500">Website: https://saveandsmile.vercel.app</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[#007382]">COMMERCIAL INVOICE</div>
                  <div className="font-mono text-slate-600 mt-1 font-bold">INV-{activeOrder.orderCode || activeOrder.id}</div>
                  <div className="text-slate-400 text-[10px]">{new Date(activeOrder.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Bill To */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="font-bold text-[11px] text-slate-500 uppercase">Customer Details</span>
                  <div className="font-bold text-sm text-slate-900 mt-1">{activeOrder.customerName}</div>
                  <div className="font-mono text-slate-600 mt-0.5">{activeOrder.customerPhone}</div>
                  <div className="text-slate-600 mt-0.5">{activeOrder.customerAddress || 'Standard Delivery'}</div>
                  <div className="font-bold text-slate-800">{activeOrder.customerCity || 'Karachi'}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[11px] text-slate-500 uppercase">Shipping Details</span>
                  <div className="font-semibold text-slate-900 mt-1">{activeOrder.courier || 'Cash on Delivery Courier'}</div>
                  <div className="font-mono text-slate-600 mt-0.5">Tracking: {activeOrder.trackingNumber || 'Pending'}</div>
                  <div className="font-bold text-emerald-700 mt-1 uppercase">Payment: {activeOrder.paymentMethod || 'COD'}</div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeOrder.items && activeOrder.items.length > 0) ? (
                    activeOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-900">{it.title}</td>
                        <td className="p-2.5 text-center font-mono">{it.qty}</td>
                        <td className="p-2.5 text-right font-mono">Rs. {Number(it.price).toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono font-bold">Rs. {Number(it.total || it.price * it.qty).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Wholesale Store Catalog Selection</td>
                      <td className="p-2.5 text-center font-mono">1</td>
                      <td className="p-2.5 text-right font-mono">Rs. {Number(activeOrder.grandTotal).toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-bold">Rs. {Number(activeOrder.grandTotal).toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">Rs. {Number(activeOrder.subtotal || activeOrder.grandTotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping Fee:</span>
                    <span className="font-mono">Rs. {Number(activeOrder.shippingFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-[#007382]">Rs. {Number(activeOrder.grandTotal).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400">
                Thank you for ordering with Save & Smile! For inquiry or replacement claim within 7 days, WhatsApp 0316-2323616.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
