'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Filter,
  Calendar,
  Percent,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Copy,
  TrendingUp,
  Gift,
  Zap,
  ShoppingBag,
  RefreshCw,
  X,
  AlertCircle
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minPurchase: number;
  maxDiscount: number | null;
  usageCount: number;
  usageLimit: number;
  perCustomerLimit: number;
  startsAt: string;
  endsAt: string;
  status: 'active' | 'scheduled' | 'expired' | 'disabled';
  appliesTo?: { products?: string[]; categories?: string[] };
  revenueInfluenced?: number;
}

export default function DiscountsMarketingPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'disabled'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    description: '',
    type: 'percentage',
    value: 10,
    minPurchase: 1500,
    maxDiscount: 500,
    usageLimit: 100,
    status: 'active',
    startsAt: new Date().toISOString().substring(0, 10),
    endsAt: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10)
  });
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/discounts');
      const data = await res.json();
      if (data.success && Array.isArray(data.coupons)) {
        setCoupons(data.coupons);
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to load discounts: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: 10,
      minPurchase: 1500,
      maxDiscount: 500,
      usageLimit: 100,
      status: 'active',
      startsAt: new Date().toISOString().substring(0, 10),
      endsAt: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10)
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      ...coupon,
      startsAt: coupon.startsAt ? coupon.startsAt.substring(0, 10) : '',
      endsAt: coupon.endsAt ? coupon.endsAt.substring(0, 10) : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code?.trim()) {
      setNotice({ type: 'error', message: 'Coupon code cannot be empty.' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        id: editingCoupon ? editingCoupon.id : undefined,
        code: formData.code.trim().toUpperCase()
      };

      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setNotice({
          type: 'success',
          message: editingCoupon ? 'Coupon updated successfully!' : 'New promo discount code created!'
        });
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to save coupon' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon code "${code}"?`)) return;
    try {
      const res = await fetch(`/api/discounts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: `Coupon "${code}" deleted.` });
        fetchCoupons();
      } else {
        setNotice({ type: 'error', message: data.error || 'Could not delete coupon' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setNotice({ type: 'success', message: `Coupon code "${code}" copied to clipboard!` });
    setTimeout(() => setNotice(null), 2500);
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [coupons, statusFilter, search]);

  const stats = useMemo(() => {
    const totalActive = coupons.filter(c => c.status === 'active').length;
    const totalRedemptions = coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0);
    const totalInfluenced = coupons.reduce((acc, c) => acc + (c.revenueInfluenced || 0), 0);
    return { totalActive, totalRedemptions, totalInfluenced };
  }, [coupons]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-7 h-7 text-emerald-600" />
            Discounts & Marketing Campaigns
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create promotional coupons, free shipping rules, flash sale vouchers, and customer incentives.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCoupons}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Active Coupons</span>
            <span className="text-2xl font-bold text-gray-900">{stats.totalActive} Codes Live</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Redemptions</span>
            <span className="text-2xl font-bold text-gray-900">{stats.totalRedemptions} Orders</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Promo Revenue Generated</span>
            <span className="text-2xl font-bold text-gray-900">Rs. {stats.totalInfluenced.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search coupon by promo code or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'active', 'expired', 'disabled'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm">Loading marketing coupons...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No discount codes found</h3>
          <p className="text-sm text-gray-500 mt-1">Click "Create Coupon" to launch your first promotional offer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCoupons.map(coupon => {
            const isExpired = new Date(coupon.endsAt).getTime() < Date.now();
            return (
              <div
                key={coupon.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Banner Tag */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyCode(coupon.code)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg font-mono font-bold text-sm tracking-wider hover:bg-emerald-100 transition"
                      title="Click to copy code"
                    >
                      {coupon.code}
                      <Copy className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        coupon.status === 'active' && !isExpired
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isExpired ? 'Expired' : coupon.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(coupon)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded transition"
                      title="Edit coupon"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id, coupon.code)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-4 line-clamp-2 min-h-[32px]">
                  {coupon.description || 'Nationwide promotional discount.'}
                </p>

                {/* Offer Details */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1.5 text-xs text-gray-700 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Discount Benefit:</span>
                    <span className="font-bold text-emerald-700">
                      {coupon.type === 'percentage'
                        ? `${coupon.value}% OFF`
                        : coupon.type === 'free_shipping'
                        ? 'FREE Nationwide Delivery'
                        : `Rs. ${coupon.value} Flat OFF`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Min. Order Value:</span>
                    <span className="font-medium">Rs. {coupon.minPurchase.toLocaleString()}</span>
                  </div>
                  {coupon.maxDiscount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Max Discount Cap:</span>
                      <span className="font-medium">Rs. {coupon.maxDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Usage Limit:</span>
                    <span className="font-medium">
                      {coupon.usageCount} / {coupon.usageLimit} redeemed
                    </span>
                  </div>
                </div>

                {/* Footer with expiry date */}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Ends {new Date(coupon.endsAt).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-gray-700">
                    Gen. Rs. {(coupon.revenueInfluenced || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SAVE10, MEGA500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Discount Type</label>
                  <select
                    value={formData.type || 'percentage'}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="percentage">Percentage (%) Discount</option>
                    <option value="fixed">Fixed Amount (Rs.) Discount</option>
                    <option value="free_shipping">Free Shipping Voucher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Public Description</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 10% discount on orders above Rs. 2,500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Value {formData.type === 'percentage' ? '(%)' : '(Rs)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.value || 0}
                    onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Min Spend (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minPurchase || 0}
                    onChange={e => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Max Cap (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={formData.maxDiscount || ''}
                    onChange={e =>
                      setFormData({ ...formData, maxDiscount: e.target.value ? parseFloat(e.target.value) : null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit || 100}
                    onChange={e => setFormData({ ...formData, usageLimit: parseInt(e.target.value, 10) || 100 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startsAt || ''}
                    onChange={e => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.endsAt || ''}
                    onChange={e => setFormData({ ...formData, endsAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
