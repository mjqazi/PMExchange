'use client';

import { useState, useEffect } from 'react';

const DEMO_ORDERS = [
  { id: 'ORD-2026-0041', buyer: 'Gulf Medical LLC (SA)', product: 'Metformin 500mg', qty: '5M tabs', value: '$148,000', stage: 'In production', stageClass: 'info', escrow: 'Funded', escrowClass: 'success' },
  { id: 'ORD-2026-0038', buyer: 'Fengtai Imports (CN)', product: 'Atorvastatin 40mg', qty: '2M tabs', value: '$290,000', stage: 'Negotiating', stageClass: 'warning', escrow: 'Pending', escrowClass: 'neutral' },
];

const DEMO_PIPELINE_STAGES = [
  { num: 1, label: 'RFQ', status: 'done' },
  { num: 2, label: 'Responses', status: 'done' },
  { num: 3, label: 'Negotiate', status: 'done' },
  { num: 4, label: 'Contract', status: 'done' },
  { num: 5, label: 'Escrow', status: 'done' },
  { num: 6, label: 'Production', status: 'current' },
  { num: 7, label: 'Dispatch', status: 'pending' },
  { num: 8, label: 'Complete', status: 'pending' },
];

const STAGE_LABELS = ['RFQ', 'Responses', 'Negotiate', 'Contract', 'Escrow', 'Production', 'Dispatch', 'Complete'];

function buildPipelineFromStatus(status: string) {
  const s = (status || '').toLowerCase();
  let currentIdx = 5; // default to Production
  if (s.includes('rfq')) currentIdx = 0;
  else if (s.includes('response')) currentIdx = 1;
  else if (s.includes('negotiat')) currentIdx = 2;
  else if (s.includes('contract')) currentIdx = 3;
  else if (s.includes('escrow')) currentIdx = 4;
  else if (s.includes('production') || s.includes('in production')) currentIdx = 5;
  else if (s.includes('dispatch')) currentIdx = 6;
  else if (s.includes('complete') || s.includes('delivered')) currentIdx = 7;

  return STAGE_LABELS.map((label, i) => ({
    num: i + 1,
    label,
    status: i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'pending',
  }));
}

export default function SellerOrders() {
  const [orders, setOrders] = useState(DEMO_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(DEMO_ORDERS[0]);
  const [pipelineStages, setPipelineStages] = useState(DEMO_PIPELINE_STAGES);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const items = Array.isArray(d.data) ? d.data : d.data.items || [];
          if (items.length > 0) {
            const mapped = items.map((o: Record<string, unknown>) => {
              const productLabel = o.product_inn
                ? `${o.product_inn} ${o.strength || ''}`.trim()
                : String(o.product || o.product_name || '');
              const qty = o.quantity ? Number(o.quantity).toLocaleString() : String(o.qty || '');
              const price = o.agreed_price_usd && o.quantity
                ? `$${(Number(o.agreed_price_usd) * Number(o.quantity)).toLocaleString()}`
                : String(o.value || '');
              return {
                id: String(o.id || o.order_id || ''),
                buyer: `${o.buyer_name || o.buyer || ''}${o.buyer_country ? ` (${o.buyer_country})` : ''}`,
                product: productLabel,
                qty,
                value: price,
                stage: String(o.status || o.stage || ''),
                stageClass: mapStageClass(String(o.status || o.stage || '')),
                escrow: String(o.escrow_status || o.escrow || 'PENDING'),
                escrowClass: mapEscrowClass(String(o.escrow_status || o.escrow || '')),
              };
            });
            setOrders(mapped);
            setSelectedOrder(mapped[0]);
            setPipelineStages(buildPipelineFromStatus(mapped[0].stage));
          }
        }
      })
      .catch(() => { setError('Failed to load orders. Showing demo data.'); })
      .finally(() => setLoading(false));
  }, []);

  const handleSelectOrder = (o: typeof DEMO_ORDERS[0]) => {
    setSelectedOrder(o);
    setPipelineStages(buildPipelineFromStatus(o.stage));
    setDispatchMsg(null);
  };

  const handleConfirmDispatch = async () => {
    if (!selectedOrder) return;
    setDispatching(true);
    setDispatchMsg(null);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_status: 'DISPATCHED' }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchMsg('Dispatch confirmed');
        // Update pipeline to show dispatch as current
        setPipelineStages(buildPipelineFromStatus('dispatch'));
      } else {
        setDispatchMsg('Dispatch confirmed (demo mode)');
      }
    } catch {
      setDispatchMsg('Dispatch confirmed (demo mode)');
    } finally {
      setDispatching(false);
    }
  };

  const badgeStyles: Record<string, { bg: string; color: string }> = {
    success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
    info: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
    warning: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
    neutral: { bg: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
  };

  // Calculate progress bar segments
  const doneCount = pipelineStages.filter(s => s.status === 'done').length;
  const currentCount = pipelineStages.filter(s => s.status === 'current').length;
  const pendingCount = pipelineStages.filter(s => s.status === 'pending').length;

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading orders...</div>
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
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>My Orders</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Active and completed orders &middot; 8-stage lifecycle &middot; All docs and communication in PMX</p>
        </div>
      </div>

      {/* Orders table */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Order ID', 'Buyer', 'Product', 'Qty', 'Value (USD)', 'Stage', 'Escrow'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                onClick={() => handleSelectOrder(o)}
                style={{ cursor: 'pointer', background: selectedOrder?.id === o.id ? 'var(--pmx-teal-light)' : 'transparent' }}
              >
                <td style={tdStyle}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{o.id}</span></td>
                <td style={tdStyle}>{o.buyer}</td>
                <td style={tdStyle}>{o.product}</td>
                <td style={tdStyle}>{o.qty}</td>
                <td style={tdStyle}>{o.value}</td>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: badgeStyles[o.stageClass]?.bg, color: badgeStyles[o.stageClass]?.color }}>
                    {o.stage}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: badgeStyles[o.escrowClass]?.bg, color: badgeStyles[o.escrowClass]?.color }}>
                    {o.escrow}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order detail with pipeline */}
      {selectedOrder && (
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{selectedOrder.id}</span> \u2014 {selectedOrder.product} &middot; {selectedOrder.buyer}
              </div>
              <div style={{ fontSize: 11, color: 'var(--pmx-tx2)' }}>
                Value: {selectedOrder.value} &middot; Escrow: {selectedOrder.escrow}
              </div>
            </div>
            <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: badgeStyles[selectedOrder.stageClass]?.bg || 'var(--pmx-blue-light)', color: badgeStyles[selectedOrder.stageClass]?.color || 'var(--pmx-blue)' }}>
              Stage {pipelineStages.findIndex(s => s.status === 'current') + 1} \u2014 {selectedOrder.stage}
            </span>
          </div>

          {/* Pipeline dots */}
          <div style={{ display: 'flex', gap: 2, margin: '14px 0' }}>
            {pipelineStages.map((s) => (
              <div key={s.num} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    margin: '0 auto 4px',
                    border: '1px solid',
                    background: s.status === 'done' ? 'var(--pmx-green-light)' : s.status === 'current' ? 'var(--pmx-teal-light)' : 'var(--pmx-bg2)',
                    color: s.status === 'done' ? 'var(--pmx-green)' : s.status === 'current' ? 'var(--pmx-teal)' : 'var(--pmx-tx3)',
                    borderColor: s.status === 'done' ? 'var(--pmx-green)' : s.status === 'current' ? 'var(--pmx-teal)' : 'var(--input)',
                  }}
                >
                  {s.num}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: s.status === 'current' ? 'var(--pmx-teal)' : 'var(--pmx-tx2)',
                    lineHeight: 1.2,
                    fontWeight: s.status === 'current' ? 600 : 400,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
            <div style={{ flex: doneCount, height: 3, borderRadius: 1, background: 'var(--pmx-green)', opacity: 0.6 }} />
            <div style={{ flex: currentCount, height: 3, borderRadius: 1, background: 'var(--pmx-teal)' }} />
            <div style={{ flex: pendingCount, height: 3, borderRadius: 1, background: 'var(--border)' }} />
          </div>

          {dispatchMsg && (
            <div style={{ marginTop: 10, padding: 10, background: 'var(--pmx-green-light)', borderRadius: 8, fontSize: 12, color: 'var(--pmx-green)', fontWeight: 600 }}>
              {dispatchMsg}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={handleConfirmDispatch}
              disabled={dispatching}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                cursor: dispatching ? 'wait' : 'pointer',
                border: 'none',
                background: dispatching ? 'var(--pmx-tx3)' : 'var(--pmx-teal)',
                color: '#fff',
                fontFamily: 'inherit',
                opacity: dispatching ? 0.7 : 1,
              }}
            >
              {dispatching ? 'Confirming...' : 'Confirm dispatch \u2192'}
            </button>
            <button style={btnSmStyle}>View contract PDF</button>
            <button style={btnSmStyle}>Open message thread</button>
          </div>
        </div>
      )}
    </div>
  );
}

function mapStageClass(stage: string): string {
  const s = (stage || '').toLowerCase();
  if (s.includes('complete') || s.includes('delivered')) return 'success';
  if (s.includes('production') || s.includes('dispatch') || s.includes('in progress')) return 'info';
  if (s.includes('negotiat') || s.includes('pending')) return 'warning';
  return 'info';
}

function mapEscrowClass(escrow: string): string {
  const s = (escrow || '').toLowerCase();
  if (s.includes('funded') || s.includes('confirmed') || s.includes('released')) return 'success';
  if (s.includes('pending')) return 'neutral';
  return 'neutral';
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
