'use client';

import { useState, useEffect, useRef } from 'react';

/* ─── types ─── */
interface INN {
  id: string;
  name: string;
  category: string;
  description: string;
  common_strengths: string[];
  common_dosage_forms: string[];
  pharmacopoeia: string;
  storage: string;
  status: 'Active' | 'Inactive';
}

/* ─── constants ─── */
const CATEGORIES = [
  'Anti-Infectives',
  'Cardiovascular',
  'Analgesics',
  'Gastrointestinal',
  'Respiratory',
  'Endocrine',
  'CNS / Neurological',
  'Dermatological',
  'Musculoskeletal',
  'Vitamins & Supplements',
];

const DOSAGE_FORM_OPTIONS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Cream',
  'Powder',
  'Suspension',
];

const DEMO_DRUGS: INN[] = [
  { id: '1', name: 'Amoxicillin', category: 'Anti-Infectives', description: 'Broad-spectrum penicillin-type antibiotic used for bacterial infections.', common_strengths: ['250mg', '500mg', '875mg'], common_dosage_forms: ['Capsule', 'Tablet', 'Suspension'], pharmacopoeia: 'BP / USP', storage: 'Below 25\u00B0C, dry place', status: 'Active' },
  { id: '2', name: 'Metformin HCl', category: 'Endocrine', description: 'First-line oral antidiabetic for Type 2 diabetes.', common_strengths: ['500mg', '850mg', '1000mg'], common_dosage_forms: ['Tablet'], pharmacopoeia: 'BP / USP', storage: 'Below 25\u00B0C, dry place', status: 'Active' },
  { id: '3', name: 'Atorvastatin', category: 'Cardiovascular', description: 'HMG-CoA reductase inhibitor (statin) for hyperlipidemia.', common_strengths: ['10mg', '20mg', '40mg', '80mg'], common_dosage_forms: ['Tablet'], pharmacopoeia: 'BP / USP', storage: 'Below 25\u00B0C, dry place', status: 'Active' },
  { id: '4', name: 'Ciprofloxacin', category: 'Anti-Infectives', description: 'Fluoroquinolone antibiotic for urinary tract and respiratory infections.', common_strengths: ['250mg', '500mg', '750mg'], common_dosage_forms: ['Tablet', 'Injection'], pharmacopoeia: 'BP / USP', storage: 'Below 25\u00B0C, protect from light', status: 'Active' },
  { id: '5', name: 'Omeprazole', category: 'Gastrointestinal', description: 'Proton pump inhibitor for acid reflux and gastric ulcers.', common_strengths: ['20mg', '40mg'], common_dosage_forms: ['Capsule'], pharmacopoeia: 'BP / USP', storage: 'Below 25\u00B0C, dry place', status: 'Active' },
  { id: '6', name: 'Losartan', category: 'Cardiovascular', description: 'Angiotensin II receptor antagonist for hypertension.', common_strengths: ['25mg', '50mg', '100mg'], common_dosage_forms: ['Tablet'], pharmacopoeia: 'BP / USP', storage: 'Below 30\u00B0C, dry place', status: 'Active' },
  { id: '7', name: 'Cetirizine', category: 'Respiratory', description: 'Second-generation antihistamine for allergic rhinitis and urticaria.', common_strengths: ['5mg', '10mg'], common_dosage_forms: ['Tablet', 'Syrup'], pharmacopoeia: 'BP / USP', storage: 'Below 25\u00B0C, dry place', status: 'Active' },
  { id: '8', name: 'Ibuprofen', category: 'Analgesics', description: 'Nonsteroidal anti-inflammatory drug for pain and inflammation.', common_strengths: ['200mg', '400mg', '600mg'], common_dosage_forms: ['Tablet', 'Capsule', 'Suspension'], pharmacopoeia: 'BP / USP', storage: 'Below 25\u00B0C, dry place', status: 'Active' },
  { id: '9', name: 'Amlodipine', category: 'Cardiovascular', description: 'Calcium channel blocker for hypertension and angina.', common_strengths: ['2.5mg', '5mg', '10mg'], common_dosage_forms: ['Tablet'], pharmacopoeia: 'BP / USP', storage: 'Below 30\u00B0C, dry place', status: 'Active' },
  { id: '10', name: 'Paracetamol', category: 'Analgesics', description: 'Analgesic and antipyretic for pain and fever.', common_strengths: ['250mg', '500mg', '650mg', '1000mg'], common_dosage_forms: ['Tablet', 'Syrup', 'Suspension'], pharmacopoeia: 'BP / USP', storage: 'Below 25\u00B0C, dry place', status: 'Active' },
  { id: '11', name: 'Azithromycin', category: 'Anti-Infectives', description: 'Macrolide antibiotic for respiratory and soft-tissue infections.', common_strengths: ['250mg', '500mg'], common_dosage_forms: ['Tablet', 'Capsule', 'Suspension'], pharmacopoeia: 'BP / USP', storage: 'Below 25\u00B0C, dry place', status: 'Active' },
  { id: '12', name: 'Clopidogrel', category: 'Cardiovascular', description: 'Antiplatelet agent to prevent blood clots.', common_strengths: ['75mg'], common_dosage_forms: ['Tablet'], pharmacopoeia: 'BP / USP', storage: 'Below 25\u00B0C, dry place', status: 'Inactive' },
];

/* ─── shared styles ─── */
const thStyle: React.CSSProperties = { textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 13, fontFamily: 'inherit', background: 'var(--pmx-bg)', boxSizing: 'border-box' };

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

/* ─── Tag Input component ─── */
function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        padding: '6px 8px',
        borderRadius: 6,
        border: '0.5px solid var(--input)',
        background: 'var(--pmx-bg)',
        minHeight: 36,
        alignItems: 'center',
        cursor: 'text',
      }}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            background: 'var(--pmx-teal-light)',
            color: 'var(--pmx-teal)',
          }}
        >
          {tag}
          <span
            onClick={(e) => { e.stopPropagation(); removeTag(i); }}
            style={{ cursor: 'pointer', fontSize: 13, lineHeight: 1, fontWeight: 700 }}
          >
            &times;
          </span>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length === 0 ? (placeholder || 'Type and press Enter') : ''}
        style={{
          border: 'none',
          outline: 'none',
          fontSize: 12,
          fontFamily: 'inherit',
          background: 'transparent',
          flex: 1,
          minWidth: 100,
          padding: '2px 0',
        }}
      />
    </div>
  );
}

/* ─── Empty form state ─── */
function emptyINN(): Omit<INN, 'id'> & { id: string } {
  return {
    id: '',
    name: '',
    category: CATEGORIES[0],
    description: '',
    common_strengths: [],
    common_dosage_forms: [],
    pharmacopoeia: 'BP / USP',
    storage: 'Below 25\u00B0C, dry place',
    status: 'Active',
  };
}

/* ─── Main component ─── */
export default function DrugDictionaryPage() {
  const [drugs, setDrugs] = useState<INN[]>(DEMO_DRUGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<INN>(emptyINN() as INN);
  const [saving, setSaving] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);

  /* Fetch from API */
  useEffect(() => {
    fetch('/api/admin/drug-dictionary')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.length) {
          setDrugs(d.data.map((item: Record<string, unknown>) => ({
            id: String(item.id || ''),
            name: String(item.name || item.inn_name || ''),
            category: String(item.category || ''),
            description: String(item.description || ''),
            common_strengths: Array.isArray(item.common_strengths) ? item.common_strengths.map(String) : [],
            common_dosage_forms: Array.isArray(item.common_dosage_forms) ? item.common_dosage_forms.map(String) : [],
            pharmacopoeia: String(item.pharmacopoeia || 'BP / USP'),
            storage: String(item.storage || 'Below 25\u00B0C, dry place'),
            status: item.status === 'Inactive' || item.status === 'inactive' ? 'Inactive' as const : 'Active' as const,
          })));
        }
      })
      .catch(() => { setError('Failed to load from API. Showing demo data.'); })
      .finally(() => setLoading(false));
  }, []);

  /* Filters */
  const allCategories = ['All', ...Array.from(new Set(drugs.map((d) => d.category)))];
  const filtered = drugs.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || d.category === categoryFilter;
    return matchSearch && matchCat;
  });

  /* Save handler */
  const handleSave = async () => {
    if (!editing.name.trim()) return;
    setSaving(true);
    const isNew = !editing.id;
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/admin/drug-dictionary' : `/api/admin/drug-dictionary/${editing.id}`;

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
      const d = await res.json();
      if (d.success) {
        if (isNew) {
          setDrugs((prev) => [...prev, { ...editing, id: d.data?.id || String(Date.now()) }]);
        } else {
          setDrugs((prev) => prev.map((x) => (x.id === editing.id ? editing : x)));
        }
        setSuccessMsg(`INN "${editing.name}" ${isNew ? 'added' : 'updated'} successfully.`);
      } else {
        // Fallback: save locally
        if (isNew) {
          setDrugs((prev) => [...prev, { ...editing, id: String(Date.now()) }]);
        } else {
          setDrugs((prev) => prev.map((x) => (x.id === editing.id ? editing : x)));
        }
        setSuccessMsg(`INN "${editing.name}" saved locally (API unavailable).`);
      }
    } catch {
      if (isNew) {
        setDrugs((prev) => [...prev, { ...editing, id: String(Date.now()) }]);
      } else {
        setDrugs((prev) => prev.map((x) => (x.id === editing.id ? editing : x)));
      }
      setSuccessMsg(`INN "${editing.name}" saved locally (API unavailable).`);
    } finally {
      setSaving(false);
      setShowModal(false);
      setEditing(emptyINN() as INN);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  /* Deactivate handler */
  const handleDeactivate = async (drug: INN) => {
    try {
      await fetch(`/api/admin/drug-dictionary/${drug.id}`, { method: 'DELETE' });
    } catch { /* noop */ }
    setDrugs((prev) =>
      prev.map((d) => (d.id === drug.id ? { ...d, status: d.status === 'Active' ? 'Inactive' as const : 'Active' as const } : d))
    );
    setConfirmDeactivate(null);
    setSuccessMsg(`INN "${drug.name}" ${drug.status === 'Active' ? 'deactivated' : 'reactivated'}.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  /* Dosage form checkbox toggle */
  const toggleDosageForm = (form: string) => {
    if (editing.common_dosage_forms.includes(form)) {
      setEditing({ ...editing, common_dosage_forms: editing.common_dosage_forms.filter((f) => f !== form) });
    } else {
      setEditing({ ...editing, common_dosage_forms: [...editing.common_dosage_forms, form] });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading drug dictionary...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ padding: 20 }}>
      {/* Success message */}
      {successMsg && (
        <div style={{ padding: '8px 12px', background: 'var(--pmx-green-light)', color: 'var(--pmx-green)', borderRadius: 8, fontSize: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{successMsg}</span>
          <span onClick={() => setSuccessMsg(null)} style={{ cursor: 'pointer', fontWeight: 700 }}>&times;</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)', borderRadius: 8, fontSize: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <span onClick={() => setError(null)} style={{ cursor: 'pointer', fontWeight: 700 }}>&times;</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>
            Drug Dictionary &mdash; Master INN List
          </h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>
            Manage approved International Nonproprietary Names. Manufacturers register products under these INNs.
          </p>
        </div>
        <button
          onClick={() => { setEditing(emptyINN() as INN); setShowModal(true); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', border: '0.5px solid transparent',
            background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit',
          }}
        >
          + Add New INN
        </button>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 12 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by INN name..."
          style={{
            width: '100%', maxWidth: 380,
            padding: '8px 12px', borderRadius: 8,
            border: '0.5px solid var(--input)', fontSize: 13,
            fontFamily: 'inherit', background: 'var(--pmx-bg)',
          }}
        />
      </div>

      {/* Category filter tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
              border: categoryFilter === cat ? '0.5px solid var(--pmx-teal)' : '0.5px solid var(--input)',
              background: categoryFilter === cat ? 'var(--pmx-teal-light)' : 'var(--pmx-bg)',
              color: categoryFilter === cat ? 'var(--pmx-teal)' : 'var(--pmx-tx2)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 10 }}>
          {filtered.length} of {drugs.length} INNs
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr>
                {['INN Name', 'Category', 'Common Strengths', 'Common Dosage Forms', 'Pharmacopoeia', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--pmx-tx3)', padding: 30 }}>
                    No INNs found matching your search.
                  </td>
                </tr>
              )}
              {filtered.map((drug) => (
                <tr key={drug.id} style={{ opacity: drug.status === 'Inactive' ? 0.55 : 1 }}>
                  <td style={tdStyle}>
                    <strong>{drug.name}</strong>
                  </td>
                  <td style={tdStyle}>
                    <Badge type="info">{drug.category}</Badge>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {drug.common_strengths.map((s, i) => (
                        <span key={i} style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: 'var(--pmx-bg3)', color: 'var(--pmx-tx2)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {drug.common_dosage_forms.map((f, i) => (
                        <span key={i} style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: 'var(--pmx-teal-light)', color: 'var(--pmx-teal)' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{drug.pharmacopoeia}</span>
                  </td>
                  <td style={tdStyle}>
                    <Badge type={drug.status === 'Active' ? 'success' : 'danger'}>{drug.status}</Badge>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => { setEditing({ ...drug }); setShowModal(true); }}
                        style={{
                          padding: '3px 8px', borderRadius: 4, fontSize: 11,
                          cursor: 'pointer', border: '0.5px solid var(--input)',
                          background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeactivate(drug.id)}
                        style={{
                          padding: '3px 8px', borderRadius: 4, fontSize: 11,
                          cursor: 'pointer', border: '0.5px solid var(--input)',
                          background: 'var(--pmx-bg)', fontFamily: 'inherit',
                          color: drug.status === 'Active' ? 'var(--pmx-red)' : 'var(--pmx-green)',
                        }}
                      >
                        {drug.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Confirm deactivation dialog ─── */}
      {confirmDeactivate && (() => {
        const drug = drugs.find((d) => d.id === confirmDeactivate);
        if (!drug) return null;
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, width: '90%', maxWidth: 420, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 10 }}>
                {drug.status === 'Active' ? 'Deactivate' : 'Reactivate'} INN?
              </h2>
              <p style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 18 }}>
                {drug.status === 'Active'
                  ? `This will mark "${drug.name}" as inactive. Sellers will no longer be able to register new products under this INN.`
                  : `This will reactivate "${drug.name}". Sellers will be able to register products under this INN again.`}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setConfirmDeactivate(null)}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeactivate(drug)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    border: '0.5px solid transparent', fontFamily: 'inherit',
                    background: drug.status === 'Active' ? 'var(--pmx-red)' : 'var(--pmx-green)',
                    color: '#fff',
                  }}
                >
                  {drug.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Add / Edit Modal ─── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, width: '90%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--pmx-tx)' }}>
                {editing.id ? 'Edit INN' : 'Add New INN'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditing(emptyINN() as INN); }}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--pmx-tx2)' }}
              >
                &times;
              </button>
            </div>

            {/* INN Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>INN Name *</label>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g., Amoxicillin"
                style={inputStyle}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Category</label>
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={3}
                placeholder="Brief clinical description of this INN"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Common Strengths — tag input */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Common Strengths</label>
              <TagInput
                tags={editing.common_strengths}
                onChange={(t) => setEditing({ ...editing, common_strengths: t })}
                placeholder="Type strength (e.g. 500mg) and press Enter"
              />
            </div>

            {/* Common Dosage Forms — checkboxes */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Common Dosage Forms</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DOSAGE_FORM_OPTIONS.map((form) => (
                  <label key={form} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editing.common_dosage_forms.includes(form)}
                      onChange={() => toggleDosageForm(form)}
                    />
                    {form}
                  </label>
                ))}
              </div>
            </div>

            {/* Pharmacopoeia */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Pharmacopoeia</label>
              <input
                value={editing.pharmacopoeia}
                onChange={(e) => setEditing({ ...editing, pharmacopoeia: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Storage */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Storage</label>
              <input
                value={editing.storage}
                onChange={(e) => setEditing({ ...editing, storage: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowModal(false); setEditing(emptyINN() as INN); }}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editing.name.trim()}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', border: '0.5px solid transparent',
                  background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit',
                  opacity: saving || !editing.name.trim() ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving...' : editing.id ? 'Update INN' : 'Add INN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
