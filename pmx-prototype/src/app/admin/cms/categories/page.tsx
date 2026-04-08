'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  products_count: number;
  active: boolean;
  sort_order: number;
}

const DEMO_CATEGORIES: Category[] = [
  { id: '1', name: 'Analgesics', slug: 'analgesics', description: 'Pain relievers including NSAIDs and acetaminophen', icon: '💊', products_count: 24, active: true, sort_order: 1 },
  { id: '2', name: 'Antibiotics', slug: 'antibiotics', description: 'Antimicrobial agents for bacterial infections', icon: '🧬', products_count: 31, active: true, sort_order: 2 },
  { id: '3', name: 'Cardiovascular', slug: 'cardiovascular', description: 'Heart and blood vessel medications', icon: '❤️', products_count: 18, active: true, sort_order: 3 },
  { id: '4', name: 'Dermatological', slug: 'dermatological', description: 'Skin care and treatment products', icon: '🧴', products_count: 12, active: true, sort_order: 4 },
  { id: '5', name: 'Gastrointestinal', slug: 'gastrointestinal', description: 'Digestive system medications', icon: '💉', products_count: 15, active: true, sort_order: 5 },
  { id: '6', name: 'Respiratory', slug: 'respiratory', description: 'Breathing and lung medications', icon: '🫁', products_count: 9, active: true, sort_order: 6 },
  { id: '7', name: 'Vitamins & Supplements', slug: 'vitamins-supplements', description: 'Nutritional supplements and vitamins', icon: '🍊', products_count: 22, active: true, sort_order: 7 },
  { id: '8', name: 'Oncology', slug: 'oncology', description: 'Cancer treatment medications', icon: '🔬', products_count: 6, active: false, sort_order: 8 },
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

export default function CMSCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cms/categories')
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const newCategory = (): Category => ({
    id: '',
    name: '',
    slug: '',
    description: '',
    icon: '📦',
    products_count: 0,
    active: true,
    sort_order: categories.length + 1,
  });

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const url = editing.id ? `/api/cms/categories/${editing.id}` : '/api/cms/categories';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
      const d = await res.json();
      if (d.success) {
        if (editing.id) {
          setCategories(prev => prev.map(c => c.id === editing.id ? editing : c));
        } else {
          setCategories(prev => [...prev, { ...editing, id: d.data?.id || String(Date.now()) }]);
        }
        setSuccessMsg('Category saved successfully.');
      } else {
        if (editing.id) {
          setCategories(prev => prev.map(c => c.id === editing.id ? editing : c));
        } else {
          setCategories(prev => [...prev, { ...editing, id: String(Date.now()) }]);
        }
        setSuccessMsg('Category saved locally (API unavailable).');
      }
    } catch {
      if (editing.id) {
        setCategories(prev => prev.map(c => c.id === editing.id ? editing : c));
      } else {
        setCategories(prev => [...prev, { ...editing, id: String(Date.now()) }]);
      }
      setSuccessMsg('Category saved locally (API unavailable).');
    } finally {
      setSaving(false);
      setShowEditor(false);
      setEditing(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const toggleActive = (category: Category) => {
    const updated = { ...category, active: !category.active };
    setCategories(prev => prev.map(c => c.id === category.id ? updated : c));
    fetch(`/api/cms/categories/${category.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(() => {});
  };

  const moveOrder = (category: Category, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(c => c.id === category.id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const tempOrder = sorted[idx].sort_order;
    sorted[idx] = { ...sorted[idx], sort_order: sorted[swapIdx].sort_order };
    sorted[swapIdx] = { ...sorted[swapIdx], sort_order: tempOrder };
    setCategories(sorted);
  };

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading categories...</div>
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
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Categories</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>{categories.length} categories &middot; {categories.filter(c => c.active).length} active &middot; {categories.reduce((sum, c) => sum + c.products_count, 0)} total products</p>
        </div>
        <button
          onClick={() => { setEditing(newCategory()); setShowEditor(true); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit' }}
        >
          + Add Category
        </button>
      </div>

      {/* Editor Modal */}
      {showEditor && editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, width: '90%', maxWidth: 550, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--pmx-tx)' }}>{editing.id ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => { setShowEditor(false); setEditing(null); }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--pmx-tx2)' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Name</label>
                <input
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                  placeholder="Category name"
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Icon</label>
                <input
                  value={editing.icon}
                  onChange={e => setEditing({ ...editing, icon: e.target.value })}
                  style={{ width: 60, padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 18, textAlign: 'center', background: 'var(--pmx-bg)' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Slug</label>
              <input
                value={editing.slug}
                onChange={e => setEditing({ ...editing, slug: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", background: 'var(--pmx-bg)' }}
                placeholder="category-slug"
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea
                value={editing.description}
                onChange={e => setEditing({ ...editing, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)', resize: 'vertical' }}
                placeholder="Brief description of this category"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} />
                Active
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowEditor(false); setEditing(null); }} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !editing.name} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit', opacity: saving || !editing.name ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['', 'Name', 'Slug', 'Description', 'Products', 'Active', 'Order', 'Actions'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...categories].sort((a, b) => a.sort_order - b.sort_order).map(category => (
              <tr key={category.id} style={{ opacity: category.active ? 1 : 0.5 }}>
                <td style={{ ...tdStyle, fontSize: 18, width: 32 }}>{category.icon}</td>
                <td style={tdStyle}><strong>{category.name}</strong></td>
                <td style={tdStyle}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--pmx-tx2)' }}>{category.slug}</span></td>
                <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{category.description}</td>
                <td style={tdStyle}><Badge type="info">{category.products_count}</Badge></td>
                <td style={tdStyle}><Badge type={category.active ? 'success' : 'danger'}>{category.active ? 'Active' : 'Inactive'}</Badge></td>
                <td style={tdStyle}>{category.sort_order}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => moveOrder(category, 'up')} style={{ padding: '3px 6px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>&uarr;</button>
                    <button onClick={() => moveOrder(category, 'down')} style={{ padding: '3px 6px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>&darr;</button>
                    <button onClick={() => { setEditing(category); setShowEditor(true); }} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Edit</button>
                    <button onClick={() => toggleActive(category)} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-teal)', fontFamily: 'inherit' }}>{category.active ? 'Disable' : 'Enable'}</button>
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
