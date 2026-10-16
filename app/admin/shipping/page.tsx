'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  CreditCard,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  RefreshCw,
  X,
  AlertCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface ShippingPaymentsData {
  shipping: {
    flatRate: number;
    freeShippingThreshold: number;
    estimatedDays: string;
    couriers: string[];
    allowCOD: boolean;
  };
  payments: {
    cod: {
      enabled: boolean;
      title: string;
      description: string;
    };
    bankTransfer: {
      enabled: boolean;
      title: string;
      instructions: string;
    };
  };
}

export default function ShippingPaymentsPage() {
  const [data, setData] = useState<ShippingPaymentsData>({
    shipping: {
      flatRate: 200,
      freeShippingThreshold: 3000,
      estimatedDays: '2-4 Business Days',
      couriers: ['Trax', 'Leopard Courier', 'PostEx', 'M&P', 'TCS'],
      allowCOD: true
    },
    payments: {
      cod: {
        enabled: true,
        title: 'Cash on Delivery (COD)',
        description: 'Pay cash upon delivery anywhere in Pakistan.'
      },
      bankTransfer: {
        enabled: true,
        title: 'Bank Transfer / JazzCash / EasyPaisa',
        instructions: 'Direct bank transfer. Send WhatsApp receipt to 0316-2323616 with Order ID.'
      }
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCourier, setNewCourier] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.settings) {
        setData(prev => ({
          ...prev,
          shipping: { ...prev.shipping, ...(json.settings.shipping || {}) },
          payments: { ...prev.payments, ...(json.settings.payments || {}) }
        }));
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to load settings: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resJson = await res.json();
      if (resJson.success) {
        setNotice({ type: 'success', message: 'Shipping and payment configuration saved successfully!' });
      } else {
        setNotice({ type: 'error', message: resJson.error || 'Failed to save settings' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(null), 3500);
    }
  };

  const addCourier = () => {
    if (!newCourier.trim()) return;
    if (data.shipping.couriers.includes(newCourier.trim())) return;
    setData(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        couriers: [...prev.shipping.couriers, newCourier.trim()]
      }
    }));
    setNewCourier('');
  };

  const removeCourier = (courierName: string) => {
    setData(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        couriers: prev.shipping.couriers.filter(c => c !== courierName)
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-emerald-600" />
            Shipping & Payment Gateways
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Set nationwide delivery rates, free delivery thresholds, partner couriers, and payment methods.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
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

      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm">Loading shipping & payment rules...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Shipping Rates Configuration */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                Nationwide Delivery Rates & Thresholds
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Calculated automatically on checkout across all Pakistani cities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Standard Flat Shipping (Rs) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={data.shipping.flatRate}
                  onChange={e =>
                    setData({
                      ...data,
                      shipping: { ...data.shipping, flatRate: parseFloat(e.target.value) || 0 }
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">
                  FREE Shipping Minimum Spend (Rs) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={data.shipping.freeShippingThreshold}
                  onChange={e =>
                    setData({
                      ...data,
                      shipping: { ...data.shipping, freeShippingThreshold: parseFloat(e.target.value) || 0 }
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Estimated Delivery Time</label>
                <input
                  type="text"
                  value={data.shipping.estimatedDays}
                  onChange={e =>
                    setData({
                      ...data,
                      shipping: { ...data.shipping, estimatedDays: e.target.value }
                    })
                  }
                  placeholder="e.g. 2-4 Business Days"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Courier Providers List */}
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Integrated Courier Providers
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {data.shipping.couriers.map(courier => (
                  <span
                    key={courier}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-medium"
                  >
                    <span>{courier}</span>
                    <button
                      type="button"
                      onClick={() => removeCourier(courier)}
                      className="text-gray-400 hover:text-red-500 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Add another courier (e.g. CallCourier)..."
                  value={newCourier}
                  onChange={e => setNewCourier(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={addCourier}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 whitespace-nowrap"
                >
                  Add Courier
                </button>
              </div>
            </div>
          </div>

          {/* Payment Gateways Configuration */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Payment Methods & Checkout Gateways
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Enable and configure online & offline payment options.</p>
            </div>

            {/* Cash on Delivery (COD) */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Cash on Delivery (COD)</h4>
                  <p className="text-xs text-gray-500">Pay cash upon delivery anywhere in Pakistan</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setData({
                      ...data,
                      payments: {
                        ...data.payments,
                        cod: { ...data.payments.cod, enabled: !data.payments.cod.enabled }
                      }
                    })
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    data.payments.cod.enabled ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      data.payments.cod.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {data.payments.cod.enabled && (
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 uppercase mb-1">Display Title</label>
                    <input
                      type="text"
                      value={data.payments.cod.title}
                      onChange={e =>
                        setData({
                          ...data,
                          payments: {
                            ...data.payments,
                            cod: { ...data.payments.cod, title: e.target.value }
                          }
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 uppercase mb-1">Customer Description</label>
                    <input
                      type="text"
                      value={data.payments.cod.description}
                      onChange={e =>
                        setData({
                          ...data,
                          payments: {
                            ...data.payments,
                            cod: { ...data.payments.cod, description: e.target.value }
                          }
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bank Transfer / JazzCash / EasyPaisa */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Direct Bank Transfer / JazzCash / EasyPaisa</h4>
                  <p className="text-xs text-gray-500">Manual bank wire or mobile wallet payment before dispatch</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setData({
                      ...data,
                      payments: {
                        ...data.payments,
                        bankTransfer: {
                          ...data.payments.bankTransfer,
                          enabled: !data.payments.bankTransfer.enabled
                        }
                      }
                    })
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    data.payments.bankTransfer.enabled ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      data.payments.bankTransfer.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {data.payments.bankTransfer.enabled && (
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 uppercase mb-1">Display Title</label>
                    <input
                      type="text"
                      value={data.payments.bankTransfer.title}
                      onChange={e =>
                        setData({
                          ...data,
                          payments: {
                            ...data.payments,
                            bankTransfer: { ...data.payments.bankTransfer, title: e.target.value }
                          }
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 uppercase mb-1">
                      Bank Account Details & Payment Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={data.payments.bankTransfer.instructions}
                      onChange={e =>
                        setData({
                          ...data,
                          payments: {
                            ...data.payments,
                            bankTransfer: { ...data.payments.bankTransfer, instructions: e.target.value }
                          }
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
