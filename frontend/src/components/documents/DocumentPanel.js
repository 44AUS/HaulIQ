import { useState, useEffect, useRef } from 'react';
import { IonSpinner, IonModal } from '@ionic/react';
import { documentsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import IonIcon from '../IonIcon';

const DOC_TYPES = [
  { value: 'BOL',              label: 'Bill of Lading' },
  { value: 'POD',              label: 'Proof of Delivery' },
  { value: 'receipt',          label: 'Receipt' },
  { value: 'rate_confirmation', label: 'Rate Confirmation' },
  { value: 'other',            label: 'Other' },
];

const TYPE_COLOR = {
  BOL:              { bg: '#1565c0', color: '#fff' },
  POD:              { bg: '#2e7d32', color: '#fff' },
  receipt:          { bg: '#e65100', color: '#fff' },
  rate_confirmation:{ bg: '#01579b', color: '#fff' },
  other:            { bg: 'var(--ion-color-medium)', color: '#fff' },
};

const KEYWORDS = ['BOL', 'POD', 'pickup', 'delivery', 'delivered', 'confirmed', 'confirm',
  'receipt', 'document', 'sign', 'signed', 'arrived', 'loaded', 'unloaded',
  'bill of lading', 'proof of delivery', 'on site', 'at dock'];

const cardStyle = {
  backgroundColor: 'var(--ion-card-background)',
  border: '1px solid var(--ion-border-color)',
  borderRadius: 8,
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))',
  border: '1px solid var(--ion-border-color)',
  borderRadius: 6,
  color: 'var(--ion-text-color)',
  fontSize: '0.875rem',
  padding: '9px 12px',
  outline: 'none',
  fontFamily: 'inherit',
};

function TypeBadge({ docType }) {
  const c = TYPE_COLOR[docType] || TYPE_COLOR.other;
  return (
    <span style={{ backgroundColor: c.bg, color: c.color, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {docType.replace('_', ' ')}
    </span>
  );
}

function RoleBadge({ role }) {
  const isBroker = role === 'broker';
  return (
    <span style={{ backgroundColor: isBroker ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
      {role}
    </span>
  );
}

function HighlightedText({ text }) {
  const regex = new RegExp(`(${KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <span key={i} style={{ backgroundColor: 'rgba(202,138,4,0.85)', color: '#fff', padding: '0 3px', borderRadius: 3, fontWeight: 700, fontSize: 'inherit' }}>{part}</span>
          : part
      )}
    </>
  );
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

async function processImage(dataUrl, scanMode) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1400;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;

      let minB = 255, maxB = 0;
      for (let i = 0; i < d.length; i += 4) {
        const b = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (b < minB) minB = b;
        if (b > maxB) maxB = b;
      }
      const range = Math.max(maxB - minB, 1);

      for (let i = 0; i < d.length; i += 4) {
        if (scanMode) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const norm = ((gray - minB) / range) * 255;
          const out = Math.min(255, Math.max(0, (norm - 128) * 1.55 + 148));
          d[i] = d[i + 1] = d[i + 2] = out;
        } else {
          for (let c = 0; c < 3; c++) {
            d[i + c] = Math.min(255, Math.max(0, ((d[i + c] - minB) / range) * 248));
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.84));
    };
    img.src = dataUrl;
  });
}

export default function DocumentPanel({ loadId }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [docs, setDocs] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [pages, setPages] = useState([]);
  const [docType, setDocType] = useState('other');
  const [fileName, setFileName] = useState('');
  const [scanMode, setScanMode] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [viewerDoc, setViewerDoc] = useState(null);
  const [viewerPage, setViewerPage] = useState(0);

  useEffect(() => {
    if (!loadId) return;
    setLoading(true);
    Promise.all([documentsApi.list(loadId), documentsApi.messages(loadId)])
      .then(([d, m]) => { setDocs(Array.isArray(d) ? d : []); setMsgs(Array.isArray(m) ? m : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadId]);

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setProcessing(true);
    if (!uploadOpen) setUploadOpen(true);
    const processed = [];
    for (const file of files) {
      const raw = await readFileAsDataUrl(file);
      const enhanced = file.type.startsWith('image/') ? await processImage(raw, scanMode) : raw;
      processed.push(enhanced);
    }
    setPages(prev => [...prev, ...processed]);
    setProcessing(false);
    e.target.value = '';
  };

  const handleRemovePage = (idx) => setPages(prev => prev.filter((_, i) => i !== idx));

  const handleUpload = async () => {
    if (!pages.length) return;
    setUploading(true);
    try {
      const doc = await documentsApi.upload(loadId, {
        file_name: fileName.trim() || `${docType.toUpperCase()} — ${new Date().toLocaleDateString()}`,
        doc_type: docType,
        pages,
      });
      setDocs(prev => [doc, ...prev]);
      setUploadOpen(false);
      setPages([]);
      setDocType('other');
      setFileName('');
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc, e) => {
    e.stopPropagation();
    setDeletingId(doc.id);
    try {
      await documentsApi.delete(loadId, doc.id);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) { alert(err.message); }
    finally { setDeletingId(null); }
  };

  const openUploadWith = (ref) => {
    setScanMode(true);
    ref.current?.click();
  };

  const tabBtnStyle = (active) => ({
    flex: 1,
    padding: '8px 12px',
    fontSize: '0.78rem',
    fontFamily: 'inherit',
    fontWeight: active ? 600 : 400,
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--ion-color-primary)' : '2px solid transparent',
    color: active ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)',
    cursor: 'pointer',
    transition: 'color 0.15s',
  });

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--ion-border-color)' }}>
        <button style={tabBtnStyle(tab === 0)} onClick={() => setTab(0)}>
          Documents ({docs.length})
        </button>
        <button style={tabBtnStyle(tab === 1)} onClick={() => setTab(1)}>
          Load Messages ({msgs.length})
        </button>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef}   type="file" accept="image/*,application/pdf" multiple hidden onChange={handleFilesSelected} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFilesSelected} />

      {/* Documents Tab */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 16, paddingBottom: 16 }}>
            <button
              onClick={() => openUploadWith(cameraInputRef)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.82rem', fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600 }}
            >
              <IonIcon name="camera-outline" /> Scan / Camera
            </button>
            <button
              onClick={() => openUploadWith(fileInputRef)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', backgroundColor: 'transparent', color: 'var(--ion-color-primary)', border: '1px solid var(--ion-color-primary)', borderRadius: 6, fontSize: '0.82rem', fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600 }}
            >
              <IonIcon name="cloud-upload-outline" /> Upload File
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : docs.length === 0 ? (
            <div style={{ ...cardStyle, padding: 24, textAlign: 'center' }}>
              <IonIcon name="document-text-outline" style={{ fontSize: 36, color: 'var(--ion-color-medium)', marginBottom: 8 }} />
              <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No documents uploaded yet</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', opacity: 0.7 }}>Scan BOLs, PODs, receipts — no extra apps needed</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {docs.map(doc => (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  userId={user?.id}
                  deletingId={deletingId}
                  onOpen={() => { setViewerDoc(doc); setViewerPage(0); }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Load Messages Tab */}
      {tab === 1 && (
        <div style={{ paddingTop: 16 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : msgs.length === 0 ? (
            <div style={{ ...cardStyle, padding: 24, textAlign: 'center' }}>
              <IonIcon name="chatbubble-outline" style={{ fontSize: 36, color: 'var(--ion-color-medium)', marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No messages for this load yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ backgroundColor: 'rgba(2,136,209,0.08)', border: '1px solid rgba(2,136,209,0.25)', borderRadius: 6, padding: '6px 12px', fontSize: '0.73rem', color: 'var(--ion-text-color)', marginBottom: 4 }}>
                Keywords related to document events are highlighted automatically.
              </div>
              {msgs.map(msg => (
                <div key={msg.id} style={{ ...cardStyle, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    <RoleBadge role={msg.sender_role} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{msg.sender_name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', marginLeft: 'auto' }}>
                      {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)', lineHeight: 1.6 }}>
                    <HighlightedText text={msg.body} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <IonModal isOpen={uploadOpen} onDidDismiss={() => !uploading && setUploadOpen(false)} style={{ '--width': '540px', '--height': 'auto', '--max-height': '90vh', '--border-radius': '12px' }}>
        <div style={{ padding: 24, backgroundColor: 'var(--ion-card-background)', overflowY: 'auto', maxHeight: '90vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ flex: 1, fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Add Document</span>
            <button onClick={() => { setUploadOpen(false); setPages([]); }} disabled={uploading}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex', alignItems: 'center' }}>
              <IonIcon name="close-outline" style={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Pages grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {pages.map((p, i) => (
              <div key={i} style={{ position: 'relative', width: 80, height: 104 }}>
                <img src={p} alt={`page ${i + 1}`} style={{ width: 80, height: 104, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--ion-border-color)', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '0 0 4px 4px', textAlign: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 10 }}>p.{i + 1}</span>
                </div>
                <button onClick={() => handleRemovePage(i)}
                  style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <IonIcon name="close-outline" style={{ fontSize: 10 }} />
                </button>
              </div>
            ))}
            {processing && (
              <div style={{ width: 80, height: 104, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--ion-border-color)', borderRadius: 4 }}>
                <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
              </div>
            )}
            <div
              onClick={() => cameraInputRef.current?.click()}
              style={{ width: 80, height: 104, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--ion-border-color)', borderRadius: 4, cursor: 'pointer', gap: 4 }}
            >
              <IonIcon name="image-outline" style={{ fontSize: 22, color: 'var(--ion-color-medium)' }} />
              <span style={{ fontSize: 10, color: 'var(--ion-color-medium)' }}>Add page</span>
            </div>
          </div>

          {/* Scan mode toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => setScanMode(v => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: '0.72rem', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', borderRadius: 6, border: scanMode ? 'none' : '1px solid var(--ion-color-primary)', backgroundColor: scanMode ? 'var(--ion-color-primary)' : 'transparent', color: scanMode ? '#fff' : 'var(--ion-color-primary)' }}
            >
              <IonIcon name="sparkles-outline" />
              {scanMode ? 'Scan Mode' : 'Color Mode'}
            </button>
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
              {scanMode ? 'Grayscale + high contrast for crisp scans' : 'Auto-levels only, keeps original colors'}
            </span>
          </div>

          {/* Doc type + filename */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600 }}>Document Type</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} style={{ ...inputStyle, padding: '7px 10px' }}>
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600 }}>File Name (optional)</label>
              <input
                style={inputStyle}
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                placeholder={`${docType.replace('_', ' ').toUpperCase()} — ${new Date().toLocaleDateString()}`}
              />
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!pages.length || uploading}
            style={{ width: '100%', padding: '12px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.95rem', fontFamily: 'inherit', fontWeight: 700, cursor: (!pages.length || uploading) ? 'not-allowed' : 'pointer', opacity: (!pages.length || uploading) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {uploading ? <IonSpinner name="crescent" style={{ width: 16, height: 16, color: '#fff' }} /> : <IonIcon name="checkmark-circle" />}
            {uploading ? 'Uploading…' : `Upload ${pages.length} page${pages.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </IonModal>

      {/* Document Viewer Modal */}
      <IonModal isOpen={!!viewerDoc} onDidDismiss={() => setViewerDoc(null)} style={{ '--width': '720px', '--height': 'auto', '--max-height': '92vh', '--border-radius': '12px' }}>
        {viewerDoc && (
          <div style={{ backgroundColor: 'var(--ion-card-background)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
              <TypeBadge docType={viewerDoc.doc_type} />
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {viewerDoc.file_name}
              </span>
              {viewerDoc.page_count > 1 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', flexShrink: 0 }}>
                  {viewerPage + 1} / {viewerDoc.page_count}
                </span>
              )}
              <button onClick={() => setViewerDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex', alignItems: 'center' }}>
                <IonIcon name="close-outline" style={{ fontSize: 20 }} />
              </button>
            </div>

            {/* Image */}
            <div style={{ position: 'relative', backgroundColor: '#111', flex: 1, overflow: 'hidden' }}>
              <img src={viewerDoc.pages[viewerPage]} alt="document" style={{ width: '100%', display: 'block', maxHeight: '72vh', objectFit: 'contain' }} />
              {viewerDoc.page_count > 1 && (
                <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <button
                    disabled={viewerPage === 0}
                    onClick={() => setViewerPage(p => p - 1)}
                    style={{ width: 36, height: 36, backgroundColor: viewerPage === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: viewerPage === 0 ? 'rgba(255,255,255,0.3)' : '#fff', cursor: viewerPage === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <IonIcon name="chevron-back-outline" />
                  </button>
                  <button
                    disabled={viewerPage >= viewerDoc.page_count - 1}
                    onClick={() => setViewerPage(p => p + 1)}
                    style={{ width: 36, height: 36, backgroundColor: viewerPage >= viewerDoc.page_count - 1 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: viewerPage >= viewerDoc.page_count - 1 ? 'rgba(255,255,255,0.3)' : '#fff', cursor: viewerPage >= viewerDoc.page_count - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <IonIcon name="chevron-forward-outline" />
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>
                Uploaded by <strong>{viewerDoc.uploader_name}</strong> ({viewerDoc.uploader_role})
                {' · '}{new Date(viewerDoc.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </IonModal>
    </div>
  );
}

function DocRow({ doc, userId, deletingId, onOpen, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...cardStyle, padding: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', backgroundColor: hovered ? 'var(--ion-color-light)' : 'var(--ion-card-background)', transition: 'background-color 0.15s' }}
    >
      {/* Thumbnail */}
      <div style={{ width: 44, height: 56, borderRadius: 4, overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--ion-color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {doc.pages?.[0]
          ? <img src={doc.pages[0]} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <IonIcon name="document-text-outline" style={{ fontSize: 20, color: 'var(--ion-color-medium)' }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <TypeBadge docType={doc.doc_type} />
          {doc.page_count > 1 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{doc.page_count} pages</span>
          )}
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
          {doc.uploader_name} · {doc.uploader_role} · {new Date(doc.created_at).toLocaleDateString()}
        </div>
      </div>
      {String(doc.uploader_id) === String(userId) && (
        <button
          disabled={deletingId === doc.id}
          onClick={(e) => onDelete(doc, e)}
          style={{ background: 'none', border: 'none', cursor: deletingId === doc.id ? 'default' : 'pointer', color: 'var(--ion-color-medium)', padding: 6, display: 'flex', alignItems: 'center', flexShrink: 0, borderRadius: 4 }}
        >
          {deletingId === doc.id
            ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} />
            : <IonIcon name="trash-outline" style={{ fontSize: 16 }} />
          }
        </button>
      )}
    </div>
  );
}
