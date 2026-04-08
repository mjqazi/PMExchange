'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface UserData {
  full_name: string;
  role: string;
  manufacturer_name: string;
  initials: string;
}

interface Notification {
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { title: 'Major deviation filed', body: 'Batch LHR-2026-0028 - Dissolution failure', time: '2h ago', unread: true },
  { title: 'New RFQ match found', body: 'Metformin 500mg - Gulf Medical LLC', time: '4h ago', unread: true },
  { title: 'Escrow funded', body: 'ORD-2026-0041 - USD 148,000 confirmed', time: '6h ago', unread: false },
  { title: 'Gate 2 review pending', body: 'Faisalabad Meds Co. documents ready', time: '1d ago', unread: false },
  { title: 'CQS score updated', body: 'Your CQS is now 83.4 (+1.2 pts)', time: '1d ago', unread: false },
];

const navItems = [
  { section: 'Compliance ERP' },
  { label: 'Dashboard', href: '/seller/dashboard', icon: '\u25A0' },
  { label: 'Onboarding', href: '/seller/onboarding', icon: '\u25A1', badge: 'G2' },
  { label: 'Products', href: '/seller/products', icon: '\u25A0' },
  { label: 'Batches (eBMR)', href: '/seller/batches', icon: '\u25A0' },
  { label: 'DRAP Documents', href: '/seller/drap', icon: '\u25A0' },
  { section: 'Marketplace' },
  { label: 'Open RFQs', href: '/seller/rfqs', icon: '\u25A0', badge: '3' },
  { label: 'My Orders', href: '/seller/orders', icon: '\u25A0' },
  { section: 'Regulatory' },
  { label: 'Pathways', href: '/seller/regulatory', icon: '\u25A0' },
  { label: 'PMX Academy', href: '/seller/academy', icon: '\u25A0' },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(5);
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [user, setUser] = useState<UserData>({
    full_name: 'Lahore Generics',
    role: 'SELLER_ADMIN',
    manufacturer_name: 'Lahore Generics Ltd.',
    initials: 'LG',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data) {
          setUser({
            full_name: data.data.full_name || 'Lahore Generics',
            role: data.data.role || 'SELLER_ADMIN',
            manufacturer_name: data.data.manufacturer_name || 'Lahore Generics Ltd.',
            initials: (data.data.full_name || 'LG').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
          });
        }
      })
      .catch(() => { /* use demo defaults */ });
  }, []);

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
          const count = d.data.unread_count ?? items.filter((n: Record<string, unknown>) => (n.unread as boolean) ?? !(n.read as boolean)).length;
          if (typeof count === 'number') setNotifCount(count);
        }
      })
      .catch(() => { /* use demo defaults */ });
  }, []);

  const isActive = (href: string) => {
    if (href === '/seller/dashboard') return pathname === '/seller/dashboard' || pathname === '/seller';
    return pathname.startsWith(href);
  };

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
        <Link
          href="/seller/dashboard"
          style={{
            padding: '6px 16px',
            borderRight: '0.5px solid var(--border)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img src="/logo.png" alt="PMX Pharma Exchange" style={{ height: 32 }} />
        </Link>
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
            Seller Portal
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
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
              <span>{user.manufacturer_name}</span>
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
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{user.full_name}</div>
                  <div style={{ fontSize: 10, color: 'var(--pmx-tx3)' }}>{user.role}</div>
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

      {/* Notification panel */}
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
          <div style={{ padding: '12px 14px', borderBottom: '0.5px solid var(--border)', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
            <span>Notifications</span>
            <span style={{ fontSize: 11, color: 'var(--pmx-teal)', cursor: 'pointer' }} onClick={() => setNotifOpen(false)}>Mark all read</span>
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
          {navItems.map((item, i) => {
            if ('section' in item && item.section) {
              return (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px 4px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--pmx-tx3)',
                    letterSpacing: '.07em',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.section}
                </div>
              );
            }
            const active = isActive(item.href!);
            return (
              <Link
                key={i}
                href={item.href!}
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
            );
          })}
        </nav>

        {/* MAIN CONTENT */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--pmx-bg2)',
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
