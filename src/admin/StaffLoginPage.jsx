import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { BRAND } from '../data'
import { api } from '../api'

export default function StaffLoginPage({ targetRole = 'staff' }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const isManagerPage = targetRole === 'manager'
  const title = isManagerPage ? 'Operations Manager Console' : 'Store Administrator Console'

  const [email, setEmail] = useState(() => isManagerPage ? 'manager' : 'admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Force password change state
  const [mustChange, setMustChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changeSuccess, setChangeSuccess] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      if (isManagerPage && user.role !== 'manager' && user.role !== 'admin') {
        setError('Your staff account does not have manager privileges.')
        return
      }
      if (!isManagerPage && user.role !== 'admin') {
        setError('Your staff account does not have administrator privileges.')
        return
      }
      if (user.mustChangePassword) {
        setMustChange(true)
        return
      }
      navigate(isManagerPage ? '/manager' : '/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your staff credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async e => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.auth.changePassword(password, newPassword)
      setChangeSuccess(res.message || 'Password updated! Please log in with your new password.')
      setMustChange(false)
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="staff-login-wrap" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f3c28 0%, #037f62 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '36px 32px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src={BRAND.logo} alt={BRAND.name} style={{ height: '44px', marginBottom: '14px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{title}</h2>
          <p style={{ fontSize: '13px', color: '#596573', margin: 0 }}>
            {mustChange ? 'Security Policy: Update your temporary password' : 'Secure Staff Gateway · 256-Bit Encrypted'}
          </p>
        </div>

        {error && (
          <div role="alert" style={{
            background: '#fee2e2',
            border: '1px solid #f87171',
            color: '#b91c1c',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            {error}
          </div>
        )}

        {changeSuccess && (
          <div role="status" style={{
            background: '#dcfce7',
            border: '1px solid #86efac',
            color: '#15803d',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            ✓ {changeSuccess}
          </div>
        )}

        {mustChange ? (
          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="new-pw" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                New Secure Password *
              </label>
              <input
                id="new-pw"
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, uppercase, lowercase, number, symbol"
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="confirm-pw" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Confirm New Password *
              </label>
              <input
                id="confirm-pw"
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: '#037f62',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '12px'
              }}
            >
              {loading ? 'Securing Account...' : 'Set Secure Password'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="staff-email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Staff Username or Email Address
              </label>
              <input
                id="staff-email"
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Username (e.g. admin or manager)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="staff-password" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Security Password
              </label>
              <input
                id="staff-password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isManagerPage ? 'manager123' : 'admin123'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#94a3b8' : '#037f62',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                marginBottom: '14px'
              }}
            >
              {loading ? 'Authenticating...' : (isManagerPage ? 'Sign In to Manager Console' : 'Sign In to Admin Console')}
            </button>

            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px',
              color: '#166534',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <span>🔑 <b>Staff Access:</b> User: <code>{isManagerPage ? 'manager' : 'admin'}</code> &nbsp;|&nbsp; Password: <code>{isManagerPage ? 'manager123' : 'admin123'}</code></span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link to="/" style={{ fontSize: '13px', color: '#037f62', textDecoration: 'none', fontWeight: 500 }}>
                ← Return to Storefront
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
