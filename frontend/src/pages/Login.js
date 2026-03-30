import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField,
  InputAdornment, IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAuth, ROLES } from '../context/AuthContext';
import AuthHeader from '../components/AuthHeader';

const BRAND     = '#1565C0';
const BRAND_MED = '#1976d2';
const BRAND_LIGHT = '#42a5f5';

const LABELS = {
  en: { title: 'Welcome back', sub: 'Sign in to your Urload account', email: 'Email', password: 'Password', signin: 'Sign In', signingIn: 'Signing in…', forgot: 'Forgot password?', noAccount: 'No account?', signupFree: 'Sign up free' },
  es: { title: 'Bienvenido',   sub: 'Inicia sesión en tu cuenta Urload',  email: 'Correo',   password: 'Contraseña',  signin: 'Iniciar sesión', signingIn: 'Iniciando…',    forgot: '¿Olvidaste tu contraseña?', noAccount: '¿Sin cuenta?', signupFree: 'Regístrate gratis' },
  fr: { title: 'Bon retour',   sub: 'Connectez-vous à votre compte Urload', email: 'E-mail', password: 'Mot de passe', signin: 'Se connecter',  signingIn: 'Connexion…',     forgot: 'Mot de passe oublié ?',    noAccount: 'Pas de compte ?', signupFree: 'Inscription gratuite' },
};

function WaveBg() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, bgcolor: BRAND_MED, overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', top: -180, right: -120, background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', bottom: -140, left: -100, background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 220 }}>
          <path fill="rgba(0,0,0,0.18)" d="M0,128L60,117.3C120,107,240,85,360,90.7C480,96,600,128,720,138.7C840,149,960,139,1080,122.7C1200,107,1320,85,1380,74.7L1440,64L1440,220L1380,220C1320,220,1200,220,1080,220C960,220,840,220,720,220C600,220,480,220,360,220C240,220,120,220,60,220L0,220Z"/>
        </svg>
      </Box>
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 160 }}>
          <path fill="rgba(0,0,0,0.12)" d="M0,96L80,85.3C160,75,320,53,480,64C640,75,800,117,960,122.7C1120,128,1280,96,1360,80L1440,64L1440,160L1360,160C1280,160,1120,160,960,160C800,160,640,160,480,160C320,160,160,160,80,160L0,160Z"/>
        </svg>
      </Box>
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 100 }}>
          <path fill="rgba(0,0,0,0.10)" d="M0,64L120,53.3C240,43,480,21,720,32C960,43,1200,85,1320,106.7L1440,128L1440,100L1320,100C1200,100,960,100,720,100C480,100,240,100,120,100L0,100Z"/>
        </svg>
      </Box>
    </Box>
  );
}

export default function Login() {
  const [params] = useSearchParams();
  const defaultRole = params.get('role') || '';
  const [role] = useState(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem('urload_lang') || 'en');
  const [mode, setMode] = useState(() => localStorage.getItem('urload_form_theme') || 'dark');
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setError && setError(null); }, []);

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('urload_form_theme', next);
  };

  const handleLang = (val) => {
    setLang(val);
    localStorage.setItem('urload_lang', val);
  };

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

  const isDark   = mode === 'dark';
  const cardBg   = isDark ? '#111318' : '#ffffff';
  const textPri  = isDark ? '#fff' : '#111318';
  const textSec  = isDark ? '#8a8f9c' : '#6b7280';
  const borderC  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)';
  const t = LABELS[lang];

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      color: textPri,
      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
      borderRadius: '6px',
      '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.16)' },
      '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.3)' },
      '&.Mui-focused fieldset': { borderColor: BRAND_LIGHT },
    },
    '& .MuiInputLabel-root': { color: textSec },
    '& .MuiInputLabel-root.Mui-focused': { color: BRAND_LIGHT },
    '& .MuiInputLabel-shrink': { bgcolor: cardBg, px: 0.5, borderRadius: '2px' },
  };

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <WaveBg />

      <Box sx={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Banner */}
        <Box sx={{ bgcolor: 'rgba(0,0,0,0.22)', py: 0.6, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.7rem' }}>
            Free to Start &nbsp;&bull;&nbsp; No Payment Method Required &nbsp;&bull;&nbsp; Cancel Anytime
          </Typography>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: { xs: 3, sm: 5 } }}>
          <Box sx={{ width: '100%', maxWidth: 500 }}>

            <AuthHeader lang={lang} setLang={handleLang} mode={mode} toggleMode={toggleMode} />

            {/* Main card */}
            <Box sx={{
              bgcolor: cardBg,
              borderRadius: '12px',
              border: `1px solid ${borderC}`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              transition: 'background 0.2s',
            }}>
              <Box sx={{ px: { xs: 3, sm: 4 }, pt: 4, pb: 3 }}>
                <Typography variant="h5" fontWeight={800} sx={{ color: textPri, mb: 0.5, lineHeight: 1.2 }}>
                  {t.title}
                </Typography>
                <Typography variant="body2" sx={{ color: textSec, lineHeight: 1.65 }}>
                  {t.sub}
                </Typography>
              </Box>

              {error && (
                <Box sx={{ mx: { xs: 3, sm: 4 }, mb: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '6px', px: 2, py: 1.25 }}>
                  <ErrorOutlineIcon sx={{ fontSize: 15, color: '#f87171', flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ color: '#f87171', fontSize: '0.82rem' }}>{error}</Typography>
                </Box>
              )}

              <form onSubmit={handleSubmit}>
                <Box sx={{ px: { xs: 3, sm: 4 }, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label={t.email}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    fullWidth size="small" required
                    sx={fieldSx}
                  />
                  <TextField
                    label={t.password}
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    fullWidth size="small" required
                    sx={fieldSx}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPw(v => !v)} edge="end" size="small" sx={{ color: textSec }}>
                            {showPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth variant="contained"
                    disabled={loading || !email || !password}
                    endIcon={!loading && <ChevronRightIcon />}
                    sx={{
                      bgcolor: BRAND_MED, '&:hover': { bgcolor: BRAND },
                      textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em',
                      py: 1.25, borderRadius: '6px', boxShadow: 'none', fontSize: '0.85rem',
                    }}
                  >
                    {loading ? t.signingIn : t.signin}
                  </Button>
                </Box>
              </form>

              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: { xs: 3, sm: 4 }, py: 2,
                borderTop: `1px solid ${borderC}`,
              }}>
                <Button
                  component={Link} to="/login"
                  sx={{ color: textSec, textTransform: 'none', fontWeight: 500, fontSize: '0.8rem', '&:hover': { color: textPri, bgcolor: 'transparent' } }}
                >
                  {t.forgot}
                </Button>
                <Typography variant="body2" sx={{ color: textSec, fontSize: '0.8rem' }}>
                  {t.noAccount}{' '}
                  <Typography component={Link} to="/signup" variant="body2" sx={{
                    color: BRAND_LIGHT, fontWeight: 700, textDecoration: 'none', fontSize: '0.8rem',
                    '&:hover': { textDecoration: 'underline' },
                  }}>
                    {t.signupFree}
                  </Typography>
                </Typography>
              </Box>
            </Box>

          </Box>
        </Box>
      </Box>
    </Box>
  );
}
