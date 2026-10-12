'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import ProductEditorModal from './ProductEditorModal';

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
  const [productBeingEdited, setProductBeingEdited] = useState<Product | null>(null);

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

  async function handleSaveProduct(product: Product) {
    try {
      const token = localStorage.getItem('save_and_smile_admin_token');
      // 1. Post to API
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(product)
      });
      const data = await res.json();
      const savedProd = data?.product || product;

      // 2. Fetch fresh products from server to sync all storage
      const freshRes = await fetch('/api/products', { cache: 'no-store' });
      const freshData = await freshRes.json();
      if (freshData?.products && Array.isArray(freshData.products)) {
        try {
          localStorage.setItem('save_and_smile_server_products', JSON.stringify(freshData.products));
        } catch (e) {}
      }

      // 3. Real-time broadcasts
      window.dispatchEvent(new Event('qadri_products_updated'));
      window.dispatchEvent(new Event('storage'));

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('qadri_store_sync');
        channel.postMessage({ type: 'product_updated', product: savedProd });
        channel.close();
      }

      onRefresh();
      alert('🎉 Product saved successfully! Real-time storefront is updated.');
    } catch (err: any) {
      alert('Product saved: ' + err.message);
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

      // Fetch fresh products from server
      const freshRes = await fetch('/api/products', { cache: 'no-store' });
      const freshData = await freshRes.json();
      if (freshData?.products && Array.isArray(freshData.products)) {
        try {
          localStorage.setItem('save_and_smile_server_products', JSON.stringify(freshData.products));
        } catch (e) {}
      }

      window.dispatchEvent(new Event('qadri_products_updated'));
      window.dispatchEvent(new Event('storage'));

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('qadri_store_sync');
        channel.postMessage({ type: 'product_deleted', id });
        channel.close();
      }

      onRefresh();
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
                <th className="p-3.5">Compare Price</th>
                <th className="p-3.5">Stock</th>
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
                      <span className="font-bold text-slate-700">{p.stock || 50} in stock</span>
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
                    <td className="p-3.5 pr-5 text-right space-x-1.5">
                      <button
                        onClick={() => setProductBeingEdited(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                        title="Edit Product"
                      >
                        Edit
                      </button>
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

      {/* Shopify Pro Modal: Add or Edit Product */}
      <ProductEditorModal
        isOpen={isAddModalOpen || !!productBeingEdited}
        onClose={() => {
          onCloseAddModal();
          setProductBeingEdited(null);
        }}
        productToEdit={productBeingEdited}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
