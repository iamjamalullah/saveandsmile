import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Category,
  Order,
  OrderStatus,
  Product,
  Review,
  StoreSettings,
  WatchShopItem,
} from '../types';
import {
  categoriesApi,
  ordersApi,
  productsApi,
  reviewsApi,
  settingsApi,
  watchShopApi,
} from '../api/endpoints';
import { useAuth } from './AuthContext';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  averageOrderValue: number;
}

interface AdminDataContextType {
  orders: Order[];
  products: Product[];
  categories: Category[];
  reviews: Review[];
  watchShop: WatchShopItem[];
  settings: StoreSettings;
  stats: DashboardStats;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  updateOrderStatus: (id: string | number, status: OrderStatus, tracking?: string) => Promise<void>;
  deleteOrder: (id: string | number) => Promise<void>;
  saveProduct: (product: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string | number) => Promise<void>;
  toggleProductStock: (product: Product) => Promise<void>;
  saveCategory: (category: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string | number) => Promise<void>;
  updateStoreSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  approveReview: (id: string | number) => Promise<void>;
  rejectReview: (id: string | number) => Promise<void>;
  deleteReview: (id: string | number) => Promise<void>;
}

const defaultSettings: StoreSettings = {
  name: 'Save & Smile',
  currency: 'Rs.',
  shippingFee: 200,
  freeShippingThreshold: 3000,
  expressShippingFee: 350,
};

const AdminDataContext = createContext<AdminDataContextType>({} as AdminDataContextType);

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [watchShop, setWatchShop] = useState<WatchShopItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setError(null);
    try {
      const [oList, pList, cList, sData, rList, wList] = await Promise.all([
        ordersApi.getOrders().catch(() => []),
        productsApi.getProducts().catch(() => []),
        categoriesApi.getCategories().catch(() => []),
        settingsApi.getSettings().catch(() => defaultSettings),
        reviewsApi.getReviews().catch(() => []),
        watchShopApi.getItems().catch(() => []),
      ]);

      setOrders(oList);
      setProducts(pList);
      setCategories(cList);
      setSettings(sData);
      setReviews(rList);
      setWatchShop(wList);
    } catch (err: any) {
      setError(err?.message || 'Failed to sync data with Save & Smile backend.');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      refreshAll().finally(() => setIsLoading(false));
    } else {
      setOrders([]);
      setProducts([]);
      setCategories([]);
    }
  }, [isAuthenticated, refreshAll]);

  // Derived Dashboard Statistics
  const stats: DashboardStats = useMemo(() => {
    let revenue = 0;
    let pending = 0;
    let processing = 0;
    let shipped = 0;
    let delivered = 0;
    let cancelled = 0;

    for (const o of orders) {
      const total = Number(o.total || 0);
      if (o.status === 'Delivered') revenue += total;
      if (o.status === 'Pending') pending++;
      else if (o.status === 'Processing') processing++;
      else if (o.status === 'Shipped') shipped++;
      else if (o.status === 'Delivered') delivered++;
      else if (o.status === 'Cancelled') cancelled++;
    }

    const lowStock = products.filter(p => p.stock <= 5).length;
    const avgOrder = orders.length > 0 ? Math.round(revenue / (delivered || 1)) : 0;

    return {
      totalRevenue: revenue,
      totalOrders: orders.length,
      pendingOrders: pending,
      processingOrders: processing,
      shippedOrders: shipped,
      deliveredOrders: delivered,
      cancelledOrders: cancelled,
      totalProducts: products.length,
      lowStockProducts: lowStock,
      averageOrderValue: avgOrder,
    };
  }, [orders, products]);

  // Order Actions
  const updateOrderStatus = async (id: string | number, status: OrderStatus, tracking?: string) => {
    const updated = await ordersApi.updateOrderStatus(id, status, tracking);
    setOrders(prev => prev.map(o => (String(o.id) === String(id) ? { ...o, ...updated, status } : o)));
  };

  const deleteOrder = async (id: string | number) => {
    await ordersApi.deleteOrder(id);
    setOrders(prev => prev.filter(o => String(o.id) !== String(id)));
  };

  // Product Actions
  const saveProduct = async (productData: Partial<Product>): Promise<Product> => {
    let saved: Product;
    if (productData.id) {
      saved = await productsApi.updateProduct(productData.id, productData);
      setProducts(prev => prev.map(p => (String(p.id) === String(productData.id) ? saved : p)));
    } else {
      saved = await productsApi.createProduct(productData);
      setProducts(prev => [saved, ...prev]);
    }
    return saved;
  };

  const deleteProduct = async (id: string | number) => {
    await productsApi.deleteProduct(id);
    setProducts(prev => prev.filter(p => String(p.id) !== String(id)));
  };

  const toggleProductStock = async (product: Product) => {
    const updated = await productsApi.toggleStock(product);
    setProducts(prev => prev.map(p => (String(p.id) === String(product.id) ? { ...p, stock: updated.stock } : p)));
  };

  // Category Actions
  const saveCategory = async (catData: Partial<Category>): Promise<Category> => {
    let saved: Category;
    if (catData.id) {
      saved = await categoriesApi.updateCategory(catData.id, catData);
      setCategories(prev => prev.map(c => (String(c.id) === String(catData.id) ? saved : c)));
    } else {
      saved = await categoriesApi.createCategory(catData);
      setCategories(prev => [...prev, saved]);
    }
    return saved;
  };

  const deleteCategory = async (id: string | number) => {
    await categoriesApi.deleteCategory(id);
    setCategories(prev => prev.filter(c => String(c.id) !== String(id)));
  };

  const updateStoreSettings = async (newSettings: Partial<StoreSettings>) => {
    const saved = await settingsApi.updateSettings(newSettings);
    setSettings(saved);
  };

  const approveReview = async (id: string | number) => {
    await reviewsApi.updateStatus(id, 'approved');
    setReviews(prev => prev.map(r => (String(r.id) === String(id) ? { ...r, status: 'approved' } : r)));
  };

  const rejectReview = async (id: string | number) => {
    await reviewsApi.updateStatus(id, 'rejected');
    setReviews(prev => prev.map(r => (String(r.id) === String(id) ? { ...r, status: 'rejected' } : r)));
  };

  const deleteReview = async (id: string | number) => {
    await reviewsApi.deleteReview(id);
    setReviews(prev => prev.filter(r => String(r.id) !== String(id)));
  };

  return (
    <AdminDataContext.Provider
      value={{
        orders,
        products,
        categories,
        reviews,
        watchShop,
        settings,
        stats,
        isLoading,
        isRefreshing,
        error,
        refreshAll,
        updateOrderStatus,
        deleteOrder,
        saveProduct,
        deleteProduct,
        toggleProductStock,
        saveCategory,
        deleteCategory,
        updateStoreSettings,
        approveReview,
        rejectReview,
        deleteReview,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => useContext(AdminDataContext);
