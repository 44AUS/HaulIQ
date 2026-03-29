import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Paper, Checkbox, CircularProgress,
  InputAdornment, IconButton,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const BRAND = '#1565C0';
const BRAND_MED = '#1976d2';
const BRAND_LIGHT = '#42a5f5';

function WaveBackground() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', bgcolor: BRAND_MED }}>
      <Box sx={{
        position: 'absolute', width: '160%', height: '55%', bottom: '-5%', left: '-30%',
        bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '50% 50% 0 0 / 80% 80% 0 0',
        transform: 'rotate(-4deg)',
      }} />
      <Box sx={{
        position: 'absolute', width: '130%', height: '45%', bottom: '8%', left: '-15%',
        bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '50% 50% 0 0 / 70% 70% 0 0',
        transform: 'rotate(-2deg)',
      }} />
      <Box sx={{
        position: 'absolute', width: '110%', height: '35%', bottom: '18%', right: '-10%',
        bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '50% 50% 0 0 / 60% 60% 0 0',
        transform: 'rotate(3deg)',
      }} />
      <Box sx={{
        position: 'absolute', width: '90%', height: '28%', top: '-5%', left: '-5%',
        bgcolor: 'rgba(0,0,0,0.08)', borderRadius: '0 0 50% 50% / 0 0 70% 70%',
        transform: 'rotate(2deg)',
      }} />
    </Box>
  );
}

const ROLES_OPTIONS = [
  {
    r: 'carrier',
    icon: <LocalShippingIcon sx={{ fontSize: 28, color: '#888' }} />,
    title: 'Driver / Carrier',
    desc: 'Find profitable loads, track earnings, and grow your trucking business.',
  },
  {
    r: 'broker',
    icon: <BusinessCenterIcon sx={{ fontSize: 28, color: '#888' }} />,
    title: 'Freight Broker',
    desc: 'Post loads, reach serious carriers, and manage your freight operations.',
  },
];

export default function Signup() {
  const [params] = useSearchParams();
  const initRole = params.get('role') || '';
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(initRole);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', company: '', mc: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mcState, setMcState] = useState(null);
  const mcTimerRef = useRef(null);
  const { signup, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setError && setError(null); }, [step]); // eslint-disable-line

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleMcChange = (val) => {
    set('mc', val);
    setMcState(null);
    clearTimeout(mcTimerRef.current);
    const stripped = val.replace(/[^0-9]/g, '');
    if (stripped.length < 4) return;
    setMcState('checking');
    mcTimerRef.current = setTimeout(async () => {
      try {
        const res = await authApi.verifyMc(val);
        setMcState({ valid: true, legal_name: res.legal_name });
      } catch (err) {
        setMcState({ valid: false, error: err.message });
      }
    }, 700);
  };

  const mcBlocking = form.mc && mcState && mcState !== 'checking' && !mcState?.valid;
  const step2Valid = form.company && form.phone;
  const step3Valid = form.name && form.email && form.password && form.password === form.confirmPassword;

  const handleSignup = async () => {
    if (form.password !== form.confirmPassword) return;
    const result = await signup({ ...form, role, plan: 'basic' });
    if (result) setStep(3);
  };

  const navBar = (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 4, py: 2, position: 'relative', zIndex: 10 }}>
      <Box component="img" src="/urload-logo.png" alt="Urload" sx={{ height: 32, filter: 'brightness(0) invert(1)' }} />
    </Box>
  );

  const banner = (
    <Box sx={{ bgcolor: 'rgba(0,0,0,0.25)', py: 0.75, textAlign: 'center', position: 'relative', zIndex: 10 }}>
      <Typography variant="caption" sx={{ color: BRAND_LIGHT, fontWeight: 600, letterSpacing: '0.04em' }}>
        Free to Start &bull; No Payment Method Required &bull; Cancel Anytime
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <WaveBackground />
      <Box sx={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {navBar}
        {banner}

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 4 }}>
          <Paper elevation={0} sx={{
            width: '100%', maxWidth: 520,
            bgcolor: '#1a1a2e', borderRadius: 2,
            overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {/* Step content */}
            {step === 0 && (
              <Box sx={{ p: 3.5 }}>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', mb: 0.5 }}>
                  Step 1 of 3 — Select Your Role
                </Typography>
                <Typography variant="body2" sx={{ color: '#9e9e9e', mb: 3, lineHeight: 1.6 }}>
                  Select the role that best describes you. This will configure features designed for your account.
                </Typography>

                {ROLES_OPTIONS.map(opt => (
                  <Box
                    key={opt.r}
                    onClick={() => setRole(opt.r)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 2, p: 2, mb: 1.5,
                      borderRadius: 1.5, border: '1px solid',
                      borderColor: role === opt.r ? BRAND_LIGHT : 'rgba(255,255,255,0.1)',
                      bgcolor: role === opt.r ? 'rgba(66,165,245,0.08)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.15s',
                      '&:hover': { borderColor: BRAND_LIGHT, bgcolor: 'rgba(66,165,245,0.05)' },
                    }}
                  >
                    <Checkbox
                      checked={role === opt.r}
                      onChange={() => setRole(opt.r)}
                      onClick={e => e.stopPropagation()}
                      sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: BRAND_LIGHT }, p: 0 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" fontWeight={700} sx={{ color: '#fff' }}>{opt.title}</Typography>
                      <Typography variant="body2" sx={{ color: '#9e9e9e', mt: 0.25, lineHeight: 1.5 }}>{opt.desc}</Typography>
                    </Box>
                    {opt.icon}
                  </Box>
                ))}

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <Button component={Link} to="/login" startIcon={<ChevronLeftIcon />}
                    sx={{ color: BRAND_LIGHT, textTransform: 'none', fontWeight: 600 }}>
                    Login
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<ChevronRightIcon />}
                    disabled={!role}
                    onClick={() => setStep(1)}
                    sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_MED }, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', px: 3 }}
                  >
                    Step 2
                  </Button>
                </Box>
              </Box>
            )}

            {step === 1 && (
              <Box sx={{ p: 3.5 }}>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', mb: 0.5 }}>
                  Step 2 of 3 — Business Info
                </Typography>
                <Typography variant="body2" sx={{ color: '#9e9e9e', mb: 3, lineHeight: 1.6 }}>
                  Add your business information below. This is used to configure your account and profile.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label={role === 'broker' ? 'Brokerage Name *' : 'Company / DBA Name *'}
                    value={form.company}
                    onChange={e => set('company', e.target.value)}
                    fullWidth size="small"
                    InputLabelProps={{ sx: { color: '#9e9e9e' } }}
                    InputProps={{ sx: { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } } }}
                  />
                  {role === 'carrier' && (
                    <TextField
                      label="MC Number (optional)"
                      value={form.mc}
                      onChange={e => handleMcChange(e.target.value)}
                      fullWidth size="small"
                      error={!!mcState?.error}
                      helperText={
                        mcState === 'checking' ? 'Verifying…' :
                        mcState?.valid ? `✓ ${mcState.legal_name}` :
                        mcState?.error || ''
                      }
                      FormHelperTextProps={{ sx: { color: mcState?.valid ? '#66bb6a' : mcState?.error ? '#f44336' : '#9e9e9e' } }}
                      InputLabelProps={{ sx: { color: '#9e9e9e' } }}
                      InputProps={{
                        sx: { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { borderColor: mcState?.valid ? '#66bb6a' : mcState?.error ? '#f44336' : 'rgba(255,255,255,0.15)' } },
                        endAdornment: mcState === 'checking' ? <InputAdornment position="end"><CircularProgress size={14} sx={{ color: '#9e9e9e' }} /></InputAdornment>
                          : mcState?.valid ? <InputAdornment position="end"><CheckIcon sx={{ fontSize: 16, color: '#66bb6a' }} /></InputAdornment>
                          : mcState?.error ? <InputAdornment position="end"><ErrorOutlineIcon sx={{ fontSize: 16, color: '#f44336' }} /></InputAdornment>
                          : null,
                      }}
                    />
                  )}
                  <TextField
                    label="Business Phone *"
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    fullWidth size="small"
                    InputLabelProps={{ sx: { color: '#9e9e9e' } }}
                    InputProps={{ sx: { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } } }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <Button onClick={() => setStep(0)} startIcon={<ChevronLeftIcon />}
                    sx={{ color: BRAND_LIGHT, textTransform: 'none', fontWeight: 600 }}>
                    Step 1
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<ChevronRightIcon />}
                    disabled={!step2Valid || mcBlocking || mcState === 'checking'}
                    onClick={() => setStep(2)}
                    sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_MED }, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', px: 3 }}
                  >
                    Step 3
                  </Button>
                </Box>
              </Box>
            )}

            {step === 2 && (
              <Box sx={{ p: 3.5 }}>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', mb: 0.5 }}>
                  Step 3 of 3 — Your Info
                </Typography>
                <Typography variant="body2" sx={{ color: '#9e9e9e', mb: 3, lineHeight: 1.6 }}>
                  Add your information below. This is used to generate your profile and login credentials.
                </Typography>

                {error && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', borderRadius: 1, px: 2, py: 1.25, mb: 2 }}>
                    <ErrorOutlineIcon sx={{ fontSize: 16, color: '#f44336', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: '#f44336' }}>{error}</Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Full Name *"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    fullWidth size="small"
                    InputLabelProps={{ sx: { color: '#9e9e9e' } }}
                    InputProps={{ sx: { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } } }}
                  />
                  <TextField
                    label="Email (used to log in) *"
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    fullWidth size="small"
                    InputLabelProps={{ sx: { color: '#9e9e9e' } }}
                    InputProps={{ sx: { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } } }}
                  />
                  <TextField
                    label="Password *"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    fullWidth size="small"
                    InputLabelProps={{ sx: { color: '#9e9e9e' } }}
                    InputProps={{
                      sx: { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPw(v => !v)} edge="end" size="small" sx={{ color: '#9e9e9e' }}>
                            {showPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Confirm Password *"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    fullWidth size="small"
                    error={!!form.confirmPassword && form.password !== form.confirmPassword}
                    helperText={form.confirmPassword && form.password !== form.confirmPassword ? 'Passwords do not match' : ''}
                    FormHelperTextProps={{ sx: { color: '#f44336' } }}
                    InputLabelProps={{ sx: { color: '#9e9e9e' } }}
                    InputProps={{
                      sx: { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { borderColor: form.confirmPassword && form.password !== form.confirmPassword ? '#f44336' : 'rgba(255,255,255,0.15)' } },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirm(v => !v)} edge="end" size="small" sx={{ color: '#9e9e9e' }}>
                            {showConfirm ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Typography variant="caption" sx={{ color: '#616161', display: 'block', mt: 2, lineHeight: 1.6 }}>
                  By clicking "Create Account" you are agreeing to our{' '}
                  <Typography component="span" variant="caption" sx={{ color: BRAND_LIGHT, cursor: 'pointer' }}>Terms of Service</Typography>
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  disabled={!step3Valid || loading}
                  onClick={handleSignup}
                  sx={{ mt: 2, bgcolor: BRAND_MED, '&:hover': { bgcolor: BRAND }, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', py: 1.25 }}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {loading ? 'Creating…' : 'Create Account'}
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <Button onClick={() => setStep(1)} startIcon={<ChevronLeftIcon />}
                    sx={{ color: BRAND_LIGHT, textTransform: 'none', fontWeight: 600 }}>
                    Step 2
                  </Button>
                </Box>
              </Box>
            )}

            {step === 3 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'rgba(66,165,245,0.15)', border: `2px solid ${BRAND_LIGHT}`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: BRAND_LIGHT }} />
                </Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', mb: 1 }}>Welcome to Urload!</Typography>
                <Typography variant="body2" sx={{ color: '#9e9e9e', mb: 4 }}>
                  Your account is ready. Let's get started.
                </Typography>
                <Button
                  variant="contained"
                  endIcon={<ChevronRightIcon />}
                  onClick={() => navigate(role === 'broker' ? '/broker/dashboard' : '/carrier/dashboard')}
                  sx={{ bgcolor: BRAND_MED, '&:hover': { bgcolor: BRAND }, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', px: 4, py: 1.25 }}
                >
                  Go to Dashboard
                </Button>
              </Box>
            )}
          </Paper>

          {step === 0 && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', mt: 2 }}>
              Already have an account?{' '}
              <Typography component={Link} to="/login" variant="body2" sx={{ color: '#fff', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Sign in
              </Typography>
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
