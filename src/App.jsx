import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './context/StoreContext';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import TrackOrderPage from './pages/TrackOrderPage';
import AdminPage from './pages/AdminPage';
import LiveEditorPage from './pages/LiveEditorPage';

import CartDrawer from './components/CartDrawer';
import WishlistModal from './components/WishlistModal';
import SearchOverlay from './components/SearchOverlay';
import QuickViewModal from './components/QuickViewModal';
import AiStoreRobot from './components/AiStoreRobot';
import MobileBottomNav from './components/MobileBottomNav';

export default function App() {
  const { toastMessage } = useStore();

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/index.html" element={<HomePage />} />
        <Route path="/product-detail" element={<ProductDetailPage />} />
        <Route path="/product-detail.html" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/cart.html" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout.html" element={<CheckoutPage />} />
        <Route path="/track" element={<TrackOrderPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/track-order.html" element={<TrackOrderPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin.html" element={<AdminPage />} />
        <Route path="/live-editor" element={<LiveEditorPage />} />
        <Route path="/admin/live-editor" element={<LiveEditorPage />} />
        <Route path="/live-editor.html" element={<LiveEditorPage />} />
        {/* Fallback to Home */}
        <Route path="*" element={<HomePage />} />
      </Routes>

      {/* Global Interactive Elements */}
      <CartDrawer />
      <WishlistModal />
      <SearchOverlay />
      <QuickViewModal />
      <AiStoreRobot />
      <MobileBottomNav />

      {/* Toast Notice */}
      {toastMessage && (
        <div className="toast-notice active" id="toastNotice" style={{ display: 'block' }}>
          {toastMessage}
        </div>
      )}
    </>
  );
}
