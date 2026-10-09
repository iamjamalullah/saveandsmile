import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import Footer from '../components/Footer';

export default function CartPage() {
  const { 
    cart, 
    updateCartQty, 
    removeFromCart, 
    clearCart, 
    cartSubtotal, 
    shippingFee, 
    isFreeShipping, 
    cartGrandTotal, 
    storeConfig,
    checkoutViaWhatsApp
  } = useStore();

  const navigate = useNavigate();
  const freeShippingThreshold = storeConfig.freeShippingThreshold || 3000;
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));
  const amountNeeded = Math.max(0, freeShippingThreshold - cartSubtotal);

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="header-wrapper">
        <div className="site-container">
          <div className="header-inner">
            <Link to="/" className="brand-logo" title="Save & Smile">
              <img src={storeConfig.logo || "images/save-and-smile-logo.png"} alt="Save & Smile" className="site-brand-logo" />
            </Link>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link to="/" className="action-pill-btn">
                🏠 Continue Shopping
              </Link>
              <Link to="/checkout" className="action-pill-btn" style={{ background: 'rgba(255,255,255,0.35)' }}>
                💳 Checkout
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="site-container">
        <div className="breadcrumb-bar">
          <Link to="/">Home</Link>
          <span>/</span>
          <strong style={{ color: '#0f172a' }}>Shopping Cart</strong>
        </div>
      </div>

      <main className="site-container" style={{ flex: 1, paddingBottom: '3rem' }}>
        <div className="cart-page-layout">
          
          {/* Left: Full Cart Table */}
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '12px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Your Cart Items</h1>
              {cart.length > 0 && (
                <button 
                  className="action-pill-btn" 
                  style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', fontSize: '0.82rem', cursor: 'pointer' }} 
                  onClick={clearCart}
                >
                  🗑️ Clear Cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛒</div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Your shopping cart is currently empty</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Looks like you haven't added any wholesale gadgets yet.</p>
                <Link to="/#products" className="btn-buy-now" style={{ display: 'inline-block', padding: '12px 28px' }}>
                  Explore All Products ➔
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Subtotal</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody id="cartTableBody">
                    {cart.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={item.image} alt={item.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{item.title}</div>
                              {item.code && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Item Code: {item.code}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {storeConfig.currency || 'Rs.'} {item.price.toLocaleString()}
                        </td>
                        <td>
                          <div className="cart-drawer-qty-controls" style={{ display: 'inline-flex' }}>
                            <button className="qty-btn" onClick={() => updateCartQty(item.id, -1)}>-</button>
                            <span className="qty-val">{item.qty}</span>
                            <button className="qty-btn" onClick={() => updateCartQty(item.id, 1)}>+</button>
                          </div>
                        </td>
                        <td style={{ fontWeight: 800, color: '#064C63' }}>
                          {storeConfig.currency || 'Rs.'} {(item.price * item.qty).toLocaleString()}
                        </td>
                        <td>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.85rem' }}
                            title="Remove item"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <Link to="/#products" className="tab-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                ← Continue Browsing Gadgets
              </Link>
            </div>
          </div>

          {/* Right: Summary Card */}
          {cart.length > 0 && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: 'var(--card-shadow)', height: 'fit-content' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '10px' }}>
                Cart Summary
              </h2>

              {/* Free shipping alert */}
              <div className="free-shipping-progress" style={{ borderRadius: '8px', marginBottom: '1.25rem' }}>
                <div id="cartPageShippingText" style={{ fontWeight: 700 }}>
                  {isFreeShipping ? (
                    <span style={{ color: '#16a34a' }}>🎉 Free Delivery Qualified!</span>
                  ) : (
                    `Add Rs. ${amountNeeded.toLocaleString()} for FREE Delivery`
                  )}
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    id="cartPageShippingBar"
                    style={{ width: `${progressPercent}%`, background: isFreeShipping ? '#16a34a' : 'linear-gradient(90deg, #008FAF, #10b981)' }}
                  />
                </div>
              </div>

              <div>
                <div className="summary-line">
                  <span>Subtotal:</span>
                  <strong id="cartPageSubtotal">{storeConfig.currency || 'Rs.'} {cartSubtotal.toLocaleString()}</strong>
                </div>
                <div className="summary-line">
                  <span>Shipping:</span>
                  <strong id="cartPageShipping">
                    {shippingFee === 0 ? <span style={{ color: '#16a34a' }}>FREE</span> : `${storeConfig.currency || 'Rs.'} ${shippingFee}`}
                  </strong>
                </div>
                <div className="summary-line total">
                  <span>Grand Total:</span>
                  <span id="cartPageTotal">{storeConfig.currency || 'Rs.'} {cartGrandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  className="btn-checkout" 
                  onClick={() => navigate('/checkout')}
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', cursor: 'pointer' }}
                >
                  💳 Proceed to Secure Checkout
                </button>
                <button 
                  className="btn-whatsapp-order" 
                  onClick={checkoutViaWhatsApp}
                  style={{ width: '100%', padding: '12px', cursor: 'pointer' }}
                >
                  Quick Order via WhatsApp
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
