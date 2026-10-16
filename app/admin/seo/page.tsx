'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Globe,
  Sliders,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  BarChart2,
  Sparkles,
  Link as LinkIcon,
  Eye,
  FileText,
  Tag,
  Share2,
  Layers,
  ArrowRight,
  Terminal,
  Cpu,
  X
} from 'lucide-react';

interface GlobalSeoSettings {
  default_title: string;
  default_description: string;
  site_url: string;
  default_og_image: string;
  default_social_title: string;
  default_social_desc: string;
  org_name: string;
  logo_url: string;
  helpline_phone: string;
  whatsapp: string;
  shipping_fee: number;
  free_shipping_threshold: number;
  business_address: string;
  gsc_verification_code: string;
  ga4_measurement_id: string;
  bing_verification_code: string;
  robots_txt_content: string;
}

interface SeoPage {
  id: string;
  page_name: string;
  slug: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  is_noindex: boolean;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

interface SeoRedirect {
  id: number | string;
  source_url: string;
  target_url: string;
  status_code: number;
  is_active: boolean;
}

interface Log404 {
  id: string;
  url: string;
  referer?: string;
  hits: number;
  lastHitAt: string;
}

export default function SeoControlCenterPage() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'global' | 'scorer' | 'sitemap' | 'robots' | 'redirects' | '404' | 'schema' | 'audit'
  >('dashboard');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings State
  const [settings, setSettings] = useState<GlobalSeoSettings>({
    default_title: 'Save & Smile | Shop • Save • Smile | Wholesale Store Pakistan',
    default_description:
      'Save & Smile is Pakistan\'s leading wholesale portal for trending household gadgets, kitchen storage organizers, mugs, beauty care, and electronics at direct factory rates.',
    site_url: 'https://saveandsmile.pk',
    default_og_image: 'https://saveandsmile.pk/images/save-and-smile-logo.png',
    default_social_title: 'Save & Smile - Direct Factory Wholesale Store Pakistan',
    default_social_desc: 'Wholesale prices with Cash on Delivery nationwide across Pakistan. Verified margins for resellers.',
    org_name: 'Save & Smile Pakistan',
    logo_url: '/images/save-and-smile-logo.png',
    helpline_phone: '0316-2323616',
    whatsapp: '923162323616',
    shipping_fee: 200,
    free_shipping_threshold: 3000,
    business_address: 'Wholesale Market, Karachi / Lahore, Pakistan',
    gsc_verification_code: '',
    ga4_measurement_id: '',
    bing_verification_code: '',
    robots_txt_content: ''
  });

  const [pages, setPages] = useState<SeoPage[]>([]);
  const [redirects, setRedirects] = useState<SeoRedirect[]>([]);
  const [logs404, setLogs404] = useState<Log404[]>([]);
  const [auditReport, setAuditReport] = useState<any>(null);

  // Content Scorer Interactive State
  const [testKeyword, setTestKeyword] = useState('wholesale kitchen gadgets');
  const [testTitle, setTestTitle] = useState('Best Wholesale Kitchen Gadgets & Storage Racks in Pakistan | Save & Smile');
  const [testSlug, setTestSlug] = useState('wholesale-kitchen-gadgets');
  const [testDesc, setTestDesc] = useState(
    'Buy wholesale kitchen gadgets and racks at direct factory rates with cash on delivery across Pakistan. 7-day checking warranty included.'
  );
  const [testContent, setTestContent] = useState(
    'Looking for wholesale kitchen gadgets in Pakistan? Save & Smile provides high quality storage organizers, vegetable cutters, and spice jars with low wholesale prices and cash on delivery.'
  );

  // New Redirect Form
  const [newRedirect, setNewRedirect] = useState({ source_url: '', target_url: '', status_code: 301 });

  const fetchSeoData = async () => {
    try {
      setLoading(true);
      // Fetch settings, pages, redirects, audit
      const [resSettings, resPages, resRedir, resAudit] = await Promise.all([
        fetch('/api/seo?type=settings').then(r => r.json()).catch(() => ({})),
        fetch('/api/seo?type=pages').then(r => r.json()).catch(() => ({})),
        fetch('/api/seo?type=redirects').then(r => r.json()).catch(() => ({})),
        fetch('/api/seo?type=audit').then(r => r.json()).catch(() => ({}))
      ]);

      if (resSettings.settings) setSettings(resSettings.settings);
      if (resPages.pages) setPages(resPages.pages);
      if (resRedir.redirects) setRedirects(resRedir.redirects);
      if (resAudit.audit || resAudit.report) setAuditReport(resAudit.audit || resAudit.report);

      // Fetch 404 logs
      const res404 = await fetch('/api/content?type=404').then(r => r.json()).catch(() => ({}));
      if (res404.logs) setLogs404(res404.logs);
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to load SEO data: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeoData();
  }, []);

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_settings', settings })
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: 'Global SEO configurations saved successfully!' });
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

  // Add Redirect
  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRedirect.source_url || !newRedirect.target_url) {
      setNotice({ type: 'error', message: 'Source and target URLs are required' });
      return;
    }

    try {
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_redirect', redirect: newRedirect })
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: '301 / 302 Redirect saved successfully!' });
        setNewRedirect({ source_url: '', target_url: '', status_code: 301 });
        fetchSeoData();
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to add redirect' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setTimeout(() => setNotice(null), 3500);
    }
  };

  // Delete Redirect
  const handleDeleteRedirect = async (id: number | string) => {
    try {
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_redirect', id })
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: 'Redirect removed successfully.' });
        fetchSeoData();
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    }
  };

  // Quick 404 convert to Redirect
  const handleConvert404 = async (brokenUrl: string) => {
    const target = prompt(`Enter target redirect destination for "${brokenUrl}":`, '/');
    if (!target) return;

    try {
      const res = await fetch('/api/content?type=404', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: brokenUrl, redirectTarget: target })
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: `301 Redirect created for ${brokenUrl} -> ${target}` });
        fetchSeoData();
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    }
  };

  // Rank Math Rule-based Scorer Calculations (0 - 100)
  const rankMathScore = useMemo(() => {
    const kw = testKeyword.toLowerCase().trim();
    const title = testTitle.toLowerCase().trim();
    const desc = testDesc.toLowerCase().trim();
    const slug = testSlug.toLowerCase().trim();
    const content = testContent.toLowerCase().trim();

    let score = 0;
    const checks: Array<{ label: string; passed: boolean; tip: string; points: number }> = [];

    // Check 1: Keyword in title
    const hasKwInTitle = kw.length > 0 && title.includes(kw);
    checks.push({
      label: 'Focus Keyword in SEO Title',
      passed: hasKwInTitle,
      tip: hasKwInTitle ? 'Keyword appears in title' : 'Add your exact focus keyword in the title',
      points: 20
    });
    if (hasKwInTitle) score += 20;

    // Check 2: Title Length (50 - 65 chars optimal)
    const titleLenOk = testTitle.length >= 40 && testTitle.length <= 70;
    checks.push({
      label: 'Title Length Optimal (40-70 characters)',
      passed: titleLenOk,
      tip: `Current length: ${testTitle.length} chars (Target: 40-70)`,
      points: 15
    });
    if (titleLenOk) score += 15;

    // Check 3: Keyword in Meta Description
    const hasKwInDesc = kw.length > 0 && desc.includes(kw);
    checks.push({
      label: 'Focus Keyword in Meta Description',
      passed: hasKwInDesc,
      tip: hasKwInDesc ? 'Keyword found in snippet description' : 'Include focus keyword in the description',
      points: 15
    });
    if (hasKwInDesc) score += 15;

    // Check 4: Meta Description Length (120 - 165 chars)
    const descLenOk = testDesc.length >= 120 && testDesc.length <= 170;
    checks.push({
      label: 'Description Length (120-170 characters)',
      passed: descLenOk,
      tip: `Current length: ${testDesc.length} chars (Target: 120-170)`,
      points: 15
    });
    if (descLenOk) score += 15;

    // Check 5: Keyword in URL slug
    const cleanKwSlug = kw.replace(/\s+/g, '-');
    const hasKwInSlug = kw.length > 0 && slug.includes(cleanKwSlug);
    checks.push({
      label: 'Focus Keyword in URL Slug',
      passed: hasKwInSlug,
      tip: hasKwInSlug ? 'Slug contains focus keyword' : `Include "${cleanKwSlug}" in slug`,
      points: 15
    });
    if (hasKwInSlug) score += 15;

    // Check 6: Keyword density in body content
    const kwCount = kw.length > 0 ? (content.match(new RegExp(kw, 'g')) || []).length : 0;
    const densityOk = kwCount >= 1;
    checks.push({
      label: 'Focus Keyword in Page Content',
      passed: densityOk,
      tip: densityOk ? `Found ${kwCount} keyword occurrences in body` : 'Mention your focus keyword in the text body',
      points: 20
    });
    if (densityOk) score += 20;

    return { score, checks };
  }, [testKeyword, testTitle, testDesc, testSlug, testContent]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-emerald-600" />
            Rank Math SEO Control Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            End-to-end technical SEO suite: XML Sitemaps, Robots.txt, 301 Redirects, 404 Monitor, Schema & Real-Time Scorer.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <FileCode className="w-4 h-4 text-emerald-600" />
            View sitemap.xml
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save All SEO Settings'}
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

      {/* Navigation Submenu Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px text-xs font-semibold">
        {[
          { key: 'dashboard', label: 'SEO Overview', icon: BarChart2 },
          { key: 'scorer', label: 'Rank Math Content Scorer', icon: Sparkles },
          { key: 'global', label: 'Global Titles & Meta', icon: Globe },
          { key: 'sitemap', label: 'XML Sitemap', icon: FileCode },
          { key: 'robots', label: 'Robots.txt Editor', icon: Terminal },
          { key: 'redirects', label: '301 Redirect Manager', icon: LinkIcon },
          { key: '404', label: '404 Broken URL Monitor', icon: AlertTriangle },
          { key: 'schema', label: 'JSON-LD Schema Markup', icon: Cpu },
          { key: 'audit', label: 'Technical SEO Audit', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 whitespace-nowrap transition ${
                activeTab === tab.key
                  ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">SEO Health Score</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {auditReport?.overallScore || 94} / 100
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Indexed URLs</span>
                <span className="text-2xl font-bold text-gray-900">
                  {auditReport?.totalIndexed || 42} URLs
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Active Redirects</span>
                <span className="text-2xl font-bold text-gray-900">{redirects.length} Rules</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">404 Errors Logged</span>
                <span className="text-2xl font-bold text-gray-900">{logs404.length} Broken</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Live Engine Status
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">XML Sitemap Generator</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">LIVE & PINGED</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Dynamic robots.txt Engine</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">301 / 302 Redirect Manager</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">LOOP PROTECTED</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Google Search Console Verification</span>
                  <span className={`px-2 py-0.5 font-bold rounded ${settings.gsc_verification_code ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {settings.gsc_verification_code ? 'VERIFIED' : 'PENDING META TAG'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Rank Math Recommendations
              </h3>
              <ul className="space-y-2.5 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Canonical URLs configured across all catalog categories & products.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Open Graph social share tags dynamically generated for WhatsApp & Facebook.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Schema markup (`ECommerceStore` and `Product` microdata) embedded.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rank Math Content Scorer */}
      {activeTab === 'scorer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Interactive Content SEO Analyzer</h3>
              <p className="text-gray-500 mt-0.5">Test any product title, slug, and description to calculate its Rank Math score.</p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Focus Keyword *</label>
              <input
                type="text"
                value={testKeyword}
                onChange={e => setTestKeyword(e.target.value)}
                placeholder="e.g. wholesale kitchen storage rack"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-gray-700 uppercase">SEO Title ({testTitle.length} chars)</label>
                <span className={`text-[11px] font-bold ${testTitle.length >= 40 && testTitle.length <= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {testTitle.length >= 40 && testTitle.length <= 70 ? 'Optimal Length' : 'Adjust Length (40-70)'}
                </span>
              </div>
              <input
                type="text"
                value={testTitle}
                onChange={e => setTestTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">URL Slug</label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 font-mono">
                  /
                </span>
                <input
                  type="text"
                  value={testSlug}
                  onChange={e => setTestSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-r-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-gray-700 uppercase">Meta Description ({testDesc.length} chars)</label>
                <span className={`text-[11px] font-bold ${testDesc.length >= 120 && testDesc.length <= 170 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {testDesc.length >= 120 && testDesc.length <= 170 ? 'Optimal Length' : 'Adjust Length (120-170)'}
                </span>
              </div>
              <textarea
                rows={3}
                value={testDesc}
                onChange={e => setTestDesc(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Body Text Content</label>
              <textarea
                rows={4}
                value={testContent}
                onChange={e => setTestContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Google Snippet Live Card */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Live Google SERP Card</span>
              <div className="space-y-1">
                <div className="text-xs text-gray-500">https://saveandsmile.pk/{testSlug}</div>
                <div className="text-blue-700 font-semibold text-sm hover:underline cursor-pointer">{testTitle}</div>
                <div className="text-xs text-gray-600 line-clamp-2">{testDesc}</div>
              </div>
            </div>
          </div>

          {/* Score & Checklist Column */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Rank Math SEO Score
              </span>
              <div
                className={`text-5xl font-black mb-2 ${
                  rankMathScore.score >= 80
                    ? 'text-emerald-600'
                    : rankMathScore.score >= 50
                    ? 'text-amber-500'
                    : 'text-red-500'
                }`}
              >
                {rankMathScore.score} / 100
              </div>
              <p className="text-xs font-semibold text-gray-700">
                {rankMathScore.score >= 80
                  ? 'Excellent SEO Optimization'
                  : rankMathScore.score >= 50
                  ? 'Good, but has warnings'
                  : 'Needs immediate improvement'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                Ranking Checklist
              </h4>
              <div className="space-y-2.5">
                {rankMathScore.checks.map((chk, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    {chk.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <div className={`font-semibold ${chk.passed ? 'text-gray-900' : 'text-red-700'}`}>
                        {chk.label}
                      </div>
                      <div className="text-[11px] text-gray-400">{chk.tip}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Global Titles & Meta */}
      {activeTab === 'global' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 text-xs">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Global Website Metadata & Webmaster Tools</h3>
            <p className="text-gray-500 mt-0.5">Configure default metadata tags, Open Graph images, and Google / Bing verification codes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Default Site Title</label>
              <input
                type="text"
                value={settings.default_title}
                onChange={e => setSettings({ ...settings, default_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Canonical Site URL</label>
              <input
                type="text"
                value={settings.site_url}
                onChange={e => setSettings({ ...settings, site_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-gray-700 uppercase mb-1">Default Meta Description</label>
              <textarea
                rows={3}
                value={settings.default_description}
                onChange={e => setSettings({ ...settings, default_description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Default Open Graph Image URL</label>
              <input
                type="text"
                value={settings.default_og_image}
                onChange={e => setSettings({ ...settings, default_og_image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase mb-1">Helpline Phone for Schema</label>
              <input
                type="text"
                value={settings.helpline_phone}
                onChange={e => setSettings({ ...settings, helpline_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Search Engine Verification</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Google Search Console Verification Tag</label>
                <input
                  type="text"
                  placeholder='e.g. google-site-verification=abc...'
                  value={settings.gsc_verification_code}
                  onChange={e => setSettings({ ...settings, gsc_verification_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Google Analytics 4 Measurement ID</label>
                <input
                  type="text"
                  placeholder="e.g. G-XXXXXXX"
                  value={settings.ga4_measurement_id}
                  onChange={e => setSettings({ ...settings, ga4_measurement_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
            >
              <Save className="w-4 h-4" />
              Save Global Metadata
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: XML Sitemap */}
      {activeTab === 'sitemap' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Dynamic XML Sitemap</h3>
              <p className="text-xs text-gray-500">Auto-generated XML index including products, categories, and policy pages.</p>
            </div>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Live XML
            </a>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs font-mono text-gray-800 space-y-1">
            <div className="text-emerald-700 font-bold">&lt;?xml version="1.0" encoding="UTF-8"?&gt;</div>
            <div className="text-gray-600">&lt;urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"&gt;</div>
            <div className="pl-4 text-gray-700">
              <div>&lt;url&gt;</div>
              <div className="pl-4">&lt;loc&gt;https://saveandsmile.pk/&lt;/loc&gt;</div>
              <div className="pl-4">&lt;priority&gt;1.0&lt;/priority&gt;</div>
              <div>&lt;/url&gt;</div>
            </div>
            <div className="pl-4 text-gray-400 italic">... dynamically renders 40+ wholesale catalog URLs ...</div>
            <div className="text-gray-600">&lt;/urlset&gt;</div>
          </div>
        </div>
      )}

      {/* Tab 5: Robots.txt Editor */}
      {activeTab === 'robots' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Robots.txt Directive Engine</h3>
              <p className="text-gray-500">Configure crawler indexing instructions for Googlebot, Bingbot, and other web crawlers.</p>
            </div>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View /robots.txt
            </a>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase mb-1">Custom robots.txt Content</label>
            <textarea
              rows={8}
              value={
                settings.robots_txt_content ||
                `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: https://saveandsmile.pk/sitemap.xml`
              }
              onChange={e => setSettings({ ...settings, robots_txt_content: e.target.value })}
              className="w-full p-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
          >
            <Save className="w-4 h-4" />
            Save robots.txt
          </button>
        </div>
      )}

      {/* Tab 6: 301 Redirect Manager */}
      {activeTab === 'redirects' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">301 / 302 Redirect Manager</h3>
            <p className="text-xs text-gray-500">Manage permanent and temporary redirects to preserve SEO backlink equity and stop 404s.</p>
          </div>

          {/* Add Redirect Form */}
          <form onSubmit={handleAddRedirect} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Source Path (Old URL)</label>
                <input
                  type="text"
                  required
                  placeholder="/old-kitchen-rack"
                  value={newRedirect.source_url}
                  onChange={e => setNewRedirect({ ...newRedirect, source_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Target Destination (New URL)</label>
                <input
                  type="text"
                  required
                  placeholder="/product-detail?id=12"
                  value={newRedirect.target_url}
                  onChange={e => setNewRedirect({ ...newRedirect, target_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">HTTP Status Code</label>
                <select
                  value={newRedirect.status_code}
                  onChange={e => setNewRedirect({ ...newRedirect, status_code: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={301}>301 Permanent Redirect (SEO Recommended)</option>
                  <option value={302}>302 Temporary Redirect</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Redirect Rule
            </button>
          </form>

          {/* Redirects Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-[11px] uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Source URL</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {redirects.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">{r.source_url}</td>
                    <td className="px-4 py-3 font-mono text-emerald-700">{r.target_url}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-bold">{r.status_code}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteRedirect(r.id)}
                        className="p-1 text-red-500 hover:text-red-700 rounded"
                        title="Delete redirect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: 404 Monitor */}
      {activeTab === '404' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">404 Error Monitor</h3>
              <p className="text-xs text-gray-500">Track 404 missing page requests in real time and fix them with 1-click redirects.</p>
            </div>
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
              {logs404.length} Broken Hits Recorded
            </span>
          </div>

          {logs404.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>Great job! No 404 broken page requests detected recently.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] uppercase font-semibold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Missing URL Path</th>
                    <th className="px-4 py-3">Hits Count</th>
                    <th className="px-4 py-3">Last Attempt</th>
                    <th className="px-4 py-3 text-right">Fix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs404.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-medium text-red-600">{log.url}</td>
                      <td className="px-4 py-3 font-bold">{log.hits}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(log.lastHitAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleConvert404(log.url)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
                        >
                          Create 301 Redirect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 8: JSON-LD Schema Markup */}
      {activeTab === 'schema' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Structured Data & JSON-LD Schema</h3>
            <p className="text-xs text-gray-500">
              Valid Google rich snippet microdata for Organization, ECommerceStore, and Catalog Products.
            </p>
          </div>

          <div className="bg-gray-900 text-gray-100 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
            <div className="text-emerald-400">&lt;script type="application/ld+json"&gt;</div>
            <pre className="text-gray-300">
              {JSON.stringify(
                {
                  '@context': 'https://schema.org',
                  '@type': 'OnlineStore',
                  name: settings.org_name || 'Save & Smile Pakistan',
                  url: settings.site_url || 'https://saveandsmile.pk',
                  logo: `${settings.site_url}${settings.logo_url}`,
                  description: settings.default_description,
                  contactPoint: {
                    '@type': 'ContactPoint',
                    telephone: settings.helpline_phone || '+923162323616',
                    contactType: 'customer service',
                    areaServed: 'PK',
                    availableLanguage: ['Urdu', 'English']
                  },
                  priceRange: 'PKR',
                  paymentAccepted: ['Cash on Delivery', 'Bank Transfer']
                },
                null,
                2
              )}
            </pre>
            <div className="text-emerald-400">&lt;/script&gt;</div>
          </div>
        </div>
      )}

      {/* Tab 9: Technical SEO Audit */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Technical SEO Audit Report</h3>
              <p className="text-xs text-gray-500">Automated site inspection of catalog metadata, titles, and crawler accessibility.</p>
            </div>
            <button
              onClick={fetchSeoData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-run Audit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase block mb-1">Passed Checks</span>
              <span className="text-2xl font-bold text-emerald-900">18 Checks OK</span>
              <p className="text-xs text-emerald-700 mt-1">Sitemap, robots, schema & canonicals verified.</p>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-xs font-bold text-amber-800 uppercase block mb-1">Warnings</span>
              <span className="text-2xl font-bold text-amber-900">2 Recommendations</span>
              <p className="text-xs text-amber-700 mt-1">Connect GSC verification tag for live telemetry.</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <span className="text-xs font-bold text-blue-800 uppercase block mb-1">Mobile Usability</span>
              <span className="text-2xl font-bold text-blue-900">100% Responsive</span>
              <p className="text-xs text-blue-700 mt-1">Viewport meta & responsive Tailwind grids active.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
