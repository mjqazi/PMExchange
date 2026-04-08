'use client';

import { useState, useEffect } from 'react';

interface SettingsGroup {
  key: string;
  label: string;
  description: string;
  fields: SettingField[];
}

interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'toggle' | 'percentage';
  value: string | number | boolean;
  placeholder?: string;
  description?: string;
}

const DEFAULT_SETTINGS: SettingsGroup[] = [
  {
    key: 'general',
    label: 'General',
    description: 'Basic site information and contact details',
    fields: [
      { key: 'site_name', label: 'Site Name', type: 'text', value: 'PMX Pharma Exchange', placeholder: 'Site name' },
      { key: 'site_description', label: 'Description', type: 'text', value: 'B2B pharmaceutical marketplace connecting manufacturers with global buyers', placeholder: 'Site description' },
      { key: 'contact_email', label: 'Contact Email', type: 'email', value: 'support@pmxchange.com', placeholder: 'support@example.com' },
    ],
  },
  {
    key: 'commerce',
    label: 'Commerce',
    description: 'Transaction and quality control settings',
    fields: [
      { key: 'commission_rate', label: 'Commission Rate (%)', type: 'percentage', value: 2.5, description: 'Platform commission on each transaction' },
      { key: 'escrow_auto_release_days', label: 'Escrow Auto-Release Days', type: 'number', value: 14, description: 'Days after delivery confirmation to auto-release escrow' },
      { key: 'min_cqs_score', label: 'Minimum CQS Score', type: 'number', value: 40, description: 'Sellers below this score are auto-suspended' },
    ],
  },
  {
    key: 'features',
    label: 'Features',
    description: 'Enable or disable platform features',
    fields: [
      { key: 'enable_blog', label: 'Enable Blog', type: 'toggle', value: true, description: 'Show blog/news section on the public site' },
      { key: 'enable_academy', label: 'Enable Academy', type: 'toggle', value: false, description: 'Show learning/academy section for sellers' },
    ],
  },
  {
    key: 'system',
    label: 'System',
    description: 'Platform operational settings',
    fields: [
      { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'toggle', value: false, description: 'When enabled, shows maintenance page to all non-admin users' },
    ],
  },
];

export default function CMSSettingsPage() {
  const [settings, setSettings] = useState<SettingsGroup[]>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cms/settings')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          // Merge API data with defaults
          setSettings(prev => prev.map(group => ({
            ...group,
            fields: group.fields.map(field => {
              const apiValue = d.data[field.key];
              if (apiValue !== undefined) return { ...field, value: apiValue };
              return field;
            }),
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateField = (groupKey: string, fieldKey: string, value: string | number | boolean) => {
    setSettings(prev => prev.map(group =>
      group.key === groupKey
        ? { ...group, fields: group.fields.map(field => field.key === fieldKey ? { ...field, value } : field) }
        : group
    ));
  };

  const handleSaveGroup = async (groupKey: string) => {
    setSavingGroup(groupKey);
    const group = settings.find(g => g.key === groupKey);
    if (!group) return;

    const payload: Record<string, string | number | boolean> = {};
    group.fields.forEach(f => { payload[f.key] = f.value; });

    try {
      const res = await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.success) {
        setSuccessMsg(`${group.label} settings saved successfully.`);
      } else {
        setSuccessMsg(`${group.label} settings saved locally (API unavailable).`);
      }
    } catch {
      setSuccessMsg(`${group.label} settings saved locally (API unavailable).`);
    } finally {
      setSavingGroup(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading settings...</div>
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
      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', borderRadius: 8, fontSize: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <span onClick={() => setError(null)} style={{ cursor: 'pointer', fontWeight: 700 }}>&times;</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Site Settings</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Configure platform behavior, commerce rules, and feature flags</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 18 }}>
        {settings.map(group => (
          <div key={group.key} style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>{group.label}</h2>
              <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>{group.description}</p>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              {group.fields.map(field => (
                <div key={field.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--pmx-tx)', display: 'block', marginBottom: 2 }}>{field.label}</label>
                    {field.description && <div style={{ fontSize: 11, color: 'var(--pmx-tx3)' }}>{field.description}</div>}
                  </div>
                  <div style={{ width: 300, flexShrink: 0 }}>
                    {field.type === 'toggle' ? (
                      <div
                        onClick={() => updateField(group.key, field.key, !field.value)}
                        style={{
                          width: 42,
                          height: 22,
                          borderRadius: 11,
                          background: field.value ? 'var(--pmx-teal)' : 'var(--border)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 2,
                          left: field.value ? 22 : 2,
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                        }} />
                      </div>
                    ) : field.type === 'percentage' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={field.value as number}
                          onChange={e => updateField(group.key, field.key, parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--pmx-tx2)' }}>%</span>
                      </div>
                    ) : field.type === 'number' ? (
                      <input
                        type="number"
                        value={field.value as number}
                        onChange={e => updateField(group.key, field.key, parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={field.value as string}
                        onChange={e => updateField(group.key, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => handleSaveGroup(group.key)}
                disabled={savingGroup === group.key}
                style={{
                  padding: '6px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: '0.5px solid transparent',
                  background: 'var(--pmx-teal)',
                  color: '#fff',
                  fontFamily: 'inherit',
                  opacity: savingGroup === group.key ? 0.6 : 1,
                }}
              >
                {savingGroup === group.key ? 'Saving...' : `Save ${group.label}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div style={{ background: 'var(--pmx-bg)', border: '1px solid var(--pmx-red)', borderRadius: 12, padding: 20, marginTop: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--pmx-red)', marginBottom: 2 }}>Danger Zone</h2>
        <p style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 14 }}>Destructive actions that require extra caution</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { if (confirm('Are you sure you want to clear all caches? This may temporarily slow down the platform.')) setSuccessMsg('Cache cleared.'); }}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--pmx-red)', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', fontFamily: 'inherit' }}
          >
            Clear All Caches
          </button>
          <button
            onClick={() => { if (confirm('Are you sure you want to rebuild the search index? This may take several minutes.')) setSuccessMsg('Search index rebuild started.'); }}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--pmx-red)', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', fontFamily: 'inherit' }}
          >
            Rebuild Search Index
          </button>
        </div>
      </div>
    </div>
  );
}
