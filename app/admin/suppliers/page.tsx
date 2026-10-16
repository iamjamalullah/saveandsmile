'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  PackageCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  X,
  FileText,
  DollarSign
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  category: string;
  leadTimeDays: number;
  status: string;
  rating?: number;
  notes?: string;
}

interface POItem {
  productId: string;
  title: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  totalCost: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string;
  status: 'ordered' | 'partial' | 'received' | 'cancelled';
  totalAmount: number;
  paidAmount: number;
  items: POItem[];
  notes?: string;
}

export default function AdminSuppliersPage() {
  const [activeTab, setActiveTab] = useState<'pos' | 'suppliers'>('pos');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Supplier modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier>>({});

  // PO creation modal
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [newPO, setNewPO] = useState({
    supplierId: '',
    productId: '201',
    orderedQty: 50,
    unitCost: 1200,
    notes: ''
  });

  // PO receive modal
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});
  const [processing, setProcessing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [supRes, prodRes] = await Promise.all([
        fetch('/api/suppliers', { cache: 'no-store' }),
        fetch('/api/products', { cache: 'no-store' })
      ]);
      const supJson = await supRes.json();
      const prodJson = await prodRes.json();

      if (supJson?.success) {
        setSuppliers(supJson.suppliers || []);
        setPurchaseOrders(supJson.purchaseOrders || []);
      }
      if (prodJson?.products) {
        setProducts(prodJson.products);
      }
    } catch (e) {
      console.error(e);
      showToast('Error loading suppliers data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Supplier
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'supplier', ...editingSupplier })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Supplier saved successfully!');
        setIsSupplierModalOpen(false);
        loadData();
      } else {
        showToast(data.error || 'Failed to save supplier');
      }
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Create PO
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === newPO.supplierId) || suppliers[0];
    const prod = products.find(p => String(p.id) === String(newPO.productId));

    const poPayload = {
      type: 'po',
      supplierId: sup ? sup.id : 'sup_1',
      supplierName: sup ? sup.name : 'Wholesale Supplier',
      status: 'ordered',
      totalAmount: (newPO.orderedQty || 1) * (newPO.unitCost || 0),
      paidAmount: 0,
      items: [
        {
          productId: String(newPO.productId),
          title: prod ? prod.title : 'Wholesale Product',
          orderedQty: newPO.orderedQty,
          receivedQty: 0,
          unitCost: newPO.unitCost,
          totalCost: (newPO.orderedQty || 1) * (newPO.unitCost || 0)
        }
      ],
      notes: newPO.notes
    };

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poPayload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Purchase order ${data.po?.poNumber} created!`);
        setIsPOModalOpen(false);
        loadData();
      }
    } catch (e: any) {
      showToast(e.message);
    }
  };

  // Open Receive PO modal
  const handleOpenReceive = (po: PurchaseOrder) => {
    setReceivingPO(po);
    const initial: Record<string, number> = {};
    (po.items || []).forEach(item => {
      const pending = Math.max(0, item.orderedQty - item.receivedQty);
      initial[item.productId] = pending;
    });
    setReceiveQtys(initial);
  };

  // Submit Receive Inventory
  const handleSubmitReceive = async () => {
    if (!receivingPO) return;
    setProcessing(true);
    try {
      const receivedItems = Object.entries(receiveQtys).map(([productId, qty]) => ({
        productId,
        receiveQty: qty
      }));

      const res = await fetch('/api/suppliers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poId: receivingPO.id,
          receivedItems
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Inventory received and catalog stock updated live!');
        setReceivingPO(null);
        loadData();
      } else {
        showToast(data.error || 'Failed to receive PO');
      }
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setProcessing(false);
    }
  };

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
            Suppliers & Purchase Orders (Procurement)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage factory importers, track purchase orders, and receive inventory directly into stock
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'pos' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'suppliers' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Suppliers Directory ({suppliers.length})
          </button>
        </div>
      </div>

      {/* PO TAB */}
      {activeTab === 'pos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">
              Track warehouse inbound shipments from China & local markets
            </div>
            <button
              onClick={() => {
                if (suppliers.length > 0) setNewPO(prev => ({ ...prev, supplierId: suppliers[0].id }));
                setIsPOModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#007382] hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Issue Purchase Order
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3.5">PO Number</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Date Issued</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Fulfillment Progress</th>
                    <th className="p-3.5 text-right">Warehouse Receiving</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {purchaseOrders.map(po => {
                    const totalOrdered = (po.items || []).reduce((acc, i) => acc + (i.orderedQty || 0), 0);
                    const totalReceived = (po.items || []).reduce((acc, i) => acc + (i.receivedQty || 0), 0);
                    const pct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

                    return (
                      <tr key={po.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-bold font-mono text-slate-900">{po.poNumber}</td>
                        <td className="p-3.5 font-semibold text-slate-800">{po.supplierName}</td>
                        <td className="p-3.5 text-slate-500">{new Date(po.orderDate).toLocaleDateString()}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              po.status === 'received'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : po.status === 'partial'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-black text-slate-900">
                          Rs. {Number(po.totalAmount).toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div
                                className={`h-full ${pct === 100 ? 'bg-emerald-500' : 'bg-[#007382]'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-600">
                              {totalReceived}/{totalOrdered} ({pct}%)
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          {po.status !== 'received' ? (
                            <button
                              onClick={() => handleOpenReceive(po)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition"
                            >
                              <PackageCheck className="w-3.5 h-3.5" /> Receive In Stock
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Fully Received
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">
              Registered direct wholesale distributors & container importers
            </div>
            <button
              onClick={() => {
                setEditingSupplier({
                  name: '',
                  contactPerson: '',
                  email: '',
                  phone: '',
                  city: 'Lahore',
                  address: '',
                  category: 'Gadgets',
                  leadTimeDays: 3,
                  rating: 5.0
                });
                setIsSupplierModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#007382] hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map(sup => (
              <div key={sup.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{sup.name}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.contactPerson}</span> • <span className="font-bold text-teal-700">{sup.city}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    {sup.category}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                  <span>Lead Time: <strong className="text-slate-800">{sup.leadTimeDays} Days</strong></span>
                  <span>Supplier Rating: <strong className="text-amber-600">⭐ {sup.rating || 5.0}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE PO MODAL */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-black text-slate-900">Issue Purchase Order (PO)</h2>
              <button onClick={() => setIsPOModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Supplier *</label>
                <select
                  value={newPO.supplierId}
                  onChange={(e) => setNewPO({ ...newPO, supplierId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Product *</label>
                <select
                  value={newPO.productId}
                  onChange={(e) => setNewPO({ ...newPO, productId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.title} (Current: {p.stock} units)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Order Quantity (Units) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPO.orderedQty}
                    onChange={(e) => setNewPO({ ...newPO, orderedQty: parseInt(e.target.value, 10) || 1 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost Per Unit (PKR) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPO.unitCost}
                    onChange={(e) => setNewPO({ ...newPO, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Total Purchase Value:</span>
                <span className="font-black text-sm text-[#007382]">
                  Rs. {((newPO.orderedQty || 0) * (newPO.unitCost || 0)).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPOModalOpen(false)} className="px-3.5 py-1.5 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#007382] text-white text-xs font-bold rounded-xl shadow-xs">Generate PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE PO MODAL */}
      {receivingPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-black text-slate-900">
                Receive Stock: {receivingPO.poNumber}
              </h2>
              <button onClick={() => setReceivingPO(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Enter the verified count of items physically delivered. This will immediately add to product inventory on the storefront!
              </p>

              <div className="space-y-3">
                {(receivingPO.items || []).map(item => {
                  const pending = Math.max(0, item.orderedQty - item.receivedQty);
                  return (
                    <div key={item.productId} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="font-bold text-xs text-slate-900">{item.title}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Ordered: <strong>{item.orderedQty}</strong></span>
                        <span>Already Received: <strong>{item.receivedQty}</strong></span>
                        <span className="text-amber-600 font-bold">Pending: {pending}</span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Receiving Right Now (Units):
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={pending}
                          value={receiveQtys[item.productId] ?? pending}
                          onChange={(e) => setReceiveQtys({ ...receiveQtys, [item.productId]: parseInt(e.target.value, 10) || 0 })}
                          className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReceivingPO(null)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleSubmitReceive}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {processing ? 'Updating Stock...' : 'Confirm & Add to Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
