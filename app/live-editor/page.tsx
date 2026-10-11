'use client';

import React from 'react';

export default function LiveEditorPage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <iframe
        src="/live-editor.html"
        title="Live Homepage Section & Banner Customizer"
        className="w-full h-full border-none"
      />
    </div>
  );
}
