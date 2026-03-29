import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, CircularProgress,
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

const BRAND      = '#1565C0';
const BRAND_MED  = '#1976d2';
const BRAND_LIGHT = '#42a5f5';

function WaveBg() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, bgcolor: BRAND_MED, overflow: 'hidden' }}>
      {/* top-right glow blob */}
      <Box sx={{
        position: 'absolute', width: 480, height: 480,
        borderRadius: '50%', top: -180, right: -120,
        background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* bottom-left glow blob */}
      <Box sx={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%', bottom: -140, left: -100,
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* SVG wave layers */}
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 220 }}>
          <path fill="rgba(0,0,0,0.18)"
            d="M0,128L60,117.3C120,107,240,85,360,90.7C480,96,600,128,720,138.7C840,149,960,139,1080,122.7C1200,107,1320,85,1380,74.7L1440,64L1440,220L1380,220C1320,220,1200,220,1080,220C960,220,840,220,720,220C600,220,480,220,360,220C240,220,120,220,60,220L0,220Z"/>
        </svg>
      </Box>
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 160 }}>
          <path fill="rgba(0,0,0,0.12)"
            d="M0,96L80,85.3C160,75,320,53,480,64C640,75,800,117,960,122.7C1120,128,1280,96,1360,80L1440,64L1440,160L1360,160C1280,160,1120,160,960,160C800,160,640,160,480,160C320,160,160,160,80,160L0,160Z"/>
        </svg>
      </Box>
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 100 }}>
          <path fill="rgba(0,0,0,0.10)"
            d="M0,64L120,53.3C240,43,480,21,720,32C960,43,1200,85,1320,106.7L1440,128L1440,100L1320,100C1200,100,960,100,720,100C480,100,240,100,120,100L0,100Z"/>
        </svg>
      </Box>
    </Box>
  );
}

const ROLES_OPTIONS = [
  {
    r: 'carrier',
    icon: <LocalShippingIcon sx={{ fontSize: 26 }} />,
    title: 'Driver / Carrier',
    desc: 'Find profitable loads, track earnings, and grow your trucking business.',
  },
  {
    r: 'broker',
    icon: <BusinessCenterIcon sx={{ fontSize: 26 }} />,
    title: 'Freight Broker',
    desc: 'Post loads, reach serious carriers, and manage your freight operations.',
  },
];

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    bgcolor: 'rgba(255,255,255,0.06)',
    borderRadius: '6px',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.14)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.28)' },
    '&.Mui-focused fieldset': { borderColor: BRAND_LIGHT },
  },
  '& .MuiInputLabel-root': { color: '#6b7280' },
  '& .MuiInputLabel-root.Mui-focused': { color: BRAND_LIGHT },
  '& .MuiInputLabel-shrink': { bgcolor: '#111318', px: 0.5, borderRadius: '2px' },
};

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

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <WaveBg />

      <Box sx={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Nav */}
        <Box sx={{ px: { xs: 2, sm: 4 }, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box component="img" src="/urload-logo.png" alt="Urload" sx={{ height: 30, filter: 'brightness(0) invert(1)' }} />
        </Box>

        {/* Banner */}
        <Box sx={{ bgcolor: 'rgba(0,0,0,0.22)', py: 0.6, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.7rem' }}>
            Free to Start &nbsp;&bull;&nbsp; No Payment Method Required &nbsp;&bull;&nbsp; Cancel Anytime
          </Typography>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: { xs: 3, sm: 5 } }}>
          <Box sx={{ width: '100%', maxWidth: 500 }}>

            {/* ── Step 0 — Select Role ─────────────────────────────────────── */}
            {step === 0 && (
              <Box sx={{
                bgcolor: '#111318', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}>
                <Box sx={{ px: { xs: 3, sm: 4 }, pt: 4, pb: 3 }}>
                  <Typography variant="overline" sx={{ color: BRAND_LIGHT, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.68rem' }}>
                    Step 1 of 3
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', mt: 0.5, mb: 0.75, lineHeight: 1.2 }}>
                    Select Your Role
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8a8f9c', lineHeight: 1.65 }}>
                    Choose the role that best describes you. This will configure features designed specifically for your account.
                  </Typography>
                </Box>

                <Box sx={{ px: { xs: 3, sm: 4 }, pb: 1 }}>
                  {ROLES_OPTIONS.map(opt => {
                    const selected = role === opt.r;
                    return (
                      <Box
                        key={opt.r}
                        onClick={() => setRole(opt.r)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 2,
                          p: '14px 16px', mb: 1.5, borderRadius: '8px', cursor: 'pointer',
                          border: '1px solid',
                          borderColor: selected ? BRAND_LIGHT : 'rgba(255,255,255,0.09)',
                          bgcolor: selected ? 'rgba(66,165,245,0.08)' : 'rgba(255,255,255,0.02)',
                          transition: 'border-color 0.15s, background 0.15s',
                          '&:hover': {
                            borderColor: selected ? BRAND_LIGHT : 'rgba(255,255,255,0.22)',
                            bgcolor: selected ? 'rgba(66,165,245,0.08)' : 'rgba(255,255,255,0.04)',
                          },
                        }}
                      >
                        {/* Custom square checkbox */}
                        <Box sx={{
                          width: 20, height: 20, borderRadius: '4px', flexShrink: 0,
                          border: '2px solid',
                          borderColor: selected ? BRAND_LIGHT : 'rgba(255,255,255,0.3)',
                          bgcolor: selected ? BRAND_LIGHT : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}>
                          {selected && <CheckIcon sx={{ fontSize: 13, color: '#fff' }} />}
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.3 }}>
                            {opt.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#8a8f9c', mt: 0.3, lineHeight: 1.5, fontSize: '0.8rem' }}>
                            {opt.desc}
                          </Typography>
                        </Box>

                        <Box sx={{ color: selected ? BRAND_LIGHT : '#555', flexShrink: 0 }}>
                          {opt.icon}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: { xs: 3, sm: 4 }, py: 2.5,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  mt: 1,
                }}>
                  <Button
                    component={Link} to="/login"
                    startIcon={<ChevronLeftIcon sx={{ fontSize: '1rem !important' }} />}
                    sx={{ color: 'rgba(255,255,255,0.55)', textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', '&:hover': { color: '#fff', bgcolor: 'transparent' } }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<ChevronRightIcon />}
                    disabled={!role}
                    onClick={() => setStep(1)}
                    sx={{
                      bgcolor: BRAND_MED, '&:hover': { bgcolor: BRAND },
                      textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em',
                      px: 3.5, py: 1, borderRadius: '6px', fontSize: '0.82rem',
                      boxShadow: 'none',
                    }}
                  >
                    Step 2
                  </Button>
                </Box>
              </Box>
            )}

            {/* ── Step 1 — Business Info ────────────────────────────────────── */}
            {step === 1 && (
              <Box sx={{
                bgcolor: '#111318', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}>
                <Box sx={{ px: { xs: 3, sm: 4 }, pt: 4, pb: 3 }}>
                  <Typography variant="overline" sx={{ color: BRAND_LIGHT, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.68rem' }}>
                    Step 2 of 3
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', mt: 0.5, mb: 0.75, lineHeight: 1.2 }}>
                    Business Info
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8a8f9c', lineHeight: 1.65 }}>
                    Add your business information below. This is used to configure your profile.
                  </Typography>
                </Box>

                <Box sx={{ px: { xs: 3, sm: 4 }, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label={role === 'broker' ? 'Brokerage Name *' : 'Company / DBA Name *'}
                    value={form.company}
                    onChange={e => set('company', e.target.value)}
                    fullWidth size="small"
                    sx={fieldSx}
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
                      FormHelperTextProps={{ sx: { color: mcState?.valid ? '#4ade80' : mcState?.error ? '#f87171' : '#6b7280' } }}
                      sx={{
                        ...fieldSx,
                        '& .MuiOutlinedInput-root fieldset': {
                          borderColor: mcState?.valid ? '#4ade80' : mcState?.error ? '#f87171' : 'rgba(255,255,255,0.14)',
                        },
                      }}
                      InputProps={{
                        endAdornment: mcState === 'checking'
                          ? <InputAdornment position="end"><CircularProgress size={14} sx={{ color: '#6b7280' }} /></InputAdornment>
                          : mcState?.valid
                            ? <InputAdornment position="end"><CheckIcon sx={{ fontSize: 16, color: '#4ade80' }} /></InputAdornment>
                            : mcState?.error
                              ? <InputAdornment position="end"><ErrorOutlineIcon sx={{ fontSize: 16, color: '#f87171' }} /></InputAdornment>
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
                    sx={fieldSx}
                  />
                </Box>

                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: { xs: 3, sm: 4 }, py: 2.5,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  mt: 1,
                }}>
                  <Button
                    onClick={() => setStep(0)}
                    startIcon={<ChevronLeftIcon sx={{ fontSize: '1rem !important' }} />}
                    sx={{ color: 'rgba(255,255,255,0.55)', textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', '&:hover': { color: '#fff', bgcolor: 'transparent' } }}
                  >
                    Step 1
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<ChevronRightIcon />}
                    disabled={!step2Valid || mcBlocking || mcState === 'checking'}
                    onClick={() => setStep(2)}
                    sx={{
                      bgcolor: BRAND_MED, '&:hover': { bgcolor: BRAND },
                      textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em',
                      px: 3.5, py: 1, borderRadius: '6px', fontSize: '0.82rem',
                      boxShadow: 'none',
                    }}
                  >
                    Step 3
                  </Button>
                </Box>
              </Box>
            )}

            {/* ── Step 2 — Your Info ────────────────────────────────────────── */}
            {step === 2 && (
              <Box sx={{
                bgcolor: '#111318', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}>
                <Box sx={{ px: { xs: 3, sm: 4 }, pt: 4, pb: 3 }}>
                  <Typography variant="overline" sx={{ color: BRAND_LIGHT, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.68rem' }}>
                    Step 3 of 3
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', mt: 0.5, mb: 0.75, lineHeight: 1.2 }}>
                    Your Info
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8a8f9c', lineHeight: 1.65 }}>
                    Create your login credentials and personal profile details.
                  </Typography>
                </Box>

                {error && (
                  <Box sx={{ mx: { xs: 3, sm: 4 }, mb: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '6px', px: 2, py: 1.25 }}>
                    <ErrorOutlineIcon sx={{ fontSize: 15, color: '#f87171', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: '#f87171', fontSize: '0.82rem' }}>{error}</Typography>
                  </Box>
                )}

                <Box sx={{ px: { xs: 3, sm: 4 }, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Full Name *"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    fullWidth size="small"
                    sx={fieldSx}
                  />
                  <TextField
                    label="Email Address *"
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    fullWidth size="small"
                    sx={fieldSx}
                  />
                  <TextField
                    label="Password *"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    fullWidth size="small"
                    sx={fieldSx}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPw(v => !v)} edge="end" size="small" sx={{ color: '#6b7280' }}>
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
                    FormHelperTextProps={{ sx: { color: '#f87171' } }}
                    sx={{
                      ...fieldSx,
                      '& .MuiOutlinedInput-root fieldset': {
                        borderColor: form.confirmPassword && form.password !== form.confirmPassword ? '#f87171' : 'rgba(255,255,255,0.14)',
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirm(v => !v)} edge="end" size="small" sx={{ color: '#6b7280' }}>
                            {showConfirm ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Typography variant="caption" sx={{ color: '#4b5563', lineHeight: 1.6, mt: -0.5 }}>
                    By clicking "Create Account" you agree to our{' '}
                    <Typography component="span" variant="caption" sx={{ color: BRAND_LIGHT, cursor: 'pointer' }}>
                      Terms of Service
                    </Typography>
                  </Typography>

                  <Button
                    fullWidth variant="contained"
                    disabled={!step3Valid || loading}
                    onClick={handleSignup}
                    startIcon={loading ? <CircularProgress size={15} color="inherit" /> : null}
                    sx={{
                      bgcolor: BRAND_MED, '&:hover': { bgcolor: BRAND },
                      textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em',
                      py: 1.25, borderRadius: '6px', boxShadow: 'none', fontSize: '0.85rem',
                    }}
                  >
                    {loading ? 'Creating Account…' : 'Create Account'}
                  </Button>
                </Box>

                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                  px: { xs: 3, sm: 4 }, py: 2,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <Button
                    onClick={() => setStep(1)}
                    startIcon={<ChevronLeftIcon sx={{ fontSize: '1rem !important' }} />}
                    sx={{ color: 'rgba(255,255,255,0.55)', textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', '&:hover': { color: '#fff', bgcolor: 'transparent' } }}
                  >
                    Step 2
                  </Button>
                </Box>
              </Box>
            )}

            {/* ── Step 3 — Success ──────────────────────────────────────────── */}
            {step === 3 && (
              <Box sx={{
                bgcolor: '#111318', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                p: { xs: 4, sm: 5 }, textAlign: 'center',
              }}>
                <Box sx={{
                  width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 3,
                  bgcolor: 'rgba(66,165,245,0.12)', border: `1.5px solid ${BRAND_LIGHT}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: BRAND_LIGHT }} />
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', mb: 1 }}>
                  Welcome to Urload!
                </Typography>
                <Typography variant="body2" sx={{ color: '#8a8f9c', mb: 4 }}>
                  Your account is ready. Let's get you started.
                </Typography>
                <Button
                  variant="contained"
                  endIcon={<ChevronRightIcon />}
                  onClick={() => navigate(role === 'broker' ? '/broker/dashboard' : '/carrier/dashboard')}
                  sx={{
                    bgcolor: BRAND_MED, '&:hover': { bgcolor: BRAND },
                    textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em',
                    px: 4, py: 1.25, borderRadius: '6px', boxShadow: 'none',
                  }}
                >
                  Go to Dashboard
                </Button>
              </Box>
            )}

            {step === 0 && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', mt: 2.5, fontSize: '0.82rem' }}>
                Already have an account?{' '}
                <Typography component={Link} to="/login" variant="body2" sx={{
                  color: 'rgba(255,255,255,0.75)', fontWeight: 700, textDecoration: 'none', fontSize: '0.82rem',
                  '&:hover': { color: '#fff' },
                }}>
                  Sign in
                </Typography>
              </Typography>
            )}

          </Box>
        </Box>
      </Box>
    </Box>
  );
}
