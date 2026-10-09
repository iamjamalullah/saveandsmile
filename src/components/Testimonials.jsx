import React from 'react';
import { useStore } from '../context/StoreContext';

export default function Testimonials() {
  const { reviews } = useStore();

  // Duplicate for smooth continuous marquee lane
  const displayReviews = [...reviews, ...reviews];

  return (
    <section className="testimonials-section" id="testimonialsSection">
      <div className="site-container">
        <div className="section-head-center">
          <span className="kicker-badge">FEEDBACK</span>
          <h2>What Our Clients Say</h2>
          <p>Real stories and verified reviews from our valued wholesale customers across Pakistan</p>
        </div>

        {/* Reviews Track */}
        <div className="reviews-marquee-lane">
          <div className="reviews-track" id="reviewsTrack">
            {displayReviews.map((rv, idx) => (
              <article key={`${rv.name}-${idx}`} className="home-review-card">
                <div className="home-review-top">
                  <div className="rv-avatar" style={{ background: rv.color }}>{rv.initial}</div>
                  <div>
                    <div className="home-review-name">{rv.name}</div>
                    <div className="home-review-rating">
                      <span className="rating-stars">★★★★★</span>
                      <span className="rv-verified">✓ Verified</span>
                    </div>
                  </div>
                </div>
                <div className="review-inner-content">
                  <div className="home-review-title">{rv.title}</div>
                  <p className="home-review-text">"{rv.text}"</p>
                </div>
                <div className="home-review-footer">
                  <span className="home-review-date">{rv.date}</span>
                  <span className="home-review-purchase">Verified Purchase</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
