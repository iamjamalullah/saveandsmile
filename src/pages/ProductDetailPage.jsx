import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id') || searchParams.get('code');
  const { products, addToCart, storeConfig } = useStore();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const navigate = useNavigate();

  const product = products.find(p => String(p.id) === String(productId) || p.code === productId) || products[0];

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      setQty(1);
      window.scrollTo(0, 0);
    }
  }, [productId, product]);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, qty);
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    navigate('/checkout');
  };

  const handleOrderWhatsApp = () => {
    const phone = storeConfig.whatsapp || '923162323616';
    const text = `*Salam ${storeConfig.name}! I want to order this product:*\n\n` +
      `*Product:* ${product.title}\n` +
      `*Item Code:* ${product.code || 'N/A'}\n` +
      `*Price:* Rs. ${product.price.toLocaleString()}\n` +
      `*Quantity:* ${qty}\n` +
      `*Total:* Rs. ${(product.price * qty).toLocaleString()}\n\n` +
      `Please deliver to my address via Cash on Delivery.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleBulkOrderWhatsApp = () => {
    const phone = storeConfig.whatsapp || '923162323616';
    const text = `*Salam ${storeConfig.name}! I want to inquire about WHOLESALE BULK rates for:*\n\n` +
      `*Product:* ${product.title}\n` +
      `*Item Code:* ${product.code || 'N/A'}\n` +
      `*Required Quantity:* 50+ Units\n\n` +
      `Please provide your direct factory wholesale rate sheet.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const relatedProducts = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);
  const discountPercent = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <>
      <Header />

      {/* Sub-nav bar */}
      <div className="sub-nav-wrapper detail-page-subnav">
        <div className="site-container">
          <div className="sub-nav-inner" style={{ justifyContent: 'space-between' }}>
            <Link 
              to="/" 
              className="detail-back-home" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              <span>Back to Store</span>
            </Link>

            <div className="detail-social-links" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>Connect:</span>
              <a href="https://wa.me/923162323616" target="_blank" rel="noreferrer" className="social-icon-pill" title="WhatsApp" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                💬
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="site-container">
        <div className="breadcrumb-bar" style={{ padding: '0.75rem 0' }}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/#products">{product.category || 'Products'}</Link>
          <span>/</span>
          <strong style={{ color: '#0f172a' }}>{product.title}</strong>
        </div>
      </div>

      {/* Main Product Detail View */}
      <main className="site-container">
        <div className="product-detail-layout" id="productDetailContainer">
          
          {/* Left: Gallery */}
          <div className="gallery-container">
            <div className="main-image-display zoom-wrapper" id="detailImgContainer">
              <img id="detailMainImg" src={selectedImage || product.image} alt={product.title} />
            </div>
            <div className="thumbs-strip" id="detailThumbsStrip">
              <div 
                className={`thumb-item ${selectedImage === product.image ? 'active' : ''}`}
                onClick={() => setSelectedImage(product.image)}
              >
                <img src={product.image} alt="Thumbnail 1" />
              </div>
            </div>
          </div>

          {/* Right: Info & Actions */}
          <div className="detail-info-col">
            {product.badge && (
              <span className="product-badge" style={{ position: 'static', display: 'inline-block', width: 'fit-content', marginBottom: '8px' }}>
                {product.badge}
              </span>
            )}
            <h1 className="detail-title">{product.title}</h1>

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#e6f7ec', color: '#047857', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '99px' }}>
                ● In Stock (Ready to Dispatch)
              </span>
              {product.code && (
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Code: {product.code}</span>
              )}
            </div>

            <div className="detail-pricing-box">
              <div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#007382', fontWeight: 700, letterSpacing: '0.5px' }}>Best Price</div>
                <div className="detail-wholesale-price">
                  {storeConfig.currency || 'Rs.'} {product.price.toLocaleString()}
                </div>
              </div>
              {product.originalPrice && (
                <div>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Market Price</div>
                  <div className="detail-original-price">
                    {storeConfig.currency || 'Rs.'} {product.originalPrice.toLocaleString()}
                  </div>
                </div>
              )}
              {discountPercent > 0 && (
                <span className="discount-pill">SAVE {discountPercent}%</span>
              )}
            </div>

            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              {product.description || 'Premium quality wholesale gadget with guaranteed reseller margin. Cash on delivery available nationwide across Pakistan.'}
            </p>

            {/* Quantity Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Select Quantity:</label>
              <div className="qty-control" style={{ border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '2px' }}>
                <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: '36px', height: '36px', fontSize: '1.2rem' }}>−</button>
                <span className="qty-number" style={{ minWidth: '42px', fontSize: '1.05rem', fontWeight: 700 }}>{qty}</span>
                <button className="qty-btn" onClick={() => setQty(qty + 1)} style={{ width: '36px', height: '36px', fontSize: '1.2rem' }}>+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="detail-action-buttons">
              <div className="detail-actions-row">
                <button className="btn-detail-cart" onClick={handleAddToCart} title="Add to Cart">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <span>Add to Cart</span>
                </button>
                <button className="btn-detail-whatsapp" onClick={handleOrderWhatsApp} title="Order via WhatsApp">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>Order via WhatsApp</span>
                </button>
              </div>

              <button className="btn-detail-bulk-wholesale" onClick={handleBulkOrderWhatsApp} title="Bulk Wholesale Inquiry">
                <span>📦 Bulk Order (Buy in Wholesale - Direct Factory Rate)</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            {/* Trust Mini Card */}
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                <strong>7 Days Checking Warranty:</strong> Verification &amp; replacement guarantee
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                <strong>Cash on Delivery (COD):</strong> Pay at doorstep across Pakistan
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid #e2e8f0', marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#00363d', marginBottom: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            Product Specifications &amp; Details
          </h3>
          <div style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.8 }}>
            <p><strong>Item Code:</strong> {product.code || 'QGW-' + product.id}</p>
            <p><strong>Category:</strong> {product.category || 'General Wholesale'}</p>
            <p><strong>Availability:</strong> In Stock ready for wholesale shipping</p>
            <p><strong>Description:</strong> {product.description || 'High quality material designed for durability and daily use.'}</p>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#00363d', marginBottom: '1.5rem' }}>
              More Products You May Like
            </h2>
            <div className="products-grid">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
