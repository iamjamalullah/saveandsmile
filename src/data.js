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
  search: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  call: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  wishlist: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  user: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  cart: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
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
  { title: 'Support 24/7', image: '/images/trust/support-24-7.svg' },
  { title: 'Best Prices', image: '/images/trust/best-prices.svg' },
  { title: 'Secure Payment', image: '/images/trust/secure-payment.svg' },
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

export const POPUP_BANNER = '/images/banner-placeholder.webp'

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
    { label: 'Facebook', href: 'https://www.facebook.com/share/1AW915F8WA/', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%231877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' },
    { label: 'Instagram', href: 'https://www.instagram.com/', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>' },
    { label: 'Tiktok', href: 'https://www.tiktok.com/@saveandsmile.pk', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23000000"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>' },
  ],
}
