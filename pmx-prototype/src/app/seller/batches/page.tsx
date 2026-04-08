'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DEMO_BATCHES = [
  {
    id: 'LHR-2026-0031', batch: 'LHR-2026-0031', product: 'Metformin HCl 500mg', mfg: '01 Apr 2026', expiry: '31 Mar 2028',
    size: '200,000', yield: '197,840 (98.9%)', status: 'Released', statusClass: 'success',
    coa: 'COA-031', coaClass: 'teal', deviations: '\u2014',
  },
  {
    id: 'LHR-2026-0030', batch: 'LHR-2026-0030', product: 'Atorvastatin 40mg', mfg: '28 Mar 2026', expiry: '27 Mar 2028',
    size: '150,000', yield: '\u2014', status: 'In progress', statusClass: 'info',
    coa: null, coaText: 'Pending', deviations: '\u2014',
  },
  {
    id: 'LHR-2026-0029', batch: 'LHR-2026-0029', product: 'Ciprofloxacin 500mg', mfg: '22 Mar 2026', expiry: '21 Mar 2028',
    size: '300,000', yield: '296,100 (98.7%)', status: 'Released', statusClass: 'success',
    coa: 'COA-029', coaClass: 'teal', deviations: '\u2014',
  },
  {
    id: 'LHR-2026-0028', batch: 'LHR-2026-0028', product: 'Amoxicillin 250mg', mfg: '18 Mar 2026', expiry: '17 Mar 2028',
    size: '500,000', yield: '488,200 (97.6%)', status: 'Quarantine', statusClass: 'danger',
    coa: null, coaText: 'Pending CAPA', deviations: '1 Major', devClass: 'warning',
  },
];

export default function SellerBatches() {
  const [batches, setBatches] = useState(DEMO_BATCHES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/batches')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const items = Array.isArray(d.data) ? d.data : d.data.items || [];
          if (items.length > 0) {
            const mapped = items.map((b: Record<string, unknown>) => ({
              id: String(b.id || b.batch_number || ''),
              batch: String(b.batch_number || b.batch_no || b.id || ''),
              product: b.product_inn ? `${b.product_inn} ${b.strength || ''}`.trim() : String(b.product_name || b.product || ''),
              mfg: String(b.mfg_date || b.manufacturing_date || b.manufacture_date || ''),
              expiry: String(b.expiry_date || ''),
              size: b.batch_size != null ? Number(b.batch_size).toLocaleString() : '',
              yield: b.yield_actual ? `${Number(b.yield_actual).toLocaleString()} (${b.yield_variance_pct != null ? (100 - Math.abs(Number(b.yield_variance_pct))).toFixed(1) : ''}%)` : '\u2014',
              status: String(b.status || 'Unknown'),
              statusClass: mapStatusClass(String(b.status || '')),
              coa: b.coa_ref ? String(b.coa_ref) : null,
              coaClass: b.coa_ref ? 'teal' : undefined,
              coaText: b.coa_ref ? undefined : (String(b.status) === 'QUARANTINE' ? 'Pending CAPA' : 'Pending'),
              deviations: b.deviation_count ? `${b.deviation_count} ${b.deviation_severity || ''}`.trim() : '\u2014',
              devClass: b.deviation_count ? 'warning' : undefined,
            }));
            setBatches(mapped);
          }
        }
      })
      .catch(() => { setError('Failed to load batches. Showing demo data.'); })
      .finally(() => setLoading(false));
  }, []);

  const badgeStyles: Record<string, { bg: string; color: string }> = {
    success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
    info: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
    danger: { bg: 'var(--pmx-red-light)', color: 'var(--pmx-red)' },
    warning: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
    teal: { bg: 'var(--pmx-teal-light)', color: 'var(--pmx-teal)' },
  };

  const headers = ['Batch no.', 'Product (INN)', 'Mfg. date', 'Expiry', 'Batch size', 'Yield', 'Status', 'CoA', 'Deviations'];

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading batches...</div>
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Batch Records (eBMR)</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Electronic Batch Manufacturing Records &middot; 21 CFR Part 11 compliant &middot; Audit-trailed</p>
        </div>
        <Link
          href="/seller/batches/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            background: 'var(--pmx-teal)',
            color: '#fff',
            textDecoration: 'none',
            fontFamily: 'inherit',
          }}
        >
          + New batch
        </Link>
      </div>

      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <Link
                key={b.id || b.batch}
                href={`/seller/batches/${b.id || b.batch}`}
                style={{ display: 'table-row', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
              >
                <td style={tdStyle}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--pmx-teal)' }}>
                    {b.batch}
                  </span>
                </td>
                <td style={tdStyle}>{b.product}</td>
                <td style={tdStyle}>{b.mfg}</td>
                <td style={tdStyle}>{b.expiry}</td>
                <td style={tdStyle}>{b.size}</td>
                <td style={tdStyle}>{b.yield}</td>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: badgeStyles[b.statusClass]?.bg, color: badgeStyles[b.statusClass]?.color }}>
                    {b.status}
                  </span>
                </td>
                <td style={tdStyle}>
                  {b.coa ? (
                    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--pmx-teal-light)', color: 'var(--pmx-teal)' }}>
                      {b.coa}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--pmx-tx3)', fontSize: 11 }}>{b.coaText}</span>
                  )}
                </td>
                <td style={tdStyle}>
                  {b.devClass ? (
                    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: badgeStyles[b.devClass]?.bg, color: badgeStyles[b.devClass]?.color }}>
                      {b.deviations}
                    </span>
                  ) : (
                    b.deviations
                  )}
                </td>
              </Link>
            ))}
          </tbody>
        </table>
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

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--pmx-tx2)',
  padding: '0 8px 8px 0',
  borderBottom: '0.5px solid var(--border)',
  letterSpacing: '.03em',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '9px 8px 9px 0',
  borderBottom: '0.5px solid var(--border)',
  verticalAlign: 'middle',
  fontSize: 12,
  color: 'var(--pmx-tx)',
};
