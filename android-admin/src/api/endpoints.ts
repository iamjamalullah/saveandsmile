import { apiRequest } from './client';
import {
  AuthResponse,
  Category,
  HomeSection,
  Order,
  OrderStatus,
  Product,
  Review,
  StaffUser,
  StoreSettings,
  UploadResponse,
  WatchShopItem,
} from '../types';

export const authApi = {
  login: async (identifier: string, password: string):Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { username: identifier, password },
    });
  },

  getProfile: async (): Promise<{ user: StaffUser }> => {
    return apiRequest<{ user: StaffUser }>('/auth/me');
  },

  logout: async (): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>('/auth/logout', { method: 'POST' });
  },
};

export const ordersApi = {
  getOrders: async (): Promise<Order[]> => {
    const res = await apiRequest<Order[]>('/orders');
    return Array.isArray(res) ? res : [];
  },

  getOrderById: async (id: string | number): Promise<Order> => {
    return apiRequest<Order>(`/orders/${id}`);
  },

  updateOrderStatus: async (
    id: string | number,
    status: OrderStatus,
    trackingNumber?: string
  ): Promise<Order> => {
    return apiRequest<Order>(`/orders/${id}`, {
      method: 'PATCH',
      body: { status, trackingNumber },
    });
  },

  deleteOrder: async (id: string | number): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },
};

export const productsApi = {
  getProducts: async (): Promise<Product[]> => {
    const res = await apiRequest<Product[]>('/products');
    return Array.isArray(res) ? res : [];
  },

  getProductById: async (id: string | number): Promise<Product> => {
    return apiRequest<Product>(`/products/${id}`);
  },

  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    return apiRequest<Product>('/products', {
      method: 'POST',
      body: productData,
    });
  },

  updateProduct: async (id: string | number, productData: Partial<Product>): Promise<Product> => {
    return apiRequest<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: productData,
    });
  },

  deleteProduct: async (id: string | number): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  toggleStock: async (product: Product): Promise<Product> => {
    const nextStock = product.stock > 0 ? 0 : 15;
    return apiRequest<Product>(`/products/${product.id}`, {
      method: 'PATCH',
      body: { stock: nextStock },
    });
  },
};

export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const res = await apiRequest<Category[]>('/categories');
    return Array.isArray(res) ? res : [];
  },

  createCategory: async (categoryData: Partial<Category>): Promise<Category> => {
    return apiRequest<Category>('/categories', {
      method: 'POST',
      body: categoryData,
    });
  },

  updateCategory: async (id: string | number, categoryData: Partial<Category>): Promise<Category> => {
    return apiRequest<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: categoryData,
    });
  },

  deleteCategory: async (id: string | number): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

export const uploadApi = {
  /**
   * Uploads base64 or DataURL images to the centralized WebP server pipeline.
   * Sharp converts the images to WebP on the backend and uploads them to Supabase Storage.
   */
  uploadImages: async (
    images: { name: string; dataUrl: string }[]
  ): Promise<UploadResponse> => {
    return apiRequest<UploadResponse>('/upload', {
      method: 'POST',
      body: {
        images: images.map(img => ({
          name: img.name,
          data: img.dataUrl,
        })),
      },
    });
  },
};

export const homepageApi = {
  getSections: async (): Promise<HomeSection[]> => {
    const res = await apiRequest<HomeSection[]>('/homepage/sections');
    return Array.isArray(res) ? res : [];
  },

  getDraft: async (): Promise<HomeSection[]> => {
    const res = await apiRequest<HomeSection[]>('/homepage/draft');
    return Array.isArray(res) ? res : [];
  },

  saveDraft: async (sections: HomeSection[]): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>('/homepage/draft', {
      method: 'POST',
      body: { sections },
    });
  },

  publishSections: async (sections: HomeSection[]): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>('/homepage/publish', {
      method: 'POST',
      body: { sections },
    });
  },
};

export const reviewsApi = {
  getReviews: async (): Promise<Review[]> => {
    const res = await apiRequest<Review[]>('/reviews');
    return Array.isArray(res) ? res : [];
  },

  updateStatus: async (id: string | number, status: 'approved' | 'rejected'): Promise<Review> => {
    return apiRequest<Review>(`/reviews/${id}`, {
      method: 'PATCH',
      body: { status },
    });
  },

  deleteReview: async (id: string | number): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/reviews/${id}`, {
      method: 'DELETE',
    });
  },
};

export const watchShopApi = {
  getItems: async (): Promise<WatchShopItem[]> => {
    const res = await apiRequest<WatchShopItem[]>('/watch_shop');
    return Array.isArray(res) ? res : [];
  },

  createItem: async (item: Partial<WatchShopItem>): Promise<WatchShopItem> => {
    return apiRequest<WatchShopItem>('/watch_shop', {
      method: 'POST',
      body: item,
    });
  },

  deleteItem: async (id: string | number): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/watch_shop/${id}`, {
      method: 'DELETE',
    });
  },
};

export const settingsApi = {
  getSettings: async (): Promise<StoreSettings> => {
    const res = await apiRequest<any>('/store_settings');
    if (Array.isArray(res) && res.length > 0) return res[0];
    if (res && typeof res === 'object') return res;
    return {
      name: 'Save & Smile',
      currency: 'Rs.',
      shippingFee: 200,
      freeShippingThreshold: 3000,
      expressShippingFee: 350,
    };
  },

  updateSettings: async (settings: Partial<StoreSettings>): Promise<StoreSettings> => {
    return apiRequest<StoreSettings>('/store_settings/1', {
      method: 'PATCH',
      body: settings,
    });
  },
};
