'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── types ─── */
interface INN {
  id: string;
  name: string;
  category: string;
  common_strengths: string[];
  common_dosage_forms: string[];
}

interface Product {
  id: string;
  inn_id: string;
  inn_name: string;
  brand_name: string;
  strength: string;
  dosage_form: string;
  drap_reg_no: string;
  annual_capacity: number;
  capacity_unit: string;
  export_countries: string[];
  pack_sizes: string;
  status: 'Active' | 'Inactive';
}

/* ─── constants ─── */
const COUNTRY_OPTIONS = [
  'Saudi Arabia', 'UAE', 'Kenya', 'Nigeria', 'China',
  'Afghanistan', 'Sri Lanka', 'Philippines', 'Myanmar',
  'Tanzania', 'Uganda', 'Ghana', 'Ethiopia', 'Iraq',
];

const DEMO_PRODUCTS: Product[] = [
  { id: '1', inn_id: '1', inn_name: 'Amoxicillin', brand_name: 'Amoxil-LG', strength: '500mg', dosage_form: 'Capsule', drap_reg_no: 'REG-048712-2024', annual_capacity: 50000000, capacity_unit: 'units/year', export_countries: ['Saudi Arabia', 'UAE', 'Kenya'], pack_sizes: '10x10 blister', status: 'Active' },
  { id: '2', inn_id: '2', inn_name: 'Metformin HCl', brand_name: 'MetaGen 500', strength: '500mg', dosage_form: 'Tablet', drap_reg_no: 'REG-048801-2023', annual_capacity: 80000000, capacity_unit: 'units/year', export_countries: ['Saudi Arabia', 'UAE', 'Nigeria', 'Afghanistan'], pack_sizes: '10x10 blister', status: 'Active' },
  { id: '3', inn_id: '3', inn_name: 'Atorvastatin', brand_name: 'StatoGen 40', strength: '40mg', dosage_form: 'Tablet', drap_reg_no: 'REG-048555-2024', annual_capacity: 30000000, capacity_unit: 'units/year', export_countries: ['Saudi Arabia', 'Kenya'], pack_sizes: '3x10 blister', status: 'Active' },
  { id: '4', inn_id: '4', inn_name: 'Ciprofloxacin', brand_name: 'CiproGen 500', strength: '500mg', dosage_form: 'Tablet', drap_reg_no: 'REG-047921-2023', annual_capacity: 40000000, capacity_unit: 'units/year', export_countries: ['UAE', 'Nigeria', 'Ghana'], pack_sizes: '10x10 blister', status: 'Active' },
  { id: '5', inn_id: '5', inn_name: 'Omeprazole', brand_name: 'OmeGen 20', strength: '20mg', dosage_form: 'Capsule', drap_reg_no: 'REG-049102-2024', annual_capacity: 25000000, capacity_unit: 'units/year', export_countries: ['Saudi Arabia'], pack_sizes: '2x7 blister', status: 'Active' },
  { id: '6', inn_id: '10', inn_name: 'Paracetamol', brand_name: 'ParaGen 500', strength: '500mg', dosage_form: 'Tablet', drap_reg_no: 'REG-046310-2022', annual_capacity: 120000000, capacity_unit: 'units/year', export_countries: ['Afghanistan', 'Sri Lanka', 'Myanmar', 'Kenya'], pack_sizes: '10x10 blister', status: 'Active' },
  { id: '7', inn_id: '8', inn_name: 'Ibuprofen', brand_name: 'IbuGen 400', strength: '400mg', dosage_form: 'Tablet', drap_reg_no: 'REG-048330-2023', annual_capacity: 35000000, capacity_unit: 'units/year', export_countries: ['Nigeria', 'Tanzania'], pack_sizes: '10x10 blister', status: 'Inactive' },
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
function TagInput({ tags, onChange, placeholder, suggestions }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string; suggestions?: string[] }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions?.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  ) || [];

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
    setShowSuggestions(false);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 4,
          padding: '6px 8px', borderRadius: 6,
          border: '0.5px solid var(--input)',
          background: 'var(--pmx-bg)', minHeight: 36,
          alignItems: 'center', cursor: 'text',
        }}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
              background: 'var(--pmx-teal-light)', color: 'var(--pmx-teal)',
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
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => { if (input.trim() && !suggestions) addTag(input); }}
          placeholder={tags.length === 0 ? (placeholder || 'Type and press Enter') : ''}
          style={{
            border: 'none', outline: 'none', fontSize: 12, fontFamily: 'inherit',
            background: 'transparent', flex: 1, minWidth: 100, padding: '2px 0',
          }}
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--pmx-bg)', border: '0.5px solid var(--input)',
          borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.1)',
          maxHeight: 160, overflowY: 'auto', marginTop: 2,
        }}>
          {filteredSuggestions.map((s) => (
            <div
              key={s}
              onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
              style={{
                padding: '7px 10px', fontSize: 12, cursor: 'pointer',
                borderBottom: '0.5px solid var(--border)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--pmx-bg2)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── INN Search Dropdown ─── */
function INNSearch({ value, onSelect }: { value: string; onSelect: (inn: INN) => void }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<INN[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Demo INN data for fallback
  const DEMO_INNS: INN[] = [
    { id: '1', name: 'Amoxicillin', category: 'Anti-Infectives', common_strengths: ['250mg', '500mg', '875mg'], common_dosage_forms: ['Capsule', 'Tablet', 'Suspension'] },
    { id: '2', name: 'Metformin HCl', category: 'Endocrine', common_strengths: ['500mg', '850mg', '1000mg'], common_dosage_forms: ['Tablet'] },
    { id: '3', name: 'Atorvastatin', category: 'Cardiovascular', common_strengths: ['10mg', '20mg', '40mg', '80mg'], common_dosage_forms: ['Tablet'] },
    { id: '4', name: 'Ciprofloxacin', category: 'Anti-Infectives', common_strengths: ['250mg', '500mg', '750mg'], common_dosage_forms: ['Tablet', 'Injection'] },
    { id: '5', name: 'Omeprazole', category: 'Gastrointestinal', common_strengths: ['20mg', '40mg'], common_dosage_forms: ['Capsule'] },
    { id: '6', name: 'Losartan', category: 'Cardiovascular', common_strengths: ['25mg', '50mg', '100mg'], common_dosage_forms: ['Tablet'] },
    { id: '7', name: 'Cetirizine', category: 'Respiratory', common_strengths: ['5mg', '10mg'], common_dosage_forms: ['Tablet', 'Syrup'] },
    { id: '8', name: 'Ibuprofen', category: 'Analgesics', common_strengths: ['200mg', '400mg', '600mg'], common_dosage_forms: ['Tablet', 'Capsule', 'Suspension'] },
    { id: '9', name: 'Amlodipine', category: 'Cardiovascular', common_strengths: ['2.5mg', '5mg', '10mg'], common_dosage_forms: ['Tablet'] },
    { id: '10', name: 'Paracetamol', category: 'Analgesics', common_strengths: ['250mg', '500mg', '650mg', '1000mg'], common_dosage_forms: ['Tablet', 'Syrup', 'Suspension'] },
    { id: '11', name: 'Azithromycin', category: 'Anti-Infectives', common_strengths: ['250mg', '500mg'], common_dosage_forms: ['Tablet', 'Capsule', 'Suspension'] },
    { id: '12', name: 'Clopidogrel', category: 'Cardiovascular', common_strengths: ['75mg'], common_dosage_forms: ['Tablet'] },
  ];

  const searchINNs = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); setShowDropdown(false); return; }
    setSearching(true);
    fetch(`/api/admin/drug-dictionary?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.length) {
          setResults(d.data.map((item: Record<string, unknown>) => ({
            id: String(item.id || ''),
            name: String(item.name || item.inn_name || ''),
            category: String(item.category || ''),
            common_strengths: Array.isArray(item.common_strengths) ? item.common_strengths.map(String) : [],
            common_dosage_forms: Array.isArray(item.common_dosage_forms) ? item.common_dosage_forms.map(String) : [],
          })));
        } else {
          // Fallback to demo
          setResults(DEMO_INNS.filter((inn) => inn.name.toLowerCase().includes(q.toLowerCase())));
        }
        setShowDropdown(true);
      })
      .catch(() => {
        setResults(DEMO_INNS.filter((inn) => inn.name.toLowerCase().includes(q.toLowerCase())));
        setShowDropdown(true);
      })
      .finally(() => setSearching(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchINNs(v), 250);
  };

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={handleChange}
        onFocus={() => { if (query.trim()) searchINNs(query); }}
        placeholder="Search INN / Drug name..."
        style={inputStyle}
      />
      {searching && (
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--pmx-tx3)' }}>
          Searching...
        </div>
      )}
      {showDropdown && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60,
          background: 'var(--pmx-bg)', border: '0.5px solid var(--input)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.12)',
          maxHeight: 240, overflowY: 'auto', marginTop: 2,
        }}>
          {results.map((inn) => (
            <div
              key={inn.id}
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery(inn.name);
                setShowDropdown(false);
                onSelect(inn);
              }}
              style={{
                padding: '9px 12px', cursor: 'pointer',
                borderBottom: '0.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--pmx-bg2)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pmx-tx)' }}>{inn.name}</div>
                <div style={{ fontSize: 10, color: 'var(--pmx-tx3)', marginTop: 1 }}>
                  {inn.common_strengths.join(', ')}
                </div>
              </div>
              <span style={{
                display: 'inline-block', padding: '2px 7px', borderRadius: 4,
                fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap',
                background: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)',
              }}>
                {inn.category}
              </span>
            </div>
          ))}
        </div>
      )}
      {showDropdown && results.length === 0 && query.trim().length > 1 && !searching && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60,
          background: 'var(--pmx-bg)', border: '0.5px solid var(--input)',
          borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.1)',
          padding: '12px 14px', marginTop: 2,
          fontSize: 12, color: 'var(--pmx-tx3)', textAlign: 'center',
        }}>
          No matching INNs found.
        </div>
      )}
    </div>
  );
}

/* ─── Empty product form ─── */
function emptyProduct(): Omit<Product, 'id'> & { id: string } {
  return {
    id: '',
    inn_id: '',
    inn_name: '',
    brand_name: '',
    strength: '',
    dosage_form: '',
    drap_reg_no: '',
    annual_capacity: 0,
    capacity_unit: 'units/year',
    export_countries: [],
    pack_sizes: '',
    status: 'Active',
  };
}

/* ─── Main component ─── */
export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product>(emptyProduct() as Product);
  const [saving, setSaving] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [mfrId, setMfrId] = useState<string>('demo');

  // INN suggestions from selection
  const [selectedINN, setSelectedINN] = useState<INN | null>(null);

  /* Fetch manufacturer ID and products */
  useEffect(() => {
    // Get auth info first
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.manufacturer_id) {
          setMfrId(d.data.manufacturer_id);
          return d.data.manufacturer_id;
        }
        return 'demo';
      })
      .then((id) => {
        return fetch(`/api/sellers/${id}/products`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.data?.length) {
              setProducts(d.data.map((item: Record<string, unknown>) => ({
                id: String(item.id || ''),
                inn_id: String(item.inn_id || ''),
                inn_name: String(item.inn_name || item.inn || ''),
                brand_name: String(item.brand_name || ''),
                strength: String(item.strength || ''),
                dosage_form: String(item.dosage_form || ''),
                drap_reg_no: String(item.drap_reg_no || item.drap_registration || ''),
                annual_capacity: Number(item.annual_capacity || 0),
                capacity_unit: String(item.capacity_unit || 'units/year'),
                export_countries: Array.isArray(item.export_countries) ? item.export_countries.map(String) : [],
                pack_sizes: String(item.pack_sizes || ''),
                status: item.status === 'Inactive' || item.status === 'inactive' ? 'Inactive' as const : 'Active' as const,
              })));
            }
          });
      })
      .catch(() => { setError('Failed to load products. Showing demo data.'); })
      .finally(() => setLoading(false));
  }, []);

  /* KPIs */
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'Active').length;
  const exportReady = products.filter((p) => p.status === 'Active' && p.export_countries.length > 0).length;

  /* Format capacity */
  const formatCapacity = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(0)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return String(n);
  };

  /* Handle INN selection */
  const handleINNSelect = (inn: INN) => {
    setSelectedINN(inn);
    setEditing((prev) => ({
      ...prev,
      inn_id: inn.id,
      inn_name: inn.name,
    }));
  };

  /* Save handler */
  const handleSave = async () => {
    if (!editing.brand_name.trim() || !editing.inn_name.trim() || !editing.drap_reg_no.trim()) return;
    setSaving(true);
    const isNew = !editing.id;
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew
      ? `/api/sellers/${mfrId}/products`
      : `/api/sellers/${mfrId}/products/${editing.id}`;

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
      const d = await res.json();
      if (d.success) {
        if (isNew) {
          setProducts((prev) => [...prev, { ...editing, id: d.data?.id || String(Date.now()) }]);
        } else {
          setProducts((prev) => prev.map((x) => (x.id === editing.id ? editing : x)));
        }
        setSuccessMsg(`Product "${editing.brand_name}" ${isNew ? 'registered' : 'updated'} successfully.`);
      } else {
        if (isNew) {
          setProducts((prev) => [...prev, { ...editing, id: String(Date.now()) }]);
        } else {
          setProducts((prev) => prev.map((x) => (x.id === editing.id ? editing : x)));
        }
        setSuccessMsg(`Product "${editing.brand_name}" saved locally (API unavailable).`);
      }
    } catch {
      if (isNew) {
        setProducts((prev) => [...prev, { ...editing, id: String(Date.now()) }]);
      } else {
        setProducts((prev) => prev.map((x) => (x.id === editing.id ? editing : x)));
      }
      setSuccessMsg(`Product "${editing.brand_name}" saved locally (API unavailable).`);
    } finally {
      setSaving(false);
      setShowModal(false);
      setEditing(emptyProduct() as Product);
      setSelectedINN(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  /* Deactivate handler */
  const handleDeactivate = async (product: Product) => {
    try {
      await fetch(`/api/sellers/${mfrId}/products/${product.id}`, { method: 'DELETE' });
    } catch { /* noop */ }
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, status: p.status === 'Active' ? 'Inactive' as const : 'Active' as const } : p))
    );
    setConfirmDeactivate(null);
    setSuccessMsg(`Product "${product.brand_name}" ${product.status === 'Active' ? 'deactivated' : 'reactivated'}.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  /* Open edit modal */
  const openEdit = (product: Product) => {
    setEditing({ ...product });
    setSelectedINN(null);
    setShowModal(true);
  };

  /* Open new modal */
  const openNew = () => {
    setEditing(emptyProduct() as Product);
    setSelectedINN(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading products...</div>
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
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Product Catalog</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>
            Register your DRAP-approved products. These appear on the marketplace and are available for batch manufacturing.
          </p>
        </div>
        <button
          onClick={openNew}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', border: '0.5px solid transparent',
            background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit',
          }}
        >
          + Register New Product
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: 5 }}>Total Products</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--pmx-tx)' }}>{totalProducts}</div>
          <div style={{ fontSize: 11, marginTop: 3, color: 'var(--pmx-tx2)' }}>Registered in catalog</div>
        </div>
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: 5 }}>Active Products</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--pmx-green)' }}>{activeProducts}</div>
          <div style={{ fontSize: 11, marginTop: 3, color: 'var(--pmx-green)' }}>Visible on marketplace</div>
        </div>
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: 5 }}>Export-Ready</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--pmx-blue)' }}>{exportReady}</div>
          <div style={{ fontSize: 11, marginTop: 3, color: 'var(--pmx-blue)' }}>With export countries listed</div>
        </div>
      </div>

      {/* Products Table */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                {['INN Name', 'Brand Name', 'Strength', 'Dosage Form', 'DRAP Reg No', 'Capacity', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: 'var(--pmx-tx3)', padding: 30 }}>
                    No products registered yet. Click &quot;Register New Product&quot; to add your first product.
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr key={p.id} style={{ opacity: p.status === 'Inactive' ? 0.55 : 1 }}>
                  <td style={tdStyle}>
                    <strong>{p.inn_name}</strong>
                  </td>
                  <td style={tdStyle}>{p.brand_name}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: 'var(--pmx-bg3)', color: 'var(--pmx-tx2)' }}>
                      {p.strength}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: 'var(--pmx-teal-light)', color: 'var(--pmx-teal)' }}>
                      {p.dosage_form}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{p.drap_reg_no}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{formatCapacity(p.annual_capacity)}</span>
                    <span style={{ fontSize: 10, color: 'var(--pmx-tx3)', marginLeft: 2 }}>/yr</span>
                  </td>
                  <td style={tdStyle}>
                    <Badge type={p.status === 'Active' ? 'success' : 'danger'}>{p.status}</Badge>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => openEdit(p)}
                        style={{
                          padding: '3px 8px', borderRadius: 4, fontSize: 11,
                          cursor: 'pointer', border: '0.5px solid var(--input)',
                          background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeactivate(p.id)}
                        style={{
                          padding: '3px 8px', borderRadius: 4, fontSize: 11,
                          cursor: 'pointer', border: '0.5px solid var(--input)',
                          background: 'var(--pmx-bg)', fontFamily: 'inherit',
                          color: p.status === 'Active' ? 'var(--pmx-red)' : 'var(--pmx-green)',
                        }}
                      >
                        {p.status === 'Active' ? 'Deactivate' : 'Reactivate'}
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
        const product = products.find((p) => p.id === confirmDeactivate);
        if (!product) return null;
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, width: '90%', maxWidth: 420, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 10 }}>
                {product.status === 'Active' ? 'Deactivate' : 'Reactivate'} Product?
              </h2>
              <p style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 18 }}>
                {product.status === 'Active'
                  ? `This will hide "${product.brand_name}" (${product.inn_name} ${product.strength}) from the marketplace. Existing orders are not affected.`
                  : `This will reactivate "${product.brand_name}" and make it visible on the marketplace again.`}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setConfirmDeactivate(null)}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeactivate(product)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    border: '0.5px solid transparent', fontFamily: 'inherit',
                    background: product.status === 'Active' ? 'var(--pmx-red)' : 'var(--pmx-green)',
                    color: '#fff',
                  }}
                >
                  {product.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Register / Edit Product Modal ─── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, width: '90%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--pmx-tx)' }}>
                {editing.id ? 'Edit Product' : 'Register New Product'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditing(emptyProduct() as Product); setSelectedINN(null); }}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--pmx-tx2)' }}
              >
                &times;
              </button>
            </div>

            {/* INN / Drug Name — smart search */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>INN / Drug Name *</label>
              <INNSearch
                value={editing.inn_name}
                onSelect={handleINNSelect}
              />
              {selectedINN && (
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--pmx-tx2)' }}>
                  Selected: <strong>{selectedINN.name}</strong> &middot; <Badge type="info">{selectedINN.category}</Badge>
                </div>
              )}
            </div>

            {/* Brand Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Brand Name *</label>
              <input
                value={editing.brand_name}
                onChange={(e) => setEditing({ ...editing, brand_name: e.target.value })}
                placeholder="Your product's brand name"
                style={inputStyle}
              />
            </div>

            {/* Strength — quick-select + custom */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Strength *</label>
              {(selectedINN?.common_strengths || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  {selectedINN!.common_strengths.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditing({ ...editing, strength: s })}
                      style={{
                        padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'inherit',
                        border: editing.strength === s ? '0.5px solid var(--pmx-teal)' : '0.5px solid var(--input)',
                        background: editing.strength === s ? 'var(--pmx-teal-light)' : 'var(--pmx-bg)',
                        color: editing.strength === s ? 'var(--pmx-teal)' : 'var(--pmx-tx2)',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <input
                value={editing.strength}
                onChange={(e) => setEditing({ ...editing, strength: e.target.value })}
                placeholder="e.g., 500mg"
                style={inputStyle}
              />
            </div>

            {/* Dosage Form — quick-select + custom */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Dosage Form *</label>
              {(selectedINN?.common_dosage_forms || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  {selectedINN!.common_dosage_forms.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setEditing({ ...editing, dosage_form: f })}
                      style={{
                        padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'inherit',
                        border: editing.dosage_form === f ? '0.5px solid var(--pmx-teal)' : '0.5px solid var(--input)',
                        background: editing.dosage_form === f ? 'var(--pmx-teal-light)' : 'var(--pmx-bg)',
                        color: editing.dosage_form === f ? 'var(--pmx-teal)' : 'var(--pmx-tx2)',
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
              <input
                value={editing.dosage_form}
                onChange={(e) => setEditing({ ...editing, dosage_form: e.target.value })}
                placeholder="e.g., Tablet"
                style={inputStyle}
              />
            </div>

            {/* DRAP Registration No */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>DRAP Registration No. *</label>
              <input
                value={editing.drap_reg_no}
                onChange={(e) => setEditing({ ...editing, drap_reg_no: e.target.value })}
                placeholder="e.g., REG-048712-2024"
                style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }}
              />
            </div>

            {/* Annual Production Capacity */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Annual Production Capacity</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  value={editing.annual_capacity || ''}
                  onChange={(e) => setEditing({ ...editing, annual_capacity: Number(e.target.value) })}
                  placeholder="e.g., 50000000"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <span style={{ fontSize: 12, color: 'var(--pmx-tx2)', whiteSpace: 'nowrap' }}>units/year</span>
              </div>
            </div>

            {/* Export Eligible Countries */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Export Eligible Countries</label>
              <TagInput
                tags={editing.export_countries}
                onChange={(t) => setEditing({ ...editing, export_countries: t })}
                placeholder="Select or type country..."
                suggestions={COUNTRY_OPTIONS}
              />
            </div>

            {/* Pack Sizes */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Pack Sizes</label>
              <input
                value={editing.pack_sizes}
                onChange={(e) => setEditing({ ...editing, pack_sizes: e.target.value })}
                placeholder="e.g., 10x10 blister"
                style={inputStyle}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowModal(false); setEditing(emptyProduct() as Product); setSelectedINN(null); }}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editing.brand_name.trim() || !editing.inn_name.trim() || !editing.drap_reg_no.trim()}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', border: '0.5px solid transparent',
                  background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit',
                  opacity: saving || !editing.brand_name.trim() || !editing.inn_name.trim() || !editing.drap_reg_no.trim() ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving...' : editing.id ? 'Update Product' : 'Register Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
