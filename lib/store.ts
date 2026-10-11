import productsData from '@/public/products.json';
import { Product, HeroSlide, CartItem } from './types';

export const DEFAULT_PRODUCTS: Product[] = productsData as Product[];

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: "Pakistan's #1 Wholesale Hub",
    subtitle: "Direct Factory Prices • Guaranteed Profit Margins • Cash on Delivery",
    image: "images/banner1.webp",
    badge: "WHOLESALE DEALS",
    link: "#products"
  },
  {
    id: 2,
    title: "Trending Household & Kitchen Gadgets",
    subtitle: "Over 500+ High Quality Smart Utility Items Ready to Dispatch",
    image: "images/banner2.webp",
    badge: "NEW ARRIVALS",
    link: "#products"
  },
  {
    id: 3,
    title: "Smartwatches, Audio & Mobile Gear",
    subtitle: "Best Margin Reseller Deals with 7 Days Checking Warranty",
    image: "images/banner3.webp",
    badge: "TOP SELLERS",
    link: "#products"
  }
];

export function getClientProducts(): Product[] {
  if (typeof window === 'undefined') return DEFAULT_PRODUCTS;
  try {
    const custom = JSON.parse(localStorage.getItem('qadri_custom_products') || '[]');
    const overrides = JSON.parse(localStorage.getItem('qadri_product_overrides') || '{}');
    const deleted = JSON.parse(localStorage.getItem('qadri_deleted_products') || '[]');

    const base = DEFAULT_PRODUCTS
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
    const stored = localStorage.getItem('qadri_hero_slides');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
