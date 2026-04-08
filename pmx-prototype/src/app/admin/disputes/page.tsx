'use client';

import { useState } from 'react';

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

const closedDisputes = [
  { order: 'ORD-2026-0029', raisedBy: 'Seller', resolution: 'Buyer refund 100%', closed: 'Mar 28' },
  { order: 'ORD-2026-0025', raisedBy: 'Buyer', resolution: 'Partial \u2014 60% to seller', closed: 'Mar 15' },
];

export default function DisputesPage() {
  const [notes, setNotes] = useState('');
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolveStatus, setResolveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleResolve = async (disputeOrderId: string, action: 'release' | 'refund' | 'partial') => {
    setResolving(action);
    setResolveStatus('idle');
    try {
      const res = await fetch(`/api/admin/disputes/${disputeOrderId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });
      const d = await res.json();
      setResolveStatus(d.success ? 'success' : 'error');
    } catch {
      setResolveStatus('error');
    } finally {
      setResolving(null);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Disputes</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Open disputes pause escrow auto-release &middot; Both parties notified &middot; PMX Admin arbitrates</p>
        </div>
      </div>

      {/* Open Dispute */}
      <div
        style={{
          background: 'var(--pmx-bg)',
          border: '1px solid var(--pmx-red)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Dispute &mdash; ORD-2026-0033</div>
            <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginTop: 2 }}>
              Raised by Gulf Medical LLC &middot; Apr 3 &middot; Amoxicillin 250mg &middot; Within 3-day window
            </div>
          </div>
          <Badge type="danger">Open &middot; Escrow held</Badge>
        </div>

        {/* Dispute text */}
        <div
          style={{
            fontSize: 12,
            padding: 10,
            background: 'var(--pmx-red-light)',
            borderRadius: 8,
            marginBottom: 12,
            fontStyle: 'italic',
          }}
        >
          &ldquo;Batch received with 4 units per blister instead of contracted 10 per blister. Packaging does not match specification in the PMX Supply Agreement. Requesting re-delivery or partial refund.&rdquo;
        </div>

        {/* Escrow + filed info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--pmx-tx2)', marginBottom: 5, display: 'block' }}>Escrow amount held</label>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-red)' }}>USD 67,000 &mdash; ON HOLD</div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--pmx-tx2)', marginBottom: 5, display: 'block' }}>Dispute filed at</label>
            <div style={{ fontSize: 13 }}>Apr 3, 2026 18:42 UTC</div>
          </div>
        </div>

        {/* Resolution notes */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--pmx-tx2)', marginBottom: 5, display: 'block' }}>PMX Admin resolution notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document investigation, evidence reviewed, and resolution decision..."
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '0.5px solid var(--input)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--pmx-tx)',
              background: 'var(--pmx-bg)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Action buttons */}
        {resolveStatus === 'success' && (
          <div style={{ padding: '8px 12px', background: 'var(--pmx-green-light)', color: 'var(--pmx-green)', borderRadius: 8, fontSize: 12, fontWeight: 500, marginTop: 8 }}>
            Dispute resolved successfully!
          </div>
        )}
        {resolveStatus === 'error' && (
          <div style={{ padding: '8px 12px', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', borderRadius: 8, fontSize: 12, fontWeight: 500, marginTop: 8 }}>
            Failed to resolve dispute. Please try again.
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            disabled={resolving !== null}
            onClick={() => handleResolve('ORD-2026-0033', 'release')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: resolving ? 'wait' : 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit', opacity: resolving === 'release' ? 0.6 : 1 }}>
            {resolving === 'release' ? 'Processing...' : 'Release escrow to seller (seller prevails)'}
          </button>
          <button
            disabled={resolving !== null}
            onClick={() => handleResolve('ORD-2026-0033', 'partial')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: resolving ? 'wait' : 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit', opacity: resolving === 'partial' ? 0.6 : 1 }}>
            {resolving === 'partial' ? 'Processing...' : 'Partial settlement'}
          </button>
          <button
            disabled={resolving !== null}
            onClick={() => handleResolve('ORD-2026-0033', 'refund')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: resolving ? 'wait' : 'pointer', border: '0.5px solid var(--pmx-red)', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', fontFamily: 'inherit', opacity: resolving === 'refund' ? 0.6 : 1 }}>
            {resolving === 'refund' ? 'Processing...' : 'Full refund to buyer'}
          </button>
        </div>
      </div>

      {/* Closed Disputes */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Closed disputes &mdash; last 30 days</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Order', 'Raised by', 'Resolution', 'Closed at'].map((h) => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {closedDisputes.map((d) => (
              <tr key={d.order}>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{d.order}</span>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>{d.raisedBy}</td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>{d.resolution}</td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>{d.closed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
