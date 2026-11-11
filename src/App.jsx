import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import Layout from './pages/Layout'
import ProtectedRoute from './admin/ProtectedRoute'

// Route-level code-splitting (lazy loading)
const HomePage = lazy(() => import('./pages/HomePage'))
const CatalogPage = lazy(() => import('./pages/CatalogPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const BulkOrderPage = lazy(() => import('./pages/BulkOrderPage'))
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Administrative consoles (isolated bundles)
const AdminPanel = lazy(() => import('./admin/AdminPanel'))
const ManagerPanel = lazy(() => import('./panels/ManagerPanel'))

// Content & Auth pages
const AboutPage = lazy(() => import('./pages/InfoPages').then(m => ({ default: m.AboutPage })))
const SupportPage = lazy(() => import('./pages/InfoPages').then(m => ({ default: m.SupportPage })))
const TermsPage = lazy(() => import('./pages/InfoPages').then(m => ({ default: m.TermsPage })))
const PrivacyPage = lazy(() => import('./pages/InfoPages').then(m => ({ default: m.PrivacyPage })))
const LoginPage = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.SignupPage })))

function PageLoading() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <div className="spinner-border text-success" role="status" style={{ width: '2.4rem', height: '2.4rem' }}>
        <span className="visually-hidden">Loading page content...</span>
      </div>
      <p style={{ color: '#596573', fontSize: '13px', margin: 0 }}>Loading Save &amp; Smile...</p>
    </div>
  )
}

const readUser = () => {
  try { return JSON.parse(localStorage.getItem('qg_user') || 'null') } catch { return null }
}

export default function App() {
  const location = useLocation()
  const [user, setUser] = useState(readUser)

  const login = u => {
    setUser(u)
    try { localStorage.setItem('qg_user', JSON.stringify(u)) } catch {}
  }
  const logout = () => {
    setUser(null)
    try { localStorage.removeItem('qg_user') } catch {}
  }

  useEffect(() => {
    if (!location.hash) return
    const el = document.getElementById(location.hash.slice(1))
    const timer = setTimeout(() => {
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => clearTimeout(timer)
  }, [location])

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* Protected Administrative Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:tab"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/:tab"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerPanel />
            </ProtectedRoute>
          }
        />

        {/* Public Storefront Routes */}
        <Route element={<Layout user={user} onLogin={login} onLogout={logout} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<CatalogPage mode="shop" />} />
          <Route path="/shop-2" element={<Navigate to="/shop" replace />} />
          <Route path="/user" element={<Navigate to="/account" replace />} />
          <Route path="/category/:slug" element={<CatalogPage mode="category" />} />
          <Route path="/search" element={<CatalogPage mode="search" />} />
          <Route path="/wishlist" element={<CatalogPage mode="wishlist" />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/terms-conditions" element={<TermsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPage />} />
          <Route path="/bulk-order" element={<BulkOrderPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
