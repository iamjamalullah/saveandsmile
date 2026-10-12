export interface ProductVariant {
  id?: number | string;
  name: string;
  hex?: string;
  size?: string;
  image?: string;
  isFeatured?: boolean;
  price?: number;
  stock?: number;
}

export interface Product {
  id: number | string;
  title: string;
  price: number;
  original_price?: number;
  originalPrice?: number;
  badge?: string;
  image: string;
  images?: string[];
  category: string;
  code?: string;
  rating?: number;
  reviews?: number;
  stock?: number;
  cost?: number;
  description?: string;
  variants?: ProductVariant[];
  isFlashSale?: boolean;
  slug?: string;
  seo_title?: string;
  seo_description?: string;
  focus_keyword?: string;
  secondary_keywords?: string;
  canonical_url?: string;
  is_noindex?: boolean;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  image_alt?: string;
}

export interface HeroSlide {
  id: number | string;
  title: string;
  subtitle?: string;
  image: string;
  badge?: string;
  link?: string;
  active?: boolean;
}

export interface CartItem {
  id: number | string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  qty: number;
  variant?: {
    name?: string;
    size?: string;
  };
}
