import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert,
  Grid, Divider, Avatar, CircularProgress, Snackbar, Chip,
  IconButton, Tooltip, LinearProgress, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import BusinessIcon from '@mui/icons-material/Business';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PhoneIcon from '@mui/icons-material/Phone';
import SaveIcon from '@mui/icons-material/Save';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../context/AuthContext';
import { authApi, freightPaymentsApi, profileDocumentsApi } from '../../services/api';
import { useTheme } from '@mui/material/styles';

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
function OverviewTab({ snackbar, setSnackbar }) {
  const { user, updateUser } = useAuth();
  const fileRef = useRef();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [payoutStatus,    setPayoutStatus]    = useState(null);
  const [payoutLoading,   setPayoutLoading]   = useState(false);
  const [payoutConnecting,setPayoutConnecting]= useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('payout');
    if (p === 'success') setSnackbar({ open: true, msg: 'Payout account connected!', severity: 'success' });
    else if (p === 'refresh') setSnackbar({ open: true, msg: 'Please complete payout setup.', severity: 'warning' });
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.role === 'carrier') {
      setPayoutLoading(true);
      freightPaymentsApi.onboardStatus()
        .then(d => setPayoutStatus(d))
        .catch(() => setPayoutStatus(null))
        .finally(() => setPayoutLoading(false));
    }
  }, [user?.role]);

  const handleConnectPayout = async () => {
    setPayoutConnecting(true);
    try {
      const data = await freightPaymentsApi.onboard();
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      setSnackbar({ open: true, msg: err.message || 'Failed to start payout setup.', severity: 'error' });
      setPayoutConnecting(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const dataUrl = await resizeToDataUrl(file, 256);
      await authApi.update({ avatar_url: dataUrl });
      updateUser({ avatar_url: dataUrl });
    } catch { alert('Failed to upload photo.'); }
    finally { setAvatarUploading(false); e.target.value = ''; }
  };

  const [profile, setProfile] = useState({
    name: user?.name || '', email: user?.email || '',
    phone: user?.phone || '', company: user?.company || '',
    mc: user?.mc || '', dot: user?.dot || '',
  });
  const [passwords, setPasswords] = useState({ next: '', confirm: '' });
  const [status,  setStatus]  = useState(null);
  const [saving,  setSaving]  = useState(false);

  async function saveProfile(e) {
    e.preventDefault(); setSaving(true); setStatus(null);
    try {
      const updated = await authApi.update({
        name: profile.name || undefined, phone: profile.phone || undefined,
        company: profile.company || undefined, mc_number: profile.mc || undefined,
        dot_number: profile.dot || undefined,
      });
      updateUser({ name: updated.name, phone: updated.phone || null, company: updated.company || updated.name,
        mc: updated.mc_number || null, dot: updated.dot_number || null,
        avatar: updated.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) });
      setStatus({ type: 'success', msg: 'Profile updated.' });
    } catch (err) { setStatus({ type: 'error', msg: err.message || 'Failed to save.' }); }
    finally { setSaving(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) { setStatus({ type: 'error', msg: 'Passwords do not match.' }); return; }
    if (passwords.next.length < 8) { setStatus({ type: 'error', msg: 'Min 8 characters.' }); return; }
    setSaving(true); setStatus(null);
    try {
      await authApi.update({ password: passwords.next });
      setPasswords({ next: '', confirm: '' });
      setStatus({ type: 'success', msg: 'Password changed.' });
    } catch (err) { setStatus({ type: 'error', msg: err.message || 'Failed.' }); }
    finally { setSaving(false); }
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {status && <Alert severity={status.type === 'success' ? 'success' : 'error'} onClose={() => setStatus(null)}>{status.msg}</Alert>}

      {/* Avatar */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <PersonIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Profile Photo</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar src={user?.avatar_url || undefined} sx={{ width: 80, height: 80, bgcolor: 'primary.dark', fontSize: 28, fontWeight: 700 }}>
                {!user?.avatar_url && user?.avatar}
              </Avatar>
              <Box onClick={() => !avatarUploading && fileRef.current.click()} sx={{ position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, '&:hover': { opacity: 1 }, cursor: 'pointer', transition: 'opacity 0.2s' }}>
                {avatarUploading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <CameraAltIcon sx={{ color: '#fff', fontSize: 22 }} />}
              </Box>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600}>{user?.avatar_url ? 'Change photo' : 'Upload a photo'}</Typography>
              <Typography variant="caption" color="text.secondary">JPG, PNG or GIF, cropped to square.</Typography>
              <Box sx={{ mt: 1 }}>
                <Button size="small" variant="outlined" onClick={() => fileRef.current.click()} disabled={avatarUploading}>
                  {avatarUploading ? 'Uploading…' : 'Choose File'}
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <PersonIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Profile Information</Typography>
          </Box>
          <Box component="form" onSubmit={saveProfile}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Full Name" size="small" fullWidth value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email" size="small" fullWidth value={profile.email} disabled />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Phone Number" size="small" fullWidth type="tel" placeholder="+1 (555) 000-0000" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} InputProps={{ startAdornment: <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.disabled' }} /> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Company Name" size="small" fullWidth value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} InputProps={{ startAdornment: <BusinessIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.disabled' }} /> }} />
              </Grid>
              {user?.role === 'carrier' && (<>
                <Grid item xs={12} sm={6}>
                  <TextField label="MC Number" size="small" fullWidth placeholder="MC-000000" value={profile.mc} onChange={e => setProfile(p => ({ ...p, mc: e.target.value }))} InputProps={{ startAdornment: <LocalShippingIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.disabled' }} /> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="DOT Number" size="small" fullWidth placeholder="DOT-000000" value={profile.dot} onChange={e => setProfile(p => ({ ...p, dot: e.target.value }))} />
                </Grid>
              </>)}
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
              <Button type="submit" variant="contained" disabled={saving} startIcon={<SaveIcon />}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Password */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <LockIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Change Password</Typography>
          </Box>
          <Box component="form" onSubmit={changePassword}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="New Password" size="small" fullWidth type="password" placeholder="Min. 8 characters" value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Confirm New Password" size="small" fullWidth type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
              <Button type="submit" variant="contained" disabled={saving || !passwords.next} startIcon={<LockIcon />}>
                {saving ? 'Saving…' : 'Change Password'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Payout (carrier only) */}
      {user?.role === 'carrier' && (
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccountBalanceIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>Payout Account</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Connect a bank account via Stripe to receive load payments. HaulIQ retains 1.5%.
            </Typography>
            {payoutLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">Checking…</Typography>
              </Box>
            ) : payoutStatus?.connected && payoutStatus?.payouts_enabled ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600} color="success.main">Payout account connected</Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={handleConnectPayout} disabled={payoutConnecting} startIcon={payoutConnecting ? <CircularProgress size={14} color="inherit" /> : <AccountBalanceIcon />}>
                  {payoutConnecting ? 'Opening…' : 'Manage Account'}
                </Button>
              </Box>
            ) : payoutStatus?.connected ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600} color="warning.main">Setup incomplete</Typography>
                </Box>
                <Button variant="contained" color="warning" size="small" onClick={handleConnectPayout} disabled={payoutConnecting}>
                  {payoutConnecting ? 'Opening…' : 'Finish Setup'}
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>No payout account connected yet.</Typography>
                <Button variant="contained" size="small" onClick={handleConnectPayout} disabled={payoutConnecting} startIcon={<AccountBalanceIcon />}>
                  {payoutConnecting ? 'Opening Stripe…' : 'Connect Bank Account'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Account info */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Account Info</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[
              { label: 'Role',         value: user?.role },
              { label: 'Plan',         value: user?.plan },
              ...(user?.joined ? [{ label: 'Member since', value: user.joined }] : []),
            ].map(({ label, value }, i, arr) => (
              <Box key={label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{value}</Typography>
                </Box>
                {i < arr.length - 1 && <Divider sx={{ mt: 1.5 }} />}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
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
            <AccessTimeIcon color="primary" />
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
                  <LocationOnIcon sx={{ fontSize: 14 }} /> Location
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
          <AccessTimeIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
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
            <UploadFileIcon color="primary" />
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
              startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
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
            <InsertDriveFileIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No documents uploaded yet.</Typography>
          </Box>
        ) : (
          <Box>
            {docs.map((doc, i) => (
              <Box key={doc.id}>
                {i > 0 && <Divider />}
                <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1.75, gap: 2, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' } }}>
                  <InsertDriveFileIcon sx={{ fontSize: 32, color: 'primary.main', flexShrink: 0 }} />
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
                      <DeleteOutlineIcon fontSize="small" />
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
            <BusinessIcon color="primary" />
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
          <BusinessIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
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
            <BeachAccessIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Time Off</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manage your availability and schedule time away. When you mark time off, your truck posts will automatically be hidden from the broker Truck Board.
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <BeachAccessIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
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
    <Box sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: 1 }}>
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
