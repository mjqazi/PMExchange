'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface UserData {
  companyName: string
  initials: string
  buyerType: string
  country: string
  verified: boolean
  creditLimit: string
}

interface Notification {
  title: string
  body: string
  time: string
  unread: boolean
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { title: 'New match found', body: 'RFQ-2026-087 has a new eligible seller', time: '2 min ago', unread: true },
  { title: 'Counter-offer received', body: 'Karachi PharmaCorp revised offer to $0.0057/cap', time: '1 hour ago', unread: true },
  { title: 'Escrow funded', body: 'ORD-2026-0041 escrow $148,000 confirmed', time: '3 hours ago', unread: false },
  { title: 'Batch linked', body: 'Batch LHR-2026-0031 linked to ORD-2026-0041', time: '1 day ago', unread: false },
  { title: 'RFQ published', body: 'RFQ-2026-087 matching engine processing', time: '2 days ago', unread: false },
]

const navItems: { label: string; href: string; icon: string; badge?: string }[] = [
  { label: 'Dashboard', href: '/buyer/dashboard', icon: '\u25A0' },
  { label: 'Post New RFQ', href: '/buyer/rfqs/new', icon: '\u25A0' },
  { label: 'RFQs & Matches', href: '/buyer/rfqs/RFQ-2026-087', icon: '\u25A0' },
  { label: 'Negotiate', href: '/buyer/negotiate/ORD-2026-0040', icon: '\u25A0', badge: '2' },
  { label: 'My Orders', href: '/buyer/orders', icon: '\u25A0' },
]

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<UserData>({
    companyName: 'Gulf Medical LLC',
    initials: 'GM',
    buyerType: 'Institutional Buyer',
    country: 'Saudi Arabia',
    verified: true,
    creditLimit: 'USD 2,000,000',
  })
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(5)
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS)

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const items = Array.isArray(d.data) ? d.data : d.data.items || [];
          if (items.length > 0) {
            setNotifications(items.map((n: Record<string, unknown>) => ({
              title: String(n.title || ''),
              body: String(n.body || n.message || ''),
              time: String(n.time || n.created_at || ''),
              unread: (n.unread as boolean) ?? !(n.read as boolean),
            })));
          }
          const count = d.data.unread_count ?? d.unread_count ?? items.filter((n: Record<string, unknown>) => (n.unread as boolean) ?? !(n.read as boolean)).length;
          if (typeof count === 'number') setNotifCount(count);
        }
      })
      .catch(() => { /* use demo defaults */ });
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const u = d.data
          setUser({
            companyName: u.companyName || u.company_name || 'Gulf Medical LLC',
            initials: u.initials || (u.companyName || 'GM').slice(0, 2).toUpperCase(),
            buyerType: u.buyerType || u.role || 'Institutional Buyer',
            country: u.country || 'Saudi Arabia',
            verified: u.verified ?? true,
            creditLimit: u.creditLimit || u.credit_limit || 'USD 2,000,000',
          })
        }
      })
      .catch(() => {})
  }, [])

  const isActiveNav = (href: string) => {
    if (href === '/buyer/dashboard') return pathname === '/buyer/dashboard' || pathname === '/buyer'
    if (href.startsWith('/buyer/rfqs/new')) return pathname === '/buyer/rfqs/new'
    if (href.startsWith('/buyer/rfqs/')) return pathname.startsWith('/buyer/rfqs/') && pathname !== '/buyer/rfqs/new'
    if (href.startsWith('/buyer/negotiate/')) return pathname.startsWith('/buyer/negotiate/')
    if (href === '/buyer/orders') return pathname === '/buyer/orders'
    return false
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--pmx-bg)',
          borderBottom: '0.5px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '6px 16px',
            borderRight: '0.5px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img src="/logo.png" alt="PMX Pharma Exchange" style={{ height: 32 }} />
        </div>
        <div style={{ display: 'flex' }}>
          <span
            style={{
              padding: '14px 15px',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--pmx-teal)',
              borderBottom: '2px solid var(--pmx-teal)',
              userSelect: 'none',
            }}
          >
            Buyer Portal
          </span>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
          }}
        >
          {/* Notification Bell */}
          <div
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              position: 'relative',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '0.5px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--pmx-tx2)',
              fontSize: 16,
            }}
          >
            &#128276;
            {notifCount > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 14,
                  height: 14,
                  background: 'var(--pmx-red)',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {notifCount}
              </div>
            )}
          </div>
          {/* User Pill */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'var(--pmx-bg2)',
                border: '0.5px solid var(--border)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--pmx-teal)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {user.initials}
              </div>
              <span>{user.companyName}</span>
              <span style={{ color: 'var(--pmx-tx3)', marginLeft: 2 }}>&#9660;</span>
            </div>
            {userMenuOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4,
                background: 'var(--pmx-bg)', border: '0.5px solid var(--input)',
                borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.1)', zIndex: 300,
                minWidth: 180, overflow: 'hidden',
              }}>
                <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{user.companyName}</div>
                  <div style={{ fontSize: 10, color: 'var(--pmx-tx3)' }}>{user.buyerType}</div>
                </div>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/login';
                  }}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 12, fontWeight: 500,
                    color: 'var(--pmx-red)', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--pmx-red-light)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      {notifOpen && (
        <div
          style={{
            position: 'fixed',
            top: 50,
            right: 16,
            width: 320,
            background: 'var(--pmx-bg)',
            border: '0.5px solid var(--input)',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,.12)',
            zIndex: 300,
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '0.5px solid var(--border)',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Notifications</span>
            <span
              style={{ fontSize: 11, color: 'var(--pmx-teal)', cursor: 'pointer', fontWeight: 500 }}
              onClick={() => setNotifOpen(false)}
            >
              Mark all read
            </span>
          </div>
          {notifications.map((n, i) => (
            <div
              key={i}
              style={{
                padding: '10px 14px',
                borderBottom: '0.5px solid var(--border)',
                cursor: 'pointer',
                background: n.unread ? 'var(--pmx-blue-light)' : 'transparent',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
              <div style={{ fontSize: 11, color: 'var(--pmx-tx2)' }}>{n.body}</div>
              <div style={{ fontSize: 10, color: 'var(--pmx-tx3)', marginTop: 2 }}>{n.time}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1 }}>
        {/* SIDEBAR */}
        <nav
          style={{
            width: 185,
            minWidth: 185,
            background: 'var(--pmx-bg)',
            borderRight: '0.5px solid var(--border)',
            flexShrink: 0,
            padding: '8px 0',
          }}
        >
          <div
            style={{
              padding: '10px 12px 4px',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--pmx-tx3)',
              letterSpacing: '.07em',
              textTransform: 'uppercase',
            }}
          >
            Procurement
          </div>
          {navItems.map((item) => {
            const active = isActiveNav(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  color: active ? 'var(--pmx-teal)' : 'var(--pmx-tx2)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  position: 'relative',
                  textDecoration: 'none',
                  fontWeight: active ? 500 : 400,
                  background: active ? 'var(--pmx-teal-light)' : 'transparent',
                  borderLeft: active ? '2px solid var(--pmx-teal)' : '2px solid transparent',
                }}
              >
                <span style={{ width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11 }}>
                  {item.icon}
                </span>
                {item.label}
                {item.badge && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: 'var(--pmx-red-light)',
                      color: 'var(--pmx-red)',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 10,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* MAIN */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--pmx-bg2)',
            minWidth: 0,
          }}
        >
          <div style={{ padding: 20, minHeight: 600 }} className="animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
