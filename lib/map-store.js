const { srcsetFrom } = require('./media');

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch (e) { return fallback; }
}

function mediaUrl(media) {
  if (!media) return '';
  const v = parseJson(media.variants, {});
  return v.medium || media.url || v.original || '';
}

function toStoreProduct(row, media) {
  const img = mediaUrl(media) || row.image_url || '';
  const set = srcsetFrom(media || { url: img, variants: { original: img } });
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    shortDescription: row.short_description || '',
    code: row.sku || '',
    category: row.category_id || 'storage',
    tab: row.tab || row.category_id || 'storage',
    price: Number(row.price) || 0,
    originalPrice: Number(row.compare_price) || Number(row.price) || 0,
    rating: Number(row.rating) || 4.8,
    reviews: Number(row.reviews_count) || 0,
    badge: row.badge || '',
    image: img,
    imageSrcset: set.srcset,
    imageWidth: set.width,
    imageHeight: set.height,
    stock: Number(row.stock) || 0,
    isFlashSale: Boolean(row.featured) || (row.badge || '').toLowerCase().includes('hot'),
    slug: row.slug,
    status: row.status,
    gallery: row.gallery || []
  };
}

function toStoreCategory(row) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || '',
    count: Number(row.product_count) || 0,
    slug: row.slug,
    image: row.image_url || ''
  };
}

function defaultHomepageSections() {
  return [
    { id: 'ticker', type: 'ticker', visible: true, props: { items: [] } },
    { id: 'header', type: 'header', visible: true, props: {} },
    { id: 'hero', type: 'hero_slider', visible: true, props: {} },
    { id: 'categories', type: 'category_strip', visible: true, props: {} },
    { id: 'trust', type: 'trust_badges', visible: true, props: {} },
    { id: 'tabs', type: 'front_tabs', visible: true, props: {} },
    { id: 'flash', type: 'flash_sale', visible: true, props: {} },
    { id: 'catalog', type: 'product_grid', visible: true, props: {} },
    { id: 'search_hero', type: 'search_hero', visible: true, props: {} },
    { id: 'reels', type: 'reels', visible: true, props: {} },
    { id: 'reviews', type: 'reviews', visible: true, props: {} },
    { id: 'footer', type: 'footer', visible: true, props: {} }
  ];
}

const SECTION_DOM = {
  ticker: 'tickerSection',
  header: 'headerSection',
  hero: 'heroSliderSection',
  categories: 'shopSliderSection',
  trust: 'HomePageFooterIcons',
  tabs: 'HomePageTabs',
  flash: 'flashSale',
  catalog: 'products',
  search_hero: 'HomePageBuilder',
  reels: 'HomePageReels',
  reviews: 'testimonialsSection',
  footer: 'siteFooter'
};

module.exports = { parseJson, mediaUrl, toStoreProduct, toStoreCategory, defaultHomepageSections, SECTION_DOM };
