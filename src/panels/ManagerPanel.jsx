import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import PanelShell from './PanelShell'
import { ManagerInventory, ManagerOverview } from './ManagerViews'
import OrdersView from '../admin/views/OrdersView'
import ReviewsView from '../admin/views/ReviewsView'
import AnalyticsView from '../admin/views/AnalyticsView'
import OrderModal from '../admin/components/OrderModal'
import { useStoreData } from '../context/StoreDataContext'
import { useAuth } from '../context/AuthContext'

export default function ManagerPanel() {
  const {
    orders = [],
    products = [],
    notifications,
    adminToast,
    markAllNotificationsRead,
    storeSettings,
    loadOrders,
    loadContacts,
  } = useStoreData()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const { tab = 'overview' } = useParams()
  const [activeOrder, setActiveOrder] = useState(null)

  useEffect(() => {
    loadOrders()
    loadContacts()
  }, [loadOrders, loadContacts])

  const pending = orders.filter(o => o.status === 'Pending').length
  const lowStock = products.filter(p => p.stock <= 5).length

  const goTab = id => navigate(id === 'overview' ? '/manager' : `/manager/${id}`)

  const nav = [
    {
      label: 'Workspace',
      items: [
        { id: 'overview', label: 'Overview', icon: 'bi-grid-1x2' },
        { id: 'orders', label: 'Orders', icon: 'bi-receipt-cutoff', badge: pending || null },
      ],
    },
    {
      label: 'Catalogue',
      items: [
        { id: 'inventory', label: 'Stock & inventory', icon: 'bi-boxes', badge: lowStock || null },
      ],
    },
    {
      label: 'Customers',
      items: [
        { id: 'reviews', label: 'Reviews', icon: 'bi-star' },
      ],
    },
    {
      label: 'Insights',
      items: [
        { id: 'reports', label: 'Reports', icon: 'bi-bar-chart-line' },
      ],
    },
  ]

  const handleExit = () => {
    logout()
    navigate('/')
  }

  return (
    <PanelShell
      role="manager"
      brandSub="Manager Console"
      roleLabel="Operations Manager"
      userName={user?.name || "Operations Manager"}
      userEmail={user?.email || storeSettings.email}
      nav={nav}
      active={tab}
      onNavigate={goTab}
      onExit={handleExit}
      onMyAccount={() => navigate('/account')}
      onSwitchRole={() => navigate('/admin')}
      switchLabel="Admin console"
      notifications={notifications}
      onReadNotifications={markAllNotificationsRead}
      toast={adminToast}
    >
      {tab === 'overview' && (
        <ManagerOverview
          onGoTab={goTab}
          onViewOrder={order => setActiveOrder(order)}
        />
      )}
      {tab === 'orders' && (
        <OrdersView
          selectedOrderForModal={activeOrder}
          onSelectOrder={order => setActiveOrder(order)}
        />
      )}
      {tab === 'inventory' && <ManagerInventory />}
      {tab === 'reviews' && <ReviewsView />}
      {tab === 'reports' && <AnalyticsView />}

      {activeOrder && (
        <OrderModal
          order={activeOrder}
          onClose={() => setActiveOrder(null)}
        />
      )}
    </PanelShell>
  )
}
