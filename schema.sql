-- ============================================================
-- Neon PostgreSQL Database Schema for Save & Smile / Qadri Gadgets
-- Execute this script directly in the Neon SQL Editor: https://console.neon.tech/
-- ============================================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon TEXT,
  count INT DEFAULT 0
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  code VARCHAR(100),
  category VARCHAR(100) DEFAULT 'storage',
  tab VARCHAR(100) DEFAULT 'storage',
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  rating NUMERIC(3, 2) DEFAULT 4.8,
  reviews INT DEFAULT 50,
  badge VARCHAR(50) DEFAULT 'NEW',
  image TEXT NOT NULL,
  stock INT DEFAULT 100,
  is_flash_sale BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_code VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_city VARCHAR(100) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'COD',
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping_fee NUMERIC(10, 2) DEFAULT 0,
  grand_total NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  courier VARCHAR(100) DEFAULT 'Leopards Courier Service',
  tracking_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT,
  title TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  qty INT NOT NULL,
  total NUMERIC(10, 2) NOT NULL
);

-- 5. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'Admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================================
-- Initial Seed: Categories
-- ============================================================
INSERT INTO categories (id, name, icon, count) VALUES
('storage', 'Storage & Organization', 'https://www.qadrigadgets.pk/images/categories/ico_6a74c83e8b0b8.png', 45),
('kitchen', 'Kitchen Tools & Gadgets', 'https://www.qadrigadgets.pk/images/categories/ico_6a74c7be696c2.png', 110),
('bottles', 'Mugs & Bottles', 'https://www.qadrigadgets.pk/images/categories/ico_6a74c804cf28a.png', 76),
('beauty', 'Beauty & Makeup', 'https://www.qadrigadgets.pk/images/categories/ico_6a74c89c75850.png', 85),
('insect-killers', 'Insect Killers', 'https://www.qadrigadgets.pk/images/categories/ico_6a74c7d25edb7.png', 32),
('accessories', 'Mobile Accessories', 'https://www.qadrigadgets.pk/images/categories/ico_6a74c7db87df3.png', 120),
('cleaning', 'Wipers & Cleaning', 'https://www.qadrigadgets.pk/images/categories/ico_6a74c83202e63.png', 53),
('massager', 'Electric Massagers', 'https://www.qadrigadgets.pk/images/categories/ico_6a74c7e6678eb.png', 29)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Initial Seed: Products Catalog
-- ============================================================
INSERT INTO products (id, title, description, code, category, tab, price, original_price, rating, reviews, badge, image, stock, is_flash_sale) VALUES
(203, 'Multipurpose Kitchen Bathroom Shelf Wall Holder Storage Rack', 'Smart triangular shape fits perfectly into corners, maximizing unused space in your kitchen, bathroom, or laundry area.', 'QGW-100196', 'storage', 'storage', 180, 870, 4.8, 142, 'HOT SELLER', 'https://www.qadrigadgets.pk/images/product_gallery/md_1779176038_May_19,_2026,_12_33_14_PM.png', 500, true),
(204, 'Plastic Corner Storage Rack Suction Cup Bathroom Organizer', 'Plastic corner storage rack with strong suction mount, no drill required. Perfect for shampoos, spices, and cosmetics.', 'QGW-100197', 'storage', 'storage', 180, 650, 4.7, 89, '50% OFF', 'https://www.qadrigadgets.pk/images/product_gallery/md_1779175716_ChatGPT_Image_May_19,_2026,_12_28_05_PM.png', 250, true),
(384, 'Premium Waterproof Bike Cover – Universal Motorcycle Cover', 'Anti-UV, Dust Proof, Snow & Rain Protection. Scratch & Rust Proof Parking Cover.', 'QGW-100379', 'accessories', 'accessories', 400, 1100, 4.9, 310, 'TOP TRENDING', 'https://www.qadrigadgets.pk/images/product_gallery/md_1779102101_ChatGPT_Image_May_18,_2026,_04_01_02_PM.png', 150, false),
(390, 'Shoes Bag (Non printed) - Dustproof Travel Pouch', 'Lightweight portable shoe organizer pouch for travel and closet protection.', 'QGW-100385', 'travel', 'travel', 50, 200, 4.6, 64, 'BEST VALUE', 'https://www.qadrigadgets.pk/images/product_gallery/md_1779101715_ChatGPT_Image_May_18,_2026,_03_54_33_PM.png', 800, false),
(391, 'Shoes Organizer Storage Bag with Transparent Window', 'Moisture proof non-woven shoe dust cover with clear peek window.', 'QGW-100386', 'travel', 'travel', 50, 180, 4.5, 42, 'HOT', 'https://www.qadrigadgets.pk/images/product_gallery/md_1779101461_ChatGPT_Image_May_18,_2026,_03_50_33_PM.png', 650, false),
(392, 'Socks Organizer Wardrobe Divider Box', 'Multi-compartment organizer for socks, ties, underwear and small garments.', 'QGW-100388', 'storage', 'storage', 180, 450, 4.8, 97, 'ORGANIZER', 'https://www.qadrigadgets.pk/images/product_gallery/md_1779101219_ChatGPT_Image_May_18,_2026,_03_46_14_PM.png', 320, true),
(398, 'Pink Transparent Waterproof Cosmetic Pouch', 'Portable travel makeup wash bag with sturdy zipper.', 'QGW-100395', 'jewelry', 'jewelry', 80, 250, 4.7, 53, 'TRENDING', 'https://www.qadrigadgets.pk/images/product_gallery/md_1779100539_ChatGPT_Image_May_18,_2026,_03_35_18_PM.png', 400, false),
(400, 'Shoe Storage Bag Organizer Zipper Shoes Case', 'High quality zip shoe carrier bag for gym, travel and cupboard storage.', 'QGW-100397', 'travel', 'travel', 50, 190, 4.6, 78, 'WHOLESALE', 'https://www.qadrigadgets.pk/images/product_gallery/md_1782730183_ChatGPT_Image_Jun_29,_2026,_03_49_18_PM.png', 900, false),
(404, '16 Pocket Hanging Wardrobe Wall Organizer', 'Space-saving hanging storage pocket organizer for closet doors.', 'QGW-100401', 'storage', 'storage', 120, 390, 4.5, 61, 'SPACE SAVER', 'https://www.qadrigadgets.pk/images/product_gallery/md_1779099863_ChatGPT_Image_May_18,_2026,_03_23_30_PM.png', 350, true),
(406, '3 Grid Hanging Wall Organizer Bag', 'Cute cotton linen wall door pocket organizer with wood bar.', 'QGW-100403', 'storage', 'storage', 120, 350, 4.7, 44, 'POPULAR', 'https://www.qadrigadgets.pk/images/product_gallery/md_1779099518_ChatGPT_Image_May_18,_2026,_03_18_11_PM.png', 280, false),
(408, 'Transparent Hanging Jewelry & Cosmetics Organizer', 'Double-sided jewelry holder pouch with multiple transparent pockets.', 'QGW-100405', 'jewelry', 'jewelry', 150, 500, 4.8, 115, 'BEST SELLER', 'https://www.qadrigadgets.pk/images/product_gallery/md_1779099042_ChatGPT_Image_May_18,_2026,_03_10_13_PM.png', 420, true),
(410, 'Multipurpose Hanging Mesh Storage Bag for Garlic & Onion', 'Breathable polyester mesh fruit and vegetable hanging pocket.', 'QGW-100407', 'kitchen', 'kitchen', 60, 200, 4.4, 38, 'KITCHEN MUST', 'https://www.qadrigadgets.pk/images/product_gallery/md_1779098670_ChatGPT_Image_May_18,_2026,_03_03_36_PM.png', 500, false)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to highest ID
SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));
