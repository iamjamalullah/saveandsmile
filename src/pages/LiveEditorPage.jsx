import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import HomePage from './HomePage';

export default function LiveEditorPage() {
  const { storeConfig, showToast } = useStore();
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, tablet, mobile
  const [storeName, setStoreName] = useState(storeConfig.name || 'Save & Smile');
  const [tagline, setTagline] = useState(storeConfig.tagline || 'Shop • Save • Smile | Wholesale Gadgets in Pakistan');
  const [phone, setPhone] = useState(storeConfig.phone || '0316-2323616');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(storeConfig.freeShippingThreshold || 3000);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const updated = {
      ...storeConfig,
      name: storeName,
      tagline: tagline,
      phone: phone,
      freeShippingThreshold: Number(freeShippingThreshold)
    };
    localStorage.setItem('qadri_store_config', JSON.stringify(updated));
    showToast('Store settings saved successfully! 🚀');
  };

  const getCanvasWidth = () => {
    if (previewMode === 'mobile') return '390px';
    if (previewMode === 'tablet') return '768px';
    return '100%';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#0f172a', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Left Control Panel */}
      <aside style={{ width: '320px', background: '#1e293b', color: '#fff', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#38bdf8' }}>🎨 Live Page Builder</h2>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Visual Theme Customizer</div>
          </div>
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}>
            ✕ Exit
          </Link>
        </div>

        {/* Builder Form */}
        <form onSubmit={handleSaveSettings} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Store Brand Name
            </label>
            <input 
              type="text" 
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Store Tagline
            </label>
            <input 
              type="text" 
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              WhatsApp &amp; Call Helpline
            </label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Free Delivery Threshold (Rs.)
            </label>
            <input 
              type="number" 
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.8rem', color: '#94a3b8' }}>
            💡 <strong>Instant Preview:</strong> Changes made here reflect live in the right canvas and apply store-wide.
          </div>

          <button 
            type="submit" 
            style={{ marginTop: 'auto', background: '#008FAF', color: '#fff', padding: '14px', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.92rem' }}
          >
            💾 Publish Changes
          </button>
        </form>
      </aside>

      {/* Right Canvas Area with Responsive Switcher */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#020617', overflow: 'hidden' }}>
        
        {/* Device Switcher Bar */}
        <div style={{ padding: '10px 20px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button 
            onClick={() => setPreviewMode('desktop')}
            style={{ background: previewMode === 'desktop' ? '#008FAF' : '#1e293b', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            🖥️ Desktop (1440px)
          </button>
          <button 
            onClick={() => setPreviewMode('tablet')}
            style={{ background: previewMode === 'tablet' ? '#008FAF' : '#1e293b', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            📱 Tablet (768px)
          </button>
          <button 
            onClick={() => setPreviewMode('mobile')}
            style={{ background: previewMode === 'mobile' ? '#008FAF' : '#1e293b', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            📲 Mobile (390px)
          </button>
        </div>

        {/* Live Canvas Frame */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: previewMode === 'desktop' ? '0' : '20px' }}>
          <div style={{ 
            width: getCanvasWidth(), 
            background: '#fff', 
            borderRadius: previewMode === 'desktop' ? '0' : '16px', 
            overflow: 'auto',
            boxShadow: previewMode === 'desktop' ? 'none' : '0 20px 50px rgba(0,0,0,0.5)',
            border: previewMode === 'desktop' ? 'none' : '2px solid #334155'
          }}>
            <HomePage />
          </div>
        </div>

      </main>

    </div>
  );
}
