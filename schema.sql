-- ============================================================================
-- QADRI GADGETS – PRODUCTION POSTGRESQL DATABASE SCHEMA (MIGRATION READY)
-- Compatible with PostgreSQL 13+, Supabase, Neon, AWS RDS, and pg-mem
-- ============================================================================

-- 1. STAFF USERS & ROLES
CREATE TABLE IF NOT EXISTS staff_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'manager',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_email ON staff_accounts(email);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL,
    slug VARCHAR(140) UNIQUE NOT NULL,
    icon VARCHAR(60) DEFAULT '📦',
    image_url VARCHAR(500) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- 3. PRODUCTS & INVENTORY
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(60) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    category_name VARCHAR(120) NOT NULL,
    group_name VARCHAR(60) NOT NULL DEFAULT 'general',
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    old_price NUMERIC(12, 2) CHECK (old_price >= price),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    brand VARCHAR(120) DEFAULT 'Qadri Select',
    description TEXT,
    video_url VARCHAR(500),
    image_main VARCHAR(500) NOT NULL,
    images_gallery TEXT, -- JSON array of secondary image URLs
    highlights TEXT, -- JSON array of key selling bullets
    specs_json TEXT, -- JSON array of { label, value }
    bulk_tiers_json TEXT, -- JSON array of { minQty, price }
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    has_variants BOOLEAN NOT NULL DEFAULT FALSE,
    variant_config VARCHAR(30) DEFAULT 'none',
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0 CHECK (rating BETWEEN 1 AND 5),
    reviews_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_name);
CREATE INDEX IF NOT EXISTS idx_products_group ON products(group_name);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- 4. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(80) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    mobile VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(180),
    city VARCHAR(80) NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);

-- 5. COUPONS
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(40) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'percent',
    value NUMERIC(10, 2) NOT NULL CHECK (value >= 0),
    min_order NUMERIC(12, 2) NOT NULL DEFAULT 0,
    max_discount NUMERIC(12, 2),
    description VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- 6. ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(40) PRIMARY KEY, -- e.g. 'GS-ORD-1048'
    customer_id VARCHAR(80),
    customer_name VARCHAR(120) NOT NULL,
    customer_mobile VARCHAR(30) NOT NULL,
    customer_email VARCHAR(180),
    customer_city VARCHAR(80) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_method VARCHAR(80) NOT NULL DEFAULT 'Standard',
    payment_method VARCHAR(80) NOT NULL DEFAULT 'Cash on Delivery (COD)',
    status VARCHAR(40) NOT NULL DEFAULT 'Pending',
    tracking_number VARCHAR(100),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    coupon_code VARCHAR(40),
    shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    customer_notes TEXT,
    idempotency_key VARCHAR(120) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_mobile ON orders(customer_mobile);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(40) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(60),
    variant_id INT,
    variant_title VARCHAR(150),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 7. REVIEWS (MODERATED)
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT PRIMARY KEY,
    product_id INT,
    name VARCHAR(120) NOT NULL,
    title VARCHAR(200) NOT NULL,
    text TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    whatsapp VARCHAR(30),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    date_formatted VARCHAR(40),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- 8. CONTACTS & BULK INQUIRIES
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id BIGINT PRIMARY KEY,
    type VARCHAR(40) NOT NULL DEFAULT 'contact',
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180),
    mobile VARCHAR(30) NOT NULL,
    company VARCHAR(150),
    city VARCHAR(80),
    address TEXT,
    reason VARCHAR(100),
    product_requested VARCHAR(255),
    quantity_requested INT,
    message TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inquiries_type ON contact_inquiries(type);
CREATE INDEX IF NOT EXISTS idx_inquiries_resolved ON contact_inquiries(is_resolved);

-- 9. STORE SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    store_name VARCHAR(120) NOT NULL DEFAULT 'Qadri Gadgets',
    tagline VARCHAR(200) NOT NULL DEFAULT 'Gadgets Wholesaler',
    phone VARCHAR(30) NOT NULL DEFAULT '0321-8273588',
    whatsapp VARCHAR(30) NOT NULL DEFAULT '923218273588',
    email VARCHAR(180) NOT NULL DEFAULT 'info@qadrigadgets.pk',
    address TEXT NOT NULL,
    free_shipping_threshold NUMERIC(12, 2) NOT NULL DEFAULT 3000,
    shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 200,
    express_shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 350,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    allow_guest_checkout BOOLEAN NOT NULL DEFAULT TRUE,
    announcement TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. HERO SLIDES
CREATE TABLE IF NOT EXISTS hero_slides (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    title VARCHAR(200),
    subtitle VARCHAR(300),
    link_url VARCHAR(500),
    sort_order INT DEFAULT 0
);

-- 11. HOMEPAGE SECTIONS (ELEMENTOR-STYLE DYNAMIC BUILDER)
CREATE TABLE IF NOT EXISTS sections (
    id VARCHAR(100) PRIMARY KEY,
    group_name VARCHAR(60),
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(300),
    sort_order INT DEFAULT 0,
    container_layout VARCHAR(50) DEFAULT 'single',
    block_type VARCHAR(50) DEFAULT 'products',
    content_json TEXT DEFAULT '{}',
    responsive_settings_json TEXT DEFAULT '{}',
    is_visible BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT TRUE,
    draft_json TEXT,
    has_unpublished_changes BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homepage_section_versions (
    id SERIAL PRIMARY KEY,
    version_label VARCHAR(100) NOT NULL,
    sections_snapshot_json TEXT NOT NULL,
    published_by VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homepage_draft (
    id INT PRIMARY KEY DEFAULT 1,
    draft_json TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(sort_order);

-- 12. WATCH & SHOP (REELS)
CREATE TABLE IF NOT EXISTS watch_shop (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(500) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    product_id INT,
    sort_order INT DEFAULT 0
);

-- 13. IDEMPOTENCY KEYS
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(120) PRIMARY KEY,
    order_id VARCHAR(40) NOT NULL,
    response_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. REVOKED TOKENS
CREATE TABLE IF NOT EXISTS revoked_tokens (
    token_hash VARCHAR(120) PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. PRODUCT OPTIONS (e.g. Color, Size)
CREATE TABLE IF NOT EXISTS product_options (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_options_product_id ON product_options(product_id);

-- 16. PRODUCT OPTION VALUES (e.g. 'Red', 'Green', 'M', 'L')
CREATE TABLE IF NOT EXISTS product_option_values (
    id SERIAL PRIMARY KEY,
    option_id INT NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL,
    hex_code VARCHAR(30),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_option_values_option_id ON product_option_values(option_id);
CREATE INDEX IF NOT EXISTS idx_option_values_product_id ON product_option_values(product_id);

-- 17. PRODUCT VARIANTS (Combinations / SKU level items)
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(80) UNIQUE,
    title VARCHAR(150) NOT NULL,
    color_value VARCHAR(100),
    size_value VARCHAR(100),
    options TEXT DEFAULT '{}',
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    old_price NUMERIC(12, 2) CHECK (old_price >= price),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    barcode VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- 18. PRODUCT VARIANT IMAGES (Variant / Color specific galleries)
CREATE TABLE IF NOT EXISTS product_variant_images (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_name VARCHAR(100) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_variant_images_product_id ON product_variant_images(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_images_color ON product_variant_images(color_name);

-- 19. MOBILE APP RELEASES (Save & Smile Android Admin APK Distribution)
CREATE TABLE IF NOT EXISTS app_releases (
    id SERIAL PRIMARY KEY,
    app_name VARCHAR(100) NOT NULL DEFAULT 'Save & Smile Admin',
    package_name VARCHAR(120) NOT NULL DEFAULT 'com.saveandsmile.admin',
    version VARCHAR(30) NOT NULL,
    version_code INT NOT NULL DEFAULT 1,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_size_formatted VARCHAR(30) NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    download_url VARCHAR(500) NOT NULL,
    release_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by VARCHAR(120) DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_releases_active ON app_releases(is_active);
CREATE INDEX IF NOT EXISTS idx_app_releases_version ON app_releases(version);
