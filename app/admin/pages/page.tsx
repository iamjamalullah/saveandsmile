'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Globe,
  Share2,
  RefreshCw,
  X,
  Calendar,
  Sparkles
} from 'lucide-react';

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  publishedAt: string;
  excerpt: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
}

export default function PagesContentAdmin() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const [formData, setFormData] = useState<Partial<ContentPage>>({
    title: '',
    slug: '',
    isPublished: true,
    excerpt: '',
    content: '',
    seoTitle: '',
    seoDescription: '',
    focusKeyword: '',
    canonicalUrl: ''
  });
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/content?type=pages');
      const data = await res.json();
      if (data.success && Array.isArray(data.pages)) {
        setPages(data.pages);
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to load pages: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleOpenCreate = () => {
    setEditingPage(null);
    setFormData({
      title: '',
      slug: '',
      isPublished: true,
      excerpt: '',
      content: '',
      seoTitle: '',
      seoDescription: '',
      focusKeyword: '',
      canonicalUrl: ''
    });
    setActiveTab('content');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (page: ContentPage) => {
    setEditingPage(page);
    setFormData({ ...page });
    setActiveTab('content');
    setIsModalOpen(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      seoTitle: prev.seoTitle || title
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setNotice({ type: 'error', message: 'Page title is required' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        id: editingPage ? editingPage.id : undefined,
        slug: formData.slug || generateSlug(formData.title || 'untitled')
      };

      const res = await fetch('/api/content?type=pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setNotice({
          type: 'success',
          message: editingPage ? 'Page updated successfully!' : 'New content page created!'
        });
        setIsModalOpen(false);
        fetchPages();
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to save page' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete page "${title}"?`)) return;
    try {
      const res = await fetch(`/api/content?type=pages&id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: `Page "${title}" removed successfully.` });
        fetchPages();
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to delete page' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages;
    const q = search.toLowerCase();
    return pages.filter(p => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [pages, search]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            Pages & Content Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Author and edit legal policies, About Us, FAQs, and custom landing pages with SEO metadata.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPages}
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
            Add Page
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search pages by title or URL slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          {filteredPages.length} Pages Available
        </span>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-sm">Loading content pages...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No content pages found</h3>
            <p className="text-sm text-gray-500 mt-1">Click "Add Page" to create a new page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Page Title</th>
                  <th className="px-6 py-3.5">URL Slug</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Focus Keyword</th>
                  <th className="px-6 py-3.5">Last Updated</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPages.map(page => (
                  <tr key={page.id} className="hover:bg-gray-50/75 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{page.title}</div>
                      <div className="text-xs text-gray-400 truncate max-w-sm">{page.excerpt || 'No excerpt'}</div>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-emerald-700">
                      /{page.slug}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          page.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {page.isPublished ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {page.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      {page.focusKeyword ? (
                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                          {page.focusKeyword}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">None set</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500">
                      {page.publishedAt ? new Date(page.publishedAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition"
                          title="View on live store"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleOpenEdit(page)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit page"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(page.id, page.title)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete page"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Page Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-emerald-600" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingPage ? `Edit: ${editingPage.title}` : 'Create New Page'}
                  </h2>
                  <p className="text-xs text-gray-500">Configure page text, URL slug, and Rank Math-style SEO tags.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex items-center gap-4 px-6 border-b border-gray-200 bg-white text-xs font-semibold">
              <button
                onClick={() => setActiveTab('content')}
                className={`py-3 border-b-2 transition ${
                  activeTab === 'content'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Page Content & Layout
              </button>
              <button
                onClick={() => setActiveTab('seo')}
                className={`py-3 border-b-2 transition ${
                  activeTab === 'seo'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                SEO Metadata & Snippet Preview
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
              {activeTab === 'content' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Page Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.title || ''}
                        onChange={e => handleTitleChange(e.target.value)}
                        placeholder="e.g. 7-Day Replacement Warranty"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">URL Slug</label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-xs">
                          /
                        </span>
                        <input
                          type="text"
                          value={formData.slug || ''}
                          onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-r-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Short Excerpt</label>
                    <input
                      type="text"
                      value={formData.excerpt || ''}
                      onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Brief 1-2 sentence overview shown in navigation listings..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Page Body Content</label>
                    <textarea
                      rows={10}
                      value={formData.content || ''}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write your policy text, terms, or article content in HTML or plain text..."
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished ?? true}
                      onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="isPublished" className="text-xs font-semibold text-gray-800 cursor-pointer">
                      Publish publicly on website (uncheck to save as draft)
                    </label>
                  </div>
                </>
              ) : (
                /* SEO Tab */
                <div className="space-y-4">
                  {/* Google Snippet Live Preview */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                      Google Search SERP Preview
                    </span>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600 truncate">
                        https://saveandsmile.pk/{formData.slug || 'page-slug'}
                      </div>
                      <div className="text-blue-700 font-semibold text-sm hover:underline cursor-pointer">
                        {formData.seoTitle || formData.title || 'Page Title'} | Save & Smile
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {formData.seoDescription || formData.excerpt || 'Add a meta description to see how it appears on Google...'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Focus Keyword</label>
                    <input
                      type="text"
                      value={formData.focusKeyword || ''}
                      onChange={e => setFormData({ ...formData, focusKeyword: e.target.value })}
                      placeholder="e.g. wholesale delivery policy, return warranty"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">SEO Meta Title</label>
                    <input
                      type="text"
                      value={formData.seoTitle || ''}
                      onChange={e => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder="Title tag displayed in Google search results"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">SEO Meta Description</label>
                    <textarea
                      rows={3}
                      value={formData.seoDescription || ''}
                      onChange={e => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder="Compelling 150-160 character description for Google bots and social cards"
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Canonical URL</label>
                    <input
                      type="text"
                      value={formData.canonicalUrl || ''}
                      onChange={e => setFormData({ ...formData, canonicalUrl: e.target.value })}
                      placeholder="https://saveandsmile.pk/your-page"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
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
                  {submitting ? 'Saving...' : editingPage ? 'Update Page' : 'Publish Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
