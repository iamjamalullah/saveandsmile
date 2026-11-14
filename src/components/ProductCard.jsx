import { Link, useNavigate } from 'react-router'
import { BRAND, UI } from '../data'
import { productPath } from '../content'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product, context = 'default', className = '' }) {
  const { add, buyNow, toggleWish, wishlist, setQuickView } = useCart()
  const navigate = useNavigate()
  const liked = wishlist.includes(product.id)
  const off = product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0

  const whatsappMessage = encodeURIComponent(
    `Hi Save & Smile, I want to order this product:\n*${product.name}*\nPrice: Rs. ${product.price.toLocaleString()}\nLink: https://saveandsmile.vercel.app${productPath(product)}`
  )

  const wholesaleMessage = encodeURIComponent(
    `Hi Save & Smile, I want to inquire about wholesale bulk pricing for:\n*${product.name}*\nSKU: ${product.sku || product.id}\nLink: https://saveandsmile.vercel.app${productPath(product)}`
  )

  const isHot = product.featured || product.group === 'hot' || (product.reviewsCount || 0) > 3

  return (
    <article className={`qg-card ${context && context !== 'default' ? `qg-card--${context}` : ''} ${className}`.trim()}>
      <div className="qg-card-media">
        <Link className="qg-card-open" to={productPath(product)} aria-label={product.name}>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="qg-card-img"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = '/images/p1.jpg'
            }}
          />
        </Link>
        <span className={`qg-card-tag ${isHot ? 'is-hot' : 'is-trending'}`}>
          {isHot ? '🔥 HOT DEAL' : '💥 TRENDING'}
        </span>

        {/* Top-Right Heart and Eye Icons Together */}
        <div className="qg-card-top-icons">
          <button
            type="button"
            className={`qg-card-wish-btn ${liked ? 'liked' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleWish(product.id)
            }}
            aria-label="Add to wishlist"
            title={liked ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={liked}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill={liked ? '#e11d48' : 'none'} stroke={liked ? '#e11d48' : '#475569'} strokeWidth="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
          <button
            type="button"
            className="qg-card-quick-btn"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setQuickView(product)
            }}
            aria-label="Quick view"
            title="Quick view"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="qg-card-body">
        <Link className="qg-card-title" to={productPath(product)}>{product.name}</Link>
        <div className="qg-card-price-row">
          {off > 0 && <span className="qg-card-oldprice">Rs. {product.oldPrice.toLocaleString()}</span>}
          <span className="qg-card-curprice">RS. <b>{product.price.toLocaleString()}</b></span>
        </div>

        {/* Actions: Add to Cart (Trolley) + Buy Now + Direct WhatsApp */}
        <div className="qg-card-row1">
          <button
            type="button"
            className="qg-card-btn-add"
            onClick={() => add(product)}
            title="Add to cart"
            aria-label="Add to cart"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </button>

          <button
            type="button"
            className="qg-card-btn-buy"
            onClick={() => {
              buyNow(product, 1)
              navigate('/checkout')
            }}
          >
            Buy Now
          </button>

          <a
            className="qg-card-btn-wa"
            href={`https://wa.me/${BRAND.whatsapp}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            title="Order on WhatsApp"
            aria-label="Order on WhatsApp"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.16c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.164 8.164 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.01 4.54-3.68 8.23-8.22 8.23zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.66.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.02 2.6.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.61.19 1.16.16 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29z" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  )
}
