import React from 'react';
import { useStore } from '../context/StoreContext';

export default function WishlistModal() {
  const { 
    isWishlistOpen, 
    setIsWishlistOpen, 
    wishlist, 
    toggleWishlist, 
    addToCart, 
    storeConfig 
  } = useStore();

  if (!isWishlistOpen) return null;

  return (
    <div 
      className="modal-overlay active" 
      id="genericModal" 
      onClick={(e) => {
        if (e.target.id === 'genericModal') setIsWishlistOpen(false);
      }}
    >
      <div className="modal-content-card" style={{ maxWidth: '600px', width: '90%' }}>
        <button className="modal-close-btn" onClick={() => setIsWishlistOpen(false)}>✕</button>
        <div id="genericModalContent">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>❤️</span> My Wishlist ({wishlist.length})
          </h2>

          {wishlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤍</div>
              <h4 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>Your wishlist is empty</h4>
              <p style={{ fontSize: '0.85rem' }}>Click the heart icon on any product to save it here for later.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
              {wishlist.map(item => (
                <div 
                  key={item.id} 
                  style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '14px', 
                    padding: '12px', 
                    background: '#f8fafc', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} 
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                      {item.title}
                    </h4>
                    <div style={{ color: '#064C63', fontWeight: 800, fontSize: '0.95rem' }}>
                      {storeConfig.currency || 'Rs.'} {item.price.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-add-cart" 
                      style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                      onClick={() => {
                        addToCart(item, 1);
                        toggleWishlist(item);
                      }}
                    >
                      Add to Cart
                    </button>
                    <button 
                      style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                      onClick={() => toggleWishlist(item)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
