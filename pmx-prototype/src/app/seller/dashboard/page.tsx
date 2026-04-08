'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DEMO_CQS_DIMENSIONS = [
  { label: 'Batch completeness', value: 96, weight: 25, color: 'var(--pmx-green)' },
  { label: 'CoA accuracy', value: 89, weight: 20, color: 'var(--pmx-green)' },
  { label: 'Deviation rate (inv.)', value: 78, weight: 20, color: 'var(--pmx-amber)' },
  { label: 'Supplier qual.', value: 82, weight: 15, color: 'var(--pmx-green)' },
  { label: 'Cert. status', value: 100, weight: 12, color: 'var(--pmx-green)' },
  { label: 'Delivery perf.', value: 75, weight: 8, color: 'var(--pmx-amber)' },
];

const DEMO_KPIS = [
  { label: 'Active batches', value: '3', sub: '2 in progress, 1 QA review', subClass: 'neutral' },
  { label: 'Released CoAs (30d)', value: '18', sub: '+2 this week', subClass: 'positive' },
  { label: 'Open orders', value: '2', sub: '$296K total value', subClass: 'neutral' },
  { label: 'Open deviations', value: '1', valueColor: 'var(--pmx-amber)', sub: '1 Major \u2014 CAPA pending', subClass: 'negative' },
];

const DEMO_RECENT_BATCHES = [
  { batch: 'LHR-2026-0031', product: 'Metformin HCl 500mg', status: 'Released', statusClass: 'success', coa: 'COA-031', coaLink: '/seller/coa/LHR-2026-0031' },
  { batch: 'LHR-2026-0030', product: 'Atorvastatin 40mg', status: 'In progress', statusClass: 'info', coa: 'Pending', coaLink: null },
  { batch: 'LHR-2026-0029', product: 'Ciprofloxacin 500mg', status: 'Released', statusClass: 'success', coa: 'COA-029', coaLink: null },
  { batch: 'LHR-2026-0028', product: 'Amoxicillin 250mg', status: 'Quarantine', statusClass: 'danger', coa: 'Pending CAPA', coaLink: null },
];

const DEMO_ALERTS = [
  { title: 'Major deviation \u2014 CAPA required', body: 'Batch LHR-2026-0028 \u00B7 Dissolution failure \u00B7 2d ago', color: 'var(--pmx-amber)', bg: 'var(--pmx-amber-light)' },
  { title: 'New RFQ match \u2014 Metformin 500mg', body: 'Gulf Medical LLC \u00B7 Saudi Arabia \u00B7 5M tabs/mo \u00B7 4h ago', color: 'var(--pmx-blue)', bg: 'var(--pmx-blue-light)' },
  { title: 'Escrow funded \u2014 ORD-2026-0041', body: 'USD 148,000 confirmed via PSO \u00B7 Ready to produce', color: 'var(--pmx-green)', bg: 'var(--pmx-green-light)' },
  { title: 'WHO-GMP pathway \u2014 65% complete', body: '7 of 11 areas done \u00B7 Continue in Regulatory', color: 'var(--pmx-gray)', bg: 'var(--pmx-gray-light)' },
];

export default function SellerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cqsDimensions, setCqsDimensions] = useState(DEMO_CQS_DIMENSIONS);
  const [cqsScore, setCqsScore] = useState(83.4);
  const [cqsDelta, setCqsDelta] = useState('+1.2 pts');
  const [kpis, setKpis] = useState(DEMO_KPIS);
  const [recentBatches, setRecentBatches] = useState(DEMO_RECENT_BATCHES);
  const [alerts, setAlerts] = useState(DEMO_ALERTS);
  const [manufacturerName, setManufacturerName] = useState('Lahore Generics Ltd.');
  const [manufacturerSub, setManufacturerSub] = useState('Tier 2 — Export Ready \u00A0\u00B7\u00A0 PMX-Certified \u00A0\u00B7\u00A0 WHO-GMP valid to Dec 2026');

  useEffect(() => {
    let completed = 0;
    const total = 3;
    let hasError = false;
    const checkDone = () => {
      completed++;
      if (completed >= total) setLoading(false);
    };

    // First get auth info for manufacturer_id
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((authData) => {
        if (authData?.data) {
          const mfrId = authData.data.manufacturer_id;
          if (authData.data.manufacturer_name) setManufacturerName(authData.data.manufacturer_name);

          // Fetch seller profile for CQS
          if (mfrId) {
            fetch(`/api/sellers/${mfrId}/profile`)
              .then((r) => r.json())
              .then((d) => {
                if (d.success && d.data) {
                  const p = d.data;
                  if (p.cqs_score != null) setCqsScore(p.cqs_score);
                  if (p.cqs_delta) setCqsDelta(p.cqs_delta);
                  if (p.cqs_dimensions && Array.isArray(p.cqs_dimensions)) {
                    setCqsDimensions(p.cqs_dimensions);
                  }
                  if (p.tier_label) {
                    setManufacturerSub(p.tier_label);
                  }
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {
        if (!hasError) { hasError = true; setError('Failed to load profile data. Showing demo data.'); }
      })
      .finally(checkDone);

    // Fetch recent batches
    fetch('/api/batches')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const items = Array.isArray(d.data) ? d.data : d.data.items || [];
          if (items.length > 0) {
            const mapped = items.slice(0, 4).map((b: Record<string, unknown>) => ({
              batch: String(b.batch_no || b.batch_number || b.id || ''),
              product: b.product_inn ? `${b.product_inn} ${b.strength || ''}`.trim() : String(b.product_name || b.product || ''),
              status: String(b.status || 'Unknown'),
              statusClass: mapStatusClass(String(b.status || '')),
              coa: String(b.coa_ref || (String(b.status) === 'RELEASED' ? `COA-${(String(b.batch_no || b.batch_number || '')).split('-').pop()}` : 'Pending')),
              coaLink: String(b.status) === 'RELEASED' ? `/seller/coa/${b.batch_no || b.batch_number || b.id}` : null,
            }));
            setRecentBatches(mapped);
          }
        }
      })
      .catch(() => {
        if (!hasError) { hasError = true; setError('Failed to load batch data. Showing demo data.'); }
      })
      .finally(checkDone);

    // Fetch notifications for alerts
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const items = Array.isArray(d.data) ? d.data : d.data.items || [];
          if (items.length > 0) {
            const mapped = items.slice(0, 4).map((n: Record<string, unknown>) => ({
              title: String(n.title || ''),
              body: String(n.body || n.message || ''),
              color: String(n.color || 'var(--pmx-gray)'),
              bg: String(n.bg || 'var(--pmx-gray-light)'),
            }));
            setAlerts(mapped);
          }
        }
      })
      .catch(() => {
        if (!hasError) { hasError = true; setError('Failed to load notifications. Showing demo data.'); }
      })
      .finally(checkDone);
  }, []);

  const badgeStyles: Record<string, { bg: string; color: string }> = {
    success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
    info: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
    danger: { bg: 'var(--pmx-red-light)', color: 'var(--pmx-red)' },
    warning: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
    teal: { bg: 'var(--pmx-teal-light)', color: 'var(--pmx-teal)' },
  };

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ padding: 20, minHeight: 600 }}>
      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)', borderRadius: 8, fontSize: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <span onClick={() => setError(null)} style={{ cursor: 'pointer', fontWeight: 700 }}>&times;</span>
        </div>
      )}
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>{manufacturerName}</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>{manufacturerSub}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ ...badgeStyle(badgeStyles.success) }}>PMX-Certified</span>
          <span style={{ ...badgeStyle(badgeStyles.info) }}>Tier 2</span>
        </div>
      </div>

      {/* CQS Card */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* CQS Gauge */}
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            border: '4px solid var(--pmx-green)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--pmx-green-light)',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--pmx-green)' }}>{cqsScore}</div>
          <div style={{ fontSize: 10, color: 'var(--pmx-green)', fontWeight: 700 }}>CQS</div>
        </div>

        {/* 6 dimensions */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
            Compliance Quality Score — 6 dimensions&nbsp;
            <span style={{ ...badgeStyle(badgeStyles.success), fontSize: 10 }}>Green tier &nbsp;&#9650; {cqsDelta}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {cqsDimensions.map((d) => (
              <div key={d.label}>
                <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: 3 }}>
                  {d.label} <span style={{ float: 'right', fontWeight: 700, color: 'var(--pmx-tx)' }}>{d.value}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${d.value}%`, background: d.color, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--pmx-tx3)', marginTop: 2 }}>Weight {d.weight}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right info */}
        <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 11, color: 'var(--pmx-tx2)' }}>
          Updated 2h ago<br />
          Recalc: every 24h<br /><br />
          <span style={{ fontSize: 11, color: 'var(--pmx-tx3)' }}>Auto-suspend below 40<br />Warning badge below 60</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: 5 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.valueColor || 'var(--pmx-tx)' }}>{k.value}</div>
            <div style={{ fontSize: 11, marginTop: 3, color: k.subClass === 'positive' ? 'var(--pmx-green)' : k.subClass === 'negative' ? 'var(--pmx-red)' : 'var(--pmx-tx2)' }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column: Recent batches + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
        {/* Recent batches */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Recent batches</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Batch no.', 'Product', 'Status', 'CoA'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBatches.map((b) => (
                <tr key={b.batch}>
                  <td style={tdStyle}>
                    <Link href={`/seller/batches/${b.batch}`} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--pmx-teal)', textDecoration: 'none' }}>
                      {b.batch}
                    </Link>
                  </td>
                  <td style={tdStyle}>{b.product}</td>
                  <td style={tdStyle}><span style={{ ...badgeStyle(badgeStyles[b.statusClass] || badgeStyles.info) }}>{b.status}</span></td>
                  <td style={tdStyle}>
                    {b.coaLink ? (
                      <a href={b.coaLink} style={{ color: 'var(--pmx-teal)', cursor: 'pointer', fontSize: 11, textDecoration: 'none' }}>{b.coa} &#8599;</a>
                    ) : (
                      <span style={{ color: 'var(--pmx-tx3)', fontSize: 11 }}>{b.coa}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Platform alerts */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Platform alerts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ padding: 10, background: a.bg, borderRadius: 8, borderLeft: `3px solid ${a.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: a.color }}>{a.title}</div>
                <div style={{ fontSize: 11, color: 'var(--pmx-tx2)' }}>{a.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function mapStatusClass(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'released' || s === 'approved') return 'success';
  if (s === 'in progress' || s === 'in_progress') return 'info';
  if (s === 'quarantine' || s === 'rejected') return 'danger';
  if (s === 'pending' || s === 'review') return 'warning';
  return 'info';
}

const tdStyle: React.CSSProperties = {
  padding: '9px 8px 9px 0',
  borderBottom: '0.5px solid var(--border)',
  verticalAlign: 'middle',
  fontSize: 12,
  color: 'var(--pmx-tx)',
};

function badgeStyle(s: { bg: string; color: string }): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '2px 7px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    background: s.bg,
    color: s.color,
  };
}
