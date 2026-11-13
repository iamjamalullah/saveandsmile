// Static copy and pure helpers for the inner pages.
export const slugify = s => s
  .toString().toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

export const productSlug = p => p.slug || `${slugify(p.name).slice(0, 70)}--${String(p.sku || p.id).toLowerCase()}`

export const productPath = p => `/product/${productSlug(p)}`

export const findProductIn = (products, slug) => (products || []).find(p => productSlug(p) === slug) || null

export const findCategoryIn = (categories, slug) => (categories || []).find(c => c.slug === slug) || null

export const SORT_OPTIONS = [
  { key: 'featured', label: 'Featured Product' },
  { key: 'new', label: 'New Arrivals' },
  { key: 'low', label: 'Price (Low - High)' },
  { key: 'high', label: 'Price (High - Low)' },
  { key: 'az', label: 'Alphabetical (A - Z)' },
  { key: 'za', label: 'Alphabetical (Z - A)' },
  { key: 'discount', label: 'Discount % (High - Low)' },
]

export const CONTACT_INFO = {
  phone: '03302760775',
  whatsapp: '923302760775',
  email: null,
  address: 'Shop # G-40 - 41 Central Mall ground Floor Near Gul Plaza Saddar Karachi',
  hours: 'MON-SAT 1:00PM-10:00 PM',
  map: 'https://www.openstreetmap.org/export/embed.html?bbox=67.0015%2C24.8530%2C67.0285%2C24.8685&layer=mapnik&marker=24.8607%2C67.0104',
}

export const CONTACT_REASONS = [
  'General Inquiry', 'Complaint', 'Suggestion', 'Bulk Order',
  'Get a Call Back', 'Un Subscribe Newsletter',
]

export const ABOUT_SECTIONS = [
  {
    title: 'Our Story',
    text: 'Founded in Karachi, Save & Smile began with a simple idea: to bring quality products to our customers at unbeatable wholesale prices. As a premier Pakistan-based company, we take pride in serving retail and wholesale shoppers with a diverse range of smart lifestyle products. What started in Saddar Karachi has grown into a full-fledged online platform, offering everything from the latest gadgets to everyday home organizers.',
  },
  {
    title: 'Why Choose Save & Smile ?',
    text: 'We know that modern shoppers demand more than just great products; they expect an experience. That’s why we focus on delivering:',
    bullets: [
      'Quality Products: We carefully curate our inventory to ensure that only the best items make it to your doorstep.',
      'Affordable Prices: We believe in offering value for money without compromising on quality.',
      'Fast & Secure Shipping: With efficient delivery options, we ensure that your purchases reach you quickly and safely.',
      'Exceptional Customer Service: Our customer service team is here to assist you at every step, ensuring that your shopping experience is smooth and satisfying.',
    ],
  },
  {
    title: 'Our Vision',
    text: 'At Save & Smile, we are driven by a vision to become one of the leading online shopping destinations, providing our customers with a seamless shopping experience. We aim to continually expand our product range, while maintaining the high standards of customer service that our shoppers have come to expect.',
  },
  {
    title: 'Our Commitment',
    text: 'We are committed to:',
    bullets: [
      'Offering genuine and authentic products.',
      'Providing detailed product descriptions and reviews to help you make informed purchasing decisions.',
      'Ensuring the privacy and security of your data with secure payment gateways and privacy-focused policies.',
    ],
  },
]

export const SUPPORT_SECTIONS = [
  {
    title: '1. Contact Our Support Team',
    text: 'You can reach us directly via WhatsApp or our online inquiry form:',
    bullets: ['WhatsApp Support: +92 330 2760775 / +92 321 8273588', 'Help Desk: Submit an inquiry via our Contact Us page'],
    after: 'We aim to respond to all inquiries within 24-48 hours during business days.',
  },
  {
    title: '2. Order Support',
    text: 'Our team can help with:',
    bullets: ['Order status and tracking', 'Changes to order before dispatch', 'Delivery issues'],
    after: 'Please provide your order number when contacting us for faster assistance.',
  },
  {
    title: '3. Payment Support',
    text: 'We support:',
    bullets: ['Cash on Delivery (COD)', 'Advance payment processing'],
    after: 'Our support team will guide you step by step to resolve the issue.',
  },
  {
    title: '4. Product Support',
    text: 'Reach out for help with:',
    bullets: ['Product specifications', 'Compatibility', 'Usage guidance'],
    after: 'Please note: All products are sold as-is, with no warranty, no return, and no exchange policy.',
  },
  {
    title: '5. Feedback',
    text: 'We value your feedback! Your suggestions help us improve our products and services. Feel free to share your experience with us via email.',
  },
]

export const TERMS_SECTIONS = [
  {
    title: '1. Introduction',
    text: 'Welcome to Save & Smile. By accessing or using our website and services, you agree to be bound by these Terms & Conditions. Please read them carefully before placing an order.',
  },
  {
    title: '2. Products and Pricing',
    text: 'All prices are listed in Pakistani Rupees (PKR) and are subject to change without prior notice. Product images are for illustration purposes only; colours and packaging may vary. We reserve the right to limit quantities or refuse any order.',
  },
  {
    title: '3. Warranty',
    text: 'All products are sold as-is. No warranty, guarantee, return or exchange is offered unless explicitly stated on the product page.',
  },
  {
    title: '4. Returns and Exchanges',
    text: 'Due to the wholesale nature of our business, returns and exchanges are not accepted. Please inspect your parcel at the time of delivery and report any issue to our support team immediately.',
  },
  {
    title: '5. Payment Methods',
    text: 'We currently accept Cash on Delivery (COD) and advance bank/wallet payments. Orders are dispatched only after payment confirmation where applicable.',
  },
  {
    title: '6. Shipping & Delivery',
    text: 'Delivery timelines vary by city. Karachi orders are usually delivered within 1-2 working days, while out-of-city orders take 2-4 working days. Delays caused by courier partners are outside our control.',
  },
  {
    title: '7. Privacy & Security',
    text: 'Your personal information is handled according to our Privacy Policy. We use secure processes and never sell your data to third parties.',
  },
  {
    title: '8. Limitation of Liability',
    text: 'Save & Smile shall not be liable for any indirect or consequential loss arising from the use of our products or website.',
  },
]

export const PRIVACY_SECTIONS = [
  {
    title: '1. Introduction',
    text: 'At Save & Smile, we respect your privacy and are committed to protecting the personal information you share with us. This policy explains what we collect and how we use it.',
  },
  {
    title: '2. Information We Collect',
    text: 'We collect information you provide when you create an account, place an order or contact us — including your name, email address, mobile number, delivery address and order details.',
  },
  {
    title: '3. How We Use Your Information',
    text: 'Your information is used to process orders, arrange delivery, provide customer support, improve our store and, with your consent, send offers and updates.',
  },
  {
    title: '4. Sharing Your Information',
    text: 'We share only the details required to fulfil your order with courier partners. We do not sell, rent or trade your personal information.',
  },
  {
    title: '5. Cookies and Tracking',
    text: 'Our website uses cookies to keep your cart and session active, remember preferences and understand how the store is used.',
  },
  {
    title: '6. Data Security',
    text: 'We apply reasonable technical and organisational measures to protect your data. However, no method of transmission over the internet is completely secure.',
  },
  {
    title: '7. Third-Party Links',
    text: 'Our website may contain links to third-party sites. We are not responsible for the privacy practices or content of those websites.',
  },
  {
    title: '8. Your Rights',
    text: 'You may request access to, correction of, or deletion of your personal information by contacting us via our verified WhatsApp support or online contact form.',
  },
]
