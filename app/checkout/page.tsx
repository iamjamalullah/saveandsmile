'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { STORE_CONFIG } from '@/lib/data';
import { getCart, clearCart, CartItem } from '@/lib/cart';

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [payment, setPayment] = useState('COD');
  const [notes, setNotes] = useState('');

  // Modal receipt state
  const [showModal, setShowModal] = useState(false);
  const [receipt, setReceipt] = useState({
    orderId: '',
    name: '',
    phone: '',
    address: '',
    payment: '',
    total: ''
  });

  useEffect(() => {
    setCart(getCart());
    setMounted(true);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const isFree = subtotal >= STORE_CONFIG.freeShippingThreshold;
  const shippingFee = cart.length === 0 ? 0 : (isFree ? 0 : STORE_CONFIG.shippingFee);
  const grandTotal = subtotal + shippingFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Your cart is empty! Please add products first.');
      return;
    }

    const orderId = 'SS-' + Math.floor(100000 + Math.random() * 900000);
    const receiptData = {
      orderId: '#' + orderId,
      name,
      phone,
      address: `${address}, ${city}`,
      payment,
      total: `Rs. ${grandTotal.toLocaleString()}`
    };

    setReceipt(receiptData);
    setShowModal(true);

    // Save locally
    try {
      const localOrders = JSON.parse(localStorage.getItem('qadri_placed_orders') || '[]');
      localOrders.unshift({
        orderId: orderId,
        name: name,
        phone: phone,
        address: address,
        city: city,
        payment: payment,
        subtotal: subtotal,
        shippingFee: shippingFee,
        grandTotal: grandTotal,
        items: cart,
        status: 'Pending',
        date: new Date().toISOString()
      });
      localStorage.setItem('qadri_placed_orders', JSON.stringify(localOrders));
    } catch (e) {}

    // Sync to API
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          customerCity: city,
          paymentMethod: payment,
          subtotal: subtotal,
          shippingFee: shippingFee,
          grandTotal: grandTotal,
          items: cart,
          notes: notes
        })
      });
    } catch (err) {
      console.log('Order offline/fallback mode:', err);
    }

    // Clear cart
    clearCart();
    setCart([]);
  };

  const checkoutViaWhatsAppFromPage = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    const customerName = name.trim() || 'Valued Customer';
    const customerPhone = phone.trim() || 'N/A';
    const customerAddress = address.trim() || 'N/A';
    const customerCity = city || 'Pakistan';

    let msg = `Salam ${STORE_CONFIG.name}! I want to confirm my wholesale order:\n\n` +
      `*CUSTOMER DETAILS:*\n` +
      `Name: ${customerName}\n` +
      `Phone: ${customerPhone}\n` +
      `Address: ${customerAddress}, ${customerCity}\n` +
      `Payment: ${payment}\n\n` +
      `*ITEMS:*\n`;

    cart.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.title} (Qty: ${item.qty}) - Rs. ${(item.price * item.qty).toLocaleString()}\n`;
    });

    msg += `\n*Subtotal:* Rs. ${subtotal.toLocaleString()}\n` +
      `*Delivery:* ${isFree ? 'FREE' : 'Rs. ' + shippingFee}\n` +
      `*Total Payable:* Rs. ${grandTotal.toLocaleString()}\n\n` +
      `Please confirm and dispatch my parcel.`;

    window.open(`https://wa.me/${STORE_CONFIG.whatsappRaw}?text=${encodeURIComponent(msg)}`, '_blank');
  };

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
              <Link href="/cart" className="action-pill-btn">
                🛒 Back to Cart
              </Link>
              <Link href="/" className="action-pill-btn">
                🏠 Continue Shopping
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
          <Link href="/cart">Cart</Link>
          <span>/</span>
          <strong style={{ color: '#0f172a' }}>Secure Checkout</strong>
        </div>
      </div>

      <main className="site-container">
        <div className="checkout-layout">
          {/* Left: Delivery & Billing Details Form */}
          <div className="checkout-box">
            <h2 className="checkout-box-title">Billing & Delivery Details (ڈلیوری کی تفصیلات)</h2>

            <form id="checkoutPageForm" onSubmit={handlePlaceOrder}>
              <div className="checkout-form-grid">
                <div className="form-group">
                  <label>Full Name (پورا نام) *</label>
                  <input 
                    type="text" 
                    id="chkName" 
                    required 
                    placeholder="e.g. Muhammad Ali" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>WhatsApp / Mobile Number (واٹس ایپ نمبر) *</label>
                  <input 
                    type="tel" 
                    id="chkPhone" 
                    required 
                    placeholder="e.g. 0300-1234567" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                  />
                </div>

                <div className="form-group full-col">
                  <label>Street Address (مکمل پتہ) *</label>
                  <input 
                    type="text" 
                    id="chkAddress" 
                    required 
                    placeholder="House #, Street #, Mohalla / Sector / Area" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Nearest Landmark (مشہور قریبی جگہ)</label>
                  <input 
                    type="text" 
                    id="chkLandmark" 
                    placeholder="Near Masjid / School / Market" 
                    value={landmark} 
                    onChange={e => setLandmark(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>City (شہر) *</label>
                  <select 
                    id="chkCity" 
                    required 
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                  >
                    <option value="">Select City</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Quetta">Quetta</option>
                    <option value="Sialkot">Sialkot</option>
                    <option value="Gujranwala">Gujranwala</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Bahawalpur">Bahawalpur</option>
                    <option value="Sargodha">Sargodha</option>
                    <option value="Sukkur">Sukkur</option>
                    <option value="Other">Other City</option>
                  </select>
                </div>

                <div className="form-group full-col">
                  <label>Select Payment Method (طریقہ ادائیگی) *</label>
                  <div className="payment-method-selector">
                    <div 
                      className={`payment-option-card ${payment === 'COD' ? 'selected' : ''}`}
                      onClick={() => setPayment('COD')}
                    >
                      💵 Cash on Delivery (COD)
                    </div>
                    <div 
                      className={`payment-option-card ${payment === 'JazzCash' ? 'selected' : ''}`}
                      onClick={() => setPayment('JazzCash')}
                    >
                      📱 JazzCash
                    </div>
                    <div 
                      className={`payment-option-card ${payment === 'EasyPaisa' ? 'selected' : ''}`}
                      onClick={() => setPayment('EasyPaisa')}
                    >
                      🟢 EasyPaisa
                    </div>
                    <div 
                      className={`payment-option-card ${payment === 'Bank' ? 'selected' : ''}`}
                      onClick={() => setPayment('Bank')}
                    >
                      🏦 Bank Transfer
                    </div>
                  </div>
                  <input type="hidden" id="selectedPayment" value={payment} />
                </div>

                <div className="form-group full-col" id="paymentInstructionBox">
                  {payment === 'COD' && (
                    <div style={{ background: '#f1fbf6', border: '1.5px solid #a7f3d0', borderRadius: '8px', padding: '12px 14px', fontSize: '0.88rem', color: '#065f46' }}>
                      <strong>✓ Cash on Delivery (COD):</strong> Pay cash to the courier rider when your parcel arrives at your doorstep. Open checking permitted as per store policy.
                    </div>
                  )}
                  {payment === 'JazzCash' && (
                    <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '8px', padding: '12px 14px', fontSize: '0.88rem', color: '#92400e' }}>
                      <strong>JazzCash Account:</strong> 0321-8273588 (Title: Qadri Gadgets). Please share screenshot on WhatsApp after payment.
                    </div>
                  )}
                  {payment === 'EasyPaisa' && (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', fontSize: '0.88rem', color: '#166534' }}>
                      <strong>EasyPaisa Account:</strong> 0321-8273588 (Title: Qadri Gadgets). Please share screenshot on WhatsApp after payment.
                    </div>
                  )}
                  {payment === 'Bank' && (
                    <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: '8px', padding: '12px 14px', fontSize: '0.88rem', color: '#075985' }}>
                      <strong>Bank Account:</strong> Meezan Bank Ltd | IBAN: PK00MEZN000000123456789. Please share receipt on WhatsApp.
                    </div>
                  )}
                </div>

                <div className="form-group full-col">
                  <label>Order Notes / Special Instructions (اختیاری)</label>
                  <textarea 
                    id="chkNotes" 
                    rows={2} 
                    placeholder="Any special instructions for courier delivery..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="submit" className="btn-checkout" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '12px' }}>
                  ✓ Place Order Now (آرڈر کنفرم کریں)
                </button>
                <button 
                  type="button" 
                  className="btn-whatsapp-order" 
                  onClick={checkoutViaWhatsAppFromPage} 
                  style={{ width: '100%', padding: '14px', borderRadius: '12px' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ display: 'inline', marginRight: '6px' }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Confirm Order via WhatsApp (واٹس ایپ پر آرڈر بھیجیں)
                </button>
              </div>
            </form>
          </div>

          {/* Right: Order Summary Card */}
          <div className="checkout-box" style={{ height: 'fit-content' }}>
            <h2 className="checkout-box-title">Order Summary (آپ کا آرڈر)</h2>

            <div id="checkoutItemsList" style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
              {!mounted || cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8' }}>
                  <p>Your shopping cart is currently empty.</p>
                  <Link href="/#products" className="tab-btn active" style={{ marginTop: '10px', display: 'inline-block' }}>
                    Start Shopping
                  </Link>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Qty: {item.qty} × Rs. {item.price.toLocaleString()}</div>
                    </div>
                    <strong style={{ color: 'var(--primary-color)', fontSize: '0.95rem' }}>Rs. {(item.price * item.qty).toLocaleString()}</strong>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: '1.5px solid #e2e8f0', marginTop: '1.25rem', paddingTop: '1rem' }}>
              <div className="summary-line">
                <span>Items Subtotal:</span>
                <strong id="chkSubtotal">Rs. {subtotal.toLocaleString()}</strong>
              </div>
              <div className="summary-line">
                <span>Shipping / Delivery:</span>
                <strong id="chkShipping">{cart.length === 0 ? 'Rs. 0' : (isFree ? 'FREE' : `Rs. ${shippingFee}`)}</strong>
              </div>
              <div className="summary-line total">
                <span>Payable Grand Total:</span>
                <span id="chkGrandTotal">Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginTop: '1.25rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
              <div>🛡️ <strong>Guarantee:</strong> 7 Days checking & replacement warranty</div>
              <div>🚚 <strong>Estimated Dispatch:</strong> Within 24 Hours via Trax / Call Courier</div>
            </div>
          </div>
        </div>
      </main>

      {/* Order Receipt Modal */}
      <div className={`modal-overlay ${showModal ? 'active' : ''}`} id="orderSuccessModal">
        <div className="modal-content-card" style={{ maxWidth: '620px', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: '70px', height: '70px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.25rem' }}>
            ✓
          </div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Order Placed Successfully!</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Shukriya! Aap ka order receive ho gaya hai.</p>

          <div style={{ background: '#f1fbf6', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '18px', margin: '1.5rem 0', textAlign: 'left', fontSize: '0.92rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #dcfce7', paddingBottom: '8px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, color: '#0f3c28' }}>Order Tracking ID:</span>
              <strong id="receiptOrderId" style={{ color: '#047857', fontSize: '1.05rem' }}>{receipt.orderId}</strong>
            </div>
            <div style={{ color: '#334155', lineHeight: 1.7 }}>
              <div><strong>Customer:</strong> <span id="receiptName">{receipt.name}</span></div>
              <div><strong>WhatsApp / Phone:</strong> <span id="receiptPhone">{receipt.phone}</span></div>
              <div><strong>Address:</strong> <span id="receiptAddress">{receipt.address}</span></div>
              <div><strong>Payment Method:</strong> <span id="receiptPayment">{receipt.payment}</span></div>
              <div style={{ marginTop: '6px', fontSize: '1.05rem', color: '#0f3c28' }}><strong>Total Amount:</strong> <span id="receiptTotal">{receipt.total}</span></div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Our customer support team will send you dispatch details on WhatsApp before shipping.
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              href={`/track-order?track=${encodeURIComponent(receipt.orderId.replace('#',''))}`} 
              className="btn-checkout" 
              style={{ padding: '12px 20px', background: '#064C63', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            >
              <span>📦</span> <span>Track Parcel Status</span>
            </Link>
            <Link href="/" className="btn-checkout" style={{ padding: '12px 20px', textDecoration: 'none' }}>
              Continue Shopping
            </Link>
            <button className="action-pill-btn" style={{ background: '#e2e8f0', color: '#1e293b' }} onClick={() => window.print()}>
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
