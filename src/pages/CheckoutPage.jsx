import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import Footer from '../components/Footer';

export default function CheckoutPage() {
  const { 
    cart, 
    clearCart, 
    cartSubtotal, 
    shippingFee, 
    cartGrandTotal, 
    storeConfig,
    showToast 
  } = useStore();

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    city: 'Karachi',
    paymentMethod: 'COD',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Your cart is empty! Please add products first.');
      navigate('/');
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      showToast('Please fill all required fields marked with *');
      return;
    }

    setIsSubmitting(true);
    const generatedOrderId = 'SS-' + Math.floor(100000 + Math.random() * 900000);
    
    const orderPayload = {
      orderId: generatedOrderId,
      customerName: formData.name,
      customerPhone: formData.phone,
      customerAddress: formData.address + (formData.landmark ? `, Near: ${formData.landmark}` : ''),
      customerCity: formData.city,
      paymentMethod: formData.paymentMethod,
      subtotal: cartSubtotal,
      shippingFee: shippingFee,
      grandTotal: cartGrandTotal,
      items: cart,
      notes: formData.notes || '',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Send to serverless API
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
      } catch (err) {
        console.warn('API POST failed, saving to local store:', err);
      }

      // 2. Save in localStorage for admin panel and tracking
      const existingOrders = JSON.parse(localStorage.getItem('qadri_placed_orders')) || [];
      existingOrders.unshift(orderPayload);
      localStorage.setItem('qadri_placed_orders', JSON.stringify(existingOrders));

      // 3. Clear Cart and show Confirmation
      clearCart();
      setPlacedOrder(orderPayload);
      showToast(`Order #${generatedOrderId} placed successfully! 🎉`);
    } catch (error) {
      showToast(`Order submission error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header className="header-wrapper">
          <div className="site-container">
            <div className="header-inner">
              <Link to="/" className="brand-logo" title="Save & Smile">
                <img src={storeConfig.logo || "images/save-and-smile-logo.png"} alt="Save & Smile" className="site-brand-logo" />
              </Link>
            </div>
          </div>
        </header>

        <main className="site-container" style={{ flex: 1, padding: '3rem 1rem', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
              Order Placed Successfully!
            </h1>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Shukriya <strong>{placedOrder.customerName}</strong>! Aapka order receive ho chuka hai. Hamari team foran verification ke liye rabta karegi.
            </p>

            <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '16px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Your Tracking Order ID:</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#064C63' }}>{placedOrder.orderId}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Amount (COD):</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  {storeConfig.currency || 'Rs.'} {placedOrder.grandTotal.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link 
                to={`/track?id=${placedOrder.orderId}`}
                className="btn-checkout" 
                style={{ width: '100%', padding: '14px', textDecoration: 'none', display: 'block' }}
              >
                📍 Track Order Live Status
              </Link>
              <a 
                href={`https://wa.me/${storeConfig.whatsapp || '923162323616'}?text=Salam!%20I%20just%20placed%20Order%20*${placedOrder.orderId}*%20for%20Rs.%20${placedOrder.grandTotal}.%20Please%20confirm.`}
                target="_blank" 
                rel="noreferrer"
                className="btn-whatsapp-order" 
                style={{ width: '100%', padding: '12px', textDecoration: 'none', display: 'block' }}
              >
                Confirm on WhatsApp
              </a>
              <Link 
                to="/" 
                style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem', marginTop: '8px', textDecoration: 'none' }}
              >
                ← Return to Homepage
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
              <Link to="/cart" className="action-pill-btn">
                🛒 Back to Cart
              </Link>
              <Link to="/" className="action-pill-btn">
                🏠 Continue Shopping
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
          <Link to="/cart">Cart</Link>
          <span>/</span>
          <strong style={{ color: '#0f172a' }}>Secure Checkout</strong>
        </div>
      </div>

      <main className="site-container" style={{ flex: 1, paddingBottom: '3rem' }}>
        <div className="checkout-layout">
          
          {/* Left: Billing Form */}
          <div className="checkout-box">
            <h2 className="checkout-box-title">Billing &amp; Delivery Details (ڈلیوری کی تفصیلات)</h2>
            
            <form id="checkoutPageForm" onSubmit={handlePlaceOrder}>
              <div className="checkout-form-grid">
                
                <div className="form-group">
                  <label>Full Name (پورا نام) *</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    placeholder="e.g. Muhammad Ali"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>WhatsApp / Mobile Number (واٹس ایپ نمبر) *</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    required 
                    placeholder="e.g. 0300-1234567"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-col">
                  <label>Street Address (مکمل پتہ) *</label>
                  <input 
                    type="text" 
                    name="address" 
                    required 
                    placeholder="House #, Street #, Mohalla / Sector / Area"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Nearest Landmark (مشہور قریبی جگہ)</label>
                  <input 
                    type="text" 
                    name="landmark" 
                    placeholder="Near Masjid / School / Market"
                    value={formData.landmark}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>City (شہر) *</label>
                  <select 
                    name="city" 
                    required
                    value={formData.city}
                    onChange={handleChange}
                  >
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
                      className={`payment-option-card ${formData.paymentMethod === 'COD' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'COD' }))}
                    >
                      💵 Cash on Delivery (COD)
                    </div>
                    <div 
                      className={`payment-option-card ${formData.paymentMethod === 'JazzCash' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'JazzCash' }))}
                    >
                      📱 JazzCash Direct Transfer
                    </div>
                    <div 
                      className={`payment-option-card ${formData.paymentMethod === 'EasyPaisa' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'EasyPaisa' }))}
                    >
                      🟢 EasyPaisa Transfer
                    </div>
                    <div 
                      className={`payment-option-card ${formData.paymentMethod === 'Bank' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'Bank' }))}
                    >
                      🏦 Direct Bank Transfer
                    </div>
                  </div>
                </div>

                <div className="form-group full-col">
                  <label>Order Notes / Delivery Instructions (اختیاری)</label>
                  <textarea 
                    name="notes"
                    placeholder="Any special instruction for the courier rider..."
                    rows={2}
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

              </div>

              <button 
                type="submit" 
                className="btn-checkout" 
                style={{ width: '100%', marginTop: '1.5rem', padding: '16px', fontSize: '1.05rem', cursor: 'pointer' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? '⏳ Processing Your Order...' : '🔒 Confirm & Place Order (آرڈر مکمل کریں)'}
              </button>
            </form>
          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="checkout-summary-box">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '10px' }}>
              Order Summary ({cart.reduce((s, i) => s + i.qty, 0)} Items)
            </h3>

            <div className="checkout-items-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <img src={item.image} alt={item.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0', lineHeight: 1.3 }}>{item.title}</h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Qty: {item.qty} × {storeConfig.currency || 'Rs.'} {item.price}</span>
                  </div>
                  <strong style={{ fontSize: '0.92rem', color: '#064C63' }}>
                    {storeConfig.currency || 'Rs.'} {(item.price * item.qty).toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>

            <div>
              <div className="summary-line">
                <span>Subtotal:</span>
                <strong>{storeConfig.currency || 'Rs.'} {cartSubtotal.toLocaleString()}</strong>
              </div>
              <div className="summary-line">
                <span>Delivery Charges:</span>
                <strong>{shippingFee === 0 ? <span style={{ color: '#16a34a' }}>FREE</span> : `${storeConfig.currency || 'Rs.'} ${shippingFee}`}</strong>
              </div>
              <div className="summary-line total">
                <span>Total Payable:</span>
                <span>{storeConfig.currency || 'Rs.'} {cartGrandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
              🛡️ <strong>Safe &amp; Verified Shopping:</strong> All orders undergo strict quality check prior to dispatch. Pay cash when your parcel arrives!
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
