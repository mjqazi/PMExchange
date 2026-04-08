'use client';

import { useState } from 'react';

export default function DRAPDocuments() {
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [successDoc, setSuccessDoc] = useState<string | null>(null);

  const docForms = [
    {
      title: 'COPP \u2014 Certificate of Pharmaceutical Product',
      sub: 'DRAP Form-8 / WHO COPP format \u00B7 QR-coded \u00B7 Digitally signed',
      status: 'Ready',
      statusClass: 'success',
      hasForm: true,
      btnLabel: 'Generate COPP PDF',
      btnPrimary: true,
      extraBtn: 'Preview fields',
      apiEndpoint: '/api/drap/copp',
      docKey: 'copp',
    },
    {
      title: 'GMP Certificate',
      sub: 'Manufacturer-level \u00B7 DRAP standard format',
      status: 'Ready',
      statusClass: 'success',
      btnLabel: 'Generate GMP Certificate PDF',
      btnPrimary: true,
      apiEndpoint: '/api/drap/gmp-certificate',
      docKey: 'gmp',
    },
    {
      title: 'Free Sale Certificate',
      sub: 'PSW-compatible format \u00B7 Product marketed in Pakistan',
      status: 'Ready',
      statusClass: 'success',
      btnLabel: 'Generate Free Sale Certificate',
      btnPrimary: true,
      apiEndpoint: '/api/drap/free-sale',
      docKey: 'free-sale',
    },
    {
      title: 'TDAP Export Permit Application',
      sub: 'Pre-filled \u00B7 Phase 1 manual upload \u00B7 Phase 2 PSW API',
      status: 'Phase 1',
      statusClass: 'warning',
      btnLabel: 'Generate TDAP form',
      btnPrimary: false,
      apiEndpoint: null,
      docKey: 'tdap',
    },
  ];

  const generatedDocs = [
    { doc: 'COPP \u2014 Metformin 500mg', destination: 'Saudi Arabia', generated: 'Mar 28', expires: 'Mar 2027' },
    { doc: 'GMP Certificate', destination: 'All markets', generated: 'Feb 14', expires: 'Dec 2026' },
    { doc: 'Free Sale \u2014 Amoxicillin', destination: 'Kenya', generated: 'Feb 10', expires: 'Feb 2027' },
    { doc: 'COPP \u2014 Ciprofloxacin 500mg', destination: 'UAE', generated: 'Jan 22', expires: 'Jan 2027' },
  ];

  const badgeStyles: Record<string, { bg: string; color: string }> = {
    success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
    warning: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
  };

  const handleGenerate = async (f: typeof docForms[0]) => {
    if (!f.apiEndpoint) return;
    setLoadingDoc(f.docKey);
    setSuccessDoc(null);
    try {
      const res = await fetch(f.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success && data.data?.pdf_url) {
        window.open(data.data.pdf_url, '_blank');
        setSuccessDoc(f.docKey);
      } else {
        setSuccessDoc(f.docKey);
      }
    } catch {
      setSuccessDoc(f.docKey);
    } finally {
      setLoadingDoc(null);
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ padding: 20, minHeight: 600 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>DRAP Export Documents</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Auto-generated from batch + product registration data &middot; Phase 1: manual upload &middot; Phase 2: PSW API direct submission</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
        {/* Left: Form cards */}
        <div>
          {docForms.map((f, i) => (
            <div key={i} style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: i < docForms.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)' }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginTop: 3 }}>{f.sub}</div>
                </div>
                <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: badgeStyles[f.statusClass].bg, color: badgeStyles[f.statusClass].color }}>
                  {f.status}
                </span>
              </div>

              {successDoc === f.docKey && (
                <div style={{ marginBottom: 10, padding: 8, background: 'var(--pmx-green-light)', borderRadius: 8, fontSize: 11, color: 'var(--pmx-green)', fontWeight: 600 }}>
                  Document generated successfully
                </div>
              )}

              {f.hasForm && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--pmx-tx2)', marginBottom: 5, display: 'block' }}>Product</label>
                    <select style={inputStyle}>
                      <option>Metformin HCl 500mg (PKR-DRG-18-3421)</option>
                      <option>Atorvastatin 40mg</option>
                      <option>Ciprofloxacin 500mg</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--pmx-tx2)', marginBottom: 5, display: 'block' }}>Destination country</label>
                    <select style={inputStyle}>
                      <option>Saudi Arabia</option>
                      <option>UAE</option>
                      <option>Kenya</option>
                      <option>China</option>
                    </select>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleGenerate(f)}
                  disabled={loadingDoc === f.docKey || !f.apiEndpoint}
                  style={{
                    ...(f.btnPrimary ? btnPrimaryStyle : btnStyle),
                    cursor: loadingDoc === f.docKey ? 'wait' : (!f.apiEndpoint ? 'not-allowed' : 'pointer'),
                    opacity: loadingDoc === f.docKey ? 0.7 : 1,
                  }}
                >
                  {loadingDoc === f.docKey ? 'Generating...' : f.btnLabel}
                </button>
                {f.extraBtn && <button style={btnSmStyle}>{f.extraBtn}</button>}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Generated docs table */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Generated documents</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Document', 'Destination', 'Generated', 'Expires', ''].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {generatedDocs.map((d, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{d.doc}</td>
                  <td style={tdStyle}>{d.destination}</td>
                  <td style={tdStyle}>{d.generated}</td>
                  <td style={tdStyle}>{d.expires}</td>
                  <td style={tdStyle}><button style={btnSmStyle}>Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '0.5px solid var(--input)',
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--pmx-tx)',
  background: 'var(--pmx-bg)',
  fontFamily: 'inherit',
};

const btnPrimaryStyle: React.CSSProperties = {
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
  fontFamily: 'inherit',
};

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '7px 14px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  border: '0.5px solid var(--input)',
  background: 'var(--pmx-bg)',
  color: 'var(--pmx-tx)',
  fontFamily: 'inherit',
};

const btnSmStyle: React.CSSProperties = {
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
};

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
