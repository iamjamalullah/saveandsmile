import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';

export default function HotSellingSection() {
  const { products, setCurrentCategory } = useStore();

  const hotProducts = products.filter(p => 
    (p.badge && (p.badge.includes('HOT') || p.badge.includes('BESTSELLER') || p.badge.includes('50%'))) || p.price <= 180
  ).slice(0, 4);

  const displayList = hotProducts.length > 0 ? hotProducts : products.slice(0, 4);

  const handleSeeAll = () => {
    setCurrentCategory('all');
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="store-portion-section portion-hot-selling" id="hotSelling">
      <div className="site-container">
        <div className="portion-header-bar">
          <div className="portion-title-group">
            <span className="portion-pill-tag">🔥 HOT SELLING</span>
            <div>
              <h2 className="portion-heading-text">Hot Selling Wholesale Gadgets</h2>
              <p className="portion-subtitle-text">Fast moving products with highest reseller profit margins</p>
            </div>
          </div>
          <a href="#products" className="portion-view-all" onClick={handleSeeAll}>
            See All Hot Items →
          </a>
        </div>
        <div className="products-grid" id="hotSellingGrid">
          {displayList.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
