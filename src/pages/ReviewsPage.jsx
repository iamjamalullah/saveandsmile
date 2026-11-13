import { useState } from 'react'
import { Link } from 'react-router'
import { useCart } from '../context/CartContext'
import { useStoreData } from '../context/StoreDataContext'

const EXTRA = [
  { id: 101, name: 'Shoaib Aziz', date: '31 Oct 2026', rating: 5, title: 'Review', text: 'This time item is good' },
  { id: 102, name: 'Sobia Fahad', date: '30 Oct 2026', rating: 5, title: 'Best and recommend', text: 'Best quality. Good service.' },
  { id: 103, name: 'Zain Noushad', date: '29 Oct 2026', rating: 5, title: 'Everything is best', text: 'Sab kuch buhat acha ha, order b time par received hua, munasib price and good quality.' },
  { id: 104, name: 'Hina Sheikh', date: '28 Oct 2026', rating: 5, title: 'Bht acha experience hai mera', text: 'Main 3 saal se order kar Rahi Hun or hamesha Mera experience acha hota hai.' },
  { id: 105, name: 'Kashan', date: '28 Oct 2026', rating: 5, title: 'Best and recommended', text: 'Best gadgets quality same as picture proper pack 💯 recommended.' },
  { id: 106, name: 'Urooj Abbasi', date: '26 Oct 2026', rating: 4, title: 'Great service by Save & Smile', text: 'Salam, main kaafi saal se Save & Smile se order kar rahi hoon, Alhamdulillah saman acha aata hai.' },
]

const Star = ({ fill = true }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z"
      fill={fill ? '#f5b710' : 'none'} stroke="#f5b710" strokeWidth="1.4" />
  </svg>
)

export default function ReviewsPage() {
  const { notify } = useCart()
  const { reviews = [], addReview } = useStoreData()
  const [rating, setRating] = useState(5)
  const [form, setForm] = useState({ title: '', content: '', name: '', whatsapp: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const approved = reviews.filter(r => r.status !== 'hidden' && r.status !== 'pending')
  const all = [...approved, ...EXTRA]

  const handleSubmit = async e => {
    e.preventDefault()
    if (!rating) {
      notify('Please select a star rating between 1 and 5', 'warning')
      return
    }
    if (!form.name.trim() || !form.title.trim() || !form.content.trim()) {
      notify('Please complete all required fields', 'warning')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const created = await addReview({
        title: form.title.trim(),
        text: form.content.trim(),
        name: form.name.trim(),
        whatsapp: form.whatsapp.trim(),
        rating,
      })
      if (created) {
        setSent(true)
        setForm({ title: '', content: '', name: '', whatsapp: '' })
        notify('✓ Review submitted successfully! Awaiting staff moderation.')
      } else {
        throw new Error('Failed to save review. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review.')
      notify(err.message || 'Submission error', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="qpage qreviews">
      <div className="qg-container">
        <nav className="qcat-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span>/</span><span>Reviews</span>
        </nav>

        <form className="qrev-form" onSubmit={handleSubmit}>
          <h1>Write a review</h1>
          <p className="qrev-rating-label">RATING *</p>
          <div className="qrev-stars-pick">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <svg viewBox="0 0 24 24" width="30" height="30">
                  <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z"
                    fill={n <= rating ? '#f5b710' : '#e2e8f0'} stroke="#f5b710" strokeWidth="1.3" />
                </svg>
              </button>
            ))}
          </div>

          <label>
            REVIEW TITLE *
            <input required value={form.title} onChange={set('title')} placeholder="Give your review a title" />
          </label>
          <label>
            REVIEW CONTENT *
            <textarea required rows="5" value={form.content} onChange={set('content')} placeholder="Start writing here…" />
          </label>
          <div className="qrev-row">
            <label>
              DISPLAY NAME *
              <input required value={form.name} onChange={set('name')} placeholder="e.g. Ahmed Raza" />
            </label>
            <label>
              WHATSAPP NUMBER
              <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="e.g. 03218273588" />
            </label>
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: '8px 0' }}>{error}</p>}

          <div className="qrev-submit">
            <button className="qg-btn qg-btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting Review...' : 'Submit Review'}
            </button>
          </div>
          {sent && <p className="qrev-sent">✓ Thank you! Your review has been submitted for moderation and will appear once approved.</p>}
        </form>

        <section className="qrev-summary">
          <div className="qrev-score">
            <b>4.9</b>
            <span>{Array.from({ length: 5 }).map((_, i) => <Star key={i} />)}</span>
            <small>{all.length} verified customer reviews</small>
          </div>
          <div className="qrev-bars">
            <h2>Customer Reviews</h2>
            <p>Based on verified wholesale &amp; retail customer feedback</p>
            {[['5 star', 413], ['4 star', 44], ['3 star', 1], ['2 star', 0], ['1 star', 0]].map(([label, n]) => (
              <div className="qrev-bar" key={label}>
                <span>{label}</span>
                <i><b style={{ width: `${(n / 459) * 100}%` }} /></i>
                <em>{n}</em>
              </div>
            ))}
          </div>
        </section>

        <div className="qrev-grid">
          {all.map((r, i) => (
            <article className="qrev-card" key={r.id || i}>
              <div className="qrev-card-head">
                <span className={`qrev-avatar a${i % 5}`}>{(r.name || 'C').charAt(0).toUpperCase()}</span>
                <div>
                  <b>{r.name}</b>
                  <span className="qrev-card-stars">
                    {Array.from({ length: 5 }).map((_, k) => <Star key={k} fill={k < (r.rating || 5)} />)}
                    <em>✓ Verified</em>
                  </span>
                </div>
              </div>
              <div className="qrev-card-body">
                <b>{r.title}</b>
                <p>{r.text}</p>
                <small style={{ color: 'var(--qg-muted)', fontSize: '11px', display: 'block', marginTop: '6px' }}>{r.date}</small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
