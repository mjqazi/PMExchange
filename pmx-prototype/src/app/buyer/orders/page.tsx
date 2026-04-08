'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface StarRating {
  label: string
  value: number
}

export default function BuyerOrdersPage() {
  const [cprRatings, setCprRatings] = useState<StarRating[]>([
    { label: 'On-time delivery', value: 4 },
    { label: 'Quantity accuracy', value: 5 },
    { label: 'Communication', value: 5 },
  ])

  const [cprcRatings, setCprcRatings] = useState<StarRating[]>([
    { label: 'CoA quality', value: 5 },
    { label: 'Batch record quality', value: 5 },
    { label: 'Regulatory docs', value: 4 },
  ])

  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingStatus, setRatingStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const [orders, setOrders] = useState([
    {
      id: 'ORD-2026-0041',
      product: 'Metformin 500mg',
      seller: 'Lahore Generics',
      value: '$148,000',
      stage: 'Stage 6 \u2014 Production',
      stageStyle: { background: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
      escrow: 'Funded',
      escrowStyle: { background: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
      nextAction: { type: 'text' as const, text: 'Awaiting dispatch' },
    },
    {
      id: 'ORD-2026-0040',
      product: 'Amoxicillin 250mg',
      seller: 'Karachi PharmaCorp',
      value: 'TBD',
      stage: 'Negotiating',
      stageStyle: { background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
      escrow: 'Pending',
      escrowStyle: { background: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
      nextAction: { type: 'button' as const, text: 'View thread', href: '/buyer/negotiate/ORD-2026-0040' },
    },
    {
      id: 'ORD-2026-0036',
      product: 'Metformin 500mg',
      seller: 'Lahore Generics',
      value: '$134,000',
      stage: 'Completed',
      stageStyle: { background: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
      escrow: 'Released',
      escrowStyle: { background: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
      nextAction: { type: 'link' as const, text: 'Rate transaction \u2197' },
    },
  ])

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          const stageStyleMap: Record<string, { background: string; color: string }> = {
            NEGOTIATING: { background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
            CONTRACT_GENERATED: { background: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
            ESCROW_FUNDED: { background: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
            PRODUCTION: { background: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
            COMPLETED: { background: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
          }
          const escrowStyleMap: Record<string, { background: string; color: string }> = {
            Funded: { background: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
            Pending: { background: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
            Released: { background: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
          }
          setOrders(d.data.map((o: Record<string, unknown>) => ({
            id: String(o.id || o.orderId || ''),
            product: String(o.productName || o.product || ''),
            seller: String(o.sellerName || o.seller || ''),
            value: String(o.totalValue || o.value || 'TBD'),
            stage: String(o.stage || o.status || ''),
            stageStyle: stageStyleMap[String(o.stage || o.status || '')] || { background: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
            escrow: String(o.escrowStatus || o.escrow || 'Pending'),
            escrowStyle: escrowStyleMap[String(o.escrowStatus || o.escrow || 'Pending')] || { background: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
            nextAction: o.stage === 'NEGOTIATING'
              ? { type: 'button' as const, text: 'View thread', href: `/buyer/negotiate/${o.id || o.orderId}` }
              : o.stage === 'COMPLETED'
              ? { type: 'link' as const, text: 'Rate transaction \u2197' }
              : { type: 'text' as const, text: String(o.nextAction || 'Awaiting update') },
          })))
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmitRatings = async (orderId: string) => {
    setRatingSubmitting(true)
    setRatingStatus('idle')
    try {
      const res = await fetch(`/api/orders/${orderId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpr: cprRatings.map(r => ({ criterion: r.label, score: r.value })),
          cprc: cprcRatings.map(r => ({ criterion: r.label, score: r.value })),
        }),
      })
      const d = await res.json()
      setRatingStatus(d.success ? 'success' : 'error')
    } catch {
      setRatingStatus('error')
    } finally {
      setRatingSubmitting(false)
    }
  }

  const renderStars = (value: number, onChange: (v: number) => void) => {
    return (
      <div style={{ color: 'var(--pmx-amber)', cursor: 'pointer', userSelect: 'none' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => onChange(star)}
            style={{ fontSize: 14 }}
          >
            {star <= value ? '\u2605' : '\u2606'}
          </span>
        ))}
      </div>
    )
  }

  const updateCpr = (index: number, value: number) => {
    const next = [...cprRatings]
    next[index] = { ...next[index], value }
    setCprRatings(next)
  }

  const updateCprc = (index: number, value: number) => {
    const next = [...cprcRatings]
    next[index] = { ...next[index], value }
    setCprcRatings(next)
  }

  return (
    <>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>My Orders</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>
            Track orders &middot; access documents &middot; confirm delivery &middot; manage disputes &middot; rate transactions
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div
        style={{
          background: 'var(--pmx-bg)',
          border: '0.5px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 14,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Order', 'Product', 'Seller', 'Value', 'Stage', 'Escrow', 'Next action'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--pmx-tx2)',
                    padding: '0 8px 8px 0',
                    borderBottom: '0.5px solid var(--border)',
                    letterSpacing: '.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12, color: 'var(--pmx-tx)' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{order.id}</span>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12, color: 'var(--pmx-tx)' }}>
                  {order.product}
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12, color: 'var(--pmx-tx)' }}>
                  {order.seller}
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12, color: 'var(--pmx-tx)' }}>
                  {order.value}
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 7px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      ...order.stageStyle,
                    }}
                  >
                    {order.stage}
                  </span>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 7px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      ...order.escrowStyle,
                    }}
                  >
                    {order.escrow}
                  </span>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                  {order.nextAction.type === 'text' && (
                    <span style={{ fontSize: 11, color: 'var(--pmx-tx2)' }}>{order.nextAction.text}</span>
                  )}
                  {order.nextAction.type === 'button' && (
                    <Link
                      href={order.nextAction.href!}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 9px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: 'pointer',
                        background: 'var(--pmx-teal)',
                        color: '#fff',
                        border: 'none',
                        textDecoration: 'none',
                      }}
                    >
                      {order.nextAction.text}
                    </Link>
                  )}
                  {order.nextAction.type === 'link' && (
                    <span style={{ fontSize: 11, color: 'var(--pmx-teal)', cursor: 'pointer' }}>
                      {order.nextAction.text}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rating Form */}
      <div
        style={{
          background: 'var(--pmx-bg)',
          border: '1px solid var(--pmx-teal)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
          Rate completed transaction &mdash; ORD-2026-0036
        </div>
        <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: 14 }}>
          Rate Lahore Generics Ltd. &middot; 4 days remaining before window closes
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
          {/* CPR */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>CPR &mdash; Commercial Performance Rating</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
              {cprRatings.map((rating, idx) => (
                <div
                  key={rating.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '0.5px solid var(--border)',
                    fontSize: 12,
                  }}
                >
                  <span>{rating.label}</span>
                  {renderStars(rating.value, (v) => updateCpr(idx, v))}
                </div>
              ))}
            </div>
          </div>

          {/* CPR-C */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>CPR-C &mdash; Compliance Performance Rating</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
              {cprcRatings.map((rating, idx) => (
                <div
                  key={rating.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '0.5px solid var(--border)',
                    fontSize: 12,
                  }}
                >
                  <span>{rating.label}</span>
                  {renderStars(rating.value, (v) => updateCprc(idx, v))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {ratingStatus === 'success' && (
          <div style={{ padding: '8px 12px', background: 'var(--pmx-green-light)', color: 'var(--pmx-green)', borderRadius: 8, fontSize: 12, fontWeight: 500, marginTop: 12 }}>
            Ratings submitted successfully!
          </div>
        )}
        {ratingStatus === 'error' && (
          <div style={{ padding: '8px 12px', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', borderRadius: 8, fontSize: 12, fontWeight: 500, marginTop: 12 }}>
            Failed to submit ratings. Please try again.
          </div>
        )}
        <button
          disabled={ratingSubmitting}
          onClick={() => handleSubmitRatings('ORD-2026-0036')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            cursor: ratingSubmitting ? 'wait' : 'pointer',
            background: 'var(--pmx-teal)',
            color: '#fff',
            border: 'none',
            fontFamily: 'inherit',
            marginTop: 12,
            opacity: ratingSubmitting ? 0.6 : 1,
          }}
        >
          {ratingSubmitting ? 'Submitting...' : 'Submit both ratings'}
        </button>
      </div>
    </>
  )
}
