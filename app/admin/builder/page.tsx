'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BANNERS, FRONT_TABS } from '@/lib/data';

interface BannerSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  link: string;
}

interface FrontTabSection {
  id: string;
  name: string;
  key?: string;
  enabled?: boolean;
  categories?: string[];
}

export default function AdminBuilderPage() {
  const [banners, setBanners] = useState<BannerSlide[]>(BANNERS);
  const [sections, setSections] = useState<FrontTabSection[]>(
    FRONT_TABS.map(t => ({ ...t, enabled: true }))
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [editingSection, setEditingSection] = useState<FrontTabSection | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ss_home_customization');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.banners) setBanners(parsed.banners);
        if (parsed.sections) setSections(parsed.sections);
      }
    } catch {}
  }, []);

  const handleSave = () => {
    try {
      const payload = { banners, sections };
      localStorage.setItem('ss_home_customization', JSON.stringify(payload));
      window.dispatchEvent(new Event('home-customization-updated'));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {}
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const copy = [...sections];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setSections(copy);
  };

  const handleBannerImgChange = (id: number, newImg: string) => {
    setBanners(banners.map(b => b.id === id ? { ...b, image: newImg } : b));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className={`w-3 h-3 rounded-full ${savedSuccess ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'} shrink-0`}></span>
          <div>
            <div className="text-xs font-black text-white">
              {savedSuccess ? 'Changes Saved & Published to Live Storefront!' : 'Live Storefront Synced'}
            </div>
            <div className="text-[10px] text-slate-300">
              Recommended Banner Size: <strong>2117 × 743 px</strong> (16:9 widescreen)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" target="_blank" className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700">
            View Live Store ↗
          </Link>
          <button 
            onClick={handleSave}
            className="px-5 py-2 bg-[#008060] hover:bg-[#006e52] text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md transition transform active:scale-95"
          >
            <span>💾 Save &amp; Publish to Store</span>
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Hero Banners Manager */}
        <div className="bg-white p-5 rounded-xl border border-[#e1e3e5] shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>🖼️ Hero Slider Banners</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">{banners.length} Slides</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Banner image size: <strong>2117 × 743 px</strong>. Change image URLs or links below.
            </p>
          </div>

          <div className="space-y-4">
            {banners.map((b, idx) => (
              <div key={b.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Slide #{idx + 1}</span>
                  <span className="text-[10px] font-semibold text-slate-500">ID: {b.id}</span>
                </div>
                <div className="flex gap-3 items-center">
                  <img src={b.image} alt={b.title} className="w-24 h-14 object-cover rounded-lg border border-slate-300 bg-white" />
                  <div className="flex-1 space-y-1.5">
                    <input 
                      type="text" 
                      className="w-full text-xs border rounded px-2 py-1 bg-white"
                      placeholder="Image URL (2117 × 743 px)..."
                      value={b.image}
                      onChange={e => handleBannerImgChange(b.id, e.target.value)}
                    />
                    <div className="text-[10px] text-slate-500">
                      Ideal dimension: <strong>2117 × 743 px</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Sections Order & Layout Manager */}
        <div className="bg-white p-5 rounded-xl border border-[#e1e3e5] shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>🧩 Homepage Sections Order &amp; Layout Manager</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800">{sections.length} Portions</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Move portions ▲ Ooper or ▼ Neechay to adjust their storefront position.
            </p>
          </div>

          <div className="space-y-2">
            {sections.map((sec, idx) => (
              <div key={sec.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between hover:border-slate-300">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{sec.name}</div>
                    <div className="text-[10px] text-slate-500">Key: {sec.id}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button 
                    disabled={idx === 0}
                    onClick={() => moveSection(idx, 'up')}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded text-xs font-bold"
                  >
                    ▲ Ooper
                  </button>
                  <button 
                    disabled={idx === sections.length - 1}
                    onClick={() => moveSection(idx, 'down')}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded text-xs font-bold"
                  >
                    ▼ Neechay
                  </button>
                  <button 
                    onClick={() => setEditingSection(sec)}
                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded text-xs font-bold"
                  >
                    ⚙️ Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-bold text-sm text-slate-900">Edit Section: {editingSection.name}</h2>
              <button onClick={() => setEditingSection(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Label</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2"
                  value={editingSection.name}
                  onChange={e => setEditingSection({ ...editingSection, name: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="secEnabled"
                  checked={editingSection.enabled}
                  onChange={e => setEditingSection({ ...editingSection, enabled: e.target.checked })}
                />
                <label htmlFor="secEnabled" className="font-semibold text-slate-700">Display this section on storefront</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setEditingSection(null)} className="px-3 py-1.5 rounded-lg border text-xs font-semibold">Cancel</button>
              <button 
                onClick={() => {
                  setSections(sections.map(s => s.id === editingSection.id ? editingSection : s));
                  setEditingSection(null);
                }} 
                className="px-4 py-1.5 rounded-lg bg-[#008060] text-white text-xs font-bold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
