import React from 'react';

export default function AnnouncementBar() {
  return (
    <div className="ticker-bar" id="tickerSection">
      <div className="site-container" style={{ overflow: 'hidden', width: '100%' }}>
        <div className="ticker-track" id="tickerTrack">
          <div className="ticker-item">
            🚀 Welcome to <strong>Save &amp; Smile Wholesale Portal</strong> (Shop • Save • Smile)
          </div>
          <div className="ticker-item">
            🔥 Direct Factory Wholesale Rates in Pakistan — Guaranteed Margin for Resellers
          </div>
          <div className="ticker-item">
            🚚 Cash on Delivery (COD) Nationwide | Free Delivery Above Rs. 3,000
          </div>
          <div className="ticker-item">
            📞 24/7 Helpline &amp; WhatsApp: <strong>0316-2323616</strong>
          </div>
          {/* Loop Items for smooth continuous marquee */}
          <div className="ticker-item">
            🚀 Welcome to <strong>Save &amp; Smile Wholesale Portal</strong> (Shop • Save • Smile)
          </div>
          <div className="ticker-item">
            🔥 Direct Factory Wholesale Rates in Pakistan — Guaranteed Margin for Resellers
          </div>
          <div className="ticker-item">
            🚚 Cash on Delivery (COD) Nationwide | Free Delivery Above Rs. 3,000
          </div>
          <div className="ticker-item">
            📞 24/7 Helpline &amp; WhatsApp: <strong>0316-2323616</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
