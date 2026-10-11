'use client';

import React from 'react';

interface Review {
  name: string;
  initial: string;
  color: string;
  stars: number;
  title: string;
  text: string;
  date: string;
}

const REVIEWS_DATA: Review[] = [
  {
    name: "Luqman",
    initial: "L",
    color: "#ea580c",
    stars: 5,
    title: "Good",
    text: "Everything is good and high quality I am very satisfy with wholesale rate and prompt response.",
    date: "22 Sep 2026"
  },
  {
    name: "Fami Rizwan",
    initial: "F",
    color: "#16a34a",
    stars: 5,
    title: "Very useful product good qualities",
    text: "Eyebrow trimmer and pedicure floris and face massager my best experience or product, will order again.",
    date: "21 Sep 2026"
  },
  {
    name: "Mohsin Ali",
    initial: "M",
    color: "#0891b2",
    stars: 5,
    title: "Wholesale delivery on time in Lahore",
    text: "Ordered corner racks and shoe bags in bulk for my retail store. Lowest price in Pakistan and solid packing.",
    date: "19 Sep 2026"
  },
  {
    name: "Sarah Khan",
    initial: "S",
    color: "#7c3aed",
    stars: 5,
    title: "Original smart watches and trimmers",
    text: "Products exactly matched the pictures and video demos. Fast Cash on Delivery in Islamabad within 2 days.",
    date: "15 Sep 2026"
  },
  {
    name: "Tariq Mehmood",
    initial: "T",
    color: "#e11d48",
    stars: 5,
    title: "Highly recommended wholesale supplier",
    text: "Bought mosquito killer rackets and jewelry boxes. Excellent wholesale margins for resellers.",
    date: "10 Sep 2026"
  }
];

export default function Reviews() {
  return (
    <section className="testimonials-section py-10 bg-slate-100" id="testimonialsSection">
      <div className="site-container">
        <div className="section-head-center text-center max-w-xl mx-auto mb-8">
          <span className="kicker-badge text-xs font-black uppercase tracking-wider text-[#007382]">FEEDBACK</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">What Our Clients Say</h2>
          <p className="text-xs text-slate-500 mt-1">Real stories and verified reviews from our valued wholesale customers across Pakistan</p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" id="reviewsTrack">
          {REVIEWS_DATA.map((rv, index) => (
            <article key={index} className="home-review-card bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="home-review-top flex items-center gap-2.5 mb-3">
                  <div
                    className="rv-avatar w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                    style={{ background: rv.color }}
                  >
                    {rv.initial}
                  </div>
                  <div>
                    <div className="home-review-name text-xs font-bold text-slate-800">{rv.name}</div>
                    <div className="home-review-rating flex items-center gap-1">
                      <span className="rating-stars text-amber-400 text-xs">★★★★★</span>
                      <span className="rv-verified text-[10px] text-emerald-600 font-semibold">✓ Verified</span>
                    </div>
                  </div>
                </div>
                <div className="review-inner-content">
                  <div className="home-review-title text-xs font-bold text-slate-900 mb-1">{rv.title}</div>
                  <p className="home-review-text text-[11px] text-slate-600 leading-relaxed italic">"{rv.text}"</p>
                </div>
              </div>
              <div className="home-review-footer mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="home-review-date">{rv.date}</span>
                <span className="home-review-purchase font-medium text-slate-500">Verified Purchase</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
