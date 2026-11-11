import { useAuth } from '../context/AuthContext'
import StaffLoginPage from './StaffLoginPage'

export default function ProtectedRoute({ allowedRoles = ['admin'], children }) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Verifying staff credentials...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const targetRole = allowedRoles.includes('admin') ? 'admin' : 'manager'
    return <StaffLoginPage targetRole={targetRole} />
  }

  if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', background: '#f8fafc' }}>
        <h2 style={{ color: '#991b1b', marginBottom: '8px' }}>Access Restricted (403)</h2>
        <p style={{ color: '#475569', maxWidth: '440px', marginBottom: '20px' }}>
          Your current session role is <b>{user?.role}</b>. This console requires <b>{allowedRoles.join(' or ')}</b> privileges.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a
            href={user?.role === 'manager' ? '/manager' : '/admin'}
            style={{ background: '#037f62', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}
          >
            Go to My Console
          </a>
          <a
            href="/"
            style={{ border: '1px solid #cbd5e1', color: '#334155', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}
          >
            Storefront
          </a>
        </div>
      </div>
    )
  }

  return children
}
