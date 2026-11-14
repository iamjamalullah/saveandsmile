import { useState, useMemo } from 'react'
import { useStoreData } from '../../context/StoreDataContext'

export default function ProductsView({ onEditProduct, onDeleteProduct, onOpenAddProduct }) {
  const { products, categories, storeSettings, toggleProductStock } = useStoreData()

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedGroup, setSelectedGroup] = useState('ALL')
  const [selectedStockStatus, setSelectedStockStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('id-desc')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  const [selectedIds, setSelectedIds] = useState([])

  // Available groups
  const groups = [
    { value: 'tabs', label: 'Tabs (Featured)' },
    { value: 'new', label: 'New Arrivals' },
    { value: 'hot', label: 'Hot Selling' },
    { value: 'home', label: 'Home Essentials' },
    { value: 'like', label: 'You May Like' },
    { value: 'perfume', label: 'Fragrances' },
    { value: 'trending', label: 'Trending' },
    { value: 'jewelry', label: 'Jewelry' },
    { value: 'watch', label: 'Watches' },
  ]

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const matchesSearch = !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())

      // Category
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory

      // Group
      const matchesGroup = selectedGroup === 'ALL' || p.group === selectedGroup

      // Stock
      let matchesStock = true
      if (selectedStockStatus === 'in-stock') matchesStock = p.stock > 5
      else if (selectedStockStatus === 'low-stock') matchesStock = p.stock > 0 && p.stock <= 5
      else if (selectedStockStatus === 'out-of-stock') matchesStock = p.stock === 0

      return matchesSearch && matchesCategory && matchesGroup && matchesStock
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price
      if (sortBy === 'price-high') return b.price - a.price
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
      if (sortBy === 'stock-low') return a.stock - b.stock
      if (sortBy === 'id-asc') return (Number(a.id) || 0) - (Number(b.id) || 0)
      if (b.createdAt && a.createdAt) {
        const diff = new Date(b.createdAt) - new Date(a.createdAt)
        if (diff !== 0) return diff
      }
      return (Number(b.id) || 0) - (Number(a.id) || 0)
    })
  }, [products, searchTerm, selectedCategory, selectedGroup, selectedStockStatus, sortBy])

  // Bulk select handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'SKU', 'Name', 'Category', 'Group', 'Price', 'OldPrice', 'Stock']
    const rows = filteredProducts.map(p => [
      p.id,
      p.sku || '',
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.group,
      p.price,
      p.oldPrice,
      p.stock,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gadget_store_products_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="products-view">
      {/* Top Header Controls */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Product Inventory</h3>
          <p className="text-muted small mb-0">
            Managing <strong className="text-dark">{products.length} catalog items</strong> across {categories.length} categories
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button className="btn btn-outline-secondary" onClick={handleExportCSV} title="Export CSV">
            <i className="bi bi-download me-1"></i> Export CSV
          </button>
          <button className="btn btn-admin-primary fw-semibold" onClick={onOpenAddProduct}>
            <i className="bi bi-plus-lg me-1"></i> Add Product
          </button>
        </div>
      </div>

      {/* Filter and Search Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 align-items-center">
            {/* Search */}
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search products by title, SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            {/* Group Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="ALL">All Groups</option>
                {groups.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select"
                value={selectedStockStatus}
                onChange={(e) => setSelectedStockStatus(e.target.value)}
              >
                <option value="ALL">All Stock</option>
                <option value="in-stock">In Stock (&gt;5)</option>
                <option value="low-stock">Low Stock (1-5)</option>
                <option value="out-of-stock">Out of Stock (0)</option>
              </select>
            </div>

            {/* Sort & View Mode */}
            <div className="col-6 col-md-2 d-flex gap-2">
              <select
                className="form-select flex-grow-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="id-desc">Newest First (Default)</option>
                <option value="id-asc">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="stock-low">Lowest Stock</option>
              </select>

              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn btn-outline-secondary ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Table View"
                >
                  <i className="bi bi-list-ul"></i>
                </button>
                <button
                  type="button"
                  className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid Cards View"
                >
                  <i className="bi bi-grid-fill"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Showing count indicator */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="small text-muted">
          Showing <strong className="text-dark">{filteredProducts.length}</strong> of {products.length} products
          {selectedCategory !== 'ALL' && ` in "${selectedCategory}"`}
        </span>
        {selectedIds.length > 0 && (
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">{selectedIds.length} selected</span>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => {
                if (window.confirm(`Delete ${selectedIds.length} selected products?`)) {
                  selectedIds.forEach(id => onDeleteProduct(id))
                  setSelectedIds([])
                }
              }}
            >
              <i className="bi bi-trash me-1"></i> Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* View Mode: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Group</th>
                  <th>Price</th>
                  <th>Stock Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                      No products found matching your current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const discount = p.oldPrice > p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0
                    return (
                      <tr key={p.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => handleToggleSelect(p.id)}
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="admin-thumb"
                              onError={(e) => { e.target.src = '/images/cat1.jpg' }}
                            />
                            <div>
                              <div className="fw-semibold text-dark d-flex align-items-center gap-1.5 flex-wrap">
                                {p.name}
                                {p.hasVariants && p.variants?.length > 0 && (
                                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '10px' }}>
                                    <i className="bi bi-layers me-1"></i>{p.variants.length} Variants
                                  </span>
                                )}
                              </div>
                              <small className="text-muted d-block font-monospace">
                                SKU: {p.sku || `GS-${p.id}`}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {p.category}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary text-capitalize">
                            {p.group}
                          </span>
                        </td>
                        <td>
                          <div>
                            <span className="fw-bold text-dark">
                              {storeSettings?.currency || 'Rs.'} {p.price.toLocaleString()}
                            </span>
                            {p.oldPrice > p.price && (
                              <div className="small">
                                <s className="text-muted me-1">{storeSettings?.currency || 'Rs.'} {p.oldPrice.toLocaleString()}</s>
                                <span className="badge bg-danger-subtle text-danger">-{discount}%</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge ${p.stock === 0 ? 'bg-danger' : p.stock <= 5 ? 'bg-warning text-dark' : 'bg-success'}`}>
                              {p.stock === 0 ? 'Out of Stock' : `${p.stock} In Stock`}
                            </span>
                            <button
                              className="btn btn-sm btn-link p-0 text-muted"
                              onClick={() => toggleProductStock(p.id)}
                              title={p.stock > 0 ? 'Mark Out of Stock' : 'Restock 15 units'}
                            >
                              <i className="bi bi-arrow-repeat"></i>
                            </button>
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-light border"
                              onClick={() => onEditProduct(p)}
                              title="Edit Product"
                            >
                              <i className="bi bi-pencil text-primary"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-light border text-danger"
                              onClick={() => onDeleteProduct(p)}
                              title="Delete Product"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Mode */
        <div className="row g-3">
          {filteredProducts.map((p) => {
            const discount = p.oldPrice > p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0
            return (
              <div key={p.id} className="col-12 col-sm-6 col-md-4 col-xl-3">
                <div className="card h-100 shadow-sm position-relative overflow-hidden">
                  {discount > 0 && (
                    <span className="badge bg-danger position-absolute top-0 end-0 m-2">
                      -{discount}% OFF
                    </span>
                  )}
                  <div className="p-3 text-center bg-light">
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{ height: 160, objectFit: 'contain' }}
                      className="w-100"
                      onError={(e) => { e.target.src = '/images/cat1.jpg' }}
                    />
                  </div>
                  <div className="card-body d-flex flex-column p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-light text-dark border small">{p.category}</span>
                      <span className={`badge ${p.stock === 0 ? 'bg-danger' : p.stock <= 5 ? 'bg-warning text-dark' : 'bg-success'}`}>
                        {p.stock === 0 ? 'Out of Stock' : `${p.stock} in stock`}
                      </span>
                    </div>
                    <h6 className="fw-bold mb-2 text-truncate" title={p.name}>{p.name}</h6>
                    <div className="mt-auto">
                      <div className="d-flex align-items-baseline gap-2 mb-3">
                        <span className="fw-bold fs-5 text-dark">
                          {storeSettings?.currency || 'Rs.'} {p.price.toLocaleString()}
                        </span>
                        {p.oldPrice > p.price && (
                          <s className="small text-muted">{storeSettings?.currency || 'Rs.'} {p.oldPrice.toLocaleString()}</s>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary flex-grow-1"
                          onClick={() => onEditProduct(p)}
                        >
                          <i className="bi bi-pencil me-1"></i> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDeleteProduct(p)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
