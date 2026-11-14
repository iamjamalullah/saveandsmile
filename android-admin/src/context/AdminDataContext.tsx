import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Category,
  ConnectionStatus,
  Coupon,
  Inquiry,
  NotificationItem,
  Order,
  OrderStatus,
  Product,
  Review,
  StoreSettings,
  WatchShopItem,
} from '../types';
import {
  categoriesApi,
  couponsApi,
  inquiriesApi,
  ordersApi,
  productsApi,
  reviewsApi,
  settingsApi,
  watchShopApi,
} from '../api/endpoints';
import { useAuth } from './AuthContext';
import { realtimeSync } from '../services/RealtimeSync';
import { notificationService } from '../services/NotificationService';

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
  inquiries: Inquiry[];
  coupons: Coupon[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  settings: StoreSettings;
  stats: DashboardStats;
  connectionStatus: ConnectionStatus;
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
  updateInquiryStatus: (id: string | number, status: 'new' | 'in_progress' | 'resolved') => Promise<void>;
  deleteInquiry: (id: string | number) => Promise<void>;
  saveCoupon: (coupon: Partial<Coupon>) => Promise<Coupon>;
  deleteCoupon: (id: string | number) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearAllNotifications: () => void;
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
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time notifications
  useEffect(() => {
    const unsub = notificationService.subscribe(items => {
      setNotifications([...items]);
    });
    return unsub;
  }, []);

  // Subscribe to Realtime Sync Service
  useEffect(() => {
    if (!isAuthenticated) {
      realtimeSync.stop();
      setConnectionStatus('disconnected');
      return;
    }

    realtimeSync.start();

    const unsubSync = realtimeSync.subscribe(syncData => {
      setConnectionStatus(syncData.status);
      if (syncData.orders) setOrders(syncData.orders);
      if (syncData.products) setProducts(syncData.products);
      if (syncData.inquiries) setInquiries(syncData.inquiries);
    });

    return () => {
      unsubSync();
      realtimeSync.stop();
    };
  }, [isAuthenticated]);

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setError(null);
    try {
      const [oList, pList, cList, sData, rList, wList, inqList, coupList] = await Promise.all([
        ordersApi.getOrders().catch(() => []),
        productsApi.getProducts().catch(() => []),
        categoriesApi.getCategories().catch(() => []),
        settingsApi.getSettings().catch(() => defaultSettings),
        reviewsApi.getReviews().catch(() => []),
        watchShopApi.getItems().catch(() => []),
        inquiriesApi.getInquiries().catch(() => []),
        couponsApi.getCoupons().catch(() => []),
      ]);

      setOrders(oList);
      setProducts(pList);
      setCategories(cList);
      setSettings(sData);
      setReviews(rList);
      setWatchShop(wList);
      setInquiries(inqList);
      setCoupons(coupList);
      setConnectionStatus('connected');
    } catch (err: any) {
      setError(err?.message || 'Failed to sync data with Save & Smile backend.');
      setConnectionStatus('disconnected');
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
      setInquiries([]);
      setCoupons([]);
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

  // Order Actions with Safe Optimistic Rollback
  const updateOrderStatus = async (id: string | number, status: OrderStatus, tracking?: string) => {
    const originalOrders = [...orders];
    // 1. Optimistic UI update
    setOrders(prev =>
      prev.map(o => (String(o.id) === String(id) ? { ...o, status, trackingNumber: tracking || o.trackingNumber } : o))
    );

    try {
      // 2. Authoritative backend synchronization
      const updated = await ordersApi.updateOrderStatus(id, status, tracking);
      setOrders(prev => prev.map(o => (String(o.id) === String(id) ? { ...o, ...updated, status } : o)));

      // Trigger background sync across other clients
      realtimeSync.triggerSync();
    } catch (err) {
      // 3. Rollback on failure
      setOrders(originalOrders);
      throw err;
    }
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
    realtimeSync.triggerSync();
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

  // Inquiry Actions
  const updateInquiryStatus = async (id: string | number, status: 'new' | 'in_progress' | 'resolved') => {
    await inquiriesApi.updateStatus(id, status);
    setInquiries(prev => prev.map(inq => (String(inq.id) === String(id) ? { ...inq, status } : inq)));
  };

  const deleteInquiry = async (id: string | number) => {
    await inquiriesApi.deleteInquiry(id);
    setInquiries(prev => prev.filter(inq => String(inq.id) !== String(id)));
  };

  // Coupon Actions
  const saveCoupon = async (couponData: Partial<Coupon>): Promise<Coupon> => {
    let saved: Coupon;
    if (couponData.id) {
      saved = await couponsApi.updateCoupon(couponData.id, couponData);
      setCoupons(prev => prev.map(c => (String(c.id) === String(couponData.id) ? saved : c)));
    } else {
      saved = await couponsApi.createCoupon(couponData);
      setCoupons(prev => [saved, ...prev]);
    }
    return saved;
  };

  const deleteCoupon = async (id: string | number) => {
    await couponsApi.deleteCoupon(id);
    setCoupons(prev => prev.filter(c => String(c.id) !== String(id)));
  };

  // Notification Actions
  const markNotificationRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const markAllNotificationsRead = () => {
    notificationService.markAllAsRead();
  };

  const clearAllNotifications = () => {
    notificationService.clearAll();
  };

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  return (
    <AdminDataContext.Provider
      value={{
        orders,
        products,
        categories,
        reviews,
        watchShop,
        inquiries,
        coupons,
        notifications,
        unreadNotificationCount,
        settings,
        stats,
        connectionStatus,
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
        updateInquiryStatus,
        deleteInquiry,
        saveCoupon,
        deleteCoupon,
        markNotificationRead,
        markAllNotificationsRead,
        clearAllNotifications,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => useContext(AdminDataContext);
