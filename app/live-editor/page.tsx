'use client';

import React from 'react';

export default function LiveEditorPage() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, overflow: 'hidden', background: '#0f172a' }}>
      <iframe
        src="/live-editor.html"
        title="Live Homepage Section & Banner Customizer"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  );
}
