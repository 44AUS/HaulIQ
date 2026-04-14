import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert,
  Grid, Divider, Avatar, CircularProgress, Snackbar,
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
import { useAuth } from '../../context/AuthContext';
import { authApi, freightPaymentsApi } from '../../services/api';

function resizeToDataUrl(file, size = 256) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      // Crop to square from center
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

export default function ManageProfile() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef();
  const location = useLocation();
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Payout account state (carrier only)
  const [payoutStatus, setPayoutStatus] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutConnecting, setPayoutConnecting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'success' });

  // Check for payout redirect param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payoutParam = params.get('payout');
    if (payoutParam === 'success') {
      setSnackbar({ open: true, msg: 'Payout account connected successfully!', severity: 'success' });
    } else if (payoutParam === 'refresh') {
      setSnackbar({ open: true, msg: 'Please complete your payout account setup.', severity: 'warning' });
    }
  }, [location.search]);

  // Load payout status for carriers
  useEffect(() => {
    if (user?.role === 'carrier') {
      setPayoutLoading(true);
      freightPaymentsApi.onboardStatus()
        .then(data => setPayoutStatus(data))
        .catch(() => setPayoutStatus(null))
        .finally(() => setPayoutLoading(false));
    }
  }, [user?.role]);

  const handleConnectPayout = async () => {
    setPayoutConnecting(true);
    try {
      const data = await freightPaymentsApi.onboard();
      if (data?.url) {
        window.location.href = data.url;
      }
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
    } catch (err) {
      alert('Failed to upload photo.');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const [profile, setProfile] = useState({
    name:    user?.name    || '',
    email:   user?.email   || '',
    phone:   user?.phone   || '',
    company: user?.company || '',
    mc:      user?.mc      || '',
    dot:     user?.dot     || '',
  });

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const updated = await authApi.update({
        name:       profile.name    || undefined,
        phone:      profile.phone   || undefined,
        company:    profile.company || undefined,
        mc_number:  profile.mc     || undefined,
        dot_number: profile.dot    || undefined,
      });
      updateUser({
        name:    updated.name,
        phone:   updated.phone   || null,
        company: updated.company || updated.name,
        mc:      updated.mc_number  || null,
        dot:     updated.dot_number || null,
        avatar:  updated.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      });
      setStatus({ type: 'success', msg: 'Profile updated successfully.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setStatus({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }
    if (passwords.next.length < 8) {
      setStatus({ type: 'error', msg: 'Password must be at least 8 characters.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await authApi.update({ password: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' });
      setStatus({ type: 'success', msg: 'Password changed successfully.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" fontWeight={700}>Manage Profile</Typography>

      {status && (
        <Alert severity={status.type === 'success' ? 'success' : 'error'} onClose={() => setStatus(null)}>
          {status.msg}
        </Alert>
      )}

      {/* Avatar upload */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <PersonIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Profile Photo</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                src={user?.avatar_url || undefined}
                sx={{ width: 80, height: 80, bgcolor: 'primary.dark', fontSize: 28, fontWeight: 700 }}
              >
                {!user?.avatar_url && user?.avatar}
              </Avatar>
              <Box
                onClick={() => !avatarUploading && fileRef.current.click()}
                sx={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', opacity: 0,
                  '&:hover': { opacity: 1 }, cursor: 'pointer', transition: 'opacity 0.2s',
                }}
              >
                {avatarUploading
                  ? <CircularProgress size={20} sx={{ color: '#fff' }} />
                  : <CameraAltIcon sx={{ color: '#fff', fontSize: 22 }} />
                }
              </Box>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {user?.avatar_url ? 'Change photo' : 'Upload a photo'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hover over the circle and click to upload. JPG, PNG or GIF, max ~5 MB. Will be cropped to a square.
              </Typography>
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
                <TextField
                  label="Full Name"
                  size="small"
                  fullWidth
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  size="small"
                  fullWidth
                  value={profile.email}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Phone Number"
                  size="small"
                  fullWidth
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  InputProps={{ startAdornment: <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.disabled' }} /> }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Company Name"
                  size="small"
                  fullWidth
                  value={profile.company}
                  onChange={e => setProfile(p => ({ ...p, company: e.target.value }))}
                  InputProps={{ startAdornment: <BusinessIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.disabled' }} /> }}
                />
              </Grid>
              {user?.role === 'carrier' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="MC Number"
                      size="small"
                      fullWidth
                      placeholder="MC-000000"
                      value={profile.mc}
                      onChange={e => setProfile(p => ({ ...p, mc: e.target.value }))}
                      InputProps={{ startAdornment: <LocalShippingIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.disabled' }} /> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="DOT Number"
                      size="small"
                      fullWidth
                      placeholder="DOT-000000"
                      value={profile.dot}
                      onChange={e => setProfile(p => ({ ...p, dot: e.target.value }))}
                    />
                  </Grid>
                </>
              )}
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={<SaveIcon />}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Password form */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <LockIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Change Password</Typography>
          </Box>
          <Box component="form" onSubmit={changePassword}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="New Password"
                  size="small"
                  fullWidth
                  type="password"
                  placeholder="Min. 8 characters"
                  value={passwords.next}
                  onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Confirm New Password"
                  size="small"
                  fullWidth
                  type="password"
                  value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={saving || !passwords.next}
                startIcon={<LockIcon />}
              >
                {saving ? 'Saving…' : 'Change Password'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Payout Account (carrier only) */}
      {user?.role === 'carrier' && (
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccountBalanceIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>Payout Account</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Connect a bank account via Stripe to receive load payments from brokers. HaulIQ retains a 1.5% platform fee — you receive the remainder when a broker releases payment after delivery.
            </Typography>

            {payoutLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">Checking account status…</Typography>
              </Box>
            ) : payoutStatus?.connected && payoutStatus?.payouts_enabled ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    Payout account connected
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Your Stripe Express account is active. Payments will be sent automatically when brokers release funds.
                  To update banking details, visit your Stripe Express dashboard.
                </Typography>
                <Box sx={{ mt: 1.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleConnectPayout}
                    disabled={payoutConnecting}
                    startIcon={payoutConnecting ? <CircularProgress size={14} color="inherit" /> : <AccountBalanceIcon />}
                  >
                    {payoutConnecting ? 'Opening…' : 'Manage Account'}
                  </Button>
                </Box>
              </Box>
            ) : payoutStatus?.connected && !payoutStatus?.payouts_enabled ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600} color="warning.main">
                    Account setup incomplete
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Your payout account has been created but you need to finish the setup to receive payments.
                </Typography>
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  onClick={handleConnectPayout}
                  disabled={payoutConnecting}
                  startIcon={payoutConnecting ? <CircularProgress size={14} color="inherit" /> : <WarningAmberIcon />}
                >
                  {payoutConnecting ? 'Opening…' : 'Finish Setup'}
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  You have not connected a payout account yet. Without one, brokers cannot pay you through HaulIQ.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleConnectPayout}
                  disabled={payoutConnecting}
                  startIcon={payoutConnecting ? <CircularProgress size={14} color="inherit" /> : <AccountBalanceIcon />}
                >
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
              { label: 'Role', value: user?.role },
              { label: 'Plan', value: user?.plan },
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

      {/* Snackbar for payout redirect feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
