import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';

export default function TrendingPicksSection() {
  const { products, setCurrentCategory } = useStore();

  const trendingProducts = products.filter(p => 
    (p.badge && (p.badge.includes('TRENDING') || p.badge.includes('MEGA DEAL') || p.badge.includes('HOT'))) || p.tab === 'jewelry'
  ).slice(0, 4);

  const displayList = trendingProducts.length > 0 ? trendingProducts : products.slice(2, 6);

  const handleSeeAll = () => {
    setCurrentCategory('all');
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="store-portion-section portion-trending-gadgets" id="trendingPicks">
      <div className="site-container">
        <div className="portion-header-bar">
          <div className="portion-title-group">
            <span className="portion-pill-tag">🌟 TRENDING PICKS</span>
            <div>
              <h2 className="portion-heading-text">Trending Wholesale Picks</h2>
              <p className="portion-subtitle-text">Most demanded smart watches, organizers &amp; lifestyle essentials</p>
            </div>
          </div>
          <a href="#products" className="portion-view-all" onClick={handleSeeAll}>
            See All Trending →
          </a>
        </div>
        <div className="products-grid" id="trendingGrid">
          {displayList.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
