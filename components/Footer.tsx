'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-grid">
          <div className="footer-col">
            <Link href="/" style={{ display: 'inline-block' }}>
              <img src="/images/save-and-smile-logo.png" alt="Save & Smile" className="footer-brand-logo" />
            </Link>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1rem' }}>
              Pakistan's trusted online wholesale portal for trending gadgets, kitchen organizers, smart watches, and home solutions. Providing best reseller margins and doorstep Cash on Delivery across Pakistan.
            </p>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>📞 <strong>Helpline &amp; WhatsApp:</strong> 0316-2323616</div>
              <div>✉️ <strong>Email:</strong> info@saveandsmile.pk</div>
              <div>📍 <strong>Dispatch Center:</strong> Karachi &amp; Lahore, Pakistan</div>
            </div>
          </div>

          <div className="footer-col">
            <h4>Popular Categories</h4>
            <ul className="footer-links">
              <li><a href="/#products">Storage &amp; Racks</a></li>
              <li><a href="/#products">Smart Watches</a></li>
              <li><a href="/#products">Mug &amp; Bottles</a></li>
              <li><a href="/#products">Insect Killers</a></li>
              <li><a href="/#products">Mobile Accessories</a></li>
              <li><a href="/#products">Electric Massagers</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Customer Care</h4>
            <ul className="footer-links">
              <li><Link href="/track-order">Track Your Order</Link></li>
              <li><a href="https://wa.me/923162323616" target="_blank" rel="noopener noreferrer">Wholesale Bulk Inquiries</a></li>
              <li><a href="/#flashSale">Flash Deals</a></li>
              <li><Link href="/cart">View My Cart</Link></li>
              <li><a href="https://wa.me/923162323616" target="_blank" rel="noopener noreferrer">Return &amp; Refund Policy</a></li>
              <li><a href="https://wa.me/923162323616" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>&copy; {new Date().getFullYear()} Save &amp; Smile (Shop • Save • Smile). All rights reserved.</div>
          <div className="footer-security-tags">
            <span>🔒 SSL 256-Bit Encrypted</span>
            <span>📦 Nationwide COD Service</span>
            <span>✅ 7 Days Checking Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
