import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert,
  Grid, Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import BusinessIcon from '@mui/icons-material/Business';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PhoneIcon from '@mui/icons-material/Phone';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();

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
      <Typography variant="h5" fontWeight={700}>Account Settings</Typography>

      {status && (
        <Alert severity={status.type === 'success' ? 'success' : 'error'} onClose={() => setStatus(null)}>
          {status.msg}
        </Alert>
      )}

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
    </Box>
  );
}
