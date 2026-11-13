import { useEffect } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router'
import Header from '../components/Header'
import Footer from '../components/Footer'
import FloatingContact from '../components/FloatingContact'
import { CartDrawer, AddedModal, QuickView, AuthModal, WelcomePopup, Toast } from '../components/Modals'
import { useStoreData } from '../context/StoreDataContext'
import { setPageSeo } from '../utils/seo'

export default function Layout({ user, onLogout, onLogin }) {
  const { pathname, search } = useLocation()
  const { error, reload } = useStoreData()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  useEffect(() => {
    // Only set generic layout SEO for static/informational/private routes
    // CatalogPage, HomePage and ProductPage handle their own deep SEO
    if (['/', '/shop'].includes(pathname) || pathname.startsWith('/product/') || pathname.startsWith('/category/')) {
      return
    }

    const privateRoutes = ['/checkout', '/account', '/wishlist', '/login', '/signup']
    const isPrivate = privateRoutes.includes(pathname)

    const routeInfo = {
      '/about-us': {
        title: 'About Us | Save & Smile',
        desc: 'Learn about Save & Smile — Pakistan\'s leading online shopping destination for wholesale and retail lifestyle products.',
      },
      '/contact': {
        title: 'Contact Us | Save & Smile',
        desc: 'Get in touch with Save & Smile customer support for wholesale orders, inquiries, or order assistance.',
      },
      '/reviews': {
        title: 'Customer Reviews | Save & Smile',
        desc: 'Read genuine customer reviews and ratings from verified buyers across Pakistan shopping at Save & Smile.',
      },
      '/bulk-order': {
        title: 'Wholesale & Bulk Buying | Save & Smile',
        desc: 'Access tiered wholesale discounts, bulk pricing, and reseller distribution across Pakistan with Save & Smile.',
      },
      '/support': {
        title: 'Support & Help Center | Save & Smile',
        desc: 'Customer support, order tracking assistance, delivery timelines and FAQ for Save & Smile.',
      },
      '/terms-conditions': {
        title: 'Terms & Conditions | Save & Smile',
        desc: 'Review the official terms and conditions for ordering and shopping on Save & Smile.',
      },
      '/privacy-policy': {
        title: 'Privacy Policy | Save & Smile',
        desc: 'Understand how Save & Smile protects customer privacy, personal data and payment security.',
      },
      '/checkout': { title: 'Checkout | Save & Smile', desc: 'Secure checkout' },
      '/account': { title: 'My Account | Save & Smile', desc: 'Manage your customer account' },
      '/wishlist': { title: 'My Wishlist | Save & Smile', desc: 'Saved products wishlist' },
      '/login': { title: 'Login | Save & Smile', desc: 'Sign in to Save & Smile' },
      '/signup': { title: 'Create Account | Save & Smile', desc: 'Register a new customer account' },
    }

    const current = routeInfo[pathname] || { title: 'Save & Smile', desc: 'Your trusted online shopping hub.' }

    setPageSeo({
      title: current.title,
      description: current.desc,
      canonical: pathname,
      noindex: isPrivate,
    })
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
