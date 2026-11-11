export default function ProductImage({ product, className = '' }) {
  if (product.image) {
    return <img className={`pimg ${className}`} src={product.image} alt={product.name} loading="lazy" />
  }
  const h = product.hue ?? 200
  const initials = product.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div
      className={`pimg placeholder ${className}`}
      role="img"
      aria-label={product.name}
      style={{ background: `linear-gradient(135deg, hsl(${h} 70% 92%), hsl(${(h + 30) % 360} 65% 80%))`, color: `hsl(${h} 45% 32%)` }}
    >
      <span>{initials}</span>
    </div>
  )
}
