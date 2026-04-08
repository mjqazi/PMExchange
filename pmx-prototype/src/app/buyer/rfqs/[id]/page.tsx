'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface MatchBar {
  label: string
  width: string
  color: string
  value: string
}

interface SellerMatch {
  rank: number
  sellerId?: string
  name: string
  location: string
  tier: string
  certs: string
  cqsScore: number
  cqsLevel: 'green' | 'amber' | 'red'
  bars: MatchBar[]
  quoted: string
  isTop: boolean
}

export default function RFQMatchesPage() {
  const params = useParams()
  const router = useRouter()
  const rfqId = params.id as string
  const [negotiating, setNegotiating] = useState<string | null>(null)

  const [sellers, setSellers] = useState<SellerMatch[]>([
    {
      rank: 1,
      sellerId: 'lahore-generics',
      name: 'Lahore Generics Ltd.',
      location: 'Lahore',
      tier: 'Tier 2',
      certs: 'WHO-GMP + SFDA',
      cqsScore: 83.4,
      cqsLevel: 'green',
      bars: [
        { label: 'Product (L1)', width: '100%', color: 'var(--pmx-green)', value: '\u2713' },
        { label: 'Certifications', width: '100%', color: 'var(--pmx-green)', value: '\u2713' },
        { label: 'Capacity 1.5x', width: '100%', color: 'var(--pmx-green)', value: '\u2713' },
        { label: 'CQS (L2)', width: '83%', color: 'var(--pmx-blue)', value: '83.4' },
        { label: 'AI match (L3)', width: '94%', color: 'var(--pmx-teal)', value: '94%' },
      ],
      quoted: 'Quoted: $0.0092/tab \u00b7 Lead: 42d \u00b7 Min: 1M tabs',
      isTop: true,
    },
    {
      rank: 2,
      sellerId: 'karachi-pharmacorp',
      name: 'Karachi PharmaCorp',
      location: 'Karachi',
      tier: 'Tier 2',
      certs: 'WHO-GMP',
      cqsScore: 71.8,
      cqsLevel: 'amber',
      bars: [
        { label: 'Product (L1)', width: '100%', color: 'var(--pmx-green)', value: '\u2713' },
        { label: 'Certifications', width: '100%', color: 'var(--pmx-green)', value: '\u2713' },
        { label: 'CQS (L2)', width: '72%', color: 'var(--pmx-blue)', value: '71.8' },
        { label: 'AI match (L3)', width: '78%', color: 'var(--pmx-teal)', value: '78%' },
      ],
      quoted: 'Quoted: $0.0089/tab \u00b7 Lead: 50d',
      isTop: false,
    },
    {
      rank: 3,
      sellerId: 'multan-medgen',
      name: 'Multan MedGen Pvt. Ltd.',
      location: 'Multan',
      tier: 'Tier 2',
      certs: 'DRAP-GMP',
      cqsScore: 66.2,
      cqsLevel: 'amber',
      bars: [
        { label: 'Product (L1)', width: '100%', color: 'var(--pmx-green)', value: '\u2713' },
        { label: 'Certifications', width: '80%', color: 'var(--pmx-amber)', value: '80%' },
        { label: 'CQS (L2)', width: '66%', color: 'var(--pmx-blue)', value: '66.2' },
        { label: 'AI match (L3)', width: '65%', color: 'var(--pmx-teal)', value: '65%' },
      ],
      quoted: 'Quoted: $0.0085/tab \u00b7 Lead: 55d',
      isTop: false,
    },
  ])

  useEffect(() => {
    fetch(`/api/rfqs/${rfqId}/matches`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          setSellers(d.data.map((m: Record<string, unknown>, idx: number) => ({
            rank: idx + 1,
            sellerId: m.sellerId || m.id,
            name: String(m.companyName || m.name || ''),
            location: String(m.location || m.city || ''),
            tier: String(m.tier || ''),
            certs: String(m.certs || m.certifications || ''),
            cqsScore: Number(m.cqsScore || m.cqs || 0),
            cqsLevel: Number(m.cqsScore || m.cqs || 0) >= 80 ? 'green' as const : Number(m.cqsScore || m.cqs || 0) >= 60 ? 'amber' as const : 'red' as const,
            bars: Array.isArray(m.bars) ? m.bars : [
              { label: 'Product (L1)', width: '100%', color: 'var(--pmx-green)', value: '\u2713' },
              { label: 'CQS (L2)', width: `${m.cqsScore || m.cqs || 0}%`, color: 'var(--pmx-blue)', value: String(m.cqsScore || m.cqs || 0) },
            ],
            quoted: String(m.quoted || m.quoteInfo || ''),
            isTop: idx === 0,
          })))
        }
      })
      .catch(() => {})
  }, [rfqId])

  const handleNegotiate = async (sellerId: string) => {
    setNegotiating(sellerId)
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/negotiate/${sellerId}`, { method: 'POST' })
      const d = await res.json()
      if (d.success && d.data?.orderId) {
        router.push(`/buyer/negotiate/${d.data.orderId}`)
      } else {
        router.push('/buyer/negotiate/ORD-2026-0040')
      }
    } catch {
      router.push('/buyer/negotiate/ORD-2026-0040')
    } finally {
      setNegotiating(null)
    }
  }

  const cqsStyles: Record<string, { bg: string; color: string; border: string; dotBg: string }> = {
    green: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)', border: 'var(--pmx-green)', dotBg: 'var(--pmx-green)' },
    amber: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)', border: 'var(--pmx-amber)', dotBg: 'var(--pmx-amber)' },
    red: { bg: 'var(--pmx-red-light)', color: 'var(--pmx-red)', border: 'var(--pmx-red)', dotBg: 'var(--pmx-red)' },
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 11, color: 'var(--pmx-tx3)', marginBottom: 12 }}>
        <Link href="/buyer/dashboard" style={{ color: 'var(--pmx-tx3)', textDecoration: 'none' }}>Dashboard</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: 'var(--pmx-tx2)' }}>RFQ Matches</span>
      </nav>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>
            RFQ Matches &mdash; <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15 }}>RFQ-2026-087</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Metformin HCl 500mg &middot; 5M tabs/mo &middot; Saudi Arabia &middot; Layers 1 + 2 + 3 applied</p>
        </div>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 7px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            background: 'var(--pmx-green-light)',
            color: 'var(--pmx-green)',
          }}
        >
          7 eligible sellers
        </span>
      </div>

      {/* Match Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        {sellers.map((seller) => {
          const cqs = cqsStyles[seller.cqsLevel]
          return (
            <div
              key={seller.rank}
              style={{
                border: seller.isTop ? '2px solid var(--pmx-teal)' : '0.5px solid var(--border)',
                borderRadius: 12,
                padding: 14,
                background: 'var(--pmx-bg)',
              }}
            >
              {/* Rank Header */}
              <div style={{ display: 'flex', justifyContent: seller.isTop ? 'space-between' : 'flex-end', marginBottom: 8 }}>
                {seller.isTop && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: 'var(--pmx-teal-light)',
                      color: 'var(--pmx-teal)',
                      padding: '2px 8px',
                      borderRadius: 3,
                    }}
                  >
                    Top match
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--pmx-tx2)' }}>#{seller.rank}</span>
              </div>

              {/* Company Info */}
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{seller.name}</div>
              <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: 8 }}>
                {seller.location} &middot; {seller.tier} &middot; {seller.certs}
              </div>

              {/* CQS Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  border: `0.5px solid ${cqs.border}`,
                  background: cqs.bg,
                  color: cqs.color,
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    display: 'inline-block',
                    background: cqs.dotBg,
                  }}
                />
                CQS {seller.cqsScore}
              </div>

              {/* Match Bars */}
              {seller.bars.map((bar) => (
                <div
                  key={bar.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    color: 'var(--pmx-tx2)',
                    marginBottom: 5,
                  }}
                >
                  <span style={{ width: 80, flexShrink: 0 }}>{bar.label}</span>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      background: 'var(--border)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 2,
                        width: bar.width,
                        background: bar.color,
                      }}
                    />
                  </div>
                  <span style={{ width: 30, textAlign: 'right', color: 'var(--pmx-tx)', fontWeight: 600 }}>
                    {bar.value}
                  </span>
                </div>
              ))}

              {/* Quoted Terms */}
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--pmx-tx2)',
                  margin: '8px 0',
                  padding: 8,
                  background: 'var(--pmx-bg2)',
                  borderRadius: 8,
                }}
              >
                {seller.quoted}
              </div>

              {/* Action Button */}
              <button
                disabled={negotiating === seller.sellerId}
                onClick={() => handleNegotiate(seller.sellerId || seller.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: negotiating === seller.sellerId ? 'wait' : 'pointer',
                  background: seller.isTop ? 'var(--pmx-teal)' : 'var(--pmx-bg)',
                  color: seller.isTop ? '#fff' : 'var(--pmx-tx)',
                  border: seller.isTop ? 'none' : '0.5px solid var(--input)',
                  fontFamily: 'inherit',
                  opacity: negotiating === seller.sellerId ? 0.6 : 1,
                  textDecoration: 'none',
                }}
              >
                {negotiating === seller.sellerId ? 'Opening...' : 'Open negotiation \u2192'}
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
