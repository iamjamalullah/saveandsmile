'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { CartItem } from '@/lib/types';
import { getCart, saveCart } from '@/lib/store';

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(getCart());
  }, []);

  function updateQty(id: number | string, delta: number) {
    const updated = cart.map(item => {
      if (String(item.id) === String(id)) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    });
    setCart(updated);
    saveCart(updated);
  }

  function removeItem(id: number | string) {
    const updated = cart.filter(item => String(item.id) !== String(id));
    setCart(updated);
    saveCart(updated);
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shipping = subtotal >= 3000 || subtotal === 0 ? 0 : 250;
  const grandTotal = subtotal + shipping;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="site-container my-8 flex-1">
        <h1 className="text-xl font-black text-[#00363d] mb-6">Shopping Cart ({cart.length} items)</h1>

        {cart.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
            <span className="text-4xl">🛒</span>
            <h2 className="text-base font-bold text-slate-800">Your cart is currently empty</h2>
            <p className="text-xs text-slate-500">Discover hundreds of wholesale products with high reseller profit margins.</p>
            <Link href="/" className="inline-block px-5 py-2.5 bg-[#007382] text-white rounded-xl text-xs font-bold shadow-sm">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-3">
              {cart.map(item => {
                const itemImg = item.image.startsWith('http') || item.image.startsWith('/') ? item.image : `/${item.image}`;
                return (
                  <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                    <img src={itemImg} alt={item.title} className="w-16 h-16 object-contain rounded-lg border border-slate-100 p-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-slate-800 truncate">{item.title}</h3>
                      {item.variant?.size && <p className="text-[11px] text-slate-400">Size: {item.variant.size}</p>}
                      <div className="text-xs font-black text-[#007382] mt-1">Rs. {item.price.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateQty(item.id, -1)} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-xs font-bold">−</button>
                      <span className="px-3 py-1 text-xs font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-xs font-bold">+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-rose-500 hover:text-rose-700 text-xs p-1 font-bold">✕</button>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">Order Summary</h2>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Shipping:</span>
                  <span className="font-bold">{shipping === 0 ? 'FREE (Orders >= Rs. 3,000)' : `Rs. ${shipping}`}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                  <span>Grand Total:</span>
                  <span className="text-[#007382]">Rs. {grandTotal.toLocaleString()}</span>
                </div>

                <Link href="/checkout" className="block text-center w-full py-3 bg-[#007382] hover:bg-[#005a66] text-white rounded-xl text-xs font-black shadow-sm transition">
                  Proceed to Checkout (COD)
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
