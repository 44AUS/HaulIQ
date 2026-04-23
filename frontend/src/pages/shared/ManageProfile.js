import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert,
  Divider, CircularProgress, Snackbar, Chip,
  IconButton, Tooltip, LinearProgress, MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { authApi, freightPaymentsApi, profileDocumentsApi } from '../../services/api';
import { useTheme } from '@mui/material/styles';
import IonIcon from '../../components/IonIcon';


function resizeToDataUrl(file, size = 256) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = url;
  });
}

async function fileToPages(file) {
  if (file.type === 'application/pdf') {
    // Store as base64 PDF data-URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve([reader.result]);
      reader.readAsDataURL(file);
    });
  }
  // Image — resize and store as single page
  const dataUrl = await resizeToDataUrl(file, 1200);
  return [dataUrl];
}

const fmtDate = (iso) => {
  if (!iso) return '—';
  const utc = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  return new Date(utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const fmtFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const DOC_TYPE_LABELS = {
  insurance:           'Insurance Certificate',
  authority:           'Operating Authority (MC)',
  w9:                  'W-9 Form',
  drivers_license:     'Driver\'s License',
  vehicle_registration:'Vehicle Registration',
  dot_inspection:      'DOT Inspection',
  ifta:                'IFTA License',
  other:               'Other',
};

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ setSnackbar }) {
  const { user, updateUser } = useAuth();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const fileRef = useRef();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [payoutStatus,    setPayoutStatus]    = useState(null);
  const location = useLocation();

  // Edit info dialog
  const [editOpen, setEditOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '', phone: user?.phone || '',
    company: user?.company || '', mc: user?.mc || '', dot: user?.dot || '',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // Password dialog
  const [pwOpen, setPwOpen] = useState(false);
  const [passwords, setPasswords] = useState({ next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  // Notes dialog
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Copied state
  const [copied, setCopied] = useState(null);

  const copy = (val, key) => {
    navigator.clipboard.writeText(val || '').catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('payout');
    if (p === 'success') setSnackbar({ open: true, msg: 'Payout account connected!', severity: 'success' });
    else if (p === 'refresh') setSnackbar({ open: true, msg: 'Please complete payout setup.', severity: 'warning' });
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.role === 'carrier') {
      freightPaymentsApi.onboardStatus()
        .then(d => setPayoutStatus(d))
        .catch(() => setPayoutStatus(null));
    }
  }, [user?.role]);

  const handleConnectPayout = async () => {
    try {
      const data = await freightPaymentsApi.onboard();
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      setSnackbar({ open: true, msg: err.message || 'Failed to start payout setup.', severity: 'error' });
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const dataUrl = await resizeToDataUrl(file, 400);
      await authApi.update({ avatar_url: dataUrl });
      updateUser({ avatar_url: dataUrl });
    } catch { alert('Failed to upload photo.'); }
    finally { setAvatarUploading(false); e.target.value = ''; }
  };

  async function saveProfile() {
    setSaving(true); setStatus(null);
    try {
      const updated = await authApi.update({
        name: profile.name || undefined, phone: profile.phone || undefined,
        company: profile.company || undefined, mc_number: profile.mc || undefined,
        dot_number: profile.dot || undefined,
      });
      updateUser({ name: updated.name, phone: updated.phone || null, company: updated.company || updated.name,
        mc: updated.mc_number || null, dot: updated.dot_number || null,
        avatar: updated.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) });
      setEditOpen(false);
    } catch (err) { setStatus({ type: 'error', msg: err.message || 'Failed to save.' }); }
    finally { setSaving(false); }
  }

  async function changePassword() {
    if (passwords.next !== passwords.confirm) { setStatus({ type: 'error', msg: 'Passwords do not match.' }); return; }
    if (passwords.next.length < 8) { setStatus({ type: 'error', msg: 'Min 8 characters.' }); return; }
    setPwSaving(true); setStatus(null);
    try {
      await authApi.update({ password: passwords.next });
      setPasswords({ next: '', confirm: '' });
      setPwOpen(false);
      setSnackbar({ open: true, msg: 'Password changed.', severity: 'success' });
    } catch (err) { setStatus({ type: 'error', msg: err.message || 'Failed.' }); }
    finally { setPwSaving(false); }
  }

  const cardSx = {
    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '10px',
    overflow: 'hidden',
  };

  const InfoRow = ({ label, value, copyKey, showEmail }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.disabled" display="block" sx={{ lineHeight: 1.3 }}>{label}</Typography>
        {value && <Typography variant="body2" fontWeight={600} noWrap>{value}</Typography>}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 1 }}>
        {showEmail && value && (
          <Tooltip title="Send email">
            <IconButton size="small" onClick={() => window.location.href = `mailto:${value}`} sx={{ color: 'warning.main', p: 0.5 }}>
              <IonIcon name="mail-outline" sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
        {copyKey && value && (
          <Tooltip title={copied === copyKey ? 'Copied!' : 'Copy'}>
            <IconButton size="small" onClick={() => copy(value, copyKey)} sx={{ color: copied === copyKey ? 'success.main' : 'text.disabled', p: 0.5 }}>
              <IonIcon name="copy-outline" sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  const AuthRow = ({ icon, iconColor, label, desc, actionLabel, onAction }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <IonIcon name={icon} sx={{ fontSize: 22, color: iconColor || 'text.secondary', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        {desc && <Typography variant="caption" color="text.secondary">{desc}</Typography>}
      </Box>
      <Button size="small" onClick={onAction} sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'success.main', flexShrink: 0, minWidth: 0 }}>
        {actionLabel}
      </Button>
    </Box>
  );

  return (
    <Box sx={{ py: 2, display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* ── Left: Avatar ── */}
      <Box sx={{ flexShrink: 0, position: 'relative' }}>
        <Box
          onClick={() => !avatarUploading && fileRef.current.click()}
          sx={{
            width: 400, height: 400, borderRadius: '10px', overflow: 'hidden',
            bgcolor: isDark ? '#2a2a2a' : '#e8e8e8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
            '&:hover .cam-overlay': { opacity: 1 },
          }}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Typography sx={{ fontSize: '4rem', fontWeight: 300, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }}>
              {user?.name?.[0] || '?'}
            </Typography>
          )}
          <Box className="cam-overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
            {avatarUploading ? <CircularProgress size={28} sx={{ color: '#fff' }} /> : <IonIcon name="camera-outline" sx={{ color: '#fff', fontSize: 28 }} />}
          </Box>
        </Box>
        {/* "..." menu button */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)', borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
          <IconButton size="small" sx={{ color: 'text.secondary', p: 0.5 }}>
            <IonIcon name="ellipsis-vertical-outline" sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
      </Box>

      {/* ── Right: Info sections ── */}
      <Box sx={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Employee Info */}
        <Box sx={cardSx}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.75 }}>
            <Typography variant="subtitle1" fontWeight={700}>Employee Info</Typography>
            <Button size="small" startIcon={<IonIcon name="create-outline" sx={{ fontSize: 14 }} />} onClick={() => { setProfile({ name: user?.name || '', phone: user?.phone || '', company: user?.company || '', mc: user?.mc || '', dot: user?.dot || '' }); setStatus(null); setEditOpen(true); }}
              sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Edit
            </Button>
          </Box>
          <Box sx={{ px: 2.5, pb: 1 }}>
            <InfoRow label="Name"         value={user?.name}  copyKey="name" />
            <InfoRow label="Phone Number" value={user?.phone} copyKey="phone" />
            <InfoRow label="Email"        value={user?.email} copyKey="email" showEmail />
            <InfoRow label="Role"         value={user?.role}  />
            {user?.mc  && <InfoRow label="MC Number"  value={user.mc}  copyKey="mc" />}
            {user?.dot && <InfoRow label="DOT Number" value={user.dot} copyKey="dot" />}
          </Box>
        </Box>

        {/* Authentication Methods */}
        <Box sx={cardSx}>
          <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700}>Authentication Methods</Typography>
          </Box>
          <Box sx={{ px: 2.5, pb: 1 }}>
            <AuthRow
              icon="shield-checkmark-outline"
              label="Two-factor authentication"
              desc="Adds an extra layer of security. You'll enter your password and a code sent to your mobile device."
              actionLabel="Enable"
              onAction={() => {}}
            />
            <AuthRow
              icon="lock-closed-outline"
              label="Password"
              actionLabel="Reset"
              onAction={() => { setStatus(null); setPasswords({ next: '', confirm: '' }); setPwOpen(true); }}
            />
            {user?.role === 'carrier' && (
              <AuthRow
                icon="wallet-outline"
                iconColor={payoutStatus?.connected && payoutStatus?.payouts_enabled ? '#2dd36f' : 'text.secondary'}
                label="Payout Account"
                desc={payoutStatus?.connected && payoutStatus?.payouts_enabled ? 'Connected via Stripe' : 'Not connected'}
                actionLabel={payoutStatus?.connected ? 'Manage' : 'Connect'}
                onAction={handleConnectPayout}
              />
            )}
          </Box>
        </Box>

        {/* Notes */}
        <Box sx={cardSx}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.75 }}>
            <Typography variant="subtitle1" fontWeight={700}>Notes</Typography>
            <Button size="small" startIcon={<IonIcon name="create-outline" sx={{ fontSize: 14 }} />} onClick={() => setNotesOpen(true)}
              sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Edit
            </Button>
          </Box>
          <Box sx={{ px: 2.5, pb: 2 }}>
            {notes ? (
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{notes}</Typography>
            ) : (
              <Typography variant="body2" color="text.disabled">No notes added.</Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* ── Edit Info Dialog ── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Profile</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          {status && <Alert severity={status.type === 'success' ? 'success' : 'error'} onClose={() => setStatus(null)}>{status.msg}</Alert>}
          <TextField label="Full Name"    size="small" fullWidth value={profile.name}    onChange={e => setProfile(p => ({ ...p, name:    e.target.value }))} />
          <TextField label="Phone"        size="small" fullWidth value={profile.phone}   onChange={e => setProfile(p => ({ ...p, phone:   e.target.value }))} />
          <TextField label="Company"      size="small" fullWidth value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} />
          {user?.role === 'carrier' && <>
            <TextField label="MC Number" size="small" fullWidth value={profile.mc}  onChange={e => setProfile(p => ({ ...p, mc:  e.target.value }))} />
            <TextField label="DOT Number"size="small" fullWidth value={profile.dot} onChange={e => setProfile(p => ({ ...p, dot: e.target.value }))} />
          </>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* ── Change Password Dialog ── */}
      <Dialog open={pwOpen} onClose={() => setPwOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Password</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          {status && <Alert severity={status.type === 'success' ? 'success' : 'error'} onClose={() => setStatus(null)}>{status.msg}</Alert>}
          <TextField label="New Password"     size="small" fullWidth type="password" placeholder="Min. 8 characters" value={passwords.next}    onChange={e => setPasswords(p => ({ ...p, next:    e.target.value }))} />
          <TextField label="Confirm Password" size="small" fullWidth type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPwOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={changePassword} disabled={pwSaving || !passwords.next}>{pwSaving ? 'Saving…' : 'Change Password'}</Button>
        </DialogActions>
      </Dialog>

      {/* ── Notes Dialog ── */}
      <Dialog open={notesOpen} onClose={() => setNotesOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Notes</DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <TextField multiline rows={4} fullWidth size="small" placeholder="Add notes about yourself…" value={notes} onChange={e => setNotes(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNotesOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setNotesOpen(false)}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Earnings Tab ──────────────────────────────────────────────────────────────
function EarningsTab() {
  const { user } = useAuth();

  const clockedIn   = user?.clocked_in || false;
  const clockedInAt = user?.clocked_in_at;
  const lat         = user?.clock_in_lat;
  const lng         = user?.clock_in_lng;

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <IonIcon name="time-outline" color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Clock-In Status</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: clockedIn ? '#2dd36f' : '#eb445a', flexShrink: 0 }} />
            <Typography variant="body2" fontWeight={700} color={clockedIn ? 'success.main' : 'error.main'}>
              {clockedIn ? 'Currently Clocked In' : 'Clocked Out'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Last Clock-In</Typography>
              <Typography variant="body2" fontWeight={600}>{fmtDate(clockedInAt)}</Typography>
            </Box>
            {(lat || lng) && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IonIcon name="location-outline" sx={{ fontSize: 14 }} /> Location
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {lat?.toFixed(5)}, {lng?.toFixed(5)}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <IonIcon name="time-outline" sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" fontWeight={600} color="text.secondary">Clock-In History Coming Soon</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Detailed earnings and shift history will appear here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────────────────
function DocumentsTab() {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const fileRef = useRef();
  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType,   setDocType]   = useState('insurance');
  const [error,     setError]     = useState(null);

  const load = useCallback(() => {
    profileDocumentsApi.list()
      .then(d => setDocs(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const pages = await fileToPages(file);
      await profileDocumentsApi.upload({
        file_name:  file.name,
        doc_type:   docType,
        pages,
        page_count: pages.length,
        file_size:  file.size,
      });
      load();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    await profileDocumentsApi.delete(id).catch(() => {});
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* Upload card */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <IonIcon name="cloud-upload-outline" color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Upload Document</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Upload compliance documents such as insurance certificates, operating authority, W-9, and more. Accepted: PDF, JPG, PNG.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Document Type</InputLabel>
              <Select value={docType} label="Document Type" onChange={e => setDocType(e.target.value)}>
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <IonIcon name="add-outline" />}
              disabled={uploading}
              onClick={() => fileRef.current.click()}
              sx={{ fontWeight: 700 }}
            >
              {uploading ? 'Uploading…' : 'Choose File'}
            </Button>
            <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </Box>
        </CardContent>
      </Card>

      {/* Document list */}
      <Card variant="outlined">
        <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight={700}>My Documents</Typography>
          <Typography variant="caption" color="text.disabled">{docs.length} file{docs.length !== 1 ? 's' : ''}</Typography>
        </Box>

        {loading ? (
          <Box sx={{ p: 3 }}>
            {[1,2,3].map(i => <LinearProgress key={i} sx={{ mb: 1, borderRadius: 1 }} />)}
          </Box>
        ) : docs.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <IonIcon name="document-outline" sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No documents uploaded yet.</Typography>
          </Box>
        ) : (
          <Box>
            {docs.map((doc, i) => (
              <Box key={doc.id}>
                {i > 0 && <Divider />}
                <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1.75, gap: 2, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' } }}>
                  <IonIcon name="document-outline" sx={{ fontSize: 32, color: 'primary.main', flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{doc.file_name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip label={DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                      {doc.file_size && (
                        <Typography variant="caption" color="text.disabled">{fmtFileSize(doc.file_size)}</Typography>
                      )}
                      <Typography variant="caption" color="text.disabled">{fmtDate(doc.created_at)}</Typography>
                    </Box>
                  </Box>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(doc.id)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                      <IonIcon name="trash-outline" fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Card>
    </Box>
  );
}

// ── Businesses Tab ────────────────────────────────────────────────────────────
function BusinessesTab() {
  const { user } = useAuth();
  const fields = [
    { label: 'Company Name',   value: user?.company },
    { label: 'Business Address', value: user?.business_address },
    { label: 'City',           value: user?.business_city },
    { label: 'State',          value: user?.business_state },
    { label: 'ZIP',            value: user?.business_zip },
    { label: 'Country',        value: user?.business_country },
    { label: 'MC Number',      value: user?.mc },
    { label: 'DOT Number',     value: user?.dot },
  ].filter(f => f.value);

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <IonIcon name="business-outline" color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Business Information</Typography>
          </Box>
          {fields.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No business information on file. Update your profile to add company details.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {fields.map(({ label, value }, i) => (
                <Box key={label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                  </Box>
                  {i < fields.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <IonIcon name="business-outline" sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" fontWeight={600} color="text.secondary">Multiple Businesses Coming Soon</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            You'll be able to manage multiple business entities from this tab.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

// ── Time Off Tab ──────────────────────────────────────────────────────────────
function TimeOffTab() {
  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <IonIcon name="umbrella-outline" color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Time Off</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manage your availability and schedule time away. When you mark time off, your truck posts will automatically be hidden from the broker Truck Board.
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <IonIcon name="umbrella-outline" sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" fontWeight={600} color="text.secondary">Time Off Scheduling Coming Soon</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Set vacation periods, block dates, and manage availability from here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

// ── Metadata Tab ──────────────────────────────────────────────────────────────
function MetadataTab() {
  const { user } = useAuth();

  const rows = [
    { label: 'User ID',       value: user?.id },
    { label: 'Email',         value: user?.email },
    { label: 'Role',          value: user?.role },
    { label: 'Plan',          value: user?.plan },
    { label: 'Vetting Status',value: user?.vetting_status },
    { label: 'Vetting Score', value: user?.vetting_score },
    { label: 'Member Since',  value: user?.joined },
    { label: 'Last Active',   value: user?.last_active_at ? fmtDate(user.last_active_at) : '—' },
    { label: 'Verified',      value: user?.is_verified ? 'Yes' : 'No' },
    { label: 'Brand Color',   value: user?.brand_color || '—' },
  ];

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: 3 }}>
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2.5}>Account Metadata</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {rows.map(({ label, value }, i) => (
              <Box key={label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>{label}</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', wordBreak: 'break-all', textTransform: 'capitalize' }}>{value ?? '—'}</Typography>
                </Box>
                {i < rows.length - 1 && <Divider sx={{ mt: 1.5 }} />}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────
export default function ManageProfile() {
  const [searchParams] = useSearchParams();
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'success' });
  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 1 }}>
      {activeTab === 'overview'   && <OverviewTab   snackbar={snackbar} setSnackbar={setSnackbar} />}
      {activeTab === 'earnings'   && <EarningsTab />}
      {activeTab === 'documents'  && <DocumentsTab />}
      {activeTab === 'businesses' && <BusinessesTab />}
      {activeTab === 'time_off'   && <TimeOffTab />}
      {activeTab === 'metadata'   && <MetadataTab />}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
