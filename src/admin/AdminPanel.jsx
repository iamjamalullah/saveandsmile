import { useState } from 'react'
import { useParams } from 'react-router'
import { useStoreData } from '../context/StoreDataContext'
import AdminLayout from './AdminLayout'
import DashboardView from './views/DashboardView'
import ProductsView from './views/ProductsView'
import OrdersView from './views/OrdersView'
import CategoriesView from './views/CategoriesView'
import AnalyticsView from './views/AnalyticsView'
import ReviewsView from './views/ReviewsView'
import WatchShopView from './views/WatchShopView'
import SettingsView from './views/SettingsView'
import HomePageEditorView from './views/HomePageEditorView'
import OrderModal from './components/OrderModal'
import ProductFormModal from './components/ProductFormModal'

export default function AdminPanel() {
  const { tab } = useParams()
  const activeTab = tab || 'dashboard'
  const { deleteProduct } = useStoreData()

  // Selected Order for detail modal
  const [activeOrderModal, setActiveOrderModal] = useState(null)

  // Product Form Modal state
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  // Delete product confirmation modal
  const [productToDelete, setProductToDelete] = useState(null)

  const handleOpenAddProduct = () => {
    setEditingProduct(null)
    setProductModalOpen(true)
  }

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product)
    setProductModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id)
      setProductToDelete(null)
    }
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onViewOrder={(order) => setActiveOrderModal(order)}
            onOpenAddProduct={handleOpenAddProduct}
          />
        )
      case 'products':
        return (
          <ProductsView
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={(product) => setProductToDelete(product)}
            onOpenAddProduct={handleOpenAddProduct}
          />
        )
      case 'orders':
        return (
          <OrdersView
            selectedOrderForModal={activeOrderModal}
            onSelectOrder={(order) => setActiveOrderModal(order)}
          />
        )
      case 'categories':
        return <CategoriesView />
      case 'analytics':
        return <AnalyticsView />
      case 'reviews':
        return <ReviewsView />
      case 'watch-shop':
        return <WatchShopView />
      case 'homepage':
        return <HomePageEditorView />
      case 'settings':
        return <SettingsView />
      default:
        return (
          <DashboardView
            onViewOrder={(order) => setActiveOrderModal(order)}
            onOpenAddProduct={handleOpenAddProduct}
          />
        )
    }
  }

  return (
    <AdminLayout>
      {renderActiveView()}

      {/* Order Details Modal & Invoice */}
      {activeOrderModal && (
        <OrderModal
          order={activeOrderModal}
          onClose={() => setActiveOrderModal(null)}
        />
      )}

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <ProductFormModal
          product={editingProduct}
          isOpen={productModalOpen}
          onClose={() => {
            setProductModalOpen(false)
            setEditingProduct(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-danger text-white py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> Confirm Deletion
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setProductToDelete(null)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <img
                  src={productToDelete.image}
                  alt={productToDelete.name}
                  className="admin-thumb mb-3"
                  style={{ width: 80, height: 80 }}
                  onError={(e) => { e.target.src = '/images/cat1.jpg' }}
                />
                <h6 className="fw-bold mb-1">{productToDelete.name}</h6>
                <p className="text-muted small mb-3">
                  Category: {productToDelete.category} | SKU: {productToDelete.sku || `GS-${productToDelete.id}`}
                </p>
                <div className="alert alert-warning small text-start mb-0">
                  Are you sure you want to delete this product? It will be removed from your store catalog and homepage sections.
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setProductToDelete(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger fw-semibold" onClick={handleConfirmDelete}>
                  <i className="bi bi-trash me-1"></i> Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
