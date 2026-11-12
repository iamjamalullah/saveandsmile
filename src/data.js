// ─────────────────────────────────────────────────────────────
//  Qadri Gadgets – static presentation config.
//  Catalogue content (products, categories, hero banners, reviews)
//  now lives in db.json and is served by json-server through the
//  StoreDataContext API layer.
// ─────────────────────────────────────────────────────────────
const CDN = 'https://www.qadrigadgets.pk'

export const BRAND = {
  name: 'Save & Smile',
  tagline: 'Your Trusted Online Shopping Hub',
  logo: '/LOGO001.png',
  logoWhite: '/logo-white.png',
  logoFooter: '/LOGO001.png',
  menuIcon: `${CDN}/images/category_icon_mob.svg`,
  phone: '0321-8273588',
  phone2: '0330-2760775',
  tel: '+923218273588',
  tel2: '+923302760775',
  whatsapp: '923218273588',
  email: 'info@saveandsmile.pk',
  address: 'Karachi, Pakistan',
  announcement: 'Welcome to Save & Smile — Pakistan\'s Leading Wholesale & Retail Store · Free Nationwide Shipping on Orders Above Rs. 3,000!',
  announcementPhone: '',
  freeShippingThreshold: 3000,
  shippingFee: 200,
  expressShippingFee: 350,
}

export const UI = {
  quickView: `${CDN}/images/quick_view.svg`,
  heart: `${CDN}/images/heart_wishlist.png`,
  cart: `${CDN}/images/cart-new-icon.png`,
  close: `${CDN}/images/theme_icons/close_icon.svg`,
  min: `${CDN}/images/theme_icons/minus_icon.svg`,
  plus: `${CDN}/images/theme_icons/plus_icon.svg`,
  loader: `${CDN}/images/product-loader.webp`,
  sprites: `${CDN}/images/footer-sprites.png`,
}

export const HEADER_ICONS = {
  search: `${CDN}/images/qadri-hdr-search.png`,
  call: `${CDN}/images/qadri-hdr-call.png`,
  wishlist: `${CDN}/images/qadri-hdr-wishlist.png`,
  user: `${CDN}/images/qadri-hdr-user.png`,
  cart: `${CDN}/images/qadri-hdr-cart.png`,
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
  { title: 'Support 24/7', image: `${CDN}/images/banners/68ecda0c96323.webp` },
  { title: 'Best Prices', image: `${CDN}/images/banners/68ecda0c969b4.webp` },
  { title: 'Secure Payment', image: `${CDN}/images/banners/68ecda0c96cd0.webp` },
]

export const SHOP_UNDER = [
  { max: 500, image: `${CDN}/images/banners/6aad316c44160.webp` },
  { max: 1000, image: `${CDN}/images/banners/6aad316c45003.webp` },
  { max: 1500, image: `${CDN}/images/banners/6aad316c45708.webp` },
  { max: 2000, image: `${CDN}/images/banners/6aad316c45e89.webp` },
  { max: 3000, image: `${CDN}/images/banners/6aad316c464d6.webp` },
  { max: 5000, image: `${CDN}/images/banners/6aad316c46e0c.webp` },
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
    { label: 'Tiktok', href: 'https://www.tiktok.com/@qadrigadgets.pk', icon: `${CDN}/images/social_icon_filled/tiktok_icon.svg` },
  ],
}
