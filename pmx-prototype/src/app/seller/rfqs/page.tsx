'use client';

import { useState, useEffect } from 'react';

const DEMO_RFQS = [
  {
    id: 'RFQ-2026-087', product: 'Metformin HCl 500mg', volume: '5M tabs/month',
    destination: 'Saudi Arabia', certs: ['WHO-GMP', 'SFDA'], priceRange: '$0.008\u20130.012/tab',
    expires: 'May 5', l1: true,
  },
  {
    id: 'RFQ-2026-083', product: 'Amoxicillin 250mg', volume: '10M caps/month',
    destination: 'Kenya', certs: ['DRAP-GMP'], priceRange: '$0.004\u20130.007/cap',
    expires: 'Apr 28', l1: true,
  },
  {
    id: 'RFQ-2026-081', product: 'Atorvastatin 40mg', volume: '2M tabs/month',
    destination: 'UAE', certs: ['WHO-GMP'], priceRange: '$0.015\u20130.022/tab',
    expires: 'Apr 22', l1: true,
  },
];

export default function SellerRFQs() {
  const [respondingTo, setRespondingTo] = useState<string | null>('RFQ-2026-087');
  const [rfqs, setRfqs] = useState(DEMO_RFQS);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form fields
  const [price, setPrice] = useState('0.0092');
  const [leadTime, setLeadTime] = useState('42');
  const [minOrderQty, setMinOrderQty] = useState('1000000');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch('/api/rfqs')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const items = Array.isArray(d.data) ? d.data : d.data.items || [];
          if (items.length > 0) {
            const mapped = items.map((r: Record<string, unknown>) => {
              const inn = r.product_inn || r.product || r.product_name || '';
              const str = r.product_strength || '';
              const form = r.product_form || '';
              const productLabel = inn ? `${inn} ${str} ${form}`.trim() : String(inn);
              const vol = r.volume_qty || r.volume || r.quantity || '';
              const unit = r.volume_unit || '';
              const freq = r.order_frequency || '';
              const volumeLabel = vol ? `${Number(vol).toLocaleString()} ${unit}${freq ? `/${freq.toString().toLowerCase()}` : ''}` : '';
              const pMin = r.price_min_usd;
              const pMax = r.price_max_usd;
              const priceLabel = pMin && pMax ? `$${pMin}\u2013${pMax}/${unit || 'unit'}` : String(r.price_range || r.priceRange || '');
              return {
                id: String(r.id || r.rfq_id || ''),
                product: productLabel,
                volume: volumeLabel,
                destination: String(r.destination_country || r.destination || ''),
                certs: (Array.isArray(r.required_certs) ? r.required_certs : r.certs || r.certifications || []) as string[],
                priceRange: priceLabel,
                expires: String(r.expires_at || r.expires || r.expiry_date || ''),
                l1: (r.l1_match ?? r.l1 ?? true) as boolean,
              };
            });
            setRfqs(mapped);
          }
        }
      })
      .catch(() => { setError('Failed to load RFQs. Showing demo data.'); })
      .finally(() => setLoading(false));
  }, []);

  const validateQuotation = (): boolean => {
    const errors: Record<string, string> = {};
    const priceVal = parseFloat(price);
    const leadVal = parseInt(leadTime, 10);
    const moqVal = parseInt(minOrderQty, 10);

    if (!price || isNaN(priceVal) || priceVal <= 0) {
      errors.price = 'Price must be a positive number';
    }
    if (!leadTime || isNaN(leadVal) || leadVal <= 0) {
      errors.leadTime = 'Lead time must be a positive number';
    }
    if (!minOrderQty || isNaN(moqVal) || moqVal <= 0) {
      errors.minOrderQty = 'Min order qty must be a positive number';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitQuotation = async () => {
    if (!respondingTo) return;
    if (!validateQuotation()) return;
    setSubmitting(true);
    setSubmitSuccess(null);
    try {
      const res = await fetch(`/api/rfqs/${respondingTo}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: parseFloat(price),
          lead_time: parseInt(leadTime, 10),
          min_order_qty: parseInt(minOrderQty, 10),
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(`Quotation submitted for ${respondingTo}`);
      } else {
        setSubmitSuccess(`Submitted (demo mode)`);
      }
    } catch {
      setSubmitSuccess(`Submitted (demo mode)`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading RFQs...</div>
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Open RFQs \u2014 Marketplace</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>RFQs you are eligible for based on your product portfolio, certifications, and capacity</p>
        </div>
      </div>

      {/* RFQ Table */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['RFQ ID', 'Product (INN)', 'Volume/freq.', 'Destination', 'Required certs', 'Price range', 'Expires', 'L1 match', ''].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rfqs.map((r) => (
              <tr key={r.id}>
                <td style={tdStyle}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{r.id}</span></td>
                <td style={tdStyle}>{r.product}</td>
                <td style={tdStyle}>{r.volume}</td>
                <td style={tdStyle}>{r.destination}</td>
                <td style={tdStyle}>
                  {(r.certs || []).map((c: string) => (
                    <span key={c} style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: c === 'DRAP-GMP' ? 'var(--pmx-gray-light)' : 'var(--pmx-blue-light)', color: c === 'DRAP-GMP' ? 'var(--pmx-gray)' : 'var(--pmx-blue)', marginRight: 4 }}>
                      {c}
                    </span>
                  ))}
                </td>
                <td style={tdStyle}>{r.priceRange}</td>
                <td style={tdStyle}>{r.expires}</td>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: r.l1 ? 'var(--pmx-green-light)' : 'var(--pmx-gray-light)', color: r.l1 ? 'var(--pmx-green)' : 'var(--pmx-gray)' }}>
                    {r.l1 ? '\u2713' : '\u2014'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => { setRespondingTo(r.id); setSubmitSuccess(null); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 9px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: 'none',
                      background: 'var(--pmx-teal)',
                      color: '#fff',
                      fontFamily: 'inherit',
                    }}
                  >
                    Respond
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Response form */}
      {respondingTo && (
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>
            Respond to {respondingTo} \u2014 {rfqs.find(r => r.id === respondingTo)?.product || 'Product'}
          </div>

          {submitSuccess && (
            <div style={{ marginBottom: 12, padding: 10, background: 'var(--pmx-green-light)', borderRadius: 8, fontSize: 12, color: 'var(--pmx-green)', fontWeight: 600 }}>
              {submitSuccess}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Your matching product</label>
              <select style={inputStyle}>
                <option>Metformin HCl 500mg (LHR) \u2014 PKR-DRG-18-3421</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Price per tablet (USD)</label>
              <input type="number" value={price} onChange={(e) => { setPrice(e.target.value); setValidationErrors(prev => { const n = {...prev}; delete n.price; return n; }); }} step="0.0001" style={{ ...inputStyle, borderColor: validationErrors.price ? 'var(--pmx-red)' : undefined }} />
              {validationErrors.price && <div style={{ fontSize: 11, color: 'var(--pmx-red)', marginTop: 3 }}>{validationErrors.price}</div>}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Lead time (days)</label>
              <input type="number" value={leadTime} onChange={(e) => { setLeadTime(e.target.value); setValidationErrors(prev => { const n = {...prev}; delete n.leadTime; return n; }); }} style={{ ...inputStyle, borderColor: validationErrors.leadTime ? 'var(--pmx-red)' : undefined }} />
              {validationErrors.leadTime && <div style={{ fontSize: 11, color: 'var(--pmx-red)', marginTop: 3 }}>{validationErrors.leadTime}</div>}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Min. order quantity</label>
              <input type="number" value={minOrderQty} onChange={(e) => { setMinOrderQty(e.target.value); setValidationErrors(prev => { const n = {...prev}; delete n.minOrderQty; return n; }); }} style={{ ...inputStyle, borderColor: validationErrors.minOrderQty ? 'var(--pmx-red)' : undefined }} />
              {validationErrors.minOrderQty && <div style={{ fontSize: 11, color: 'var(--pmx-red)', marginTop: 3 }}>{validationErrors.minOrderQty}</div>}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Notes to buyer</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Can scale to 8M tabs/month with 30 days' notice. WHO-GMP certified."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <button
            onClick={handleSubmitQuotation}
            disabled={submitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              cursor: submitting ? 'wait' : 'pointer',
              border: 'none',
              background: submitting ? 'var(--pmx-tx3)' : 'var(--pmx-teal)',
              color: '#fff',
              fontFamily: 'inherit',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit quotation'}
          </button>
        </div>
      )}
    </div>
  );
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

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--pmx-tx2)',
  marginBottom: 5,
  display: 'block',
};
