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

  // Load orders from localStorage / API
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('qadri_placed_orders')) || [
        {
          orderId: 'SS-948201',
          customerName: 'Muhammad Bilal',
          customerPhone: '0300-8472910',
          customerAddress: 'House 42, Street 7, Gulshan-e-Iqbal',
          customerCity: 'Karachi',
          paymentMethod: 'COD',
          subtotal: 1450,
          shippingFee: 200,
          grandTotal: 1650,
          status: 'Pending',
          courier: 'Leopards Courier',
          trackingNumber: 'LEOP-194820',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          items: [{ title: 'Ultra 8 Smart Watch with Wireless Charger', qty: 1, price: 1450 }]
        },
        {
          orderId: 'SS-104928',
          customerName: 'Usman Ali',
          customerPhone: '0321-4920194',
          customerAddress: 'Shop 12, Main Market, Gulberg III',
          customerCity: 'Lahore',
          paymentMethod: 'COD',
          subtotal: 3600,
          shippingFee: 0,
          grandTotal: 3600,
          status: 'Shipped',
          courier: 'TCS Express',
          trackingNumber: 'TCS-928104',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          items: [{ title: 'Multipurpose Kitchen Bathroom Shelf', qty: 20, price: 180 }]
        }
      ];
      setOrders(stored);
      localStorage.setItem('qadri_placed_orders', JSON.stringify(stored));
    } catch (e) {}
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const pendingOrders = orders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
  const completedOrders = orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    return (o.status || '').toLowerCase() === orderFilter.toLowerCase();
  });

  const handleUpdateStatus = (orderId, newStatus) => {
    const updated = orders.map(o => {
      if (o.orderId === orderId) {
        return {
          ...o,
          status: newStatus,
          trackingNumber: (newStatus === 'Shipped' && (!o.trackingNumber || o.trackingNumber === 'PENDING')) 
            ? 'LEOP-' + Math.floor(100000 + Math.random() * 900000) 
            : o.trackingNumber
        };
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem('qadri_placed_orders', JSON.stringify(updated));
    showToast(`Order #${orderId} status updated to ${newStatus}`);
  };

  const handleSaveTrackingModal = (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const updated = orders.map(o => {
      if (o.orderId === selectedOrder.orderId) {
        return {
          ...o,
          trackingNumber: trackingInput || o.trackingNumber,
          courier: courierInput || o.courier,
          status: statusInput || o.status
        };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem('qadri_placed_orders', JSON.stringify(updated));
    showToast(`Tracking saved for #${selectedOrder.orderId}!`);
    setSelectedOrder(null);
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f8fafc', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Left Sidebar */}
      <aside style={{ width: '260px', background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={storeConfig.logo || "images/save-and-smile-logo.png"} alt="Save & Smile" style={{ height: '36px', background: '#fff', padding: '4px', borderRadius: '8px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc' }}>Save &amp; Smile</div>
            <div style={{ fontSize: '0.72rem', color: '#008FAF', fontWeight: 700 }}>Executive OS 2.0</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button 
            onClick={() => setCurrentTab('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: currentTab === 'dashboard' ? '#064C63' : 'transparent', color: currentTab === 'dashboard' ? '#fff' : '#94a3b8', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.88rem' }}
          >
            📊 Dashboard Overview
          </button>
          <button 
            onClick={() => setCurrentTab('orders')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: currentTab === 'orders' ? '#064C63' : 'transparent', color: currentTab === 'orders' ? '#fff' : '#94a3b8', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.88rem' }}
          >
            <span>📦 Orders Manager</span>
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px' }}>{pendingOrders}</span>
          </button>
          <button 
            onClick={() => setCurrentTab('products')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: currentTab === 'products' ? '#064C63' : 'transparent', color: currentTab === 'products' ? '#fff' : '#94a3b8', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.88rem' }}
          >
            🏷️ Product Catalog ({products.length})
          </button>
          <Link 
            to="/live-editor"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', color: '#38bdf8', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}
          >
            🎨 Visual Page Builder ➔
          </Link>
          <Link 
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', color: '#10b981', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem', marginTop: 'auto' }}
          >
            🌐 View Live Storefront ➔
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
              {currentTab === 'dashboard' && 'Commerce Operations Hub'}
              {currentTab === 'orders' && 'Order Fulfillment & Tracking'}
              {currentTab === 'products' && 'Product & Inventory Manager'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
              Live wholesale data synced with local database and storage engine.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => showToast('Data refreshed!')}
              style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Tab 1: Dashboard */}
        {currentTab === 'dashboard' && (
          <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '2rem' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Revenue</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#064C63', marginTop: '6px' }}>
                  Rs. {totalRevenue.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', fontWeight: 700 }}>● Active sales</div>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Orders</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                  {orders.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Across Pakistan</div>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Pending Action</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ef4444', marginTop: '6px' }}>
                  {pendingOrders}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', fontWeight: 700 }}>Requires dispatch</div>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Active Catalog</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#008FAF', marginTop: '6px' }}>
                  {products.length} Products
                </div>
                <div style={{ fontSize: '0.75rem', color: '#008FAF', marginTop: '4px', fontWeight: 700 }}>Ready for wholesale</div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Recent Orders</h3>
                <button 
                  onClick={() => setCurrentTab('orders')}
                  style={{ color: '#064C63', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  View All Orders →
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px' }}>Order ID</th>
                      <th style={{ padding: '12px' }}>Customer</th>
                      <th style={{ padding: '12px' }}>City</th>
                      <th style={{ padding: '12px' }}>Amount</th>
                      <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.orderId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#064C63' }}>#{o.orderId}</td>
                        <td style={{ padding: '12px' }}>{o.customerName}</td>
                        <td style={{ padding: '12px' }}>{o.customerCity}</td>
                        <td style={{ padding: '12px', fontWeight: 700 }}>Rs. {o.grandTotal.toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            background: o.status === 'Delivered' ? '#dcfce7' : (o.status === 'Shipped' ? '#e0f2fe' : '#fef3c7'),
                            color: o.status === 'Delivered' ? '#15803d' : (o.status === 'Shipped' ? '#0369a1' : '#b45309'),
                            padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800 
                          }}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Orders Manager */}
        {currentTab === 'orders' && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(st => (
                <button
                  key={st}
                  onClick={() => setOrderFilter(st)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: orderFilter === st ? '#064C63' : '#fff',
                    color: orderFilter === st ? '#fff' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px' }}>Order ID</th>
                    <th style={{ padding: '12px' }}>Customer &amp; Phone</th>
                    <th style={{ padding: '12px' }}>Delivery Address</th>
                    <th style={{ padding: '12px' }}>Total</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Tracking</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o.orderId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#064C63' }}>#{o.orderId}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700 }}>{o.customerName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{o.customerPhone}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.82rem', color: '#475569', maxWidth: '200px' }}>
                        {o.customerAddress}, {o.customerCity}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>
                        Rs. {o.grandTotal.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <select 
                          value={o.status || 'Pending'} 
                          onChange={(e) => handleUpdateStatus(o.orderId, e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.8rem' }}>
                        {o.trackingNumber ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#008FAF' }}>{o.trackingNumber}</div>
                            <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{o.courier}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => {
                            setSelectedOrder(o);
                            setTrackingInput(o.trackingNumber || '');
                            setCourierInput(o.courier || 'Leopards Courier');
                            setStatusInput(o.status || 'Pending');
                          }}
                          style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          ✏️ Edit Tracking
                        </button>
                      </td>
                    </tr>
                  ))}
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
                Assign Tracking for #{selectedOrder.orderId}
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
