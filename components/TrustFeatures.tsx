'use client';

import React from 'react';

interface TrustFeaturesProps {
  config?: {
    badge1_title?: string;
    badge1_desc?: string;
    badge2_title?: string;
    badge2_desc?: string;
    badge3_title?: string;
    badge3_desc?: string;
    badge4_title?: string;
    badge4_desc?: string;
  };
}

export default function TrustFeatures({ config }: TrustFeaturesProps = {}) {
  const b1Title = config?.badge1_title || "Support 24/7";
  const b1Desc = config?.badge1_desc || "Direct WhatsApp & Call wholesale assistance";

  const b2Title = config?.badge2_title || "Best Prices";
  const b2Desc = config?.badge2_desc || "Direct factory prices for bulk & retail";

  const b3Title = config?.badge3_title || "Secure Payment";
  const b3Desc = config?.badge3_desc || "Cash on delivery & verified digital transfers";

  const b4Title = config?.badge4_title || "7 Days Replacement";
  const b4Desc = config?.badge4_desc || "Hassle-free product verification & exchange";

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
              <h4>{b1Title}</h4>
              <p>{b1Desc}</p>
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
              <h4>{b2Title}</h4>
              <p>{b2Desc}</p>
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
              <h4>{b3Title}</h4>
              <p>{b3Desc}</p>
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
              <h4>{b4Title}</h4>
              <p>{b4Desc}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

