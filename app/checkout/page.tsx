'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { CartItem } from '@/lib/types';
import { getCart, saveCart } from '@/lib/store';

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'easypaisa' | 'bank'>('cod');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    address: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  useEffect(() => {
    setCart(getCart());
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shipping = subtotal >= 3000 || subtotal === 0 ? 0 : 250;
  const grandTotal = subtotal + shipping;

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    const trackingId = 'SNS-' + Math.floor(100000 + Math.random() * 900000);

    const orderPayload = {
      trackingId,
      customer: formData,
      paymentMethod,
      items: cart,
      subtotal,
      shipping,
      grandTotal,
      status: 'Processing',
      date: new Date().toISOString()
    };

    try {
      // Post to /api/orders
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      setOrderSuccess({ ...orderPayload, serverId: data.orderId || trackingId });
      saveCart([]); // Clear cart
    } catch (err) {
      // Fallback local persistence
      const orders = JSON.parse(localStorage.getItem('qadri_orders') || '[]');
      orders.unshift(orderPayload);
      localStorage.setItem('qadri_orders', JSON.stringify(orders));
      setOrderSuccess(orderPayload);
      saveCart([]);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="site-container my-12 flex-1 max-w-lg mx-auto">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
            <span className="text-5xl">🎉</span>
            <h1 className="text-xl font-black text-slate-900">Order Placed Successfully!</h1>
            <p className="text-xs text-slate-500">Thank you for your wholesale order with Save &amp; Smile.</p>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-left space-y-1.5 text-xs">
              <div><strong>Tracking ID:</strong> <span className="font-mono font-bold text-emerald-800">{orderSuccess.trackingId}</span></div>
              <div><strong>Customer Name:</strong> {orderSuccess.customer.name}</div>
              <div><strong>City:</strong> {orderSuccess.customer.city}</div>
              <div><strong>Payment:</strong> {orderSuccess.paymentMethod.toUpperCase()}</div>
              <div><strong>Total Amount:</strong> Rs. {orderSuccess.grandTotal.toLocaleString()}</div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`https://wa.me/923162323616?text=Salam!%20I%20have%20placed%20order%20%23${orderSuccess.trackingId}%20for%20Rs.%20${orderSuccess.grandTotal}.%20Please%20confirm.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold shadow-sm"
              >
                💬 Confirm on WhatsApp
              </a>
              <Link href={`/track-order?id=${orderSuccess.trackingId}`} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                📍 Track Order Live
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="site-container my-8 flex-1">
        <h1 className="text-xl font-black text-[#00363d] mb-6">Checkout Desk (Direct Factory Dispatch)</h1>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Customer Info & Payment */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b pb-2">1. Shipping Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Muhammad Ali"
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#007382]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="03001234567"
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#007382]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Karachi, Lahore, Faisalabad, Islamabad..."
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#007382]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Street Address *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House #, Street #, Sector, Area landmark..."
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#007382]"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b pb-2">2. Payment Method</h2>

              <div className="space-y-3">
                {/* Option 1: Cash on Delivery */}
                <label className={`block p-3.5 rounded-xl border cursor-pointer transition ${paymentMethod === 'cod' ? 'border-[#007382] bg-teal-50/50 ring-1 ring-[#007382]' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="text-[#007382]"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">💵 Cash on Delivery (COD)</div>
                      <div className="text-[11px] text-slate-500">Pay cash directly to courier at your doorstep across Pakistan.</div>
                    </div>
                  </div>
                </label>

                {/* Option 2: EasyPaisa */}
                <label className={`block p-3.5 rounded-xl border cursor-pointer transition ${paymentMethod === 'easypaisa' ? 'border-[#007382] bg-teal-50/50 ring-1 ring-[#007382]' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'easypaisa'}
                      onChange={() => setPaymentMethod('easypaisa')}
                      className="text-[#007382]"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800">📱 EasyPaisa (Direct Transfer)</div>
                      <div className="text-[11px] text-emerald-800 font-semibold mt-1 bg-emerald-100/60 p-2 rounded-lg">
                        <strong>EasyPaisa Number:</strong> 0333-7221552<br />
                        <strong>Account Title:</strong> Muhammad Jamalullah
                      </div>
                    </div>
                  </div>
                </label>

                {/* Option 3: Faysal Bank */}
                <label className={`block p-3.5 rounded-xl border cursor-pointer transition ${paymentMethod === 'bank' ? 'border-[#007382] bg-teal-50/50 ring-1 ring-[#007382]' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                      className="text-[#007382]"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800">🏦 Faysal Bank (Online Transfer)</div>
                      <div className="text-[11px] text-slate-700 font-semibold mt-1 bg-slate-100 p-2 rounded-lg">
                        <strong>Bank Name:</strong> Faysal Bank<br />
                        <strong>Account Title:</strong> Muhammad Jamalullah<br />
                        <strong>Account Number:</strong> 3516390000005787
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-6">
              <h2 className="text-sm font-bold text-slate-800 border-b pb-2">Order Summary ({cart.length} items)</h2>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50">
                    <div className="flex-1 truncate mr-2">
                      <span className="font-bold text-slate-800">{item.title}</span>
                      <span className="text-slate-400"> × {item.qty}</span>
                    </div>
                    <span className="font-bold text-[#007382]">Rs. {(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2 border-t text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Courier Delivery:</span>
                  <span className="font-bold">{shipping === 0 ? 'FREE' : `Rs. ${shipping}`}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t">
                  <span>Total Amount:</span>
                  <span className="text-[#007382]">Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3.5 bg-[#007382] hover:bg-[#005a66] disabled:bg-slate-300 text-white rounded-xl text-xs font-black shadow-md transition"
              >
                {isSubmitting ? 'Processing Order...' : 'Confirm Order (Place Order Now)'}
              </button>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
