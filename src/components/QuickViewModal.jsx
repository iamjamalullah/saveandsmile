import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function QuickViewModal() {
  const { quickViewProduct, setQuickViewProduct, addToCart, storeConfig } = useStore();
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();

  if (!quickViewProduct) return null;

  const product = quickViewProduct;

  const handleAddToCart = () => {
    addToCart(product, qty);
    setQuickViewProduct(null);
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    setQuickViewProduct(null);
    navigate('/checkout');
  };

  return (
    <div 
      className="modal-overlay active" 
      id="genericModal"
      onClick={(e) => {
        if (e.target.id === 'genericModal') setQuickViewProduct(null);
      }}
    >
      <div className="modal-content-card" style={{ maxWidth: '780px', width: '92%' }}>
        <button className="modal-close-btn" onClick={() => setQuickViewProduct(null)}>✕</button>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'center' }}>
          
          {/* Image */}
          <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '12px', textAlign: 'center' }}>
            <img 
              src={product.image} 
              alt={product.title} 
              style={{ maxHeight: '320px', width: '100%', objectFit: 'contain', borderRadius: '12px' }} 
            />
          </div>

          {/* Details */}
          <div>
            {product.badge && (
              <span className="product-badge" style={{ position: 'static', display: 'inline-block', marginBottom: '8px' }}>
                {product.badge}
              </span>
            )}
            
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginBottom: '8px' }}>
              {product.title}
            </h2>

            {product.code && (
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '12px', fontWeight: 600 }}>
                Item Code: <span style={{ color: '#064C63' }}>{product.code}</span>
              </div>
            )}

            <div className="product-pricing" style={{ marginBottom: '14px' }}>
              {product.originalPrice && (
                <span className="original-price" style={{ fontSize: '1rem' }}>
                  {storeConfig.currency || 'Rs.'} {product.originalPrice.toLocaleString()}
                </span>
              )}
              <span className="wholesale-price" style={{ fontSize: '1.4rem' }}>
                {storeConfig.currency || 'Rs.'} {product.price.toLocaleString()}
              </span>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
              {product.description || 'Premium quality wholesale gadget with guaranteed reseller margin. Cash on delivery available nationwide across Pakistan.'}
            </p>

            {/* Quantity Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Quantity:</span>
              <div className="cart-drawer-qty-controls" style={{ display: 'inline-flex' }}>
                <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(qty + 1)}>+</button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className="btn-add-cart" 
                onClick={handleAddToCart}
                style={{ flex: 1, padding: '12px' }}
              >
                Add to Cart
              </button>
              <button 
                className="btn-buy-now" 
                onClick={handleBuyNow}
                style={{ flex: 1, padding: '12px' }}
              >
                Buy Now
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
