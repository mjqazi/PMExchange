'use client';

import { useState, useEffect } from 'react';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  featured: boolean;
  views: number;
  published_at: string;
  author: string;
}

const CATEGORIES = ['Industry News', 'Product Updates', 'Regulatory', 'Case Studies', 'Guides'];

const DEMO_ARTICLES: Article[] = [
  { id: '1', title: 'PMX Launches Tier 3 Regulated Markets Track', slug: 'pmx-launches-tier-3', excerpt: 'New certification pathway for EU/FDA markets...', content: '# PMX Launches Tier 3\n\nWe are excited to announce...', cover_image: '/blog/tier3-launch.jpg', category: 'Product Updates', tags: ['tier-3', 'launch', 'regulated-markets'], status: 'published', featured: true, views: 1247, published_at: '2026-04-01', author: 'Nasir R.H.' },
  { id: '2', title: 'Understanding CQS: A Complete Guide', slug: 'understanding-cqs-guide', excerpt: 'Everything you need to know about the Composite Quality Score...', content: '# Understanding CQS\n\nThe CQS is a composite metric...', cover_image: '/blog/cqs-guide.jpg', category: 'Guides', tags: ['cqs', 'quality', 'guide'], status: 'published', featured: true, views: 892, published_at: '2026-03-28', author: 'Sarah K.' },
  { id: '3', title: 'DRAP Compliance Updates for Q2 2026', slug: 'drap-compliance-q2-2026', excerpt: 'Key regulatory changes affecting pharmaceutical exports...', content: '# DRAP Updates Q2 2026\n\nThe Drug Regulatory Authority...', cover_image: '/blog/drap-update.jpg', category: 'Regulatory', tags: ['drap', 'compliance', 'regulatory'], status: 'published', featured: false, views: 456, published_at: '2026-03-20', author: 'Nasir R.H.' },
  { id: '4', title: 'How Karachi PharmaCorp Improved Their CQS by 15 Points', slug: 'karachi-pharmacorp-cqs-story', excerpt: 'A success story from one of our top sellers...', content: '# Karachi PharmaCorp Story\n\nWhen Karachi PharmaCorp first joined...', cover_image: '/blog/case-study-kpc.jpg', category: 'Case Studies', tags: ['case-study', 'cqs', 'success'], status: 'published', featured: false, views: 321, published_at: '2026-03-15', author: 'Sarah K.' },
  { id: '5', title: 'Escrow System: Security for Buyers and Sellers', slug: 'escrow-system-security', excerpt: 'How our escrow system protects every transaction...', content: '# Escrow System Security\n\nEvery transaction on PMX...', cover_image: '', category: 'Guides', tags: ['escrow', 'security', 'payments'], status: 'draft', featured: false, views: 0, published_at: '', author: 'Nasir R.H.' },
  { id: '6', title: 'Upcoming: AI-Powered CoA Verification', slug: 'ai-coa-verification', excerpt: 'Preview of our next major feature...', content: '# AI-Powered CoA Verification\n\nComing soon to PMX...', cover_image: '', category: 'Product Updates', tags: ['ai', 'coa', 'upcoming'], status: 'draft', featured: false, views: 0, published_at: '', author: 'Sarah K.' },
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

const thStyle: React.CSSProperties = { textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 };

export default function CMSBlogPage() {
  const [articles, setArticles] = useState<Article[]>(DEMO_ARTICLES);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Article | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetch('/api/cms/blog')
      .then(r => r.json())
      .then(d => { if (d.success) setArticles(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const newArticle = (): Article => ({
    id: '',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    category: CATEGORIES[0],
    tags: [],
    status: 'draft',
    featured: false,
    views: 0,
    published_at: '',
    author: 'Nasir R.H.',
  });

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const url = editing.id ? `/api/cms/blog/${editing.id}` : '/api/cms/blog';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
      const d = await res.json();
      if (d.success) {
        if (editing.id) {
          setArticles(prev => prev.map(a => a.id === editing.id ? editing : a));
        } else {
          setArticles(prev => [{ ...editing, id: d.data?.id || String(Date.now()) }, ...prev]);
        }
        setSuccessMsg('Article saved successfully.');
      } else {
        if (editing.id) {
          setArticles(prev => prev.map(a => a.id === editing.id ? editing : a));
        } else {
          setArticles(prev => [{ ...editing, id: String(Date.now()) }, ...prev]);
        }
        setSuccessMsg('Article saved locally (API unavailable).');
      }
    } catch {
      if (editing.id) {
        setArticles(prev => prev.map(a => a.id === editing.id ? editing : a));
      } else {
        setArticles(prev => [{ ...editing, id: String(Date.now()) }, ...prev]);
      }
      setSuccessMsg('Article saved locally (API unavailable).');
    } finally {
      setSaving(false);
      setShowEditor(false);
      setEditing(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const toggleFeatured = (article: Article) => {
    const updated = { ...article, featured: !article.featured };
    setArticles(prev => prev.map(a => a.id === article.id ? updated : a));
    fetch(`/api/cms/blog/${article.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(() => {});
  };

  const togglePublish = (article: Article) => {
    const next = article.status === 'draft' ? 'published' : 'draft';
    const updated = { ...article, status: next as Article['status'], published_at: next === 'published' ? new Date().toISOString().split('T')[0] : article.published_at };
    setArticles(prev => prev.map(a => a.id === article.id ? updated : a));
    fetch(`/api/cms/blog/${article.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(() => {});
  };

  const addTag = () => {
    if (!editing || !tagInput.trim()) return;
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!editing.tags.includes(tag)) {
      setEditing({ ...editing, tags: [...editing.tags, tag] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    if (!editing) return;
    setEditing({ ...editing, tags: editing.tags.filter(t => t !== tag) });
  };

  const filtered = filterCategory ? articles.filter(a => a.category === filterCategory) : articles;

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading articles...</div>
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
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Blog / News</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>{articles.length} articles &middot; {articles.filter(a => a.status === 'published').length} published &middot; {articles.filter(a => a.featured).length} featured</p>
        </div>
        <button
          onClick={() => { setEditing(newArticle()); setShowEditor(true); setTagInput(''); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit' }}
        >
          + New Article
        </button>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterCategory('')}
          style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: !filterCategory ? 'var(--pmx-teal)' : 'var(--pmx-bg)', color: !filterCategory ? '#fff' : 'var(--pmx-tx)', fontFamily: 'inherit' }}
        >All</button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: filterCategory === cat ? 'var(--pmx-teal)' : 'var(--pmx-bg)', color: filterCategory === cat ? '#fff' : 'var(--pmx-tx)', fontFamily: 'inherit' }}
          >{cat}</button>
        ))}
      </div>

      {/* Editor Modal */}
      {showEditor && editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, width: '90%', maxWidth: 800, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--pmx-tx)' }}>{editing.id ? 'Edit Article' : 'New Article'}</h2>
              <button onClick={() => { setShowEditor(false); setEditing(null); }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--pmx-tx2)' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Title</label>
                <input
                  value={editing.title}
                  onChange={e => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                  placeholder="Article title"
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Slug (auto-generated)</label>
                <input
                  value={editing.slug}
                  onChange={e => setEditing({ ...editing, slug: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", background: 'var(--pmx-bg)' }}
                  placeholder="article-slug"
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Excerpt</label>
              <textarea
                value={editing.excerpt}
                onChange={e => setEditing({ ...editing, excerpt: e.target.value })}
                rows={2}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)', resize: 'vertical' }}
                placeholder="Short summary of the article..."
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Content (Markdown)</label>
              <textarea
                value={editing.content}
                onChange={e => setEditing({ ...editing, content: e.target.value })}
                rows={10}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", background: 'var(--pmx-bg)', resize: 'vertical' }}
                placeholder="Write article content..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Cover Image URL</label>
                <input
                  value={editing.cover_image}
                  onChange={e => setEditing({ ...editing, cover_image: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                  placeholder="/images/cover.jpg"
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Category</label>
                <select
                  value={editing.category}
                  onChange={e => setEditing({ ...editing, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>Tags</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {editing.tags.map(tag => (
                  <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 11, background: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' }}>
                    {tag}
                    <span onClick={() => removeTag(tag)} style={{ cursor: 'pointer', fontWeight: 700 }}>&times;</span>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 12, fontFamily: 'inherit', background: 'var(--pmx-bg)' }}
                  placeholder="Add tag and press Enter"
                />
                <button onClick={addTag} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Add</button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.featured} onChange={e => setEditing({ ...editing, featured: e.target.checked })} />
                Featured article
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowEditor(false); setEditing(null); }} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !editing.title} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit', opacity: saving || !editing.title ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Article'}
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
              {['Title', 'Category', 'Status', 'Featured', 'Views', 'Published', 'Actions'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(article => (
              <tr key={article.id}>
                <td style={tdStyle}>
                  <strong>{article.title}</strong>
                  <div style={{ fontSize: 10, color: 'var(--pmx-tx3)', fontFamily: "'IBM Plex Mono', monospace" }}>/{article.slug}</div>
                </td>
                <td style={tdStyle}><Badge type="info">{article.category}</Badge></td>
                <td style={tdStyle}><Badge type={article.status === 'published' ? 'success' : 'warning'}>{article.status}</Badge></td>
                <td style={tdStyle}>
                  <span
                    onClick={() => toggleFeatured(article)}
                    style={{ cursor: 'pointer', fontSize: 16, color: article.featured ? 'var(--pmx-amber)' : 'var(--pmx-tx3)' }}
                  >
                    {article.featured ? '\u2605' : '\u2606'}
                  </span>
                </td>
                <td style={tdStyle}>{article.views.toLocaleString()}</td>
                <td style={tdStyle}>{article.published_at || <span style={{ color: 'var(--pmx-tx3)' }}>&mdash;</span>}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { setEditing(article); setShowEditor(true); setTagInput(''); }}
                      style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}
                    >Edit</button>
                    <button
                      onClick={() => togglePublish(article)}
                      style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-teal)', fontFamily: 'inherit' }}
                    >{article.status === 'draft' ? 'Publish' : 'Unpublish'}</button>
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
