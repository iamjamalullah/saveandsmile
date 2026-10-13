import { Product, ProductVariant } from './types';

interface WooCommerceImage {
  id: number;
  src: string;
  name?: string;
  alt?: string;
}

interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
}

interface WooCommerceAttribute {
  id: number;
  name: string;
  options: string[];
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  description: string;
  short_description: string;
  sku: string;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  categories: WooCommerceCategory[];
  images: WooCommerceImage[];
  attributes: WooCommerceAttribute[];
  variations: number[];
  type: string;
}

export interface WooCommerceOrderPayload {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing: {
    first_name: string;
    last_name?: string;
    address_1: string;
    city: string;
    phone: string;
    email?: string;
  };
  shipping: {
    first_name: string;
    last_name?: string;
    address_1: string;
    city: string;
    phone: string;
  };
  line_items: Array<{
    product_id: number | string;
    quantity: number;
    variation_id?: number | string;
  }>;
  customer_note?: string;
}

export function isWooConfigured(): boolean {
  return Boolean(
    process.env.WORDPRESS_URL &&
    process.env.WC_CONSUMER_KEY &&
    process.env.WC_CONSUMER_SECRET
  );
}

function getAuthHeader(): string {
  const key = process.env.WC_CONSUMER_KEY || '';
  const secret = process.env.WC_CONSUMER_SECRET || '';
  return 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
}

function getBaseUrl(): string {
  const url = process.env.WORDPRESS_URL || '';
  return url.replace(/\/+$/, '');
}

/**
 * Transforms a raw WooCommerce Product to Save & Smile Product interface
 */
export function transformWooProduct(wc: WooCommerceProduct): Product {
  const regularPrice = wc.regular_price ? parseFloat(wc.regular_price) : undefined;
  const currentPrice = parseFloat(wc.price || wc.sale_price || wc.regular_price || '0');

  // Strip HTML from descriptions for clean presentation
  const plainDesc = (wc.short_description || wc.description || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const primaryImage = wc.images?.[0]?.src || '/images/save-and-smile-logo.png';
  const allImages = (wc.images || []).map(img => img.src).filter(Boolean);

  const mainCategory = wc.categories?.[0]?.slug || 'storage';

  // Construct badge
  let badge = 'NEW ARRIVAL';
  if (wc.on_sale && regularPrice && regularPrice > currentPrice) {
    const pct = Math.round(((regularPrice - currentPrice) / regularPrice) * 100);
    badge = `${pct}% OFF`;
  } else if (wc.stock_status === 'outofstock') {
    badge = 'SOLD OUT';
  }

  // Construct variations / attributes if present
  const variants: ProductVariant[] = [];
  if (Array.isArray(wc.attributes) && wc.attributes.length > 0) {
    wc.attributes.forEach(attr => {
      const isSize = /size/i.test(attr.name);
      const isColor = /color|colour/i.test(attr.name);
      (attr.options || []).forEach(opt => {
        variants.push({
          name: isColor ? opt : (isSize ? 'Standard' : opt),
          size: isSize ? opt : undefined,
          price: currentPrice,
          image: primaryImage,
          stock: wc.stock_quantity ?? 50
        });
      });
    });
  }

  return {
    id: wc.id,
    title: wc.name,
    price: currentPrice,
    originalPrice: regularPrice || currentPrice,
    original_price: regularPrice || currentPrice,
    image: primaryImage,
    images: allImages.length > 0 ? allImages : [primaryImage],
    category: mainCategory,
    code: wc.sku || `WC-${wc.id}`,
    badge,
    description: plainDesc,
    stock: wc.stock_quantity ?? (wc.stock_status === 'instock' ? 100 : 0),
    slug: wc.slug,
    variants: variants.length > 0 ? variants : undefined
  };
}

/**
 * Generic authenticated fetch with automatic fallback between /wp-json/ and /?rest_route=/
 */
async function wooFetch(endpointPath: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getBaseUrl();
  const cleanPath = endpointPath.replace(/^\/+/, '');
  
  // Try standard /wp-json/wc/v3/ first
  const standardUrl = `${baseUrl}/wp-json/wc/v3/${cleanPath}`;
  const headers = {
    'Authorization': getAuthHeader(),
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(standardUrl, { ...options, headers });
    if (res.status !== 404) {
      return res;
    }
  } catch (e) {}

  // Fallback to ?rest_route=/wc/v3/ if permalinks are set to plain
  const sep = cleanPath.includes('?') ? '&' : '?';
  const plainUrl = `${baseUrl}/?rest_route=/wc/v3/${cleanPath}`;
  return await fetch(plainUrl, { ...options, headers });
}

/**
 * Fetch products from WooCommerce REST API
 */
export async function fetchWooProducts(params: { per_page?: number; category?: string; search?: string } = {}): Promise<Product[] | null> {
  if (!isWooConfigured()) return null;

  try {
    const query = new URLSearchParams();
    query.set('per_page', String(params.per_page || 100));
    query.set('status', 'publish');
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'all') {
      query.set('category', params.category);
    }

    const res = await wooFetch(`products?${query.toString()}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      console.warn(`WooCommerce API Error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data: WooCommerceProduct[] = await res.json();
    if (!Array.isArray(data)) return null;

    return data.map(transformWooProduct);
  } catch (err: any) {
    console.error('Failed to fetch from WooCommerce:', err.message);
    return null;
  }
}

/**
 * Fetch a single product by ID or slug from WooCommerce
 */
export async function fetchWooProductById(idOrSlug: string | number): Promise<Product | null> {
  if (!isWooConfigured()) return null;

  try {
    const isNumeric = !isNaN(Number(idOrSlug));
    const queryPath = isNumeric
      ? `products/${idOrSlug}`
      : `products?slug=${encodeURIComponent(String(idOrSlug))}`;

    const res = await wooFetch(queryPath, {
      cache: 'no-store'
    });

    if (!res.ok) return null;

    const data = await res.json();
    const rawProduct = Array.isArray(data) ? data[0] : data;
    if (!rawProduct || !rawProduct.id) return null;

    return transformWooProduct(rawProduct);
  } catch (err: any) {
    console.error('Failed to fetch product from WooCommerce:', err.message);
    return null;
  }
}

/**
 * Create an order directly in WooCommerce
 */
export async function createWooOrder(orderData: WooCommerceOrderPayload): Promise<any | null> {
  if (!isWooConfigured()) return null;

  try {
    const res = await wooFetch('orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`WooCommerce Create Order Failed (${res.status}):`, errBody);
      return null;
    }

    return await res.json();
  } catch (err: any) {
    console.error('WooCommerce order creation exception:', err.message);
    return null;
  }
}
