'use client';

import React from 'react';

export default function AdminPage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <iframe
        src="/admin.html"
        title="Save & Smile Wholesale Admin Suite"
        className="w-full h-full border-none"
      />
    </div>
  );
}
