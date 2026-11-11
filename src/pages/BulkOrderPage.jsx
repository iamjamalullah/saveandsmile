import { useState } from 'react'
import { Link } from 'react-router'
import { useStoreData } from '../context/StoreDataContext'
import { useCart } from '../context/CartContext'

const CDN = 'https://www.qadrigadgets.pk'

export default function BulkOrderPage() {
  const { submitContact } = useStoreData()
  const { notify } = useCart()
  const [form, setForm] = useState({
    first: '',
    last: '',
    email: '',
    mobile: '',
    company: '',
    address: '',
    product: '',
    qty: '25',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.first.trim() || !form.mobile.trim()) {
      notify('Please provide your name and mobile number.', 'warning')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await submitContact({
        type: 'bulk-order',
        name: `${form.first} ${form.last}`.trim(),
        first: form.first.trim(),
        last: form.last.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        company: form.company.trim(),
        address: form.address.trim(),
        product: form.product.trim(),
        qty: Number(form.qty) || 25,
        notes: form.notes.trim(),
      })
      setSent(true)
      notify('Wholesale bulk request submitted successfully!')
    } catch (err) {
      setError(err.message || 'Could not submit bulk request.')
      notify('Submission error', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="qpage">
      <div className="qg-container">
        <nav className="qcat-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span>/</span><span>Bulk Order</span>
        </nav>

        <div className="qbulk">
          <div className="qbulk-poster">
            <img src={`${CDN}/images/bulk-order-banner.webp`} alt="Wholesale bulk ordering discounts at Save &amp; Smile" />
          </div>
          <form className="qbulk-form" onSubmit={handleSubmit} aria-label="Wholesale Bulk Order Request">
            {error && <div style={{ color: '#dc2626', background: '#fee2e2', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', gridColumn: '1 / -1' }}>{error}</div>}

            <label htmlFor="bulk-first" className="visually-hidden">First Name</label>
            <input id="bulk-first" required value={form.first} onChange={set('first')} placeholder="First Name *" aria-label="First Name" />

            <label htmlFor="bulk-last" className="visually-hidden">Last Name</label>
            <input id="bulk-last" required value={form.last} onChange={set('last')} placeholder="Last Name *" aria-label="Last Name" />

            <label htmlFor="bulk-email" className="visually-hidden">Email Address</label>
            <input id="bulk-email" type="email" value={form.email} onChange={set('email')} placeholder="Email Address" aria-label="Email Address" />

            <label htmlFor="bulk-mobile" className="visually-hidden">Mobile Number</label>
            <input id="bulk-mobile" required value={form.mobile} onChange={set('mobile')} placeholder="Mobile Number *" aria-label="Mobile Number" />

            <label htmlFor="bulk-company" className="visually-hidden">Company / Shop Name</label>
            <input id="bulk-company" value={form.company} onChange={set('company')} placeholder="Company / Shop Name" aria-label="Company or Shop Name" />

            <label htmlFor="bulk-qty" className="visually-hidden">Quantity (Min 25)</label>
            <input id="bulk-qty" type="number" min="25" required value={form.qty} onChange={set('qty')} placeholder="Quantity (Min 25) *" aria-label="Quantity" />

            <label htmlFor="bulk-product" className="visually-hidden">Product Name or Category</label>
            <input id="bulk-product" value={form.product} onChange={set('product')} placeholder="Product Name or Category" aria-label="Product Name" style={{ gridColumn: '1 / -1' }} />

            <label htmlFor="bulk-address" className="visually-hidden">Delivery Address &amp; City</label>
            <textarea id="bulk-address" rows="2" value={form.address} onChange={set('address')} placeholder="Delivery Address &amp; City" aria-label="Address" style={{ gridColumn: '1 / -1' }} />

            <label htmlFor="bulk-notes" className="visually-hidden">Specific Requirements</label>
            <textarea id="bulk-notes" rows="2" value={form.notes} onChange={set('notes')} placeholder="Specific Requirements / Target Price" aria-label="Notes" style={{ gridColumn: '1 / -1' }} />

            <button type="submit" className="qg-btn qg-btn-primary" disabled={submitting} style={{ gridColumn: '1 / -1' }}>
              {submitting ? 'Submitting Wholesale Request...' : 'Submit Wholesale Inquiry'}
            </button>
            {sent && <p className="qbulk-sent" style={{ gridColumn: '1 / -1' }}>✓ Thank you! Our wholesale sales manager will contact you within 2-4 hours with a custom quotation.</p>}
          </form>
        </div>
      </div>
    </main>
  )
}
