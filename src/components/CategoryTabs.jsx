import { useState } from 'react'
import { Link } from 'react-router'
import { CATEGORY_TABS } from '../data'
import { productPath } from '../content'
import { useCart } from '../context/CartContext'
import { useStoreData } from '../context/StoreDataContext'

export default function CategoryTabs({ onShopAll }) {
  const { products = [] } = useStoreData()
  const [active, setActive] = useState(CATEGORY_TABS[0].key)
  const { setQuickView } = useCart()
  const tab = CATEGORY_TABS.find(t => t.key === active) || CATEGORY_TABS[0]
  const items = products.filter(p => p.group === tab.group).slice(0, 8)

  return (
    <section className="qg-tabs-section" id="front-category-style">
      <div className="qg-container">
        <div className="qg-tabs" role="tablist">
          {CATEGORY_TABS.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={active === t.key}
              className={active === t.key ? 'on' : ''}
              onClick={() => setActive(t.key)}
            >
              {t.label[0]}<br />{t.label[1]}
            </button>
          ))}
        </div>

        <div className="qg-tiles" role="tabpanel">
          {items.map(p => (
            <Link key={p.id} className="qg-tile" to={productPath(p)} style={{ textDecoration: 'none', color: 'inherit' }}>
              <img src={p.image} alt={p.name} loading="lazy" />
              <span>{p.name}</span>
              <b>Rs. {(Number(p.price) || 0).toLocaleString()}</b>
            </Link>
          ))}
        </div>

        <div className="qg-tabs-foot">
          <button className="qg-pill-outline" onClick={onShopAll}>See More Products →</button>
        </div>
      </div>
    </section>
  )
}
