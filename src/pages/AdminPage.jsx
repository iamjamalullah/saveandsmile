import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function AdminPage() {
  const { products, storeConfig, showToast } = useStore();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [courierInput, setCourierInput] = useState('Leopards Courier');
  const [statusInput, setStatusInput] = useState('Pending');
  const [productSearch, setProductSearch] = useState('');

  // Authentication State
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('saveandsmile_admin_token') || '');
  const [adminUser, setAdminUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('saveandsmile_admin_user')) || null;
    } catch (e) {
      return null;
    }
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Load orders from API when authenticated
  const fetchOrdersFromApi = async (token) => {
    if (!token) return;
    setIsLoadingOrders(true);
    try {
      const res = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
        localStorage.setItem('qadri_placed_orders', JSON.stringify(data.orders));
      } else if (res.status === 401) {
        // Token expired
        handleLogout();
        showToast('Admin session expired. Please log in again.');
      } else {
        // Fallback to local storage if DB is empty
        const stored = JSON.parse(localStorage.getItem('qadri_placed_orders')) || [];
        setOrders(stored);
      }
    } catch (e) {
      console.warn('Could not fetch orders from API:', e.message);
      const stored = JSON.parse(localStorage.getItem('qadri_placed_orders')) || [];
      setOrders(stored);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchOrdersFromApi(adminToken);
    }
  }, [adminToken]);

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setLoginError('Please enter both username and password.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        sessionStorage.setItem('saveandsmile_admin_token', data.token);
        sessionStorage.setItem('saveandsmile_admin_user', JSON.stringify(data.user || { username: loginForm.username }));
        setAdminToken(data.token);
        setAdminUser(data.user || { username: loginForm.username });
        showToast('Admin authentication successful! 🔐');
      } else {
        setLoginError(data.error || 'Invalid admin credentials.');
      }
    } catch (err) {
      setLoginError(`Connection error: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem('saveandsmile_admin_token');
    sessionStorage.removeItem('saveandsmile_admin_user');
    setAdminToken('');
    setAdminUser(null);
    showToast('Logged out successfully.');
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0);
  const pendingOrders = orders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
  const completedOrders = orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    return (o.status || '').toLowerCase() === orderFilter.toLowerCase();
  });

  const handleUpdateStatus = async (orderId, newStatus) => {
    const trackingNo = (newStatus === 'Shipped') ? 'LEOP-' + Math.floor(100000 + Math.random() * 900000) : null;
    
    // 1. Send update to API
    if (adminToken) {
      try {
        await fetch('/api/orders', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            orderId,
            status: newStatus,
            courier: 'Leopards Courier',
            trackingNumber: trackingNo
          })
        });
      } catch (e) {}
    }

    // 2. Update local state
    const updated = orders.map(o => {
      if (o.orderId === orderId || o.orderCode === orderId) {
        return {
          ...o,
          status: newStatus,
          trackingNumber: trackingNo || o.trackingNumber
        };
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem('qadri_placed_orders', JSON.stringify(updated));
    showToast(`Order #${orderId} status updated to ${newStatus}`);
  };

  const handleSaveTrackingModal = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (adminToken) {
      try {
        await fetch('/api/orders', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            orderId: selectedOrder.orderId || selectedOrder.orderCode,
            status: statusInput,
            courier: courierInput,
            trackingNumber: trackingInput
          })
        });
      } catch (e) {}
    }

    const updated = orders.map(o => {
      if (o.orderId === selectedOrder.orderId || o.orderCode === selectedOrder.orderId) {
        return {
          ...o,
          status: statusInput,
          courier: courierInput,
          trackingNumber: trackingInput
        };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem('qadri_placed_orders', JSON.stringify(updated));
    setSelectedOrder(null);
    showToast(`Tracking saved for #${selectedOrder.orderId || selectedOrder.orderCode}`);
  };

  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (p.title && p.title.toLowerCase().includes(q)) || (p.code && p.code.toLowerCase().includes(q));
  });

  // ==========================================
  // Render: Secure Login Guard View
  // ==========================================
  if (!adminToken) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #064C63 0%, #008FAF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '36px 30px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', textAlign: 'center' }}>
          
          <img src="/images/save-and-smile-logo.png" alt="Save & Smile" style={{ height: '48px', objectFit: 'contain', marginBottom: '16px' }} />
          
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>
            Admin Portal Authentication
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '24px' }}>
            Please enter your administrator credentials to access store operations, orders, and inventory.
          </p>

          {loginError && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600 }}>
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Username / Email
              </label>
              <input 
                type="text" 
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="admin"
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <input 
                type="password" 
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoggingIn}
              style={{ background: '#064C63', color: '#ffffff', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', marginTop: '8px', transition: '0.2s opacity' }}
            >
              {isLoggingIn ? 'Verifying Credentials...' : 'Secure Login 🔐'}
            </button>
          </form>

          <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <Link to="/" style={{ color: '#008FAF', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render: Authenticated Admin Dashboard View
  // ==========================================
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      
      {/* Admin Top Header */}
      <header style={{ background: '#064C63', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/">
            <img src="/images/save-and-smile-logo.png" alt="Save & Smile Logo" style={{ height: '36px', filter: 'brightness(0) invert(1)' }} />
          </Link>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px' }}>
            CONTROL PANEL (PROTECTED)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            👤 {adminUser ? adminUser.username : 'Admin'}
          </span>
          <button 
            onClick={() => fetchOrdersFromApi(adminToken)}
            title="Refresh Live Orders"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            🔄 Sync
          </button>
          <button 
            onClick={handleLogout}
            style={{ background: '#e11d48', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        <button 
          onClick={() => setCurrentTab('dashboard')}
          style={{ padding: '14px 18px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.9rem', color: currentTab === 'dashboard' ? '#064C63' : '#64748b', borderBottom: currentTab === 'dashboard' ? '3px solid #064C63' : '3px solid transparent', cursor: 'pointer' }}
        >
          📊 Dashboard Overview
        </button>
        <button 
          onClick={() => setCurrentTab('orders')}
          style={{ padding: '14px 18px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.9rem', color: currentTab === 'orders' ? '#064C63' : '#64748b', borderBottom: currentTab === 'orders' ? '3px solid #064C63' : '3px solid transparent', cursor: 'pointer' }}
        >
          📦 Orders ({orders.length})
        </button>
        <button 
          onClick={() => setCurrentTab('products')}
          style={{ padding: '14px 18px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.9rem', color: currentTab === 'products' ? '#064C63' : '#64748b', borderBottom: currentTab === 'products' ? '3px solid #064C63' : '3px solid transparent', cursor: 'pointer' }}
        >
          🛒 Products ({products.length})
        </button>
      </div>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        
        {/* Tab 1: Dashboard */}
        {currentTab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Revenue</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#064C63', marginTop: '6px' }}>
                  Rs. {totalRevenue.toLocaleString()}
                </div>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Orders</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284c7', marginTop: '6px' }}>
                  {orders.length}
                </div>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Pending Dispatch</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#eab308', marginTop: '6px' }}>
                  {pendingOrders}
                </div>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Delivered</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16a34a', marginTop: '6px' }}>
                  {completedOrders}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Orders List */}
        {currentTab === 'orders' && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Orders List</h3>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'Pending', 'Processing', 'Shipped', 'Delivered'].map(status => (
                  <button 
                    key={status}
                    onClick={() => setOrderFilter(status)}
                    style={{ background: orderFilter === status ? '#064C63' : '#f1f5f9', color: orderFilter === status ? '#fff' : '#475569', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {status.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingOrders && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                🔄 Loading orders from database...
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px' }}>Order ID</th>
                    <th style={{ padding: '12px' }}>Customer</th>
                    <th style={{ padding: '12px' }}>City &amp; Address</th>
                    <th style={{ padding: '12px' }}>Total Amount</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Tracking #</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        No orders found in this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(o => {
                      const id = o.orderId || o.orderCode || o.id;
                      return (
                        <tr key={id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#064C63' }}>
                            #{id}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 700 }}>{o.customerName}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{o.customerPhone}</div>
                          </td>
                          <td style={{ padding: '12px', maxWidth: '220px', fontSize: '0.82rem', color: '#475569' }}>
                            <strong>{o.customerCity}</strong>: {o.customerAddress}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 800 }}>
                            Rs. {(parseFloat(o.grandTotal) || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              padding: '4px 10px', 
                              borderRadius: '9999px', 
                              fontSize: '0.75rem', 
                              fontWeight: 700,
                              background: o.status === 'Delivered' ? '#dcfce7' : o.status === 'Shipped' ? '#e0f2fe' : '#fef9c3',
                              color: o.status === 'Delivered' ? '#166534' : o.status === 'Shipped' ? '#0369a1' : '#854d0e'
                            }}>
                              {o.status || 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>
                            {o.trackingNumber || 'Pending'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setTrackingInput(o.trackingNumber || '');
                                  setCourierInput(o.courier || 'Leopards Courier');
                                  setStatusInput(o.status || 'Pending');
                                }}
                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Edit / Dispatch
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 3: Products Catalog */}
        {currentTab === 'products' && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Search products by title or code..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{ padding: '10px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', minWidth: '280px', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px' }}>Product</th>
                    <th style={{ padding: '12px' }}>Code</th>
                    <th style={{ padding: '12px' }}>Category</th>
                    <th style={{ padding: '12px' }}>Wholesale Price</th>
                    <th style={{ padding: '12px' }}>Stock</th>
                    <th style={{ padding: '12px' }}>Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={p.image} alt={p.title} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '8px' }} />
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{p.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{p.code || 'N/A'}</td>
                      <td style={{ padding: '12px', textTransform: 'capitalize' }}>{p.category || 'General'}</td>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#064C63' }}>
                        Rs. {p.price.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', color: '#16a34a', fontWeight: 700 }}>
                        {p.stock || 100} units
                      </td>
                      <td style={{ padding: '12px' }}>
                        {p.badge && (
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {p.badge}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Modal: Edit Tracking */}
        {selectedOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '480px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>
                Assign Tracking for #{selectedOrder.orderId || selectedOrder.orderCode}
              </h3>
              
              <form onSubmit={handleSaveTrackingModal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Courier Service</label>
                  <select 
                    value={courierInput}
                    onChange={(e) => setCourierInput(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Leopards Courier">Leopards Courier Service</option>
                    <option value="TCS Express">TCS Express</option>
                    <option value="Trax Logistics">Trax Logistics</option>
                    <option value="M&P Express">M&P Express</option>
                    <option value="PostEx">PostEx</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Tracking / CN Number</label>
                  <input 
                    type="text" 
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="e.g. LEOP-948201"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Order Status</label>
                  <select 
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    type="submit" 
                    style={{ flex: 1, background: '#064C63', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Save &amp; Update
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSelectedOrder(null)}
                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '12px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
