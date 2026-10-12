import productsData from '@/public/products.json';
import { Product, HeroSlide, CartItem } from './types';

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
