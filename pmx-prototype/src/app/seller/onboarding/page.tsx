'use client';

import { useState, useEffect } from 'react';

const DEMO_GATES = [
  { num: 1, label: 'Gate 1', sub: 'Docs uploaded', status: 'done' },
  { num: 2, label: 'Gate 2', sub: 'KYB verification', status: 'current' },
  { num: 3, label: 'Gate 3', sub: 'Compliance session', status: 'pending' },
  { num: 4, label: 'Gate 4', sub: 'Platform config', status: 'pending' },
];

const DEMO_KYB_DOCS = [
  { name: 'DRAP Manufacturing Licence', detail: 'MFG-0217-2021 \u00B7 Expires Dec 2027', status: 'Verified', statusClass: 'success', dot: 'var(--pmx-green)', mock: 'DRAP API' },
  { name: 'SECP Registration', detail: '0098765 \u00B7 Active since 2015', status: 'Verified', statusClass: 'success', dot: 'var(--pmx-green)', mock: 'SECP API' },
  { name: 'FBR NTN Certificate', detail: '4212098-3 \u00B7 Company name matches', status: 'Verified', statusClass: 'success', dot: 'var(--pmx-green)', mock: 'FBR API' },
  { name: 'FATF / AML Screening', detail: 'Directors screened \u2014 no PEP/FATF matches', status: 'Clear', statusClass: 'success', dot: 'var(--pmx-green)', mock: 'AML API' },
  { name: 'Bank Account Letter (HBL)', detail: 'A/C ****4421 confirmed', status: 'Verified', statusClass: 'success', dot: 'var(--pmx-green)', mock: null },
  { name: 'Product Registration List', detail: '14 products \u00B7 2 discrepancies found', status: 'Under review', statusClass: 'warning', dot: 'var(--pmx-amber)', mock: null },
  { name: 'QC Lab Qualification', detail: 'Required for Tier 2 only', status: 'Not uploaded', statusClass: 'danger', dot: 'var(--pmx-red)', mock: null },
];

const DEMO_HEADER = {
  title: 'Seller Onboarding \u2014 Faisalabad Meds Co.',
  subtitle: 'DRAP: MFG-0217-2021 \u00B7 NTN: 4212098-3 \u00B7 Target: Tier 1',
  gateBadge: 'Gate 2 in progress',
};

export default function SellerOnboarding() {
  const [notes, setNotes] = useState('Product list: 2 products listed under old DRAP codes. Acceptable for Tier 1 approval. Proceed.');
  const [gates, setGates] = useState(DEMO_GATES);
  const [kybDocs, setKybDocs] = useState(DEMO_KYB_DOCS);
  const [header, setHeader] = useState(DEMO_HEADER);

  useEffect(() => {
    // First get auth info for manufacturer_id
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((authData) => {
        if (authData?.data) {
          const mfrId = authData.data.manufacturer_id;
          if (mfrId) {
            fetch(`/api/sellers/${mfrId}/onboarding`)
              .then((r) => r.json())
              .then((d) => {
                if (d.success && d.data) {
                  const ob = d.data;

                  // Map header
                  if (ob.manufacturer_name || ob.company_name) {
                    setHeader({
                      title: `Seller Onboarding \u2014 ${ob.manufacturer_name || ob.company_name}`,
                      subtitle: ob.subtitle || `DRAP: ${ob.drap_licence || ''} \u00B7 NTN: ${ob.ntn || ''} \u00B7 Target: ${ob.target_tier || 'Tier 1'}`,
                      gateBadge: ob.current_gate_label || DEMO_HEADER.gateBadge,
                    });
                  }

                  // Map gates
                  if (ob.gates && Array.isArray(ob.gates) && ob.gates.length > 0) {
                    setGates(ob.gates.map((g: Record<string, unknown>) => ({
                      num: Number(g.num || g.gate_number || 0),
                      label: String(g.label || `Gate ${g.num || g.gate_number}`),
                      sub: String(g.sub || g.description || ''),
                      status: String(g.status || 'pending'),
                    })));
                  }

                  // Map KYB docs
                  if (ob.kyb_docs && Array.isArray(ob.kyb_docs) && ob.kyb_docs.length > 0) {
                    setKybDocs(ob.kyb_docs.map((doc: Record<string, unknown>) => ({
                      name: String(doc.name || doc.document_name || ''),
                      detail: String(doc.detail || doc.description || ''),
                      status: String(doc.status || 'Pending'),
                      statusClass: mapDocStatusClass(String(doc.status || '')),
                      dot: mapDocDot(String(doc.status || '')),
                      mock: doc.mock ? String(doc.mock) : doc.api_source ? String(doc.api_source) : null,
                    })));
                  }

                  // Map notes
                  if (ob.notes) setNotes(ob.notes);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

  const badgeStyles: Record<string, { bg: string; color: string }> = {
    success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
    warning: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
    danger: { bg: 'var(--pmx-red-light)', color: 'var(--pmx-red)' },
  };

  const verifiedCount = kybDocs.filter(d => d.statusClass === 'success').length;

  return (
    <div className="animate-fade-in-up" style={{ padding: 20, minHeight: 600 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>{header.title}</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>{header.subtitle}</p>
        </div>
        <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' }}>{header.gateBadge}</span>
      </div>

      {/* Gate Stepper */}
      <div style={{ display: 'flex', background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        {gates.map((g, i) => (
          <div key={g.num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 6,
                border: '1.5px solid',
                position: 'relative',
                zIndex: 1,
                background: g.status === 'done' ? 'var(--pmx-green-light)' : g.status === 'current' ? 'var(--pmx-teal-light)' : 'var(--pmx-bg)',
                color: g.status === 'done' ? 'var(--pmx-green)' : g.status === 'current' ? 'var(--pmx-teal)' : 'var(--pmx-tx3)',
                borderColor: g.status === 'done' ? 'var(--pmx-green)' : g.status === 'current' ? 'var(--pmx-teal)' : 'var(--input)',
              }}
            >
              {g.status === 'done' ? '\u2713' : g.num}
            </div>
            {i < gates.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  right: '-50%',
                  height: 1.5,
                  background: g.status === 'done' ? 'var(--pmx-green)' : 'var(--input)',
                }}
              />
            )}
            <div style={{ fontSize: 11, textAlign: 'center', color: g.status === 'current' ? 'var(--pmx-teal)' : 'var(--pmx-tx2)', fontWeight: g.status === 'current' ? 600 : 400 }}>
              {g.label}<br /><strong>{g.sub}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
        {/* Left: KYB docs */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)' }}>Gate 2 — KYB Document Verification</div>
            <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' }}>{verifiedCount} of {kybDocs.length} verified</span>
          </div>
          {kybDocs.map((doc, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: i < kybDocs.length - 1 ? '0.5px solid var(--border)' : 'none',
                fontSize: 12,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: doc.dot, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{doc.name}</div>
                <div style={{ fontSize: 11, color: 'var(--pmx-tx2)' }}>{doc.detail}</div>
              </div>
              <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: badgeStyles[doc.statusClass]?.bg, color: badgeStyles[doc.statusClass]?.color }}>
                {doc.status}
              </span>
              {doc.mock && (
                <span style={{ display: 'inline-block', padding: '1px 5px', background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)', fontSize: 9, fontWeight: 700, borderRadius: 3, letterSpacing: '.04em' }}>
                  {doc.mock}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Right: Admin verification + Gate 3 */}
        <div>
          <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Admin verification</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--pmx-tx2)', marginBottom: 5, display: 'block' }}>Gate 2 notes</label>
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
                placeholder="Document decisions, discrepancies, conditions..."
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'var(--pmx-teal)',
                  color: '#fff',
                  fontFamily: 'inherit',
                }}
              >
                Approve Gate 2 &rarr;
              </button>
              <button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: 'var(--pmx-red-light)',
                  color: 'var(--pmx-red)',
                  border: '0.5px solid var(--pmx-red)',
                  fontFamily: 'inherit',
                }}
              >
                Reject
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Gate 3 — Schedule compliance session</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--pmx-tx2)', marginBottom: 5, display: 'block' }}>Session date</label>
              <input
                type="date"
                defaultValue="2026-04-15"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '0.5px solid var(--input)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--pmx-tx)',
                  background: 'var(--pmx-bg)',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--pmx-tx2)', marginBottom: 5, display: 'block' }}>Compliance officer</label>
              <select
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '0.5px solid var(--input)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--pmx-tx)',
                  background: 'var(--pmx-bg)',
                  fontFamily: 'inherit',
                }}
              >
                <option>Arshad Rahim Khan (PMX)</option>
                <option>Nasir Rizwan Hashmi (PMX)</option>
              </select>
            </div>
            <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: 10 }}>
              Gate 3 is a live compliance mapping session. Gate 2 must be approved first.
            </div>
            <button
              disabled
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'not-allowed',
                border: '0.5px solid var(--input)',
                background: 'var(--pmx-bg)',
                color: 'var(--pmx-tx3)',
                fontFamily: 'inherit',
                opacity: 0.6,
              }}
            >
              Schedule (requires Gate 2 approval)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function mapDocStatusClass(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'verified' || s === 'clear' || s === 'approved') return 'success';
  if (s === 'under review' || s === 'pending') return 'warning';
  if (s === 'not uploaded' || s === 'rejected' || s === 'missing') return 'danger';
  return 'warning';
}

function mapDocDot(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'verified' || s === 'clear' || s === 'approved') return 'var(--pmx-green)';
  if (s === 'under review' || s === 'pending') return 'var(--pmx-amber)';
  if (s === 'not uploaded' || s === 'rejected' || s === 'missing') return 'var(--pmx-red)';
  return 'var(--pmx-amber)';
}
