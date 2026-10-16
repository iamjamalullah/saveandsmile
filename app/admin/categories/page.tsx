'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  RefreshCw,
  X,
  Tag
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  banner?: string;
  description?: string;
  productCount?: number;
  featured?: boolean;
  order?: number;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_kitchen', name: 'Kitchen & Dining', slug: 'kitchen', icon: '🍳', image: 'https://www.qadrigadgets.pk/images/categories/6a7af65668d40.webp', description: 'Smart culinary tools, organizers and silicone kitchen essentials', productCount: 8, featured: true, order: 1 },
  { id: 'cat_storage', name: 'Storage & Organizers', slug: 'storage', icon: '📦', image: 'https://www.qadrigadgets.pk/images/categories/6a7af656690fc.webp', description: 'Triangular racks, stainless steel corner shelves, and bathroom organizers', productCount: 10, featured: true, order: 2 },
  { id: 'cat_household', name: 'Household Gadgets', slug: 'household', icon: '🏠', image: 'https://www.qadrigadgets.pk/images/categories/6a7af65669503.webp', description: 'Rechargeable mosquito killers, lint removers, and daily utilities', productCount: 6, featured: true, order: 3 },
  { id: 'cat_smart_watch', name: 'Smart Watches', slug: 'smart-watch', icon: '⌚', image: 'https://www.qadrigadgets.pk/images/categories/6a7af6566994b.webp', description: 'T800 Ultra, Series 8 and wearable fitness tracking gadgets', productCount: 5, featured: true, order: 4 },
  { id: 'cat_accessories', name: 'Drinkware & Flasks', slug: 'accessories', icon: '☕', image: 'https://www.qadrigadgets.pk/images/categories/6a7af65669d26.webp', description: 'Thermal vacuum bottles, temperature display mugs, and sippers', productCount: 5, featured: true, order: 5 },
  { id: 'cat_beauty', name: 'Beauty & Personal Care', slug: 'beauty', icon: '✨', image: 'https://www.qadrigadgets.pk/images/categories/6a7af6566a0fa.webp', description: 'Facial massagers, ultrasonic cleaner tools and grooming accessories', productCount: 3, featured: false, order: 6 },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<Partial<Category>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      const data = await res.json();
      if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(data.categories);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingCategory({
      name: '',
      slug: '',
      icon: '📦',
      image: '',
      description: '',
      featured: true,
      order: categories.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setModalMode('edit');
    setEditingCategory({ ...c });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCat: Category = {
        id: editingCategory.id || `cat_${Date.now()}`,
        name: editingCategory.name || 'Category',
        slug: editingCategory.slug || (editingCategory.name || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
        icon: editingCategory.icon || '📦',
        image: editingCategory.image || '',
        banner: editingCategory.banner || '',
        description: editingCategory.description || '',
        featured: editingCategory.featured ?? true,
        order: editingCategory.order || 1,
        productCount: editingCategory.productCount || 0
      };

      let updated = [...categories];
      const idx = updated.findIndex(c => c.id === newCat.id);
      if (idx >= 0) updated[idx] = newCat;
      else updated.push(newCat);

      setCategories(updated);

      // Persist to backend
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updated })
      });

      showToast(modalMode === 'edit' ? 'Category updated!' : 'Category created!');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Save failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: updated })
    });
    showToast(`Deleted ${name}`);
  };

  const filtered = categories.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Categories & Subcategories
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {categories.length} Categories
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize products, manage navigation hierarchy and custom category banners
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#007382] hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter categories by name or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-hidden text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-xl shrink-0">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      cat.icon || '📦'
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                    <div className="text-[11px] font-mono text-slate-400">/{cat.slug}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-slate-500 hover:text-[#007382] hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {cat.description && (
                <p className="text-xs text-slate-500 mt-3 line-clamp-2">{cat.description}</p>
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">
                {cat.productCount || 0} Products
              </span>
              {cat.featured && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-black text-slate-900">
                {modalMode === 'edit' ? 'Edit Category' : 'Create New Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="e.g. Smart Kitchen Gadgets"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Slug (URL) *</label>
                  <input
                    type="text"
                    required
                    value={editingCategory.slug || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    placeholder="smart-kitchen"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emoji / Icon</label>
                  <input
                    type="text"
                    value={editingCategory.icon || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    placeholder="🍳"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingCategory.image || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                  placeholder="https://... or /uploads/..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Brief summary for category hub"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featCat"
                  checked={editingCategory.featured ?? true}
                  onChange={(e) => setEditingCategory({ ...editingCategory, featured: e.target.checked })}
                  className="rounded border-slate-300 text-[#007382]"
                />
                <label htmlFor="featCat" className="text-xs font-bold text-slate-700">
                  Feature this category on Homepage Strip
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007382] hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
