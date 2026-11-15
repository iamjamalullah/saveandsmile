// ─────────────────────────────────────────────────────────────
//  Save & Smile – static presentation config.
//  Catalogue content (products, categories, hero banners, reviews)
//  lives in Supabase PostgreSQL / db.json and is served by
//  StoreDataContext API layer.
// ─────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'Save & Smile',
  tagline: 'Your Trusted Online Shopping Hub',
  logo: '/LOGO001.png',
  logoWhite: '/logo-white.png',
  logoFooter: '/LOGO001.png',
  menuIcon: '/LOGO001.png',
  phone: '0333-7221552',
  phone2: '0333-7221552',
  tel: '+923337221552',
  tel2: '+923337221552',
  whatsapp: '923337221552',
  email: null,
  address: 'Karachi, Pakistan',
  announcement: 'Welcome to Save & Smile — Pakistan\'s Leading Wholesale & Retail Store · Free Nationwide Shipping on Orders Above Rs. 3,000!',
  announcementPhone: '0333-7221552',
  freeShippingThreshold: 3000,
  shippingFee: 200,
  expressShippingFee: 350,
}

export const UI = {
  quickView: '/images/banner-placeholder.webp',
  heart: '/images/banner-placeholder.webp',
  cart: '/LOGO001.png',
  close: '',
  min: '',
  plus: '',
  loader: '/images/banner-placeholder.webp',
  sprites: '',
}

export const HEADER_ICONS = {
  search: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23334155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  call: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23334155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  wishlist: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23334155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  user: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23334155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  cart: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23334155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
}

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'All Products', href: '/shop' },
  { label: 'Product Categories', href: '/shop', mega: true },
  { label: 'Wholesale & Bulk Buying', href: '/bulk-order' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Contact Us', href: '/contact' },
]

export const TRUST_BADGES = [
  { title: 'Support 24/7', image: '/images/banner-placeholder.webp' },
  { title: 'Best Prices', image: '/images/banner-placeholder.webp' },
  { title: 'Secure Payment', image: '/images/banner-placeholder.webp' },
]

export const SHOP_UNDER = [
  { max: 500, image: '/images/under1.png' },
  { max: 1000, image: '/images/under2.png' },
  { max: 1500, image: '/images/under3.png' },
  { max: 2000, image: '/images/under4.png' },
  { max: 3000, image: '/images/under5.png' },
  { max: 5000, image: '/images/under6.png' },
]

export const SEARCH_BANNER = {
  title: 'تلاش کریں اپنی پسندیدہ اشیاء',
  subtitle: 'Explore thousands of products at the best prices',
  trending: [
    { label: '💎 Jewelry', q: 'Jewelry' },
    { label: '✨ Perfumes', q: 'Perfumes' },
    { label: '🔪 Chopper', q: 'Chopper' },
    { label: '🧸 Toys', q: 'Toys' },
    { label: '🍼 Bottle', q: 'Bottle' },
  ],
}

// Homepage tab strip labels (products are matched by group from the API).
export const CATEGORY_TABS = [
  { key: 'storage', label: ['Storage &', 'Organization'], group: 'home' },
  { key: 'jewelry', label: ['Jewelry &', 'Accessories'], group: 'jewelry' },
  { key: 'bags', label: ['Fashion Bags &', 'Travel'], group: 'like' },
]

// Homepage sections available in the admin product form.
export const GROUPS = [
  { id: 'new', label: 'New Arrivals' },
  { id: 'hot', label: 'Hot Selling Products' },
  { id: 'home', label: 'Home Essentials Organizers' },
  { id: 'like', label: 'You May Also Like' },
  { id: 'perfume', label: 'Top Picks Fragrances' },
  { id: 'trending', label: 'Trending Now' },
  { id: 'jewelry', label: 'Elegant Jewelry & Accessories' },
  { id: 'watch', label: 'Exclusive Watches' },
]

export const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Hyderabad', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Sukkur']

export const TRENDING_SEARCHES = SEARCH_BANNER.trending

export const POPUP_BANNER = `${CDN}/images/banners/69d3c0cacfc5f.webp`

export const FOOTER = {
  description: 'We specialize in providing high-quality gadgets, electronics, and accessories at unbeatable wholesale prices. Our goal is to deliver reliability, affordability.',
  quickLinks: [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about-us' },
    { label: 'Account', href: '/account' },
    { label: 'Contact Us', href: '/contact' },
  ],
  ourStores: [
    { label: 'Terms & Conditions', href: '/terms-conditions' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Support', href: '/support' },
  ],
  social: [
    { label: 'Facebook', href: 'https://www.facebook.com/share/1AW915F8WA/', icon: `${CDN}/images/social_icon_filled/facebook_icon.svg` },
    { label: 'Instagram', href: 'https://www.instagram.com/', icon: `${CDN}/images/social_icon_filled/instagram_icon.svg` },
    { label: 'Tiktok', href: 'https://www.tiktok.com/@saveandsmile.pk', icon: `${CDN}/images/social_icon_filled/tiktok_icon.svg` },
  ],
}
