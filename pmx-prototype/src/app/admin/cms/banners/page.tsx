'use client';

import { useState, useEffect } from 'react';

interface Banner {
  id: string;
  placement: 'hero' | 'announcement';
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  bg_color: string;
  active: boolean;
  starts_at: string;
  ends_at: string;
  sort_order: number;
}

const DEMO_BANNERS: Banner[] = [
  { id: '1', placement: 'hero', title: 'Welcome to PMX Pharma Exchange', subtitle: 'The trusted B2B marketplace for pharmaceutical trade', cta_text: 'Browse Products', cta_link: '/marketplace', bg_color: '#0D4F3C', active: true, starts_at: '2026-01-01', ends_at: '2026-12-31', sort_order: 1 },
  { id: '2', placement: 'announcement', title: 'Tier 3 Applications Now Open', subtitle: 'Apply for EU/FDA regulated market access', cta_text: 'Apply Now', cta_link: '/seller/tier-upgrade', bg_color: '#1A5276', active: true, starts_at: '2026-04-01', ends_at: '2026-06-30', sort_order: 2 },
  { id: '3', placement: 'hero', title: 'CQS Score Improvements', subtitle: 'New tools to help sellers improve their quality scores', cta_text: 'Learn More', cta_link: '/blog/understanding-cqs-guide', bg_color: '#2C3E50', active: false, starts_at: '2026-03-01', ends_at: '2026-04-30', sort_order: 3 },
  { id: '4', placement: 'announcement', title: 'Scheduled Maintenance: April 10', subtitle: 'Platform will be briefly offline from 2:00-4:00 AM PKT', cta_text: '', cta_link: '', bg_color: '#7D6608', active: true, starts_at: '2026-04-08', ends_at: '2026-04-10', sort_order: 4 },
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

export default function CMSBannersPage() {
  const [banners, setBanners] = useState<Banner[]>(DEMO_BANNERS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cms/banners')
      .then(r => r.json())
      .then(d => { if (d.success) setBanners(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const newBanner = (): Banner => ({
    id: '',
    placement: 'hero',
    title: '',
    subtitle: '',
    cta_text: '',
    cta_link: '',
    bg_color: '#0D4F3C',
    active: true,
    starts_at: new Date().toISOString().split('T')[0],
    ends_at: '',
    sort_order: banners.length + 1,
  });

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const url = editing.id ? `/api/cms/banners/${editing.id}` : '/api/cms/banners';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
      const d = await res.json();
      if (d.success) {
        if (editing.id) {
          setBanners(prev => prev.map(b => b.id === editing.id ? editing : b));
        } else {
          setBanners(prev => [...prev, { ...editing, id: d.data?.id || String(Date.now()) }]);
        }
        setSuccessMsg('Banner saved successfully.');
      } else {
        if (editing.id) {
          setBanners(prev => prev.map(b => b.id === editing.id ? editing : b));
        } else {
          setBanners(prev => [...prev, { ...editing, id: String(Date.now()) }]);
        }
        setSuccessMsg('Banner saved locally (API unavailable).');
      }
    } catch {
      if (editing.id) {
        setBanners(prev => prev.map(b => b.id === editing.id ? editing : b));
      } else {
        setBanners(prev => [...prev, { ...editing, id: String(Date.now()) }]);
      }
      setSuccessMsg('Banner saved locally (API unavailable).');
    } finally {
      setSaving(false);
      setShowEditor(false);
      setEditing(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    try { await fetch(`/api/cms/banners/${id}`, { method: 'DELETE' }); } catch { /* ignore */ }
    setBanners(prev => prev.filter(b => b.id !== id));
    setDeleteConfirm(null);
    setSuccessMsg('Banner deleted.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const toggleActive = (banner: Banner) => {
    const updated = { ...banner, active: !banner.active };
    setBanners(prev => prev.map(b => b.id === banner.id ? updated : b));
    fetch(`/api/cms/banners/${banner.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(() => {});
  };

  const moveOrder = (banner: Banner, direction: 'up' | 'down') => {
    const sorted = [...banners].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(b => b.id === banner.id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const tempOrder = sorted[idx].sort_order;
    sorted[idx] = { ...sorted[idx], sort_order: sorted[swapIdx].sort_order };
    sorted[swapIdx] = { ...sorted[swapIdx], sort_order: tempOrder };
    setBanners(sorted);
  };

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading banners...</div>
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

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Banners</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>{banners.length} banners &middot; {banners.filter(b => b.active).length} active &middot; Manage hero and announcement banners</p>
        </div>
        <button
          onClick={() => { setEditing(newBanner()); setShowEditor(true); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit' }}
        >
          + Add Banner
        </button>
      </div>

      {/* Editor Modal */}
      {showEditor && editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, width: '90%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--pmx-tx)' }}>{editing.id ? 'Edit Banner' : 'New Banner'}</h2>
              <button onClick={() => { setShowEditor(false); setEditing(null); }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--pmx-tx2)' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Placement</label>
                <select
                  value={editing.placement}
                  onChange={e => setEditing({ ...editing, placement: e.target.value as Banner['placement'] })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                >
                  <option value="hero">Hero Banner</option>
                  <option value="announcement">Announcement Bar</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Background Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={editing.bg_color}
                    onChange={e => setEditing({ ...editing, bg_color: e.target.value })}
                    style={{ width: 36, height: 36, borderRadius: 6, border: '0.5px solid var(--input)', cursor: 'pointer', padding: 0 }}
                  />
                  <input
                    value={editing.bg_color}
                    onChange={e => setEditing({ ...editing, bg_color: e.target.value })}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", background: 'var(--pmx-bg)' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Title</label>
              <input
                value={editing.title}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                placeholder="Banner title"
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Subtitle</label>
              <input
                value={editing.subtitle}
                onChange={e => setEditing({ ...editing, subtitle: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                placeholder="Banner subtitle"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>CTA Text</label>
                <input
                  value={editing.cta_text}
                  onChange={e => setEditing({ ...editing, cta_text: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                  placeholder="Button text (optional)"
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>CTA Link</label>
                <input
                  value={editing.cta_link}
                  onChange={e => setEditing({ ...editing, cta_link: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                  placeholder="/marketplace"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Starts At</label>
                <input
                  type="date"
                  value={editing.starts_at}
                  onChange={e => setEditing({ ...editing, starts_at: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Ends At</label>
                <input
                  type="date"
                  value={editing.ends_at}
                  onChange={e => setEditing({ ...editing, ends_at: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} />
                Active
              </label>
            </div>

            {/* Preview */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', marginBottom: 6 }}>Preview</div>
              {editing.placement === 'hero' ? (
                <div style={{ background: editing.bg_color, borderRadius: 8, padding: '24px 20px', color: '#fff' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{editing.title || 'Banner Title'}</div>
                  <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 12 }}>{editing.subtitle || 'Banner subtitle'}</div>
                  {editing.cta_text && (
                    <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 6, background: 'rgba(255,255,255,.2)', fontSize: 12, fontWeight: 500 }}>{editing.cta_text}</span>
                  )}
                </div>
              ) : (
                <div style={{ background: editing.bg_color, borderRadius: 8, padding: '10px 16px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{editing.title || 'Announcement text'}</span>
                  {editing.cta_text && (
                    <span style={{ fontSize: 11, textDecoration: 'underline', opacity: 0.85 }}>{editing.cta_text}</span>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowEditor(false); setEditing(null); }} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !editing.title} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit', opacity: saving || !editing.title ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, padding: 24, maxWidth: 400 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Delete Banner?</h3>
            <p style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 16 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-red)', color: '#fff', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Cards */}
      <div style={{ display: 'grid', gap: 14 }}>
        {[...banners].sort((a, b) => a.sort_order - b.sort_order).map(banner => (
          <div key={banner.id} style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Banner Preview */}
            {banner.placement === 'hero' ? (
              <div style={{ background: banner.bg_color, padding: '20px 18px', color: '#fff' }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{banner.title}</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>{banner.subtitle}</div>
                {banner.cta_text && (
                  <span style={{ display: 'inline-block', marginTop: 8, padding: '4px 12px', borderRadius: 5, background: 'rgba(255,255,255,.2)', fontSize: 11, fontWeight: 500 }}>{banner.cta_text}</span>
                )}
              </div>
            ) : (
              <div style={{ background: banner.bg_color, padding: '10px 18px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{banner.title}</span>
                {banner.cta_text && <span style={{ fontSize: 11, textDecoration: 'underline', opacity: 0.85 }}>{banner.cta_text}</span>}
              </div>
            )}

            {/* Banner Meta */}
            <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge type={banner.placement === 'hero' ? 'info' : 'neutral'}>{banner.placement}</Badge>
                <Badge type={banner.active ? 'success' : 'danger'}>{banner.active ? 'Active' : 'Inactive'}</Badge>
                <span style={{ fontSize: 11, color: 'var(--pmx-tx3)' }}>
                  {banner.starts_at} &rarr; {banner.ends_at || 'No end date'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--pmx-tx3)' }}>Order: {banner.sort_order}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => moveOrder(banner, 'up')} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>&uarr;</button>
                <button onClick={() => moveOrder(banner, 'down')} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>&darr;</button>
                <button onClick={() => toggleActive(banner)} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-teal)', fontFamily: 'inherit' }}>{banner.active ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => { setEditing(banner); setShowEditor(true); }} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Edit</button>
                <button onClick={() => setDeleteConfirm(banner.id)} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--pmx-red)', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', fontFamily: 'inherit' }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
