'use client';

import { useState } from 'react';

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

const monoStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 };

const allLogs = [
  { timestamp: '2026-04-05 14:07:32', table: 'batches', recordId: 'LHR-2026-0031', action: 'UPDATE', actionType: 'warning' as const, user: 'farrukh.ali (SELLER_QA)', ip: '103.18.44.x', detail: 'View diff', detailColor: 'var(--pmx-teal)' },
  { timestamp: '2026-04-05 14:07:32', table: 'coas', recordId: 'COA-031', action: 'INSERT', actionType: 'info' as const, user: 'system (QA release trigger)', ip: 'internal', detail: 'Auto-generated', detailColor: 'var(--pmx-tx3)' },
  { timestamp: '2026-04-05 13:55:11', table: 'batch_qc_tests', recordId: 'bqt-4421', action: 'INSERT', actionType: 'info' as const, user: 'amna.siddiqui (SELLER_QA)', ip: '103.18.44.x', detail: '', detailColor: '' },
  { timestamp: '2026-04-05 09:14:22', table: 'batch_steps', recordId: 'bst-1234', action: 'INSERT', actionType: 'info' as const, user: 'tariq.mahmood (SELLER_OP)', ip: '103.18.44.x', detail: '', detailColor: '' },
  { timestamp: '2026-04-05 08:30:00', table: 'onboarding_documents', recordId: 'fmeds-doc-7', action: 'INSERT', actionType: 'info' as const, user: 'admin@fmeds.pk (SELLER_ADMIN)', ip: '175.111.x.x', detail: '', detailColor: '' },
  { timestamp: '2026-04-04 16:22:41', table: 'orders', recordId: 'ORD-2026-0041', action: 'UPDATE', actionType: 'warning' as const, user: 'system (escrow-confirm)', ip: 'internal', detail: '', detailColor: '' },
];

export default function AuditLogPage() {
  const [tableFilter, setTableFilter] = useState('All tables');
  const [actionFilter, setActionFilter] = useState('All actions');
  const [userFilter, setUserFilter] = useState('');

  const filteredLogs = allLogs.filter((log) => {
    if (tableFilter !== 'All tables' && log.table !== tableFilter) return false;
    if (actionFilter !== 'All actions' && log.action !== actionFilter) return false;
    if (userFilter && !log.user.toLowerCase().includes(userFilter.toLowerCase())) return false;
    return true;
  });

  const selectStyle = {
    width: 'auto',
    padding: '8px 10px',
    border: '0.5px solid var(--input)',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--pmx-tx)',
    background: 'var(--pmx-bg)',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Audit Log</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Immutable &middot; PostgreSQL AFTER trigger on all 15 tables &middot; No DELETE or UPDATE permitted &mdash; even for PMX_ADMIN</p>
        </div>
      </div>

      {/* Audit Log Card */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            style={selectStyle}
          >
            <option>All tables</option>
            <option>batches</option>
            <option>coas</option>
            <option>orders</option>
            <option>users</option>
            <option>onboarding_documents</option>
            <option>batch_qc_tests</option>
            <option>batch_steps</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={selectStyle}
          >
            <option>All actions</option>
            <option>INSERT</option>
            <option>UPDATE</option>
            <option>DELETE</option>
          </select>
          <input
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Filter by user..."
            style={{ ...selectStyle, width: 200 }}
          />
          <button
            onClick={() => { setTableFilter('All tables'); setActionFilter('All actions'); setUserFilter(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}
          >
            Reset filters
          </button>
          <span style={{ fontSize: 11, color: 'var(--pmx-tx2)', alignSelf: 'center' }}>
            Showing {filteredLogs.length} of {allLogs.length} entries
          </span>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Timestamp (UTC)', 'Table', 'Record ID', 'Action', 'User (role)', 'IP address', 'Details'].map((h) => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, i) => (
              <tr key={i}>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', ...monoStyle, fontSize: 11 }}>
                  {log.timestamp}
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 }}>
                  {log.table}
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <span style={monoStyle}>{log.recordId}</span>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  <Badge type={log.actionType}>{log.action}</Badge>
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 11 }}>
                  {log.user}
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', ...monoStyle, fontSize: 10 }}>
                  {log.ip}
                </td>
                <td style={{ padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle' }}>
                  {log.detail && (
                    <span style={{ fontSize: 11, color: log.detailColor, cursor: log.detailColor === 'var(--pmx-teal)' ? 'pointer' : 'default' }}>
                      {log.detail}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer note */}
        <div style={{ marginTop: 12, padding: 10, background: 'var(--pmx-bg2)', borderRadius: 8, fontSize: 11, color: 'var(--pmx-tx2)' }}>
          Audit trail enforced at database level. AFTER trigger on INSERT, UPDATE, DELETE for all critical tables. Cannot be disabled, bypassed, or deleted by any role.
        </div>
      </div>
    </div>
  );
}
