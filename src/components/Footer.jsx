import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function Footer() {
  const { storeConfig, setCurrentCategory, setIsWishlistOpen } = useStore();
  const navigate = useNavigate();

  const handleCategoryFilter = (catId) => {
    setCurrentCategory(catId);
    const el = document.getElementById('products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#products');
    }
  };

  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-grid">
          
          {/* Column 1: Brand & Contact Info */}
          <div className="footer-col">
            <Link to="/" style={{ display: 'inline-block' }}>
              <img 
                src={storeConfig.logo || "images/save-and-smile-logo.png"} 
                alt="Save & Smile" 
                className="footer-brand-logo" 
              />
            </Link>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.7', marginBottom: '1rem' }}>
              Pakistan's trusted online wholesale portal for trending gadgets, kitchen organizers, smart watches, and home solutions. Providing best reseller margins and doorstep Cash on Delivery across Pakistan.
            </p>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>📞 <strong>Helpline &amp; WhatsApp:</strong> {storeConfig.phone || '0316-2323616'}</div>
              <div>✉️ <strong>Email:</strong> {storeConfig.email || 'info@saveandsmile.pk'}</div>
              <div>📍 <strong>Dispatch Center:</strong> {storeConfig.address || 'Karachi & Lahore, Pakistan'}</div>
            </div>
          </div>

          {/* Column 2: Popular Categories */}
          <div className="footer-col">
            <h4>Popular Categories</h4>
            <ul className="footer-links">
              <li><a href="#products" onClick={() => handleCategoryFilter('storage')}>Storage &amp; Racks</a></li>
              <li><a href="#products" onClick={() => handleCategoryFilter('smartwatches')}>Smart Watches</a></li>
              <li><a href="#products" onClick={() => handleCategoryFilter('bottles')}>Mug &amp; Bottles</a></li>
              <li><a href="#products" onClick={() => handleCategoryFilter('insect-killers')}>Insect Killers</a></li>
              <li><a href="#products" onClick={() => handleCategoryFilter('accessories')}>Mobile Accessories</a></li>
              <li><a href="#products" onClick={() => handleCategoryFilter('massager')}>Electric Massagers</a></li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="footer-col">
            <h4>Customer Care</h4>
            <ul className="footer-links">
              <li><Link to="/track">Track Your Order</Link></li>
              <li><a href={`https://wa.me/${storeConfig.whatsapp || '923162323616'}`} target="_blank" rel="noreferrer">Wholesale Bulk Inquiries</a></li>
              <li><a href="#flashSale">Flash Deals</a></li>
              <li><a href="javascript:void(0)" onClick={() => setIsWishlistOpen(true)}>My Wishlist</a></li>
              <li><a href={`https://wa.me/${storeConfig.whatsapp || '923162323616'}?text=Salam!%20I%20have%20a%20question%20about%20Returns.`} target="_blank" rel="noreferrer">Return &amp; Refund Policy</a></li>
              <li><a href={`https://wa.me/${storeConfig.whatsapp || '923162323616'}`} target="_blank" rel="noreferrer">Terms &amp; Conditions</a></li>
            </ul>
          </div>

          {/* Column 4: Payment Methods */}
          <div className="footer-col">
            <h4>Wholesale Payment Methods</h4>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.6' }}>
              We accept Cash on Delivery (COD) across Pakistan, plus online direct transfers via JazzCash, EasyPaisa, and Bank Accounts.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>Cash On Delivery</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>JazzCash</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>EasyPaisa</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>Bank Transfer</span>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <div>
            © 2026 Save &amp; Smile (Shop • Save • Smile). All Rights Reserved.
          </div>
          <div>
            Direct Wholesale Marketplace in Pakistan • {storeConfig.phone || '0316-2323616'}
          </div>
        </div>
      </div>
    </footer>
  );
}
