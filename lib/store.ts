import productsData from '@/public/products.json';
import { Product, HeroSlide, CartItem, HomeThemeConfig } from './types';

export const DEFAULT_PRODUCTS: Product[] = productsData as Product[];

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: "Wholesale Online Mega Sale",
    subtitle: "Get unbeatable prices on trending gadgets & home organizers",
    image: "https://www.qadrigadgets.pk/images/banners/6a91c696b7d39.webp",
    badge: "MEGA SALE",
    link: "#products"
  },
  {
    id: 2,
    title: "Electric Insect Killers & Summer Gadgets",
    subtitle: "Wholesale prices with Cash on Delivery nationwide across Pakistan",
    image: "https://www.qadrigadgets.pk/images/banners/6a7af65669503.webp",
    badge: "SUMMER DEALS",
    link: "#products"
  },
  {
    id: 3,
    title: "Trending Water Bottles & Sippers",
    subtitle: "High quality mugs and bottles at direct factory rates",
    image: "https://www.qadrigadgets.pk/images/banners/6a7af65669d26.webp",
    badge: "POPULAR",
    link: "#products"
  },
  {
    id: 4,
    title: "Store it Beautifully - Storage & Racks",
    subtitle: "Best selling home organizers with high reseller margins",
    image: "https://www.qadrigadgets.pk/images/banners/6a7af6566a0fa.webp",
    badge: "STORAGE & RACKS",
    link: "#products"
  },
  {
    id: 5,
    title: "Toys & Kids Collection",
    subtitle: "Fun learning toys and games for resellers",
    image: "https://www.qadrigadgets.pk/images/banners/6a6e1db8c4ccd.webp",
    badge: "KIDS SPECIAL",
    link: "#products"
  },
  {
    id: 6,
    title: "Fashion Mobile Accessories & Tech",
    subtitle: "Direct wholesale rates for tech resellers",
    image: "https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp",
    badge: "MOBILE ACCESSORIES",
    link: "#products"
  }
];

export function getClientProducts(): Product[] {
  if (typeof window === 'undefined') return DEFAULT_PRODUCTS;
  try {
    const serverCached = JSON.parse(localStorage.getItem('save_and_smile_server_products') || 'null');
    const custom = JSON.parse(localStorage.getItem('qadri_custom_products') || '[]');
    const overrides = JSON.parse(localStorage.getItem('qadri_product_overrides') || '{}');
    const deleted = JSON.parse(localStorage.getItem('qadri_deleted_products') || '[]');

    const baseSource = (Array.isArray(serverCached) && serverCached.length > 0)
      ? serverCached
      : DEFAULT_PRODUCTS;

    const base = baseSource
      .filter(p => !deleted.some((d: any) => String(d) === String(p.id)))
      .map(p => {
        const override = overrides[p.id] || overrides[String(p.id)] || overrides[Number(p.id)];
        return override ? { ...p, ...override } : p;
      });

    return [...custom, ...base];
  } catch (err) {
    console.warn('Error reading products state:', err);
    return DEFAULT_PRODUCTS;
  }
}

export function getClientHeroSlides(): HeroSlide[] {
  if (typeof window === 'undefined') return DEFAULT_HERO_SLIDES;
  try {
    const stored = localStorage.getItem('qadri_hero_slides') || localStorage.getItem('qadri_custom_banners');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // If stored contains non-existent local dummy paths like 'banner1.webp', fallback to DEFAULT_HERO_SLIDES
        const isDummy = parsed.some((s: any) => s.image && s.image.includes('banner1.webp'));
        if (!isDummy) return parsed;
      }
    }
  } catch (err) {}
  return DEFAULT_HERO_SLIDES;
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('qadri_cart') || '[]');
  } catch (err) {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('qadri_cart', JSON.stringify(items));
  window.dispatchEvent(new Event('qadri_cart_updated'));
}

export const DEFAULT_HOME_CONFIG: HomeThemeConfig = {
  announcement_ticker: {
    enabled: true,
    speed: 32,
    bgColor: "#004d57",
    textColor: "#ffffff",
    items: [
      "🚀 Welcome to <strong>Save & Smile Wholesale Portal</strong> (Shop • Save • Smile)",
      "🔥 Direct Factory Wholesale Rates in Pakistan — Guaranteed Margin for Resellers",
      "🚚 Cash on Delivery (COD) Nationwide | Free Delivery Above Rs. 3,000",
      "📞 24/7 Helpline & WhatsApp: <strong>0316-2323616</strong>"
    ]
  },
  hero_slides: DEFAULT_HERO_SLIDES,
  sections_visibility: {
    announcement_ticker: true,
    hero_slider: true,
    categories_strip: true,
    trust_badges: true,
    hot_selling: true,
    new_arrivals: true,
    flash_sale: true,
    trending_picks: true,
    main_catalog: true,
    search_hero: true,
    video_reels: true,
    testimonials: true
  },
  sections_order: [
    'hero_slider',
    'categories_strip',
    'trust_badges',
    'hot_selling',
    'new_arrivals',
    'flash_sale',
    'trending_picks',
    'main_catalog',
    'search_hero',
    'video_reels',
    'testimonials'
  ],
  sections_config: {
    categories_strip: {
      title: "Shop By Categories"
    },
    hot_selling: {
      title: "Hot Selling Wholesale Gadgets",
      subtitle: "Fast moving products with highest reseller profit margins",
      tag: "🔥 HOT SELLING",
      limit: 8
    },
    new_arrivals: {
      title: "Latest New Arrivals",
      subtitle: "Fresh containers imported this week — First batch wholesale prices",
      tag: "✨ NEW ARRIVALS",
      limit: 8
    },
    flash_sale: {
      title: "TODAY'S FLASH SALE",
      subtitle: "Limited quantity left at discounted wholesale prices!",
      countdown_hours: 14
    },
    trending_picks: {
      title: "Trending Wholesale Picks",
      subtitle: "Most demanded smart watches, organizers & lifestyle essentials",
      tag: "🌟 TRENDING PICKS",
      limit: 8
    },
    main_catalog: {
      title: "Trending Wholesale Catalog",
      subtitle: "Showing verified products in stock"
    },
    trust_badges: {
      badge1_title: "Support 24/7",
      badge1_desc: "Direct WhatsApp & Call wholesale assistance",
      badge2_title: "Best Prices",
      badge2_desc: "Direct factory prices for bulk & retail",
      badge3_title: "Secure Payment",
      badge3_desc: "Cash on delivery & verified digital transfers",
      badge4_title: "7 Days Replacement",
      badge4_desc: "Hassle-free product verification & exchange"
    },
    search_hero: {
      title: "Find Any Product Instantly",
      subtitle: "Search through thousands of top-selling gadgets, home organizers, smart watches, and trending electronic items in Pakistan."
    },
    video_reels: {
      title: "Watch & Shop",
      tag: "IN MOTION"
    },
    testimonials: {
      title: "What Our Clients Say",
      subtitle: "Real stories and verified reviews from our valued wholesale customers across Pakistan",
      tag: "FEEDBACK"
    }
  },
  theme: {
    primary_color: "#007382",
    gradient_from: "#004d57",
    gradient_to: "#83a82b"
  }
};

export function getClientHomeConfig(): HomeThemeConfig {
  if (typeof window === 'undefined') return DEFAULT_HOME_CONFIG;
  try {
    const stored = localStorage.getItem('qadri_home_config') || localStorage.getItem('qadri_theme_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_HOME_CONFIG,
          ...parsed,
          sections_visibility: {
            ...DEFAULT_HOME_CONFIG.sections_visibility,
            ...(parsed.sections_visibility || {})
          },
          sections_config: {
            ...DEFAULT_HOME_CONFIG.sections_config,
            ...(parsed.sections_config || {})
          },
          hero_slides: (Array.isArray(parsed.hero_slides) && parsed.hero_slides.length > 0)
            ? parsed.hero_slides
            : DEFAULT_HOME_CONFIG.hero_slides
        };
      }
    }
  } catch (e) {}
  return DEFAULT_HOME_CONFIG;
}

