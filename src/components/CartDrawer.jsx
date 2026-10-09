import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function CartDrawer() {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    updateCartQty, 
    removeFromCart, 
    cartSubtotal, 
    shippingFee, 
    isFreeShipping, 
    cartGrandTotal, 
    storeConfig,
    checkoutViaWhatsApp 
  } = useStore();

  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const freeShippingThreshold = storeConfig.freeShippingThreshold || 3000;
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));
  const amountNeeded = Math.max(0, freeShippingThreshold - cartSubtotal);

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleViewCart = () => {
    setIsCartOpen(false);
    navigate('/cart');
  };

  return (
    <>
      <div 
        className="cart-drawer-overlay active" 
        id="cartDrawerOverlay" 
        onClick={() => setIsCartOpen(false)}
      />
      
      <div className="cart-drawer open" id="cartDrawer">
        <div className="drawer-header">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Shopping Cart ({cart.reduce((s, i) => s + i.qty, 0)})
          </h3>
          <button className="drawer-close-btn" onClick={() => setIsCartOpen(false)}>✕</button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="free-shipping-progress">
          <div id="freeShippingText">
            {isFreeShipping ? (
              <span style={{ color: '#16a34a', fontWeight: 800 }}>🎉 You unlocked FREE Delivery!</span>
            ) : (
              `Add Rs. ${amountNeeded.toLocaleString()} for FREE Delivery`
            )}
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              id="freeShippingBar"
              style={{ width: `${progressPercent}%`, background: isFreeShipping ? '#16a34a' : 'linear-gradient(90deg, #008FAF, #10b981)' }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="drawer-body" id="cartDrawerItems">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
              <h4 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>Your cart is empty</h4>
              <p style={{ fontSize: '0.85rem' }}>Browse our catalog and add items to your cart.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-drawer-item">
                <img src={item.image} alt={item.title} className="cart-drawer-thumb" />
                <div className="cart-drawer-info">
                  <h4 className="cart-drawer-title">{item.title}</h4>
                  <div className="cart-drawer-price">
                    {storeConfig.currency || 'Rs.'} {item.price.toLocaleString()}
                  </div>
                  <div className="cart-drawer-qty-controls">
                    <button className="qty-btn" onClick={() => updateCartQty(item.id, -1)}>-</button>
                    <span className="qty-val">{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateCartQty(item.id, 1)}>+</button>
                  </div>
                </div>
                <button className="cart-item-remove" onClick={() => removeFromCart(item.id)} title="Remove Item">
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {/* Summary & Checkout Buttons */}
        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="summary-line">
              <span>Subtotal:</span>
              <strong id="cartSubtotal">{storeConfig.currency || 'Rs.'} {cartSubtotal.toLocaleString()}</strong>
            </div>
            <div className="summary-line">
              <span>Standard Shipping:</span>
              <strong id="cartShipping">
                {shippingFee === 0 ? (
                  <span style={{ color: '#16a34a' }}>FREE</span>
                ) : (
                  `${storeConfig.currency || 'Rs.'} ${shippingFee}`
                )}
              </strong>
            </div>
            <div className="summary-line total">
              <span>Total Payable:</span>
              <span id="cartTotal">{storeConfig.currency || 'Rs.'} {cartGrandTotal.toLocaleString()}</span>
            </div>

            <div className="drawer-actions">
              <button className="btn-checkout" onClick={handleCheckout}>
                💳 Proceed to Checkout
              </button>
              <button 
                className="btn-checkout" 
                onClick={handleViewCart} 
                style={{ background: '#f1f5f9', color: '#1e293b', border: '1.5px solid #cbd5e1', boxShadow: 'none' }}
              >
                🛒 View Full Cart Page
              </button>
              <button className="btn-whatsapp-order" onClick={checkoutViaWhatsApp}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Quick Order via WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
