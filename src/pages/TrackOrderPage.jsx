import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('id') || searchParams.get('track') || searchParams.get('orderId') || '';
  const [orderQuery, setOrderQuery] = useState(initialOrderId);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const { storeConfig } = useStore();

  const lookupOrder = (q) => {
    const cleanQ = (q || '').trim().toUpperCase();
    if (!cleanQ) return;

    const placedOrders = JSON.parse(localStorage.getItem('qadri_placed_orders')) || [];
    const found = placedOrders.find(o => 
      (o.orderId && o.orderId.toUpperCase() === cleanQ) || 
      (o.trackingNumber && o.trackingNumber.toUpperCase() === cleanQ) ||
      (o.customerPhone && o.customerPhone.includes(cleanQ))
    );

    if (found) {
      setTrackedOrder(found);
    } else {
      // Mock tracking state for valid demonstration
      setTrackedOrder({
        orderId: cleanQ.startsWith('SS-') ? cleanQ : `SS-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: 'Valued Customer',
        customerCity: 'Karachi / Lahore',
        customerAddress: 'Registered Delivery Address, Pakistan',
        paymentMethod: 'Cash on Delivery (COD)',
        status: 'In Transit',
        courier: 'Leopards Courier Service',
        trackingNumber: 'LEOP-' + Math.floor(100000 + Math.random() * 900000),
        createdAt: new Date().toISOString(),
        grandTotal: 1850,
        items: [
          { title: 'Multipurpose Kitchen Bathroom Storage Rack', qty: 1, price: 180 },
          { title: 'Ultra 8 Smart Watch with Wireless Charger', qty: 1, price: 1450 }
        ]
      });
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      lookupOrder(initialOrderId);
    }
  }, [initialOrderId]);

  const handleSearch = (e) => {
    e.preventDefault();
    lookupOrder(orderQuery);
  };

  const stages = [
    { title: 'Order Placed', desc: 'Order details verified and confirmed', key: 'Placed' },
    { title: 'Packed & Processing', desc: 'Quality checked and dispatched to hub', key: 'Processing' },
    { title: 'In Transit', desc: 'Handed over to Leopards / TCS courier', key: 'In Transit' },
    { title: 'Out for Delivery', desc: 'Rider is out with your parcel', key: 'Out' },
    { title: 'Delivered', desc: 'Payment received at doorstep', key: 'Delivered' }
  ];

  return (
    <>
      <Header />

      {/* Hero Search */}
      <section className="track-hero" style={{ background: 'linear-gradient(135deg, #064C63 0%, #008FAF 100%)', color: 'white', padding: '3.5rem 1rem 3rem 1rem', textAlign: 'center' }}>
        <div className="site-container">
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🚚 Nationwide Courier Tracking
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '12px', marginBottom: '8px' }}>
            Track Your Wholesale Order
          </h1>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', maxWidth: '550px', margin: '0 auto' }}>
            Enter your Save &amp; Smile Order ID (e.g. <strong>SS-100245</strong>) or Courier Tracking # to see live parcel progress.
          </p>

          <form onSubmit={handleSearch} style={{ maxWidth: '650px', margin: '1.5rem auto 0 auto', background: 'white', borderRadius: '14px', padding: '8px', display: 'flex', gap: '8px', boxShadow: '0 14px 30px rgba(0,0,0,0.18)' }}>
            <input 
              type="text" 
              placeholder="Enter Order ID (e.g. SS-492104) or Mobile Number..." 
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              style={{ flex: 1, border: 'none', padding: '14px 18px', fontSize: '1rem', fontWeight: 600, color: '#0f172a', outline: 'none' }}
            />
            <button 
              type="submit" 
              style={{ background: '#064C63', color: 'white', fontWeight: 800, fontSize: '0.95rem', padding: '14px 28px', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Track Now</span> ➔
            </button>
          </form>

          {/* Quick chips */}
          <div style={{ maxWidth: '650px', margin: '1rem auto 0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <span style={{ opacity: 0.8 }}>Try demo orders:</span>
            <button type="button" onClick={() => { setOrderQuery('SS-100482'); lookupOrder('SS-100482'); }} style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '4px 10px', borderRadius: '9999px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600 }}>
              #SS-100482
            </button>
            <button type="button" onClick={() => { setOrderQuery('SS-829104'); lookupOrder('SS-829104'); }} style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '4px 10px', borderRadius: '9999px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600 }}>
              #SS-829104
            </button>
          </div>
        </div>
      </section>

      {/* Tracked Order Result View */}
      {trackedOrder && (
        <main className="site-container" style={{ maxWidth: '820px', margin: '2rem auto 4rem auto', padding: '0 1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tracking Order:</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#064C63' }}>{trackedOrder.orderId}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 800 }}>
                  ● {trackedOrder.status || 'In Transit'}
                </span>
              </div>
            </div>

            {/* Courier details banner */}
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', background: '#fafbfc' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Courier Service:</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{trackedOrder.courier || 'Leopards Courier Service'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Tracking / CN Number:</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#064C63' }}>{trackedOrder.trackingNumber || 'LEOP-849201'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Destination:</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{trackedOrder.customerCity || 'Karachi, PK'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Payment Method:</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#16a34a' }}>{trackedOrder.paymentMethod || 'COD'}</div>
              </div>
            </div>

            {/* Step Timeline */}
            <div style={{ padding: '30px 24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
                Parcel Journey &amp; Milestones
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '32px' }}>
                <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: '#cbd5e1' }} />
                
                {stages.map((stg, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: '-32px', 
                      top: '0', 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      background: idx <= 2 ? '#064C63' : '#e2e8f0', 
                      color: idx <= 2 ? '#fff' : '#64748b',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.72rem', 
                      fontWeight: 800 
                    }}>
                      {idx <= 2 ? '✓' : idx + 1}
                    </div>
                    <div style={{ fontWeight: 800, color: idx <= 2 ? '#0f172a' : '#64748b', fontSize: '0.95rem' }}>
                      {stg.title}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                      {stg.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items summary */}
            {trackedOrder.items && trackedOrder.items.length > 0 && (
              <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  Ordered Products ({trackedOrder.items.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {trackedOrder.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569' }}>
                      <span>• {item.title} (x{item.qty || 1})</span>
                      <strong style={{ color: '#0f172a' }}>{storeConfig.currency || 'Rs.'} {((item.price || 0) * (item.qty || 1)).toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Helpline bar */}
            <div style={{ padding: '16px 24px', background: '#ecfdf5', borderTop: '1px solid #d1fae5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '0.85rem', color: '#065f46' }}>
                Need urgent rider assistance or change of delivery address?
              </div>
              <a 
                href={`https://wa.me/${storeConfig.whatsapp || '923162323616'}?text=Salam!%20Inquiry%20regarding%20Tracking%20Order%20*${trackedOrder.orderId}*`}
                target="_blank" 
                rel="noreferrer"
                style={{ background: '#059669', color: 'white', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.82rem' }}
              >
                💬 WhatsApp Support
              </a>
            </div>

          </div>
        </main>
      )}

      <Footer />
    </>
  );
}
