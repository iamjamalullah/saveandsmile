import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router'
import { BRAND, CITIES } from '../data'

export function LoginPage() {
  const { onLogin } = useOutletContext()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = e => {
    e.preventDefault()
    if (!email.trim() || password.length < 4) { setError('Enter a valid email and password.'); return }
    const name = email.split('@')[0].replace(/[._-]+/g, ' ')
    onLogin?.({ name, email })
    navigate('/account')
  }

  return (
    <main className="qauth">
      <div className="qauth-card">
        <h1>Login</h1>
        <form onSubmit={submit}>
          <label>Email *</label>
          <div className="qauth-input">
            <span>✉</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          </div>
          <label>Password *</label>
          <div className="qauth-input">
            <span>🔒</span>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          </div>
          <div className="qauth-meta">
            <small>you have an account? <a href="#forgot" onClick={e => e.preventDefault()}>forgot password</a></small>
            <button type="submit">Login</button>
          </div>
          {error && <p className="qauth-error">{error}</p>}
          <button type="button" className="qauth-google" onClick={() => { onLogin?.({ name: 'Google User', email: 'google@user.com' }); navigate('/account') }}>
            <i>G</i> Login With Google
          </button>
          <p className="qauth-alt">Don't Have an Account? <Link to="/signup">Signup</Link></p>
        </form>
      </div>
    </main>
  )
}

export function SignupPage() {
  const { onLogin } = useOutletContext()
  const navigate = useNavigate()
  const [f, setF] = useState({ name: '', email: '', mobile: '', city: '', password: '' })
  const set = k => e => setF({ ...f, [k]: e.target.value })

  const submit = e => {
    e.preventDefault()
    onLogin?.({ name: f.name, email: f.email, mobile: f.mobile, city: f.city })
    navigate('/account')
  }

  return (
    <main className="qauth qauth-wide">
      <div className="qauth-card">
        <h1>Signup</h1>
        <div className="qauth-benefits">
          <b>Signup Benefits</b>
          <ul>
            <li>✓ Faster checkout with saved addresses</li>
            <li>✓ Track all your orders in one place</li>
            <li>✓ Save products to your wishlist</li>
            <li>✓ Early access to wholesale deals</li>
          </ul>
        </div>
        <form onSubmit={submit}>
          <label>Full Name *</label>
          <input required value={f.name} onChange={set('name')} placeholder="Full Name" />
          <label>E-mail Address *</label>
          <input type="email" required value={f.email} onChange={set('email')} placeholder="E-mail Address" />
          <label>Mobile *</label>
          <input required value={f.mobile} onChange={set('mobile')} placeholder="Mobile" />
          <label>City *</label>
          <select required value={f.city} onChange={set('city')}>
            <option value="">Select City</option>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <label>Password *</label>
          <input type="password" required minLength="4" value={f.password} onChange={set('password')} placeholder="Password" />
          <button type="submit" className="qauth-submit">Signup</button>
          <p className="qauth-alt">Already registered? <Link to="/login">Login</Link></p>
        </form>
      </div>
    </main>
  )
}
