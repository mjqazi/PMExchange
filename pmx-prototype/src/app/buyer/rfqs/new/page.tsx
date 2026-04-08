'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PostNewRFQ() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    inn: 'Ciprofloxacin',
    strength: '500mg',
    dosageForm: 'Tablet',
    volume: '3000000',
    unit: 'Tablets',
    frequency: 'Monthly',
    certs: { whoGmp: true, sfda: false, drapGmp: false, nmpa: false },
    destination: 'Nigeria',
    priceMin: '0.007',
    priceMax: '0.012',
    incoterms: 'CIF',
    leadTime: '60',
    paymentTerms: 'PSO Escrow (required by PMX)',
  })

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: '0.5px solid var(--input)',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--pmx-tx)',
    background: 'var(--pmx-bg)',
    fontFamily: 'inherit',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--pmx-tx2)',
    marginBottom: 5,
    display: 'block',
  }

  const fieldWrap: React.CSSProperties = {
    marginBottom: 14,
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.inn.trim()) errors.inn = 'Product INN is required'
    if (!form.strength.trim()) errors.strength = 'Strength is required'
    if (!form.dosageForm.trim()) errors.dosageForm = 'Dosage form is required'
    if (!form.volume || Number(form.volume) <= 0) errors.volume = 'Volume must be a positive number'
    if (!form.destination.trim()) errors.destination = 'Destination country is required'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const errorBorder = (field: string): React.CSSProperties =>
    validationErrors[field] ? { borderColor: 'var(--pmx-red)' } : {}

  const clearFieldError = (field: string) =>
    setValidationErrors(prev => { const n = {...prev}; delete n[field]; return n })

  return (
    <>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Post New RFQ</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>5 mandatory fields &middot; Matching engine runs immediately on publish &middot; Layer 1 + L2 + L3 applied</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
        {/* Left: Product Requirements */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Product requirements</div>

          <div style={fieldWrap}>
            <label style={labelStyle}>Product INN name <span style={{ color: 'var(--pmx-red)' }}>*</span></label>
            <input
              style={{ ...inputStyle, ...errorBorder('inn') }}
              value={form.inn}
              onChange={(e) => { setForm({ ...form, inn: e.target.value }); clearFieldError('inn') }}
            />
            {validationErrors.inn && <div style={{ fontSize: 11, color: 'var(--pmx-red)', marginTop: 3 }}>{validationErrors.inn}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Strength <span style={{ color: 'var(--pmx-red)' }}>*</span></label>
              <input
                style={{ ...inputStyle, ...errorBorder('strength') }}
                value={form.strength}
                onChange={(e) => { setForm({ ...form, strength: e.target.value }); clearFieldError('strength') }}
              />
              {validationErrors.strength && <div style={{ fontSize: 11, color: 'var(--pmx-red)', marginTop: 3 }}>{validationErrors.strength}</div>}
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Dosage form <span style={{ color: 'var(--pmx-red)' }}>*</span></label>
              <select
                style={{ ...inputStyle, ...errorBorder('dosageForm') }}
                value={form.dosageForm}
                onChange={(e) => { setForm({ ...form, dosageForm: e.target.value }); clearFieldError('dosageForm') }}
              >
                <option>Tablet</option>
                <option>Capsule</option>
                <option>Syrup</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Volume required <span style={{ color: 'var(--pmx-red)' }}>*</span></label>
              <input
                style={{ ...inputStyle, ...errorBorder('volume') }}
                type="number"
                value={form.volume}
                onChange={(e) => { setForm({ ...form, volume: e.target.value }); clearFieldError('volume') }}
              />
              {validationErrors.volume && <div style={{ fontSize: 11, color: 'var(--pmx-red)', marginTop: 3 }}>{validationErrors.volume}</div>}
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Unit</label>
              <select
                style={inputStyle}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                <option>Tablets</option>
                <option>Capsules</option>
              </select>
            </div>
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>Order frequency</label>
            <select
              style={inputStyle}
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            >
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>One-time</option>
            </select>
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>Required certifications</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
              {[
                { key: 'whoGmp' as const, label: 'WHO-GMP' },
                { key: 'sfda' as const, label: 'SFDA' },
                { key: 'drapGmp' as const, label: 'DRAP-GMP' },
                { key: 'nmpa' as const, label: 'NMPA' },
              ].map((cert) => (
                <label key={cert.key} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.certs[cert.key]}
                    onChange={(e) => setForm({ ...form, certs: { ...form.certs, [cert.key]: e.target.checked } })}
                  />
                  {cert.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Commercial Terms */}
        <div>
          <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Commercial terms</div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Destination country <span style={{ color: 'var(--pmx-red)' }}>*</span></label>
              <select
                style={{ ...inputStyle, ...errorBorder('destination') }}
                value={form.destination}
                onChange={(e) => { setForm({ ...form, destination: e.target.value }); clearFieldError('destination') }}
              >
                <option>Nigeria</option>
                <option>Saudi Arabia</option>
                <option>Kenya</option>
                <option>China</option>
                <option>UAE</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Price min (USD/unit)</label>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.001"
                  value={form.priceMin}
                  onChange={(e) => setForm({ ...form, priceMin: e.target.value })}
                />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Price max (USD/unit)</label>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.001"
                  value={form.priceMax}
                  onChange={(e) => setForm({ ...form, priceMax: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Incoterms</label>
                <select
                  style={inputStyle}
                  value={form.incoterms}
                  onChange={(e) => setForm({ ...form, incoterms: e.target.value })}
                >
                  <option>CIF</option>
                  <option>FOB</option>
                  <option>EXW</option>
                </select>
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Max lead time (days)</label>
                <input
                  style={inputStyle}
                  type="number"
                  value={form.leadTime}
                  onChange={(e) => setForm({ ...form, leadTime: e.target.value })}
                />
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Payment terms</label>
              <select style={inputStyle} value={form.paymentTerms} disabled>
                <option>PSO Escrow (required by PMX)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          {submitStatus === 'success' && (
            <div style={{ padding: '8px 12px', background: 'var(--pmx-green-light)', color: 'var(--pmx-green)', borderRadius: 8, fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
              RFQ saved successfully! Redirecting...
            </div>
          )}
          {submitStatus === 'error' && (
            <div style={{ padding: '8px 12px', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', borderRadius: 8, fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
              Failed to save RFQ. Using demo mode.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={submitting}
              onClick={async () => {
                if (!validateForm()) return
                setSubmitting(true)
                setSubmitStatus('idle')
                try {
                  const res = await fetch('/api/rfqs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...form, status: 'DRAFT' }),
                  })
                  const d = await res.json()
                  if (d.success) {
                    setSubmitStatus('success')
                    setTimeout(() => router.push('/buyer/dashboard'), 1200)
                  } else {
                    setSubmitStatus('error')
                  }
                } catch {
                  setSubmitStatus('error')
                } finally {
                  setSubmitting(false)
                }
              }}
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
                cursor: submitting ? 'wait' : 'pointer',
                border: '0.5px solid var(--input)',
                background: 'var(--pmx-bg)',
                color: 'var(--pmx-tx)',
                fontFamily: 'inherit',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Saving...' : 'Save draft'}
            </button>
            <button
              disabled={submitting}
              onClick={async () => {
                if (!validateForm()) return
                setSubmitting(true)
                setSubmitStatus('idle')
                try {
                  const res = await fetch('/api/rfqs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...form, status: 'PUBLISHED' }),
                  })
                  const d = await res.json()
                  if (d.success) {
                    setSubmitStatus('success')
                    setTimeout(() => router.push('/buyer/dashboard'), 1200)
                  } else {
                    setSubmitStatus('error')
                  }
                } catch {
                  setSubmitStatus('error')
                } finally {
                  setSubmitting(false)
                }
              }}
              style={{
                flex: 2,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                cursor: submitting ? 'wait' : 'pointer',
                background: 'var(--pmx-teal)',
                color: '#fff',
                border: 'none',
                fontFamily: 'inherit',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Publishing...' : 'Publish \u2014 run matching \u2192'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
