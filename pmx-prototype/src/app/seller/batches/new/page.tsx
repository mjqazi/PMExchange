'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  inn?: string;
  strength?: string;
  dosage_form?: string;
  shelf_life_months?: number;
}

export default function CreateBatch() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchSize, setBatchSize] = useState('');
  const [shelfLifeMonths, setShelfLifeMonths] = useState('');
  const [yieldTheoretical, setYieldTheoretical] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch products
  useEffect(() => {
    (async () => {
      try {
        // First get manufacturer id from auth
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        const mfrId = meData?.data?.manufacturer_id || meData?.data?.mfr_id;

        if (mfrId) {
          // Try fetching from seller profile
          const profileRes = await fetch(`/api/sellers/${mfrId}/profile`);
          const profileData = await profileRes.json();
          if (profileData?.data?.products && Array.isArray(profileData.data.products)) {
            setProducts(profileData.data.products.map((p: Record<string, unknown>) => ({
              id: String(p.id || ''),
              name: `${p.inn_name || p.product_inn || p.name || ''} ${p.strength || ''} (${p.dosage_form || ''})`.trim(),
              inn: String(p.inn_name || p.product_inn || p.inn || ''),
              strength: String(p.strength || ''),
              dosage_form: String(p.dosage_form || ''),
              shelf_life_months: p.shelf_life_months ? Number(p.shelf_life_months) : undefined,
            })));
            setLoadingProducts(false);
            return;
          }
        }

        // Fallback: try /api/products
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (prodData?.data) {
          const items = Array.isArray(prodData.data) ? prodData.data : prodData.data.items || [];
          setProducts(items.map((p: Record<string, unknown>) => ({
            id: String(p.id || ''),
            name: p.product_inn ? `${p.product_inn} ${p.strength || ''}`.trim() : String(p.name || p.product_name || ''),
            inn: String(p.product_inn || p.inn || ''),
            strength: String(p.strength || ''),
            dosage_form: String(p.dosage_form || ''),
            shelf_life_months: p.shelf_life_months ? Number(p.shelf_life_months) : undefined,
          })));
        }
      } catch {
        // Use demo products as fallback
        setProducts([
          { id: 'demo-1', name: 'Metformin HCl 500mg', inn: 'Metformin', strength: '500mg', dosage_form: 'Tablets', shelf_life_months: 24 },
          { id: 'demo-2', name: 'Atorvastatin 40mg', inn: 'Atorvastatin', strength: '40mg', dosage_form: 'Tablets', shelf_life_months: 36 },
          { id: 'demo-3', name: 'Ciprofloxacin 500mg', inn: 'Ciprofloxacin', strength: '500mg', dosage_form: 'Tablets', shelf_life_months: 24 },
          { id: 'demo-4', name: 'Amoxicillin 250mg', inn: 'Amoxicillin', strength: '250mg', dosage_form: 'Capsules', shelf_life_months: 24 },
        ]);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, []);

  // Auto-calculate expiry from mfg date + shelf life
  useEffect(() => {
    if (mfgDate && shelfLifeMonths) {
      const d = new Date(mfgDate);
      d.setMonth(d.getMonth() + parseInt(shelfLifeMonths));
      d.setDate(d.getDate() - 1); // Day before same date N months later
      setExpiryDate(d.toISOString().split('T')[0]);
    }
  }, [mfgDate, shelfLifeMonths]);

  // Auto-fill shelf life when product selected
  useEffect(() => {
    if (selectedProductId) {
      const prod = products.find((p) => p.id === selectedProductId);
      if (prod?.shelf_life_months) {
        setShelfLifeMonths(String(prod.shelf_life_months));
      }
    }
  }, [selectedProductId, products]);

  // Default yield = batch size
  useEffect(() => {
    if (batchSize && !yieldTheoretical) {
      setYieldTheoretical(batchSize);
    }
  }, [batchSize, yieldTheoretical]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedProductId || !batchNumber || !mfgDate || !batchSize) {
      setError('Please fill in all required fields (Product, Batch Number, Manufacture Date, Batch Size).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProductId,
          batch_no: batchNumber,
          manufacture_date: mfgDate,
          expiry_date: expiryDate || mfgDate,
          batch_size: parseInt(batchSize),
          shelf_life_months: shelfLifeMonths ? parseInt(shelfLifeMonths) : undefined,
          yield_theoretical: yieldTheoretical ? parseInt(yieldTheoretical) : parseInt(batchSize),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.message || (typeof data.error === 'string' ? data.error : 'Failed to create batch'));
      }

      const newBatchId = data.data?.id || data.data?.batch_number || batchNumber;
      setSuccess('Batch created successfully! Redirecting...');
      setTimeout(() => {
        router.push(`/seller/batches/${newBatchId}`);
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create batch. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ padding: 20, minHeight: 600 }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 11, color: 'var(--pmx-tx3)', marginBottom: 12 }}>
        <Link href="/seller/dashboard" style={{ color: 'var(--pmx-tx3)', textDecoration: 'none' }}>Dashboard</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <Link href="/seller/batches" style={{ color: 'var(--pmx-tx3)', textDecoration: 'none' }}>Batches</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: 'var(--pmx-tx2)' }}>New Batch</span>
      </nav>

      <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 4 }}>Create New Batch</h1>
      <p style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 20 }}>
        Start a new Electronic Batch Manufacturing Record (eBMR). The batch will be created in IN_PROGRESS status.
      </p>

      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', borderRadius: 8, fontSize: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <span onClick={() => setError(null)} style={{ cursor: 'pointer', fontWeight: 700 }}>&times;</span>
        </div>
      )}

      {success && (
        <div style={{ padding: '8px 12px', background: 'var(--pmx-green-light)', color: 'var(--pmx-green)', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
          {success}
        </div>
      )}

      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          {/* Product */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Product *</label>
            {loadingProducts ? (
              <div style={{ fontSize: 12, color: 'var(--pmx-tx3)', padding: '8px 0' }}>Loading products...</div>
            ) : (
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.dosage_form ? ` (${p.dosage_form})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Batch Number */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Batch Number *</label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g., LHR-2026-0032"
              style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }}
            />
          </div>

          {/* Date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Manufacture Date *</label>
              <input
                type="date"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                style={inputStyle}
              />
              <div style={{ fontSize: 10, color: 'var(--pmx-tx3)', marginTop: 2 }}>Auto-calculated from shelf life if set</div>
            </div>
          </div>

          {/* Size row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Batch Size *</label>
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                placeholder="e.g., 200000"
                style={inputStyle}
                min={1}
              />
            </div>
            <div>
              <label style={labelStyle}>Shelf Life (months)</label>
              <input
                type="number"
                value={shelfLifeMonths}
                onChange={(e) => setShelfLifeMonths(e.target.value)}
                placeholder="e.g., 24"
                style={inputStyle}
                min={1}
              />
            </div>
          </div>

          {/* Yield Theoretical */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Yield Theoretical</label>
            <input
              type="number"
              value={yieldTheoretical}
              onChange={(e) => setYieldTheoretical(e.target.value)}
              placeholder="Defaults to batch size"
              style={inputStyle}
              min={1}
            />
            <div style={{ fontSize: 10, color: 'var(--pmx-tx3)', marginTop: 2 }}>Defaults to batch size if left empty</div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 24px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                background: loading ? 'var(--border)' : 'var(--pmx-teal)',
                color: loading ? 'var(--pmx-tx3)' : '#fff',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background .15s',
              }}
            >
              {loading && (
                <span style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  border: '2px solid rgba(255,255,255,.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              )}
              {loading ? 'Creating...' : 'Create Batch'}
            </button>
            <Link
              href="/seller/batches"
              style={{ fontSize: 12, color: 'var(--pmx-tx2)', textDecoration: 'none' }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--pmx-tx2)',
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13,
  borderRadius: 8,
  border: '0.5px solid var(--border)',
  background: 'var(--pmx-bg)',
  color: 'var(--pmx-tx)',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};
