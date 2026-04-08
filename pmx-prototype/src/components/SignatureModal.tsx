'use client';

import { useState, useEffect, useCallback } from 'react';

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string, meaning: string) => Promise<void>;
  action: string;
  batchRef: string;
  signerName: string;
  signerRole: string;
  defaultMeaning?: string;
  loading?: boolean;
}

export default function SignatureModal({
  open,
  onClose,
  onConfirm,
  action,
  batchRef,
  signerName,
  signerRole,
  defaultMeaning = '',
  loading: externalLoading,
}: SignatureModalProps) {
  const [password, setPassword] = useState('');
  const [meaning, setMeaning] = useState(defaultMeaning);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    if (!open) return;
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, [open]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setPassword('');
      setMeaning(defaultMeaning);
      setAgreed(false);
      setError(null);
      setSubmitting(false);
    }
  }, [open, defaultMeaning]);

  const isLoading = externalLoading || submitting;
  const canConfirm = meaning.trim().length > 0 && password.length > 0 && agreed && !isLoading;

  const handleConfirm = useCallback(async () => {
    if (!canConfirm) return;
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(password, meaning.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signature failed. Please try again.';
      setError(msg);
      setAttempts((a) => a + 1);
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  }, [canConfirm, password, meaning, onConfirm]);

  if (!open) return null;

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) +
    ' UTC';

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          ELECTRONIC SIGNATURE &mdash; 21 CFR Part 11
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Action & Batch */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--pmx-tx3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
              Action
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--pmx-tx)' }}>{action}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--pmx-tx3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
              Batch Reference
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", color: 'var(--pmx-teal)' }}>
              {batchRef}
            </div>
          </div>

          {/* Signer info row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={labelStyle}>Signer</div>
              <div style={readOnlyFieldStyle}>{signerName}</div>
            </div>
            <div>
              <div style={labelStyle}>Role</div>
              <div style={readOnlyFieldStyle}>{signerRole}</div>
            </div>
          </div>

          {/* Date/time */}
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Date / Time</div>
            <div style={{ ...readOnlyFieldStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
              {formatDate(now)}
            </div>
          </div>

          {/* Meaning */}
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Signature Meaning</div>
            <textarea
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              rows={2}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 48,
              }}
              placeholder="Describe the meaning of this signature..."
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Password (re-enter to confirm identity)</div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              style={{
                ...inputStyle,
                borderColor: error ? 'var(--pmx-red)' : 'var(--border)',
              }}
              placeholder="Enter your account password"
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
            />
            {error && (
              <div style={{ fontSize: 11, color: 'var(--pmx-red)', marginTop: 4 }}>
                {error}{attempts > 0 && ` (Attempt ${attempts})`}
              </div>
            )}
          </div>

          {/* Compliance checkbox */}
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 20, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 2, accentColor: 'var(--pmx-teal)' }}
            />
            <span style={{ fontSize: 11, color: 'var(--pmx-tx2)', lineHeight: 1.5 }}>
              I understand this creates a legally binding electronic signature equivalent to a handwritten signature under 21 CFR Part 11.
            </span>
          </label>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                border: '0.5px solid var(--border)',
                background: 'var(--pmx-bg)',
                color: 'var(--pmx-tx2)',
                fontFamily: 'inherit',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              style={{
                padding: '8px 22px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: canConfirm ? 'pointer' : 'not-allowed',
                border: 'none',
                background: canConfirm ? 'var(--pmx-teal)' : 'var(--border)',
                color: canConfirm ? '#fff' : 'var(--pmx-tx3)',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background .15s, color .15s',
              }}
            >
              {isLoading && (
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
              {isLoading ? 'Signing...' : 'Sign & Confirm'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 24px',
          borderTop: '0.5px solid var(--border)',
          fontSize: 10,
          color: 'var(--pmx-tx3)',
          fontFamily: "'IBM Plex Mono', monospace",
          textAlign: 'center',
        }}>
          SHA-256 hash will be computed at moment of signing &middot; Audit trail immutable
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(2px)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--pmx-bg)',
  borderRadius: 14,
  boxShadow: '0 12px 40px rgba(0,0,0,.18)',
  width: 480,
  maxWidth: '95vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  border: '0.5px solid var(--border)',
};

const headerStyle: React.CSSProperties = {
  padding: '16px 24px',
  borderBottom: '0.5px solid var(--border)',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '.04em',
  color: 'var(--pmx-tx)',
  textTransform: 'uppercase',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--pmx-tx2)',
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  marginBottom: 4,
};

const readOnlyFieldStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--pmx-tx)',
  padding: '6px 10px',
  background: 'var(--pmx-bg2)',
  borderRadius: 6,
  border: '0.5px solid var(--border)',
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
