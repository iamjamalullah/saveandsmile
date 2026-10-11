'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TrackOrderPage() {
  const [trackingInput, setTrackingInput] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setTrackingInput(id);
      searchOrder(id);
    }
  }, []);

  async function searchOrder(queryId?: string) {
    const query = (queryId || trackingInput).trim();
    if (!query) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/orders?tracking=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.order) {
        setOrderData(data.order);
      } else {
        // Fallback local lookup
        const local = JSON.parse(localStorage.getItem('qadri_orders') || '[]');
        const found = local.find((o: any) =>
          String(o.trackingId || '').toLowerCase() === query.toLowerCase() ||
          String(o.customer?.phone || '').includes(query)
        );
        setOrderData(found || null);
      }
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('qadri_orders') || '[]');
      const found = local.find((o: any) =>
        String(o.trackingId || '').toLowerCase() === query.toLowerCase() ||
        String(o.customer?.phone || '').includes(query)
      );
      setOrderData(found || null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="site-container my-10 flex-1 max-w-xl mx-auto">
        <div className="text-center space-y-2 mb-6">
          <span className="text-4xl">🚚</span>
          <h1 className="text-xl font-black text-[#00363d]">Track Your Wholesale Order Live</h1>
          <p className="text-xs text-slate-500">Enter your Save &amp; Smile Order Tracking ID (e.g. SNS-100234) or phone number.</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchOrder();
          }}
          className="flex gap-2 mb-6"
        >
          <input
            type="text"
            required
            value={trackingInput}
            onChange={e => setTrackingInput(e.target.value)}
            placeholder="Enter Order ID or WhatsApp Number..."
            className="flex-1 text-xs p-3 bg-white border border-slate-300 rounded-xl outline-none focus:border-[#007382]"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-[#007382] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold shadow-sm"
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </form>

        {searched && !orderData && !loading && (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
            <span className="text-2xl">⚠️</span>
            <p className="text-xs font-bold text-slate-700">No order found with the provided details.</p>
            <p className="text-[11px] text-slate-400">Please double check your Tracking ID or contact our 24/7 WhatsApp helpdesk at 0316-2323616.</p>
          </div>
        )}

        {orderData && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tracking Number</span>
                <div className="text-sm font-mono font-bold text-slate-900">{orderData.trackingId || orderData.id}</div>
              </div>
              <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                ● {orderData.status || 'In Transit'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Customer:</span>
                <div className="font-bold text-slate-800">{orderData.customer?.name || 'Customer'}</div>
              </div>
              <div>
                <span className="text-slate-400">Destination:</span>
                <div className="font-bold text-slate-800">{orderData.customer?.city || 'Pakistan'}</div>
              </div>
              <div>
                <span className="text-slate-400">Payment:</span>
                <div className="font-bold text-slate-800">{(orderData.paymentMethod || 'COD').toUpperCase()}</div>
              </div>
              <div>
                <span className="text-slate-400">Total Bill:</span>
                <div className="font-bold text-[#007382]">Rs. {(orderData.grandTotal || orderData.total || 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <a
                href={`https://wa.me/923162323616?text=Salam!%20I%20want%20to%20inquire%20about%20my%20order%20%23${orderData.trackingId || orderData.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold shadow-sm"
              >
                💬 WhatsApp Delivery Update
              </a>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
