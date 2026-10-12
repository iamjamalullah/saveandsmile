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

export interface HomeThemeConfig {
  announcement_ticker?: {
    enabled?: boolean;
    speed?: number;
    bgColor?: string;
    textColor?: string;
    items?: string[];
  };
  hero_slides?: HeroSlide[];
  sections_visibility?: Record<string, boolean>;
  sections_order?: string[];
  sections_config?: {
    categories_strip?: {
      title?: string;
      selected_categories?: string[];
    };
    hot_selling?: {
      title?: string;
      subtitle?: string;
      tag?: string;
      limit?: number;
      category_filter?: string;
    };
    new_arrivals?: {
      title?: string;
      subtitle?: string;
      tag?: string;
      limit?: number;
    };
    flash_sale?: {
      title?: string;
      subtitle?: string;
      countdown_hours?: number;
    };
    trending_picks?: {
      title?: string;
      subtitle?: string;
      tag?: string;
      limit?: number;
    };
    main_catalog?: {
      title?: string;
      subtitle?: string;
    };
    trust_badges?: {
      badge1_title?: string;
      badge1_desc?: string;
      badge2_title?: string;
      badge2_desc?: string;
      badge3_title?: string;
      badge3_desc?: string;
      badge4_title?: string;
      badge4_desc?: string;
    };
    search_hero?: {
      title?: string;
      subtitle?: string;
    };
    video_reels?: {
      title?: string;
      tag?: string;
    };
    testimonials?: {
      title?: string;
      subtitle?: string;
      tag?: string;
    };
  };
  theme?: {
    primary_color?: string;
    gradient_from?: string;
    gradient_to?: string;
  };
  updated_at?: string;
}

