import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';

export default function CatalogSection() {
  const { 
    products, 
    currentCategory, 
    setCurrentCategory, 
    currentFrontTab 
  } = useStore();

  const filterTabs = [
    { id: 'all', name: 'All Items' },
    { id: 'storage', name: 'Storage & Racks' },
    { id: 'smartwatches', name: 'Smart Watches' },
    { id: 'bottles', name: 'Mugs & Bottles' },
    { id: 'insect-killers', name: 'Insect Killers' },
    { id: 'beauty', name: 'Beauty & Care' },
    { id: 'accessories', name: 'Accessories' }
  ];

  const filteredProducts = products.filter(p => {
    // If specific category selected
    if (currentCategory !== 'all') {
      return p.category === currentCategory;
    }
    // Else filter by front tab if active
    if (currentFrontTab && currentFrontTab !== 'all') {
      return p.tab === currentFrontTab || !p.tab;
    }
    return true;
  });

  const displayList = filteredProducts.length > 0 ? filteredProducts : products;

  return (
    <section className="catalog-section" id="products">
      <div className="site-container">
        
        {/* Catalog Header & Category Sub-Filters */}
        <div className="catalog-header">
          <div className="catalog-title">
            <h2>All Wholesale Products</h2>
          </div>
          <div className="filter-tabs-list">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${currentCategory === tab.id ? 'active' : ''}`}
                data-cat={tab.id}
                onClick={() => setCurrentCategory(tab.id)}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid" id="productsGrid">
          {displayList.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

      </div>
    </section>
  );
}
