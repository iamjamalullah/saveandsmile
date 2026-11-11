import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

/**
 * Shared professional shell used by the Admin and Manager consoles.
 * nav: [{ label, items: [{ id, label, icon, badge, tone }] }]
 */
export default function PanelShell({
  role = 'admin',
  brandSub = 'Admin Console',
  roleLabel = 'Administrator',
  userName = 'Store Admin',
  userEmail = '',
  nav = [],
  active,
  onNavigate,
  onExit,
  onSwitchRole,
  switchLabel = '',
  onMyAccount,
  notifications = [],
  onReadNotifications,
  toast,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [sideOpen, setSideOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const bellRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    const onDoc = e => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => { setSideOpen(false) }, [active])

  const items = nav.flatMap(section => section.items || [])
  const current = items.find(item => item.id === active) || items[0]
  const unread = notifications.filter(n => n.unread).length
  const initials = (userName || 'QA')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()

  return (
    <div className={`pnl-shell ${collapsed ? 'is-collapsed' : ''} ${sideOpen ? 'side-open' : ''}`}>
      {sideOpen && (
        <button type="button" className="pnl-overlay" aria-label="Close menu" onClick={() => setSideOpen(false)} />
      )}

      <aside className="pnl-side">
        <div className="pnl-brand">
          <div className="pnl-brand-mark">S</div>
          <div className="pnl-brand-copy">
            <strong>Save &amp; Smile</strong>
            <span>{brandSub}</span>
          </div>
        </div>

        <button
          type="button"
          className="pnl-collapse"
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`} />
        </button>

        <nav className="pnl-nav" aria-label={`${roleLabel} navigation`}>
          {nav.map(section => (
            <div key={section.label}>
              <div className="pnl-nav-label">{section.label}</div>
              {section.items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`pnl-nav-btn ${active === item.id ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  title={item.label}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className={`pnl-nav-badge ${item.tone === 'muted' ? 'tone-muted' : ''}`}>{item.badge}</span>
                  ) : null}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="pnl-side-foot">
          <div className="pnl-side-user">
            <div className="pnl-side-avatar">{initials}</div>
            <div>
              <b>{userName}</b>
              <small>{roleLabel}</small>
            </div>
          </div>
          {onSwitchRole && switchLabel && (
            <button type="button" className="pnl-side-action" onClick={onSwitchRole}>
              <i className="bi bi-arrow-left-right" />
              <span>{switchLabel}</span>
            </button>
          )}
          <button type="button" className="pnl-side-action" onClick={onExit}>
            <i className="bi bi-shop-window" />
            <span>View live store</span>
          </button>
        </div>
      </aside>

      <div className="pnl-main">
        <header className="pnl-top">
          <button type="button" className="pnl-burger" onClick={() => setSideOpen(true)} aria-label="Open menu">
            <i className="bi bi-list" />
          </button>

          <div className="pnl-crumbs">
            <span className="pnl-crumb-console">{brandSub}</span>
            <span className="dot">/</span>
            <b>{current?.label || 'Dashboard'}</b>
          </div>

          <div className="pnl-top-right">
            <Link className="pnl-live" to="/" onClick={onExit}>
              <i className="bi bi-broadcast-pin" />
              View store
            </Link>

            <div ref={bellRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="pnl-icon-btn"
                aria-label="Notifications"
                onClick={() => { setBellOpen(v => !v); setUserOpen(false) }}
              >
                <i className="bi bi-bell" />
                {unread > 0 && <span className="pnl-dot" />}
              </button>
              {bellOpen && (
                <div className="pnl-pop pnl-pop-notif">
                  <div className="pnl-pop-head">
                    <b>Notifications {unread > 0 ? `(${unread})` : ''}</b>
                    <button type="button" onClick={onReadNotifications}>Mark all read</button>
                  </div>
                  <div className="pnl-pop-body">
                    {notifications.length === 0 ? (
                      <div className="pnl-empty" style={{ padding: '26px 12px' }}>No notifications yet</div>
                    ) : notifications.slice(0, 6).map(n => (
                      <div className={`pnl-notif ${n.unread ? 'is-unread' : ''}`} key={n.id}>
                        <i className={`bi ${n.type === 'order' ? 'bi-bag-check' : 'bi-info-circle'}`} />
                        <div>
                          <b>{n.title}</b>
                          <small>{n.time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div ref={userRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="pnl-user"
                onClick={() => { setUserOpen(v => !v); setBellOpen(false) }}
              >
                <span className="pnl-user-avatar">{initials}</span>
                <span className="pnl-user-copy">
                  <b>{userName}</b>
                  <small>{roleLabel}</small>
                </span>
                <i className="bi bi-chevron-down" />
              </button>
              {userOpen && (
                <div className="pnl-pop pnl-pop-user">
                  <div className="pnl-pop-meta">
                    <b>{userName}</b>
                    <small>{userEmail || roleLabel}</small>
                  </div>
                  <button type="button" className="pnl-pop-link" onClick={() => { setUserOpen(false); onMyAccount?.() }}>
                    <i className="bi bi-person" /> My account
                  </button>
                  {onSwitchRole && (
                    <button type="button" className="pnl-pop-link" onClick={onSwitchRole}>
                      <i className="bi bi-arrow-left-right" /> {switchLabel}
                    </button>
                  )}
                  <button type="button" className="pnl-pop-link" onClick={onExit}>
                    <i className="bi bi-shop-window" /> View live store
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="pnl-content">{children}</main>
      </div>

      {toast && (
        <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 400 }}>
          <div
            className="shadow"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              background: '#10261d',
              color: '#fff',
              borderRadius: 11,
              padding: '10px 14px',
              fontSize: 12,
            }}
            role="status"
          >
            <i className={`bi ${toast.variant === 'danger' ? 'bi-x-circle' : toast.variant === 'warning' ? 'bi-exclamation-triangle' : 'bi-check-circle'} text-warning`} />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
