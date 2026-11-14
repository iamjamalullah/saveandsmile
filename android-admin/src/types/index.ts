export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface CustomerInfo {
  name: string;
  mobile: string;
  city: string;
  address: string;
  email?: string;
}

export interface OrderItem {
  id?: number | string;
  productId: number | string;
  name?: string;
  sku?: string;
  variantId?: number | string | null;
  variantTitle?: string | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  image?: string;
  product?: {
    id: number | string;
    name: string;
    image?: string;
  };
}

export interface Order {
  id: string;
  customerId?: string;
  customerName?: string;
  customerMobile?: string;
  customerCity?: string;
  customerAddress?: string;
  customerNotes?: string;
  customer?: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  deliveryMethod?: string;
  trackingNumber?: string;
  createdAt?: string;
  date?: string;
}

export interface VariantValue {
  id?: string;
  name: string;
  hex?: string;
}

export interface VariantOption {
  id: string;
  name: string;
  values: VariantValue[];
}

export interface ColorGallery {
  colorName: string;
  images: string[];
  primaryImage?: string;
}

export interface ProductVariant {
  id?: string | number;
  title: string;
  sku: string;
  price: number;
  oldPrice?: number;
  stockQuantity: number;
  image?: string;
  options: Record<string, string>;
  isAvailable?: boolean;
}

export interface Product {
  id: number | string;
  name: string;
  slug?: string;
  sku: string;
  category: string;
  group?: string;
  price: number;
  oldPrice: number;
  stock: number;
  image: string;
  images: string[];
  description: string;
  hasVariants?: boolean;
  variantConfig?: string;
  options?: VariantOption[];
  variants?: ProductVariant[];
  colorGalleries?: ColorGallery[];
  brand?: string;
  isFeatured?: boolean;
  rating?: number;
  reviewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number | string;
  name: string;
  slug?: string;
  icon?: string;
  image?: string;
  productsCount?: number;
}

export interface Review {
  id: number | string;
  productId: number | string;
  name: string;
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  productName?: string;
}

export interface WatchShopItem {
  id: number | string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  productId?: number | string;
  price?: number;
  likes?: number;
}

export interface HeroSlide {
  id: number | string;
  title: string;
  subtitle?: string;
  image: string;
  badge?: string;
  linkText?: string;
  linkUrl?: string;
  order?: number;
}

export interface HomeSection {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  productIds?: (number | string)[];
  bannerImage?: string;
  bannerLink?: string;
  enabled: boolean;
}

export interface StoreSettings {
  name: string;
  tagline?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  currency: string;
  shippingFee: number;
  freeShippingThreshold: number;
  expressShippingFee: number;
  allowGuestCheckout?: boolean;
  announcement?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager';
}

export interface AuthResponse {
  token: string;
  user: StaffUser;
  expiresIn?: number;
}

export interface Inquiry {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  createdAt: string;
}

export interface Coupon {
  id: string | number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usedCount?: number;
  isActive: boolean;
}

export type NotificationCategory = 'order' | 'inventory' | 'inquiry' | 'review' | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  targetId?: string;
  targetScreen?: string;
  isRead: boolean;
  createdAt: string;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'syncing';

export interface UploadResponse {
  success: boolean;
  urls: string[];
  count: number;
  format: string;
  message?: string;
}
