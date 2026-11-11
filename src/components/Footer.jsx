import { useState } from 'react'
import { Link } from 'react-router'
import { BRAND, FOOTER, UI } from '../data'

const QUICK = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about-us' },
  { label: 'Account', to: '/account' },
  { label: 'Contact Us', to: '/contact' },
]

const STORES = [
  { label: 'Terms & Conditions', to: '/terms-conditions' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Support', to: '/support' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  return (
    <footer className="qg-footer-wrap">
      <section className="qg-footer" id="contact" aria-label="Store Information and Links">
        <div className="qg-container">
          <div className="qg-foot-grid">
            <div className="qg-foot-brand">
              <Link to="/"><img src={BRAND.logoFooter} alt={BRAND.name} className="qg-foot-logo" style={{ maxHeight: '38px', width: 'auto', objectFit: 'contain' }} /></Link>
              <p>{FOOTER.description}</p>
              <div className="qg-foot-contact">
                <a href={`tel:${BRAND.tel}`}>📞 {BRAND.phone}</a>
                <a href={`tel:${BRAND.tel2}`}>📞 {BRAND.phone2}</a>
                <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer">💬 WhatsApp us</a>
              </div>
            </div>

            <div className="qg-foot-col">
              <h4>Quick Links</h4>
              <ul>
                {QUICK.map(l => <li key={l.label}><Link to={l.to}>{l.label}</Link></li>)}
              </ul>
            </div>

            <div className="qg-foot-col">
              <h4>Our Stores</h4>
              <ul>
                {STORES.map(l => <li key={l.label}><Link to={l.to}>{l.label}</Link></li>)}
              </ul>
            </div>

            <div className="qg-foot-news">
              <h4>Sign Up To Newsletters</h4>
              <form onSubmit={e => { e.preventDefault(); setDone(true); setEmail('') }} className="qg-news">
                <label htmlFor="newsletter-email" className="visually-hidden">Email Address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter Your Email"
                  aria-label="Email address for newsletter"
                />
                <button type="submit">Subscribe</button>
              </form>
              {done && <p className="qg-news-ok">✓ Thanks for subscribing!</p>}
              <div className="qg-follow">
                <span>Follow Us:</span>
                <ul>
                  {FOOTER.social.map(s => (
                    <li key={s.label}>
                      <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
                        <img src={s.icon} alt={s.label} width="24" height="24" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="qg-foot-bottom" aria-label="Copyright and Administration">
        <div className="qg-container qg-foot-bottom-row">
          <p>© {new Date().getFullYear()} {BRAND.name}. All Rights Reserved.</p>
          <div className="qg-payments-badges" aria-label="Payment methods accepted: Visa, Mastercard, COD, Safe Pay">
            <span className="qg-pay-badge" title="Visa">
              <svg viewBox="0 0 38 24" width="38" height="24">
                <rect width="38" height="24" rx="4" fill="#0A2540" />
                <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800" fontStyle="italic" fontFamily="sans-serif">VISA</text>
              </svg>
            </span>
            <span className="qg-pay-badge" title="Mastercard">
              <svg viewBox="0 0 38 24" width="38" height="24">
                <rect width="38" height="24" rx="4" fill="#1E293B" />
                <circle cx="15" cy="12" r="7" fill="#EB001B" />
                <circle cx="23" cy="12" r="7" fill="#F79E1B" fillOpacity="0.88" />
              </svg>
            </span>
            <span className="qg-pay-badge" title="Cash on Delivery (COD)">
              <svg viewBox="0 0 44 24" width="44" height="24">
                <rect width="44" height="24" rx="4" fill="#007385" />
                <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700" fontFamily="sans-serif">COD 💵</text>
              </svg>
            </span>
            <span className="qg-pay-badge" title="100% Safe & Secure Checkout">
              <svg viewBox="0 0 46 24" width="46" height="24">
                <rect width="46" height="24" rx="4" fill="#047857" />
                <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="700" fontFamily="sans-serif">SAFE 🔒</text>
              </svg>
            </span>
          </div>
        </div>
      </section>
    </footer>
  )
}
