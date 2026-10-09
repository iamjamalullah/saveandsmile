import React from 'react';
import { useStore } from '../context/StoreContext';

export default function FrontCategoryTabs() {
  const { frontTabs, currentFrontTab, setCurrentFrontTab } = useStore();

  return (
    <section className="front-cat-tabs-section" id="HomePageTabs">
      <div className="site-container">
        <div className="front-cat-nav-list" id="frontTabsNav">
          {frontTabs.map(tab => (
            <button
              key={tab.id}
              className={`front-tab-button ${tab.key === currentFrontTab ? 'active' : ''}`}
              onClick={() => setCurrentFrontTab(tab.key)}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
