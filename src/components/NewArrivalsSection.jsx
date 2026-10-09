import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';

export default function NewArrivalsSection() {
  const { products, setCurrentCategory } = useStore();

  const newProducts = products.filter(p => 
    (p.badge && (p.badge.includes('TOP PICK') || p.badge.includes('ROTATING') || p.badge.includes('EXPANDABLE') || p.badge.includes('WHOLESALE'))) || p.tab === 'travel'
  ).slice(0, 4);

  const displayList = newProducts.length > 0 ? newProducts : products.slice(4, 8);

  const handleSeeAll = () => {
    setCurrentCategory('all');
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="store-portion-section portion-new-arrivals" id="newArrivals">
      <div className="site-container">
        <div className="portion-header-bar">
          <div className="portion-title-group">
            <span className="portion-pill-tag">✨ NEW ARRIVALS</span>
            <div>
              <h2 className="portion-heading-text">Latest New Arrivals</h2>
              <p className="portion-subtitle-text">Fresh containers imported this week — First batch wholesale prices</p>
            </div>
          </div>
          <a href="#products" className="portion-view-all" onClick={handleSeeAll}>
            See All New Arrivals →
          </a>
        </div>
        <div className="products-grid" id="newArrivalsGrid">
          {displayList.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
