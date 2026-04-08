'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    router.push(`/marketplace/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
  };

  const navLinks = [
    { label: 'Products', href: '/marketplace/search?q=' },
    { label: 'Manufacturers', href: '/marketplace/search?q=&view=manufacturers' },
    { label: 'How It Works', href: '/marketplace#how-it-works' },
    { label: 'About', href: '/marketplace#why-pmx' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* STICKY NAV */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid #E2E8F0' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.04)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          height: 72,
        }}>
          {/* Logo */}
          <Link href="/marketplace" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img src="/logo.png" alt="PMX Pharma Exchange" style={{ height: 40 }} />
          </Link>

          {/* Center Nav */}
          <nav className="mk-desktop-nav" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            {navLinks.map(link => {
              const isActive = link.href.includes('/search')
                ? pathname.includes('/search') && link.label === 'Products'
                : pathname === '/marketplace' && link.href.includes('#');
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  style={{
                    padding: '8px 20px',
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    color: isActive ? '#1D9E75' : '#64748B',
                    textDecoration: 'none',
                    borderRadius: 8,
                    transition: 'color 0.2s ease',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Search icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="mk-desktop-nav"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                transition: 'all 0.2s ease',
              }}
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
            </button>

            <Link
              href="/login"
              className="mk-desktop-nav"
              style={{
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                color: '#64748B',
                textDecoration: 'none',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="mk-desktop-nav"
              style={{
                padding: '9px 22px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                color: '#fff',
                background: '#1D9E75',
                textDecoration: 'none',
                borderRadius: 10,
                transition: 'all 0.2s ease',
              }}
            >
              Register
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mk-mobile-btn"
              style={{
                display: 'none',
                width: 42,
                height: 42,
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                background: 'transparent',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
              }}
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 8h16"/><path d="M4 16h16"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile slide-in drawer */}
        {mobileMenuOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(15,23,42,0.4)',
            backdropFilter: 'blur(4px)',
          }} onClick={() => setMobileMenuOpen(false)}>
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 300,
                background: '#fff',
                padding: '24px',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.08)',
                animation: 'slideInRight 0.25s ease forwards',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <img src="/logo.png" alt="PMX" style={{ height: 32 }} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ width: 36, height: 36, border: '1px solid #E2E8F0', borderRadius: 8, background: 'transparent', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {navLinks.map(link => (
                  <Link
                    key={link.label}
                    href={link.href}
                    style={{
                      padding: '14px 16px',
                      fontSize: 15,
                      fontWeight: 500,
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#0F172A',
                      textDecoration: 'none',
                      borderRadius: 10,
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/login" style={{ padding: '12px', textAlign: 'center', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 10, textDecoration: 'none' }}>
                  Sign In
                </Link>
                <Link href="/login" style={{ padding: '12px', textAlign: 'center', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: '#fff', background: '#1D9E75', borderRadius: 10, textDecoration: 'none' }}>
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* FULL-SCREEN SEARCH OVERLAY */}
      {searchOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 300,
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '20vh',
          animation: 'fadeIn 0.2s ease',
        }} onClick={() => setSearchOpen(false)}>
          <div style={{ width: '100%', maxWidth: 680, padding: '0 24px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSearchSubmit} style={{
              display: 'flex',
              alignItems: 'center',
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 20, flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search medicines, manufacturers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '20px 16px',
                  border: 'none',
                  outline: 'none',
                  fontSize: 18,
                  fontFamily: "'DM Sans', sans-serif",
                  color: '#0F172A',
                  background: 'transparent',
                }}
              />
              <button type="submit" style={{
                padding: '12px 24px',
                marginRight: 8,
                background: '#1D9E75',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}>
                Search
              </button>
            </form>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 16 }}>
              Press ESC to close
            </p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* FOOTER */}
      <footer style={{
        background: '#0F172A',
        padding: '64px 32px 40px',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 48,
            marginBottom: 48,
          }}>
            {/* Brand */}
            <div>
              <div style={{ marginBottom: 16 }}>
                <img src="/logo.png" alt="PMX Pharma Exchange" style={{ height: 36, filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
              </div>
              <p style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#64748B', lineHeight: 1.7, maxWidth: 280 }}>
                Pakistan&apos;s first compliance-linked B2B pharmaceutical export marketplace. Connecting DRAP-certified manufacturers with global buyers.
              </p>
            </div>

            {/* Marketplace */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
                Marketplace
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Browse Products', 'Manufacturers', 'Categories', 'How It Works'].map(item => (
                  <Link key={item} href="/marketplace" style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#94A3B8', textDecoration: 'none', transition: 'color 0.2s' }}>
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            {/* For Buyers */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
                For Buyers
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Register', 'Submit RFQ', 'Escrow Payments', 'Compliance Reports'].map(item => (
                  <Link key={item} href="/login" style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#94A3B8', textDecoration: 'none' }}>
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
                Company
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['About PMX', 'Quality Standards', 'Regulatory Partners', 'Contact Us'].map(item => (
                  <Link key={item} href="/login" style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#94A3B8', textDecoration: 'none' }}>
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #1E293B',
            paddingTop: 24,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}>
            <p style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#475569' }}>
              &copy; 2026 PMX Pharma Exchange. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: 24 }}>
              {['Privacy', 'Terms', 'Compliance'].map(item => (
                <Link key={item} href="/login" style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#475569', textDecoration: 'none' }}>
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Styles */}
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes staggerReveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .mk-desktop-nav {
            display: none !important;
          }
          .mk-mobile-btn {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .mk-mobile-btn {
            display: none !important;
          }
        }
        /* Marketplace footer link hover */
        footer a:hover {
          color: #CBD5E1 !important;
        }
      `}</style>
    </div>
  );
}
