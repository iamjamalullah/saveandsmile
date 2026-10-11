'use client';

import React, { useRef } from 'react';
import Link from 'next/link';

interface Reel {
  id: number;
  video: string;
  title: string;
  price: number;
  originalPrice: number;
  thumb: string;
  code: string;
}

const REELS_DATA: Reel[] = [
  {
    id: 1,
    video: "https://www.qadrigadgets.pk/images/banners/6aace4c892839.mp4",
    title: "Crystal Hair Eraser Physical Hair Removal Bleame",
    price: 320,
    originalPrice: 950,
    thumb: "https://www.qadrigadgets.pk/images/product_gallery/md_1779099518_ChatGPT_Image_May_18,_2026,_03_18_20_PM.png",
    code: "QGW-1002"
  },
  {
    id: 2,
    video: "https://www.qadrigadgets.pk/images/banners/6aace4c89ac9f.mp4",
    title: "T9 Vintage Rechargeable Hair & Beard Trimmer Clipper",
    price: 850,
    originalPrice: 1650,
    thumb: "https://www.qadrigadgets.pk/images/product_gallery/sm_1781254714_ChatGPT_Image_Jun_12,_2026,_10_58_32_AM.png",
    code: "QGW-2764"
  },
  {
    id: 3,
    video: "https://www.qadrigadgets.pk/images/banners/6aace4c89f68c.mp4",
    title: "Fighter Plane Remote Control Aircraft LED Lights",
    price: 2250,
    originalPrice: 3200,
    thumb: "https://www.qadrigadgets.pk/images/product_gallery/sm_1780914418_ChatGPT_Image_Jun_8,_2026,_03_26_26_PM.png",
    code: "QGW-2226"
  },
  {
    id: 4,
    video: "https://www.qadrigadgets.pk/images/banners/6aace4c8a30fd.mp4",
    title: "Professional Triangle Mop 360 Rotatable Spin Mop",
    price: 600,
    originalPrice: 1350,
    thumb: "https://www.qadrigadgets.pk/images/product_gallery/sm_1780384460_ChatGPT_Image_Jun_2,_2026,_12_13_13_PM.png",
    code: "QGW-1052"
  },
  {
    id: 5,
    video: "https://www.qadrigadgets.pk/images/banners/6aace4c8a8146.mp4",
    title: "Electric Mini Fabric Shaver & Lint Remover",
    price: 850,
    originalPrice: 1800,
    thumb: "https://www.qadrigadgets.pk/images/product_gallery/md_1779176038_May_19,_2026,_12_33_14_PM.png",
    code: "QGW-1088"
  }
];

export default function VideoReels() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: number) {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
    }
  }

  return (
    <section className="reels-section" id="HomePageReels">
      <div className="site-container">
        <div className="qadri-reels-head flex items-center justify-between mb-4">
          <div>
            <span className="qadri-reels-kicker text-xs uppercase font-extrabold tracking-wider text-[#007382]">IN MOTION</span>
            <h2 className="qadri-reels-title text-xl font-black text-slate-900 mt-0.5">Watch &amp; Shop</h2>
          </div>
          <div className="qadri-reels-nav flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
              aria-label="Previous videos"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
              aria-label="Next videos"
            >
              ›
            </button>
          </div>
        </div>

        {/* Video Reels Track */}
        <div ref={trackRef} className="reels-track flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x" id="reelsTrack">
          {REELS_DATA.map(reel => (
            <article key={reel.id} className="qadri-reel-card min-w-[220px] max-w-[240px] rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm shrink-0 snap-start">
              <div className="qadri-reel-media relative aspect-[9/16] bg-slate-950">
                <video
                  src={reel.video}
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                  onClick={(e) => {
                    const vid = e.target as HTMLVideoElement;
                    if (vid.paused) vid.play().catch(() => {});
                    else vid.pause();
                  }}
                  className="w-full h-full object-cover cursor-pointer"
                />
              </div>
              <Link href={`/product-detail?id=${reel.id}`} className="qadri-reel-product p-3 flex items-center gap-2.5 hover:bg-slate-50 transition block">
                <img className="qadri-reel-thumb w-12 h-12 object-cover rounded-lg border border-slate-200" src={reel.thumb} alt={reel.title} />
                <div className="qadri-reel-info min-w-0 flex-1">
                  <p className="qadri-reel-pname text-xs font-bold text-slate-800 truncate">{reel.title}</p>
                  <div className="qadri-reel-prices flex items-baseline gap-1.5 mt-0.5">
                    <span className="qadri-reel-was text-[10px] text-slate-400 line-through">Rs. {reel.originalPrice.toLocaleString()}</span>
                    <span className="qadri-reel-now text-xs font-black text-[#007382]">Rs. {reel.price.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
