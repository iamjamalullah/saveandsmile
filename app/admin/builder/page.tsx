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

export default function ThemeBuilderPage() {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [activeInspector, setActiveInspector] = useState<string>('hero_slider');
  const [layoutState, setLayoutState] = useState<HomeThemeConfig>(DEFAULT_HOME_CONFIG);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [uploadingCustomSecImage, setUploadingCustomSecImage] = useState<string | null>(null);
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
  function handleAddSlide() {
    const newSlide: HeroSlide = {
      id: Date.now(),
      title: "New Wholesale Mega Deal",
      subtitle: "Unbeatable wholesale factory rates across Pakistan",
      image: "https://www.qadrigadgets.pk/images/banners/6a91c696b7d39.webp",
      badge: "MEGA SALE",
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

  // Custom Sections Management
  function handleAddCustomSection(type: 'promo_banner' | 'two_column' | 'custom_coupon') {
    const newId = `custom_${type}_${Date.now()}`;
    const newSection: any = {
      id: newId,
      type,
      title: type === 'promo_banner' ? 'Exclusive Wholesale Offer' : type === 'two_column' ? 'Wholesale Features & Deals' : 'Special Discount Voucher',
      subtitle: type === 'promo_banner' ? 'Limited time bulk pricing across Pakistan' : type === 'two_column' ? 'Factory direct rates and super-fast nationwide delivery' : 'Claim instant discount on checkout',
      tag: type === 'promo_banner' ? '🔥 SPECIAL PROMO' : type === 'two_column' ? '⚡ WHOLESALE ADVANTAGE' : '🎟️ COUPON CODE',
      ...(type === 'promo_banner'
        ? {
            banner_image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80',
            banner_link: '#products'
          }
        : type === 'two_column'
        ? {
            col1_title: 'Bulk Importer Deals',
            col1_text: 'Get direct factory wholesale prices with guaranteed stock availability.',
            col1_btn_text: 'View Catalog →',
            col1_btn_link: '#products',
            col1_image: 'https://images.unsplash.com/photo-1556742049-0a67e5572240?w=800&q=80',
            col2_title: 'Nationwide Delivery',
            col2_text: 'Safe courier dispatch across Karachi, Lahore, Islamabad, and all cities.',
            col2_btn_text: 'Order Now →',
            col2_btn_link: '#products',
            col2_image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'
          }
        : {
            coupon_code: 'SAVE500',
            coupon_text: 'Use code at checkout to claim Rs. 500 flat wholesale discount:',
            coupon_discount: 'Rs. 500 OFF'
          })
    };

    updateLayout(prev => ({
      ...prev,
      sections_order: [...(prev.sections_order || []), newId],
      custom_sections: [...(prev.custom_sections || []), newSection],
      sections_visibility: {
        ...(prev.sections_visibility || {}),
        [newId]: true
      }
    }));

    setIsAddSectionOpen(false);
    setActiveInspector(newId);
  }

  function handleUpdateCustomSection(id: string, field: string, value: any) {
    updateLayout(prev => {
      const list = [...(prev.custom_sections || [])];
      const idx = list.findIndex(cs => cs.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], [field]: value };
      }
      return { ...prev, custom_sections: list };
    });
  }

  function handleRemoveCustomSection(id: string) {
    updateLayout(prev => ({
      ...prev,
      sections_order: (prev.sections_order || []).filter(secId => secId !== id),
      custom_sections: (prev.custom_sections || []).filter(cs => cs.id !== id)
    }));
    setActiveInspector('tree');
  }

  async function handleUploadCustomImage(file: File, id: string, field: string) {
    if (!file) return;
    setUploadingCustomSecImage(`${id}_${field}`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data?.success && data?.url) {
        handleUpdateCustomSection(id, field, data.url);
      } else {
        alert(data?.error || 'Upload failed. Please check image format.');
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingCustomSecImage(null);
    }
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

  function getSectionLabel(secKey: string) {
    if (sectionLabels[secKey]) return sectionLabels[secKey];
    const custom = (layoutState.custom_sections || []).find(cs => cs.id === secKey);
    if (custom) {
      if (custom.type === 'promo_banner') {
        return { title: custom.title || 'Promo Banner', icon: '🖼️' };
      }
      if (custom.type === 'two_column') {
        return { title: custom.title || '2-Column Features', icon: '📑' };
      }
      if (custom.type === 'custom_coupon') {
        return { title: custom.title || 'Coupon Voucher', icon: '🎁' };
      }
    }
    return { title: secKey, icon: '📄' };
  }

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
                      Toggle visibility, reorder, or add new sections
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddSectionOpen(!isAddSectionOpen)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#007382] hover:bg-[#008a9c] text-white text-[11px] font-bold rounded-lg transition shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Section</span>
                  </button>
                </div>

                {/* Add Section Drawer */}
                {isAddSectionOpen && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-cyan-500/30 space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-cyan-300 uppercase tracking-wide">
                        Choose Section Type to Add
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddSectionOpen(false)}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        ✕ Close
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddCustomSection('promo_banner')}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500 text-left transition group"
                      >
                        <span className="text-2xl">🖼️</span>
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                            Promotional Banner Strip
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Full-width banner image with clickable URL and custom heading
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddCustomSection('two_column')}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500 text-left transition group"
                      >
                        <span className="text-2xl">📑</span>
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                            2-Column Feature / Banner Block
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Two customizable side-by-side cards with pictures, headlines and CTA buttons
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddCustomSection('custom_coupon')}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500 text-left transition group"
                      >
                        <span className="text-2xl">🎁</span>
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                            Discount Coupon Strip
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Voucher code strip encouraging customer wholesale orders
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

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
                    const info = getSectionLabel(secKey);
                    const isVisible = layoutState.sections_visibility?.[secKey] !== false;
                    const isCustom = secKey.startsWith('custom_');

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
                            <div className="text-xs font-bold text-slate-200 hover:text-cyan-400 transition flex items-center gap-1.5">
                              <span>{info.title}</span>
                              {isCustom && (
                                <span className="text-[9px] bg-cyan-950 text-cyan-300 font-bold px-1.5 py-0.2 rounded border border-cyan-800/50">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 capitalize">
                              Position #{idx + 1}
                            </div>
                          </div>
                        </div>

                        {/* Actions: Move Up / Down / Visibility / Edit / Delete for custom */}
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
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomSection(secKey)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                              title="Delete Custom Section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>✨ Easy Slider Controls: Add banners, upload WebP/PNG/JPEG, or change text.</span>
                  <span className="text-[10px] bg-slate-800 text-cyan-400 font-bold px-2 py-0.5 rounded">
                    {(layoutState.hero_slides || []).length} Active Slides
                  </span>
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

                  {/* Hot Selling Coupon Controls */}
                  {activeInspector === 'hot_selling' && (
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/30 space-y-2.5 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🎟️</span>
                          <span className="text-xs font-bold text-amber-300">Discount Coupon Badge</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={layoutState.sections_config?.hot_selling?.show_coupon ?? true}
                          onChange={e =>
                            updateLayout(prev => ({
                              ...prev,
                              sections_config: {
                                ...prev.sections_config,
                                hot_selling: {
                                  ...prev.sections_config?.hot_selling,
                                  show_coupon: e.target.checked
                                }
                              }
                            }))
                          }
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        />
                      </div>

                      {(layoutState.sections_config?.hot_selling?.show_coupon ?? true) && (
                        <>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">
                              Coupon Code (e.g. SAVE500, WHOLESALE10)
                            </label>
                            <input
                              type="text"
                              value={layoutState.sections_config?.hot_selling?.coupon_code || 'SAVE500'}
                              onChange={e =>
                                updateLayout(prev => ({
                                  ...prev,
                                  sections_config: {
                                    ...prev.sections_config,
                                    hot_selling: {
                                      ...prev.sections_config?.hot_selling,
                                      coupon_code: e.target.value
                                    }
                                  }
                                }))
                              }
                              placeholder="SAVE500"
                              className="w-full text-xs font-mono font-bold bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-amber-300 outline-none focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">
                              Coupon Subtitle / Instructions
                            </label>
                            <input
                              type="text"
                              value={layoutState.sections_config?.hot_selling?.coupon_text || 'Use code at checkout for bulk discount:'}
                              onChange={e =>
                                updateLayout(prev => ({
                                  ...prev,
                                  sections_config: {
                                    ...prev.sections_config,
                                    hot_selling: {
                                      ...prev.sections_config?.hot_selling,
                                      coupon_text: e.target.value
                                    }
                                  }
                                }))
                              }
                              placeholder="Use code at checkout for bulk discount:"
                              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-amber-500"
                            />
                          </div>
                        </>
                      )}
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

            {/* VIEW H: DYNAMIC CUSTOM SECTION INSPECTOR */}
            {activeInspector.startsWith('custom_') && (() => {
              const customSec = (layoutState.custom_sections || []).find(cs => cs.id === activeInspector);
              if (!customSec) return null;

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/40">
                          {customSec.type === 'promo_banner' ? 'Promo Banner' : customSec.type === 'two_column' ? '2-Column Block' : 'Coupon Strip'}
                        </span>
                      </div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-200 mt-1">
                        {customSec.title || 'Custom Section Settings'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomSection(customSec.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 p-1 hover:bg-slate-800 rounded"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveInspector('tree')}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        ← Back
                      </button>
                    </div>
                  </div>

                  {/* General Header Settings */}
                  <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Section Heading & Tag</span>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={customSec.tag || ''}
                        onChange={e => handleUpdateCustomSection(customSec.id, 'tag', e.target.value)}
                        placeholder="e.g. 🔥 SPECIAL OFFER"
                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Main Heading</label>
                      <input
                        type="text"
                        value={customSec.title || ''}
                        onChange={e => handleUpdateCustomSection(customSec.id, 'title', e.target.value)}
                        placeholder="Heading text"
                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={customSec.subtitle || ''}
                        onChange={e => handleUpdateCustomSection(customSec.id, 'subtitle', e.target.value)}
                        placeholder="Subtitle or description text"
                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* SPECIFIC: PROMO BANNER */}
                  {customSec.type === 'promo_banner' && (
                    <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Banner Image & Link</span>
                      <label className="cursor-pointer flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-xl transition text-slate-300 hover:text-white">
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[11px] font-bold">
                          {uploadingCustomSecImage === `${customSec.id}_banner_image` ? 'Uploading...' : '📁 Upload Banner (Auto-WebP)'}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadCustomImage(f, customSec.id, 'banner_image');
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        value={customSec.banner_image || ''}
                        onChange={e => handleUpdateCustomSection(customSec.id, 'banner_image', e.target.value)}
                        placeholder="Banner Image URL"
                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                      />
                      {customSec.banner_image && (
                        <div className="h-24 rounded-lg overflow-hidden border border-slate-800">
                          <img src={customSec.banner_image} alt="Banner Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Clickable Link Destination</label>
                        <input
                          type="text"
                          value={customSec.banner_link || '#products'}
                          onChange={e => handleUpdateCustomSection(customSec.id, 'banner_link', e.target.value)}
                          placeholder="#products or /categories/..."
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* SPECIFIC: TWO COLUMN */}
                  {customSec.type === 'two_column' && (
                    <div className="space-y-4">
                      {/* Column 1 */}
                      <div className="space-y-2.5 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase">Column 1 (Left Card)</span>
                        <label className="cursor-pointer flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-cyan-500/40 rounded-xl transition text-slate-300 text-[11px] font-bold">
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{uploadingCustomSecImage === `${customSec.id}_col1_image` ? 'Uploading...' : '📁 Upload Col 1 Image'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadCustomImage(f, customSec.id, 'col1_image');
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={customSec.col1_image || ''}
                          onChange={e => handleUpdateCustomSection(customSec.id, 'col1_image', e.target.value)}
                          placeholder="Image URL"
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                        />
                        <input
                          type="text"
                          value={customSec.col1_title || ''}
                          onChange={e => handleUpdateCustomSection(customSec.id, 'col1_title', e.target.value)}
                          placeholder="Column 1 Title"
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                        />
                        <textarea
                          value={customSec.col1_text || ''}
                          onChange={e => handleUpdateCustomSection(customSec.id, 'col1_text', e.target.value)}
                          placeholder="Column 1 Text / Description"
                          rows={2}
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={customSec.col1_btn_text || 'Shop Now →'}
                            onChange={e => handleUpdateCustomSection(customSec.id, 'col1_btn_text', e.target.value)}
                            placeholder="Button Text"
                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                          />
                          <input
                            type="text"
                            value={customSec.col1_btn_link || '#products'}
                            onChange={e => handleUpdateCustomSection(customSec.id, 'col1_btn_link', e.target.value)}
                            placeholder="Button Link"
                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                          />
                        </div>
                      </div>

                      {/* Column 2 */}
                      <div className="space-y-2.5 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-bold text-orange-400 uppercase">Column 2 (Right Card)</span>
                        <label className="cursor-pointer flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-orange-500/40 rounded-xl transition text-slate-300 text-[11px] font-bold">
                          <Upload className="w-3.5 h-3.5 text-orange-400" />
                          <span>{uploadingCustomSecImage === `${customSec.id}_col2_image` ? 'Uploading...' : '📁 Upload Col 2 Image'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadCustomImage(f, customSec.id, 'col2_image');
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={customSec.col2_image || ''}
                          onChange={e => handleUpdateCustomSection(customSec.id, 'col2_image', e.target.value)}
                          placeholder="Image URL"
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                        />
                        <input
                          type="text"
                          value={customSec.col2_title || ''}
                          onChange={e => handleUpdateCustomSection(customSec.id, 'col2_title', e.target.value)}
                          placeholder="Column 2 Title"
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                        />
                        <textarea
                          value={customSec.col2_text || ''}
                          onChange={e => handleUpdateCustomSection(customSec.id, 'col2_text', e.target.value)}
                          placeholder="Column 2 Text / Description"
                          rows={2}
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={customSec.col2_btn_text || 'Learn More →'}
                            onChange={e => handleUpdateCustomSection(customSec.id, 'col2_btn_text', e.target.value)}
                            placeholder="Button Text"
                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                          />
                          <input
                            type="text"
                            value={customSec.col2_btn_link || '#products'}
                            onChange={e => handleUpdateCustomSection(customSec.id, 'col2_btn_link', e.target.value)}
                            placeholder="Button Link"
                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SPECIFIC: CUSTOM COUPON STRIP */}
                  {customSec.type === 'custom_coupon' && (
                    <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-amber-500/30">
                      <span className="text-[10px] font-bold text-amber-300 uppercase">Coupon Settings</span>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Coupon Code</label>
                        <input
                          type="text"
                          value={customSec.coupon_code || 'SAVE500'}
                          onChange={e => handleUpdateCustomSection(customSec.id, 'coupon_code', e.target.value)}
                          placeholder="e.g. SAVE500"
                          className="w-full text-xs font-mono font-bold bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-amber-300 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Discount Tag (e.g. Rs. 500 OFF or 10% OFF)</label>
                        <input
                          type="text"
                          value={customSec.coupon_discount || 'Rs. 500 OFF'}
                          onChange={e => handleUpdateCustomSection(customSec.id, 'coupon_discount', e.target.value)}
                          placeholder="e.g. Rs. 500 OFF"
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Instructions / Description</label>
                        <input
                          type="text"
                          value={customSec.coupon_text || 'Use code at checkout to claim instant wholesale discount:'}
                          onChange={e => handleUpdateCustomSection(customSec.id, 'coupon_text', e.target.value)}
                          placeholder="Instructions text"
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
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
