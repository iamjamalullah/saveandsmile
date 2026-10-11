'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { STORE_CONFIG } from '@/lib/data';
import { getCart, updateCartQty, removeFromCart, clearCart, CartItem } from '@/lib/cart';

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCart(getCart());
    setMounted(true);

    const handleCartUpdate = () => {
      setCart(getCart());
    };
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const handleUpdateQty = (id: number | string, delta: number) => {
    const updated = updateCartQty(id, delta);
    setCart([...updated]);
  };

  const handleRemove = (id: number | string) => {
    const updated = removeFromCart(id);
    setCart([...updated]);
  };

  const handleClear = () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;
    clearCart();
    setCart([]);
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = subtotal >= STORE_CONFIG.freeShippingThreshold ? 0 : STORE_CONFIG.shippingFee;
    const total = subtotal + shipping;

    let msg = `*🛒 New Order Inquiry from Save & Smile Website*\n\n`;
    cart.forEach((item, index) => {
      msg += `${index + 1}. *${item.title}*\n   Qty: ${item.qty} × Rs. ${item.price.toLocaleString()} = Rs. ${(item.qty * item.price).toLocaleString()}\n`;
    });
    msg += `\n*Subtotal:* Rs. ${subtotal.toLocaleString()}`;
    msg += `\n*Shipping:* ${shipping === 0 ? 'FREE' : `Rs. ${shipping}`}`;
    msg += `\n*Total Amount:* Rs. ${total.toLocaleString()}`;
    msg += `\n\nPlease confirm availability and payment details. Thank you!`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${STORE_CONFIG.whatsappRaw}?text=${encoded}`, '_blank');
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const isFree = subtotal >= STORE_CONFIG.freeShippingThreshold;
  const shippingFee = cart.length === 0 ? 0 : (isFree ? 0 : STORE_CONFIG.shippingFee);
  const grandTotal = subtotal + shippingFee;
  const progressPercent = Math.min(100, Math.round((subtotal / STORE_CONFIG.freeShippingThreshold) * 100));

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <header className="header-wrapper">
        <div className="site-container">
          <div className="header-inner">
            <Link href="/" className="brand-logo" title="Save &amp; Smile">
              <img src="/images/save-and-smile-logo.png" alt="Save &amp; Smile" className="site-brand-logo" />
            </Link>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/" className="action-pill-btn">
                🏠 Continue Shopping
              </Link>
              <Link href="/checkout" className="action-pill-btn" style={{ background: 'rgba(255,255,255,0.35)' }}>
                💳 Checkout
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="site-container">
        <div className="breadcrumb-bar">
          <Link href="/">Home</Link>
          <span>/</span>
          <strong style={{ color: '#0f172a' }}>Shopping Cart</strong>
        </div>
      </div>

      <main className="site-container">
        <div className="cart-page-layout">
          {/* Left: Full Cart Table */}
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '12px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Your Cart Items</h1>
              <button 
                className="action-pill-btn" 
                style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', fontSize: '0.82rem', cursor: 'pointer' }}
                onClick={handleClear}
              >
                🗑️ Clear Cart
              </button>
            </div>

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
                  {!mounted || cart.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                        <h3>Your cart is empty</h3>
                        <p style={{ marginTop: '6px' }}>Add exciting gadgets to begin.</p>
                        <Link href="/#products" className="tab-btn active" style={{ marginTop: '14px', display: 'inline-block' }}>
                          Browse Products
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    cart.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <img 
                              src={item.image} 
                              alt={item.title}
                              style={{ width: '55px', height: '55px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }} 
                            />
                            <Link href={`/product-detail?id=${item.id}`} style={{ fontWeight: 700, color: '#1e293b', maxWidth: '280px', display: 'block' }}>
                              {item.title}
                            </Link>
                          </div>
                        </td>
                        <td><strong>Rs. {item.price.toLocaleString()}</strong></td>
                        <td>
                          <div className="qty-control">
                            <button className="qty-btn" onClick={() => handleUpdateQty(item.id, -1)}>−</button>
                            <span className="qty-number">{item.qty}</span>
                            <button className="qty-btn" onClick={() => handleUpdateQty(item.id, 1)}>+</button>
                          </div>
                        </td>
                        <td><strong style={{ color: 'var(--primary-color)' }}>Rs. {(item.price * item.qty).toLocaleString()}</strong></td>
                        <td>
                          <button 
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.1rem', cursor: 'pointer' }} 
                            onClick={() => handleRemove(item.id)} 
                            title="Remove"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/#products" className="tab-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                ← Continue Browsing Gadgets
              </Link>
            </div>
          </div>

          {/* Right: Summary Card */}
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: 'var(--card-shadow)', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '10px' }}>
              Cart Summary
            </h2>

            {/* Free shipping alert */}
            <div className="free-shipping-progress" style={{ borderRadius: '8px', marginBottom: '1.25rem' }}>
              <div id="cartPageShippingText" style={{ fontWeight: 700 }}>
                {cart.length === 0 ? (
                  'Add Rs. 3,000 for FREE Delivery'
                ) : isFree ? (
                  <span>🎉 <strong>Congratulations!</strong> You get FREE delivery!</span>
                ) : (
                  <span>Add <strong>Rs. {(STORE_CONFIG.freeShippingThreshold - subtotal).toLocaleString()}</strong> more for <strong>FREE Delivery</strong></span>
                )}
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" id="cartPageShippingBar" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            <div>
              <div className="summary-line">
                <span>Subtotal:</span>
                <strong id="cartPageSubtotal">Rs. {subtotal.toLocaleString()}</strong>
              </div>
              <div className="summary-line">
                <span>Shipping:</span>
                <strong id="cartPageShipping">{cart.length === 0 ? 'Rs. 0' : (isFree ? 'FREE' : `Rs. ${shippingFee}`)}</strong>
              </div>
              <div className="summary-line total">
                <span>Grand Total:</span>
                <span id="cartPageTotal">Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="cart-action-buttons-group">
              {/* Amny Samny: Checkout and WhatsApp */}
              <div className="cart-buttons-row">
                <Link href="/checkout" className="cart-btn-pill btn-primary-pill" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span>💳 Checkout</span>
                </Link>
                <button className="cart-btn-pill btn-whatsapp-pill" onClick={handleWhatsAppCheckout}>
                  <span>💬 WhatsApp</span>
                </button>
              </div>

              {/* Nechy: Continue Shopping */}
              <Link href="/#products" className="cart-btn-pill btn-secondary-pill" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span>🛍️ Continue Shopping</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
