import { useStoreData } from '../../context/StoreDataContext'
import { TRENDING_SEARCHES } from '../../data'

export default function AnalyticsView() {
  const { products, orders, categories, storeSettings } = useStoreData()

  // Calculate stats
  const completedOrders = (orders || []).filter(o => o.status === 'Delivered')
  const totalRevenue = (orders || []).filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + Number(o.total || 0), 0)
  const deliveredRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const totalUnitsSold = (orders || []).filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.qty || 1), 0), 0)
  const estimatedProfit = Math.round(totalRevenue * 0.32) // Estimated 32% wholesale margin

  // City breakdown calculation
  const cityCounts = {}
  ;(orders || []).forEach(o => {
    const city = o.customer?.city || o.customerCity || 'Other'
    cityCounts[city] = (cityCounts[city] || 0) + 1
  })
  const totalOrdersCount = (orders || []).length || 1

  return (
    <div className="analytics-view">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Store Analytics &amp; Reports</h3>
          <p className="text-muted small mb-0">
            Real-time business performance insights, fulfillment metrics, and regional analysis
          </p>
        </div>
        <div className="d-flex gap-2">
          <span className="badge bg-success-subtle text-success border px-3 py-2 fw-semibold">
            <i className="bi bi-clock-history me-1"></i> Live Data Synced
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-stat-card p-3 p-md-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-semibold small text-uppercase">Gross Sales</span>
              <div className="stat-icon-wrap stat-icon-orange">
                <i className="bi bi-graph-up-arrow"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{storeSettings?.currency || 'Rs.'} {totalRevenue.toLocaleString()}</h3>
            <div className="text-muted small">
              <span className="text-success fw-semibold">Rs. {deliveredRevenue.toLocaleString()}</span> collected
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-stat-card p-3 p-md-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-semibold small text-uppercase">Estimated Margin</span>
              <div className="stat-icon-wrap stat-icon-green">
                <i className="bi bi-cash-coin"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{storeSettings?.currency || 'Rs.'} {estimatedProfit.toLocaleString()}</h3>
            <div className="text-success small fw-medium">
              <i className="bi bi-pie-chart-fill me-1"></i> ~32% Avg Gross Margin
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-stat-card p-3 p-md-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-semibold small text-uppercase">Total Units Sold</span>
              <div className="stat-icon-wrap stat-icon-blue">
                <i className="bi bi-box2-heart"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{totalUnitsSold} Units</h3>
            <div className="text-muted small">
              Across {orders.length} unique customer orders
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-stat-card p-3 p-md-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-semibold small text-uppercase">Delivery Rate</span>
              <div className="stat-icon-wrap stat-icon-purple">
                <i className="bi bi-truck-front-fill"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">
              {Math.round((completedOrders.length / (orders.length || 1)) * 100)}%
            </h3>
            <div className="text-success small fw-medium">
              <i className="bi bi-check-all me-1"></i> High customer satisfaction
            </div>
          </div>
        </div>
      </div>

      {/* Regional City Distribution & Search Trends */}
      <div className="row g-3 mb-4">
        {/* City Breakdown */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-0">Regional Order Distribution (Cities)</h5>
                <small className="text-muted">Top demand markets across Pakistan</small>
              </div>
              <span className="badge bg-light text-dark border">By Customer Location</span>
            </div>
            <div className="card-body p-4">
              <div className="d-flex flex-column gap-3">
                {Object.entries(cityCounts).map(([city, count]) => {
                  const percentage = Math.round((count / totalOrdersCount) * 100)
                  return (
                    <div key={city}>
                      <div className="d-flex justify-content-between small fw-medium mb-1">
                        <span className="d-flex align-items-center gap-2">
                          <i className="bi bi-geo-alt-fill text-danger"></i>
                          <strong>{city}</strong>
                        </span>
                        <span>{count} orders ({percentage}%)</span>
                      </div>
                      <div className="progress" style={{ height: 10 }}>
                        <div
                          className="progress-bar bg-gradient"
                          style={{
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, #049977, #3ec79f)',
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Trending Search Keywords */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0">Customer Demand &amp; Searches</h5>
              <small className="text-muted">High-intent searches on your storefront</small>
            </div>
            <div className="card-body p-4">
              <p className="text-muted small mb-3">
                Top keyword queries entered into the live search banner by customers:
              </p>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {TRENDING_SEARCHES.map((item) => (
                  <div
                    key={item.label}
                    className="p-2 px-3 rounded-pill border bg-light d-flex align-items-center gap-2 shadow-sm"
                  >
                    <span>{item.icon}</span>
                    <span className="fw-semibold text-dark">{item.label}</span>
                    <span className="badge bg-warning text-dark rounded-pill">Hot</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-light rounded-3 border">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-lightbulb-fill text-warning fs-5"></i>
                  <h6 className="fw-bold mb-0">Merchandising Recommendation</h6>
                </div>
                <p className="small text-muted mb-0">
                  Customers are actively searching for <strong>Watches &amp; Electronic Accessories</strong>. Increasing stock in these groups can drive an estimated 15-20% uplift in wholesale revenue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog & Inventory Health */}
      <div className="card shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0">Catalog Inventory Health</h5>
          <small className="text-muted">Summary of stock safety and active SKU counts</small>
        </div>
        <div className="card-body p-4">
          <div className="row text-center g-3">
            <div className="col-6 col-md-3">
              <div className="p-3 border rounded bg-light">
                <div className="display-6 fw-bold text-dark">{products.length}</div>
                <div className="text-muted small">Total Catalog Products</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 border rounded bg-light">
                <div className="display-6 fw-bold text-success">{products.filter(p => p.stock > 5).length}</div>
                <div className="text-muted small">Healthy In-Stock Items</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 border rounded bg-light">
                <div className="display-6 fw-bold text-warning">{products.filter(p => p.stock > 0 && p.stock <= 5).length}</div>
                <div className="text-muted small">Low Stock Alert (&le; 5)</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 border rounded bg-light">
                <div className="display-6 fw-bold text-danger">{products.filter(p => p.stock === 0).length}</div>
                <div className="text-muted small">Out of Stock Items</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
