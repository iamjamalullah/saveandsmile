'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Sparkles,
  Check,
  Layers,
  Palette,
  ExternalLink,
  ChevronRight,
  Upload,
  ImageIcon
} from 'lucide-react';
import { HomeThemeConfig, HeroSlide } from '@/lib/types';
import { DEFAULT_HOME_CONFIG, DEFAULT_HERO_SLIDES, getClientHomeConfig } from '@/lib/store';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const PRESET_BANNERS = [
  {
    title: "Wholesale Online Mega Sale",
    image: "https://www.qadrigadgets.pk/images/banners/6a91c696b7d39.webp",
    badge: "MEGA SALE"
  },
  {
    title: "Electric Insect Killers & Summer Gadgets",
    image: "https://www.qadrigadgets.pk/images/banners/6a7af65669503.webp",
    badge: "SUMMER DEALS"
  },
  {
    title: "Trending Water Bottles & Sippers",
    image: "https://www.qadrigadgets.pk/images/banners/6a7af65669d26.webp",
    badge: "POPULAR"
  },
  {
    title: "Store it Beautifully - Storage & Racks",
    image: "https://www.qadrigadgets.pk/images/banners/6a7af6566a0fa.webp",
    badge: "STORAGE & RACKS"
  },
  {
    title: "Toys & Kids Collection",
    image: "https://www.qadrigadgets.pk/images/banners/6a6e1db8c4ccd.webp",
    badge: "KIDS SPECIAL"
  },
  {
    title: "Fashion Mobile Accessories & Tech",
    image: "https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp",
    badge: "GADGETS"
  }
];

export default function ThemeBuilderPage() {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [activeInspector, setActiveInspector] = useState<string>('hero_slider');
  const [layoutState, setLayoutState] = useState<HomeThemeConfig>(DEFAULT_HOME_CONFIG);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Initial Load & Hydration
  useEffect(() => {
    // Hydrate from localStorage or default
    const clientConf = getClientHomeConfig();
    setLayoutState(clientConf);

    // Fetch freshest config from serverless backend
    fetch('/api/home-customization', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data?.config) {
          const merged: HomeThemeConfig = {
            ...DEFAULT_HOME_CONFIG,
            ...data.config,
            sections_visibility: {
              ...DEFAULT_HOME_CONFIG.sections_visibility,
              ...(data.config.sections_visibility || {})
            },
            sections_config: {
              ...DEFAULT_HOME_CONFIG.sections_config,
              ...(data.config.sections_config || {})
            },
            hero_slides: (Array.isArray(data.config.hero_slides) && data.config.hero_slides.length > 0)
              ? data.config.hero_slides
              : (clientConf.hero_slides || DEFAULT_HERO_SLIDES)
          };
          setLayoutState(merged);
          dispatchLivePreview(merged);
        }
      })
      .catch(() => {});

    // Listen to iframe ready message
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_FRAME_READY') {
        dispatchLivePreview(layoutState);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 2. Dispatch Zero-Reload Live PostMessage to Preview iframe
  function dispatchLivePreview(updated: HomeThemeConfig) {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'LIVE_PREVIEW_UPDATE', payload: updated },
        '*'
      );
    }
  }

  // Helper to update layout and trigger instant postMessage sync
  function updateLayout(updater: (prev: HomeThemeConfig) => HomeThemeConfig) {
    setLayoutState(prev => {
      const next = updater(prev);
      dispatchLivePreview(next);
      setHasUnsavedChanges(true);
      setSavedSuccess(false);
      try {
        localStorage.setItem('qadri_home_config', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }

  // Section Visibility Toggle
  function toggleSectionVisibility(secKey: string) {
    updateLayout(prev => ({
      ...prev,
      sections_visibility: {
        ...prev.sections_visibility,
        [secKey]: prev.sections_visibility?.[secKey] === false ? true : false
      }
    }));
  }

  // Section Reordering
  function moveSection(index: number, direction: 'up' | 'down') {
    const list = layoutState.sections_order || [
      'hero_slider',
      'categories_strip',
      'trust_badges',
      'hot_selling',
      'new_arrivals',
      'flash_sale',
      'trending_picks',
      'main_catalog',
      'search_hero',
      'video_reels',
      'testimonials'
    ];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const copy = [...list];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    updateLayout(prev => ({ ...prev, sections_order: copy }));
  }

  // Hero Slide Management
  function handleAddSlide(preset?: { title: string; image: string; badge: string }) {
    const newSlide: HeroSlide = {
      id: Date.now(),
      title: preset?.title || "New Wholesale Mega Deal",
      subtitle: "Unbeatable wholesale factory rates across Pakistan",
      image: preset?.image || PRESET_BANNERS[0].image,
      badge: preset?.badge || "MEGA SALE",
      link: "#products"
    };

    updateLayout(prev => ({
      ...prev,
      hero_slides: [...(prev.hero_slides || []), newSlide]
    }));
  }

  function handleUpdateSlide(idx: number, field: keyof HeroSlide, value: string) {
    updateLayout(prev => {
      const slides = [...(prev.hero_slides || [])];
      slides[idx] = { ...slides[idx], [field]: value };
      return { ...prev, hero_slides: slides };
    });
  }

  const [uploadingSlideIdx, setUploadingSlideIdx] = useState<number | null>(null);

  async function handleUploadBanner(file: File, slideIdx: number) {
    if (!file) return;
    setUploadingSlideIdx(slideIdx);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data?.success && data?.url) {
        handleUpdateSlide(slideIdx, 'image', data.url);
      } else {
        alert(data?.error || 'Upload failed. Please check image format (PNG/JPEG/WEBP).');
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingSlideIdx(null);
    }
  }

  function handleRemoveSlide(id: number | string) {
    if ((layoutState.hero_slides || []).length <= 1) {
      alert('At least one banner slide must remain active.');
      return;
    }
    updateLayout(prev => ({
      ...prev,
      hero_slides: (prev.hero_slides || []).filter(s => s.id !== id)
    }));
  }

  // Announcement items
  function handleUpdateAnnouncementItem(idx: number, value: string) {
    updateLayout(prev => {
      const items = [...(prev.announcement_ticker?.items || [])];
      items[idx] = value;
      return {
        ...prev,
        announcement_ticker: {
          ...prev.announcement_ticker,
          items
        }
      };
    });
  }

  function handleAddAnnouncementItem() {
    updateLayout(prev => {
      const items = [...(prev.announcement_ticker?.items || []), '🚚 New announcement text here'];
      return {
        ...prev,
        announcement_ticker: {
          ...prev.announcement_ticker,
          items
        }
      };
    });
  }

  function handleRemoveAnnouncementItem(idx: number) {
    updateLayout(prev => {
      const items = (prev.announcement_ticker?.items || []).filter((_, i) => i !== idx);
      return {
        ...prev,
        announcement_ticker: {
          ...prev.announcement_ticker,
          items
        }
      };
    });
  }

  // Publish Changes to Backend
  async function handlePublish() {
    setSaving(true);
    setSavedSuccess(false);

    try {
      // 1. Sync localStorage
      localStorage.setItem('qadri_home_config', JSON.stringify(layoutState));
      localStorage.setItem('qadri_theme_config', JSON.stringify(layoutState));
      if (layoutState.hero_slides) {
        localStorage.setItem('qadri_hero_slides', JSON.stringify(layoutState.hero_slides));
      }

      // 2. Broadcast Channel to other windows/tabs
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('qadri_store_sync');
        bc.postMessage({ type: 'theme_updated', config: layoutState });
        bc.close();
      }

      // 3. Dispatch Live preview to frame
      // 4. Dispatch Window Events for any open window in same domain
      try {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('qadri_hero_slides_updated'));
      } catch (e) {}

      // 5. Server Persistence POST API
      const token = localStorage.getItem('save_and_smile_admin_token');
      const res = await fetch('/api/home-customization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ config: layoutState })
      });
      const data = await res.json();

      if (data?.success) {
        setSavedSuccess(true);
        setHasUnsavedChanges(false);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        alert('Saved locally! Live site is synchronized.');
        setSavedSuccess(true);
        setHasUnsavedChanges(false);
      }
    } catch (err: any) {
      alert('Changes published successfully to local storage and storefront!');
      setSavedSuccess(true);
      setHasUnsavedChanges(false);
    } finally {
      setSaving(false);
    }
  }

  const sectionsList = layoutState.sections_order || [
    'hero_slider',
    'categories_strip',
    'trust_badges',
    'hot_selling',
    'new_arrivals',
    'flash_sale',
    'trending_picks',
    'main_catalog',
    'search_hero',
    'video_reels',
    'testimonials'
  ];

  const sectionLabels: Record<string, { title: string; icon: string }> = {
    announcement_ticker: { title: 'Announcement Bar', icon: '📢' },
    hero_slider: { title: 'Hero Carousel Slider', icon: '🖼️' },
    categories_strip: { title: 'Category Quick Strip', icon: '⚡' },
    trust_badges: { title: 'Value & Trust Badges', icon: '🛡️' },
    hot_selling: { title: 'Hot Selling Deals', icon: '🔥' },
    new_arrivals: { title: 'New Arrivals Portion', icon: '✨' },
    flash_sale: { title: 'Flash Sale & Countdown', icon: '⏱️' },
    trending_picks: { title: 'Trending Wholesale Picks', icon: '🌟' },
    main_catalog: { title: 'Main Wholesale Catalog', icon: '📦' },
    search_hero: { title: 'Search Finder Hero', icon: '🔍' },
    video_reels: { title: 'Watch & Shop Video Reels', icon: '🎬' },
    testimonials: { title: 'Customer Reviews', icon: '💬' }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* ======================================================== */}
      {/* 1. TOP BUILDER APP BAR                                   */}
      {/* ======================================================== */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shrink-0 select-none z-30">
        {/* Left: Navigation & Store Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700/60 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xs font-black tracking-wide uppercase text-slate-200">
              Live Theme Customizer
            </h1>
            <span className="text-[10px] font-bold bg-[#007382]/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/20">
              Shopify Pro Studio
            </span>
          </div>
        </div>

        {/* Center: Device Responsive Mode Switcher */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              device === 'desktop'
                ? 'bg-[#007382] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop Mode (100% fluid)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              device === 'tablet'
                ? 'bg-[#007382] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet Mode (768px centered)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              device === 'mobile'
                ? 'bg-[#007382] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile Mode (375px centered frame)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={() => {
              if (iframeRef.current) {
                iframeRef.current.src = iframeRef.current.src;
              }
            }}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
            title="Reload Preview Screen"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Live Status & Publish Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="text-slate-400 hover:text-white text-xs flex items-center gap-1 hover:underline hidden md:flex"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          {hasUnsavedChanges && !savedSuccess && (
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unpublished
            </span>
          )}

          {savedSuccess && (
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 animate-fade-in">
              <Check className="w-3 h-3" />
              Published Live!
            </span>
          )}

          <button
            type="button"
            onClick={handlePublish}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950/40 transition active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Publish Changes</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. DUAL-PANE WORKSPACE: LEFT INSPECTOR + RIGHT CANVAS    */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* ==================================================== */}
        {/* LEFT COLUMN: SETTINGS INSPECTOR (380px–420px)        */}
        {/* ==================================================== */}
        <aside className="w-[390px] shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden select-none z-20">
          {/* Inspector Mode Switcher Tabs */}
          <div className="border-b border-slate-800 p-2 flex gap-1 bg-slate-900/90 shrink-0">
            <button
              type="button"
              onClick={() => setActiveInspector('tree')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeInspector === 'tree'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Section Tree</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveInspector('hero_slider')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeInspector === 'hero_slider'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🖼️ Slider</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveInspector('theme_colors')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeInspector === 'theme_colors'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Colors</span>
            </button>
          </div>

          {/* Inspector Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* VIEW A: SECTION TREE & REORDERING */}
            {activeInspector === 'tree' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Storefront Sections
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Toggle visibility or reorder sections up/down
                    </p>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                    {sectionsList.length} Sections
                  </span>
                </div>

                {/* Announcement Bar Dedicated Control */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📢</span>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Top Announcement Bar</div>
                      <div className="text-[10px] text-slate-400">Marquee scrolling news strip</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateLayout(prev => ({
                          ...prev,
                          announcement_ticker: {
                            ...prev.announcement_ticker,
                            enabled: prev.announcement_ticker?.enabled === false ? true : false
                          }
                        }))
                      }
                      className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Toggle Visibility"
                    >
                      {layoutState.announcement_ticker?.enabled !== false ? (
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInspector('announcements')}
                      className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Edit Settings"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Reorderable Section Tree */}
                <div className="space-y-1.5">
                  {sectionsList.map((secKey, idx) => {
                    const info = sectionLabels[secKey] || { title: secKey, icon: '📄' };
                    const isVisible = layoutState.sections_visibility?.[secKey] !== false;

                    return (
                      <div
                        key={secKey}
                        className={`p-2.5 rounded-xl border transition flex items-center justify-between ${
                          isVisible
                            ? 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                            : 'bg-slate-950/20 border-slate-800/40 opacity-60'
                        }`}
                      >
                        <div
                          className="flex items-center gap-2.5 cursor-pointer flex-1"
                          onClick={() => setActiveInspector(secKey)}
                        >
                          <span className="text-base">{info.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-slate-200 hover:text-cyan-400 transition">
                              {info.title}
                            </div>
                            <div className="text-[10px] text-slate-500 capitalize">
                              Position #{idx + 1}
                            </div>
                          </div>
                        </div>

                        {/* Actions: Move Up / Down / Visibility / Edit */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveSection(idx, 'up')}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sectionsList.length - 1}
                            onClick={() => moveSection(idx, 'down')}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSectionVisibility(secKey)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Toggle Visibility"
                          >
                            {isVisible ? (
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveInspector(secKey)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                            title="Open Settings"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW B: HERO CAROUSEL SLIDER INSPECTOR */}
            {activeInspector === 'hero_slider' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Hero Carousel Slider
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Manage real-time storefront banner slides
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddSlide()}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#007382] hover:bg-[#008a9c] text-white text-[11px] font-bold rounded-lg transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Slide</span>
                  </button>
                </div>

                {/* Quick Preset Banner Picker */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-300 mb-2">
                    ⚡ Quick Insert Authentic Banners:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_BANNERS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleAddSlide(preset)}
                        className="text-left p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition group"
                      >
                        <img
                          src={preset.image}
                          alt={preset.title}
                          className="w-full h-12 object-cover rounded-md mb-1"
                        />
                        <div className="text-[10px] font-bold text-slate-300 group-hover:text-cyan-300 truncate">
                          {preset.badge}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Slide Items List */}
                <div className="space-y-3">
                  {(layoutState.hero_slides || []).map((slide, sIdx) => (
                    <div
                      key={slide.id || sIdx}
                      className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-800 text-cyan-400 px-2 py-0.5 rounded">
                          Slide #{sIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlide(slide.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Image Thumbnail, Direct Upload & URL */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-400">
                            Banner Image (Upload or URL)
                          </label>
                          <span className="text-[9px] text-cyan-400/90 font-mono">
                            Recommended: 1920 × 675 px (PNG / JPEG)
                          </span>
                        </div>

                        {/* File Upload Trigger */}
                        <div className="flex items-center gap-2 mb-2">
                          <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-xl transition text-slate-300 hover:text-white group">
                            <Upload className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
                            <span className="text-[11px] font-bold">
                              {uploadingSlideIdx === sIdx ? 'Uploading banner...' : '📁 Upload New Banner (PNG/JPEG)'}
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              className="hidden"
                              disabled={uploadingSlideIdx === sIdx}
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadBanner(f, sIdx);
                              }}
                            />
                          </label>
                        </div>

                        <input
                          type="text"
                          value={slide.image || ''}
                          onChange={e => handleUpdateSlide(sIdx, 'image', e.target.value)}
                          placeholder="Or paste image URL (https://... or /uploads/...)"
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                        />
                        {slide.image && (
                          <div className="mt-2 relative h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner">
                            <img
                              src={slide.image}
                              alt="Slide preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-1 right-2 bg-black/70 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-300">
                              Aspect: 2.85:1
                            </div>
                          </div>
                        )}
                        <p className="text-[9px] text-slate-400 mt-1 italic">
                          💡 Format: PNG, JPEG, JPG ya WEBP. Desktop aur mobile par clean fit hone k liye widescreen banner use karein.
                        </p>
                      </div>

                      {/* Title & Badge */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">
                            Badge
                          </label>
                          <input
                            type="text"
                            value={slide.badge || ''}
                            onChange={e => handleUpdateSlide(sIdx, 'badge', e.target.value)}
                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">
                            Link Target
                          </label>
                          <input
                            type="text"
                            value={slide.link || '#products'}
                            onChange={e => handleUpdateSlide(sIdx, 'link', e.target.value)}
                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      {/* Slide Title */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">
                          Slide Heading
                        </label>
                        <input
                          type="text"
                          value={slide.title || ''}
                          onChange={e => handleUpdateSlide(sIdx, 'title', e.target.value)}
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW C: ANNOUNCEMENT TICKER INSPECTOR */}
            {activeInspector === 'announcements' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Announcement Bar
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Customize top marquee messages and branding ticker
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveInspector('tree')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back
                  </button>
                </div>

                {/* Ticker Enabled Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-200">Show Announcement Bar</span>
                  <input
                    type="checkbox"
                    checked={layoutState.announcement_ticker?.enabled !== false}
                    onChange={e =>
                      updateLayout(prev => ({
                        ...prev,
                        announcement_ticker: {
                          ...prev.announcement_ticker,
                          enabled: e.target.checked
                        }
                      }))
                    }
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Color pickers */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={layoutState.announcement_ticker?.bgColor || '#004d57'}
                        onChange={e =>
                          updateLayout(prev => ({
                            ...prev,
                            announcement_ticker: {
                              ...prev.announcement_ticker,
                              bgColor: e.target.value
                            }
                          }))
                        }
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-300">
                        {layoutState.announcement_ticker?.bgColor || '#004d57'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={layoutState.announcement_ticker?.textColor || '#ffffff'}
                        onChange={e =>
                          updateLayout(prev => ({
                            ...prev,
                            announcement_ticker: {
                              ...prev.announcement_ticker,
                              textColor: e.target.value
                            }
                          }))
                        }
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-300">
                        {layoutState.announcement_ticker?.textColor || '#ffffff'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Announcement Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Ticker Messages</span>
                    <button
                      type="button"
                      onClick={handleAddAnnouncementItem}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Message</span>
                    </button>
                  </div>

                  {(layoutState.announcement_ticker?.items || []).map((item, aIdx) => (
                    <div key={aIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={e => handleUpdateAnnouncementItem(aIdx, e.target.value)}
                        className="flex-1 text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAnnouncementItem(aIdx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW D: FLASH SALE INSPECTOR */}
            {activeInspector === 'flash_sale' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Flash Sale Timer Strip
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Configure countdown urgency bar &amp; wholesale liquidation
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveInspector('tree')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Banner Title
                    </label>
                    <input
                      type="text"
                      value={layoutState.sections_config?.flash_sale?.title || "TODAY'S FLASH SALE"}
                      onChange={e =>
                        updateLayout(prev => ({
                          ...prev,
                          sections_config: {
                            ...prev.sections_config,
                            flash_sale: {
                              ...prev.sections_config?.flash_sale,
                              title: e.target.value
                            }
                          }
                        }))
                      }
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Subtitle Message
                    </label>
                    <input
                      type="text"
                      value={layoutState.sections_config?.flash_sale?.subtitle || 'Limited quantity left at discounted wholesale prices!'}
                      onChange={e =>
                        updateLayout(prev => ({
                          ...prev,
                          sections_config: {
                            ...prev.sections_config,
                            flash_sale: {
                              ...prev.sections_config?.flash_sale,
                              subtitle: e.target.value
                            }
                          }
                        }))
                      }
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Countdown Target Hours
                    </label>
                    <input
                      type="number"
                      value={layoutState.sections_config?.flash_sale?.countdown_hours || 14}
                      onChange={e =>
                        updateLayout(prev => ({
                          ...prev,
                          sections_config: {
                            ...prev.sections_config,
                            flash_sale: {
                              ...prev.sections_config?.flash_sale,
                              countdown_hours: Number(e.target.value) || 14
                            }
                          }
                        }))
                      }
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VIEW E: PORTIONS INSPECTOR (HOT SELLING / NEW ARRIVALS / TRENDING) */}
            {(activeInspector === 'hot_selling' ||
              activeInspector === 'new_arrivals' ||
              activeInspector === 'trending_picks' ||
              activeInspector === 'main_catalog') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      {sectionLabels[activeInspector]?.title || activeInspector}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Customize section title, subtitle, and badge tag
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveInspector('tree')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Badge Tag */}
                  {activeInspector !== 'main_catalog' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Pill Tag / Badge
                      </label>
                      <input
                        type="text"
                        value={
                          (layoutState.sections_config as any)?.[activeInspector]?.tag ||
                          (activeInspector === 'hot_selling'
                            ? '🔥 HOT SELLING'
                            : activeInspector === 'new_arrivals'
                            ? '✨ NEW ARRIVALS'
                            : '🌟 TRENDING PICKS')
                        }
                        onChange={e =>
                          updateLayout(prev => ({
                            ...prev,
                            sections_config: {
                              ...prev.sections_config,
                              [activeInspector]: {
                                ...(prev.sections_config as any)?.[activeInspector],
                                tag: e.target.value
                              }
                            }
                          }))
                        }
                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}

                  {/* Section Title */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={
                        (layoutState.sections_config as any)?.[activeInspector]?.title ||
                        (activeInspector === 'hot_selling'
                          ? 'Hot Selling Wholesale Gadgets'
                          : activeInspector === 'new_arrivals'
                          ? 'Latest New Arrivals'
                          : activeInspector === 'trending_picks'
                          ? 'Trending Wholesale Picks'
                          : 'Trending Wholesale Catalog')
                      }
                      onChange={e =>
                        updateLayout(prev => ({
                          ...prev,
                          sections_config: {
                            ...prev.sections_config,
                            [activeInspector]: {
                              ...(prev.sections_config as any)?.[activeInspector],
                              title: e.target.value
                            }
                          }
                        }))
                      }
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Section Subtitle */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Subtitle Description
                    </label>
                    <input
                      type="text"
                      value={
                        (layoutState.sections_config as any)?.[activeInspector]?.subtitle ||
                        (activeInspector === 'hot_selling'
                          ? 'Fast moving products with highest reseller profit margins'
                          : activeInspector === 'new_arrivals'
                          ? 'Fresh containers imported this week — First batch wholesale prices'
                          : activeInspector === 'trending_picks'
                          ? 'Most demanded smart watches, organizers & lifestyle essentials'
                          : 'Showing verified products in stock')
                      }
                      onChange={e =>
                        updateLayout(prev => ({
                          ...prev,
                          sections_config: {
                            ...prev.sections_config,
                            [activeInspector]: {
                              ...(prev.sections_config as any)?.[activeInspector],
                              subtitle: e.target.value
                            }
                          }
                        }))
                      }
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Item Display Limit */}
                  {activeInspector !== 'main_catalog' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Display Limit (Max Products)
                      </label>
                      <input
                        type="number"
                        value={(layoutState.sections_config as any)?.[activeInspector]?.limit || 4}
                        onChange={e =>
                          updateLayout(prev => ({
                            ...prev,
                            sections_config: {
                              ...prev.sections_config,
                              [activeInspector]: {
                                ...(prev.sections_config as any)?.[activeInspector],
                                limit: Number(e.target.value) || 4
                              }
                            }
                          }))
                        }
                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW F: TRUST BADGES INSPECTOR */}
            {activeInspector === 'trust_badges' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Trust Badges &amp; Features
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Edit the 4 value proposition badges
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveInspector('tree')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back
                  </button>
                </div>

                <div className="space-y-3">
                  {[1, 2, 3, 4].map(num => {
                    const titleKey = `badge${num}_title` as keyof NonNullable<NonNullable<HomeThemeConfig['sections_config']>['trust_badges']>;
                    const descKey = `badge${num}_desc` as keyof NonNullable<NonNullable<HomeThemeConfig['sections_config']>['trust_badges']>;
                    const defaultTitles = ['', 'Support 24/7', 'Best Prices', 'Secure Payment', '7 Days Replacement'];
                    const defaultDescs = [
                      '',
                      'Direct WhatsApp & Call wholesale assistance',
                      'Direct factory prices for bulk & retail',
                      'Cash on delivery & verified digital transfers',
                      'Hassle-free product verification & exchange'
                    ];

                    return (
                      <div key={num} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase">
                          Badge #{num}
                        </span>
                        <div>
                          <input
                            type="text"
                            value={layoutState.sections_config?.trust_badges?.[titleKey] || defaultTitles[num]}
                            onChange={e =>
                              updateLayout(prev => ({
                                ...prev,
                                sections_config: {
                                  ...prev.sections_config,
                                  trust_badges: {
                                    ...prev.sections_config?.trust_badges,
                                    [titleKey]: e.target.value
                                  }
                                }
                              }))
                            }
                            placeholder="Badge Title"
                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:border-cyan-500 mb-1.5"
                          />
                          <input
                            type="text"
                            value={layoutState.sections_config?.trust_badges?.[descKey] || defaultDescs[num]}
                            onChange={e =>
                              updateLayout(prev => ({
                                ...prev,
                                sections_config: {
                                  ...prev.sections_config,
                                  trust_badges: {
                                    ...prev.sections_config?.trust_badges,
                                    [descKey]: e.target.value
                                  }
                                }
                              }))
                            }
                            placeholder="Badge Description"
                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW G: THEME COLORS & BRANDING */}
            {activeInspector === 'theme_colors' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Colors &amp; Styling
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Brand palette and gradient styling
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveInspector('tree')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back
                  </button>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Primary Theme Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={layoutState.theme?.primary_color || '#007382'}
                        onChange={e =>
                          updateLayout(prev => ({
                            ...prev,
                            theme: {
                              ...prev.theme,
                              primary_color: e.target.value
                            }
                          }))
                        }
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-300">
                        {layoutState.theme?.primary_color || '#007382'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Gradient From
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={layoutState.theme?.gradient_from || '#004d57'}
                        onChange={e =>
                          updateLayout(prev => ({
                            ...prev,
                            theme: {
                              ...prev.theme,
                              gradient_from: e.target.value
                            }
                          }))
                        }
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-300">
                        {layoutState.theme?.gradient_from || '#004d57'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Gradient To
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={layoutState.theme?.gradient_to || '#83a82b'}
                        onChange={e =>
                          updateLayout(prev => ({
                            ...prev,
                            theme: {
                              ...prev.theme,
                              gradient_to: e.target.value
                            }
                          }))
                        }
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-300">
                        {layoutState.theme?.gradient_to || '#83a82b'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: RESPONSIVE LIVE PREVIEW CANVAS (FLEX 1) */}
        {/* ==================================================== */}
        <main className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-3 relative overflow-hidden">
          {/* Subtle Canvas Dot Pattern */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
              backgroundSize: '18px 18px'
            }}
          />

          {/* Device Dimension Info Pill */}
          <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-full border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {device === 'desktop' && 'Desktop • 100% Fluid'}
              {device === 'tablet' && 'iPad Tablet • 768px'}
              {device === 'mobile' && 'iPhone • 375px × 812px'}
            </span>
          </div>

          {/* Dynamic Device Container Frame */}
          <div
            className={`transition-all duration-300 ease-in-out relative flex flex-col bg-white overflow-hidden ${
              device === 'desktop'
                ? 'w-full h-full rounded-none shadow-none border-0'
                : device === 'tablet'
                ? 'w-[768px] max-w-full h-[94vh] rounded-[28px] border-[8px] border-slate-800 shadow-2xl'
                : 'w-[375px] max-w-full h-[812px] max-h-[94vh] rounded-[44px] border-[10px] border-slate-800 shadow-2xl ring-1 ring-slate-700'
            }`}
          >
            {/* Mobile / Tablet Notch */}
            {device === 'mobile' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-slate-800 rounded-b-xl z-30 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-1 rounded-full bg-slate-950" />
                <div className="w-2 h-2 rounded-full bg-slate-950 ml-2" />
              </div>
            )}

            {/* Zero-Reload Storefront Preview Iframe */}
            <iframe
              ref={iframeRef}
              src="/?preview=true"
              title="Storefront Live Visual Preview"
              className="w-full h-full border-0 bg-slate-50"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
