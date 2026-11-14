import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled runtime error captured by ErrorBoundary:', error, errorInfo)
    this.setState({ errorInfo })

    // Auto-reload to fetch latest deployment bundle if user had an older tab open with stale chunk hashes
    const errMsg = error?.message || String(error)
    if (errMsg.includes('Failed to fetch dynamically imported module') || error?.name === 'ChunkLoadError') {
      const lastReload = sessionStorage.getItem('chunk_reload_timestamp')
      const now = Date.now()
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem('chunk_reload_timestamp', String(now))
        window.location.reload()
      }
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
          textAlign: 'center',
          background: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '520px',
            background: '#ffffff',
            padding: '36px 28px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '44px', marginBottom: '14px' }}>🛡️</div>
            <h2 style={{ color: '#0f3c28', fontSize: '22px', fontWeight: 700, margin: '0 0 10px' }}>
              Unexpected View Error
            </h2>
            <p style={{ color: '#596573', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
              We encountered an unexpected rendering issue. Your cart and stored data are safe.
            </p>
            {this.state.error && (
              <div style={{ textAlign: 'left', background: '#fee2e2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', color: '#991b1b', fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto' }}>
                <b>Error:</b> {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: '#037f62',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                Reload View
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: '#f4fbf8',
                  color: '#037f62',
                  border: '1px solid #037f62',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                Return to Storefront
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
