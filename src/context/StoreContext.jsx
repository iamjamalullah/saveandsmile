import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORE_CONFIG as DEFAULT_CONFIG, BANNERS, CATEGORIES, FRONT_TABS, PRODUCTS, REELS_DATA, REVIEWS_DATA } from '../data/productsData';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  // Store Config
  const [storeConfig, setStoreConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('qadri_store_config'));
      return saved ? { ...DEFAULT_CONFIG, ...saved } : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });

  // Cart State
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('qadri_cart')) || [];
    } catch (e) {
      return [];
    }
  });

  // Wishlist State
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('qadri_wishlist')) || [];
    } catch (e) {
      return [];
    }
  });

  // Products State (Merged custom + base - deleted)
  const [products, setProducts] = useState(() => {
    try {
      const custom = JSON.parse(localStorage.getItem('qadri_custom_products')) || [];
      const overrides = JSON.parse(localStorage.getItem('qadri_product_overrides')) || {};
      const deleted = JSON.parse(localStorage.getItem('qadri_deleted_products')) || [];

      const base = PRODUCTS
        .filter(p => !deleted.includes(p.id) && !deleted.includes(String(p.id)))
        .map(p => overrides[p.id] ? { ...p, ...overrides[p.id] } : p);

      return [...custom, ...base];
    } catch (e) {
      return PRODUCTS;
    }
  });

  // Active Category & Tab Filters
  const [currentCategory, setCurrentCategory] = useState('all');
  const [currentFrontTab, setCurrentFrontTab] = useState('storage');

  // UI Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeVideoReel, setActiveVideoReel] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qadri_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('qadri_wishlist', JSON.stringify(wishlist));
    } catch (e) {}
  }, [wishlist]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Cart Functions
  const addToCart = (product, qty = 1) => {
    if (!product) return;
    const cleanQty = Math.max(1, parseInt(qty) || 1);
    setCart(prev => {
      const idx = prev.findIndex(item => item.id === product.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + cleanQty };
        return next;
      }
      return [...prev, {
        id: product.id,
        title: product.title,
        price: product.price,
        originalPrice: product.originalPrice || null,
        image: product.image,
        code: product.code || '',
        qty: cleanQty
      }];
    });
    showToast(`Added "${product.title.slice(0, 24)}..." to cart!`);
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
    showToast('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    showToast('Cart cleared');
  };

  // Wishlist Functions
  const toggleWishlist = (product) => {
    if (!product) return;
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        showToast('Removed from wishlist');
        return prev.filter(item => item.id !== product.id);
      } else {
        showToast('Added to wishlist ❤️');
        return [...prev, {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          code: product.code || ''
        }];
      }
    });
  };

  const isInWishlist = (id) => {
    return wishlist.some(item => item.id === id);
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const isFreeShipping = cartSubtotal >= (storeConfig.freeShippingThreshold || 3000);
  const shippingFee = cart.length === 0 ? 0 : (isFreeShipping ? 0 : (storeConfig.shippingFee || 200));
  const cartGrandTotal = cartSubtotal + shippingFee;
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // WhatsApp Checkout Helper
  const checkoutViaWhatsApp = () => {
    if (cart.length === 0) {
      showToast('Your cart is empty!');
      return;
    }
    const phone = storeConfig.whatsapp || '923162323616';
    let text = `*Salam ${storeConfig.name}! I want to order:*\n\n`;
    cart.forEach((item, idx) => {
      text += `${idx + 1}. ${item.title} (x${item.qty}) - Rs. ${(item.price * item.qty).toLocaleString()}\n`;
    });
    text += `\n*Subtotal:* Rs. ${cartSubtotal.toLocaleString()}`;
    text += `\n*Delivery:* ${shippingFee === 0 ? 'FREE' : 'Rs. ' + shippingFee}`;
    text += `\n*Total Payable:* Rs. ${cartGrandTotal.toLocaleString()}`;
    text += `\n\nPlease confirm my order.`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <StoreContext.Provider value={{
      storeConfig,
      banners: BANNERS,
      categories: CATEGORIES,
      frontTabs: FRONT_TABS,
      products,
      reels: REELS_DATA,
      reviews: REVIEWS_DATA,
      cart,
      wishlist,
      currentCategory,
      setCurrentCategory,
      currentFrontTab,
      setCurrentFrontTab,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isInWishlist,
      cartSubtotal,
      shippingFee,
      isFreeShipping,
      cartGrandTotal,
      cartItemCount,
      checkoutViaWhatsApp,
      isCartOpen,
      setIsCartOpen,
      isWishlistOpen,
      setIsWishlistOpen,
      isSearchOpen,
      setIsSearchOpen,
      quickViewProduct,
      setQuickViewProduct,
      isAiChatOpen,
      setIsAiChatOpen,
      toastMessage,
      showToast,
      activeVideoReel,
      setActiveVideoReel
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
