'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function redirectForRole(role: string): string {
  if (role === 'PMX_ADMIN') return '/admin/dashboard'
  if (role.startsWith('BUYER')) return '/buyer/dashboard'
  return '/seller/dashboard'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  // On mount, check if already authenticated
  useEffect(() => {
    let cancelled = false
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          if (!cancelled) setChecking(false)
          return
        }
        const data = await res.json()
        if (data.success && data.data?.role && !cancelled) {
          router.replace(redirectForRole(data.data.role))
          // Keep checking=true so the login form stays hidden during redirect
          return
        }
      } catch {
        // Not authenticated -- show login form
      }
      if (!cancelled) setChecking(false)
    }
    checkSession()
    return () => { cancelled = true }
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error?.message || 'Login failed')
        setLoading(false)
        return
      }
      const role = data.data.user.role
      setRedirecting(true)
      setLoading(false)
      router.push(redirectForRole(role))
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const demoUsers = [
    { label: 'Seller Admin', email: 'admin@lahoregenerics.pk', role: 'SELLER_ADMIN' },
    { label: 'Seller QA', email: 'qa@lahoregenerics.pk', role: 'SELLER_QA' },
    { label: 'Buyer', email: 'buyer@gulfmedical.sa', role: 'BUYER_ADMIN' },
    { label: 'PMX Admin', email: 'admin@pmx.com.pk', role: 'PMX_ADMIN' },
  ]

  // Initial auth check -- show a minimal loading state
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pmx-bg3)' }}>
        <div className="flex flex-col items-center gap-3 animate-fade-in-up">
          <img src="/logo.png" alt="PMX Pharma Exchange" style={{ height: 48 }} />
          <p className="text-sm" style={{ color: 'var(--pmx-tx2)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Post-login redirect interstitial
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pmx-bg3)' }}>
        <div className="flex flex-col items-center gap-3 animate-fade-in-up">
          <img src="/logo.png" alt="PMX Pharma Exchange" style={{ height: 48 }} />
          <p className="text-sm font-medium" style={{ color: 'var(--pmx-tx)' }}>Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pmx-bg3)' }}>
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, var(--pmx-teal) 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }} />
      <div className="relative w-full max-w-md mx-4 animate-fade-in-up">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="PMX Pharma Exchange" style={{ height: 80, margin: '0 auto 8px' }} />
        </div>
        <div className="rounded-xl p-6 shadow-sm" style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)' }}>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--pmx-tx2)' }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--pmx-teal)]"
                style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--input)', color: 'var(--pmx-tx)' }}
                placeholder="you@company.com" required />
            </div>
            <div className="mb-5">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--pmx-tx2)' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--pmx-teal)]"
                style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--input)', color: 'var(--pmx-tx)' }}
                placeholder="Enter password" required />
            </div>
            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--pmx-red-light)', color: 'var(--pmx-red)' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
              style={{ background: 'var(--pmx-teal)' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <div className="mt-4 rounded-xl p-4" style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--pmx-tx2)' }}>
            Demo accounts <span className="font-normal">(password: PMX@prototype2026)</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoUsers.map(u => (
              <button key={u.email} onClick={() => { setEmail(u.email); setPassword('PMX@prototype2026') }}
                className="px-3 py-2 rounded-lg text-left transition-colors hover:opacity-80"
                style={{ background: 'var(--pmx-bg2)', border: '0.5px solid var(--border)' }}>
                <div className="text-xs font-semibold" style={{ color: 'var(--pmx-tx)' }}>{u.label}</div>
                <div className="text-[10px] truncate" style={{ color: 'var(--pmx-tx3)' }}>{u.email}</div>
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-[10px] mt-6" style={{ color: 'var(--pmx-tx3)' }}>
          PROTOTYPE -- Not for production use
        </p>
      </div>
    </div>
  )
}
