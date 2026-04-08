'use client';

import { useState, useEffect } from 'react';

const Badge = ({ children, type }: { children: React.ReactNode; type: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal' }) => {
  const styles: Record<string, { bg: string; color: string }> = {
    success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
    warning: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
    danger: { bg: 'var(--pmx-red-light)', color: 'var(--pmx-red)' },
    info: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
    neutral: { bg: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
    teal: { bg: 'var(--pmx-teal-light)', color: 'var(--pmx-teal)' },
  };
  const s = styles[type];
  return (
    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', background: s.bg, color: s.color }}>
      {children}
    </span>
  );
};

const CQSBadge = ({ score, tier }: { score: number | null; tier: 'green' | 'amber' | 'red' | null }) => {
  if (score === null || tier === null) {
    return <span style={{ fontSize: 11, color: 'var(--pmx-tx3)' }}>&mdash;</span>;
  }
  const colors: Record<string, { bg: string; color: string; dot: string; border: string }> = {
    green: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)', dot: 'var(--pmx-green)', border: 'var(--pmx-green)' },
    amber: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)', dot: 'var(--pmx-amber)', border: 'var(--pmx-amber)' },
    red: { bg: 'var(--pmx-red-light)', color: 'var(--pmx-red)', dot: 'var(--pmx-red)', border: 'var(--pmx-red)' },
  };
  const c = colors[tier];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 7px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, border: `0.5px solid ${c.border}` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {score}
    </span>
  );
};

const DEMO_SELLERS = [
  { company: 'Lahore Generics Ltd.', drap: 'MFG-0124-2019', tier: 'Tier 2', tierType: 'info' as const, kyb: 'Approved', kybType: 'success' as const, cqs: 83.4, cqsTier: 'green' as const, status: 'Active', statusType: 'success' as const, orders: 9, suspended: false },
  { company: 'Karachi PharmaCorp', drap: 'MFG-0218-2018', tier: 'Tier 2', tierType: 'info' as const, kyb: 'Approved', kybType: 'success' as const, cqs: 71.8, cqsTier: 'amber' as const, status: 'Active', statusType: 'success' as const, orders: 6, suspended: false },
  { company: 'Multan MedGen Pvt. Ltd.', drap: 'MFG-0341-2020', tier: 'Tier 2', tierType: 'info' as const, kyb: 'Approved', kybType: 'success' as const, cqs: 66.2, cqsTier: 'amber' as const, status: 'Active', statusType: 'success' as const, orders: 4, suspended: false },
  { company: 'Faisalabad Meds Co.', drap: 'MFG-0217-2021', tier: 'Tier 1', tierType: 'neutral' as const, kyb: 'Gate 2', kybType: 'warning' as const, cqs: null, cqsTier: null, status: 'Pending', statusType: 'warning' as const, orders: 0, suspended: false },
  { company: 'Karachi Pharma Ltd.', drap: 'MFG-0119-2017', tier: 'Tier 1', tierType: 'neutral' as const, kyb: 'Approved', kybType: 'success' as const, cqs: 38.2, cqsTier: 'red' as const, status: 'Auto-suspended', statusType: 'danger' as const, orders: 2, suspended: true },
];

export default function SellersPage() {
  const [sellers, setSellers] = useState(DEMO_SELLERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/sellers')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          setSellers(d.data.map((s: Record<string, unknown>) => {
            const cqsVal = s.cqsScore !== null && s.cqsScore !== undefined ? Number(s.cqsScore) : (s.cqs !== null && s.cqs !== undefined ? Number(s.cqs) : null);
            const tierNum = String(s.tier || '').match(/\d/)?.[0] || '1';
            const tierType = Number(tierNum) >= 3 ? 'teal' as const : Number(tierNum) >= 2 ? 'info' as const : 'neutral' as const;
            const kybStatus = String(s.kybStatus || s.kyb || 'Pending');
            const isSuspended = s.suspended === true || s.status === 'AUTO_SUSPENDED' || (cqsVal !== null && cqsVal < 40);
            return {
              company: String(s.companyName || s.company || ''),
              drap: String(s.drapLicence || s.drap || ''),
              tier: String(s.tier || `Tier ${tierNum}`),
              tierType,
              kyb: kybStatus === 'APPROVED' ? 'Approved' : kybStatus,
              kybType: kybStatus === 'APPROVED' || kybStatus === 'Approved' ? 'success' as const : 'warning' as const,
              cqs: cqsVal,
              cqsTier: cqsVal === null ? null : cqsVal >= 80 ? 'green' as const : cqsVal >= 60 ? 'amber' as const : 'red' as const,
              status: isSuspended ? 'Auto-suspended' : kybStatus === 'APPROVED' || kybStatus === 'Approved' ? 'Active' : 'Pending',
              statusType: isSuspended ? 'danger' as const : kybStatus === 'APPROVED' || kybStatus === 'Approved' ? 'success' as const : 'warning' as const,
              orders: Number(s.orderCount || s.orders || 0),
              suspended: isSuspended,
            };
          }));
        }
      })
      .catch(() => { setError('Failed to load sellers. Showing demo data.'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading sellers...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)', borderRadius: 8, fontSize: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <span onClick={() => setError(null)} style={{ cursor: 'pointer', fontWeight: 700 }}>&times;</span>
        </div>
      )}
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>All Sellers</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>47 manufacturers &middot; CQS recalculated every 24h &middot; Auto-suspend below 40</p>
        </div>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>
          Export CSV
        </button>
      </div>

      {/* Sellers Table */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Company', 'DRAP Licence', 'Tier', 'KYB', 'CQS Score', 'Status', 'Orders'].map((h) => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.drap} style={{ background: s.suspended ? 'var(--pmx-red-light)' : 'transparent' }}>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                  <strong>{s.company}</strong>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{s.drap}</span>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <Badge type={s.tierType}>{s.tier}</Badge>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <Badge type={s.kybType}>{s.kyb}</Badge>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <CQSBadge score={s.cqs} tier={s.cqsTier} />
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <Badge type={s.statusType}>{s.status}</Badge>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                  {s.orders}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Auto-suspension warning */}
        <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--pmx-red-light)', borderRadius: 8, fontSize: 11, color: 'var(--pmx-red)' }}>
          &#9888; Karachi Pharma Ltd. auto-suspended: CQS 38.2 is below threshold of 40. Profile hidden from all buyers. Manual review required before reinstatement.
        </div>
      </div>
    </div>
  );
}
