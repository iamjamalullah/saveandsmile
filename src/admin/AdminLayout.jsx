import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import PanelShell from '../panels/PanelShell'
import { useStoreData } from '../context/StoreDataContext'
import { useAuth } from '../context/AuthContext'

export default function AdminLayout({ children }) {
  const {
    products = [],
    orders = [],
    reviews = [],
    notifications,
    storeSettings = {},
    adminToast,
    markAllNotificationsRead,
    loadOrders,
    loadContacts,
    loadReviews,
  } = useStoreData()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const active = pathname.split('/')[2] || 'dashboard'

  useEffect(() => {
    loadOrders()
    loadContacts()
    loadReviews()
    const timer = setInterval(() => {
      loadOrders()
      loadReviews()
    }, 8000)
    return () => clearInterval(timer)
  }, [loadOrders, loadContacts, loadReviews])

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length
  const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length
  const lowStockCount = products.filter(p => p.stock <= 5).length

  const nav = [
    {
      label: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
        { id: 'analytics', label: 'Analytics', icon: 'bi-graph-up-arrow' },
      ],
    },
    {
      label: 'Storefront & Catalog',
      items: [
        { id: 'homepage', label: 'Home Page Editor', icon: 'bi-window-stack' },
        { id: 'products', label: 'Products', icon: 'bi-box-seam', badge: products.length, tone: 'muted' },
        { id: 'categories', label: 'Categories', icon: 'bi-tags' },
        { id: 'watch-shop', label: 'Watch & Shop', icon: 'bi-camera-reels' },
      ],
    },
    {
      label: 'Sales',
      items: [
        { id: 'orders', label: 'Orders', icon: 'bi-receipt-cutoff', badge: pendingOrdersCount || null },
        { id: 'reviews', label: 'Reviews', icon: 'bi-star', badge: pendingReviewsCount || null, tone: 'warning' },
      ],
    },
    {
      label: 'System',
      items: [
        { id: 'settings', label: 'Store Settings', icon: 'bi-sliders' },
      ],
    },
  ]

  const goTab = id => navigate(id === 'dashboard' ? '/admin' : `/admin/${id}`)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <PanelShell
      role="admin"
      brandSub="Admin Console"
      roleLabel="Administrator"
      userName={user?.name || "Store Admin"}
      userEmail={user?.email || storeSettings?.email || "admin@saveandsmile.com"}
      nav={nav}
      active={active}
      onNavigate={goTab}
      onExit={handleLogout}
      onMyAccount={() => navigate('/account')}
      onSwitchRole={() => navigate('/manager')}
      switchLabel="Manager console"
      notifications={notifications}
      onReadNotifications={markAllNotificationsRead}
      toast={adminToast}
    >
      {children}
      <footer style={{ marginTop: 26, paddingTop: 14, borderTop: '1px solid #e2eae6', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', fontSize: 10.5, color: '#8a9d94' }}>
        <span>{lowStockCount > 0 ? `${lowStockCount} products need restocking` : 'Inventory levels are healthy'}</span>
        <span>Save &amp; Smile · {new Date().getFullYear()}</span>
      </footer>
    </PanelShell>
  )
}
