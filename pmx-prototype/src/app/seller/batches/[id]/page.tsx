'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const DEMO_MATERIALS = [
  { type: 'API', typeClass: 'info', name: 'Metformin Hydrochloride', supplier: 'Granules India Pvt. Ltd.', lot: 'GIN-2026-0441', qty: '102,500', unit: 'g', coaRef: 'GIN-COA-0441' },
  { type: 'Excipient', typeClass: 'neutral', name: 'Microcrystalline Cellulose PH101', supplier: 'FMC BioPolymer', lot: 'FMC-2026-0220', qty: '47,000', unit: 'g', coaRef: 'FMC-COA-0220' },
  { type: 'Excipient', typeClass: 'neutral', name: 'Magnesium Stearate', supplier: 'Spectrum Pakistan', lot: 'SP-2026-0119', qty: '2,100', unit: 'g', coaRef: 'SP-COA-0119' },
  { type: 'Excipient', typeClass: 'neutral', name: 'Povidone K30', supplier: 'BASF Pakistan', lot: 'BASF-26-0088', qty: '10,200', unit: 'g', coaRef: 'BASF-COA-0088' },
];

const DEMO_STEPS = [
  { step: 1, desc: 'API weighing & sifting', operator: 'Tariq Mahmood', equipment: 'BAL-001/SIFT-002', params: 'Mesh 40, humidity <50%', time: '09:14 UTC' },
  { step: 2, desc: 'Granulation', operator: 'Tariq Mahmood', equipment: 'GRAN-001', params: 'Speed 180rpm, temp 55\u00B0C, 20min', time: '10:45 UTC' },
  { step: 3, desc: 'Drying (FBD)', operator: 'Tariq Mahmood', equipment: 'FBD-001', params: 'Inlet 65\u00B0C, outlet 40\u00B0C, LOD <2%', time: '12:30 UTC' },
  { step: 4, desc: 'Blending & lubrication', operator: 'Tariq Mahmood', equipment: 'BLN-002', params: '12rpm, 5min post Mg-stearate', time: '13:15 UTC' },
  { step: 5, desc: 'Tablet compression', operator: 'Tariq Mahmood', equipment: 'TBM-003', params: 'Hardness 8\u201312kP, thickness 4.2mm\u00B10.1', time: '14:00 UTC' },
];

const DEMO_QC_TESTS = [
  { name: 'Assay (HPLC)', method: 'BP 2024 / USP 47', spec: '98.0\u2013102.0%', result: '100.3', unit: '%', verdict: 'PASS' },
  { name: 'Dissolution (Q, 45 min)', method: 'USP <711> App.II', spec: 'NLT 80%', result: '93.4', unit: '%', verdict: 'PASS' },
  { name: 'Related substances', method: 'BP 2024', spec: 'NMT 0.5%', result: '0.12', unit: '%', verdict: 'PASS' },
  { name: 'Microbial limits', method: 'USP <61> / <62>', spec: 'Compliant', result: 'Compliant', unit: '\u2014', verdict: 'PASS' },
];

const DEMO_ENV_DATA = [
  { time: '09:00', area: 'Granulation Room A', temp: '22.3', humidity: '44.1', pressure: '12.5', withinSpec: true, by: 'Tariq Mahmood' },
  { time: '11:00', area: 'FBD Room', temp: '24.8', humidity: '47.2', pressure: '10.2', withinSpec: true, by: 'Tariq Mahmood' },
  { time: '13:00', area: 'Compression Hall', temp: '21.5', humidity: '43.6', pressure: '15.1', withinSpec: true, by: 'Tariq Mahmood' },
];

interface Deviation {
  id?: string;
  deviation_id?: string;
  classification?: string;
  severity?: string;
  description?: string;
  capa_ref?: string;
  status?: string;
}

const DEMO_DEVIATIONS: Deviation[] = [];

const DEMO_SIGNATURES = [
  { title: 'Production Operator sign-off', signer: 'Tariq Mahmood (SELLER_OPERATOR)', meaning: 'Completed all manufacturing steps as Production Operator', date: '01 Apr 2026 14:00 UTC', hash: '3f8a2c9d...', color: 'var(--pmx-green)' },
  { title: 'QC Analyst sign-off', signer: 'Amna Siddiqui (SELLER_QA)', meaning: 'All QC tests completed as QC Analyst', date: '01 Apr 2026 12:30 UTC', hash: '9d1e4f7b...', color: 'var(--pmx-green)' },
  { title: 'QA Manager release \u2014 BATCH RELEASED', signer: 'Dr. Farrukh Ali (SELLER_QA)', meaning: 'Approved for release as QA Manager', date: '01 Apr 2026 14:07 UTC', hash: 'a4f2c81e...', color: 'var(--pmx-teal)', extra: 'CoA generation triggered' },
];

const DEMO_HEADER_INFO = [
  { label: 'Batch no.:', value: 'LHR-2026-0031', mono: true },
  { label: 'Batch size:', value: '200,000 tablets' },
  { label: 'Yield actual:', value: '197,840 (98.9%)' },
  { label: 'Shelf life:', value: '24 months' },
  { label: 'Mfg. date:', value: '01 Apr 2026' },
  { label: 'Expiry date:', value: '31 Mar 2028' },
  { label: 'Yield theoretical:', value: '200,000' },
  { label: 'Variance %:', value: '\u22121.08% (in spec)', valueColor: 'var(--pmx-green)' },
];

const badgeStyles: Record<string, { bg: string; color: string }> = {
  success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
  info: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
  neutral: { bg: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
};

export default function BatchDetail() {
  const params = useParams();
  const batchId = params.id as string;

  const [activeTab, setActiveTab] = useState(0);
  const [headerInfo, setHeaderInfo] = useState(DEMO_HEADER_INFO);
  const [materials, setMaterials] = useState(DEMO_MATERIALS);
  const [steps, setSteps] = useState(DEMO_STEPS);
  const [qcTests, setQcTests] = useState(DEMO_QC_TESTS);
  const [envData, setEnvData] = useState(DEMO_ENV_DATA);
  const [deviations, setDeviations] = useState(DEMO_DEVIATIONS);
  const [signatures, setSignatures] = useState(DEMO_SIGNATURES);
  const [batchTitle, setBatchTitle] = useState(`eBMR \u2014 ${batchId || 'LHR-2026-0031'}`);
  const [productDesc, setProductDesc] = useState('Metformin Hydrochloride Tablets 500mg \u00B7 DRAP Reg: PKR-DRG-18-3421');
  const [batchStatus, setBatchStatus] = useState('Released');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    'Bill of Materials',
    `Mfg. Steps (${steps.length})`,
    `QC Tests (${qcTests.length})`,
    'Environmental',
    `Deviations (${deviations.length})`,
    'E-Signatures',
  ];

  useEffect(() => {
    if (!batchId) { setLoading(false); return; }
    fetch(`/api/batches/${batchId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const data = d.data;
          const batch = data.batch || data;

          // Map batch header
          if (batch) {
            setBatchTitle(`eBMR \u2014 ${batch.batch_number || batchId}`);
            if (batch.product_name) setProductDesc(`${batch.product_name}${batch.drap_reg ? ` \u00B7 DRAP Reg: ${batch.drap_reg}` : ''}`);
            if (batch.status) setBatchStatus(batch.status);

            const newHeader = [
              { label: 'Batch no.:', value: batch.batch_number || batchId, mono: true },
              { label: 'Batch size:', value: batch.batch_size ? `${batch.batch_size.toLocaleString()} ${batch.dosage_form || 'tablets'}` : DEMO_HEADER_INFO[1].value },
              { label: 'Yield actual:', value: batch.yield_actual ? `${batch.yield_actual.toLocaleString()} (${batch.yield_percent || ''}%)` : DEMO_HEADER_INFO[2].value },
              { label: 'Shelf life:', value: batch.shelf_life || DEMO_HEADER_INFO[3].value },
              { label: 'Mfg. date:', value: batch.mfg_date || batch.manufacturing_date || DEMO_HEADER_INFO[4].value },
              { label: 'Expiry date:', value: batch.expiry_date || DEMO_HEADER_INFO[5].value },
              { label: 'Yield theoretical:', value: batch.yield_theoretical ? batch.yield_theoretical.toLocaleString() : DEMO_HEADER_INFO[6].value },
              { label: 'Variance %:', value: batch.variance || DEMO_HEADER_INFO[7].value, valueColor: batch.variance_in_spec !== false ? 'var(--pmx-green)' : 'var(--pmx-red)' },
            ];
            setHeaderInfo(newHeader);
          }

          // Map materials
          if (data.materials && Array.isArray(data.materials) && data.materials.length > 0) {
            setMaterials(data.materials.map((m: Record<string, unknown>) => ({
              type: m.type || m.material_type || 'Excipient',
              typeClass: String(m.type || m.material_type || '').toLowerCase() === 'api' ? 'info' : 'neutral',
              name: m.name || m.material_name || '',
              supplier: m.supplier || m.supplier_name || '',
              lot: m.lot || m.lot_number || '',
              qty: m.qty || m.quantity || '',
              unit: m.unit || 'g',
              coaRef: m.coa_ref || m.supplier_coa_ref || '',
            })));
          }

          // Map steps
          if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
            setSteps(data.steps.map((s: Record<string, unknown>, i: number) => ({
              step: s.step_number || s.step || i + 1,
              desc: s.description || s.desc || '',
              operator: s.operator || s.operator_name || '',
              equipment: s.equipment || s.equipment_id || '',
              params: s.params || s.process_params || '',
              time: s.signed_at || s.time || '',
            })));
          }

          // Map QC tests
          if (data.qc_tests && Array.isArray(data.qc_tests) && data.qc_tests.length > 0) {
            setQcTests(data.qc_tests.map((t: Record<string, unknown>) => ({
              name: t.name || t.test_name || '',
              method: t.method || t.method_reference || '',
              spec: t.spec || t.specification || '',
              result: t.result || '',
              unit: t.unit || '',
              verdict: t.verdict || t.pass_fail || 'PASS',
            })));
          }

          // Map environmental
          if (data.environmental && Array.isArray(data.environmental) && data.environmental.length > 0) {
            setEnvData(data.environmental.map((e: Record<string, unknown>) => ({
              time: e.time || e.recorded_at || '',
              area: e.area || e.production_area || '',
              temp: String(e.temp || e.temperature || ''),
              humidity: String(e.humidity || ''),
              pressure: String(e.pressure || e.diff_pressure || ''),
              withinSpec: (e.within_spec as boolean) ?? (e.withinSpec as boolean) ?? true,
              by: String(e.recorded_by || e.by || ''),
            })));
          }

          // Map deviations
          if (data.deviations && Array.isArray(data.deviations)) {
            setDeviations(data.deviations);
          }
        }
      })
      .catch(() => { setError('Failed to load batch details. Showing demo data.'); })
      .finally(() => setLoading(false));
  }, [batchId]);

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading batch details...</div>
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
        <span style={{ color: 'var(--pmx-tx2)' }}>{batchId}</span>
      </nav>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>
            {batchTitle.split('\u2014')[0]}\u2014 <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16 }}>{batchId}</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>{productDesc}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--pmx-green-light)', color: 'var(--pmx-green)' }}>{batchStatus}</span>
          <Link
            href={`/seller/coa/${batchId}`}
            style={{
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
              textDecoration: 'none',
              fontFamily: 'inherit',
            }}
          >
            View CoA &#8599;
          </Link>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12 }}>
          {headerInfo.map((h) => (
            <div key={h.label}>
              <span style={{ color: 'var(--pmx-tx2)' }}>{h.label}</span><br />
              <strong style={{ fontFamily: h.mono ? "'IBM Plex Mono', monospace" : 'inherit', color: h.valueColor || 'var(--pmx-tx)' }}>{h.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 16 }}>
        {tabs.map((t, i) => (
          <div
            key={t}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 500,
              color: activeTab === i ? 'var(--pmx-teal)' : 'var(--pmx-tx2)',
              cursor: 'pointer',
              borderBottom: activeTab === i ? '2px solid var(--pmx-teal)' : '2px solid transparent',
              marginBottom: -0.5,
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Type', 'Material', 'Supplier', 'Lot no.', 'Qty used', 'Unit', 'Supplier CoA ref'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materials.map((m, i) => (
              <tr key={i}>
                <td style={tdStyle}><span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: badgeStyles[m.typeClass]?.bg, color: badgeStyles[m.typeClass]?.color }}>{m.type}</span></td>
                <td style={tdStyle}>{m.name}</td>
                <td style={tdStyle}>{m.supplier}</td>
                <td style={tdStyle}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{m.lot}</span></td>
                <td style={tdStyle}>{m.qty}</td>
                <td style={tdStyle}>{m.unit}</td>
                <td style={tdStyle}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{m.coaRef}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === 1 && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Step', 'Description', 'Operator', 'Equipment', 'Process params', 'Status', 'Signed'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {steps.map((s) => (
                <tr key={s.step}>
                  <td style={tdStyle}><strong>{s.step}</strong></td>
                  <td style={tdStyle}>{s.desc}</td>
                  <td style={tdStyle}>{s.operator}</td>
                  <td style={tdStyle}>{s.equipment}</td>
                  <td style={tdStyle}>{s.params}</td>
                  <td style={tdStyle}><span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--pmx-green-light)', color: 'var(--pmx-green)' }}>Complete</span></td>
                  <td style={tdStyle}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--pmx-green)' }}>{'\u2713'} {s.time}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 10, padding: 10, background: 'var(--pmx-blue-light)', borderRadius: 8, fontSize: 11, color: 'var(--pmx-blue)' }}>
            21 CFR Part 11: Every step signature re-verified password at time of signing. Meaning of signature recorded. SHA-256 hash computed at moment of signing.
          </div>
        </>
      )}

      {activeTab === 2 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Test name', 'Method reference', 'Specification', 'Result', 'Unit', 'Verdict', 'Analyst'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {qcTests.map((t, i) => (
              <tr key={i}>
                <td style={tdStyle}>{t.name}</td>
                <td style={tdStyle}>{t.method}</td>
                <td style={tdStyle}>{t.spec}</td>
                <td style={tdStyle}>{t.result}</td>
                <td style={tdStyle}>{t.unit}</td>
                <td style={tdStyle}><span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: t.verdict === 'PASS' ? 'var(--pmx-green-light)' : 'var(--pmx-red-light)', color: t.verdict === 'PASS' ? 'var(--pmx-green)' : 'var(--pmx-red)' }}>{t.verdict}</span></td>
                <td style={tdStyle}>Amna Siddiqui</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === 3 && (
        <>
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 12 }}>
            Environmental monitoring per production area — temperature, humidity, differential pressure. Out-of-spec readings must be documented as deviations (documenting does NOT penalise CQS — hiding does).
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Time (UTC)', 'Production area', 'Temp (\u00B0C)', 'Humidity (%)', 'Diff. pressure (Pa)', 'Within spec', 'Recorded by'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {envData.map((e, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{e.time}</td>
                  <td style={tdStyle}>{e.area}</td>
                  <td style={tdStyle}>{e.temp}</td>
                  <td style={tdStyle}>{e.humidity}</td>
                  <td style={tdStyle}>{e.pressure}</td>
                  <td style={tdStyle}><span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: e.withinSpec ? 'var(--pmx-green-light)' : 'var(--pmx-red-light)', color: e.withinSpec ? 'var(--pmx-green)' : 'var(--pmx-red)' }}>{e.withinSpec ? '\u2713 Yes' : '\u2717 No'}</span></td>
                  <td style={tdStyle}>{e.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{ ...btnSmStyle, marginTop: 10 }}>+ Add environmental reading</button>
        </>
      )}

      {activeTab === 4 && (
        <div>
          {deviations.length === 0 ? (
            <>
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--pmx-tx2)', fontSize: 12 }}>
                No deviations recorded for this batch. Any departure from procedure must be documented immediately with classification (Critical / Major / Minor) and CAPA reference.
              </div>
              <div style={{ textAlign: 'center' }}>
                <button style={btnSmStyle}>+ Report deviation</button>
              </div>
            </>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['ID', 'Classification', 'Description', 'CAPA ref', 'Status'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deviations.map((dev, i) => (
                    <tr key={i}>
                      <td style={tdStyle}>{dev.id || dev.deviation_id || `DEV-${i + 1}`}</td>
                      <td style={tdStyle}>{dev.classification || dev.severity || ''}</td>
                      <td style={tdStyle}>{dev.description || ''}</td>
                      <td style={tdStyle}>{dev.capa_ref || '\u2014'}</td>
                      <td style={tdStyle}>{dev.status || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button style={btnSmStyle}>+ Report deviation</button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 5 && (
        <>
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 14 }}>
            21 CFR Part 11 — Electronic signature chain. Every signature records: full name of signer, date/time, meaning of signature, SHA-256 hash at moment of signing.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {signatures.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0, background: s.color }} />
                <div>
                  <strong>{s.title}</strong> — {s.signer}<br />
                  <span style={{ fontSize: 11, color: 'var(--pmx-tx3)' }}>
                    Meaning: &quot;{s.meaning}&quot; &middot; {s.date} &middot; {s.extra ? `${s.extra} \u00B7 ` : ''}
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Hash: {s.hash}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
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
