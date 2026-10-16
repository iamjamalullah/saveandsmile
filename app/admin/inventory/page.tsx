'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  History,
  TrendingDown,
  TrendingUp,
  X,
  FileSpreadsheet,
  Package
} from 'lucide-react';

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  available: number;
  unitCost: number;
  status: 'healthy' | 'low_stock' | 'critical' | 'out_of_stock';
  image?: string;
}

interface MovementLog {
  id: string;
  productId: string;
  productTitle?: string;
  sku: string;
  type: 'IN' | 'OUT';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
  user?: string;
}

interface KPIs {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<MovementLog[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'alerts'>('stock');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Adjustment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState('Restock shipment received');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory', { cache: 'no-store' });
      const data = await res.json();
      if (data?.success) {
        setItems(data.items || []);
        setMovements(data.movements || []);
        setKpis(data.kpis || null);
      }
    } catch (e) {
      console.error(e);
      showToast('Error loading inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleOpenAdjust = (item: InventoryItem, type: 'IN' | 'OUT') => {
    setAdjustTarget(item);
    setAdjustType(type);
    setAdjustQty(10);
    setAdjustReason(type === 'IN' ? 'Restock shipment received' : 'Damaged / inventory audit adjustment');
    setIsModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    setSaving(true);
    try {
      const delta = adjustType === 'IN' ? Math.abs(adjustQty) : -Math.abs(adjustQty);
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustTarget.productId,
          delta,
          reason: adjustReason,
          actor: 'Inventory Manager'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Stock updated: ${adjustTarget.productName} (${delta > 0 ? '+' : ''}${delta})`);
        setIsModalOpen(false);
        loadInventory();
      } else {
        showToast(data.error || 'Failed to adjust stock');
      }
    } catch (err: any) {
      showToast(err.message || 'Adjustment error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Product ID', 'Product Title', 'SKU', 'Category', 'Stock Available', 'Unit Cost (PKR)', 'Stock Status'];
    const rows = items.map(i => [
      i.productId,
      `"${i.productName.replace(/"/g, '""')}"`,
      i.sku,
      i.category,
      i.available,
      i.unitCost,
      i.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Inventory report downloaded');
  };

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      item.status === statusFilter ||
      (statusFilter === 'alerts' && ['low_stock', 'critical', 'out_of_stock'].includes(item.status));

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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Inventory & Stock Control
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {kpis?.totalProducts || items.length} Products
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock valuation, adjustments log, and warehouse reorder points
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            Export Inventory
          </button>
          <button
            onClick={loadInventory}
            title="Refresh Stock Data"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Inventory Units</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {(kpis?.totalStock || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-teal-700 font-bold mt-1">Units physically on hand</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Retail Stock Valuation</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            Rs. {(kpis?.totalValue || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Based on catalog wholesale rates</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Low Stock Warnings</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {kpis?.lowStockCount || 0} Items
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Stock ≤ 10 units threshold</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Out of Stock</div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {kpis?.outOfStockCount || 0} Items
          </div>
          <div className="text-[11px] text-rose-700 font-medium mt-1">Immediate reorder required</div>
        </div>
      </div>

      {/* Tab Switcher & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'stock' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Live Stock Table ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'movements' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Movement Logs ({movements.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('alerts');
              setStatusFilter('alerts');
            }}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'alerts' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Low & Out of Stock ({(kpis?.lowStockCount || 0) + (kpis?.outOfStockCount || 0)})
          </button>
        </div>

        {activeTab !== 'movements' && (
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search SKU or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007382]"
              />
            </div>
          </div>
        )}
      </div>

      {/* STOCK TABLE TAB */}
      {(activeTab === 'stock' || activeTab === 'alerts') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="p-3.5">Product Title</th>
                  <th className="p-3.5">SKU Code</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Est. Unit Cost</th>
                  <th className="p-3.5">Available Stock</th>
                  <th className="p-3.5">Health Status</th>
                  <th className="p-3.5 text-right">Stock Adjustments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No inventory items found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold text-slate-900 max-w-[260px] truncate" title={item.productName}>
                        {item.productName}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{item.sku}</td>
                      <td className="p-3.5 capitalize text-slate-600">{item.category}</td>
                      <td className="p-3.5 font-mono">Rs. {item.unitCost}</td>
                      <td className="p-3.5">
                        <span className="font-black text-sm text-slate-900">{item.available}</span> units
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            item.status === 'out_of_stock'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : item.status === 'critical' || item.status === 'low_stock'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAdjust(item, 'IN')}
                            title="Stock In (+)"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition"
                          >
                            <Plus className="w-3 h-3" /> Stock In
                          </button>
                          <button
                            onClick={() => handleOpenAdjust(item, 'OUT')}
                            title="Stock Out (-)"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition"
                          >
                            <Minus className="w-3 h-3" /> Stock Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOVEMENTS LOG TAB */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900">Audit Trail of Stock Movements</h3>
            <span className="text-xs text-slate-400">Recorded automatically during orders & adjustments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">SKU / Code</th>
                  <th className="p-3.5">Movement Type</th>
                  <th className="p-3.5">Qty Changed</th>
                  <th className="p-3.5">Prev ➔ New Stock</th>
                  <th className="p-3.5">Reason / Source</th>
                  <th className="p-3.5">Staff User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No stock movement logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(m.date).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">{m.sku}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] ${
                            m.type === 'IN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {m.type === 'IN' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          STOCK {m.type}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold font-mono">
                        {m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {m.previousStock} ➔ <span className="font-bold text-slate-900">{m.newStock}</span>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-[200px] truncate" title={m.reason}>
                        {m.reason}
                      </td>
                      <td className="p-3.5 text-slate-500">{m.user || 'Admin'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {isModalOpen && adjustTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Stock {adjustType === 'IN' ? 'Addition (+)' : 'Reduction (-)'}</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-xs text-slate-900 truncate">{adjustTarget.productName}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  SKU: {adjustTarget.sku} • Current Stock: <span className="font-black text-slate-900">{adjustTarget.available}</span> units
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity to {adjustType === 'IN' ? 'Add' : 'Deduct'} *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-sm font-black px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Adjustment *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                >
                  {adjustType === 'IN' ? (
                    <>
                      <option value="Restock shipment received">Restock shipment received from supplier</option>
                      <option value="Customer return / order cancellation">Customer return / order cancellation</option>
                      <option value="Physical count inventory audit (+)">Physical count inventory audit (+)</option>
                    </>
                  ) : (
                    <>
                      <option value="Damaged in transit / warehouse">Damaged in transit / warehouse</option>
                      <option value="Physical count shrinkage audit (-)">Physical count shrinkage audit (-)</option>
                      <option value="Sample unit sent to customer">Sample unit sent to customer</option>
                    </>
                  )}
                </select>
              </div>

              <div className="p-2.5 rounded-lg bg-teal-50 text-[11px] font-bold text-[#007382] flex items-center justify-between">
                <span>New Stock Level After Adjustment:</span>
                <span className="text-sm font-black">
                  {adjustType === 'IN' ? adjustTarget.available + adjustQty : Math.max(0, adjustTarget.available - adjustQty)} units
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#007382] hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {saving ? 'Saving...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
