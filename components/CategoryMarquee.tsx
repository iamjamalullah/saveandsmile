'use client';

import React from 'react';

const CATEGORIES_STRIP = [
  { id: "storage", name: "Storage & Racks", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c8298306c.png", count: 142 },
  { id: "kitchen", name: "Kitchen Gadgets", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c83c8a82f.png", count: 98 },
  { id: "electronics", name: "Electronic Items", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c9bf916b9.png", count: 215 },
  { id: "smartwatches", name: "Smart Watches", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c8156be86.png", count: 64 },
  { id: "bottles", name: "Mugs & Bottles", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c804cf28a.png", count: 76 },
  { id: "beauty", name: "Beauty & Makeup", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c89c75850.png", count: 85 },
  { id: "insect-killers", name: "Insect Killers", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c7d25edb7.png", count: 32 },
  { id: "accessories", name: "Mobile Accessories", icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c7db87df3.png", count: 120 }
];

interface CategoryMarqueeProps {
  onSelectCategory?: (catId: string) => void;
}

export default function CategoryMarquee({ onSelectCategory }: CategoryMarqueeProps) {
  function handleClick(catId: string) {
    if (onSelectCategory) {
      onSelectCategory(catId);
    } else {
      window.location.href = `/?cat=${catId}#products`;
    }
  }

  // Duplicate for smooth seamless marquee loop
  const loopList = [...CATEGORIES_STRIP, ...CATEGORIES_STRIP];

  return (
    <section className="cat-strip-section" id="shopSliderSection">
      <div className="site-container">
        <h2 className="cat-section-title">Shop By Categories</h2>
        <div className="cat-marquee-wrapper">
          <div className="cat-marquee-track" id="categoryStrip">
            {loopList.map((cat, idx) => (
              <div
                key={`${cat.id}-${idx}`}
                className="cat-marquee-item cursor-pointer"
                onClick={() => handleClick(cat.id)}
              >
                <div className="cat-icon-round">
                  <img src={cat.icon} alt={cat.name} />
                </div>
                <span className="cat-name">{cat.name}</span>
                <span className="cat-count">{cat.count} Items</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
