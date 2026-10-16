'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  Layers,
  ArrowUpDown,
  Tag,
  Sliders,
  DollarSign,
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';

interface Product {
  id: string | number;
  title: string;
  price: number;
  originalPrice?: number;
  original_price?: number;
  stock: number;
  category: string;
  tab?: string;
  code?: string;
  sku?: string;
  badge?: string;
  image: string;
  hover_image?: string;
  hoverImage?: string;
  images?: string[];
  description?: string;
  isPublished?: boolean;
  slug?: string;
  seo_title?: string;
  seo_description?: string;
  focus_keyword?: string;
  variants?: any[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'price-asc' | 'price-desc' | 'stock'>('title');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');

  // CSV Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadProducts = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/products?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error('Failed to load products:', e);
      showToast('Error loading products from backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter & Sort
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category || 'storage').filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch =
          (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
          (p.code || p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
          (p.category || '').toLowerCase().includes(search.toLowerCase());

        const matchesCat = selectedCategory === 'all' || (p.category || '').toLowerCase() === selectedCategory.toLowerCase();

        let matchesStock = true;
        const s = Number(p.stock) || 0;
        if (stockFilter === 'in_stock') matchesStock = s > 5;
        else if (stockFilter === 'low_stock') matchesStock = s > 0 && s <= 5;
        else if (stockFilter === 'out_of_stock') matchesStock = s === 0;

        return matchesSearch && matchesCat && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
        if (sortBy === 'price-desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
        if (sortBy === 'stock') return (Number(b.stock) || 0) - (Number(a.stock) || 0);
        return (a.title || '').localeCompare(b.title || '');
      });
  }, [products, search, selectedCategory, stockFilter, sortBy]);

  // Image Upload & Gallery Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success && data.url) {
          newUrls.push(data.url);
        } else {
          showToast(`File upload failed: ${data.error || 'Server error'}`);
        }
      }
      if (newUrls.length > 0) {
        setEditingProduct((prev) => {
          const currentImgs = Array.isArray(prev.images)
            ? [...prev.images]
            : (prev.image ? [prev.image] : []);
          const combined = Array.from(new Set([...currentImgs, ...newUrls]));
          const currentFeatured = prev.image && prev.image.trim() !== '' ? prev.image : combined[0];
          const currentHover = prev.hover_image && prev.hover_image.trim() !== ''
            ? prev.hover_image
            : (combined.length > 1 ? combined[1] : '');
          return {
            ...prev,
            images: combined,
            image: currentFeatured,
            hover_image: currentHover
          };
        });
        showToast(`✅ ${newUrls.length} tasveer(ein) upload ho gayin!`);
      }
    } catch (err: any) {
      showToast('Image upload error: ' + err.message);
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const url = newImageUrlInput.trim();
    if (!url) return;
    setEditingProduct((prev) => {
      const currentImgs = Array.isArray(prev.images) ? [...prev.images] : (prev.image ? [prev.image] : []);
      if (!currentImgs.includes(url)) currentImgs.push(url);
      const feat = prev.image && prev.image.trim() !== '' ? prev.image : url;
      const hov = prev.hover_image && prev.hover_image.trim() !== ''
        ? prev.hover_image
        : (currentImgs.length > 1 ? currentImgs[1] : '');
      return {
        ...prev,
        images: currentImgs,
        image: feat,
        hover_image: hov
      };
    });
    setNewImageUrlInput('');
    showToast('Image URL gallery mein shamil kar di gayi!');
  };

  const handleSetFeatured = (url: string) => {
    setEditingProduct((prev) => ({
      ...prev,
      image: url
    }));
    showToast('⭐ Featured (Main Display) image select ho gayi!');
  };

  const handleSetHover = (url: string) => {
    setEditingProduct((prev) => ({
      ...prev,
      hover_image: url
    }));
    showToast('🔄 Hover Image select ho gayi! Storefront par mouse le jane par ye dikhegi.');
  };

  const handleRemoveHover = () => {
    setEditingProduct((prev) => ({
      ...prev,
      hover_image: ''
    }));
    showToast('Hover image remove kar di gayi.');
  };

  const handleRemoveImage = (url: string) => {
    setEditingProduct((prev) => {
      const filtered = (prev.images || []).filter(img => img !== url);
      let newFeat = prev.image === url ? (filtered[0] || '') : prev.image;
      let newHover = prev.hover_image === url ? '' : prev.hover_image;
      return {
        ...prev,
        images: filtered,
        image: newFeat,
        hover_image: newHover
      };
    });
    showToast('Tasveer remove kar di gayi.');
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingProduct({
      title: '',
      price: 990,
      originalPrice: 1450,
      stock: 50,
      category: 'storage',
      tab: 'storage',
      code: 'QGW-' + Math.floor(100000 + Math.random() * 900000),
      badge: 'NEW',
      image: '/images/save-and-smile-logo.png',
      hover_image: '',
      images: ['/images/save-and-smile-logo.png'],
      description: '',
      isPublished: true,
      seo_title: '',
      seo_description: '',
      focus_keyword: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (product: Product) => {
    setModalMode('edit');
    const existingImgs = Array.isArray(product.images) && product.images.length > 0
      ? [...product.images]
      : (product.image ? [product.image] : []);
    const hImg = product.hover_image || (product as any).hoverImage || '';
    if (hImg && !existingImgs.includes(hImg)) {
      existingImgs.push(hImg);
    }
    setEditingProduct({
      ...product,
      hover_image: hImg,
      images: existingImgs
    });
    setIsModalOpen(true);
  };

  // Duplicate Product
  const handleDuplicate = async (p: Product) => {
    try {
      const copyPayload = {
        title: `${p.title} (Copy)`,
        price: p.price,
        originalPrice: p.originalPrice || p.original_price,
        stock: p.stock,
        category: p.category,
        tab: p.tab || p.category,
        code: `${p.code || 'SKU'}-COPY`,
        badge: p.badge || 'NEW',
        image: p.image,
        hover_image: p.hover_image || (p as any).hoverImage || '',
        images: p.images || [p.image],
        description: p.description,
        isPublished: true
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyPayload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Duplicated: ${copyPayload.title}`);
        loadProducts();
      } else {
        showToast(data.error || 'Failed to duplicate product');
      }
    } catch (e: any) {
      showToast(e.message || 'Duplicate request failed');
    }
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = modalMode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      const data = await res.json();

      if (data.success) {
        showToast(modalMode === 'edit' ? 'Product updated successfully!' : 'New product created!');
        setIsModalOpen(false);
        loadProducts();

        // Broadcast Live Synchronization for Storefront across tabs and windows
        try {
          if (typeof window !== 'undefined') {
            fetch('/api/products?t=' + Date.now(), { cache: 'no-store' })
              .then(r => r.json())
              .then(freshData => {
                if (freshData?.products && Array.isArray(freshData.products)) {
                  localStorage.setItem('save_and_smile_server_products', JSON.stringify(freshData.products));
                  window.dispatchEvent(new Event('storage'));
                  window.dispatchEvent(new CustomEvent('qadri_products_updated', { detail: data.product }));
                  if ('BroadcastChannel' in window) {
                    const bc = new BroadcastChannel('qadri_store_sync');
                    bc.postMessage({ type: 'product_updated', product: data.product, products: freshData.products });
                    bc.close();
                  }
                }
              })
              .catch(() => {});
          }
        } catch (syncErr) {}
      } else {
        showToast(data.error || 'Operation failed');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Delete Product
  const handleDelete = async (id: string | number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will remove it from the authoritative catalog.`)) return;

    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(id) })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Deleted: ${title}`);
        setProducts(prev => prev.filter(p => String(p.id) !== String(id)));

        // Broadcast deletion
        try {
          if (typeof window !== 'undefined') {
            fetch('/api/products?t=' + Date.now(), { cache: 'no-store' })
              .then(r => r.json())
              .then(freshData => {
                if (freshData?.products && Array.isArray(freshData.products)) {
                  localStorage.setItem('save_and_smile_server_products', JSON.stringify(freshData.products));
                  window.dispatchEvent(new Event('storage'));
                  window.dispatchEvent(new CustomEvent('qadri_products_updated'));
                  if ('BroadcastChannel' in window) {
                    const bc = new BroadcastChannel('qadri_store_sync');
                    bc.postMessage({ type: 'product_deleted', id: String(id), products: freshData.products });
                    bc.close();
                  }
                }
              })
              .catch(() => {});
          }
        } catch (syncErr) {}
      } else {
        showToast(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      showToast(err.message || 'Delete failed');
    }
  };

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map(p => String(p.id)));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected products?`)) return;
    for (const id of selectedIds) {
      await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    }
    showToast(`Deleted ${selectedIds.length} products`);
    setSelectedIds([]);
    loadProducts();
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['ID', 'Title', 'Price', 'OriginalPrice', 'Stock', 'Category', 'SKU', 'Badge', 'Image'];
    const rows = products.map(p => [
      p.id,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      p.price,
      p.originalPrice || p.original_price || '',
      p.stock,
      p.category,
      p.code || p.sku || '',
      p.badge || '',
      `"${p.image || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `save-and-smile-products-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported catalog to CSV');
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

      {/* Header and Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Products Catalog
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {products.length} Products
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full inventory management, price controls, variants and instant storefront synchronization
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#007382] hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#007382] focus:ring-1 focus:ring-[#007382]/30"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 hidden sm:inline">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 capitalize focus:outline-hidden focus:border-[#007382]"
          >
            {categories.map(c => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 hidden sm:inline">Stock:</label>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:border-[#007382]"
          >
            <option value="all">All Levels</option>
            <option value="in_stock">In Stock (&gt;5)</option>
            <option value="low_stock">Low Stock (1-5)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:border-[#007382]"
          >
            <option value="title">Title (A-Z)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock">Stock Quantity</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs">
          <span className="font-bold text-[#007382]">
            {selectedIds.length} products selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
              <tr>
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                    className="rounded border-slate-300 text-[#007382] focus:ring-[#007382]"
                  />
                </th>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">SKU / Code</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Wholesale Price</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Badge</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#007382]" />
                    Loading authoritative product database...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const stockNum = Number(p.stock) || 0;
                  const isLow = stockNum > 0 && stockNum <= 5;
                  const isOut = stockNum === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(String(p.id))}
                          onChange={() => handleSelectOne(String(p.id))}
                          className="rounded border-slate-300 text-[#007382] focus:ring-[#007382]"
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={p.image || '/images/placeholder.jpg'}
                              alt={p.title}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-100"
                            />
                            {(p.hover_image || (p as any).hoverImage) && (
                              <span
                                title="Hover Picture Set"
                                className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-600 border border-white text-white rounded-full flex items-center justify-center text-[9px]"
                              >
                                🔄
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[280px]">
                            <div className="font-bold text-slate-900 truncate" title={p.title}>
                              {p.title}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                              <span>ID: {p.id}</span>
                              {(p.hover_image || (p as any).hoverImage) && (
                                <span className="text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded text-[9px] border border-indigo-100">
                                  Hover Pic
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {p.code || p.sku || `QGW-${p.id}`}
                      </td>
                      <td className="p-3.5 capitalize text-slate-600">
                        {p.category || 'storage'}
                      </td>
                      <td className="p-3.5">
                        <div className="font-black text-slate-900">
                          Rs. {Number(p.price).toLocaleString()}
                        </div>
                        {(p.originalPrice || p.original_price) && (
                          <div className="text-[10px] text-slate-400 line-through">
                            Rs. {Number(p.originalPrice || p.original_price).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOut
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : `${stockNum} in stock`}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {p.badge && (
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[9px] uppercase border border-slate-200">
                            {p.badge}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Product"
                            className="p-1.5 text-slate-500 hover:text-[#007382] hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(p)}
                            title="Duplicate Product"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.title)}
                            title="Delete Product"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-black text-slate-900">
                {modalMode === 'edit' ? 'Edit Product Details' : 'Add New Product to Store'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Product Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.title || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  placeholder="e.g. Multipurpose Stainless Steel Storage Rack"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007382]"
                />
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sale Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007382]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Original / Cut Price (PKR)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice ?? editingProduct.original_price ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: parseFloat(e.target.value) || undefined })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007382]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007382]"
                  />
                </div>
              </div>

              {/* Category & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={editingProduct.category || 'storage'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value, tab: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007382]"
                  >
                    <option value="kitchen">Kitchen</option>
                    <option value="storage">Storage & Racks</option>
                    <option value="household">Household Gadgets</option>
                    <option value="smart-watch">Smart Watches</option>
                    <option value="accessories">Mobile Accessories</option>
                    <option value="beauty">Beauty Care</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SKU / Product Code
                  </label>
                  <input
                    type="text"
                    value={editingProduct.code || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, code: e.target.value })}
                    placeholder="QGW-123456"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007382]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Promotional Badge
                  </label>
                  <input
                    type="text"
                    value={editingProduct.badge || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                    placeholder="HOT / SALE / NEW"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007382]"
                  />
                </div>
              </div>

              {/* PRODUCT IMAGES & MEDIA MANAGER */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#007382]" />
                      <span>Product Media & Image Upload</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Apne computer se PNG/JPG/WebP upload karein ya direct URL enter karein. Featured aur Hover pictures select karein.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#007382] hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs ${uploadingImage ? 'opacity-60 pointer-events-none' : ''}`}>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload from PC'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Direct URL input bar */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newImageUrlInput}
                    onChange={(e) => setNewImageUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl(); } }}
                    placeholder="Ya direct image URL paste karein (https://... or /uploads/...)"
                    className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007382]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
                  >
                    + Add URL
                  </button>
                </div>

                {/* Active Selection Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Featured Card */}
                  <div className="p-3 bg-white rounded-xl border-2 border-emerald-300 shadow-xs flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                      {editingProduct.image ? (
                        <img src={editingProduct.image} alt="Featured" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <span className="text-[10px] text-slate-400 text-center px-1">No Image</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md flex items-center gap-1">
                          ⭐ Featured (Main Pic)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium truncate mt-1" title={editingProduct.image || 'None'}>
                        {editingProduct.image ? editingProduct.image.substring(editingProduct.image.lastIndexOf('/') + 1) : 'Koi tasveer select nahi'}
                      </p>
                      <span className="text-[10px] text-slate-400 block">Storefront par default ye pic nazar aayegi</span>
                    </div>
                  </div>

                  {/* Hover Card */}
                  <div className="p-3 bg-white rounded-xl border-2 border-indigo-300 shadow-xs flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                      {editingProduct.hover_image ? (
                        <img src={editingProduct.hover_image} alt="Hover" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <span className="text-[10px] text-slate-400 text-center px-1">None</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-md flex items-center gap-1">
                          🔄 Hover Pic (Mouse Over)
                        </span>
                        {editingProduct.hover_image && (
                          <button
                            type="button"
                            onClick={handleRemoveHover}
                            className="text-[10px] text-rose-500 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium truncate mt-1" title={editingProduct.hover_image || 'Hover pic set nahi ki'}>
                        {editingProduct.hover_image ? editingProduct.hover_image.substring(editingProduct.hover_image.lastIndexOf('/') + 1) : 'Hover pic set nahi'}
                      </p>
                      <span className="text-[10px] text-slate-400 block">Customer mouse le jayega toh ye pic aayegi</span>
                    </div>
                  </div>
                </div>

                {/* Uploaded Media Gallery Thumbnails */}
                <div>
                  <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <span>Uploaded Gallery ({Array.from(new Set([...(editingProduct.images || []), ...(editingProduct.image ? [editingProduct.image] : []), ...(editingProduct.hover_image ? [editingProduct.hover_image] : [])])).filter(Boolean).length} tasaveer)</span>
                    <span className="text-[10px] text-slate-400">Buttons daba kar Featured ya Hover choose karein</span>
                  </div>

                  {Array.from(new Set([...(editingProduct.images || []), ...(editingProduct.image ? [editingProduct.image] : []), ...(editingProduct.hover_image ? [editingProduct.hover_image] : [])])).filter(Boolean).length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-300 rounded-xl bg-white text-xs text-slate-400">
                      Abhi tak koi tasveer nahi hai. &quot;Upload from PC&quot; button dabayein ya link paste karein.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
                      {Array.from(new Set([...(editingProduct.images || []), ...(editingProduct.image ? [editingProduct.image] : []), ...(editingProduct.hover_image ? [editingProduct.hover_image] : [])])).filter(Boolean).map((imgUrl, idx) => {
                        const isFeatured = editingProduct.image === imgUrl;
                        const isHover = editingProduct.hover_image === imgUrl;

                        return (
                          <div
                            key={idx}
                            className={`group relative bg-white rounded-xl border p-2 transition flex flex-col justify-between ${
                              isFeatured
                                ? 'border-emerald-500 ring-2 ring-emerald-200'
                                : isHover
                                ? 'border-indigo-500 ring-2 ring-indigo-200'
                                : 'border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {/* Badges */}
                            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
                              {isFeatured && (
                                <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                                  ⭐ Featured
                                </span>
                              )}
                              {isHover && (
                                <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                                  🔄 Hover
                                </span>
                              )}
                            </div>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(imgUrl)}
                              title="Delete this image"
                              className="absolute top-2.5 right-2.5 bg-white/90 hover:bg-rose-600 hover:text-white text-slate-500 p-1 rounded-full shadow-xs transition z-10"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            {/* Thumbnail */}
                            <div className="w-full aspect-square bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                              <img
                                src={imgUrl}
                                alt="Product preview"
                                className="w-full h-full object-contain p-1"
                              />
                            </div>

                            {/* Buttons */}
                            <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleSetFeatured(imgUrl)}
                                className={`text-[10px] font-bold py-1 px-0.5 rounded transition text-center ${
                                  isFeatured
                                    ? 'bg-emerald-600 text-white cursor-default'
                                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                              >
                                {isFeatured ? '✓ Featured' : 'Featured'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetHover(imgUrl)}
                                className={`text-[10px] font-bold py-1 px-0.5 rounded transition text-center ${
                                  isHover
                                    ? 'bg-indigo-600 text-white cursor-default'
                                    : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                                }`}
                              >
                                {isHover ? '✓ Hover' : 'Hover'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Detailed specifications, dimensions, features..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007382]"
                />
              </div>

              {/* Rank Math SEO Section inside Product */}
              <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#007382]">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Product SEO Metadata (Rank Math)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Focus Keyword</label>
                    <input
                      type="text"
                      value={editingProduct.focus_keyword || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, focus_keyword: e.target.value })}
                      placeholder="e.g. storage rack wholesale"
                      className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={editingProduct.seo_title || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, seo_title: e.target.value })}
                      placeholder="Title for Google search"
                      className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#007382] hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : modalMode === 'edit' ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
