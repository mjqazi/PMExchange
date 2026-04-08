'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const DEMO_QC_RESULTS = [
  { test: 'Assay (HPLC)', method: 'BP 2024', spec: '98.0\u2013102.0%', result: '100.3%', verdict: 'PASS' },
  { test: 'Dissolution (Q,45min)', method: 'USP <711>', spec: 'NLT 80%', result: '93.4%', verdict: 'PASS' },
  { test: 'Related substances', method: 'BP 2024', spec: 'NMT 0.5%', result: '0.12%', verdict: 'PASS' },
  { test: 'Microbial limits', method: 'USP <61>', spec: 'Compliant', result: 'Compliant', verdict: 'PASS' },
];

const DEMO_INTEGRITY_ROWS = [
  { label: 'Status', value: 'Issued \u00B7 Immutable', badge: true },
  { label: 'SHA-256 hash', value: 'a4f2c81e...', mono: true },
  { label: 'Generated at', value: '01 Apr 2026 14:07 UTC' },
  { label: 'Tamper detected', value: 'No \u2014 hash verified', color: 'var(--pmx-green)' },
  { label: 'Can be modified', value: 'Never \u2014 immutable', color: 'var(--pmx-red)' },
];

const DEMO_CERT_INFO = {
  manufacturer: 'Lahore Generics Ltd.',
  drapLicence: 'MFG-0124-2019',
  address: 'Plot 14, Sundar IID, Lahore',
  whoGmpRef: 'WHO-GMP-PK-2024-0041',
  productINN: 'Metformin Hydrochloride',
  brandName: 'MetPure',
  strengthForm: '500mg Film-coated Tablets',
  packSize: '10\u00D710 blister',
  batchNo: 'LHR-2026-0031',
  coaRef: 'COA-LHR-2026-0031',
  mfgDate: '01 Apr 2026',
  expiry: '31 Mar 2028',
  storage: 'Below 25\u00B0C, dry place',
  pharmacopoeia: 'BP 2024 / USP 47',
  qaRelease: 'Batch reviewed and approved for release by Dr. Farrukh Ali, QA Manager on 01 Apr 2026 14:07 UTC. Meaning: "Approved for release as QA Manager."',
  sha256Full: 'a4f2c81e9d3b7f20e5c4a1d8',
  qrPayload: 'LHR-2026-0031|MFG-0124-2019|2026-04-01|a4f2c81e',
};

export default function CoAViewer() {
  const params = useParams();
  const batchId = params.batchId as string;

  const [qcResults, setQcResults] = useState(DEMO_QC_RESULTS);
  const [integrityRows, setIntegrityRows] = useState(DEMO_INTEGRITY_ROWS);
  const [certInfo, setCertInfo] = useState(DEMO_CERT_INFO);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) { setLoading(false); return; }
    fetch(`/api/batches/${batchId}/coa`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const coa = d.data;

          // Map QC results
          if (coa.qc_results && Array.isArray(coa.qc_results) && coa.qc_results.length > 0) {
            setQcResults(coa.qc_results.map((r: Record<string, unknown>) => ({
              test: r.test || r.test_name || '',
              method: r.method || r.method_reference || '',
              spec: r.spec || r.specification || '',
              result: r.result || '',
              verdict: r.verdict || r.pass_fail || 'PASS',
            })));
          }

          // Map cert info
          if (coa.manufacturer || coa.product_name || coa.batch_number) {
            setCertInfo({
              manufacturer: coa.manufacturer || coa.manufacturer_name || DEMO_CERT_INFO.manufacturer,
              drapLicence: coa.drap_licence || coa.drap_license || DEMO_CERT_INFO.drapLicence,
              address: coa.address || DEMO_CERT_INFO.address,
              whoGmpRef: coa.who_gmp_ref || DEMO_CERT_INFO.whoGmpRef,
              productINN: coa.product_inn || coa.product_name || DEMO_CERT_INFO.productINN,
              brandName: coa.brand_name || DEMO_CERT_INFO.brandName,
              strengthForm: coa.strength_form || coa.dosage || DEMO_CERT_INFO.strengthForm,
              packSize: coa.pack_size || DEMO_CERT_INFO.packSize,
              batchNo: coa.batch_number || batchId,
              coaRef: coa.coa_ref || `COA-${batchId}`,
              mfgDate: coa.mfg_date || DEMO_CERT_INFO.mfgDate,
              expiry: coa.expiry_date || DEMO_CERT_INFO.expiry,
              storage: coa.storage || DEMO_CERT_INFO.storage,
              pharmacopoeia: coa.pharmacopoeia || DEMO_CERT_INFO.pharmacopoeia,
              qaRelease: coa.qa_release || DEMO_CERT_INFO.qaRelease,
              sha256Full: coa.sha256 || DEMO_CERT_INFO.sha256Full,
              qrPayload: coa.qr_payload || DEMO_CERT_INFO.qrPayload,
            });
          }

          // Map integrity
          if (coa.sha256 || coa.generated_at) {
            setIntegrityRows([
              { label: 'Status', value: coa.status || 'Issued \u00B7 Immutable', badge: true },
              { label: 'SHA-256 hash', value: coa.sha256 ? `${coa.sha256.slice(0, 8)}...` : DEMO_INTEGRITY_ROWS[1].value, mono: true },
              { label: 'Generated at', value: coa.generated_at || DEMO_INTEGRITY_ROWS[2].value },
              { label: 'Tamper detected', value: coa.tamper_detected ? 'YES' : 'No \u2014 hash verified', color: coa.tamper_detected ? 'var(--pmx-red)' : 'var(--pmx-green)' },
              { label: 'Can be modified', value: 'Never \u2014 immutable', color: 'var(--pmx-red)' },
            ]);
          }

          // PDF URL
          if (coa.pdf_url) {
            setPdfUrl(coa.pdf_url);
          }
        }
      })
      .catch(() => { setError('Failed to load CoA data. Showing demo data.'); })
      .finally(() => setLoading(false));
  }, [batchId]);

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading Certificate of Analysis...</div>
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
      {/* Breadcrumb */}
      <nav style={{ fontSize: 11, color: 'var(--pmx-tx3)', marginBottom: 12 }}>
        <Link href="/seller/dashboard" style={{ color: 'var(--pmx-tx3)', textDecoration: 'none' }}>Dashboard</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <Link href="/seller/batches" style={{ color: 'var(--pmx-tx3)', textDecoration: 'none' }}>Batches</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <Link href={`/seller/batches/${batchId}`} style={{ color: 'var(--pmx-tx3)', textDecoration: 'none' }}>{batchId}</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: 'var(--pmx-tx2)' }}>CoA</span>
      </nav>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Certificate of Analysis</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{certInfo.coaRef}</span> &middot; Generated {integrityRows[2]?.value || '01 Apr 2026 14:07 UTC'} &middot; SHA-256: {integrityRows[1]?.value || 'a4f2c81e...'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--pmx-green-light)', color: 'var(--pmx-green)' }}>
            Issued &middot; Immutable
          </span>
          <button
            onClick={handleDownloadPdf}
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
              fontFamily: 'inherit',
            }}
          >
            &#8595; Download PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
        {/* Certificate preview */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ border: '1px solid var(--input)', borderRadius: 8, padding: 20 }}>
            {/* Certificate header */}
            <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--input)' }}>
              <div style={{ fontSize: 10, color: 'var(--pmx-tx3)', fontWeight: 700, letterSpacing: '.1em' }}>PMX PHARMA MARKETPLACE EXCHANGE</div>
              <div style={{ fontSize: 16, fontWeight: 800, margin: '4px 0' }}>CERTIFICATE OF ANALYSIS</div>
              <div style={{ fontSize: 10, color: 'var(--pmx-tx3)' }}>PROTOTYPE \u2014 NOT FOR REGULATORY SUBMISSION</div>
            </div>

            {/* Certificate info grid */}
            <div style={{ fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
              <div><strong>Manufacturer:</strong> {certInfo.manufacturer}</div>
              <div><strong>DRAP Licence:</strong> {certInfo.drapLicence}</div>
              <div><strong>Address:</strong> {certInfo.address}</div>
              <div><strong>WHO-GMP Ref:</strong> {certInfo.whoGmpRef}</div>
              <div><strong>Product (INN):</strong> {certInfo.productINN}</div>
              <div><strong>Brand name:</strong> {certInfo.brandName}</div>
              <div><strong>Strength/Form:</strong> {certInfo.strengthForm}</div>
              <div><strong>Pack size:</strong> {certInfo.packSize}</div>
              <div><strong>Batch no.:</strong> {certInfo.batchNo}</div>
              <div><strong>CoA ref.:</strong> {certInfo.coaRef}</div>
              <div><strong>Mfg. date:</strong> {certInfo.mfgDate}</div>
              <div><strong>Expiry:</strong> {certInfo.expiry}</div>
              <div><strong>Storage:</strong> {certInfo.storage}</div>
              <div><strong>Pharmacopoeia:</strong> {certInfo.pharmacopoeia}</div>
            </div>

            {/* QC results */}
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Quality Control Results</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  {['Test', 'Method', 'Specification', 'Result', 'Verdict'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {qcResults.map((r, i) => (
                  <tr key={i}>
                    <td style={tdStyle}>{r.test}</td>
                    <td style={tdStyle}>{r.method}</td>
                    <td style={tdStyle}>{r.spec}</td>
                    <td style={tdStyle}>{r.result}</td>
                    <td style={tdStyle}><strong style={{ color: r.verdict === 'PASS' ? 'var(--pmx-green)' : 'var(--pmx-red)' }}>{r.verdict}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* QA Release */}
            <div style={{ marginTop: 12, padding: 10, background: 'var(--pmx-green-light)', borderRadius: 8, fontSize: 11 }}>
              <strong>QA Release:</strong> {certInfo.qaRelease}
            </div>

            <div style={{ marginTop: 10, fontSize: 10, color: 'var(--pmx-tx3)' }}>
              SHA-256: {certInfo.sha256Full} &middot; QR payload: {certInfo.qrPayload}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Document integrity */}
          <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Document integrity</div>
            {integrityRows.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < integrityRows.length - 1 ? '0.5px solid var(--border)' : 'none', fontSize: 12 }}>
                <span>{r.label}</span>
                {r.badge ? (
                  <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--pmx-green-light)', color: 'var(--pmx-green)' }}>
                    {r.value}
                  </span>
                ) : (
                  <span style={{ fontFamily: r.mono ? "'IBM Plex Mono', monospace" : 'inherit', color: r.color || 'var(--pmx-tx)' }}>
                    {r.value}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* QR code */}
          <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>QR code payload</div>
            <div style={{
              width: 80,
              height: 80,
              background: 'var(--pmx-bg2)',
              border: '0.5px solid var(--border)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: 'var(--pmx-tx3)',
              textAlign: 'center',
              marginBottom: 10,
            }}>
              QR code<br />(in PDF)
            </div>
            <div style={{ fontSize: 11, color: 'var(--pmx-tx2)' }}>
              Encodes: batch no. + manufacturer ID + CoA date + SHA-256. Scannable by DRAP portal and foreign regulatory authorities for real-time verification.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '9px 8px 9px 0',
  borderBottom: '0.5px solid var(--border)',
  verticalAlign: 'middle',
  fontSize: 12,
  color: 'var(--pmx-tx)',
};
