import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
import IonIcon from '../../components/IonIcon';

  Box, Card, CardContent, Typography, TextField, Button,
  CircularProgress, Alert, InputAdornment, IconButton,
} from '@mui/material';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function DriverInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [inviteInfo, setInviteInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setInfoError('Missing invite token.'); setLoadingInfo(false); return; }
    fetch(`${API}/api/driver-invite/${token}`)
      .then(r => r.ok ? r.json() : r.json().then(b => Promise.reject(b.detail || 'Invalid invite')))
      .then(data => setInviteInfo(data))
      .catch(e => setInfoError(typeof e === 'string' ? e : 'Invalid or expired invite link.'))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setSubmitError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setSubmitError('Passwords do not match.'); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API}/api/driver-invite/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to accept invite');
      localStorage.setItem('urload_token', data.access_token);
      setDone(true);
      setTimeout(() => navigate('/driver/dashboard'), 1500);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 2,
    }}>
      <Card sx={{ maxWidth: 440, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IonIcon name="car-sport-outline" sx={{ fontSize: 30, color: '#fff' }} />
            </Box>
          </Box>

          {loadingInfo && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!loadingInfo && infoError && (
            <Alert severity="error">{infoError}</Alert>
          )}

          {!loadingInfo && !infoError && inviteInfo && !done && (
            <>
              <Typography variant="h5" fontWeight={800} textAlign="center" gutterBottom>
                You're invited!
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
                <strong>{inviteInfo.carrier_name}</strong> has invited you to join HaulIQ as a driver.
                Set your password to activate your account.
              </Typography>

              <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, px: 2, py: 1.5, mb: 3 }}>
                <Typography variant="caption" color="text.secondary" display="block">Name</Typography>
                <Typography variant="body2" fontWeight={600}>{inviteInfo.name}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>Email</Typography>
                <Typography variant="body2" fontWeight={600}>{inviteInfo.email}</Typography>
              </Box>

              {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPw(v => !v)}>
                          {showPw ? <IonIcon name="eye-off-outline" fontSize="small" /> : <IonIcon name="eye-outline" fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Minimum 6 characters"
                />
                <TextField
                  label="Confirm Password"
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                  size="small"
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                  sx={{ mt: 1, fontWeight: 700 }}
                >
                  {submitting ? 'Activating…' : 'Activate Account'}
                </Button>
              </Box>
            </>
          )}

          {done && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <IonIcon name="checkmark-circle" sx={{ fontSize: 48, color: 'success.main', mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700}>Account activated!</Typography>
              <Typography variant="body2" color="text.secondary">Redirecting to your dashboard…</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
