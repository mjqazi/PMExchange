'use client';

export default function PMXAcademy() {
  const modules = [
    {
      title: 'GMP Orientation',
      meta: '4 hours \u00B7 All seller staff \u00B7 Required',
      status: 'Completed',
      statusClass: 'success',
      progress: 100,
      progressColor: 'var(--pmx-green)',
      progressText: '5 sections \u00B7 Completed 14 Mar 2026 \u00B7 Certificate issued',
      sections: [
        { num: 1, title: 'GMP principles and regulatory framework', done: true },
        { num: 2, title: 'Documentation and record-keeping', done: true },
        { num: 3, title: 'Contamination prevention and hygiene', done: true },
        { num: 4, title: 'Deviation and CAPA management', done: true },
        { num: 5, title: 'Audit readiness and self-inspection', done: true },
      ],
    },
    {
      title: 'DRAP Export Documentation',
      meta: '2.5 hours \u00B7 RA Officers & Seller Admins',
      status: 'In progress',
      statusClass: 'info',
      progress: 60,
      progressColor: 'var(--pmx-teal)',
      progressText: '3 of 5 sections \u00B7 Estimated 1 hour remaining',
      sections: [
        { num: 1, title: 'Understanding DRAP export requirements', done: true },
        { num: 2, title: 'Certificate of Pharmaceutical Product (COPP)', done: true },
        { num: 3, title: 'GMP and Free Sale certificates', done: true },
        { num: 4, title: 'TDAP export permit application', done: false, current: true },
        { num: 5, title: 'PSW integration overview', done: false },
      ],
    },
    {
      title: 'WHO-GMP Readiness Basics',
      meta: '3 hours \u00B7 QA team & Seller Admins',
      status: 'Not started',
      statusClass: 'neutral',
      progress: 0,
      progressColor: null,
      progressText: 'Recommended before starting WHO-GMP pathway assessment',
      sections: null,
      showStartBtn: true,
    },
  ];

  const badgeStyles: Record<string, { bg: string; color: string }> = {
    success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
    info: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
    neutral: { bg: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
  };

  return (
    <div className="animate-fade-in-up" style={{ padding: 20, minHeight: 600 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>PMX Academy</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Compliance training &middot; Complete all required modules to maintain PMX-Certified status</p>
        </div>
      </div>

      {modules.map((m, mi) => (
        <div key={mi} style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
          {/* Module header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{m.title}</div>
              <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginTop: 2 }}>{m.meta}</div>
            </div>
            <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: badgeStyles[m.statusClass].bg, color: badgeStyles[m.statusClass].color }}>
              {m.status}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
            {m.progress > 0 && m.progressColor && (
              <div style={{ height: '100%', width: `${m.progress}%`, background: m.progressColor, borderRadius: 3 }} />
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: m.sections ? 10 : 0 }}>{m.progressText}</div>

          {/* Sections */}
          {m.sections && (
            <div style={{ background: 'var(--pmx-bg2)', borderRadius: 8, padding: 10 }}>
              {m.sections.map((s, si) => (
                <div
                  key={si}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 0',
                    borderBottom: si < m.sections!.length - 1 ? '0.5px solid var(--border)' : 'none',
                    fontSize: 12,
                  }}
                >
                  {s.done ? (
                    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: 'var(--pmx-green-light)', color: 'var(--pmx-green)' }}>
                      &#10003;
                    </span>
                  ) : (
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: '1.5px solid var(--input)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      color: 'var(--pmx-tx3)',
                      flexShrink: 0,
                    }}>
                      {s.num}
                    </div>
                  )}
                  {s.current ? (
                    <span style={{ color: 'var(--pmx-teal)', fontWeight: 600, flex: 1 }}>
                      {s.num}. {s.title} &larr; Continue
                    </span>
                  ) : s.done ? (
                    <span style={{ flex: 1 }}>{s.num}. {s.title}</span>
                  ) : (
                    <span style={{ color: 'var(--pmx-tx3)', flex: 1 }}>{s.title}</span>
                  )}
                  {s.current && (
                    <button style={{
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
                      marginLeft: 'auto',
                    }}>
                      Start
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {m.showStartBtn && (
            <button
              style={{
                marginTop: 10,
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
              Start module &rarr;
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
