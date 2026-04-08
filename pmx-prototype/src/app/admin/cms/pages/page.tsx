'use client';

import { useState, useEffect } from 'react';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  author: string;
  meta_title: string;
  meta_description: string;
  content: string;
  updated_at: string;
}

const DEMO_PAGES: Page[] = [
  { id: '1', title: 'About Us', slug: 'about-us', status: 'published', author: 'Nasir R.H.', meta_title: 'About PMX Pharma Exchange', meta_description: 'Learn about PMX, the B2B pharmaceutical marketplace.', content: '# About PMX\n\nPMX Pharma Exchange is a B2B marketplace connecting pharmaceutical manufacturers with global buyers.', updated_at: '2026-04-03' },
  { id: '2', title: 'Terms of Service', slug: 'terms-of-service', status: 'published', author: 'Nasir R.H.', meta_title: 'Terms of Service | PMX', meta_description: 'Read the PMX terms of service and user agreement.', content: '# Terms of Service\n\nBy using PMX you agree to the following terms...', updated_at: '2026-03-28' },
  { id: '3', title: 'Privacy Policy', slug: 'privacy-policy', status: 'published', author: 'Nasir R.H.', meta_title: 'Privacy Policy | PMX', meta_description: 'PMX privacy policy and data handling practices.', content: '# Privacy Policy\n\nYour privacy is important to us...', updated_at: '2026-03-28' },
  { id: '4', title: 'FAQ', slug: 'faq', status: 'draft', author: 'Sarah K.', meta_title: 'Frequently Asked Questions | PMX', meta_description: 'Find answers to common questions about PMX.', content: '# FAQ\n\n## How do I register?\n\nVisit the registration page...', updated_at: '2026-04-01' },
  { id: '5', title: 'Seller Guide', slug: 'seller-guide', status: 'draft', author: 'Sarah K.', meta_title: 'Seller Guide | PMX', meta_description: 'Complete guide for PMX sellers.', content: '# Seller Guide\n\nWelcome to the PMX seller onboarding guide...', updated_at: '2026-04-02' },
  { id: '6', title: 'Buyer Guide (archived)', slug: 'buyer-guide-old', status: 'archived', author: 'Nasir R.H.', meta_title: 'Buyer Guide | PMX', meta_description: 'Guide for buyers on PMX.', content: '# Buyer Guide\n\nThis guide has been superseded.', updated_at: '2026-02-15' },
];

const Badge = ({ children, type }: { children: React.ReactNode; type: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }) => {
  const styles: Record<string, { bg: string; color: string }> = {
    success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
    warning: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
    danger: { bg: 'var(--pmx-red-light)', color: 'var(--pmx-red)' },
    info: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
    neutral: { bg: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
  };
  const s = styles[type] || styles.neutral;
  return (
    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', background: s.bg, color: s.color }}>
      {children}
    </span>
  );
};

const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  published: 'success', PUBLISHED: 'success',
  draft: 'warning', DRAFT: 'warning',
  archived: 'neutral', ARCHIVED: 'neutral',
};

const thStyle: React.CSSProperties = { textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 };

export default function CMSPagesPage() {
  const [pages, setPages] = useState<Page[]>(DEMO_PAGES);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Page | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cms/pages')
      .then(r => r.json())
      .then(d => { if (d.success) setPages(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const newPage = (): Page => ({
    id: '',
    title: '',
    slug: '',
    status: 'draft',
    author: 'Nasir R.H.',
    meta_title: '',
    meta_description: '',
    content: '',
    updated_at: new Date().toISOString().split('T')[0],
  });

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const url = editing.id ? `/api/cms/pages/${editing.id}` : '/api/cms/pages';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
      const d = await res.json();
      if (d.success) {
        if (editing.id) {
          setPages(prev => prev.map(p => p.id === editing.id ? { ...editing, updated_at: new Date().toISOString().split('T')[0] } : p));
        } else {
          const created = { ...editing, id: d.data?.id || String(Date.now()), updated_at: new Date().toISOString().split('T')[0] };
          setPages(prev => [created, ...prev]);
        }
        setSuccessMsg('Page saved successfully.');
      } else {
        // Save locally for prototype
        if (editing.id) {
          setPages(prev => prev.map(p => p.id === editing.id ? { ...editing, updated_at: new Date().toISOString().split('T')[0] } : p));
        } else {
          setPages(prev => [{ ...editing, id: String(Date.now()), updated_at: new Date().toISOString().split('T')[0] }, ...prev]);
        }
        setSuccessMsg('Page saved locally (API unavailable).');
      }
    } catch {
      if (editing.id) {
        setPages(prev => prev.map(p => p.id === editing.id ? { ...editing, updated_at: new Date().toISOString().split('T')[0] } : p));
      } else {
        setPages(prev => [{ ...editing, id: String(Date.now()), updated_at: new Date().toISOString().split('T')[0] }, ...prev]);
      }
      setSuccessMsg('Page saved locally (API unavailable).');
    } finally {
      setSaving(false);
      setShowEditor(false);
      setEditing(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/cms/pages/${id}`, { method: 'DELETE' });
    } catch { /* ignore */ }
    setPages(prev => prev.filter(p => p.id !== id));
    setDeleteConfirm(null);
    setSuccessMsg('Page deleted.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const toggleStatus = (page: Page) => {
    const next = page.status === 'draft' ? 'published' : page.status === 'published' ? 'archived' : 'draft';
    const updated = { ...page, status: next as Page['status'], updated_at: new Date().toISOString().split('T')[0] };
    setPages(prev => prev.map(p => p.id === page.id ? updated : p));
    fetch(`/api/cms/pages/${page.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(() => {});
  };

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading pages...</div>
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
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Content Pages</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>{pages.length} pages &middot; Manage site content, terms, and guides</p>
        </div>
        <button
          onClick={() => { setEditing(newPage()); setShowEditor(true); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit' }}
        >
          + New Page
        </button>
      </div>

      {/* Editor Modal */}
      {showEditor && editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, width: '90%', maxWidth: 800, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--pmx-tx)' }}>{editing.id ? 'Edit Page' : 'New Page'}</h2>
              <button onClick={() => { setShowEditor(false); setEditing(null); }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--pmx-tx2)' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Title</label>
                <input
                  value={editing.title}
                  onChange={e => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                  placeholder="Page title"
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Slug</label>
                <input
                  value={editing.slug}
                  onChange={e => setEditing({ ...editing, slug: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", background: 'var(--pmx-bg)' }}
                  placeholder="page-slug"
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Content (Markdown)</label>
              <textarea
                value={editing.content}
                onChange={e => setEditing({ ...editing, content: e.target.value })}
                rows={12}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", background: 'var(--pmx-bg)', resize: 'vertical' }}
                placeholder="Write your content in markdown..."
              />
            </div>

            <div style={{ background: 'var(--pmx-bg2)', borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 10 }}>SEO Fields</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Meta Title</label>
                  <input
                    value={editing.meta_title}
                    onChange={e => setEditing({ ...editing, meta_title: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                    placeholder="SEO title (50-60 chars)"
                  />
                  <div style={{ fontSize: 10, color: editing.meta_title.length > 60 ? 'var(--pmx-red)' : 'var(--pmx-tx3)', marginTop: 2 }}>{editing.meta_title.length}/60</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Meta Description</label>
                  <textarea
                    value={editing.meta_description}
                    onChange={e => setEditing({ ...editing, meta_description: e.target.value })}
                    rows={2}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)', resize: 'vertical' }}
                    placeholder="SEO description (150-160 chars)"
                  />
                  <div style={{ fontSize: 10, color: editing.meta_description.length > 160 ? 'var(--pmx-red)' : 'var(--pmx-tx3)', marginTop: 2 }}>{editing.meta_description.length}/160</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowEditor(false); setEditing(null); }} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !editing.title} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit', opacity: saving || !editing.title ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, padding: 24, maxWidth: 400 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Delete Page?</h3>
            <p style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 16 }}>This action cannot be undone. The page will be permanently removed.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-red)', color: '#fff', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Title', 'Slug', 'Status', 'Author', 'Last Updated', 'Actions'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pages.map(page => (
              <tr key={page.id}>
                <td style={tdStyle}><strong>{page.title}</strong></td>
                <td style={tdStyle}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--pmx-tx2)' }}>/{page.slug}</span></td>
                <td style={tdStyle}><Badge type={statusMap[page.status] || 'neutral'}>{page.status}</Badge></td>
                <td style={tdStyle}>{page.author}</td>
                <td style={tdStyle}>{page.updated_at}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { setEditing(page); setShowEditor(true); }}
                      style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}
                    >Edit</button>
                    <button
                      onClick={() => toggleStatus(page)}
                      style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-teal)', fontFamily: 'inherit' }}
                    >{page.status === 'draft' ? 'Publish' : page.status === 'published' ? 'Archive' : 'Restore'}</button>
                    <button
                      onClick={() => setDeleteConfirm(page.id)}
                      style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--pmx-red)', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', fontFamily: 'inherit' }}
                    >Delete</button>
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
