/**
 * Qadri Gadgets - Core Application Logic
 * Matches https://www.qadrigadgets.pk/
 */

// Application State
const AppState = {
  cart: JSON.parse(localStorage.getItem('qadri_cart')) || [],
  wishlist: JSON.parse(localStorage.getItem('qadri_wishlist')) || [],
  currentCategory: 'all',
  currentFrontTab: 'storage',
  currentTheme: localStorage.getItem('qadri_theme') || 'green',
  currentSlide: 0,
  sliderInterval: null
};

// Sync store config if customized
try {
  const savedCfg = JSON.parse(localStorage.getItem('qadri_store_config'));
  if (savedCfg && typeof STORE_CONFIG !== 'undefined') {
    Object.assign(STORE_CONFIG, savedCfg);
  }
} catch (e) {}

// Helper to get both custom user products, edited products, and default products
function getAllProducts() {
  const custom = JSON.parse(localStorage.getItem('qadri_custom_products')) || [];
  const overrides = JSON.parse(localStorage.getItem('qadri_product_overrides')) || {};
  const deleted = JSON.parse(localStorage.getItem('qadri_deleted_products')) || [];

  const base = (typeof PRODUCTS !== 'undefined' ? PRODUCTS : [])
    .filter(p => !deleted.includes(p.id) && !deleted.includes(String(p.id)))
    .map(p => overrides[p.id] ? { ...p, ...overrides[p.id] } : p);

  return [...custom, ...base];
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSlider();
  initCountdown();
  renderCategoryStrip();
  renderMegaMenu();
  renderFrontTabs();
  renderReels();
  renderReviews();
  renderAllSections();
  updateCartBadge();
  updateWishlistBadge();
  initSearch();

  // Auto open tracking modal if URL contains ?track=... or ?orderId=...
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const trackQ = urlParams.get('track') || urlParams.get('orderId');
    if (trackQ) {
      setTimeout(() => openTrackOrderModal(trackQ), 350);
    }
  } catch (e) {}
});

// -------------------------------------------------------------
// Theme Switcher
// -------------------------------------------------------------
function setTheme(theme) {
  AppState.currentTheme = theme;
  localStorage.setItem('qadri_theme', theme);
  document.body.className = '';
  if (theme !== 'green') {
    document.body.classList.add(`theme-${theme}`);
  }
}

function initTheme() {
  setTheme(AppState.currentTheme);
}

// -------------------------------------------------------------
// Hero Banner Slider
// -------------------------------------------------------------
function initSlider() {
  const container = document.getElementById('heroSliderContainer');
  const dotsContainer = document.getElementById('sliderDots');
  if (!container || !dotsContainer) return;

  const activeBanners = JSON.parse(localStorage.getItem('qadri_custom_banners')) || BANNERS;

  container.innerHTML = activeBanners.map((banner, index) => `
    <div class="slide-item ${index === 0 ? 'active' : ''}" data-index="${index}">
      <a href="${banner.link}">
        <img src="${banner.image}" alt="${banner.title}" loading="${index === 0 ? 'eager' : 'lazy'}">
      </a>
    </div>
  `).join('');

  dotsContainer.innerHTML = activeBanners.map((_, index) => `
    <div class="slider-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>
  `).join('');

  startSliderTimer();
}

function startSliderTimer() {
  if (AppState.sliderInterval) clearInterval(AppState.sliderInterval);
  AppState.sliderInterval = setInterval(() => {
    nextSlide();
  }, 4500);
}

function updateSliderUI() {
  const slides = document.querySelectorAll('.slide-item');
  const dots = document.querySelectorAll('.slider-dot');

  slides.forEach((slide, idx) => {
    slide.classList.toggle('active', idx === AppState.currentSlide);
  });
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === AppState.currentSlide);
  });
}

function nextSlide() {
  AppState.currentSlide = (AppState.currentSlide + 1) % BANNERS.length;
  updateSliderUI();
}

function prevSlide() {
  AppState.currentSlide = (AppState.currentSlide - 1 + BANNERS.length) % BANNERS.length;
  updateSliderUI();
  startSliderTimer();
}

function goToSlide(index) {
  AppState.currentSlide = index;
  updateSliderUI();
  startSliderTimer();
}

// -------------------------------------------------------------
// Flash Sale Countdown Timer
// -------------------------------------------------------------
function initCountdown() {
  let totalSeconds = 14 * 3600 + 42 * 60 + 19; // 14 hours 42 mins 19 secs

  const hoursEl = document.getElementById('timerHours');
  const minutesEl = document.getElementById('timerMinutes');
  const secondsEl = document.getElementById('timerSeconds');

  if (!hoursEl || !minutesEl || !secondsEl) return;

  setInterval(() => {
    if (totalSeconds > 0) totalSeconds--;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    hoursEl.textContent = String(h).padStart(2, '0');
    minutesEl.textContent = String(m).padStart(2, '0');
    secondsEl.textContent = String(s).padStart(2, '0');
  }, 1000);
}

// -------------------------------------------------------------
// Render Category Circles Strip & Mega Menu
// -------------------------------------------------------------
function renderCategoryStrip() {
  const strip = document.getElementById('categoryStrip');
  if (!strip) return;

  // Duplicate categories to create a seamless infinite left-to-right sliding marquee
  const repeated = [...CATEGORIES, ...CATEGORIES, ...CATEGORIES];
  strip.innerHTML = repeated.map(cat => `
    <div class="cat-circle-card" onclick="filterByCategory('${cat.id}')">
      <div class="cat-circle-img-wrap">
        <img src="${cat.icon}" alt="${cat.name}">
      </div>
      <div class="cat-circle-title">${cat.name}</div>
    </div>
  `).join('');
}

function renderMegaMenu() {
  const grid = document.getElementById('headerCatsGrid');
  if (grid) {
    grid.innerHTML = CATEGORIES.map(cat => `
      <div class="header-cat-card" onclick="filterByCategory('${cat.id}'); toggleHeaderMenu();">
        <img src="${cat.icon}" alt="${cat.name}">
        <div>
          <div class="header-cat-name">${cat.name}</div>
          <div class="header-cat-count">${cat.count} items</div>
        </div>
      </div>
    `).join('');
  }

  const legacyMenu = document.getElementById('megaDropdownPanel');
  if (legacyMenu) {
    legacyMenu.innerHTML = CATEGORIES.map(cat => `
      <a href="#products" class="cat-menu-item" onclick="filterByCategory('${cat.id}'); toggleMegaMenu();">
        <img src="${cat.icon}" alt="${cat.name}">
        <span>${cat.name} (${cat.count})</span>
      </a>
    `).join('');
  }
}

function toggleHeaderMenu() {
  const dropdown = document.getElementById('headerTabsDropdown');
  if (dropdown) dropdown.classList.toggle('open');
}

function switchHeaderDropdownTab(tabName) {
  const btnCat = document.getElementById('tabNavBtnCat');
  const btnMenu = document.getElementById('tabNavBtnMenu');
  const paneCat = document.getElementById('tabPaneCategories');
  const paneMenu = document.getElementById('tabPaneMenu');

  if (tabName === 'categories') {
    if (btnCat) btnCat.classList.add('active');
    if (btnMenu) btnMenu.classList.remove('active');
    if (paneCat) paneCat.classList.add('active');
    if (paneMenu) paneMenu.classList.remove('active');
  } else {
    if (btnCat) btnCat.classList.remove('active');
    if (btnMenu) btnMenu.classList.add('active');
    if (paneCat) paneCat.classList.remove('active');
    if (paneMenu) paneMenu.classList.add('active');
  }
}

function toggleMegaMenu() {
  toggleHeaderMenu();
}

// -------------------------------------------------------------
// Front Category Tabs (Storage & Organization, Jewelry, Travel)
// -------------------------------------------------------------
function renderFrontTabs() {
  const container = document.getElementById('frontTabsNav');
  if (!container) return;

  container.innerHTML = FRONT_TABS.map((tab, idx) => `
    <button class="front-tab-button ${tab.key === AppState.currentFrontTab ? 'active' : ''}" onclick="switchFrontTab('${tab.key}', this)">
      ${tab.name}
    </button>
  `).join('');
}

function switchFrontTab(tabKey, btn) {
  AppState.currentFrontTab = tabKey;
  document.querySelectorAll('.front-tab-button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderProducts();
}

// -------------------------------------------------------------
// "Watch & Shop" Video Reels Section (HomePageReels)
// -------------------------------------------------------------
function renderReels() {
  const track = document.getElementById('reelsTrack');
  if (!track) return;

  track.innerHTML = REELS_DATA.map(reel => `
    <article class="qadri-reel-card">
      <div class="qadri-reel-media">
        <video src="${reel.video}" loop muted playsinline preload="metadata" onmouseenter="this.play()" onclick="togglePlayVideo(this)"></video>
        <button type="button" class="qadri-reel-sound" onclick="toggleMuteVideo(this, event)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 5L6 9H3v6h3l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          Mute
        </button>
      </div>
      <div class="qadri-reel-product" onclick="openReelProduct('${reel.title}', ${reel.price}, '${reel.thumb}', '${reel.code}')">
        <img class="qadri-reel-thumb" src="${reel.thumb}" alt="${reel.title}">
        <div class="qadri-reel-info">
          <p class="qadri-reel-pname">${reel.title}</p>
          <div class="qadri-reel-prices">
            <span class="qadri-reel-was">Rs. ${reel.originalPrice.toLocaleString()}</span>
            <span class="qadri-reel-now">Rs. ${reel.price.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </article>
  `).join('');

  // Start playing first video
  setTimeout(() => {
    const firstVid = track.querySelector('video');
    if (firstVid) firstVid.play().catch(() => {});
  }, 1000);
}

function togglePlayVideo(video) {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
}

function toggleMuteVideo(btn, e) {
  e.stopPropagation();
  const card = btn.closest('.qadri-reel-card');
  const video = card.querySelector('video');
  if (!video) return;

  video.muted = !video.muted;
  if (video.muted) {
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 5L6 9H3v6h3l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
      Mute
    `;
    btn.classList.remove('is-on');
  } else {
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
      Sound
    `;
    btn.classList.add('is-on');
  }
}

function scrollReels(direction) {
  const track = document.getElementById('reelsTrack');
  if (!track) return;
  track.scrollBy({ left: direction * 280, behavior: 'smooth' });
}

function openReelProduct(title, price, img, code) {
  addToCartByName(title, price, img, code);
}

// -------------------------------------------------------------
// Client Testimonials ("What Our Clients Say")
// -------------------------------------------------------------
function renderReviews() {
  const track = document.getElementById('reviewsTrack');
  if (!track) return;

  track.innerHTML = REVIEWS_DATA.map(rv => `
    <article class="home-review-card">
      <div class="home-review-top">
        <div class="rv-avatar" style="background: ${rv.color};">${rv.initial}</div>
        <div>
          <div class="home-review-name">${rv.name}</div>
          <div class="home-review-rating">
            <span class="rating-stars">★★★★★</span>
            <span class="rv-verified">✓ Verified</span>
          </div>
        </div>
      </div>
      <div class="review-inner-content">
        <div class="home-review-title">${rv.title}</div>
        <p class="home-review-text">"${rv.text}"</p>
      </div>
      <div class="home-review-footer">
        <span class="home-review-date">${rv.date}</span>
        <span class="home-review-purchase">Verified Purchase</span>
      </div>
    </article>
  `).join('');
}

// -------------------------------------------------------------
// Product Catalog & Filter
// -------------------------------------------------------------
function filterByCategory(catId) {
  AppState.currentCategory = catId;
  AppState.currentFrontTab = 'all';

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-cat') === catId);
  });

  renderProducts();

  const catalogEl = document.getElementById('products');
  if (catalogEl) {
    catalogEl.scrollIntoView({ behavior: 'smooth' });
  }
}

// -------------------------------------------------------------
// Product Card HTML Generator (Rating Removed, No SKU, Pastel Categories)
// -------------------------------------------------------------
function createProductCardHtml(product) {
  const isWishlisted = AppState.wishlist.includes(product.id);
  return `
    <div class="product-card cat-${product.category}">
      <span class="product-badge">${product.badge}</span>
      
      <div class="product-img-wrapper" onclick="window.location.href='product-detail.html?id=${product.id}'">
        <img src="${product.image}" alt="${product.title}" loading="lazy">
      </div>

      <div class="card-quick-actions">
        <button class="action-icon-circle ${isWishlisted ? 'favorited' : ''}" title="Add to Wishlist" onclick="toggleWishlist(${product.id})">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? '#ef4444' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <button class="action-icon-circle" title="Quick View" onclick="openQuickView(${product.id})">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>

      <div class="product-card-body">
        <h3 class="product-title" onclick="window.location.href='product-detail.html?id=${product.id}'">${product.title}</h3>

        <div class="product-pricing">
          <span class="original-price"><span class="currency-symbol">${STORE_CONFIG.currency}</span> ${product.originalPrice}</span>
          <span class="wholesale-price"><span class="currency-symbol">${STORE_CONFIG.currency}</span> ${product.price}</span>
        </div>

        <div class="product-card-actions">
          <button class="btn-add-cart" onclick="addToCart(${product.id})" title="Add to Cart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span class="btn-cart-text">Add to Cart</span>
          </button>
          <button class="btn-buy-now" onclick="buyNowSingle(${product.id})" title="Direct Checkout">
            <span>Buy Now</span>
          </button>
        </div>

        <a href="https://wa.me/923162323616?text=Salam!%20I%20want%20to%20buy%20*${encodeURIComponent(product.title)}*%20in%20Wholesale%20bulk%20quantity." target="_blank" class="card-wholesale-strip" title="Inquire Wholesale Bulk Quantity">
          <span>📦 Buy in Wholesale</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      </div>
    </div>
  `;
}

function renderAllSections() {
  const all = getAllProducts();

  // 1. Hot Selling Portion
  const hotSellingEl = document.getElementById('hotSellingGrid');
  if (hotSellingEl) {
    const hotProducts = all.filter(p => p.badge.includes('HOT') || p.price <= 200 || p.isFlashSale).slice(0, 4);
    hotSellingEl.innerHTML = (hotProducts.length ? hotProducts : all.slice(0, 4)).map(createProductCardHtml).join('');
  }

  // 2. New Arrivals Portion
  const newArrivalsEl = document.getElementById('newArrivalsGrid');
  if (newArrivalsEl) {
    const newProducts = all.slice(4, 8);
    newArrivalsEl.innerHTML = (newProducts.length ? newProducts : all.slice(0, 4)).map(createProductCardHtml).join('');
  }

  // 3. Trending Wholesale Portion
  const trendingEl = document.getElementById('trendingGrid');
  if (trendingEl) {
    const trendingProducts = all.filter(p => p.badge.includes('TRENDING') || p.category === 'smartwatches' || p.category === 'storage').slice(0, 4);
    trendingEl.innerHTML = (trendingProducts.length ? trendingProducts : all.slice(2, 6)).map(createProductCardHtml).join('');
  }

  // 4. Main Catalog Grid
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let filtered = getAllProducts();

  // If filtered by front category tab
  if (AppState.currentFrontTab !== 'all') {
    filtered = getAllProducts().filter(p => p.tab === AppState.currentFrontTab);
  } else if (AppState.currentCategory !== 'all') {
    filtered = getAllProducts().filter(p => p.category === AppState.currentCategory);
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #64748b;">
        <h3>No products found in this category.</h3>
        <button class="tab-btn active" onclick="filterByCategory('all')" style="margin-top: 1rem;">View All Products</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(createProductCardHtml).join('');
}

// -------------------------------------------------------------
// Cart Logic & Drawer
// -------------------------------------------------------------
function addToCart(productId, qty = 1) {
  const product = getAllProducts().find(p => p.id === productId);
  if (!product) return;

  const existing = AppState.cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    AppState.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      code: product.code,
      qty: qty
    });
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
  showToast(`Added "${product.title.substring(0, 24)}..." to cart!`);
  openCartDrawer();
}

function buyNowSingle(productId, qty = 1) {
  const product = getAllProducts().find(p => p.id === productId);
  if (!product) return;

  const existing = AppState.cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    AppState.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      code: product.code,
      qty: qty
    });
  }

  saveCart();
  updateCartBadge();
  window.location.href = 'checkout.html';
}

function addToCartByName(title, price, image, code) {
  const existing = AppState.cart.find(item => item.code === code);
  if (existing) {
    existing.qty += 1;
  } else {
    AppState.cart.push({
      id: Math.floor(1000 + Math.random() * 9000),
      title: title,
      price: price,
      image: image,
      code: code,
      qty: 1
    });
  }
  saveCart();
  updateCartBadge();
  renderCartDrawer();
  showToast(`Added "${title.substring(0, 24)}..." to cart!`);
  openCartDrawer();
}

function saveCart() {
  localStorage.setItem('qadri_cart', JSON.stringify(AppState.cart));
}

function updateCartBadge() {
  const totalCount = AppState.cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.badge-counter#cartBadge, #mblCartBadge').forEach(badge => {
    badge.textContent = totalCount;
  });
}

function updateItemQty(productId, change) {
  const item = AppState.cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += change;
  if (item.qty <= 0) {
    AppState.cart = AppState.cart.filter(i => i.id !== productId);
  }
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function removeFromCart(productId) {
  AppState.cart = AppState.cart.filter(i => i.id !== productId);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function renderCartDrawer() {
  const container = document.getElementById('cartDrawerItems');
  const subtotalEl = document.getElementById('cartSubtotal');
  const shippingEl = document.getElementById('cartShipping');
  const totalEl = document.getElementById('cartTotal');
  const freeShippingText = document.getElementById('freeShippingText');
  const freeShippingBar = document.getElementById('freeShippingBar');

  if (!container) return;

  if (AppState.cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-view">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <h4>Your Shopping Cart is Empty</h4>
        <p style="font-size: 0.85rem; margin-top: 6px;">Add exciting wholesale gadgets to begin shopping.</p>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = `${STORE_CONFIG.currency} 0`;
    if (shippingEl) shippingEl.textContent = `${STORE_CONFIG.currency} 0`;
    if (totalEl) totalEl.textContent = `${STORE_CONFIG.currency} 0`;
    if (freeShippingBar) freeShippingBar.style.width = '0%';
    return;
  }

  const subtotal = AppState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const isFreeShip = subtotal >= STORE_CONFIG.freeShippingThreshold;
  const shippingFee = isFreeShip ? 0 : STORE_CONFIG.shippingFee;
  const grandTotal = subtotal + shippingFee;

  const progressPercent = Math.min(100, Math.round((subtotal / STORE_CONFIG.freeShippingThreshold) * 100));
  if (freeShippingBar) freeShippingBar.style.width = `${progressPercent}%`;
  if (freeShippingText) {
    if (isFreeShip) {
      freeShippingText.innerHTML = `🎉 <strong>Congratulations!</strong> You get FREE delivery!`;
    } else {
      const needed = STORE_CONFIG.freeShippingThreshold - subtotal;
      freeShippingText.innerHTML = `Add <strong>${STORE_CONFIG.currency} ${needed}</strong> more for <strong>FREE Delivery</strong>`;
    }
  }

  container.innerHTML = AppState.cart.map(item => `
    <div class="cart-item-row">
      <img src="${item.image}" alt="${item.title}" class="cart-item-img">
      <div class="cart-item-details">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-price">${STORE_CONFIG.currency} ${item.price}</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="updateItemQty(${item.id}, -1)">−</button>
          <span class="qty-number">${item.qty}</span>
          <button class="qty-btn" onclick="updateItemQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Remove item">✕</button>
    </div>
  `).join('');

  if (subtotalEl) subtotalEl.textContent = `${STORE_CONFIG.currency} ${subtotal.toLocaleString()}`;
  if (shippingEl) shippingEl.textContent = isFreeShip ? 'FREE' : `${STORE_CONFIG.currency} ${shippingFee}`;
  if (totalEl) totalEl.textContent = `${STORE_CONFIG.currency} ${grandTotal.toLocaleString()}`;
}

function openCartDrawer() {
  renderCartDrawer();
  document.getElementById('cartDrawerOverlay').classList.add('active');
  document.getElementById('cartDrawer').classList.add('active');
}

function closeCartDrawer() {
  document.getElementById('cartDrawerOverlay').classList.remove('active');
  document.getElementById('cartDrawer').classList.remove('active');
}

// -------------------------------------------------------------
// Wishlist Logic
// -------------------------------------------------------------
function toggleWishlist(productId) {
  const index = AppState.wishlist.indexOf(productId);
  if (index > -1) {
    AppState.wishlist.splice(index, 1);
    showToast('Removed from wishlist');
  } else {
    AppState.wishlist.push(productId);
    showToast('Added to your wishlist!');
  }
  localStorage.setItem('qadri_wishlist', JSON.stringify(AppState.wishlist));
  updateWishlistBadge();
  renderProducts();
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlistBadge');
  if (badge) badge.textContent = AppState.wishlist.length;
}

function openWishlistModal() {
  const modal = document.getElementById('genericModal');
  const content = document.getElementById('genericModalContent');
  if (!modal || !content) return;

  const items = getAllProducts().filter(p => AppState.wishlist.includes(p.id));

  content.innerHTML = `
    <div style="padding: 1.5rem;">
      <h2 style="font-size: 1.3rem; margin-bottom: 1rem; color: #0f172a;">My Wishlist (${items.length})</h2>
      ${items.length === 0 ? `
        <p style="color: #64748b; text-align: center; padding: 2rem 0;">Your wishlist is currently empty.</p>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${items.map(item => `
            <div style="display: flex; gap: 12px; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
              <img src="${item.image}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px; border: 1px solid #e2e8f0;">
              <div style="flex: 1;">
                <div style="font-size: 0.9rem; font-weight: 600;">${item.title}</div>
                <div style="color: var(--primary-color); font-weight: 700;">${STORE_CONFIG.currency} ${item.price}</div>
              </div>
              <button class="btn-add-cart" onclick="addToCart(${item.id}); closeModal();">Add to Cart</button>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  modal.classList.add('active');
}

// -------------------------------------------------------------
// Quick View Modal
// -------------------------------------------------------------
function openQuickView(productId) {
  const product = getAllProducts().find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('genericModal');
  const content = document.getElementById('genericModalContent');
  if (!modal || !content) return;

  content.innerHTML = `
    <div class="modal-grid">
      <div class="modal-img-container">
        <img src="${product.image}" alt="${product.title}">
      </div>
      <div class="modal-details">
        <span class="product-sku">SKU: ${product.code}</span>
        <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 4px 0 8px;">${product.title}</h2>
        <div class="product-rating" style="margin-bottom: 12px;">
          <span>★ ${product.rating}</span>
          <span class="count">(${product.reviews} customer reviews)</span>
          <span style="margin-left: 10px; color: #10b981; font-weight: 600;">● In Stock (${product.stock} units)</span>
        </div>
        
        <div class="product-pricing" style="margin-bottom: 1rem;">
          <span class="original-price" style="font-size: 1rem;">${STORE_CONFIG.currency} ${product.originalPrice}</span>
          <span class="wholesale-price" style="font-size: 1.6rem;">${STORE_CONFIG.currency} ${product.price}</span>
          <span style="background: #ef4444; color: #fff; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">WHOLESALE</span>
        </div>

        <p style="color: #475569; font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.25rem;">
          ${product.description}
        </p>

        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1.25rem;">
          <label style="font-weight: 600; font-size: 0.9rem;">Quantity:</label>
          <div class="qty-control">
            <button class="qty-btn" onclick="adjustModalQty(-1)">−</button>
            <span class="qty-number" id="modalQty">1</span>
            <button class="qty-btn" onclick="adjustModalQty(1)">+</button>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="btn-checkout" onclick="addModalToCart(${product.id})">
            Add to Cart
          </button>
          <button class="btn-whatsapp-order" onclick="orderSingleWhatsApp(${product.id}, getModalQty())">
            Buy Now via WhatsApp
          </button>
        </div>

        <div style="margin-top: 1.25rem; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 0.82rem; color: #64748b; display: flex; flex-direction: column; gap: 4px;">
          <div>✓ 7 Days Replacement Warranty</div>
          <div>✓ Cash on Delivery (COD) Available All Over Pakistan</div>
          <div>✓ Wholesale Guaranteed Best Rates</div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function adjustModalQty(change) {
  const el = document.getElementById('modalQty');
  if (!el) return;
  let q = parseInt(el.textContent, 10) + change;
  if (q < 1) q = 1;
  el.textContent = q;
}

function getModalQty() {
  const el = document.getElementById('modalQty');
  return el ? parseInt(el.textContent, 10) : 1;
}

function addModalToCart(productId) {
  const q = getModalQty();
  addToCart(productId, q);
  closeModal();
}

function closeModal() {
  const modal = document.getElementById('genericModal');
  if (modal) modal.classList.remove('active');
}

// -------------------------------------------------------------
// WhatsApp Direct Checkout Generators
// -------------------------------------------------------------
function orderSingleWhatsApp(productId, qty = 1) {
  const product = getAllProducts().find(p => p.id === productId);
  if (!product) return;

  const total = product.price * qty;
  const msg = `Salam ${STORE_CONFIG.name}! I want to order this product:%0A%0A` +
              `*Product:* ${product.title}%0A` +
              `*Code:* ${product.code}%0A` +
              `*Quantity:* ${qty}%0A` +
              `*Wholesale Price:* ${STORE_CONFIG.currency} ${product.price}%0A` +
              `*Total:* ${STORE_CONFIG.currency} ${total}%0A%0A` +
              `Please confirm my order and share delivery details.`;

  window.open(`https://wa.me/${STORE_CONFIG.whatsapp}?text=${msg}`, '_blank');
}

function checkoutWhatsApp() {
  if (AppState.cart.length === 0) {
    showToast('Your cart is empty!');
    return;
  }

  const subtotal = AppState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const isFreeShip = subtotal >= STORE_CONFIG.freeShippingThreshold;
  const shippingFee = isFreeShip ? 0 : STORE_CONFIG.shippingFee;
  const grandTotal = subtotal + shippingFee;

  let msg = `Salam ${STORE_CONFIG.name}! I want to place an order from your website:%0A%0A*ORDER SUMMARY:*%0A`;
  AppState.cart.forEach((item, idx) => {
    msg += `${idx + 1}. ${item.title} (Qty: ${item.qty}) - ${STORE_CONFIG.currency} ${item.price * item.qty}%0A`;
  });

  msg += `%0A*Subtotal:* ${STORE_CONFIG.currency} ${subtotal}%0A` +
         `*Delivery:* ${isFreeShip ? 'FREE' : STORE_CONFIG.currency + ' ' + shippingFee}%0A` +
         `*Grand Total:* ${STORE_CONFIG.currency} ${grandTotal}%0A%0A` +
         `Please provide payment and delivery address verification.`;

  window.open(`https://wa.me/${STORE_CONFIG.whatsapp}?text=${msg}`, '_blank');
}

// -------------------------------------------------------------
// Checkout Modal (COD / JazzCash / EasyPaisa)
// -------------------------------------------------------------
function openCheckoutModal() {
  if (AppState.cart.length === 0) {
    showToast('Your cart is empty!');
    return;
  }
  closeCartDrawer();

  const subtotal = AppState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const isFreeShip = subtotal >= STORE_CONFIG.freeShippingThreshold;
  const shippingFee = isFreeShip ? 0 : STORE_CONFIG.shippingFee;
  const grandTotal = subtotal + shippingFee;

  const modal = document.getElementById('genericModal');
  const content = document.getElementById('genericModalContent');
  if (!modal || !content) return;

  content.innerHTML = `
    <div style="padding: 1.75rem;">
      <h2 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Complete Your Order</h2>
      <p style="color: #64748b; font-size: 0.85rem;">Wholesale Fast Dispatch Across Pakistan</p>
      
      <form id="checkoutForm" onsubmit="handleOrderSubmit(event, ${grandTotal})">
        <div class="checkout-form-grid">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" id="custName" required placeholder="Ali Ahmed">
          </div>
          <div class="form-group">
            <label>WhatsApp / Mobile No *</label>
            <input type="tel" id="custPhone" required placeholder="0300-1234567">
          </div>
          <div class="form-group full-col">
            <label>Complete Delivery Address *</label>
            <textarea id="custAddress" required rows="2" placeholder="House #, Street #, Area, Landmark"></textarea>
          </div>
          <div class="form-group">
            <label>City *</label>
            <input type="text" id="custCity" required placeholder="Karachi / Lahore / Islamabad">
          </div>
          <div class="form-group">
            <label>Payment Method *</label>
            <div class="payment-method-selector">
              <div class="payment-option-card selected" onclick="selectPayment(this, 'COD')">Cash on Delivery</div>
              <div class="payment-option-card" onclick="selectPayment(this, 'JazzCash')">JazzCash</div>
              <div class="payment-option-card" onclick="selectPayment(this, 'EasyPaisa')">EasyPaisa</div>
            </div>
            <input type="hidden" id="custPayment" value="COD">
          </div>
        </div>

        <div style="background: #f8fafc; border-radius: 8px; padding: 12px; margin-top: 1.25rem; font-size: 0.9rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Items (${AppState.cart.length}):</span>
            <strong>${STORE_CONFIG.currency} ${subtotal.toLocaleString()}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Delivery Charges:</span>
            <strong>${isFreeShip ? 'FREE' : STORE_CONFIG.currency + ' ' + shippingFee}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed #cbd5e1; padding-top: 8px; font-weight: 800; font-size: 1.1rem; color: var(--primary-color);">
            <span>Payable Amount:</span>
            <span>${STORE_CONFIG.currency} ${grandTotal.toLocaleString()}</span>
          </div>
        </div>

        <button type="submit" class="btn-checkout" style="width: 100%; margin-top: 1.25rem;">
          Confirm & Place Order
        </button>
      </form>
    </div>
  `;

  modal.classList.add('active');
}

function selectPayment(el, method) {
  document.querySelectorAll('.payment-option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('custPayment').value = method;
}

function handleOrderSubmit(e, grandTotal) {
  e.preventDefault();
  const name = document.getElementById('custName').value;
  const phone = document.getElementById('custPhone').value;
  const address = document.getElementById('custAddress').value;
  const city = document.getElementById('custCity').value;
  const payment = document.getElementById('custPayment').value;

  const orderId = 'QG-' + Math.floor(100000 + Math.random() * 900000);

  const content = document.getElementById('genericModalContent');
  content.innerHTML = `
    <div style="padding: 2.5rem 1.5rem; text-align: center;">
      <div style="width: 64px; height: 64px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1rem;">
        ✓
      </div>
      <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a;">Shukriya ${name}!</h2>
      <p style="color: #64748b; margin-top: 4px;">Your order has been placed successfully.</p>
      
      <div style="background: #f1fbf6; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 1.5rem 0; text-align: left;">
        <div style="font-weight: 700; color: #0f3c28; font-size: 1rem; margin-bottom: 6px;">Order ID: #${orderId}</div>
        <div style="font-size: 0.85rem; color: #334155;">Phone: ${phone}</div>
        <div style="font-size: 0.85rem; color: #334155;">City: ${city} | Method: ${payment}</div>
        <div style="font-size: 0.85rem; color: #334155; margin-top: 4px;">Payable Total: <strong>${STORE_CONFIG.currency} ${grandTotal.toLocaleString()}</strong></div>
      </div>

      <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.5rem;">
        Our customer support team will contact you on WhatsApp / Phone before dispatch.
      </p>

      <button class="btn-checkout" onclick="closeModal();">Continue Shopping</button>
    </div>
  `;

  AppState.cart = [];
  saveCart();
  updateCartBadge();
}

// -------------------------------------------------------------
// Real-Time Parcel Tracking Engine (Full Lifecycle Stages)
// -------------------------------------------------------------
function getFallbackOrStoredOrders() {
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('qadri_placed_orders')) || [];
  } catch (e) {
    orders = [];
  }

  if (!orders || orders.length === 0) {
    orders = [
      {
        orderId: 'SNS-484209',
        name: 'Ahmed Raza',
        phone: '03001234567',
        city: 'Karachi',
        address: 'Gulshan-e-Iqbal Block 13, Near Disco Bakery',
        grandTotal: 797,
        status: 'Preparing',
        payment: 'COD',
        courier: 'Leopards Courier',
        trackingNumber: 'LEOP-882194',
        items: [{ title: 'Multipurpose Kitchen Storage Rack', qty: 2, price: 180, image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150' }],
        date: new Date(Date.now() - 3600000 * 6).toISOString()
      },
      {
        orderId: 'SNS-100201',
        name: 'Ahmed Khan',
        phone: '+92 311 8877665',
        city: 'Lahore',
        address: 'Model Town Block C, House 42',
        grandTotal: 748,
        status: 'Shipped',
        payment: 'COD',
        courier: 'Trax Logistics',
        trackingNumber: 'TRAX-449102',
        items: [{ title: 'Premium Waterproof Bike Cover', qty: 1, price: 400, image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=150' }],
        date: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        orderId: 'SNS-204918',
        name: 'Zainab Fatima',
        phone: '03335544332',
        city: 'Islamabad',
        address: 'Sector F-10 Markaz, Street 14',
        grandTotal: 1450,
        status: 'Pending',
        payment: 'COD',
        courier: 'Awaiting Verification',
        trackingNumber: 'PENDING',
        items: [{ title: 'Cosmetic Organizer 360 Rotating', qty: 1, price: 850, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150' }],
        date: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        orderId: 'SNS-310892',
        name: 'Muhammad Bilal',
        phone: '03456789012',
        city: 'Rawalpindi',
        address: 'Satellite Town Block B, Commercial Market',
        grandTotal: 2190,
        status: 'Delivered',
        payment: 'COD',
        courier: 'TCS Express',
        trackingNumber: 'TCS-991204',
        items: [{ title: 'Electric Mosquito Killer Lamp', qty: 1, price: 1250, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150' }],
        date: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ];
    try {
      localStorage.setItem('qadri_placed_orders', JSON.stringify(orders));
    } catch (e) {}
  }
  return orders;
}

function openTrackOrderModal(prefillQuery = '') {
  const modal = document.getElementById('genericModal');
  const content = document.getElementById('genericModalContent');
  if (!modal || !content) return;

  content.innerHTML = `
    <div style="padding: 1.5rem 1.75rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: #ecfdf5; color: #064C63; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
            📦
          </div>
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2;">Live Parcel Tracking</h2>
            <p style="color: #64748b; font-size: 0.8rem; margin: 2px 0 0 0;">Save &amp; Smile Real-Time Order &amp; Delivery Status</p>
          </div>
        </div>
      </div>

      <p style="color: #475569; font-size: 0.84rem; margin-bottom: 10px;">
        Apna <strong>Order ID</strong> (maslan: <code>SNS-484209</code> ya <code>SS-100201</code>), <strong>Courier Tracking Number</strong>, ya <strong>Phone Number</strong> darj karen:
      </p>

      <div style="display: flex; gap: 8px; margin-bottom: 10px;">
        <input 
          type="text" 
          id="trackInput" 
          value="${prefillQuery}" 
          placeholder="Enter Order ID (e.g. SNS-484209) or Mobile #..." 
          style="flex: 1; padding: 11px 14px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-weight: 600; color: #0f172a; outline: none; transition: border-color 0.2s;"
          onfocus="this.style.borderColor='#064C63'"
          onblur="this.style.borderColor='#cbd5e1'"
          onkeyup="if(event.key === 'Enter') trackOrderQuery()"
        >
        <button class="btn-checkout" onclick="trackOrderQuery()" style="padding: 11px 22px; font-weight: 700; border-radius: 8px; background: #064C63; color: white; display: flex; align-items: center; gap: 6px;">
          <span>Track</span>
          <span>🔍</span>
        </button>
      </div>

      <!-- Quick sample search tags for convenience -->
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 0.75rem; color: #64748b; margin-bottom: 14px;">
        <span style="font-weight: 700;">Sample Orders:</span>
        <button type="button" onclick="document.getElementById('trackInput').value='SNS-484209'; trackOrderQuery();" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 6px; cursor: pointer; color: #0284c7; font-weight: 600;">#SNS-484209 (Preparing)</button>
        <button type="button" onclick="document.getElementById('trackInput').value='SNS-100201'; trackOrderQuery();" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 6px; cursor: pointer; color: #4338ca; font-weight: 600;">#SNS-100201 (Shipped)</button>
        <button type="button" onclick="document.getElementById('trackInput').value='SNS-204918'; trackOrderQuery();" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 6px; cursor: pointer; color: #b45309; font-weight: 600;">#SNS-204918 (Pending)</button>
      </div>

      <div id="trackResultContainer"></div>
    </div>
  `;

  modal.classList.add('active');
  const inputEl = document.getElementById('trackInput');
  if (inputEl) {
    inputEl.focus();
    if (prefillQuery) trackOrderQuery();
  }
}

function trackOrderQuery() {
  const queryEl = document.getElementById('trackInput');
  const res = document.getElementById('trackResultContainer');
  if (!queryEl || !res) return;

  const rawQuery = queryEl.value.trim();
  if (!rawQuery) {
    res.innerHTML = `
      <div style="padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #b91c1c; font-size: 0.85rem; text-align: center;">
        ⚠️ Barah-e-karam apna Order ID ya Mobile Number darj karen.
      </div>
    `;
    return;
  }

  const cleanQuery = rawQuery.replace(/[#\s-]/g, '').toLowerCase();
  const orders = getFallbackOrStoredOrders();

  // Search logic: by orderId, by trackingNumber, by phone, or by name
  const matched = orders.filter(o => {
    const oId = (o.orderId || '').replace(/[#\s-]/g, '').toLowerCase();
    const tNum = (o.trackingNumber || '').replace(/[#\s-]/g, '').toLowerCase();
    const phone = (o.phone || '').replace(/[^0-9]/g, '');
    const cleanPhoneQ = rawQuery.replace(/[^0-9]/g, '');
    const name = (o.name || '').toLowerCase();

    return oId.includes(cleanQuery) ||
           cleanQuery.includes(oId) ||
           (tNum && tNum.includes(cleanQuery)) ||
           (cleanPhoneQ && phone.includes(cleanPhoneQ)) ||
           name.includes(rawQuery.toLowerCase());
  });

  if (matched.length === 0) {
    res.innerHTML = `
      <div style="background: #fff; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🔍</div>
        <h3 style="font-size: 1.05rem; font-weight: 800; color: #1e293b; margin: 0 0 6px 0;">Koi Order Nahi Mila</h3>
        <p style="color: #64748b; font-size: 0.84rem; max-width: 380px; margin: 0 auto 14px auto; line-height: 1.5;">
          Aap ka darj kardah number <strong>"${rawQuery}"</strong> system mein match nahi hua. Barah-e-karam check karen ke Order ID ya phone number durust hai.
        </p>
        <div style="font-size: 0.8rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; display: inline-block;">
          💡 Try sample IDs: 
          <a href="javascript:void(0)" onclick="document.getElementById('trackInput').value='SNS-484209'; trackOrderQuery();" style="color:#064C63; font-weight:700;">#SNS-484209</a> or 
          <a href="javascript:void(0)" onclick="document.getElementById('trackInput').value='SNS-100201'; trackOrderQuery();" style="color:#064C63; font-weight:700;">#SNS-100201</a>
        </div>
        <div style="margin-top: 14px;">
          <a href="https://wa.me/923162323616?text=Salam!%20Mera%20Order%20track%20nahi%20ho%20raha,%20search:%20${encodeURIComponent(rawQuery)}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; background: #25D366; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; text-decoration: none;">
            <span>💬 Help on WhatsApp</span>
          </a>
        </div>
      </div>
    `;
    return;
  }

  // Display top matching order
  const order = matched[0];
  renderSingleOrderTrackingCard(order, res);
}

function renderSingleOrderTrackingCard(o, container) {
  const normStatus = (o.status || 'Pending').toLowerCase().trim();

  // Stage mapping:
  // 1 = Pending (Order Placed / Verification Pending)
  // 2 = Confirmed (Verified)
  // 3 = Preparing / Processing (Packaging in warehouse)
  // 4 = Shipped / Dispatched (Courier in transit)
  // 5 = Delivered
  let stageNumber = 1;
  let statusBadgeBg = '#fef3c7';
  let statusBadgeText = '#92400e';
  let statusBadgeBorder = '#fde68a';
  let statusTitle = '🕒 Order Masool / Pending Verification';
  let statusUrduNotice = 'Aap ka order system mein masool ho chuka hai. Hamari support team jald verification ke liye call ya WhatsApp par rabta karegi.';
  let stageSub = 'Verification desk par active';

  if (normStatus.includes('confirm')) {
    stageNumber = 2;
    statusBadgeBg = '#ccfbf1';
    statusBadgeText = '#0f766e';
    statusBadgeBorder = '#99f6e4';
    statusTitle = '✍️ Order Confirmed';
    statusUrduNotice = 'Aap ka order kamyabi se confirm ho gaya hai aur packaging queue mein transfer kar diya gaya hai.';
    stageSub = 'Order verified via WhatsApp/Call';
  } else if (normStatus.includes('prepar') || normStatus.includes('process') || normStatus.includes('pack')) {
    stageNumber = 3;
    statusBadgeBg = '#e0f2fe';
    statusBadgeText = '#0369a1';
    statusBadgeBorder = '#bae6fd';
    statusTitle = '📦 Parcel Prepare Ho Raha Hai (Warehouse Packaging)';
    statusUrduNotice = '📦 Hamare central warehouse mein aap ke parcel ki quality inspection, testing aur protective bubble packaging jari hai. Jald courier van ko handover kiya jaega.';
    stageSub = 'Packaging & QC inspection in progress';
  } else if (normStatus.includes('ship') || normStatus.includes('dispatch') || normStatus.includes('transit')) {
    stageNumber = 4;
    statusBadgeBg = '#e0e7ff';
    statusBadgeText = '#3730a3';
    statusBadgeBorder = '#c7d2fe';
    statusTitle = '🚚 Courier Handover / In Transit';
    statusUrduNotice = `🚚 Aap ka parcel courier partner (${o.courier || 'Leopards / Trax'}) ko handover ho chuka hai aur transit mein rawana hai.`;
    stageSub = 'In transit to your destination';
  } else if (normStatus.includes('deliver') && !normStatus.includes('out')) {
    stageNumber = 5;
    statusBadgeBg = '#dcfce7';
    statusBadgeText = '#15803d';
    statusBadgeBorder = '#bbf7d0';
    statusTitle = '✅ Parcel Successfully Delivered';
    statusUrduNotice = '🎉 Mubarak ho! Parcel kamyabi se aap ke address par pohnch gaya hai. Save & Smile par shopping karne ka shukriya!';
    stageSub = 'Order completed successfully';
  } else if (normStatus.includes('cancel')) {
    stageNumber = 0;
    statusBadgeBg = '#ffe4e6';
    statusBadgeText = '#be123c';
    statusBadgeBorder = '#fecdd3';
    statusTitle = '❌ Order Cancelled';
    statusUrduNotice = 'Yeh order cancel ho chuka hai. Mazeed maloomat ke liye hamari helpline se rabta karen.';
    stageSub = 'Cancelled';
  }

  const trackingCode = o.trackingNumber || ('LEOP-' + Math.floor(100000 + Math.random() * 900000));
  const courierName = o.courier || 'Leopards Courier Pakistan';
  const orderDate = o.date ? new Date(o.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today';

  // Build the 5-step visual timeline
  const steps = [
    { num: 1, label: 'Order Placed', urdu: 'آرڈر موصول', desc: 'Pending' },
    { num: 2, label: 'Confirmed', urdu: 'کنفرم', desc: 'Verified' },
    { num: 3, label: 'Preparing', urdu: 'تیاری / پیکنگ', desc: 'Packaging' },
    { num: 4, label: 'In Transit', urdu: 'روانہ کوریئر', desc: 'Dispatched' },
    { num: 5, label: 'Delivered', urdu: 'ڈلیور', desc: 'Completed' }
  ];

  const stepperHtml = steps.map((s, idx) => {
    const isCompleted = stageNumber >= s.num;
    const isCurrent = stageNumber === s.num;

    let circleBg = '#e2e8f0';
    let circleColor = '#64748b';
    let ringStyle = 'none';

    if (isCompleted) {
      circleBg = '#064C63';
      circleColor = '#ffffff';
    }
    if (isCurrent) {
      circleBg = '#008FAF';
      circleColor = '#ffffff';
      ringStyle = '0 0 0 4px rgba(0, 143, 175, 0.25)';
    }

    const lineActive = stageNumber > s.num;

    return `
      <div style="flex: 1; position: relative; text-align: center;">
        ${idx > 0 ? `
          <div style="position: absolute; top: 16px; left: -50%; width: 100%; height: 3px; background: ${lineActive ? '#064C63' : '#e2e8f0'}; z-index: 1;"></div>
        ` : ''}
        <div style="position: relative; z-index: 2; width: 34px; height: 34px; margin: 0 auto 6px; border-radius: 50%; background: ${circleBg}; color: ${circleColor}; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; font-weight: 800; box-shadow: ${ringStyle}; transition: all 0.3s;">
          ${isCompleted && !isCurrent ? '✓' : (s.num === 3 ? '📦' : (s.num === 4 ? '🚚' : (s.num === 5 ? '🏠' : s.num)))}
        </div>
        <div style="font-size: 0.76rem; font-weight: ${isCurrent ? '800' : '600'}; color: ${isCurrent ? '#064C63' : (isCompleted ? '#0f172a' : '#94a3b8')}; line-height: 1.2;">
          ${s.label}
        </div>
        <div style="font-size: 0.68rem; color: ${isCurrent ? '#008FAF' : '#94a3b8'}; margin-top: 2px;">
          ${s.urdu}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.04); margin-top: 10px;">
      
      <!-- Top Status Banner -->
      <div style="background: ${statusBadgeBg}; border-bottom: 1.5px solid ${statusBadgeBorder}; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: gap: 8px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; font-size: 1rem; color: ${statusBadgeText};">
              ${statusTitle}
            </span>
          </div>
          <div style="font-size: 0.78rem; color: ${statusBadgeText}; opacity: 0.9; margin-top: 3px;">
            ${stageSub} • Date: ${orderDate}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Order Tracking ID</div>
          <div style="font-size: 1.05rem; font-weight: 900; font-family: monospace; color: #064C63;">#${o.orderId}</div>
        </div>
      </div>

      <!-- Live Notice Bar (Urdu & English) -->
      <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 18px; font-size: 0.85rem; color: #334155; line-height: 1.6; display: flex; gap: 10px; align-items: flex-start;">
        <span style="font-size: 1.1rem; flex-shrink: 0;">ℹ️</span>
        <div style="flex: 1;">
          <strong style="color: #0f172a;">Current Stage Update:</strong> ${statusUrduNotice}
        </div>
      </div>

      <!-- 5-Step Visual Stepper -->
      <div style="padding: 22px 14px 18px 14px; background: #ffffff; border-bottom: 1px solid #f1f5f9;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; max-width: 580px; margin: 0 auto;">
          ${stepperHtml}
        </div>
      </div>

      <!-- Courier & Destination Details -->
      <div style="padding: 16px 18px; background: #fafbfc; border-bottom: 1px solid #e2e8f0;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; font-size: 0.83rem;">
          
          <div style="background: #ffffff; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Courier Service</div>
            <div style="font-weight: 800; color: #0f172a; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
              <span>🚚</span> <span>${courierName}</span>
            </div>
            <div style="margin-top: 4px; font-family: monospace; font-size: 0.8rem; color: #0284c7; font-weight: 700;">
              Tracking CN: ${trackingCode}
            </div>
          </div>

          <div style="background: #ffffff; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Delivery Destination</div>
            <div style="font-weight: 800; color: #0f172a;">${o.name || 'Valued Customer'}</div>
            <div style="color: #64748b; font-size: 0.78rem; margin-top: 2px;">
              ${o.address || 'Address provided'}, ${o.city || 'Pakistan'}
            </div>
            <div style="font-family: monospace; font-size: 0.76rem; color: #64748b; margin-top: 2px;">
              📞 ${o.phone || 'N/A'}
            </div>
          </div>

          <div style="background: #ffffff; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Payment Summary</div>
            <div style="font-weight: 900; color: #064C63; font-size: 1.05rem;">Rs. ${(o.grandTotal || 0).toLocaleString()}</div>
            <div style="color: #059669; font-size: 0.78rem; font-weight: 700; margin-top: 2px;">
              ✓ Mode: ${o.payment || 'Cash on Delivery (COD)'}
            </div>
          </div>

        </div>
      </div>

      <!-- Items in Order -->
      <div style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 0.83rem;">
        <div style="font-weight: 800; color: #0f172a; margin-bottom: 8px;">Order Items (${(o.items || []).length}):</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${(o.items || []).map(i => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #f1f5f9;">
              <div style="display: flex; align-items: center; gap: 10px;">
                ${i.image ? `<img src="${i.image}" style="width: 34px; height: 34px; object-fit: contain; border-radius: 6px; background: white; border: 1px solid #e2e8f0;">` : ''}
                <div>
                  <div style="font-weight: 700; color: #1e293b;">${i.title}</div>
                  <div style="font-size: 0.74rem; color: #64748b;">Qty: ${i.qty || 1} unit(s)</div>
                </div>
              </div>
              <div style="font-weight: 800; color: #0f172a;">Rs. ${((i.price || 0) * (i.qty || 1)).toLocaleString()}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Action Footer (WhatsApp Inquire & Track Another) -->
      <div style="padding: 14px 18px; background: #ffffff; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div style="font-size: 0.8rem; color: #64748b;">
          Koi sawal ya issue hai? Hamari team se WhatsApp par fori rabta karen.
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="https://wa.me/923162323616?text=${encodeURIComponent(`Salam! Mera Save & Smile Order #${o.orderId} (${stageSub}) k baray mein inquiry chahiye.`)}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; background: #25D366; color: white; padding: 9px 16px; border-radius: 8px; font-weight: 800; font-size: 0.83rem; text-decoration: none; box-shadow: 0 2px 6px rgba(37,211,102,0.25);">
            <span>WhatsApp Support</span>
          </a>
          <button onclick="document.getElementById('trackInput').value=''; document.getElementById('trackInput').focus();" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 9px 14px; border-radius: 8px; font-weight: 700; font-size: 0.83rem; cursor: pointer;">
            Track Another Order
          </button>
        </div>
      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// Live Search
// -------------------------------------------------------------
function initSearch() {
  const input = document.getElementById('searchInput');
  const dropdown = document.getElementById('searchResultsDropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    if (val.length < 2) {
      dropdown.classList.remove('active');
      return;
    }

    const matched = getAllProducts().filter(p => 
      p.title.toLowerCase().includes(val) || 
      p.code.toLowerCase().includes(val)
    );

    if (matched.length === 0) {
      dropdown.innerHTML = `<div style="padding: 12px; font-size: 0.85rem; color: #64748b; text-align: center;">No matching gadgets found.</div>`;
    } else {
      dropdown.innerHTML = matched.slice(0, 6).map(p => `
        <div class="search-result-item" onclick="openQuickView(${p.id}); document.getElementById('searchResultsDropdown').classList.remove('active');">
          <img src="${p.image}" alt="${p.title}">
          <div class="search-result-info">
            <div class="title">${p.title}</div>
            <div class="price">${STORE_CONFIG.currency} ${p.price} <span style="color: #94a3b8; text-decoration: line-through; font-size: 0.75rem;">${STORE_CONFIG.currency} ${p.originalPrice}</span></div>
          </div>
        </div>
      `).join('');
    }
    dropdown.classList.add('active');
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
}

function toggleSearchOverlay() {
  const bar = document.getElementById('expandSearchBar');
  if (!bar) return;
  bar.classList.toggle('active');
  if (bar.classList.contains('active')) {
    const inp = document.getElementById('searchInput');
    if (inp) inp.focus();
  }
}

function handleSearchSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('searchInput');
  if (input) applyQuickSearch(input.value.trim());
}

function handleHeroSearchSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('heroSearchInput');
  applyQuickSearch(input.value.trim());
}

function applyQuickSearch(query) {
  if (!query) return;

  const matched = getAllProducts().filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.code.toLowerCase().includes(query.toLowerCase()));
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  AppState.currentCategory = 'search';
  AppState.currentFrontTab = 'all';
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.front-tab-button').forEach(b => b.classList.remove('active'));

  grid.innerHTML = matched.length === 0 ? `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #64748b;">
      <h3>No products matched "${query}"</h3>
      <button class="tab-btn active" onclick="filterByCategory('all')" style="margin-top: 1rem;">View All Products</button>
    </div>
  ` : matched.map(product => {
    const isWishlisted = AppState.wishlist.includes(product.id);
    return `
      <div class="product-card">
        <span class="product-badge">${product.badge}</span>
        <div class="product-img-wrapper" onclick="openQuickView(${product.id})">
          <img src="${product.image}" alt="${product.title}">
        </div>
        <div class="card-quick-actions">
          <button class="action-icon-circle ${isWishlisted ? 'favorited' : ''}" onclick="toggleWishlist(${product.id})">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? '#ef4444' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <button class="action-icon-circle" onclick="openQuickView(${product.id})">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <div class="product-card-body">
          <div class="product-sku">SKU: ${product.code}</div>
          <h3 class="product-title" onclick="openQuickView(${product.id})">${product.title}</h3>
          <div class="product-pricing">
            <span class="original-price">${STORE_CONFIG.currency} ${product.originalPrice}</span>
            <span class="wholesale-price">${STORE_CONFIG.currency} ${product.price}</span>
          </div>
          <div class="product-card-actions">
            <button class="btn-add-cart" onclick="addToCart(${product.id})">Add to Cart</button>
            <button class="btn-whatsapp-direct" onclick="orderSingleWhatsApp(${product.id})">📞</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const dropdown = document.getElementById('searchResultsDropdown');
  if (dropdown) dropdown.classList.remove('active');

  const productsSection = document.getElementById('products');
  if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
}

// -------------------------------------------------------------
// Toast Notifications
// -------------------------------------------------------------
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toastNotice');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// -------------------------------------------------------------
// AI Store Assistant Robot Logic (Auto-answers Store FAQs & Queries)
// -------------------------------------------------------------
function toggleAiChat() {
  const chatWindow = document.getElementById('aiChatWindow');
  if (!chatWindow) return;
  chatWindow.classList.toggle('open');
  if (chatWindow.classList.contains('open')) {
    const inp = document.getElementById('aiUserInput');
    if (inp) inp.focus();
    scrollAiMessages();
  }
}

function scrollAiMessages() {
  const container = document.getElementById('aiChatMessages');
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 50);
  }
}

function sendQuickAiQuery(query) {
  processAiQuery(query);
}

function handleAiMessageSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('aiUserInput');
  if (!input) return;
  const query = input.value.trim();
  if (!query) return;
  input.value = '';
  processAiQuery(query);
}

function processAiQuery(query) {
  const container = document.getElementById('aiChatMessages');
  if (!container) return;

  // Append user bubble
  const userDiv = document.createElement('div');
  userDiv.className = 'ai-msg user';
  userDiv.innerHTML = `<div class="ai-msg-bubble">${escapeHtml(query)}</div>`;
  container.appendChild(userDiv);
  scrollAiMessages();

  // Generate automated intelligent response
  setTimeout(() => {
    const reply = getAiAutoResponse(query);
    const botDiv = document.createElement('div');
    botDiv.className = 'ai-msg bot';
    botDiv.innerHTML = `<div class="ai-msg-bubble">${reply}</div>`;
    container.appendChild(botDiv);
    scrollAiMessages();
  }, 450);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getAiAutoResponse(text) {
  const q = text.toLowerCase();

  if (q.includes('delivery') || q.includes('time') || q.includes('shipping') || q.includes('kitne din') || q.includes('kab milega')) {
    return `🚚 <strong>Delivery Policy:</strong><br>
    Hamari delivery pooray Pakistan mein <strong>2 se 3 working days</strong> mein ho jati hai.<br>
    • Rs. 3,000 se zyada k order par <strong>FREE Delivery</strong> hai!<br>
    • Rs. 3,000 se kam par shipping fee sirf Rs. 200 hai.`;
  }

  if (q.includes('wholesale') || q.includes('bulk') || q.includes('discount') || q.includes('reseller') || q.includes('rate')) {
    return `📦 <strong>Wholesale & Bulk Orders:</strong><br>
    Save & Smile par direct factory wholesale rates faraham kiye jaate hain.<br>
    Agar aap 1 carton ya bulk stock lena chahte hain to direct WhatsApp par rabta karein: <a href="https://wa.me/923162323616" target="_blank" style="color: #007382; font-weight: 700; text-decoration: underline;">0316-2323616</a>.`;
  }

  if (q.includes('payment') || q.includes('jazzcash') || q.includes('easypaisa') || q.includes('cod') || q.includes('cash on delivery')) {
    return `💳 <strong>Payment Options:</strong><br>
    Aap in tareeqon se payment kar sakte hain:<br>
    1. <strong>Cash on Delivery (COD)</strong> - Parcel milne par ada karein.<br>
    2. <strong>JazzCash / EasyPaisa</strong> - Direct mobile transfer.<br>
    3. <strong>Bank Transfer</strong>.`;
  }

  if (q.includes('track') || q.includes('status') || q.includes('order')) {
    return `📍 <strong>Order Tracking:</strong><br>
    Aap apna order asaani se track kar sakte hain.<br>
    Header mein 4-dots Menu open kar k <strong>"Track Order"</strong> par click karein aur apna Order ID / Mobile number enter karein!`;
  }

  if (q.includes('return') || q.includes('replace') || q.includes('warranty') || q.includes('kharaab')) {
    return `🛡️ <strong>Replacement Guarantee:</strong><br>
    Tamam products par <strong>7 Days Replacement Guarantee</strong> mojud hai. Agar parcel mein koi issue ho to parcel kholte waqt video banayein aur hamare helpline WhatsApp 0316-2323616 par send karein.`;
  }

  if (q.includes('watch') || q.includes('ultra') || q.includes('smartwatch')) {
    return `⌚ <strong>Smart Watches Collection:</strong><br>
    Hamare paas T800 Ultra, T900 Ultra, S8 Pro aur mukhtalif smart watches direct wholesale rate (Rs. 1,000 - Rs. 1,500) par dastiyab hain. Search mein "Watch" likhein ya Category select karein!`;
  }

  if (q.includes('storage') || q.includes('rack') || q.includes('organizer')) {
    return `🗄️ <strong>Storage & Organizers:</strong><br>
    Kitchen racks, shoes organizers, spice racks aur foldable storage boxes premium quality mein stock mein hain.`;
  }

  if (q.includes('salam') || q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return `Walaykum Assalam! 😊 Khush Aamdeed! Main Save & Smile ka AI store assistant hoon. Main aap ki kya madad kar sakta hoon?`;
  }

  // Default Fallback
  return `🤖 Shukriya aap k sawal ka!<br>
  Save & Smile Pakistan ka top wholesale store hai. Mazeed maloomat ya customized bulk order k liye aap hamare WhatsApp helpline <strong>0316-2323616</strong> par bhi message kar sakte hain.`;
}
