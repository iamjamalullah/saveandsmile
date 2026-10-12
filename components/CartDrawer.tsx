'use client';

import React, { useState, useEffect } from 'react';
import { CartItem } from '@/lib/types';
import { getCart, saveCart } from '@/lib/store';

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CartDrawer({ isOpen: controlledIsOpen, onClose: controlledOnClose }: CartDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
  const onClose = controlledOnClose || (() => setInternalOpen(false));

  const [cart, setCart] = useState<CartItem[]>([]);
  const freeShippingThreshold = 3000;
  const standardShippingFee = 200;

  useEffect(() => {
    setCart(getCart());

    const handleCartUpdate = () => {
      setCart(getCart());
    };

    const handleOpen = () => setInternalOpen(true);
    const handleClose = () => setInternalOpen(false);

    window.addEventListener('qadri_cart_updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);
    window.addEventListener('qadri_open_cart', handleOpen);
    window.addEventListener('qadri_close_cart', handleClose);

    return () => {
      window.removeEventListener('qadri_cart_updated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
      window.removeEventListener('qadri_open_cart', handleOpen);
      window.removeEventListener('qadri_close_cart', handleClose);
    };
  }, []);

  const updateQty = (id: number | string, delta: number) => {
    const updated = cart.map(item => {
      if (String(item.id) === String(id)) {
        const newQty = (item.qty || 1) + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[];

    saveCart(updated);
    setCart(updated);
  };

  const removeItem = (id: number | string) => {
    const updated = cart.filter(item => String(item.id) !== String(id));
    saveCart(updated);
    setCart(updated);
  };

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0);
  const isFreeShip = subtotal >= freeShippingThreshold;
  const shippingFee = subtotal === 0 ? 0 : (isFreeShip ? 0 : standardShippingFee);
  const grandTotal = subtotal + shippingFee;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;
    let msg = `Salam! I want to place an order from your website:%0A%0A*ORDER SUMMARY:*%0A`;
    cart.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.title} (Qty: ${item.qty}) - Rs. ${(Number(item.price) * item.qty).toLocaleString()}%0A`;
    });
    msg += `%0A*Subtotal:* Rs. ${subtotal.toLocaleString()}%0A` +
           `*Delivery:* ${isFreeShip ? 'FREE' : `Rs. ${shippingFee}`}%0A` +
           `*Grand Total:* Rs. ${grandTotal.toLocaleString()}%0A%0A` +
           `Please provide payment and delivery address verification.`;
    window.open(`https://wa.me/923162323616?text=${msg}`, '_blank');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-drawer-overlay ${isOpen ? 'active' : ''}`}
        id="cartDrawerOverlay"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`cart-drawer ${isOpen ? 'active' : ''}`} id="cartDrawer">
        {/* Header */}
        <div className="drawer-header">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Shopping Cart ({cart.reduce((s, i) => s + (i.qty || 1), 0)})
          </h3>
          <button className="drawer-close-btn" onClick={onClose} title="Close cart">
            ✕
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="free-shipping-progress">
          <div id="freeShippingText">
            {isFreeShip ? (
              <span>🎉 <strong>Congratulations!</strong> You get FREE Delivery!</span>
            ) : (
              <span>Add <strong>Rs. {(freeShippingThreshold - subtotal).toLocaleString()}</strong> more for <strong>FREE Delivery</strong></span>
            )}
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Drawer Body - Items List */}
        <div className="drawer-body" id="cartDrawerItems">
          {cart.length === 0 ? (
            <div className="empty-cart-view text-center py-12">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-slate-300">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <h4 className="font-bold text-slate-700 mt-3 text-sm">Your Shopping Cart is Empty</h4>
              <p className="text-xs text-slate-400 mt-1">Add exciting wholesale gadgets to begin shopping.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item-row">
                <img src={item.image} alt={item.title} className="cart-item-img" />
                <div className="cart-item-details">
                  <div className="cart-item-title line-clamp-2">{item.title}</div>
                  <div className="cart-item-price">Rs. {Number(item.price).toLocaleString()}</div>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                    <span className="qty-number">{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                </div>
                <button
                  className="cart-item-remove"
                  onClick={() => removeItem(item.id)}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer - Summary & Actions */}
        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="summary-line">
              <span>Subtotal:</span>
              <strong id="cartSubtotal">Rs. {subtotal.toLocaleString()}</strong>
            </div>
            <div className="summary-line">
              <span>Standard Shipping:</span>
              <strong id="cartShipping">{isFreeShip ? 'FREE' : `Rs. ${shippingFee}`}</strong>
            </div>
            <div className="summary-line total">
              <span>Total Payable:</span>
              <span id="cartTotal">Rs. {grandTotal.toLocaleString()}</span>
            </div>

            <div className="drawer-actions">
              <button
                className="btn-checkout"
                onClick={() => { onClose(); window.location.href = '/checkout'; }}
              >
                💳 Proceed to Checkout
              </button>
              <button
                className="btn-checkout"
                onClick={() => { onClose(); window.location.href = '/cart'; }}
                style={{ background: '#f1f5f9', color: '#1e293b', border: '1.5px solid #cbd5e1', boxShadow: 'none' }}
              >
                🛒 View Full Cart Page
              </button>
              <button
                className="btn-whatsapp-order"
                onClick={handleWhatsAppCheckout}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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
