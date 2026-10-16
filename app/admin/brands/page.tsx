'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  Palette
} from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  logo?: string;
}

interface Attribute {
  id: string;
  name: string;
  code: string;
  terms: string[];
}

export default function AdminBrandsAttributesPage() {
  const [activeTab, setActiveTab] = useState<'brands' | 'attributes' | 'tags'>('brands');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New item modal / inputs
  const [newTagInput, setNewTagInput] = useState('');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Partial<Brand>>({});
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<{ id?: string; name: string; code: string; termsString: string }>({
    name: '',
    code: '',
    termsString: ''
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/content?type=brands', { cache: 'no-store' });
      const json = await res.json();
      if (json?.data) {
        setBrands(json.data.brands || []);
        setAttributes(json.data.attributes || []);
        setTags(json.data.tags || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Brand
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/content?type=brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subType: 'brand', ...editingBrand })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Brand saved successfully!');
        setIsBrandModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Delete Brand
  const handleDeleteBrand = async (id: string, name: string) => {
    if (!window.confirm(`Delete brand "${name}"?`)) return;
    await fetch('/api/content?type=brands', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subType: 'brand', id })
    });
    showToast(`Brand deleted: ${name}`);
    loadData();
  };

  // Save Attribute
  const handleSaveAttr = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/content?type=attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subType: 'attribute',
          id: editingAttr.id,
          name: editingAttr.name,
          code: editingAttr.code,
          terms: editingAttr.termsString
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Attribute saved!');
        setIsAttrModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Delete Attribute
  const handleDeleteAttr = async (id: string, name: string) => {
    if (!window.confirm(`Delete attribute group "${name}"?`)) return;
    await fetch('/api/content?type=attributes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subType: 'attribute', id })
    });
    showToast(`Deleted: ${name}`);
    loadData();
  };

  // Add Tag
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim().toLowerCase();
    await fetch('/api/content?type=brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subType: 'tag', tag })
    });
    setNewTagInput('');
    showToast(`Added tag #${tag}`);
    loadData();
  };

  // Delete Tag
  const handleDeleteTag = async (tag: string) => {
    await fetch('/api/content?type=brands', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subType: 'tag', tag })
    });
    showToast(`Removed tag #${tag}`);
    loadData();
  };

  return (
    <div className="space-y-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Brands, Attributes & Tags
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage product variations, brand profiles and searchable taxonomy tags
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'brands' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Brands ({brands.length})
          </button>
          <button
            onClick={() => setActiveTab('attributes')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'attributes' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Attributes ({attributes.length})
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'tags' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Tags ({tags.length})
          </button>
        </div>
      </div>

      {/* BRANDS TAB */}
      {activeTab === 'brands' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingBrand({ name: '', slug: '', description: '', productCount: 0, logo: '' });
                setIsBrandModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#007382] hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Add Brand
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map(b => (
              <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{b.name}</h3>
                      <div className="text-[11px] font-mono text-slate-400">/{b.slug}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingBrand(b);
                          setIsBrandModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-[#007382]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(b.id, b.name)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{b.description || 'No description provided.'}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>{b.productCount || 0} Products</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATTRIBUTES TAB */}
      {activeTab === 'attributes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingAttr({ name: '', code: '', termsString: '' });
                setIsAttrModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#007382] hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Add Attribute Group
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attributes.map(attr => (
              <div key={attr.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{attr.name}</h3>
                    <div className="text-[10px] font-mono text-slate-400">code: {attr.code}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingAttr({
                          id: attr.id,
                          name: attr.name,
                          code: attr.code,
                          termsString: (attr.terms || []).join(', ')
                        });
                        setIsAttrModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-[#007382]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAttr(attr.id, attr.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-[11px] font-bold text-slate-500 mb-2">Configured Options / Terms:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(attr.terms || []).map((term, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAGS TAB */}
      {activeTab === 'tags' && (
        <div className="space-y-4">
          {/* Add Tag Form */}
          <form onSubmit={handleAddTag} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex gap-2 max-w-md">
            <input
              type="text"
              required
              placeholder="Type new tag name (e.g. summer-deals)..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007382]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#007382] hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition"
            >
              Add Tag
            </button>
          </form>

          {/* Tags Cloud */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap gap-2">
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-[#007382] text-xs font-bold"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(t)}
                    className="hover:text-rose-600 ml-1 text-slate-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BRAND MODAL */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-black text-slate-900">Brand Settings</h2>
              <button onClick={() => setIsBrandModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBrand} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={editingBrand.name || ''}
                  onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={editingBrand.slug || ''}
                  onChange={(e) => setEditingBrand({ ...editingBrand, slug: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingBrand.description || ''}
                  onChange={(e) => setEditingBrand({ ...editingBrand, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsBrandModalOpen(false)} className="px-3 py-1.5 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#007382] text-white text-xs font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTRIBUTE MODAL */}
      {isAttrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-black text-slate-900">Attribute Group</h2>
              <button onClick={() => setIsAttrModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAttr} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attribute Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Color or Size"
                  value={editingAttr.name}
                  onChange={(e) => setEditingAttr({ ...editingAttr, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">System Code</label>
                <input
                  type="text"
                  placeholder="e.g. color"
                  value={editingAttr.code}
                  onChange={(e) => setEditingAttr({ ...editingAttr, code: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Options (Comma-separated) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Black, White, Red, Blue"
                  value={editingAttr.termsString}
                  onChange={(e) => setEditingAttr({ ...editingAttr, termsString: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAttrModalOpen(false)} className="px-3 py-1.5 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#007382] text-white text-xs font-bold rounded-xl">Save Group</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
