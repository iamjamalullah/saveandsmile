import { useEffect } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router'
import Header from '../components/Header'
import Footer from '../components/Footer'
import FloatingContact from '../components/FloatingContact'
import { CartDrawer, AddedModal, QuickView, AuthModal, WelcomePopup, Toast } from '../components/Modals'
import { useStoreData } from '../context/StoreDataContext'

export default function Layout({ user, onLogout, onLogin }) {
  const { pathname, search } = useLocation()
  const { error, reload } = useStoreData()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  useEffect(() => {
    const titles = {
      '/': 'Home | Save & Smile',
      '/shop': 'Shop | Save & Smile',
      '/about-us': 'About Us | Save & Smile',
      '/contact': 'Contact Us | Save & Smile',
      '/reviews': 'Reviews | Save & Smile',
      '/bulk-order': 'Bulk Order | Save & Smile',
      '/support': 'Support – Save & Smile',
      '/terms-conditions': 'Terms & Conditions | Save & Smile',
      '/privacy-policy': 'Privacy Policy | Save & Smile',
      '/login': 'Login | Save & Smile',
      '/signup': 'Signup | Save & Smile',
      '/account': 'My Account | Save & Smile',
      '/checkout': 'Checkout | Save & Smile',
      '/wishlist': 'My Wishlist | Save & Smile',
    }
    document.title = titles[pathname] || 'Save & Smile'
  }, [pathname, search])

  return (
    <div className="qg-app qh-app">
      {error && (
        <div className="qg-api-banner" role="alert">
          <span><b>Store data is offline.</b> {error}</span>
          <button type="button" onClick={reload}>Retry connection</button>
        </div>
      )}
      <Header user={user} onLogout={onLogout} />
      <Outlet context={{ user, onLogin, onLogout }} />
      <Footer />
      <FloatingContact />
      <CartDrawer />
      <AddedModal />
      <QuickView />
      <AuthModal onLogin={onLogin} />
      <WelcomePopup />
      <Toast />
    </div>
  )
}

export const useSession = () => useOutletContext() || {}
