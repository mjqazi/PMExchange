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

const DEMO_BUYERS = [
  { company: 'Gulf Medical LLC', country: 'Saudi Arabia', type: 'Institutional', typeTag: 'info' as const, verification: 'Verified', verType: 'success' as const, credit: '$2,000,000', transactions: 7, status: 'Active', statusType: 'success' as const },
  { company: 'Al-Zahrawi Pharma', country: 'UAE', type: 'Commercial', typeTag: 'neutral' as const, verification: 'Verified', verType: 'success' as const, credit: '$500,000', transactions: 3, status: 'Active', statusType: 'success' as const },
  { company: 'Fengtai Imports Co.', country: 'China', type: 'Fengtai', typeTag: 'teal' as const, verification: 'Verified', verType: 'success' as const, credit: '$5,000,000', transactions: 2, status: 'Active', statusType: 'success' as const },
  { company: 'East Africa Health Ltd.', country: 'Kenya', type: 'Institutional', typeTag: 'info' as const, verification: 'Pending', verType: 'warning' as const, credit: '\u2014', transactions: 0, status: 'Pending KYB', statusType: 'warning' as const },
];

export default function BuyersPage() {
  const [buyers, setBuyers] = useState(DEMO_BUYERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/buyers')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          setBuyers(d.data.map((b: Record<string, unknown>) => {
            const verified = b.verified === true || b.verification === 'Verified' || b.kybStatus === 'APPROVED';
            const typeTagMap: Record<string, 'info' | 'neutral' | 'teal'> = { Institutional: 'info', Commercial: 'neutral', Fengtai: 'teal' };
            const buyerType = String(b.buyerType || b.type || 'Commercial');
            return {
              company: String(b.companyName || b.company || ''),
              country: String(b.country || ''),
              type: buyerType,
              typeTag: typeTagMap[buyerType] || 'neutral' as const,
              verification: verified ? 'Verified' : 'Pending',
              verType: verified ? 'success' as const : 'warning' as const,
              credit: String(b.creditLimit || b.credit || '\u2014'),
              transactions: Number(b.transactionCount || b.transactions || 0),
              status: verified ? 'Active' : 'Pending KYB',
              statusType: verified ? 'success' as const : 'warning' as const,
            };
          }));
        }
      })
      .catch(() => { setError('Failed to load buyers. Showing demo data.'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading buyers...</div>
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
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Buyer Management</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>23 verified buyers &middot; KYB verification &middot; Credit limit management</p>
        </div>
      </div>

      {/* Buyers Table */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Company', 'Country', 'Type', 'Verification', 'Credit limit', 'Transactions', 'Status'].map((h) => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {buyers.map((b) => (
              <tr key={b.company}>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                  <strong>{b.company}</strong>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                  {b.country}
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <Badge type={b.typeTag}>{b.type}</Badge>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <Badge type={b.verType}>{b.verification}</Badge>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                  {b.credit}
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                  {b.transactions}
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <Badge type={b.statusType}>{b.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
