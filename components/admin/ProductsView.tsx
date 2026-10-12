'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';

interface ProductsViewProps {
  products: Product[];
  onRefresh: () => void;
  isAddModalOpen: boolean;
  onCloseAddModal: () => void;
  onOpenAddModal: () => void;
}

export default function ProductsView({
  products,
  onRefresh,
  isAddModalOpen,
  onCloseAddModal,
  onOpenAddModal
}: ProductsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  // New Product Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newOrigPrice, setNewOrigPrice] = useState('');
  const [newCategory, setNewCategory] = useState('storage');
  const [newImage, setNewImage] = useState('');
  const [newCode, setNewCode] = useState('');

  const categories = [
    { key: 'all', label: 'All Categories' },
    { key: 'storage', label: 'Storage & Racks' },
    { key: 'kitchen', label: 'Kitchen Gadgets' },
    { key: 'electronics', label: 'Electronic Items' },
    { key: 'smart-watch', label: 'Smart Watches' },
    { key: 'bottles', label: 'Mug & Bottles' },
    { key: 'beauty', label: 'Beauty & Makeup' },
    { key: 'accessories', label: 'Mobile Accessories' }
  ];

  const filtered = products.filter(p => {
    const matchesCat = selectedCat === 'all' || (p.category && p.category.toLowerCase().includes(selectedCat.toLowerCase()));
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.code && p.code.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) return;

    setSubmitting(true);
    const id = Date.now();
    const productPayload: Product = {
      id,
      title: newTitle.trim(),
      price: Number(newPrice),
      originalPrice: newOrigPrice ? Number(newOrigPrice) : Number(newPrice) * 1.3,
      category: newCategory,
      image: newImage.trim() || 'images/save-and-smile-logo.png',
      code: newCode.trim() || `SNS-${Math.floor(1000 + Math.random() * 9000)}`,
      badge: 'NEW ARRIVAL'
    };

    try {
      // 1. Post to API with token if available
      const token = localStorage.getItem('save_and_smile_admin_token');
      await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(productPayload)
      });

      // 2. Local cache fallback
      const custom = JSON.parse(localStorage.getItem('qadri_custom_products') || '[]');
      custom.unshift(productPayload);
      localStorage.setItem('qadri_custom_products', JSON.stringify(custom));

      // Reset form
      setNewTitle('');
      setNewPrice('');
      setNewOrigPrice('');
      setNewImage('');
      setNewCode('');
      onCloseAddModal();
      onRefresh();

      window.dispatchEvent(new Event('qadri_products_updated'));
      alert('✅ Product added successfully!');
    } catch (err: any) {
      alert('Error adding product: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProduct(id: number | string) {
    if (!confirm('Are you sure you want to delete this product from the store catalog?')) return;

    try {
      const token = localStorage.getItem('save_and_smile_admin_token');
      await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      // Update local storage
      const deleted = JSON.parse(localStorage.getItem('qadri_deleted_products') || '[]');
      deleted.push(String(id));
      localStorage.setItem('qadri_deleted_products', JSON.stringify(deleted));

      const custom = JSON.parse(localStorage.getItem('qadri_custom_products') || '[]');
      const updatedCustom = custom.filter((p: any) => String(p.id) !== String(id));
      localStorage.setItem('qadri_custom_products', JSON.stringify(updatedCustom));

      onRefresh();
      window.dispatchEvent(new Event('qadri_products_updated'));
    } catch (err) {}
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Products &amp; Inventory Hub</h1>
          <p className="text-xs text-slate-400">Total {products.length} products listed in wholesale catalog</p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 bg-[#007382] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>+</span>
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by title, SKU or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs p-2.5 pl-8 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382] transition"
          />
          <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
        </div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map(c => (
            <button
              key={c.key}
              onClick={() => setSelectedCat(c.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
                selectedCat === c.key
                  ? 'bg-[#007382] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-3.5 pl-5">Product</th>
                <th className="p-3.5">Code / SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Wholesale Price</th>
                <th className="p-3.5">Original Price</th>
                <th className="p-3.5">Badge</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(p => {
                const img = p.image.startsWith('http') || p.image.startsWith('/') ? p.image : `/${p.image}`;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={img}
                          alt={p.title}
                          className="w-10 h-10 object-contain rounded-lg border border-slate-100 bg-slate-50 p-1 shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <div className="font-bold text-slate-800 truncate" title={p.title}>
                            {p.title}
                          </div>
                          <a
                            href={`/product-detail?id=${p.id}`}
                            target="_blank"
                            className="text-[10px] text-[#007382] hover:underline"
                          >
                            View on Storefront ↗
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 font-semibold">{p.code || `SNS-${p.id}`}</td>
                    <td className="p-3.5 capitalize">{p.category || 'General'}</td>
                    <td className="p-3.5 font-black text-[#007382]">Rs. {Number(p.price).toLocaleString()}</td>
                    <td className="p-3.5 text-slate-400 line-through">
                      Rs. {Number(p.originalPrice || p.original_price || p.price).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      {p.badge ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                          {p.badge}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Regular</span>
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-2">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition"
                        title="Delete Product"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs">
              No products found matching &ldquo;{search}&rdquo;.
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Add New Wholesale Product</h3>
              <button onClick={onCloseAddModal} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 360 Rotating Corner Storage Rack"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wholesale Price (Rs.) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 450"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Retail / Original Price (Rs.)</label>
                  <input
                    type="number"
                    placeholder="e.g. 750"
                    value={newOrigPrice}
                    onChange={e => setNewOrigPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
                  >
                    <option value="storage">Storage &amp; Racks</option>
                    <option value="kitchen">Kitchen Gadgets</option>
                    <option value="electronics">Electronics</option>
                    <option value="smart-watch">Smart Watches</option>
                    <option value="bottles">Mugs &amp; Bottles</option>
                    <option value="beauty">Beauty &amp; Makeup</option>
                    <option value="accessories">Mobile Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product SKU / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SNS-2001"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL / Path</label>
                <input
                  type="text"
                  placeholder="https://... or images/product.jpg"
                  value={newImage}
                  onChange={e => setNewImage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#007382]"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseAddModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#007382] hover:bg-[#005a66] text-white rounded-xl font-bold shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
