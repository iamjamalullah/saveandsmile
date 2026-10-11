'use client';

import React, { useState } from 'react';
import { PRODUCTS, Product } from '@/lib/data';

export default function AdminProductsPage() {
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = productsList.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202223]">Products Management</h1>
          <p className="text-xs text-[#6d7175]">Manage inventory, wholesale prices, images and SEO settings</p>
        </div>
        <button 
          onClick={() => {
            const newId = Date.now();
            const newProd: Product = {
              id: newId,
              title: 'New Wholesale Product',
              category: 'storage',
              badge: 'NEW ARRIVAL',
              originalPrice: 2000,
              price: 1500,
              image: '/images/products/t900-ultra-2.webp',
              description: 'Product description here...'
            };
            setProductsList([newProd, ...productsList]);
            setEditingProduct(newProd);
          }}
          className="px-4 py-2 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg shadow-xs transition"
        >
          + Add Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#e1e3e5] flex items-center gap-2">
        <span>🔍</span>
        <input 
          type="text" 
          placeholder="Filter by product name or category..." 
          className="w-full text-xs outline-none bg-transparent"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e1e3e5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#202223]">
            <thead className="bg-slate-50 border-b border-[#e1e3e5] text-[#6d7175] uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Wholesale Rate</th>
                <th className="p-3.5">Market Price</th>
                <th className="p-3.5">Badge</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e3e5]">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="p-3.5 flex items-center space-x-3">
                    <img src={p.image} alt={p.title} className="w-10 h-10 object-contain rounded border border-slate-200 bg-white" />
                    <div>
                      <div className="font-bold text-slate-900">{p.title}</div>
                      <div className="text-[10px] text-slate-500">ID: {p.id}</div>
                    </div>
                  </td>
                  <td className="p-3.5 capitalize font-medium">{p.category}</td>
                  <td className="p-3.5 font-bold text-[#008060]">Rs. {p.price.toLocaleString()}</td>
                  <td className="p-3.5 text-slate-400 line-through">Rs. {p.originalPrice.toLocaleString()}</td>
                  <td className="p-3.5">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">
                      {p.badge}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button 
                      onClick={() => setEditingProduct(p)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Delete ${p.title}?`)) {
                          setProductsList(productsList.filter(item => item.id !== p.id));
                        }
                      }}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded font-semibold text-[11px]"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-bold text-sm text-slate-900">Edit Product: {editingProduct.title}</h2>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2"
                  value={editingProduct.title}
                  onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wholesale Price (Rs)</label>
                  <input 
                    type="number" 
                    className="w-full border rounded-lg p-2"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Market Price (Rs)</label>
                  <input 
                    type="number" 
                    className="w-full border rounded-lg p-2"
                    value={editingProduct.originalPrice}
                    onChange={e => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2"
                  value={editingProduct.image}
                  onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button 
                onClick={() => setEditingProduct(null)} 
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setProductsList(productsList.map(p => p.id === editingProduct.id ? editingProduct : p));
                  setEditingProduct(null);
                }} 
                className="px-4 py-1.5 rounded-lg bg-[#008060] text-white text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
