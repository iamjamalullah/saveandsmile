import { SHOP_UNDER } from '../data'

export default function ShopUnder({ onShopPrice }) {
  return (
    <section className="qg-under-section">
      <div className="qg-container">
        <div className="qg-under">
          {SHOP_UNDER.map(b => (
            <button key={b.max} className="qg-under-badge" onClick={() => onShopPrice(b.max)} aria-label={`Shop under ${b.max}`}>
              <img src={b.image} alt={`Shop Under ${b.max}`} loading="lazy" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
