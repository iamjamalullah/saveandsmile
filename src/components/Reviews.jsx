import { useStoreData } from '../context/StoreDataContext'

const AVATAR_COLORS = ['#0891b2', '#7c3aed', '#059669', '#db2777', '#ea580c', '#2563eb']

function Stars({ n }) {
  return (
    <span className="qg-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="14" height="14" fill={i < n ? '#f5b301' : '#e3e8ec'} aria-hidden="true">
          <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4 6.2 20.4l1.1-6.4L2.6 9.4l6.5-.9L12 2.6z" />
        </svg>
      ))}
    </span>
  )
}

export default function Reviews() {
  const { reviews = [] } = useStoreData()
  const visible = reviews.filter(r => r.status !== 'hidden')
  const list = [...visible, ...visible]
  if (!visible.length) return null

  return (
    <section className="qg-reviews" id="reviews">
      <div className="qg-reviews-head">
        <span className="qg-tag">Reviews</span>
        <h2>What Our Clients Say</h2>
        <p>Trusted by thousands of resellers and shopkeepers across Pakistan.</p>
      </div>

      <div className="qg-marquee">
        <div className="qg-marquee-track">
          {list.map((r, i) => (
            <article className="qg-review" key={`${r.id}-${i}`} aria-hidden={i >= visible.length}>
              <header>
                <span className="qg-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {r.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="qg-review-name">{r.name}</p>
                  <div className="qg-review-meta">
                    <Stars n={r.rating} />
                    <small>{r.date}</small>
                  </div>
                </div>
              </header>
              <h3>{r.title}</h3>
              <p>{r.text}</p>
              <span className="qg-review-verified">✓ Verified purchase</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
