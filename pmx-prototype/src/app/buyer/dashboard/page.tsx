'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function BuyerDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState([
    { label: 'Active RFQs', value: '3', sub: '2 published, 1 draft', subColor: 'var(--pmx-tx2)' },
    { label: 'Total matches found', value: '22', sub: 'Across all active RFQs', subColor: 'var(--pmx-green)' },
    { label: 'Active orders', value: '2', sub: '$438,000 in escrow', subColor: 'var(--pmx-tx2)' },
    { label: 'Transactions completed', value: '7', sub: 'All time', subColor: 'var(--pmx-green)' },
  ])

  const [rfqs, setRfqs] = useState([
    { id: 'RFQ-2026-087', product: 'Metformin 500mg \u2014 SA', status: 'Published', statusClass: 'success', matches: 7, link: '/buyer/rfqs/RFQ-2026-087' },
    { id: 'RFQ-2026-083', product: 'Amoxicillin 250mg \u2014 KE', status: 'Published', statusClass: 'success', matches: 12, link: '/buyer/rfqs/RFQ-2026-083' },
    { id: 'RFQ-2026-090', product: 'Ciprofloxacin 500mg \u2014 NG', status: 'Draft', statusClass: 'neutral', matches: null as number | null, link: null as string | null },
  ])

  const [orders, setOrders] = useState([
    {
      id: 'ORD-2026-0041',
      stage: 'Stage 6',
      stageColor: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
      product: 'Metformin 500mg \u00b7 Lahore Generics \u00b7 USD 148,000',
      detail: 'Escrow funded \u00b7 Batch LHR-2026-0031 linked',
      detailColor: 'var(--pmx-green)',
    },
    {
      id: 'ORD-2026-0040',
      stage: 'Negotiating',
      stageColor: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
      product: 'Amoxicillin 250mg \u00b7 Karachi PharmaCorp \u00b7 Offer v2',
      detail: 'Counter-offer sent \u00b7 Awaiting seller response',
      detailColor: 'var(--pmx-amber)',
    },
  ])

  useEffect(() => {
    let completed = 0
    const checkDone = () => { completed++; if (completed >= 2) setLoading(false) }

    // Fetch RFQs
    fetch('/api/rfqs')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          const apiRfqs = d.data
          setRfqs(apiRfqs.map((r: Record<string, unknown>) => {
            const inn = r.product_inn || r.productName || r.inn || '';
            const str = r.product_strength || r.strength || '';
            const dest = r.destination_country || r.destination || '';
            return {
              id: String(r.id || r.rfqId || ''),
              product: `${inn} ${str} \u2014 ${dest}`.trim(),
              status: r.status === 'PUBLISHED' ? 'Published' : r.status === 'DRAFT' ? 'Draft' : String(r.status || 'Draft'),
              statusClass: r.status === 'PUBLISHED' ? 'success' : 'neutral',
              matches: typeof r.matchCount === 'number' ? r.matchCount : null,
              link: r.status === 'PUBLISHED' ? `/buyer/rfqs/${r.id || r.rfqId}` : null,
            };
          }))
          // Compute RFQ KPIs
          const published = apiRfqs.filter((r: Record<string, unknown>) => r.status === 'PUBLISHED').length
          const drafts = apiRfqs.filter((r: Record<string, unknown>) => r.status === 'DRAFT').length
          const totalMatches = apiRfqs.reduce((sum: number, r: Record<string, unknown>) => sum + (typeof r.matchCount === 'number' ? r.matchCount : 0), 0)
          setKpis(prev => prev.map((k, i) => {
            if (i === 0) return { ...k, value: String(apiRfqs.length), sub: `${published} published, ${drafts} draft` }
            if (i === 1) return { ...k, value: String(totalMatches), sub: 'Across all active RFQs' }
            return k
          }))
        }
      })
      .catch(() => { setError('Failed to load data. Showing demo data.') })
      .finally(checkDone)

    // Fetch Orders
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          const apiOrders = d.data
          const stageColors: Record<string, { bg: string; color: string }> = {
            NEGOTIATING: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
            CONTRACT_GENERATED: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
            ESCROW_FUNDED: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
            IN_PRODUCTION: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
            DISPATCHED: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
            DELIVERED: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
            COMPLETED: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
          }
          setOrders(apiOrders.slice(0, 5).map((o: Record<string, unknown>) => {
            const productLabel = o.product_inn
              ? `${o.product_inn} ${o.strength || ''}`.trim()
              : String(o.productName || '');
            const sellerLabel = String(o.seller_name || o.sellerName || '');
            const valueLabel = o.agreed_price_usd && o.quantity
              ? `USD ${(Number(o.agreed_price_usd) * Number(o.quantity)).toLocaleString()}`
              : String(o.totalValue || '');
            return {
              id: String(o.id || o.orderId || ''),
              stage: String(o.status || o.stage || 'Unknown'),
              stageColor: stageColors[String(o.status || o.stage || '')] || { bg: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
              product: `${productLabel} \u00b7 ${sellerLabel} \u00b7 ${valueLabel}`,
              detail: String(o.detail || o.statusText || ''),
              detailColor: 'var(--pmx-tx2)',
            };
          }))
          // Compute order KPIs
          const active = apiOrders.filter((o: Record<string, unknown>) => o.stage !== 'COMPLETED' && o.status !== 'COMPLETED').length
          const completed = apiOrders.filter((o: Record<string, unknown>) => o.stage === 'COMPLETED' || o.status === 'COMPLETED').length
          setKpis(prev => prev.map((k, i) => {
            if (i === 2) return { ...k, value: String(active) }
            if (i === 3) return { ...k, value: String(completed) }
            return k
          }))
        }
      })
      .catch(() => { setError('Failed to load data. Showing demo data.') })
      .finally(checkDone)
  }, [])

  const badgeStyle = (type: string): React.CSSProperties => {
    const map: Record<string, { bg: string; color: string }> = {
      success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
      warning: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
      neutral: { bg: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
      info: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
    }
    const s = map[type] || map.neutral
    return { display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', background: s.bg, color: s.color }
  }

  if (loading) {
    return (
      <div style={{ minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)', borderRadius: 8, fontSize: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <span onClick={() => setError(null)} style={{ cursor: 'pointer', fontWeight: 700 }}>&times;</span>
        </div>
      )}
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Gulf Medical LLC</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Institutional Buyer &middot; Saudi Arabia &middot; Verified &middot; Credit limit: USD 2,000,000</p>
        </div>
        <Link
          href="/buyer/rfqs/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            background: 'var(--pmx-teal)',
            color: '#fff',
            border: 'none',
            textDecoration: 'none',
          }}
        >
          + Post new RFQ
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: 'var(--pmx-bg)',
              border: '0.5px solid var(--border)',
              borderRadius: 8,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: 5 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--pmx-tx)' }}>{kpi.value}</div>
            <div style={{ fontSize: 11, marginTop: 3, color: kpi.subColor }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
        {/* My RFQs */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>My RFQs</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['RFQ', 'Product', 'Status', 'Matches', ''].map((h) => (
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
              {rfqs.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12, color: 'var(--pmx-tx)' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{r.id}</span>
                  </td>
                  <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12, color: 'var(--pmx-tx)' }}>
                    {r.product}
                  </td>
                  <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                    <span style={badgeStyle(r.statusClass)}>{r.status}</span>
                  </td>
                  <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12, color: r.matches ? 'var(--pmx-teal)' : 'var(--pmx-tx)', fontWeight: r.matches ? 700 : 400 }}>
                    {r.matches ?? '\u2014'}
                  </td>
                  <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                    {r.link ? (
                      <Link
                        href={r.link}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 9px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: '0.5px solid var(--input)',
                          background: 'var(--pmx-bg)',
                          color: 'var(--pmx-tx)',
                          textDecoration: 'none',
                        }}
                      >
                        View matches
                      </Link>
                    ) : (
                      <button
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 9px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: '0.5px solid var(--input)',
                          background: 'var(--pmx-bg)',
                          color: 'var(--pmx-tx)',
                          fontFamily: 'inherit',
                        }}
                      >
                        Publish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Active Orders */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Active orders</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map((o) => (
              <div
                key={o.id}
                style={{
                  padding: 12,
                  border: '0.5px solid var(--border)',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{o.id}</span>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 7px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      background: o.stageColor.bg,
                      color: o.stageColor.color,
                    }}
                  >
                    {o.stage}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', margin: '4px 0' }}>{o.product}</div>
                <div style={{ fontSize: 11, color: o.detailColor }}>{o.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
