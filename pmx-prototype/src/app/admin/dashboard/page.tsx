'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const DEMO_CQS_DATA = [
  { range: '90-100', count: 4, fill: 'var(--pmx-green)' },
  { range: '80-89', count: 10, fill: 'var(--pmx-green)' },
  { range: '70-79', count: 12, fill: 'var(--pmx-amber)' },
  { range: '60-69', count: 10, fill: 'var(--pmx-amber)' },
  { range: '50-59', count: 6, fill: 'var(--pmx-red)' },
  { range: '40-49', count: 4, fill: 'var(--pmx-red)' },
  { range: '<40', count: 1, fill: 'var(--pmx-red)' },
];

const escrowData = [
  { month: 'Nov', amount: 820 },
  { month: 'Dec', amount: 1100 },
  { month: 'Jan', amount: 1350 },
  { month: 'Feb', amount: 1680 },
  { month: 'Mar', amount: 2040 },
  { month: 'Apr', amount: 2400 },
];

const DEMO_KPIS = [
  { label: 'Active manufacturers', value: '47', sub: '+3 this month', subType: 'up' },
  { label: 'Active buyers', value: '23', sub: '+5 this month', subType: 'up' },
  { label: 'Escrow volume (USD)', value: '2.4M', sub: '+18% vs last month', subType: 'up' },
  { label: 'Avg. CQS score', value: '71.4', sub: '+2.1 pts this month', subType: 'up' },
];

const tierBreakdown = [
  { label: 'Tier 1 \u2014 Essentials', count: 28, pct: 60, color: 'var(--pmx-gray)' },
  { label: 'Tier 2 \u2014 Export Ready', count: 14, pct: 30, color: 'var(--pmx-blue)' },
  { label: 'Tier 3 \u2014 Regulated Markets', count: 5, pct: 11, color: 'var(--pmx-teal)' },
];

const alerts = [
  { label: 'CQS auto-suspensions', value: '1', color: 'var(--pmx-red)' },
  { label: 'KYB queue pending', value: '3', color: 'var(--pmx-amber)' },
  { label: 'Open disputes', value: '1', color: 'var(--pmx-amber)' },
  { label: 'Timeout expiring soon', value: '2', color: 'var(--pmx-amber)' },
  { label: 'CoAs generated (30d)', value: '47', color: 'var(--pmx-tx)' },
  { label: 'Orders completed (30d)', value: '8', color: 'var(--pmx-tx)' },
];

const security = [
  { label: 'TLS version', value: 'TLS 1.3', type: 'success' },
  { label: 'Encryption at rest', value: 'AES-256', type: 'success' },
  { label: 'Last pen test', value: 'Mar 2026', type: 'success' },
  { label: 'Critical CVEs', value: '0', type: 'success' },
  { label: 'Platform uptime (14d)', value: '99.97%', type: 'success' },
  { label: 'RDS backup verified', value: 'Apr 4', type: 'success' },
];

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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState(DEMO_KPIS);
  const [cqsData, setCqsData] = useState(DEMO_CQS_DATA);

  useEffect(() => {
    // Fetch sellers for seller count + CQS data
    fetch('/api/sellers')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          const sellers = d.data;
          const sellerCount = sellers.length;
          // Build CQS distribution from real seller data
          const ranges = [
            { range: '90-100', min: 90, max: 100, fill: 'var(--pmx-green)' },
            { range: '80-89', min: 80, max: 89, fill: 'var(--pmx-green)' },
            { range: '70-79', min: 70, max: 79, fill: 'var(--pmx-amber)' },
            { range: '60-69', min: 60, max: 69, fill: 'var(--pmx-amber)' },
            { range: '50-59', min: 50, max: 59, fill: 'var(--pmx-red)' },
            { range: '40-49', min: 40, max: 49, fill: 'var(--pmx-red)' },
            { range: '<40', min: 0, max: 39, fill: 'var(--pmx-red)' },
          ];
          const withCqs = sellers.filter((s: Record<string, unknown>) => s.cqs !== null && s.cqs !== undefined && s.cqsScore !== null && s.cqsScore !== undefined);
          if (withCqs.length > 0) {
            const newCqs = ranges.map(r => ({
              range: r.range,
              count: withCqs.filter((s: Record<string, unknown>) => {
                const score = Number(s.cqsScore || s.cqs || 0);
                return score >= r.min && score <= r.max;
              }).length,
              fill: r.fill,
            }));
            setCqsData(newCqs);
            const avgCqs = withCqs.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.cqsScore || s.cqs || 0), 0) / withCqs.length;
            setKpis(prev => prev.map((k, i) => {
              if (i === 0) return { ...k, value: String(sellerCount) };
              if (i === 3) return { ...k, value: avgCqs.toFixed(1) };
              return k;
            }));
          } else {
            setKpis(prev => prev.map((k, i) => i === 0 ? { ...k, value: String(sellerCount) } : k));
          }
        }
      })
      .catch(() => { setError('Failed to load seller data. Showing demo data.'); })
      .finally(() => { setLoading(false); });

    // Fetch buyers for buyer count
    fetch('/api/admin/buyers')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          setKpis(prev => prev.map((k, i) => i === 1 ? { ...k, value: String(d.data.length) } : k));
        }
      })
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)', borderRadius: 8, fontSize: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <span onClick={() => setError(null)} style={{ cursor: 'pointer', fontWeight: 700 }}>&times;</span>
        </div>
      )}
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Platform Analytics</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>PMX Admin &middot; Platform intelligence &middot; Updated in real-time</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Export report</button>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit' }}>Run CQS recalc</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: 5 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--pmx-tx)' }}>{k.value}</div>
            <div style={{ fontSize: 11, marginTop: 3, color: 'var(--pmx-green)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
        {/* CQS Distribution */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, margin: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>CQS score distribution &mdash; 47 sellers</div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={cqsData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'var(--pmx-tx2)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--pmx-tx2)' }} />
              <Tooltip contentStyle={{ fontSize: 11, background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 6 }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {cqsData.map((entry, index) => (
                  <rect key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--pmx-tx2)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--pmx-green)', display: 'inline-block' }} />Green (80+) &mdash; 14
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--pmx-amber)', display: 'inline-block' }} />Amber (60&ndash;79) &mdash; 22
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--pmx-red)', display: 'inline-block' }} />Red (&lt;60) &mdash; 11
            </span>
          </div>
        </div>

        {/* Escrow Volume */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, margin: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Escrow volume &mdash; 6 months (USD K)</div>
          <ResponsiveContainer width="100%" height={195}>
            <AreaChart data={escrowData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--pmx-tx2)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--pmx-tx2)' }} />
              <Tooltip contentStyle={{ fontSize: 11, background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 6 }} />
              <Area type="monotone" dataKey="amount" stroke="#1D9E75" fill="#E1F5EE" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginTop: 14 }}>
        {/* Tier Breakdown */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, margin: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Seller tier breakdown</div>
          {tierBreakdown.map((t, i) => (
            <div key={t.label} style={{ padding: '10px 0', borderBottom: i < tierBreakdown.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span>{t.label}</span><strong>{t.count}</strong>
              </div>
              <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${t.pct}%`, background: t.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Platform Alerts */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, margin: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Platform alerts</div>
          {alerts.map((a) => (
            <div key={a.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
              <span>{a.label}</span>
              <strong style={{ color: a.color }}>{a.value}</strong>
            </div>
          ))}
        </div>

        {/* Security Status */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, margin: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Security status</div>
          {security.map((s) => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
              <span>{s.label}</span>
              <Badge type="success">{s.value}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
