import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Paper,
  InputAdornment, IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth, ROLES } from '../context/AuthContext';

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

const ROLE_OPTIONS = [
  { r: 'carrier', label: 'Driver', icon: <LocalShippingIcon sx={{ fontSize: 18 }} /> },
  { r: 'broker',  label: 'Broker', icon: <BusinessCenterIcon sx={{ fontSize: 18 }} /> },
  { r: 'admin',   label: 'Admin',  icon: <AdminPanelSettingsIcon sx={{ fontSize: 18 }} /> },
];

const DEMO_ACCOUNTS = [
  { role: 'carrier', email: 'carrier@demo.com', pw: 'demo1234', label: 'Carrier Demo' },
  { role: 'broker',  email: 'broker@demo.com',  pw: 'demo1234', label: 'Broker Demo' },
  { role: 'admin',   email: 'admin@urload.app', pw: 'admin1234', label: 'Admin Demo' },
];

export default function Login() {
  const [params] = useSearchParams();
  const defaultRole = params.get('role') || '';
  const [role, setRole] = useState(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setError && setError(null); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(email, password, role || undefined);
    if (ok) {
      const resolvedRole = role || (email === 'admin@urload.app' ? 'admin' : 'carrier');
      if (resolvedRole === ROLES.ADMIN) navigate('/admin');
      else if (resolvedRole === ROLES.BROKER) navigate('/broker/dashboard');
      else navigate('/carrier/dashboard');
    }
  };

  const fieldSx = {
    color: '#fff',
    bgcolor: 'rgba(255,255,255,0.05)',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
    '&.Mui-focused fieldset': { borderColor: BRAND_LIGHT },
  };

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <WaveBackground />
      <Box sx={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Nav */}
        <Box sx={{ px: 4, py: 2 }}>
          <Box component="img" src="/urload-logo.png" alt="Urload" sx={{ height: 32, filter: 'brightness(0) invert(1)' }} />
        </Box>

        {/* Banner */}
        <Box sx={{ bgcolor: 'rgba(0,0,0,0.25)', py: 0.75, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: BRAND_LIGHT, fontWeight: 600, letterSpacing: '0.04em' }}>
            Free to Start &bull; No Payment Method Required &bull; Cancel Anytime
          </Typography>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 4 }}>
          <Box sx={{ width: '100%', maxWidth: 480 }}>
            <Paper elevation={0} sx={{
              bgcolor: '#1a1a2e', borderRadius: 2,
              overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Box sx={{ p: 3.5 }}>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', mb: 0.5 }}>Welcome back</Typography>
                <Typography variant="body2" sx={{ color: '#9e9e9e', mb: 3 }}>Sign in to your Urload account</Typography>

                {/* Role selector */}
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  {ROLE_OPTIONS.map(({ r, label, icon }) => (
                    <Box
                      key={r}
                      onClick={() => setRole(r)}
                      sx={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                        py: 1.25, borderRadius: 1.5, border: '1px solid', cursor: 'pointer',
                        borderColor: role === r ? BRAND_LIGHT : 'rgba(255,255,255,0.1)',
                        bgcolor: role === r ? 'rgba(66,165,245,0.1)' : 'transparent',
                        color: role === r ? BRAND_LIGHT : '#9e9e9e',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: BRAND_LIGHT, color: BRAND_LIGHT },
                      }}
                    >
                      {icon}
                      <Typography variant="caption" fontWeight={600}>{label}</Typography>
                    </Box>
                  ))}
                </Box>

                {error && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', borderRadius: 1, px: 2, py: 1.25, mb: 2 }}>
                    <ErrorOutlineIcon sx={{ fontSize: 16, color: '#f44336', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: '#f44336' }}>{error}</Typography>
                  </Box>
                )}

                <form onSubmit={handleSubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      fullWidth size="small" required
                      InputLabelProps={{ sx: { color: '#9e9e9e' } }}
                      InputProps={{ sx: fieldSx }}
                    />
                    <TextField
                      label="Password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      fullWidth size="small" required
                      InputLabelProps={{ sx: { color: '#9e9e9e' } }}
                      InputProps={{
                        sx: fieldSx,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPw(v => !v)} edge="end" size="small" sx={{ color: '#9e9e9e' }}>
                              {showPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading || !email || !password}
                      endIcon={!loading && <ChevronRightIcon />}
                      sx={{ bgcolor: BRAND_MED, '&:hover': { bgcolor: BRAND }, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', py: 1.25 }}
                    >
                      {loading ? 'Signing in…' : 'Sign In'}
                    </Button>
                  </Box>
                </form>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2.5, pt: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <Button component={Link} to="/login" sx={{ color: BRAND_LIGHT, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                    Forgot password?
                  </Button>
                  <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
                    No account?{' '}
                    <Typography component={Link} to="/signup" variant="body2" sx={{ color: BRAND_LIGHT, fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      Sign up free
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Demo accounts */}
            <Paper elevation={0} sx={{ mt: 2, bgcolor: 'rgba(26,26,46,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, p: 2 }}>
              <Typography variant="caption" sx={{ color: '#616161', display: 'block', textAlign: 'center', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Quick Demo Access
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {DEMO_ACCOUNTS.map(acc => (
                  <Box
                    key={acc.role}
                    onClick={() => { setRole(acc.role); setEmail(acc.email); setPassword(acc.pw); }}
                    sx={{
                      flex: 1, textAlign: 'center', py: 1, borderRadius: 1.5, cursor: 'pointer',
                      bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' },
                      transition: 'all 0.15s',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#bdbdbd', fontWeight: 500 }}>{acc.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
