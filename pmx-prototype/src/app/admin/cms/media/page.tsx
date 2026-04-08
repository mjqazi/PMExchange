'use client';

import { useState, useEffect, useRef } from 'react';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  dimensions: string;
  type: string;
  folder: string;
  uploaded_at: string;
}

const DEMO_MEDIA: MediaFile[] = [
  { id: '1', name: 'logo.png', url: '/logo.png', size: 24500, dimensions: '200x60', type: 'image/png', folder: 'brand', uploaded_at: '2026-03-01' },
  { id: '2', name: 'hero-bg.jpg', url: '/images/hero-bg.jpg', size: 485000, dimensions: '1920x800', type: 'image/jpeg', folder: 'banners', uploaded_at: '2026-03-10' },
  { id: '3', name: 'tier3-launch.jpg', url: '/blog/tier3-launch.jpg', size: 320000, dimensions: '1200x630', type: 'image/jpeg', folder: 'blog', uploaded_at: '2026-03-28' },
  { id: '4', name: 'cqs-guide.jpg', url: '/blog/cqs-guide.jpg', size: 290000, dimensions: '1200x630', type: 'image/jpeg', folder: 'blog', uploaded_at: '2026-03-25' },
  { id: '5', name: 'drap-update.jpg', url: '/blog/drap-update.jpg', size: 275000, dimensions: '1200x630', type: 'image/jpeg', folder: 'blog', uploaded_at: '2026-03-18' },
  { id: '6', name: 'case-study-kpc.jpg', url: '/blog/case-study-kpc.jpg', size: 310000, dimensions: '1200x630', type: 'image/jpeg', folder: 'blog', uploaded_at: '2026-03-12' },
  { id: '7', name: 'placeholder-product.png', url: '/images/placeholder-product.png', size: 15000, dimensions: '400x400', type: 'image/png', folder: 'products', uploaded_at: '2026-02-20' },
  { id: '8', name: 'favicon.ico', url: '/favicon.ico', size: 4200, dimensions: '32x32', type: 'image/x-icon', folder: 'brand', uploaded_at: '2026-01-15' },
  { id: '9', name: 'og-image.jpg', url: '/images/og-image.jpg', size: 180000, dimensions: '1200x630', type: 'image/jpeg', folder: 'brand', uploaded_at: '2026-02-01' },
  { id: '10', name: 'seller-guide-cover.jpg', url: '/images/seller-guide-cover.jpg', size: 250000, dimensions: '800x600', type: 'image/jpeg', folder: 'guides', uploaded_at: '2026-04-02' },
];

const FOLDERS = ['All', 'brand', 'banners', 'blog', 'products', 'guides'];

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function CMSMediaPage() {
  const [files, setFiles] = useState<MediaFile[]>(DEMO_MEDIA);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [filterFolder, setFilterFolder] = useState('All');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/cms/media')
      .then(r => r.json())
      .then(d => { if (d.success) setFiles(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const newFile: MediaFile = {
        id: String(Date.now() + i),
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        dimensions: 'Detecting...',
        type: file.type,
        folder: 'uploads',
        uploaded_at: new Date().toISOString().split('T')[0],
      };

      // Try to detect image dimensions
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, dimensions: `${img.width}x${img.height}` } : f));
        };
        img.src = newFile.url;
      }

      setFiles(prev => [newFile, ...prev]);

      // Attempt API upload
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/cms/media', { method: 'POST', body: formData });
        const d = await res.json();
        if (d.success && d.data) {
          setFiles(prev => prev.map(f => f.id === newFile.id ? { ...newFile, ...d.data } : f));
        }
      } catch { /* keep local version */ }
    }
    setUploading(false);
    setSuccessMsg(`${fileList.length} file(s) uploaded.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleDelete = async (id: string) => {
    try { await fetch(`/api/cms/media/${id}`, { method: 'DELETE' }); } catch { /* ignore */ }
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFile?.id === id) setSelectedFile(null);
    setDeleteConfirm(null);
    setSuccessMsg('File deleted.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filtered = filterFolder === 'All' ? files : files.filter(f => f.folder === filterFolder);

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading media...</div>
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
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>Media Library</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>{files.length} files &middot; {formatSize(files.reduce((sum, f) => sum + f.size, 0))} total</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-teal)', color: '#fff', fontFamily: 'inherit' }}
        >
          + Upload Files
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />
      </div>

      {/* Folder Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {FOLDERS.map(folder => (
          <button
            key={folder}
            onClick={() => setFilterFolder(folder)}
            style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: filterFolder === folder ? 'var(--pmx-teal)' : 'var(--pmx-bg)', color: filterFolder === folder ? '#fff' : 'var(--pmx-tx)', fontFamily: 'inherit' }}
          >{folder}</button>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--pmx-teal)' : 'var(--border)'}`,
          borderRadius: 12,
          padding: '24px 16px',
          textAlign: 'center',
          marginBottom: 18,
          background: dragOver ? 'var(--pmx-teal-light)' : 'var(--pmx-bg)',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div style={{ fontSize: 13, color: 'var(--pmx-teal)', fontWeight: 500 }}>Uploading...</div>
        ) : (
          <>
            <div style={{ fontSize: 24, color: 'var(--pmx-tx3)', marginBottom: 6 }}>&#128193;</div>
            <div style={{ fontSize: 13, color: 'var(--pmx-tx2)', fontWeight: 500 }}>Drag and drop files here or click to browse</div>
            <div style={{ fontSize: 11, color: 'var(--pmx-tx3)', marginTop: 4 }}>Supports JPG, PNG, GIF, SVG, ICO</div>
          </>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--pmx-bg)', borderRadius: 12, padding: 24, maxWidth: 400 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Delete File?</h3>
            <p style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 16 }}>This action cannot be undone. Any references to this file will break.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid transparent', background: 'var(--pmx-red)', color: '#fff', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 18 }}>
        {/* Grid */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {filtered.map(file => (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                style={{
                  background: 'var(--pmx-bg)',
                  border: selectedFile?.id === file.id ? '2px solid var(--pmx-teal)' : '0.5px solid var(--border)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{
                  width: '100%',
                  height: 100,
                  background: 'var(--pmx-bg2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  color: 'var(--pmx-tx3)',
                  overflow: 'hidden',
                }}>
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <span>&#128196;</span>
                  )}
                </div>
                <div style={{ padding: '6px 8px' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--pmx-tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--pmx-tx3)' }}>{formatSize(file.size)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Details Sidebar */}
        {selectedFile && (
          <div style={{ width: 260, flexShrink: 0, background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, alignSelf: 'flex-start', position: 'sticky', top: 70 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)' }}>File Details</div>
              <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: 'var(--pmx-tx2)' }}>&times;</button>
            </div>

            <div style={{
              width: '100%',
              height: 140,
              background: 'var(--pmx-bg2)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginBottom: 12,
            }}>
              {selectedFile.type.startsWith('image/') ? (
                <img src={selectedFile.url} alt={selectedFile.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <span style={{ fontSize: 36, color: 'var(--pmx-tx3)' }}>&#128196;</span>
              )}
            </div>

            <div style={{ fontSize: 12, marginBottom: 12 }}>
              {[
                { label: 'Name', value: selectedFile.name },
                { label: 'Size', value: formatSize(selectedFile.size) },
                { label: 'Dimensions', value: selectedFile.dimensions },
                { label: 'Type', value: selectedFile.type },
                { label: 'Folder', value: selectedFile.folder },
                { label: 'Uploaded', value: selectedFile.uploaded_at },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <span style={{ color: 'var(--pmx-tx2)', fontSize: 11 }}>{item.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pmx-tx2)', display: 'block', marginBottom: 4 }}>URL</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  readOnly
                  value={selectedFile.url}
                  style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '0.5px solid var(--input)', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", background: 'var(--pmx-bg2)' }}
                />
                <button
                  onClick={() => copyUrl(selectedFile.url)}
                  style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-teal)', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setDeleteConfirm(selectedFile.id)}
              style={{ width: '100%', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--pmx-red)', background: 'var(--pmx-red-light)', color: 'var(--pmx-red)', fontFamily: 'inherit' }}
            >
              Delete File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
