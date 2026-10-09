import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function HeaderTabsDropdown({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('categories');
  const { categories, setCurrentCategory } = useStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCategoryClick = (catId) => {
    setCurrentCategory(catId);
    onClose();
    const elem = document.getElementById('products');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#products');
    }
  };

  return (
    <div className="header-tabs-dropdown active" id="headerTabsDropdown">
      <div className="site-container">
        <div className="dropdown-tabs-nav">
          <button 
            className={`tab-nav-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
          <button 
            className={`tab-nav-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            Menu
          </button>
        </div>

        {/* Tab 1: Categories Content */}
        {activeTab === 'categories' && (
          <div className="tab-pane-content active" id="tabPaneCategories">
            <div className="header-cats-grid" id="headerCatsGrid">
              {categories.map((cat) => (
                <div 
                  key={cat.id} 
                  className="header-cat-item"
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  <img src={cat.icon} alt={cat.name} loading="lazy" />
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-count">({cat.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Menu Content (Pure Clean Text without Icons) */}
        {activeTab === 'menu' && (
          <div className="tab-pane-content active" id="tabPaneMenu">
            <div className="header-menu-links">
              <Link to="/" className="menu-item-link" onClick={onClose}>
                <span>Home</span>
              </Link>
              <a 
                href="#flashSale" 
                className="menu-item-link" 
                onClick={(e) => {
                  onClose();
                  const el = document.getElementById('flashSale');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Deals &amp; Discounts</span>
              </a>
              <Link to="/track" className="menu-item-link" onClick={onClose}>
                <span>Track Order</span>
              </Link>
              <Link to="/cart" className="menu-item-link" onClick={onClose}>
                <span>Shopping Cart</span>
              </Link>
              <a 
                href="https://wa.me/923162323616?text=Salam!%20I%20want%20to%20Buy%20in%20Wholesale" 
                target="_blank" 
                rel="noreferrer"
                className="menu-item-link wholesale-highlight"
                onClick={onClose}
              >
                <span>Buy in Wholesale</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
