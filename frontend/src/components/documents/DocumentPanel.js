import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Chip, IconButton, Tab, Tabs, CircularProgress,
  Dialog, DialogContent, DialogTitle, TextField, Select, MenuItem,
  FormControl, InputLabel, Paper, Alert,
} from '@mui/material';
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
  BOL: 'primary', POD: 'success', receipt: 'warning',
  rate_confirmation: 'info', other: 'default',
};

const KEYWORDS = ['BOL', 'POD', 'pickup', 'delivery', 'delivered', 'confirmed', 'confirm',
  'receipt', 'document', 'sign', 'signed', 'arrived', 'loaded', 'unloaded',
  'bill of lading', 'proof of delivery', 'on site', 'at dock'];

function HighlightedText({ text }) {
  const regex = new RegExp(`(${KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <Box key={i} component="span" sx={{ bgcolor: 'warning.dark', color: '#fff', px: 0.4, py: 0.1, borderRadius: 0.5, fontWeight: 700, fontSize: 'inherit' }}>{part}</Box>
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

      // Compute brightness range for auto-levels
      let minB = 255, maxB = 0;
      for (let i = 0; i < d.length; i += 4) {
        const b = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (b < minB) minB = b;
        if (b > maxB) maxB = b;
      }
      const range = Math.max(maxB - minB, 1);

      for (let i = 0; i < d.length; i += 4) {
        if (scanMode) {
          // Grayscale + stretch contrast + boost for document look
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const norm = ((gray - minB) / range) * 255;
          const out = Math.min(255, Math.max(0, (norm - 128) * 1.55 + 148));
          d[i] = d[i + 1] = d[i + 2] = out;
        } else {
          // Auto-levels on each channel (color, mild enhancement)
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

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pages, setPages] = useState([]);
  const [docType, setDocType] = useState('other');
  const [fileName, setFileName] = useState('');
  const [scanMode, setScanMode] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Viewer state
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

  return (
    <Box>
      {/* ── Tabs ── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 38 }}>
          <Tab label={`Documents (${docs.length})`} sx={{ minHeight: 38, fontSize: '0.78rem', textTransform: 'none' }} />
          <Tab label={`Load Messages (${msgs.length})`} sx={{ minHeight: 38, fontSize: '0.78rem', textTransform: 'none' }} />
        </Tabs>
      </Box>

      {/* Hidden file inputs */}
      <input ref={fileInputRef}   type="file" accept="image/*,application/pdf" multiple hidden onChange={handleFilesSelected} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFilesSelected} />

      {/* ── Documents Tab ── */}
      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, pt: 2, pb: 2 }}>
            <Button variant="contained" size="small" startIcon={<IonIcon name="camera-outline" />}
              onClick={() => openUploadWith(cameraInputRef)}>
              Scan / Camera
            </Button>
            <Button variant="outlined" size="small" startIcon={<IonIcon name="cloud-upload-outline" />}
              onClick={() => openUploadWith(fileInputRef)}>
              Upload File
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
          ) : docs.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <IonIcon name="document-text-outline" sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">No documents uploaded yet</Typography>
              <Typography variant="caption" color="text.disabled" display="block">Scan BOLs, PODs, receipts — no extra apps needed</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {docs.map(doc => (
                <Paper key={doc.id} variant="outlined"
                  sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => { setViewerDoc(doc); setViewerPage(0); }}
                >
                  {/* Thumbnail */}
                  <Box sx={{ width: 44, height: 56, borderRadius: 1, overflow: 'hidden', flexShrink: 0, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {doc.pages?.[0]
                      ? <Box component="img" src={doc.pages[0]} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <IonIcon name="document-text-outline" sx={{ fontSize: 20, color: 'text.disabled' }} />
                    }
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                      <Chip label={doc.doc_type.replace('_', ' ').toUpperCase()} size="small"
                        color={TYPE_COLOR[doc.doc_type] || 'default'} sx={{ fontSize: 9, height: 18 }} />
                      {doc.page_count > 1 && (
                        <Typography variant="caption" color="text.disabled">{doc.page_count} pages</Typography>
                      )}
                    </Box>
                    <Typography variant="body2" fontWeight={600} noWrap>{doc.file_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {doc.uploader_name} · {doc.uploader_role} · {new Date(doc.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {String(doc.uploader_id) === String(user?.id) && (
                    <IconButton size="small" disabled={deletingId === doc.id}
                      sx={{ flexShrink: 0, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                      onClick={(e) => handleDelete(doc, e)}
                    >
                      {deletingId === doc.id
                        ? <CircularProgress size={14} />
                        : <IonIcon name="trash-outline" sx={{ fontSize: 16 }} />
                      }
                    </IconButton>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ── Load Messages Tab ── */}
      {tab === 1 && (
        <Box sx={{ pt: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
          ) : msgs.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <IonIcon name="chatbubble-outline" sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">No messages for this load yet</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Alert severity="info" icon={false} sx={{ py: 0.5, fontSize: '0.73rem', mb: 0.5 }}>
                Keywords related to document events are highlighted automatically.
              </Alert>
              {msgs.map(msg => (
                <Paper key={msg.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={msg.sender_role}
                      size="small"
                      color={msg.sender_role === 'broker' ? 'primary' : 'default'}
                      sx={{ fontSize: 9, height: 18 }}
                    />
                    <Typography variant="caption" fontWeight={600}>{msg.sender_name}</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                      {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    <HighlightedText text={msg.body} />
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ── Upload Dialog ── */}
      <Dialog open={uploadOpen} onClose={() => !uploading && setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', pb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>Add Document</Typography>
          <IconButton size="small" onClick={() => { setUploadOpen(false); setPages([]); }} disabled={uploading}>
            <IonIcon name="close-outline" fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Pages grid */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {pages.map((p, i) => (
              <Box key={i} sx={{ position: 'relative', width: 80, height: 104 }}>
                <Box component="img" src={p}
                  sx={{ width: 80, height: 104, objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider', display: 'block' }} />
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: '0 0 4px 4px', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#fff', fontSize: 10 }}>p.{i + 1}</Typography>
                </Box>
                <IconButton size="small" onClick={() => handleRemovePage(i)}
                  sx={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                  <IonIcon name="close-outline" sx={{ fontSize: 10 }} />
                </IconButton>
              </Box>
            ))}
            {processing && (
              <Box sx={{ width: 80, height: 104, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 1, borderColor: 'divider', borderRadius: 1, borderStyle: 'dashed' }}>
                <CircularProgress size={20} />
              </Box>
            )}
            <Box
              sx={{ width: 80, height: 104, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: 1, borderColor: 'divider', borderStyle: 'dashed', borderRadius: 1, cursor: 'pointer', gap: 0.5, '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => cameraInputRef.current?.click()}
            >
              <IonIcon name="image-outline" sx={{ fontSize: 22, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>Add page</Typography>
            </Box>
          </Box>

          {/* Scan mode */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Button size="small" variant={scanMode ? 'contained' : 'outlined'} startIcon={<IonIcon name="sparkles-outline" />}
              onClick={() => setScanMode(v => !v)} sx={{ fontSize: '0.72rem', minWidth: 0 }}>
              {scanMode ? 'Scan Mode' : 'Color Mode'}
            </Button>
            <Typography variant="caption" color="text.secondary">
              {scanMode ? 'Grayscale + high contrast for crisp scans' : 'Auto-levels only, keeps original colors'}
            </Typography>
          </Box>

          {/* Doc type + filename */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Document Type</InputLabel>
              <Select value={docType} onChange={e => setDocType(e.target.value)} label="Document Type">
                {DOC_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="File Name (optional)" value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder={`${docType.replace('_', ' ').toUpperCase()} — ${new Date().toLocaleDateString()}`}
              sx={{ flex: 1, minWidth: 160 }} />
          </Box>

          <Button fullWidth variant="contained" size="large"
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <IonIcon name="checkmark-circle" />}
            onClick={handleUpload} disabled={!pages.length || uploading}
          >
            {uploading ? 'Uploading…' : `Upload ${pages.length} page${pages.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Document Viewer ── */}
      <Dialog open={!!viewerDoc} onClose={() => setViewerDoc(null)} maxWidth="md" fullWidth>
        {viewerDoc && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5 }}>
              <Chip label={viewerDoc.doc_type.replace('_', ' ').toUpperCase()} size="small"
                color={TYPE_COLOR[viewerDoc.doc_type] || 'default'} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }} noWrap>{viewerDoc.file_name}</Typography>
              {viewerDoc.page_count > 1 && (
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                  {viewerPage + 1} / {viewerDoc.page_count}
                </Typography>
              )}
              <IconButton size="small" onClick={() => setViewerDoc(null)}><IonIcon name="close-outline" fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ position: 'relative', bgcolor: '#111' }}>
                <Box component="img" src={viewerDoc.pages[viewerPage]}
                  sx={{ width: '100%', display: 'block', maxHeight: '72vh', objectFit: 'contain' }} />
                {viewerDoc.page_count > 1 && (
                  <Box sx={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <IconButton size="small" disabled={viewerPage === 0} onClick={() => setViewerPage(p => p - 1)}
                      sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' }, '&:disabled': { bgcolor: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.3)' } }}>
                      <IonIcon name="chevron-back-outline" />
                    </IconButton>
                    <IconButton size="small" disabled={viewerPage >= viewerDoc.page_count - 1} onClick={() => setViewerPage(p => p + 1)}
                      sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' }, '&:disabled': { bgcolor: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.3)' } }}>
                      <IonIcon name="chevron-forward-outline" />
                    </IconButton>
                  </Box>
                )}
              </Box>
              <Box sx={{ px: 2, py: 1.25 }}>
                <Typography variant="caption" color="text.secondary">
                  Uploaded by <strong>{viewerDoc.uploader_name}</strong> ({viewerDoc.uploader_role})
                  {' · '}{new Date(viewerDoc.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
