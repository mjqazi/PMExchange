'use client';

import { useState, useEffect } from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  body: string;
  variables: string[];
  active: boolean;
}

const DEMO_TEMPLATES: EmailTemplate[] = [
  {
    id: '1', name: 'Welcome Email', slug: 'welcome', subject: 'Welcome to PMX Pharma Exchange, {{company_name}}!',
    body: `<h1>Welcome to PMX!</h1>
<p>Dear {{contact_name}},</p>
<p>Thank you for registering <strong>{{company_name}}</strong> on PMX Pharma Exchange.</p>
<p>Your next step is to complete the KYB verification process. Please log in to your dashboard and submit the required documents.</p>
<p>If you need any assistance, contact us at support@pmxchange.com.</p>
<p>Best regards,<br/>The PMX Team</p>`,
    variables: ['company_name', 'contact_name', 'dashboard_url'],
    active: true,
  },
  {
    id: '2', name: 'KYB Approved', slug: 'kyb-approved', subject: 'KYB Verification Approved - {{company_name}}',
    body: `<h1>Congratulations!</h1>
<p>Dear {{contact_name}},</p>
<p>Your KYB verification for <strong>{{company_name}}</strong> has been approved.</p>
<p>You are now a verified {{tier}} seller on PMX. Your products will be visible to qualified buyers.</p>
<p>Next steps:</p>
<ul>
<li>Complete your product catalog</li>
<li>Set competitive pricing</li>
<li>Review our seller guidelines</li>
</ul>`,
    variables: ['company_name', 'contact_name', 'tier', 'dashboard_url'],
    active: true,
  },
  {
    id: '3', name: 'Order Confirmation', slug: 'order-confirmation', subject: 'Order {{order_id}} Confirmed',
    body: `<h1>Order Confirmed</h1>
<p>Order <strong>{{order_id}}</strong> has been confirmed.</p>
<p>Buyer: {{buyer_name}}<br/>Seller: {{seller_name}}<br/>Amount: {{currency}} {{amount}}</p>
<p>Escrow has been funded. The seller has {{shipping_days}} days to ship the order.</p>`,
    variables: ['order_id', 'buyer_name', 'seller_name', 'currency', 'amount', 'shipping_days'],
    active: true,
  },
  {
    id: '4', name: 'Escrow Release', slug: 'escrow-release', subject: 'Escrow Released for Order {{order_id}}',
    body: `<h1>Payment Released</h1>
<p>The escrow for order <strong>{{order_id}}</strong> has been released.</p>
<p>Amount: {{currency}} {{amount}}<br/>Released to: {{seller_name}}</p>
<p>Funds will be available in your account within 2-3 business days.</p>`,
    variables: ['order_id', 'seller_name', 'currency', 'amount'],
    active: true,
  },
  {
    id: '5', name: 'CQS Alert', slug: 'cqs-alert', subject: 'CQS Score Alert - {{company_name}}',
    body: `<h1>CQS Score Alert</h1>
<p>Dear {{contact_name}},</p>
<p>Your CQS score for <strong>{{company_name}}</strong> has dropped to <strong>{{cqs_score}}</strong>.</p>
<p>{{alert_message}}</p>
<p>Please review your quality metrics and take corrective action to avoid account suspension.</p>`,
    variables: ['company_name', 'contact_name', 'cqs_score', 'alert_message'],
    active: true,
  },
  {
    id: '6', name: 'Dispute Filed', slug: 'dispute-filed', subject: 'Dispute Filed: Order {{order_id}}',
    body: `<h1>Dispute Notification</h1>
<p>A dispute has been filed for order <strong>{{order_id}}</strong>.</p>
<p>Filed by: {{filed_by}}<br/>Reason: {{reason}}</p>
<p>Please respond within 48 hours. The PMX team will review and mediate.</p>`,
    variables: ['order_id', 'filed_by', 'reason', 'dispute_url'],
    active: true,
  },
  {
    id: '7', name: 'Password Reset', slug: 'password-reset', subject: 'Reset Your PMX Password',
    body: `<h1>Password Reset</h1>
<p>We received a request to reset the password for your PMX account.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{reset_url}}">Reset Password</a></p>
<p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>`,
    variables: ['reset_url', 'contact_name'],
    active: false,
  },
];

const Badge = ({ children, type }: { children: React.ReactNode; type: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }) => {
  const styles: Record<string, { bg: string; color: string }> = {
    success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
    warning: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
    danger: { bg: 'var(--pmx-red-light)', color: 'var(--pmx-red)' },
    info: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
    neutral: { bg: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
  };
  const s = styles[type];
  return (
    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', background: s.bg, color: s.color }}>
      {children}
    </span>
  );
};

const thStyle: React.CSSProperties = { textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 };

export default function CMSTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEMO_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cms/templates')
      .then(r => r.json())
      .then(d => { if (d.success) setTemplates(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const url = editing.id ? `/api/cms/templates/${editing.id}` : '/api/cms/templates';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
      const d = await res.json();
      if (d.success) {
        if (editing.id) {
          setTemplates(prev => prev.map(t => t.id === editing.id ? editing : t));
        } else {
          setTemplates(prev => [...prev, { ...editing, id: d.data?.id || String(Date.now()) }]);
        }
        setSuccessMsg('Template saved successfully.');
      } else {
        if (editing.id) {
          setTemplates(prev => prev.map(t => t.id === editing.id ? editing : t));
        } else {
          setTemplates(prev => [...prev, { ...editing, id: String(Date.now()) }]);
        }
        setSuccessMsg('Template saved locally (API unavailable).');
      }
    } catch {
      if (editing.id) {
        setTemplates(prev => prev.map(t => t.id === editing.id ? editing : t));
      } else {
        setTemplates(prev => [...prev, { ...editing, id: String(Date.now()) }]);
      }
      setSuccessMsg('Template saved locally (API unavailable).');
    } finally {
      setSaving(false);
      setShowEditor(false);
      setEditing(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const getPreviewHtml = (template: EmailTemplate): string => {
    let html = template.body;
    template.variables.forEach(v => {
      const replacement = `<span style="background:#FFF3CD;padding:1px 4px;border-radius:2px;font-family:monospace;font-size:12px;">[${v}]</span>`;
      html = html.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), replacement);
    });
    return html;
  };

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      {successMsg && (
        <div style={{ padding: '8px 12px', background: 'var(--pmx-green-light)', color: 'var(--pmx-green)', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Email Templates</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>{templates.length} templates &middot; {templates.filter(t => t.active).length} active &middot; Configure automated email content</p>
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, width: '90%', maxWidth: 850, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--pmx-tx)' }}>Edit Template: {editing.name}</h2>
              <button onClick={() => { setShowEditor(false); setEditing(null); }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--pmx-tx2)' }}>&times;</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Subject Line</label>
              <input
                value={editing.subject}
                onChange={e => setEditing({ ...editing, subject: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                placeholder="Email subject line"
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>HTML Body</label>
              <textarea
                value={editing.body}
                onChange={e => setEditing({ ...editing, body: e.target.value })}
                rows={14}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: 'var(--pmx-bg)', resize: 'vertical' }}
              />
            </div>

            <div style={{ background: 'var(--pmx-bg2)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', marginBottom: 6 }}>Available Variables</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {editing.variables.map(v => (
                  <span key={v} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' }}>
                    {'{{' + v + '}}'}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} />
                Active
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPreview(true)}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}
              >Preview</button>
              <button onClick={() => { setShowEditor(false); setEditing(null); }} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, width: '90%', maxWidth: 650, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--pmx-tx)' }}>Email Preview</h2>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--pmx-tx2)' }}>&times;</button>
            </div>

            <div style={{ background: 'var(--pmx-bg2)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--pmx-tx3)', marginBottom: 4 }}>Subject:</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pmx-tx)' }}>{editing.subject}</div>
            </div>

            <div style={{ border: '0.5px solid var(--border)', borderRadius: 8, padding: 20 }}>
              <div dangerouslySetInnerHTML={{ __html: getPreviewHtml(editing) }} style={{ fontSize: 14, lineHeight: 1.6, color: '#333' }} />
            </div>

            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--pmx-tx3)' }}>
              Yellow-highlighted values represent template variables that will be replaced with actual data.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => setShowPreview(false)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Slug', 'Subject', 'Variables', 'Active', 'Actions'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template.id}>
                <td style={tdStyle}><strong>{template.name}</strong></td>
                <td style={tdStyle}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--pmx-tx2)' }}>{template.slug}</span></td>
                <td style={{ ...tdStyle, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{template.subject}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {template.variables.slice(0, 3).map(v => (
                      <span key={v} style={{ display: 'inline-block', padding: '1px 5px', borderRadius: 3, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", background: 'var(--pmx-bg2)', color: 'var(--pmx-tx2)' }}>{v}</span>
                    ))}
                    {template.variables.length > 3 && (
                      <span style={{ fontSize: 10, color: 'var(--pmx-tx3)' }}>+{template.variables.length - 3}</span>
                    )}
                  </div>
                </td>
                <td style={tdStyle}><Badge type={template.active ? 'success' : 'danger'}>{template.active ? 'Active' : 'Inactive'}</Badge></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { setEditing(template); setShowEditor(true); setShowPreview(false); }}
                      style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}
                    >Edit</button>
                    <button
                      onClick={() => { setEditing(template); setShowPreview(true); }}
                      style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-teal)', fontFamily: 'inherit' }}
                    >Preview</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
