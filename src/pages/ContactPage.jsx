import { useState } from 'react'
import { Link } from 'react-router'
import { BRAND } from '../data'
import { CONTACT_INFO, CONTACT_REASONS } from '../content'
import { useStoreData } from '../context/StoreDataContext'
import { useCart } from '../context/CartContext'

export default function ContactPage() {
  const { submitContact } = useStoreData()
  const { notify } = useCart()
  const [form, setForm] = useState({ name: '', email: '', mobile: '', reason: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim() || !form.mobile.trim() || !form.reason || !form.message.trim()) {
      notify('Please fill in all required fields.', 'warning')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await submitContact({
        type: 'contact',
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        reason: form.reason,
        message: form.message.trim(),
      })
      setSent(true)
      setForm({ name: '', email: '', mobile: '', reason: '', message: '' })
      notify('Message sent! Our support team will respond within 24 hours.')
    } catch (err) {
      setError(err.message || 'Could not send message. Please try again.')
      notify('Failed to send message', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="qpage qcontact">
      <div className="qg-container">
        <nav className="qcat-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span>/</span><span>Contact Us</span>
        </nav>

        <div className="qcontact-card">
          <span className="qcontact-eyebrow">WE'RE HERE TO HELP</span>
          <h1>Contact Us</h1>
          <p className="qcontact-sub">
            Have a question about an order, wholesale, or our products? Send us a message and our team will get
            back to you shortly.
          </p>
          <div className="qcontact-rule" />

          <div className="qcontact-grid">
            <form className="qcontact-form" onSubmit={handleSubmit}>
              <h2>Send us a message</h2>
              <p>Fill in the form below and we will respond within 24 hours.</p>

              {error && <div style={{ color: '#dc2626', background: '#fee2e2', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

              <div className="qcontact-row">
                <label>
                  NAME *
                  <input required value={form.name} onChange={set('name')} placeholder="Your Name" />
                </label>
                <label>
                  EMAIL
                  <input type="email" value={form.email} onChange={set('email')} placeholder="Email address" />
                </label>
              </div>
              <div className="qcontact-row">
                <label>
                  MOBILE *
                  <input required value={form.mobile} onChange={set('mobile')} placeholder="e.g. 03218273588" />
                </label>
                <label>
                  NATURE OF CONTACT *
                  <select required value={form.reason} onChange={set('reason')}>
                    <option value="">--Select Reason--</option>
                    {CONTACT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
              </div>
              <label>
                MESSAGE *
                <textarea required rows="6" value={form.message} onChange={set('message')} placeholder="How can we help you? Please include order number if applicable." />
              </label>
              <p className="qcontact-hint">Do not forget to mention your Order ID, if it relates to an order.</p>

              <div className="qcontact-actions">
                <span className="qcontact-captcha" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <i style={{ color: '#037f62', fontStyle: 'normal' }}>✓</i> Protected by Anti-Spam
                </span>
                <button type="submit" className="qg-btn qg-btn-primary" disabled={submitting}>
                  {submitting ? 'Sending Message...' : 'Submit Inquiry'}
                </button>
              </div>
              {sent && <p className="qcontact-sent">✓ Thanks! Your message has been sent — our customer support team will reply within 24 hours.</p>}
            </form>

            <div className="qcontact-side">
              <div className="qcontact-map">
                <iframe
                  title="Save &amp; Smile location"
                  src={CONTACT_INFO.map}
                  loading="lazy"
                />
              </div>
              <div className="qcontact-details">
                <h3>Store Location</h3>
                <p><b>Address:</b> {CONTACT_INFO.address}</p>
                <p><b>Business Hours:</b> {CONTACT_INFO.hours}</p>
                <p><b>Phone:</b> <a href={`tel:${BRAND.tel}`}>{BRAND.phone}</a> / <a href={`tel:${BRAND.tel2}`}>{BRAND.phone2}</a></p>
                <p><b>WhatsApp:</b> <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a></p>
                <p><b>Email:</b> <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
