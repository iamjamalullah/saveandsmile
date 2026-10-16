'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Save,
  RefreshCw,
  X,
  CheckCircle2,
  Globe,
  DollarSign
} from 'lucide-react';

interface StoreSettingsData {
  store: {
    name: string;
    tagline: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    currency: string;
    timezone: string;
    language: string;
    status: string;
  };
  security: {
    sessionTimeoutHours: number;
    enforceStrongPasswords: boolean;
  };
}

export default function StoreSettingsPage() {
  const [settings, setSettings] = useState<StoreSettingsData>({
    store: {
      name: 'Save & Smile',
      tagline: 'Shop • Save • Smile | Wholesale Store Pakistan',
      email: 'support@saveandsmile.pk',
      phone: '0316-2323616',
      whatsapp: '923162323616',
      address: 'Wholesale Market, Karachi / Lahore, Pakistan',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      language: 'en-PK',
      status: 'online'
    },
    security: {
      sessionTimeoutHours: 24,
      enforceStrongPasswords: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(prev => ({
          ...prev,
          ...data.settings,
          store: { ...prev.store, ...(data.settings.store || {}) },
          security: { ...prev.security, ...(data.settings.security || {}) }
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
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: 'Store configurations saved successfully!' });
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to save settings' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-emerald-600" />
            General Store Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure primary wholesale store details, contact numbers, regional locale, and administrator security.
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
            {saving ? 'Saving...' : 'Save Settings'}
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
          <p className="text-sm">Loading store settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Business Profile Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600" />
                Store Identity & Customer Contact
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                These details are displayed on customer receipts, invoices, and website footer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  value={settings.store.name}
                  onChange={e => setSettings({ ...settings, store: { ...settings.store, name: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Official Tagline</label>
                <input
                  type="text"
                  value={settings.store.tagline}
                  onChange={e => setSettings({ ...settings, store: { ...settings.store, tagline: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Support Email</label>
                <input
                  type="email"
                  value={settings.store.email}
                  onChange={e => setSettings({ ...settings, store: { ...settings.store, email: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Helpline Phone</label>
                <input
                  type="text"
                  value={settings.store.phone}
                  onChange={e => setSettings({ ...settings, store: { ...settings.store, phone: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">WhatsApp Order Support</label>
                <input
                  type="text"
                  value={settings.store.whatsapp}
                  onChange={e => setSettings({ ...settings, store: { ...settings.store, whatsapp: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Store Online Status</label>
                <select
                  value={settings.store.status}
                  onChange={e => setSettings({ ...settings, store: { ...settings.store, status: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="online">Online - Accepting Orders</option>
                  <option value="maintenance">Maintenance Mode</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-gray-700 uppercase mb-1">Warehouse / Physical Address</label>
                <input
                  type="text"
                  value={settings.store.address}
                  onChange={e => setSettings({ ...settings, store: { ...settings.store, address: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Regional & Currency Settings */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                Regional & Localization
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Store Currency</label>
                <input
                  type="text"
                  value={settings.store.currency}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Timezone</label>
                <input
                  type="text"
                  value={settings.store.timezone}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Default Locale</label>
                <input
                  type="text"
                  value={settings.store.language}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Security & Access */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Security & Session Policies
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Admin Session Timeout (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.security.sessionTimeoutHours}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, sessionTimeoutHours: parseInt(e.target.value, 10) || 24 }
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="enforceStrongPasswords"
                  checked={settings.security.enforceStrongPasswords}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, enforceStrongPasswords: e.target.checked }
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="enforceStrongPasswords" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  Enforce strong passwords for all admin and staff accounts
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
