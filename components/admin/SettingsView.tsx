'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsView() {
  const [storeName, setStoreName] = useState('Save & Smile');
  const [whatsapp, setWhatsapp] = useState('923162323616');
  const [shippingFee, setShippingFee] = useState('200');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('3000');
  const [metaTitle, setMetaTitle] = useState('Save & Smile - Pakistan Online Wholesale Shopping Portal');
  const [metaDesc, setMetaDesc] = useState('Shop top quality trending household gadgets, kitchen accessories, smart watches & wholesale essentials at unbeatable factory prices across Pakistan.');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const branding = JSON.parse(localStorage.getItem('qadri_store_branding') || '{}');
      if (branding.name) setStoreName(branding.name);
      if (branding.whatsapp) setWhatsapp(branding.whatsapp);
      if (branding.shippingFee) setShippingFee(String(branding.shippingFee));
      if (branding.freeShippingThreshold) setFreeShippingThreshold(String(branding.freeShippingThreshold));
    } catch (e) {}
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const brandingData = {
      name: storeName,
      whatsapp: whatsapp,
      shippingFee: Number(shippingFee),
      freeShippingThreshold: Number(freeShippingThreshold)
    };

    const seoData = {
      default_title: metaTitle,
      default_description: metaDesc
    };

    try {
      localStorage.setItem('qadri_store_branding', JSON.stringify(brandingData));
      window.dispatchEvent(new Event('qadri_branding_updated'));

      // Also persist to API if token exists
      const token = localStorage.getItem('save_and_smile_admin_token');
      await fetch('/api/seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(seoData)
      });

      alert('✅ Store settings updated successfully!');
    } catch (err: any) {
      alert('Settings saved locally. Server sync: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-black text-slate-900">Store Settings &amp; SEO Configuration</h1>
        <p className="text-xs text-slate-400">Configure global parameters, WhatsApp hotline, shipping rates, and Google SEO</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Store Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 border-b pb-2">Business Profile &amp; Contact</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Store / Brand Name</label>
              <input
                type="text"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp Hotline (with Country Code)</label>
              <input
                type="text"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="e.g. 923162323616"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 border-b pb-2">Shipping &amp; Delivery Thresholds</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Standard Shipping Fee (Rs.)</label>
              <input
                type="number"
                value={shippingFee}
                onChange={e => setShippingFee(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Free Delivery Minimum Order (Rs.)</label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={e => setFreeShippingThreshold(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Orders equal or above this get automatic Free Delivery.</span>
            </div>
          </div>
        </div>

        {/* SEO Meta Tags Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 border-b pb-2">Google SEO &amp; Social Meta Tags</h2>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={e => setMetaTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Meta Description</label>
              <textarea
                rows={3}
                value={metaDesc}
                onChange={e => setMetaDesc(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#007382] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            {saving ? 'Saving Settings...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
