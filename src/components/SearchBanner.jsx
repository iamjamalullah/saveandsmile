import { useState } from 'react'
import { SEARCH_BANNER } from '../data'

export default function SearchBanner({ onSearch }) {
  const [q, setQ] = useState('')
  return (
    <section className="qg-container qg-searchhero-wrap">
      <div className="qg-searchhero">
        <div className="qg-searchhero-copy">
          <h2 dir="rtl">{SEARCH_BANNER.title}</h2>
          <p>{SEARCH_BANNER.subtitle}</p>
          <div className="qg-trending-label">🔥 Trending Searches</div>
          <div className="qg-trending-pills">
            {SEARCH_BANNER.trending.map(t => (
              <button key={t.q} onClick={() => onSearch(t.q)}>{t.label}</button>
            ))}
          </div>
        </div>
        <div className="qg-searchhero-form">
          <div className="qg-searchhero-dots"><b /><b /><b /></div>
          <div className="qg-searchhero-box">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onSearch(q) }}
              placeholder="Search products, brands and more…"
              aria-label="Search products"
            />
            <button onClick={() => onSearch(q)}>Search</button>
          </div>
          <p className="qg-searchhero-hint">Popular: chopper, perfume, organizer, night lamp</p>
        </div>
      </div>
    </section>
  )
}
