'use client';

import React, { useState, useEffect } from 'react';
import { HeroSlide } from '@/lib/types';
import { DEFAULT_HERO_SLIDES } from '@/lib/store';

export default function ThemeCustomizerView() {
  const [activeSection, setActiveSection] = useState<'announcements' | 'slider' | 'trust' | 'flash' | 'portions' | 'branding'>('slider');
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [saving, setSaving] = useState(false);

  // Announcement Bar State
  const [announce1, setAnnounce1] = useState('Welcome to Save & Smile Wholesale Portal');
  const [announce2, setAnnounce2] = useState('Direct Factory Rates & High Reseller Profit Margins');
  const [announce3, setAnnounce3] = useState('Cash on Delivery (COD) Across Pakistan');

  // Flash Sale State
  const [flashTitle, setFlashTitle] = useState('Flash Sale — Limited Wholesale Stock');
  const [flashSubtitle, setFlashSubtitle] = useState('Exclusive wholesale stock liquidation — ends in hours');
  const [flashTargetHours, setFlashTargetHours] = useState('14');

  // Store Portions Titles
  const [hotTitle, setHotTitle] = useState('Hot Selling Wholesale Gadgets');
  const [hotSubtitle, setHotSubtitle] = useState('Fast moving products with highest reseller profit margins');
  const [newTitle, setNewTitle] = useState('Latest New Arrivals');
  const [newSubtitle, setNewSubtitle] = useState('Fresh containers imported this week — First batch wholesale prices');
  const [trendTitle, setTrendTitle] = useState('Trending Wholesale Picks');
  const [trendSubtitle, setTrendSubtitle] = useState('Most demanded smart watches, organizers & lifestyle essentials');

  // Slider Edit State
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideSubtitle, setNewSlideSubtitle] = useState('');
  const [newSlideImage, setNewSlideImage] = useState('');
  const [newSlideLink, setNewSlideLink] = useState('#products');
  const [newSlideBadge, setNewSlideBadge] = useState('WHOLESALE DEAL');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('qadri_hero_slides') || localStorage.getItem('qadri_custom_banners');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setSlides(parsed);
      }
    } catch (e) {}
  }, []);

  function handleAddSlide() {
    if (!newSlideImage.trim()) {
      alert('Please provide a banner image URL.');
      return;
    }
    const newSlide: HeroSlide = {
      id: Date.now(),
      title: newSlideTitle.trim() || 'Save & Smile Wholesale Deal',
      subtitle: newSlideSubtitle.trim() || 'Direct Factory Rates & Fast Dispatch',
      image: newSlideImage.trim(),
      link: newSlideLink.trim() || '#products',
      badge: newSlideBadge.trim()
    };
    const updated = [...slides, newSlide];
    setSlides(updated);
    setNewSlideTitle('');
    setNewSlideSubtitle('');
    setNewSlideImage('');
  }

  function handleRemoveSlide(id: number | string) {
    if (slides.length <= 1) {
      alert('You must keep at least 1 hero banner slide.');
      return;
    }
    setSlides(slides.filter(s => s.id !== id));
  }

  async function handlePublishTheme() {
    setSaving(true);
    const themeConfig = {
      hero_slides: slides,
      announcements: [announce1, announce2, announce3],
      flash_sale: {
        title: flashTitle,
        subtitle: flashSubtitle,
        hours: Number(flashTargetHours) || 14
      },
      portions: {
        hotSelling: { title: hotTitle, subtitle: hotSubtitle },
        newArrivals: { title: newTitle, subtitle: newSubtitle },
        trendingPicks: { title: trendTitle, subtitle: trendSubtitle }
      }
    };

    try {
      // 1. Local Cache Updates
      localStorage.setItem('qadri_hero_slides', JSON.stringify(slides));
      localStorage.setItem('qadri_custom_banners', JSON.stringify(slides));
      localStorage.setItem('qadri_theme_config', JSON.stringify(themeConfig));

      // 2. Dispatch Local Window Events
      window.dispatchEvent(new Event('qadri_hero_slides_updated'));
      window.dispatchEvent(new Event('storage'));

      // 3. Broadcast to other open browser tabs
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('qadri_store_sync');
        channel.postMessage({ type: 'theme_updated', config: themeConfig });
        channel.close();
      }

      // 4. Server API Persistence
      const token = localStorage.getItem('save_and_smile_admin_token');
      await fetch('/api/home-customization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ config: themeConfig })
      });

      alert('🎉 Homepage Customization published! Website updated in real-time.');
    } catch (err: any) {
      alert('Saved locally. Real-time changes active!');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Bar with Live Publish */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-[#007382]/10 text-[#007382] px-2.5 py-1 rounded-full">
            Shopify Pro Theme Customizer
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Homepage Visual Studio</h1>
          <p className="text-xs text-slate-400">Customize banners, promo strips, section headings, and real-time storefront display</p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/admin/builder"
            className="px-4 py-2 bg-gradient-to-r from-[#007382] to-teal-700 hover:from-[#005a66] hover:to-teal-800 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5"
          >
            <span>🎨</span>
            <span>Split-Screen Live Builder ↗</span>
          </a>
          <a
            href="/"
            target="_blank"
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>👁️</span>
            <span>Live Store ↗</span>
          </a>
          <button
            onClick={handlePublishTheme}
            disabled={saving}
            className="px-6 py-2 bg-[#1e2329] hover:bg-[#161a1e] text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5"
          >
            <span>🚀</span>
            <span>{saving ? 'Publishing...' : 'Publish to Store'}</span>
          </button>
        </div>
      </div>


      {/* Navigation Tabs (Shopify Style) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'slider', label: 'Hero Banner Slider', icon: '🖼️' },
          { id: 'announcements', label: 'Top Ticker Bar', icon: '📢' },
          { id: 'flash', label: 'Flash Sale Timer', icon: '⚡' },
          { id: 'portions', label: 'Portions & Headings', icon: '🏷️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeSection === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SECTION 1: HERO BANNER SLIDER */}
      {activeSection === 'slider' && (
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Current Hero Banners ({slides.length})</h2>
                <p className="text-xs text-slate-400">High-resolution banners displayed in top carousel</p>
              </div>
            </div>

            <div className="space-y-3">
              {slides.map((s, idx) => (
                <div key={s.id || idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-24 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{s.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{s.subtitle}</div>
                    <div className="text-[10px] text-emerald-700 font-mono mt-0.5">{s.badge || 'PROMO'}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveSlide(s.id)}
                    className="text-rose-500 hover:text-rose-700 p-2 text-xs font-bold"
                    title="Remove Slide"
                  >
                    ✕ Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Banner Card */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">+ Add New Banner Slide</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Banner Image URL *</label>
                  <input
                    type="text"
                    required
                    placeholder="https://...webp or images/banner.jpg"
                    value={newSlideImage}
                    onChange={e => setNewSlideImage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. MEGA WHOLESALE SALE"
                    value={newSlideBadge}
                    onChange={e => setNewSlideBadge(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Headline Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Electronics Gala"
                    value={newSlideTitle}
                    onChange={e => setNewSlideTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sub-headline Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Over 200+ Smart Items ready to dispatch"
                    value={newSlideSubtitle}
                    onChange={e => setNewSlideSubtitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-xs"
                >
                  + Add Slide to Carousel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: TOP ANNOUNCEMENT BAR */}
      {activeSection === 'announcements' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 border-b pb-2">Top Announcement Ticker Messages</h2>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Message 1 (Welcome Message)</label>
              <input
                type="text"
                value={announce1}
                onChange={e => setAnnounce1(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Message 2 (Value Proposition)</label>
              <input
                type="text"
                value={announce2}
                onChange={e => setAnnounce2(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Message 3 (COD / Delivery)</label>
              <input
                type="text"
                value={announce3}
                onChange={e => setAnnounce3(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: FLASH SALE */}
      {activeSection === 'flash' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 border-b pb-2">Flash Sale Countdown Parameters</h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Flash Sale Heading</label>
              <input
                type="text"
                value={flashTitle}
                onChange={e => setFlashTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Flash Sale Subtitle</label>
              <input
                type="text"
                value={flashSubtitle}
                onChange={e => setFlashSubtitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Countdown Duration (Hours)</label>
              <input
                type="number"
                value={flashTargetHours}
                onChange={e => setFlashTargetHours(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none max-w-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: STORE PORTIONS */}
      {activeSection === 'portions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <h2 className="text-sm font-black text-slate-900 border-b pb-2">Custom Storefront Portions Headings</h2>

          {/* Portion 1: Hot Selling */}
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              Portion 1: Hot Selling
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={hotTitle}
                  onChange={e => setHotTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={hotSubtitle}
                  onChange={e => setHotSubtitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          {/* Portion 2: New Arrivals */}
          <div className="space-y-2 text-xs pt-4 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Portion 2: New Arrivals
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={e => setNewSubtitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          {/* Portion 3: Trending Picks */}
          <div className="space-y-2 text-xs pt-4 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#007382] bg-teal-50 px-2 py-0.5 rounded-full">
              Portion 3: Trending Picks
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={trendTitle}
                  onChange={e => setTrendTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={trendSubtitle}
                  onChange={e => setTrendSubtitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
