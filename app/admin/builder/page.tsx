'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Eye,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Smartphone,
  Monitor,
  ExternalLink,
  Sparkles,
  Layers,
  Megaphone,
  ShoppingBag,
  RefreshCw,
  X,
  AlertCircle
} from 'lucide-react';

interface HeroSlide {
  id: number | string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  badge: string;
  btn_text: string;
}

interface PromoBanner {
  id: number | string;
  title: string;
  tag: string;
  image: string;
  link: string;
}

interface SectionVisibility {
  announcement_bar: boolean;
  hero_slider: boolean;
  featured_categories: boolean;
  flash_deals: boolean;
  best_sellers: boolean;
  all_products: boolean;
  trust_badges: boolean;
  newsletter: boolean;
}

interface TrendingPicksBanner {
  enabled: boolean;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  btn_text: string;
  link: string;
}

interface HomeCustomizationConfig {
  announcement?: {
    enabled: boolean;
    text: string;
    link: string;
  };
  hero_slides: HeroSlide[];
  promo_banners?: PromoBanner[];
  sections_visibility?: SectionVisibility;
  sections_config?: {
    trending_picks_banner?: TrendingPicksBanner;
    [key: string]: any;
  };
  brand_info?: {
    site_title: string;
    tagline: string;
    helpline: string;
    whatsapp: string;
  };
}

export default function WebsiteBuilderPage() {
  const [config, setConfig] = useState<HomeCustomizationConfig>({
    announcement: {
      enabled: true,
      text: '🚚 Free Nationwide Cash on Delivery on Orders Above Rs. 3,000 | Direct Factory Wholesale',
      link: '#products'
    },
    hero_slides: [],
    promo_banners: [],
    sections_visibility: {
      announcement_bar: true,
      hero_slider: true,
      featured_categories: true,
      flash_deals: true,
      best_sellers: true,
      all_products: true,
      trust_badges: true,
      newsletter: true
    },
    sections_config: {
      trending_picks_banner: {
        enabled: true,
        title: "Save & Smile Wholesale Megastore Deals",
        subtitle: "Direct Factory Wholesale Rates in Pakistan — Guaranteed Margin for Resellers",
        badge: "🔥 EXCLUSIVE RESELLER OFFER",
        image: "https://www.qadrigadgets.pk/images/banners/6a7af65669503.webp",
        btn_text: "Explore Trending Deals",
        link: "#products"
      }
    },
    brand_info: {
      site_title: 'Save & Smile',
      tagline: 'Pakistan\'s Premier Wholesale Portal',
      helpline: '0316-2323616',
      whatsapp: '923162323616'
    }
  });

  const [activeTab, setActiveTab] = useState<'hero' | 'trending_banner' | 'sections' | 'announcement' | 'branding'>('hero');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/home-customization');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(prev => ({
          ...prev,
          ...data.config,
          sections_visibility: {
            ...prev.sections_visibility,
            ...(data.config.sections_visibility || {})
          },
          sections_config: {
            ...prev.sections_config,
            ...(data.config.sections_config || {}),
            trending_picks_banner: {
              ...prev.sections_config?.trending_picks_banner,
              ...(data.config.sections_config?.trending_picks_banner || {})
            }
          },
          announcement: {
            ...prev.announcement,
            ...(data.config.announcement || {})
          },
          brand_info: {
            ...prev.brand_info,
            ...(data.config.brand_info || {})
          }
        }));
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to load home configuration: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveAndPublish = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/home-customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setNotice({
          type: 'success',
          message: 'Website published successfully! Storefront cache revalidated.'
        });

        // Broadcast to live storefront tabs
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('save_and_smile_home_config', JSON.stringify(data.config || config));
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new CustomEvent('qadri_hero_slides_updated'));
            if ('BroadcastChannel' in window) {
              const bc = new BroadcastChannel('qadri_store_sync');
              bc.postMessage({ type: 'theme_updated', config: data.config || config });
              bc.close();
            }
          }
        } catch (syncErr) {}
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to publish changes' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleAddHeroSlide = () => {
    const newSlide: HeroSlide = {
      id: Date.now(),
      title: 'New Wholesale Season Arrival',
      subtitle: 'Exclusive discounts on household essentials & kitchen organizers',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      link: '#products',
      badge: 'NEW DEAL',
      btn_text: 'Shop Now'
    };
    setConfig(prev => ({
      ...prev,
      hero_slides: [...prev.hero_slides, newSlide]
    }));
  };

  const handleRemoveSlide = (index: number) => {
    setConfig(prev => ({
      ...prev,
      hero_slides: prev.hero_slides.filter((_, i) => i !== index)
    }));
  };

  const handleSlideChange = (index: number, field: keyof HeroSlide, value: string) => {
    setConfig(prev => {
      const updated = [...prev.hero_slides];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, hero_slides: updated };
    });
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    setConfig(prev => {
      const slides = [...prev.hero_slides];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= slides.length) return prev;
      const temp = slides[index];
      slides[index] = slides[targetIdx];
      slides[targetIdx] = temp;
      return { ...prev, hero_slides: slides };
    });
  };

  const toggleSection = (key: keyof SectionVisibility) => {
    setConfig(prev => ({
      ...prev,
      sections_visibility: {
        ...prev.sections_visibility!,
        [key]: !prev.sections_visibility![key]
      }
    }));
  };

  const handleUploadSlideImage = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleSlideChange(index, 'image', dataUrl);
        setNotice({ type: 'success', message: `Slide #${index + 1} picture updated! Click "Save & Publish" to sync.` });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadTrendingBannerImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setConfig(prev => ({
          ...prev,
          sections_config: {
            ...prev.sections_config,
            trending_picks_banner: {
              ...(prev.sections_config?.trending_picks_banner || {
                enabled: true,
                title: "Save & Smile Wholesale Megastore Deals",
                subtitle: "Direct Factory Wholesale Rates in Pakistan — Guaranteed Margin for Resellers",
                badge: "🔥 EXCLUSIVE RESELLER OFFER",
                image: "",
                btn_text: "Explore Trending Deals",
                link: "#products"
              }),
              image: dataUrl
            }
          }
        }));
        setNotice({ type: 'success', message: 'Trending picks banner picture updated! Click "Save & Publish" to sync.' });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sliders className="w-7 h-7 text-emerald-600" />
            Website Builder & Homepage Editor
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Customize hero banners, announcement bar, section visibility, and branding across the live storefront.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <Eye className="w-4 h-4 text-gray-500" />
            View Live Store
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>
          <button
            onClick={handleSaveAndPublish}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Publishing...' : 'Save & Publish Live'}
          </button>
        </div>
      </div>

      {/* 🚀 Elementor Live Studio Launch Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 shadow-xl border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-black uppercase tracking-wider">
            <span>✨</span>
            <span>Elementor-Style Visual Studio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Live Split-Screen Theme Customizer</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Naye full-screen tab mein kholta hai! Ek taraf saray live controls (hero banners, PNG/JPEG images, trending banner, sections reordering) aur doosri taraf realtime live storefront preview — jaise Elementor ya Shopify Customizer.
          </p>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
          <a
            href="/live-editor"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm rounded-xl shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition transform active:scale-95"
          >
            <span>🚀 Launch Live Studio (Opens New Tab)</span>
            <ExternalLink className="w-4 h-4" />
          </a>
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

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'hero'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Hero Sliders ({config.hero_slides.length})
        </button>
        <button
          onClick={() => setActiveTab('trending_banner')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'trending_banner'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Trending Banner (After Trending Picks)
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'sections'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Section Visibility & Ordering
        </button>
        <button
          onClick={() => setActiveTab('announcement')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'announcement'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Announcement Bar
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'branding'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Branding & Contact Info
        </button>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm">Loading storefront settings...</p>
        </div>
      ) : activeTab === 'hero' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-gray-900">Hero Carousel Slides</h3>
              <p className="text-xs text-gray-500">Configure promotional sliders shown at the top of the homepage.</p>
            </div>
            <button
              onClick={handleAddHeroSlide}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Slide
            </button>
          </div>

          <div className="space-y-4">
            {config.hero_slides.map((slide, idx) => (
              <div
                key={slide.id || idx}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4 relative"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-gray-900 text-sm">Slide #{idx + 1}: {slide.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSlide(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded"
                      title="Move Up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveSlide(idx, 'down')}
                      disabled={idx === config.hero_slides.length - 1}
                      className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded"
                      title="Move Down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveSlide(idx)}
                      className="p-1.5 text-red-400 hover:text-red-600 rounded ml-2"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 uppercase mb-1">Headline Title</label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={e => handleSlideChange(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 uppercase mb-1">Badge / Tagline</label>
                    <input
                      type="text"
                      value={slide.badge}
                      onChange={e => handleSlideChange(idx, 'badge', e.target.value)}
                      placeholder="e.g. MEGA SALE, HOT SUMMER"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-gray-700 uppercase mb-1">Subtitle / Subtext</label>
                    <input
                      type="text"
                      value={slide.subtitle}
                      onChange={e => handleSlideChange(idx, 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-gray-700 uppercase">Banner Picture (PNG, JPEG, WebP)</label>
                      <label className="cursor-pointer text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          className="hidden"
                          onChange={e => handleUploadSlideImage(idx, e)}
                        />
                        <span>📷 Upload PNG / JPG</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={slide.image}
                      onChange={e => handleSlideChange(idx, 'image', e.target.value)}
                      placeholder="https://... or upload PNG/JPG picture"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-gray-700 uppercase mb-1">Button Text</label>
                      <input
                        type="text"
                        value={slide.btn_text}
                        onChange={e => handleSlideChange(idx, 'btn_text', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 uppercase mb-1">Target Link</label>
                      <input
                        type="text"
                        value={slide.link}
                        onChange={e => handleSlideChange(idx, 'link', e.target.value)}
                        placeholder="#products or /product-detail?id=..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Preview Box */}
                {slide.image && (
                  <div className="mt-3 relative h-28 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 p-3 flex flex-col justify-end text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 px-2 py-0.5 rounded w-max mb-1">
                        {slide.badge}
                      </span>
                      <span className="font-bold text-sm truncate">{slide.title}</span>
                      <span className="text-xs text-gray-200 truncate">{slide.subtitle}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'trending_banner' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>🎯 Promotional Banner (After Trending Picks)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800">Portion 4B</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Trending Picks section ke baad aane wala promo banner customize karein. PNG aur JPEG picture upload karein ya direct URL dein.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.sections_config?.trending_picks_banner?.enabled !== false}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      sections_config: {
                        ...prev.sections_config,
                        trending_picks_banner: {
                          ...(prev.sections_config?.trending_picks_banner || {
                            enabled: true,
                            title: 'Save & Smile Wholesale Megastore Deals',
                            subtitle: 'Direct Factory Wholesale Rates in Pakistan — Guaranteed Margin for Resellers',
                            badge: '🔥 EXCLUSIVE RESELLER OFFER',
                            image: 'https://www.qadrigadgets.pk/images/banners/6a7af65669503.webp',
                            btn_text: 'Explore Trending Deals',
                            link: '#products'
                          }),
                          enabled: e.target.checked
                        }
                      }
                    }))
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Enable on Storefront</span>
              </label>
            </div>
          </div>

          {/* Live Card Preview */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-300 shadow-md bg-slate-900 text-white min-h-[200px] flex items-center p-6 sm:p-10 group">
            {config.sections_config?.trending_picks_banner?.image && (
              <img
                src={config.sections_config.trending_picks_banner.image}
                alt={config.sections_config.trending_picks_banner.title || 'Banner'}
                className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-lg space-y-2">
              {config.sections_config?.trending_picks_banner?.badge && (
                <span className="inline-block bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
                  {config.sections_config.trending_picks_banner.badge}
                </span>
              )}
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {config.sections_config?.trending_picks_banner?.title || 'Save & Smile Wholesale Megastore Deals'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 line-clamp-2">
                {config.sections_config?.trending_picks_banner?.subtitle || 'Direct Factory Wholesale Rates in Pakistan — Guaranteed Margin for Resellers'}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 bg-[#008060] text-white font-black text-xs px-4 py-2 rounded-xl shadow">
                  <span>{config.sections_config?.trending_picks_banner?.btn_text || 'Explore Trending Deals'}</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-gray-700 uppercase">Banner Picture (PNG, JPEG, WebP) *</label>
                <label className="cursor-pointer text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 text-[11px] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={handleUploadTrendingBannerImage}
                  />
                  <span>📷 Upload PNG / JPEG Picture from Computer</span>
                </label>
              </div>
              <input
                type="text"
                value={config.sections_config?.trending_picks_banner?.image || ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    sections_config: {
                      ...prev.sections_config,
                      trending_picks_banner: {
                        ...(prev.sections_config?.trending_picks_banner || {
                          enabled: true,
                          title: '',
                          subtitle: '',
                          badge: '',
                          image: '',
                          btn_text: 'Explore Deals',
                          link: '#products'
                        }),
                        image: e.target.value
                      }
                    }
                  }))
                }
                placeholder="https://... or upload PNG/JPEG picture above"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Recommended aspect ratio: <strong>1920 &times; 600 px</strong> or <strong>1200 &times; 400 px</strong>. Supports PNG, JPG, JPEG, and WebP.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Banner Heading Title</label>
              <input
                type="text"
                value={config.sections_config?.trending_picks_banner?.title || ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    sections_config: {
                      ...prev.sections_config,
                      trending_picks_banner: {
                        ...(prev.sections_config?.trending_picks_banner || {
                          enabled: true,
                          title: '',
                          subtitle: '',
                          badge: '',
                          image: '',
                          btn_text: 'Explore Deals',
                          link: '#products'
                        }),
                        title: e.target.value
                      }
                    }
                  }))
                }
                placeholder="e.g. Save & Smile Wholesale Megastore Deals"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Badge Tag</label>
              <input
                type="text"
                value={config.sections_config?.trending_picks_banner?.badge || ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    sections_config: {
                      ...prev.sections_config,
                      trending_picks_banner: {
                        ...(prev.sections_config?.trending_picks_banner || {
                          enabled: true,
                          title: '',
                          subtitle: '',
                          badge: '',
                          image: '',
                          btn_text: 'Explore Deals',
                          link: '#products'
                        }),
                        badge: e.target.value
                      }
                    }
                  }))
                }
                placeholder="e.g. 🔥 EXCLUSIVE RESELLER OFFER"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-gray-700 uppercase mb-1">Subtitle / Promotion Description</label>
              <input
                type="text"
                value={config.sections_config?.trending_picks_banner?.subtitle || ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    sections_config: {
                      ...prev.sections_config,
                      trending_picks_banner: {
                        ...(prev.sections_config?.trending_picks_banner || {
                          enabled: true,
                          title: '',
                          subtitle: '',
                          badge: '',
                          image: '',
                          btn_text: 'Explore Deals',
                          link: '#products'
                        }),
                        subtitle: e.target.value
                      }
                    }
                  }))
                }
                placeholder="e.g. Direct Factory Wholesale Rates in Pakistan — Guaranteed Margin for Resellers"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Button Text</label>
              <input
                type="text"
                value={config.sections_config?.trending_picks_banner?.btn_text || ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    sections_config: {
                      ...prev.sections_config,
                      trending_picks_banner: {
                        ...(prev.sections_config?.trending_picks_banner || {
                          enabled: true,
                          title: '',
                          subtitle: '',
                          badge: '',
                          image: '',
                          btn_text: 'Explore Deals',
                          link: '#products'
                        }),
                        btn_text: e.target.value
                      }
                    }
                  }))
                }
                placeholder="e.g. Explore Trending Deals"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Target Link</label>
              <input
                type="text"
                value={config.sections_config?.trending_picks_banner?.link || ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    sections_config: {
                      ...prev.sections_config,
                      trending_picks_banner: {
                        ...(prev.sections_config?.trending_picks_banner || {
                          enabled: true,
                          title: '',
                          subtitle: '',
                          badge: '',
                          image: '',
                          btn_text: 'Explore Deals',
                          link: '#products'
                        }),
                        link: e.target.value
                      }
                    }
                  }))
                }
                placeholder="#products or /category/kitchen"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveAndPublish}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Publishing...' : 'Save & Publish Banner to Store'}
            </button>
          </div>
        </div>
      ) : activeTab === 'sections' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Storefront Section Control</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Toggle homepage sections on or off to adjust layout for seasonal promotions or campaigns.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {[
              { key: 'announcement_bar', label: 'Top Announcement Bar', desc: 'Display nationwide free delivery banner' },
              { key: 'hero_slider', label: 'Main Hero Sliders Carousel', desc: 'Hero banners with call-to-actions' },
              { key: 'featured_categories', label: 'Featured Categories Grid', desc: 'Top product category quick links' },
              { key: 'flash_deals', label: 'Flash Deals / Wholesale Special', desc: 'High-discount limited quantity deals' },
              { key: 'best_sellers', label: 'Best Selling Items Carousel', desc: 'Top converting wholesale products' },
              { key: 'all_products', label: 'Full Product Catalog & Filters', desc: 'Main searchable product grid with sort and category tabs' },
              { key: 'trust_badges', label: 'Nationwide Trust Badges', desc: 'COD nationwide, 7-day checking warranty, factory direct' },
              { key: 'newsletter', label: 'Wholesale Newsletter / WhatsApp Sign-up', desc: 'Collect buyer contact numbers for stock updates' }
            ].map(sec => {
              const isChecked = config.sections_visibility?.[sec.key as keyof SectionVisibility] ?? true;
              return (
                <div key={sec.key} className="py-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{sec.label}</h4>
                    <p className="text-xs text-gray-500">{sec.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleSection(sec.key as keyof SectionVisibility)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isChecked ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'announcement' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Announcement Bar Settings</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Highlight free shipping notices, holidays, or emergency updates at the very top of every page.
            </p>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <span className="text-sm font-semibold text-gray-900">Enable Announcement Bar</span>
              <p className="text-xs text-gray-500">Show ticker bar across the storefront</p>
            </div>
            <button
              onClick={() =>
                setConfig(prev => ({
                  ...prev,
                  announcement: {
                    ...prev.announcement!,
                    enabled: !prev.announcement?.enabled
                  }
                }))
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                config.announcement?.enabled ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  config.announcement?.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Announcement Text</label>
              <input
                type="text"
                value={config.announcement?.text || ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    announcement: {
                      ...prev.announcement!,
                      text: e.target.value
                    }
                  }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Click Action Link</label>
              <input
                type="text"
                value={config.announcement?.link || ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    announcement: {
                      ...prev.announcement!,
                      link: e.target.value
                    }
                  }))
                }
                placeholder="#products, /shop.html, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Live Ticker Preview */}
            <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Live Preview:</span>
              <div className="bg-emerald-700 text-white text-xs py-2 px-4 rounded-lg text-center font-medium shadow-sm">
                {config.announcement?.text}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Branding & Contact Info Tab */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Storefront Branding & Contact</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Control website titles, helpline numbers, and WhatsApp links rendered in the header and footer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Store Name</label>
              <input
                type="text"
                value={config.brand_info?.site_title || ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    brand_info: { ...prev.brand_info!, site_title: e.target.value }
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Tagline</label>
              <input
                type="text"
                value={config.brand_info?.tagline || ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    brand_info: { ...prev.brand_info!, tagline: e.target.value }
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Customer Helpline Phone</label>
              <input
                type="text"
                value={config.brand_info?.helpline || ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    brand_info: { ...prev.brand_info!, helpline: e.target.value }
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">WhatsApp Direct Number</label>
              <input
                type="text"
                value={config.brand_info?.whatsapp || ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    brand_info: { ...prev.brand_info!, whatsapp: e.target.value }
                  }))
                }
                placeholder="e.g. 923162323616"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
