import React from 'react';

export default function TrustFeatures() {
  return (
    <section className="trust-features-section" id="HomePageFooterIcons">
      <div className="site-container">
        <div className="trust-features-grid">
          
          <div className="trust-feature-card support">
            <div className="trust-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
            </div>
            <div className="trust-feature-text">
              <h4>Support 24/7</h4>
              <p>Direct WhatsApp &amp; Call wholesale assistance</p>
            </div>
          </div>

          <div className="trust-feature-card prices">
            <div className="trust-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </div>
            <div className="trust-feature-text">
              <h4>Best Prices</h4>
              <p>Direct factory prices for bulk &amp; retail</p>
            </div>
          </div>

          <div className="trust-feature-card payment">
            <div className="trust-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
            </div>
            <div className="trust-feature-text">
              <h4>Secure Payment</h4>
              <p>Cash on delivery &amp; verified digital transfers</p>
            </div>
          </div>

          <div className="trust-feature-card warranty">
            <div className="trust-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </div>
            <div className="trust-feature-text">
              <h4>7 Days Replacement</h4>
              <p>Hassle-free product verification &amp; exchange</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
