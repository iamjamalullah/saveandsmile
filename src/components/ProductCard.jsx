import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function ProductCard({ product }) {
  const { 
    storeConfig, 
    addToCart, 
    toggleWishlist, 
    isInWishlist, 
    setQuickViewProduct 
  } = useStore();

  const navigate = useNavigate();
  if (!product) return null;

  const isWishlisted = isInWishlist(product.id);

  const handleProductClick = () => {
    navigate(`/product-detail?id=${product.id}`);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    navigate('/checkout');
  };

  return (
    <div className={`product-card cat-${product.category || 'storage'}`}>
      {product.badge && (
        <span className="product-badge">{product.badge}</span>
      )}
      
      <div className="product-img-wrapper" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
        <img src={product.image} alt={product.title} loading="lazy" />
      </div>

      <div className="card-quick-actions">
        <button 
          className={`action-icon-circle ${isWishlisted ? 'favorited' : ''}`} 
          title="Add to Wishlist" 
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? '#ef4444' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button 
          className="action-icon-circle" 
          title="Quick View" 
          onClick={(e) => {
            e.stopPropagation();
            setQuickViewProduct(product);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>

      <div className="product-card-body">
        <h3 className="product-title" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
          {product.title}
        </h3>

        <div className="product-pricing">
          {product.originalPrice && (
            <span className="original-price">
              <span className="currency-symbol">{storeConfig.currency || 'Rs.'}</span> {product.originalPrice.toLocaleString()}
            </span>
          )}
          <span className="wholesale-price">
            <span className="currency-symbol">{storeConfig.currency || 'Rs.'}</span> {product.price.toLocaleString()}
          </span>
        </div>

        <div className="product-card-actions">
          <button 
            className="btn-add-cart" 
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, 1);
            }} 
            title="Add to Cart"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span className="btn-cart-text">Add to Cart</span>
          </button>
          
          <button 
            className="btn-buy-now" 
            onClick={handleBuyNow} 
            title="Direct Checkout"
          >
            <span>Buy Now</span>
          </button>
        </div>

        <a 
          href={`https://wa.me/${storeConfig.whatsapp || '923162323616'}?text=Salam!%20I%20want%20to%20buy%20*${encodeURIComponent(product.title)}*%20in%20Wholesale%20bulk%20quantity.`} 
          target="_blank" 
          rel="noreferrer"
          className="card-wholesale-strip" 
          title="Inquire Wholesale Bulk Quantity"
          onClick={(e) => e.stopPropagation()}
        >
          <span>📦 Buy in Wholesale</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
