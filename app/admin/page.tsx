'use client';

import React from 'react';

export default function AdminPage() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', zIndex: 99999 }}>
      <iframe
        src="/admin-dashboard"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Save & Smile Live Admin Dashboard"
      />
    </div>
  );
}
