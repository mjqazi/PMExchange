'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

const DEMO_KYB_QUEUE = [
  {
    id: 'faisalabad-meds',
    company: 'Faisalabad Meds Co.',
    ntn: '4212098-3',
    drap: 'MFG-0217-2021',
    gate: 'Gate 2 \u2014 KYB review',
    gateType: 'warning' as const,
    docs: '5/7 verified \u00B7 1 pending \u00B7 1 missing',
    submitted: '5h ago',
    actionLabel: 'Review',
    actionPrimary: true,
  },
  {
    id: 'islamabad-biomed',
    company: 'Islamabad BioMed Ltd.',
    ntn: '1101543-8',
    drap: 'MFG-0312-2019',
    gate: 'Gate 3 \u2014 Session',
    gateType: 'info' as const,
    docs: 'All docs verified \u2713',
    submitted: '1d ago',
    actionLabel: 'Schedule session',
    actionPrimary: false,
  },
  {
    id: 'rawalpindi-pharma',
    company: 'Rawalpindi Pharma',
    ntn: '3712891-1',
    drap: 'MFG-0521-2022',
    gate: 'Gate 1 \u2014 Upload',
    gateType: 'neutral' as const,
    docs: '4/7 uploaded',
    submitted: '2d ago',
    actionLabel: 'View docs',
    actionPrimary: false,
  },
];

const timeouts = [
  {
    order: 'ORD-2026-0039',
    stage: 'CONTRACT_GENERATED',
    rule: '5-day signing window',
    remaining: '2 days left',
    remainColor: 'var(--pmx-red)',
  },
  {
    order: 'ORD-2026-0035',
    stage: 'NEGOTIATING',
    rule: '14-day inactivity',
    remaining: '5 days left',
    remainColor: 'var(--pmx-amber)',
  },
];

export default function KYBQueue() {
  const [kybQueue, setKybQueue] = useState(DEMO_KYB_QUEUE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/kyb/queue')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          setKybQueue(d.data.map((item: Record<string, unknown>) => {
            const gateNum = Number(item.gate || item.currentGate || 1);
            const gateLabels: Record<number, string> = { 1: 'Gate 1 \u2014 Upload', 2: 'Gate 2 \u2014 KYB review', 3: 'Gate 3 \u2014 Session', 4: 'Gate 4 \u2014 Final' };
            const gateTypes: Record<number, 'neutral' | 'warning' | 'info' | 'success'> = { 1: 'neutral', 2: 'warning', 3: 'info', 4: 'success' };
            return {
              id: String(item.sellerId || item.id || ''),
              company: String(item.companyName || item.company || ''),
              ntn: String(item.ntn || ''),
              drap: String(item.drapLicence || item.drap || ''),
              gate: String(item.gateLabel || gateLabels[gateNum] || `Gate ${gateNum}`),
              gateType: (item.gateType as 'warning' | 'info' | 'neutral') || gateTypes[gateNum] || 'neutral',
              docs: String(item.docsStatus || item.docs || ''),
              submitted: String(item.submitted || item.submittedAt || ''),
              actionLabel: gateNum === 2 ? 'Review' : gateNum === 3 ? 'Schedule session' : 'View docs',
              actionPrimary: gateNum === 2,
            };
          }));
        }
      })
      .catch(() => { setError('Failed to load KYB queue. Showing demo data.'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading KYB queue...</div>
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
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>KYB Verification Queue</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Seller onboarding &middot; 4-gate process &middot; DRAP/SECP/FBR/FATF verification</p>
        </div>
        <Badge type="warning">3 pending</Badge>
      </div>

      {/* KYB Queue Table */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Company', 'DRAP Licence', 'Gate', 'Documents', 'Submitted', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kybQueue.map((row) => (
              <tr key={row.id}>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                  <div style={{ fontWeight: 700 }}>{row.company}</div>
                  <div style={{ fontSize: 11, color: 'var(--pmx-tx2)' }}>NTN: {row.ntn}</div>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{row.drap}</span>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <Badge type={row.gateType}>{row.gate}</Badge>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 11 }}>{row.docs}</td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 11, color: 'var(--pmx-tx2)' }}>{row.submitted}</td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  {row.actionPrimary ? (
                    <Link
                      href={`/admin/kyb/${row.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 9px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: '0.5px solid transparent',
                        background: 'var(--pmx-teal)',
                        color: '#fff',
                        textDecoration: 'none',
                      }}
                    >
                      {row.actionLabel} &#8599;
                    </Link>
                  ) : (
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>
                      {row.actionLabel}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Timeout Monitor */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Order lifecycle timeout monitor</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Order', 'Stage', 'Timeout rule', 'Time remaining', 'Action'].map((h) => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeouts.map((t) => (
              <tr key={t.order}>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{t.order}</span>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>{t.stage}</td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>{t.rule}</td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12, color: t.remainColor, fontWeight: 700 }}>{t.remaining}</td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>
                    Notify parties
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit', marginTop: 10 }}>
          Run timeout checker now
        </button>
      </div>
    </div>
  );
}
