'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

const MockTag = () => (
  <span style={{ display: 'inline-block', padding: '1px 5px', background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)', fontSize: 9, fontWeight: 700, borderRadius: 3, letterSpacing: '.04em', marginLeft: 4 }}>
    MOCK API
  </span>
);

const checks = [
  { icon: '\u2713', iconBg: 'var(--pmx-green-light)', iconColor: 'var(--pmx-green)', title: 'DRAP Licence \u2014 Active', desc: 'MFG-0217-2021 \u00B7 Expires Dec 2027 \u00B7 Not suspended', badge: 'Verified', badgeType: 'success' as const, mock: true },
  { icon: '\u2713', iconBg: 'var(--pmx-green-light)', iconColor: 'var(--pmx-green)', title: 'SECP Registration \u2014 Active', desc: 'Company name matches \u00B7 Directors confirmed', badge: 'Verified', badgeType: 'success' as const, mock: true },
  { icon: '\u2713', iconBg: 'var(--pmx-green-light)', iconColor: 'var(--pmx-green)', title: 'FBR NTN \u2014 Valid', desc: '4212098-3 \u00B7 Company name matches NTN records', badge: 'Verified', badgeType: 'success' as const, mock: true },
  { icon: '\u2713', iconBg: 'var(--pmx-green-light)', iconColor: 'var(--pmx-green)', title: 'FATF / AML \u2014 Clear', desc: 'Directors screened \u00B7 No PEP/FATF/OFAC matches', badge: 'Clear', badgeType: 'success' as const, mock: true },
  { icon: '\u2713', iconBg: 'var(--pmx-green-light)', iconColor: 'var(--pmx-green)', title: 'Bank Account Letter', desc: 'HBL \u00B7 A/C ****4421 confirmed', badge: 'Verified', badgeType: 'success' as const, mock: false },
  { icon: '!', iconBg: 'var(--pmx-amber-light)', iconColor: 'var(--pmx-amber)', title: 'Product Registration List', desc: '14 products \u00B7 2 using old DRAP codes', badge: 'Reviewing', badgeType: 'warning' as const, mock: false },
  { icon: '\u00D7', iconBg: 'var(--pmx-red-light)', iconColor: 'var(--pmx-red)', title: 'QC Lab Qualification', desc: 'Not required for Tier 1 application', badge: 'N/A (Tier 1)', badgeType: 'neutral' as const, mock: false },
];

const documents = [
  { name: 'DRAP Licence (scan)', uploaded: 'Apr 5, 08:30', status: 'Verified', statusType: 'success' as const },
  { name: 'SECP Certificate', uploaded: 'Apr 5, 08:32', status: 'Verified', statusType: 'success' as const },
  { name: 'NTN Certificate', uploaded: 'Apr 5, 08:35', status: 'Verified', statusType: 'success' as const },
  { name: 'Bank Letter (HBL)', uploaded: 'Apr 5, 08:40', status: 'Verified', statusType: 'success' as const },
  { name: 'Product Registration List', uploaded: 'Apr 5, 08:45', status: 'Under review', statusType: 'warning' as const },
];

export default function GateReview() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.sellerId as string;
  const [notes, setNotes] = useState('Product list: 2 products listed under old DRAP codes. Acceptable for Tier 1 approval. Seller to update during Gate 4.');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [actionStatus, setActionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetch(`/api/sellers/${sellerId}/onboarding`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          // Could update checks/documents with real data if available
          if (d.data.notes) setNotes(d.data.notes);
        }
      })
      .catch(() => {});
  }, [sellerId]);

  const handleApprove = async () => {
    setApproving(true);
    setActionStatus('idle');
    try {
      const res = await fetch(`/api/admin/kyb/${sellerId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gate: 'GATE_2', notes }),
      });
      const d = await res.json();
      if (d.success) {
        setActionStatus('success');
        setTimeout(() => router.push('/admin/kyb'), 1500);
      } else {
        setActionStatus('error');
      }
    } catch {
      setActionStatus('error');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    setActionStatus('idle');
    try {
      const res = await fetch(`/api/admin/kyb/${sellerId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const d = await res.json();
      if (d.success) {
        setActionStatus('success');
        setTimeout(() => router.push('/admin/kyb'), 1500);
      } else {
        setActionStatus('error');
      }
    } catch {
      setActionStatus('error');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 11, color: 'var(--pmx-tx3)', marginBottom: 12 }}>
        <Link href="/admin/dashboard" style={{ color: 'var(--pmx-tx3)', textDecoration: 'none' }}>Admin</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <Link href="/admin/kyb" style={{ color: 'var(--pmx-tx3)', textDecoration: 'none' }}>KYB Queue</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: 'var(--pmx-tx2)' }}>{sellerId}</span>
      </nav>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Gate 2 Review &mdash; Faisalabad Meds Co.</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>DRAP: MFG-0217-2021 &middot; NTN: 4212098-3 &middot; Target: Tier 1</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {actionStatus === 'success' && <span style={{ fontSize: 11, color: 'var(--pmx-green)', fontWeight: 600 }}>Action completed!</span>}
          {actionStatus === 'error' && <span style={{ fontSize: 11, color: 'var(--pmx-red)', fontWeight: 600 }}>Action failed</span>}
          <button
            disabled={rejecting || approving}
            onClick={handleReject}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: rejecting ? 'wait' : 'pointer', border: '0.5px solid var(--pmx-red)', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', fontFamily: 'inherit', opacity: rejecting ? 0.6 : 1 }}>
            {rejecting ? 'Rejecting...' : 'Reject \u2014 request more docs'}
          </button>
          <button
            disabled={approving || rejecting}
            onClick={handleApprove}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: approving ? 'wait' : 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit', opacity: approving ? 0.6 : 1 }}>
            {approving ? 'Approving...' : 'Approve Gate 2 \u2192'}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
        {/* Left: KYB Verification Checks */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, margin: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>KYB verification checks</div>
          {checks.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: i < checks.length - 1 ? '0.5px solid var(--border)' : 'none',
                fontSize: 12,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: c.iconBg,
                  color: c.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: c.icon === '!' || c.icon === '\u00D7' ? 14 : 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {c.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: 'var(--pmx-tx2)' }}>{c.desc}</div>
              </div>
              <Badge type={c.badgeType}>{c.badge}</Badge>
              {c.mock && <MockTag />}
            </div>
          ))}
        </div>

        {/* Right column */}
        <div>
          {/* Uploaded Documents */}
          <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Uploaded documents</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Document', 'Uploaded', 'Status', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.name}>
                    <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 11 }}>{d.name}</td>
                    <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 11 }}>{d.uploaded}</td>
                    <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                      <Badge type={d.statusType}>{d.status}</Badge>
                    </td>
                    <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                      <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Verification Notes */}
          <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, margin: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Verification notes</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--pmx-tx2)', marginBottom: 5, display: 'block' }}>Admin decision notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                disabled={approving || rejecting}
                onClick={handleApprove}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: approving ? 'wait' : 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit', opacity: approving ? 0.6 : 1 }}>
                {approving ? 'Approving...' : 'Approve Gate 2 \u2014 advance to Gate 3 \u2192'}
              </button>
              <button
                disabled={rejecting || approving}
                onClick={handleReject}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: rejecting ? 'wait' : 'pointer', border: '0.5px solid var(--pmx-red)', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', fontFamily: 'inherit', opacity: rejecting ? 0.6 : 1 }}>
                {rejecting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
