'use client';

export default function RegulatoryPathways() {
  const whoGmpSteps = [
    { num: 1, name: 'Site master file', auto: 'Auto from manufacturer record', status: 'done' },
    { num: 2, name: 'Organisation and personnel', auto: 'Auto from user records', status: 'done' },
    { num: 3, name: 'Premises and equipment', auto: null, status: 'done' },
    { num: 4, name: 'Documentation system', auto: 'Auto from batch records', status: 'done' },
    { num: 5, name: 'Production controls', auto: 'Auto from batch steps + params', status: 'done' },
    { num: 6, name: 'Quality control (QC lab)', auto: null, status: 'done' },
    { num: 7, name: 'Supplier qualification', auto: 'Auto from supplier_qualifications', status: 'done' },
    { num: 8, name: 'Complaints and recalls', auto: null, status: 'current' },
    { num: 9, name: 'Self-inspection system', auto: null, status: 'pending' },
    { num: 10, name: 'Contract manufacturing', auto: null, status: 'pending' },
    { num: 11, name: 'GMP certificates held', auto: 'Auto from manufacturer record', status: 'pending' },
  ];

  const otherPathways = [
    {
      title: 'SFDA Registration Dossier',
      sub: 'Saudi Arabia \u00B7 Tier 2+',
      status: 'Not started',
      statusClass: 'neutral',
      detail: 'Requires WHO-GMP completion \u00B7 7 steps \u00B7 Batch data ready',
      progress: 0,
    },
    {
      title: 'USFDA Pre-ANDA Advisory',
      sub: '21 CFR Part 11 readiness \u00B7 Tier 3',
      status: 'Tier upgrade needed',
      statusClass: 'warning',
      detail: 'Requires Tier 3 \u2014 one international market registration',
      progress: null,
    },
    {
      title: 'NMPA / TCM via Fengtai',
      sub: 'China \u00B7 Tier 3 \u00B7 Fengtai-specified',
      status: 'Tier upgrade needed',
      statusClass: 'warning',
      detail: 'FLTCM GMP SOPs required \u00B7 CoA template from Fengtai',
      progress: null,
    },
  ];

  const badgeStyles: Record<string, { bg: string; color: string }> = {
    neutral: { bg: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
    warning: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
    info: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
    success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
  };

  // Show first 7 completed, then current + pending (matching the reference which shows 7 of 11)
  const displaySteps = [
    whoGmpSteps[0], // Site master file - done
    whoGmpSteps[3], // Documentation system - done
    whoGmpSteps[4], // Production controls - done
    { num: 5, name: 'Quality control (QC lab)', auto: null, status: 'current' },
    { num: 6, name: 'Premises and equipment', auto: null, status: 'pending' },
    { num: 7, name: 'Supplier qualification', auto: 'Auto from supplier_qualifications', status: 'pending' },
  ];

  return (
    <div className="animate-fade-in-up" style={{ padding: 20, minHeight: 600 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Regulatory Pathways</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Forms auto-populated from Compliance ERP \u2014 no re-keying</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14, marginBottom: 14 }}>
        {/* WHO-GMP card */}
        <div style={{ border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--pmx-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>WHO-GMP Pre-assessment</div>
              <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginTop: 2 }}>11 assessment areas &middot; Tier 2+ &middot; Data from 47 batches</div>
            </div>
            <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' }}>In progress</span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: '65%', background: 'var(--pmx-teal)', borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: 12 }}>65% \u2014 7 of 11 areas complete</div>

          {/* Steps */}
          <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
            {displaySteps.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: i < displaySteps.length - 1 ? '0.5px solid var(--border)' : 'none',
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                    background: s.status === 'done' ? 'var(--pmx-green-light)' : s.status === 'current' ? 'var(--pmx-teal-light)' : 'var(--pmx-bg2)',
                    color: s.status === 'done' ? 'var(--pmx-green)' : s.status === 'current' ? 'var(--pmx-teal)' : 'var(--pmx-tx3)',
                  }}
                >
                  {s.status === 'done' ? '\u2713' : s.num}
                </div>
                <div style={{ flex: 1 }}>
                  <strong>{s.name}</strong>
                  {s.auto && <span style={{ fontSize: 10, color: 'var(--pmx-tx3)', marginLeft: 6 }}>{s.auto}</span>}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 7px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 500,
                    background: s.status === 'done' ? 'var(--pmx-green-light)' : s.status === 'current' ? 'var(--pmx-blue-light)' : 'var(--pmx-gray-light)',
                    color: s.status === 'done' ? 'var(--pmx-green)' : s.status === 'current' ? 'var(--pmx-blue)' : 'var(--pmx-gray)',
                  }}
                >
                  {s.status === 'done' ? 'Done' : s.status === 'current' ? 'In progress' : s.status === 'pending' ? (s.auto ? 'Pending' : 'Manual entry') : ''}
                </span>
              </div>
            ))}
          </div>

          <button
            style={{
              width: '100%',
              marginTop: 12,
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
            Continue WHO-GMP assessment &rarr;
          </button>
        </div>

        {/* Right: Other pathways */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {otherPathways.map((p, i) => (
            <div key={i} style={{ border: '0.5px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--pmx-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--pmx-tx2)' }}>{p.sub}</div>
                </div>
                <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: badgeStyles[p.statusClass].bg, color: badgeStyles[p.statusClass].color }}>
                  {p.status}
                </span>
              </div>
              {p.progress !== null && (
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 5 }}>
                  {p.progress > 0 && <div style={{ height: '100%', width: `${p.progress}%`, background: 'var(--pmx-teal)', borderRadius: 3 }} />}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--pmx-tx2)' }}>{p.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
