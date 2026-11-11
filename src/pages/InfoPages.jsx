import { Link } from 'react-router'
import { ABOUT_SECTIONS, PRIVACY_SECTIONS, SUPPORT_SECTIONS, TERMS_SECTIONS } from '../content'
import { BRAND } from '../data'

function Crumbs({ label }) {
  return (
    <nav className="qcat-crumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link><span>/</span><span>{label}</span>
    </nav>
  )
}

export function AboutPage() {
  return (
    <main className="qpage">
      <div className="qg-container">
        <Crumbs label="About Us" />
        <article className="qpage-body">
          <h1>Welcome to Save &amp; Smile!</h1>
          <p>
            At <strong>Save &amp; Smile</strong>, we are dedicated to providing you with the best online shopping experience
            for a wide range of quality products, from household essentials to electronics and lifestyle accessories.
            Our mission is to bring convenience, variety, and value to our customers, making shopping enjoyable,
            secure, and effortless.
          </p>

          {ABOUT_SECTIONS.map(s => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
              {s.bullets && (
                <ul>
                  {s.bullets.map(b => {
                    const [strong, ...rest] = b.split(':')
                    return <li key={b}><strong>{strong}:</strong>{rest.join(':')}</li>
                  })}
                </ul>
              )}
            </section>
          ))}

          <section>
            <h2>Connect With Us</h2>
            <p>
              Stay updated with our latest offers and new arrivals by following us on our social media platforms or
              signing up for our newsletter. We value your feedback, so don’t hesitate to reach out to us with any
              questions or comments.
            </p>
            <p>
              <a className="qg-btn qg-btn-primary" href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
            </p>
          </section>
        </article>
      </div>
    </main>
  )
}

export function SupportPage() {
  return (
    <main className="qpage">
      <div className="qg-container">
        <Crumbs label="Support" />
        <article className="qpage-body qpage-narrow">
          <h1>Support – Save &amp; Smile</h1>
          <h2 className="qpage-lead">Need Help? We’re Here for You!</h2>
          <p>
            At Save &amp; Smile, your satisfaction is our priority. Whether you have a question about a product, order,
            or payment, our support team is ready to assist you.
          </p>
          {SUPPORT_SECTIONS.map(s => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
              {s.bullets && <ul>{s.bullets.map(b => <li key={b}>{b}</li>)}</ul>}
              {s.after && <p className="qpage-muted">{s.after}</p>}
            </section>
          ))}
          <div className="qpage-cta">
            <a className="qg-btn qg-btn-primary" href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp Support</a>
            <a className="qg-btn qg-btn-outline" href={`mailto:${BRAND.email}`}>Email us</a>
          </div>
        </article>
      </div>
    </main>
  )
}

function LegalPage({ title, sections }) {
  return (
    <main className="qpage">
      <div className="qg-container">
        <Crumbs label={title} />
        <article className="qpage-body qpage-narrow">
          <h1>{title}</h1>
          <p className="qpage-muted">Last updated: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
          {sections.map(s => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </section>
          ))}
          <p className="qpage-muted">
            Questions? Contact us at <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a> or call {BRAND.phone2}.
          </p>
        </article>
      </div>
    </main>
  )
}

export function TermsPage() {
  return <LegalPage title="Terms & Conditions" sections={TERMS_SECTIONS} />
}

export function PrivacyPage() {
  return <LegalPage title="Privacy Policy" sections={PRIVACY_SECTIONS} />
}
