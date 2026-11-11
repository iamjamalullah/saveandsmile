import { useState } from 'react'
import { BRAND } from '../data'

export default function FloatingContact() {
  const [open, setOpen] = useState(false)
  return (
    <div className={`qg-float ${open ? 'open' : ''}`}>
      <div className="qg-float-list">
        <a href={`mailto:${BRAND.email}`} className="qg-float-item email" aria-label="Email us">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
          <span>Email</span>
        </a>
        <a href={`tel:${BRAND.tel}`} className="qg-float-item call" aria-label="Call us">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5c0 8 7 15 15 15l1-4-5-1-2 2c-2-1-4-3-5-5l2-2-1-5-5 0z" /></svg>
          <span>Call</span>
        </a>
      </div>
      <button className="qg-float-wa" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Chat on WhatsApp">
        {open ? '✕' : (
          <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true">
            <path d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.8 6.4L3 29l6.8-1.8c1.9 1.1 4 1.7 6.2 1.7 7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.6c-2 0-3.9-.5-5.6-1.5l-.4-.2-4 1 1.1-3.9-.3-.4A10.5 10.5 0 015.5 16C5.5 10.2 10.2 5.5 16 5.5S26.5 10.2 26.5 16 21.8 26.6 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.8.2-.9 1-1.1 1.2-.4.3-.7.1a8.6 8.6 0 01-2.5-1.6 9.6 9.6 0 01-1.8-2.2c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.3 1.4 3.5c.2.2 2.4 3.6 5.8 5 .8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7 0-.1-.2-.2-.4-.3z" />
          </svg>
        )}
      </button>
    </div>
  )
}
