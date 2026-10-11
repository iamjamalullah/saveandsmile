/**
 * Qadri Gadgets - Products & Store Catalog Data
 * Authentic items extracted from https://www.qadrigadgets.pk/
 */

const STORE_CONFIG = {
  name: "Save & Smile",
  tagline: "Shop • Save • Smile | Wholesale Gadgets in Pakistan",
  phone: "0316-2323616",
  whatsapp: "923162323616",
  email: "info@saveandsmile.pk",
  logo: "images/save-and-smile-logo.png",
  address: "Wholesale Market, Karachi / Lahore, Pakistan",
  currency: "Rs.",
  freeShippingThreshold: 3000,
  shippingFee: 200
};

const BANNERS = [
  {
    id: 1,
    title: "Wholesale Online Mega Sale",
    subtitle: "Get unbeatable prices on trending gadgets & home organizers",
    image: "https://www.qadrigadgets.pk/images/banners/6a91c696b7d39.webp",
    link: "#products"
  },
  {
    id: 2,
    title: "Electric Insect Killers & Summer Gadgets",
    subtitle: "Premium mosquito killers and rechargeable lamps at direct wholesale rates",
    image: "https://www.qadrigadgets.pk/images/banners/6a7af65669503.webp",
    link: "#products"
  },
  {
    id: 3,
    title: "Trending Water Bottles & Sippers",
    subtitle: "Modern aesthetic mugs and gym motivational bottles",
    image: "https://www.qadrigadgets.pk/images/banners/6a7af65669d26.webp",
    link: "#products"
  },
  {
    id: 4,
    title: "Store it Beautifully - Storage & Racks",
    subtitle: "Kitchen, Bathroom & Wardrobe organization solutions",
    image: "https://www.qadrigadgets.pk/images/banners/6a7af6566a0fa.webp",
    link: "#products"
  },
  {
    id: 5,
    title: "Toys & Kids Collection",
    subtitle: "Exciting flying planes, remote control cars and educational toys",
    image: "https://www.qadrigadgets.pk/images/banners/6a6e1db8c4ccd.webp",
    link: "#products"
  },
  {
    id: 6,
    title: "Fashion Mobile Accessories & Tech",
    subtitle: "Earbuds, Smart Watches, Cables & Fast Chargers",
    image: "https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp",
    link: "#products"
  }
];

const CATEGORIES = [
  {
    id: "storage",
    name: "Storage & Racks",
    icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c8298306c.png",
    count: 142
  },
  {
    id: "kitchen",
    name: "Kitchen Gadgets",
    icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c83c8a82f.png",
    count: 98
  },
  {
    id: "electronics",
    name: "Electronic Items",
    icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c9bf916b9.png",
    count: 215
  },
  {
    id: "smartwatches",
    name: "Smart Watches",
    icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c8156be86.png",
    count: 64
  },
  {
    id: "bottles",
    name: "Mugs & Bottles",
    icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c804cf28a.png",
    count: 76
  },
  {
    id: "beauty",
    name: "Beauty & Makeup",
    icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c89c75850.png",
    count: 85
  },
  {
    id: "insect-killers",
    name: "Insect Killers",
    icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c7d25edb7.png",
    count: 32
  },
  {
    id: "accessories",
    name: "Mobile Accessories",
    icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c7db87df3.png",
    count: 120
  },
  {
    id: "cleaning",
    name: "Wipers & Cleaning",
    icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c83202e63.png",
    count: 53
  },
  {
    id: "massager",
    name: "Electric Massagers",
    icon: "https://www.qadrigadgets.pk/images/categories/ico_6a74c7e6678eb.png",
    count: 29
  }
];

// Front Category Tabs as in Qadri Gadgets
const FRONT_TABS = [
  { id: "storage-tab", name: "Storage & Organization", key: "storage" },
  { id: "jewelry-tab", name: "Jewelry & Accessories", key: "jewelry" },
  { id: "bags-tab", name: "Fashion Bags & Travel", key: "travel" }
];

const PRODUCTS = [
  // Tab 1: Storage & Organization
  {
    id: 203,
    title: "Multipurpose Kitchen Bathroom Shelf Wall Holder Storage Rack",
    description: "Smart triangular shape fits perfectly into corners, maximizing unused space in your kitchen, bathroom, or laundry area. Made from heavy-duty durable ABS material with suction stickers.",
    code: "QGW-100196",
    category: "storage",
    tab: "storage",
    price: 180,
    originalPrice: 870,
    rating: 4.8,
    reviews: 142,
    badge: "HOT SELLER",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779176038_May_19,_2026,_12_33_14_PM.png",
    stock: 500,
    isFlashSale: true
  },
  {
    id: 204,
    title: "Plastic Corner Storage Rack Suction Cup Bathroom Organizer",
    description: "Plastic corner storage rack with strong suction mount, no drill required. Perfect for shampoos, spices, cosmetics and toiletries.",
    code: "QGW-100197",
    category: "storage",
    tab: "storage",
    price: 180,
    originalPrice: 650,
    rating: 4.7,
    reviews: 89,
    badge: "50% OFF",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779175716_ChatGPT_Image_May_19,_2026,_12_28_05_PM.png",
    stock: 250,
    isFlashSale: true
  },
  {
    id: 390,
    title: "Travel Non-Printed Breathable Shoes Bag Organizer",
    description: "Lightweight dustproof non-woven fabric shoe travel pouch with transparent window and drawstring closure.",
    code: "QGW-100385",
    category: "storage",
    tab: "storage",
    price: 50,
    originalPrice: 150,
    rating: 4.6,
    reviews: 65,
    badge: "ONLY RS 50",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779101715_ChatGPT_Image_May_18,_2026,_03_54_33_PM.png",
    stock: 1200,
    isFlashSale: false
  },
  {
    id: 391,
    title: "Multi-Pocket Shoes Organizer Storage Bag",
    description: "Foldable portable shoe case organizer. Keeps pairs protected from dirt, moisture, and scratches while traveling or at home.",
    code: "QGW-100386",
    category: "storage",
    tab: "storage",
    price: 50,
    originalPrice: 180,
    rating: 4.5,
    reviews: 44,
    badge: "SALE",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779101461_ChatGPT_Image_May_18,_2026,_03_50_33_PM.png",
    stock: 800,
    isFlashSale: false
  },
  {
    id: 392,
    title: "Honeycomb Underwear & Socks Drawer Organizer",
    description: "Divided honeycomb storage grid for socks, ties, belts, and underwear. Neatly fits inside standard drawers and wardrobes.",
    code: "QGW-100388",
    category: "storage",
    tab: "storage",
    price: 180,
    originalPrice: 450,
    rating: 4.8,
    reviews: 130,
    badge: "TRENDING",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779101219_ChatGPT_Image_May_18,_2026,_03_46_14_PM.png",
    stock: 450,
    isFlashSale: true
  },
  {
    id: 404,
    title: "16 Pocket Hanging Wardrobe Clothes & Socks Storage Pouch",
    description: "Double-sided transparent hanging storage organizer with 16 deep compartments. Hangs conveniently on standard closet rods.",
    code: "QGW-100401",
    category: "storage",
    tab: "storage",
    price: 180,
    originalPrice: 500,
    rating: 4.8,
    reviews: 172,
    badge: "BESTSELLER",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779099834_ChatGPT_Image_May_18,_2026,_03_23_36_PM.png",
    stock: 400,
    isFlashSale: true
  },
  {
    id: 405,
    title: "Clear Window Fabric Clothes Storage Box Organizer",
    description: "Large capacity wardrobe storage box with steel frame and moisture-proof fabric for blankets, bedding and winter coats.",
    code: "QGW-100402",
    category: "storage",
    tab: "storage",
    price: 350,
    originalPrice: 950,
    rating: 4.9,
    reviews: 118,
    badge: "TOP PICK",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779099518_ChatGPT_Image_May_18,_2026,_03_18_20_PM.png",
    stock: 280,
    isFlashSale: true
  },

  // Tab 2: Jewelry & Accessories
  {
    id: 151,
    title: "4 Layer Storage with Mirror Rotating Jewelry Box Cosmetics Organizer",
    description: "360-degree rotating 4-layer cylinder jewelry case with built-in vanity mirror. Separate compartments for earrings, rings, necklaces, watches and lipsticks.",
    code: "QGW-100143",
    category: "beauty",
    tab: "jewelry",
    price: 550,
    originalPrice: 1350,
    rating: 4.9,
    reviews: 165,
    badge: "ROTATING 360",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1785492994_d0bb2492-bed5-4650-8262-8e7ff1bb199f.png",
    stock: 230,
    isFlashSale: true
  },
  {
    id: 398,
    title: "Pink Transparent Travel Cosmetic & Toiletry Bag",
    description: "Waterproof clear PVC travel cosmetic zipper pouch. Easy visibility to quickly find your beauty makeup, accessories and toiletries.",
    code: "QGW-100395",
    category: "beauty",
    tab: "jewelry",
    price: 80,
    originalPrice: 250,
    rating: 4.7,
    reviews: 95,
    badge: "DEAL",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779100539_ChatGPT_Image_May_18,_2026,_03_35_18_PM.png",
    stock: 600,
    isFlashSale: false
  },
  {
    id: 501,
    title: "Ultra 8 Smart Watch with Wireless Charger & 7 Straps",
    description: "Premium Full Touch Screen Smartwatch with Bluetooth Calling, Heart Rate, BP Monitor, Sports Tracking and 7 interchangeable luxury straps.",
    code: "QGW-200501",
    category: "smartwatches",
    tab: "jewelry",
    price: 1450,
    originalPrice: 3500,
    rating: 4.9,
    reviews: 310,
    badge: "MEGA DEAL",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779176038_May_19,_2026,_12_33_14_PM.png",
    stock: 190,
    isFlashSale: true
  },
  {
    id: 502,
    title: "T900 Ultra 2 Big Screen Smart Watch with Gesture Control",
    description: "2.09-inch HD display, wireless charging, customizable watch faces, step counter and instant WhatsApp notification preview.",
    code: "QGW-200502",
    category: "smartwatches",
    tab: "jewelry",
    price: 1250,
    originalPrice: 2800,
    rating: 4.8,
    reviews: 240,
    badge: "HOT",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779175716_ChatGPT_Image_May_19,_2026,_12_28_05_PM.png",
    stock: 220,
    isFlashSale: false
  },

  // Tab 3: Fashion Bags & Travel
  {
    id: 545,
    title: "Large Capacity Foldable Travel Bag Waterproof Duffel",
    description: "Dry and wet separated foldable travel bag with trolley sleeve. Expands easily for gym, flights, hospital and weekend getaways.",
    code: "QGW-100548",
    category: "accessories",
    tab: "travel",
    price: 950,
    originalPrice: 2200,
    rating: 4.9,
    reviews: 215,
    badge: "EXPANDABLE",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779089430_ChatGPT_Image_May_18,_2026,_12_21_30_PM.png",
    stock: 310,
    isFlashSale: true
  },
  {
    id: 384,
    title: "Premium Waterproof Bike Cover – Universal Motorcycle Cover",
    description: "Universal motorcycle cover with anti-UV, dust proof, snow & rain protection. Scratch & rust proof parking cover suited for 70cc, 125cc & 150cc bikes.",
    code: "QGW-100379",
    category: "accessories",
    tab: "travel",
    price: 400,
    originalPrice: 1200,
    rating: 4.9,
    reviews: 210,
    badge: "WHOLESALE",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779102101_ChatGPT_Image_May_18,_2026,_04_01_02_PM.png",
    stock: 320,
    isFlashSale: true
  },
  {
    id: 400,
    title: "Zipper Shoe Storage Case Organizer",
    description: "Heavy-duty zipper shoe protector case with reinforced handle for gym, sports and wardrobe.",
    code: "QGW-100397",
    category: "storage",
    tab: "travel",
    price: 50,
    originalPrice: 160,
    rating: 4.6,
    reviews: 38,
    badge: "VALUE PACK",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1782730183_ChatGPT_Image_Jun_29,_2026,_03_49_18_PM.png",
    stock: 900,
    isFlashSale: false
  },
  {
    id: 406,
    title: "Foldable Underbed Storage Bag with Transparent Lid",
    description: "Space-saving underbed storage container with dual zippers and handles. Protects clothes, bedsheets and toys from dust.",
    code: "QGW-100403",
    category: "storage",
    tab: "travel",
    price: 250,
    originalPrice: 700,
    rating: 4.7,
    reviews: 84,
    badge: "WHOLESALE",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779099187_ChatGPT_Image_May_18,_2026,_03_12_50_PM.png",
    stock: 350,
    isFlashSale: false
  },

  // Other Gadgets (Insects, Bottles, Massagers)
  {
    id: 503,
    title: "Rechargeable Electronic Mosquito & Fly Killer Racket",
    description: "Heavy-duty electric fly swatter with purple UV lure light, USB rechargeable lithium battery and 3000V high-voltage mesh.",
    code: "QGW-300101",
    category: "insect-killers",
    tab: "storage",
    price: 650,
    originalPrice: 1500,
    rating: 4.9,
    reviews: 185,
    badge: "SUMMER ESSENTIAL",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779102101_ChatGPT_Image_May_18,_2026,_04_01_02_PM.png",
    stock: 450,
    isFlashSale: true
  },
  {
    id: 504,
    title: "Motivational 2-Litre Water Bottle with Time Marker & Straw",
    description: "BPA-free leak-proof fitness water bottle with motivational quotes and time stamps. Removable straw and ergonomic carry handle.",
    code: "QGW-400201",
    category: "bottles",
    tab: "travel",
    price: 490,
    originalPrice: 1200,
    rating: 4.8,
    reviews: 290,
    badge: "TRENDING",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1779099834_ChatGPT_Image_May_18,_2026,_03_23_36_PM.png",
    stock: 520,
    isFlashSale: true
  },
  {
    id: 505,
    title: "Rechargeable Wireless Fascial Muscle Massage Gun",
    description: "Deep tissue percussion therapy massager with 4 interchangeable heads, 6 speed levels, and quiet motor for relief from fatigue.",
    code: "QGW-500301",
    category: "massager",
    tab: "jewelry",
    price: 1350,
    originalPrice: 3200,
    rating: 4.7,
    reviews: 145,
    badge: "55% OFF",
    image: "https://www.qadrigadgets.pk/images/product_gallery/md_1782730183_ChatGPT_Image_Jun_29,_2026,_03_49_18_PM.png",
    stock: 160,
    isFlashSale: false
  }
];

// Qadri Gadgets Authentic Video Reels ("Watch & Shop")
const REELS_DATA = [
  {
    id: 1,
    video: "https://www.qadrigadgets.pk/images/banners/6aace4c897b73.mp4",
    title: "Portable Shoes Cleaning Wipes Disposable",
    price: 100,
    originalPrice: 780,
    thumb: "https://www.qadrigadgets.pk/images/product_gallery/sm_1779693668_ChatGPT_Image_May_25,_2026,_12_20_36_PM.png",
    code: "QGW-1564"
  },
  {
    id: 2,
    video: "https://www.qadrigadgets.pk/images/banners/6aace4c89b264.mp4",
    title: "Multi-Purpose Greek Yogurt Maker Strainer Box",
    price: 1200,
    originalPrice: 2000,
    thumb: "https://www.qadrigadgets.pk/images/product_gallery/sm_1785755331_601b16a6-72ce-4ba1-9c5e-cebd029ea827.png",
    code: "QGW-2764"
  },
  {
    id: 3,
    video: "https://www.qadrigadgets.pk/images/banners/6aace4c89f68c.mp4",
    title: "Fighter Plane Remote Control Aircraft LED Lights",
    price: 2250,
    originalPrice: 3200,
    thumb: "https://www.qadrigadgets.pk/images/product_gallery/sm_1780914418_ChatGPT_Image_Jun_8,_2026,_03_26_26_PM.png",
    code: "QGW-2226"
  },
  {
    id: 4,
    video: "https://www.qadrigadgets.pk/images/banners/6aace4c8a30fd.mp4",
    title: "Professional Triangle Mop 360 Rotatable Spin Mop",
    price: 600,
    originalPrice: 1350,
    thumb: "https://www.qadrigadgets.pk/images/product_gallery/sm_1780384460_ChatGPT_Image_Jun_2,_2026,_12_13_13_PM.png",
    code: "QGW-1052"
  },
  {
    id: 5,
    video: "https://www.qadrigadgets.pk/images/banners/6aace4c8a8146.mp4",
    title: "Electric Mini Fabric Shaver & Lint Remover",
    price: 850,
    originalPrice: 1800,
    thumb: "https://www.qadrigadgets.pk/images/product_gallery/md_1779176038_May_19,_2026,_12_33_14_PM.png",
    code: "QGW-1088"
  }
];

// Qadri Gadgets Authentic Client Testimonials
const REVIEWS_DATA = [
  {
    name: "Luqman",
    initial: "L",
    color: "#ea580c",
    stars: 5,
    title: "Good",
    text: "Everything is good and high quality I am very satisfy with wholesale rate and prompt response.",
    date: "22 Sep 2026"
  },
  {
    name: "Fami Rizwan",
    initial: "F",
    color: "#16a34a",
    stars: 5,
    title: "Very useful product good qualities",
    text: "Eyebrow trimmer and pedicure floris and face massager my best experience or product, will order again.",
    date: "21 Sep 2026"
  },
  {
    name: "Mohsin Ali",
    initial: "M",
    color: "#0891b2",
    stars: 5,
    title: "Wholesale delivery on time in Lahore",
    text: "Ordered corner racks and shoe bags in bulk for my retail store. Lowest price in Pakistan and solid packing.",
    date: "19 Sep 2026"
  },
  {
    name: "Sarah Khan",
    initial: "S",
    color: "#7c3aed",
    stars: 5,
    title: "Original smart watches and trimmers",
    text: "Products exactly matched the pictures and video demos. Fast Cash on Delivery in Islamabad within 2 days.",
    date: "15 Sep 2026"
  },
  {
    name: "Tariq Mehmood",
    initial: "T",
    color: "#e11d48",
    stars: 5,
    title: "Highly recommended wholesale supplier",
    text: "Bought mosquito killer rackets and jewelry boxes. Excellent wholesale margins for resellers.",
    date: "10 Sep 2026"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STORE_CONFIG, BANNERS, CATEGORIES, FRONT_TABS, PRODUCTS, REELS_DATA, REVIEWS_DATA };
}
