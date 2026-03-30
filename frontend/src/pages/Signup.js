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
import AuthHeader from '../components/AuthHeader';
import WaveBg from '../components/WaveBg';

const BRAND      = '#1565C0';
const BRAND_MED  = '#1976d2';
const BRAND_LIGHT = '#42a5f5';

const LABELS = {
  en: { s1title: 'Select Your Role', s1sub: 'Choose the role that best describes you. This will configure features designed specifically for your account.', s2title: 'Business Info', s2sub: 'Add your business information below. This is used to configure your profile.', s3title: 'Your Info', s3sub: 'Create your login credentials and personal profile details.', carrier: 'Driver / Carrier', carrierDesc: 'Find profitable loads, track earnings, and grow your trucking business.', broker: 'Freight Broker', brokerDesc: 'Post loads, reach serious carriers, and manage your freight operations.', company: 'Company / DBA Name *', brokerage: 'Brokerage Name *', mc: 'MC Number (optional)', phone: 'Business Phone *', name: 'Full Name *', email: 'Email Address *', password: 'Password *', confirm: 'Confirm Password *', terms: 'By clicking "Create Account" you agree to our', tos: 'Terms of Service', create: 'Create Account', creating: 'Creating Account…', login: 'Login', welcome: 'Welcome to Urload!', welcomeSub: "Your account is ready. Let's get you started.", dashboard: 'Go to Dashboard', mismatch: 'Passwords do not match' },
  es: { s1title: 'Selecciona tu Rol', s1sub: 'Elige el rol que mejor te describe. Esto configurará las funciones de tu cuenta.', s2title: 'Información del Negocio', s2sub: 'Agrega tu información empresarial. Se usará para configurar tu perfil.', s3title: 'Tu Información', s3sub: 'Crea tus credenciales de inicio de sesión y los detalles de tu perfil.', carrier: 'Conductor / Transportista', carrierDesc: 'Encuentra cargas rentables, rastrea ganancias y haz crecer tu negocio.', broker: 'Agente de Carga', brokerDesc: 'Publica cargas, llega a transportistas serios y gestiona tus operaciones.', company: 'Empresa / Nombre comercial *', brokerage: 'Nombre de la agencia *', mc: 'Número MC (opcional)', phone: 'Teléfono del negocio *', name: 'Nombre completo *', email: 'Correo electrónico *', password: 'Contraseña *', confirm: 'Confirmar contraseña *', terms: 'Al hacer clic en "Crear cuenta" aceptas nuestros', tos: 'Términos de servicio', create: 'Crear Cuenta', creating: 'Creando cuenta…', login: 'Iniciar sesión', welcome: '¡Bienvenido a Urload!', welcomeSub: 'Tu cuenta está lista. ¡Comencemos!', dashboard: 'Ir al Panel', mismatch: 'Las contraseñas no coinciden' },
  fr: { s1title: 'Choisissez votre Rôle', s1sub: "Choisissez le rôle qui vous correspond le mieux. Cela configurera les fonctionnalités de votre compte.", s2title: 'Infos Professionnelles', s2sub: 'Ajoutez vos informations professionnelles pour configurer votre profil.', s3title: 'Vos Informations', s3sub: 'Créez vos identifiants de connexion et les détails de votre profil.', carrier: 'Conducteur / Transporteur', carrierDesc: 'Trouvez des chargements rentables, suivez vos revenus et développez votre activité.', broker: 'Courtier en fret', brokerDesc: 'Publiez des chargements, atteignez des transporteurs sérieux et gérez vos opérations.', company: 'Entreprise / Nom commercial *', brokerage: "Nom de l'agence *", mc: 'Numéro MC (optionnel)', phone: 'Téléphone professionnel *', name: 'Nom complet *', email: 'Adresse e-mail *', password: 'Mot de passe *', confirm: 'Confirmer le mot de passe *', terms: 'En cliquant sur "Créer un compte" vous acceptez nos', tos: "Conditions d'utilisation", create: 'Créer un compte', creating: 'Création…', login: 'Connexion', welcome: 'Bienvenue sur Urload !', welcomeSub: 'Votre compte est prêt. Commençons !', dashboard: 'Aller au tableau de bord', mismatch: 'Les mots de passe ne correspondent pas' },
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
  const [lang, setLang] = useState(() => localStorage.getItem('urload_lang') || 'en');
  const [mode, setMode] = useState(() => localStorage.getItem('urload_form_theme') || 'dark');
  const { signup, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setError && setError(null); }, [step]); // eslint-disable-line

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('urload_form_theme', next);
  };

  const handleLang = (val) => {
    setLang(val);
    localStorage.setItem('urload_lang', val);
  };

  const isDark  = mode === 'dark';
  const cardBg  = isDark ? '#111318' : '#ffffff';
  const textPri = isDark ? '#fff' : '#111318';
  const textSec = isDark ? '#8a8f9c' : '#6b7280';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)';
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

  const cardSx = {
    bgcolor: cardBg, borderRadius: '12px',
    border: `1px solid ${borderC}`,
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
    overflow: 'hidden', transition: 'background 0.2s',
  };

  const navBtnSx = { color: textSec, textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', '&:hover': { color: textPri, bgcolor: 'transparent' } };
  const rowUnsel = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.1)';
  const rowUnselBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const rowHoverBorder = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.25)';
  const rowHoverBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const checkUnsel = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
  const iconUnsel = isDark ? '#555' : '#aaa';

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

            {/* ── Step 0 — Select Role ─────────────────────────────────────── */}
            {step === 0 && (
              <Box sx={cardSx}>
                <Box sx={{ px: { xs: 3, sm: 4 }, pt: 4, pb: 3 }}>
                  <Typography variant="overline" sx={{ color: BRAND_LIGHT, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.68rem' }}>Step 1 of 3</Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: textPri, mt: 0.5, mb: 0.75, lineHeight: 1.2 }}>{t.s1title}</Typography>
                  <Typography variant="body2" sx={{ color: textSec, lineHeight: 1.65 }}>{t.s1sub}</Typography>
                </Box>

                <Box sx={{ px: { xs: 3, sm: 4 }, pb: 1 }}>
                  {[
                    { r: 'carrier', title: t.carrier, desc: t.carrierDesc, icon: <LocalShippingIcon sx={{ fontSize: 26 }} /> },
                    { r: 'broker',  title: t.broker,  desc: t.brokerDesc,  icon: <BusinessCenterIcon sx={{ fontSize: 26 }} /> },
                  ].map(opt => {
                    const selected = role === opt.r;
                    return (
                      <Box key={opt.r} onClick={() => setRole(opt.r)} sx={{
                        display: 'flex', alignItems: 'center', gap: 2,
                        p: '14px 16px', mb: 1.5, borderRadius: '8px', cursor: 'pointer', border: '1px solid',
                        borderColor: selected ? BRAND_LIGHT : rowUnsel,
                        bgcolor: selected ? 'rgba(66,165,245,0.08)' : rowUnselBg,
                        transition: 'border-color 0.15s, background 0.15s',
                        '&:hover': { borderColor: selected ? BRAND_LIGHT : rowHoverBorder, bgcolor: selected ? 'rgba(66,165,245,0.08)' : rowHoverBg },
                      }}>
                        <Box sx={{ width: 20, height: 20, borderRadius: '4px', flexShrink: 0, border: '2px solid', borderColor: selected ? BRAND_LIGHT : checkUnsel, bgcolor: selected ? BRAND_LIGHT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                          {selected && <CheckIcon sx={{ fontSize: 13, color: '#fff' }} />}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight={700} sx={{ color: textPri, lineHeight: 1.3 }}>{opt.title}</Typography>
                          <Typography variant="body2" sx={{ color: textSec, mt: 0.3, lineHeight: 1.5, fontSize: '0.8rem' }}>{opt.desc}</Typography>
                        </Box>
                        <Box sx={{ color: selected ? BRAND_LIGHT : iconUnsel, flexShrink: 0 }}>{opt.icon}</Box>
                      </Box>
                    );
                  })}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 3, sm: 4 }, py: 2.5, borderTop: `1px solid ${borderC}`, mt: 1 }}>
                  <Button component={Link} to="/login" startIcon={<ChevronLeftIcon sx={{ fontSize: '1rem !important' }} />} sx={navBtnSx}>{t.login}</Button>
                  <Button variant="contained" endIcon={<ChevronRightIcon />} disabled={!role} onClick={() => setStep(1)} sx={{ bgcolor: BRAND_MED, '&:hover': { bgcolor: BRAND }, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em', px: 3.5, py: 1, borderRadius: '6px', fontSize: '0.82rem', boxShadow: 'none' }}>Step 2</Button>
                </Box>
              </Box>
            )}

            {/* ── Step 1 — Business Info ────────────────────────────────────── */}
            {step === 1 && (
              <Box sx={cardSx}>
                <Box sx={{ px: { xs: 3, sm: 4 }, pt: 4, pb: 3 }}>
                  <Typography variant="overline" sx={{ color: BRAND_LIGHT, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.68rem' }}>Step 2 of 3</Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: textPri, mt: 0.5, mb: 0.75, lineHeight: 1.2 }}>{t.s2title}</Typography>
                  <Typography variant="body2" sx={{ color: textSec, lineHeight: 1.65 }}>{t.s2sub}</Typography>
                </Box>

                <Box sx={{ px: { xs: 3, sm: 4 }, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label={role === 'broker' ? t.brokerage : t.company} value={form.company} onChange={e => set('company', e.target.value)} fullWidth size="small" sx={fieldSx} />
                  {role === 'carrier' && (
                    <TextField
                      label={t.mc} value={form.mc} onChange={e => handleMcChange(e.target.value)} fullWidth size="small"
                      error={!!mcState?.error}
                      helperText={mcState === 'checking' ? 'Verifying…' : mcState?.valid ? `✓ ${mcState.legal_name}` : mcState?.error || ''}
                      FormHelperTextProps={{ sx: { color: mcState?.valid ? '#4ade80' : mcState?.error ? '#f87171' : textSec } }}
                      sx={{ ...fieldSx, '& .MuiOutlinedInput-root fieldset': { borderColor: mcState?.valid ? '#4ade80' : mcState?.error ? '#f87171' : (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.16)') } }}
                      InputProps={{
                        endAdornment: mcState === 'checking' ? <InputAdornment position="end"><CircularProgress size={14} sx={{ color: textSec }} /></InputAdornment>
                          : mcState?.valid ? <InputAdornment position="end"><CheckIcon sx={{ fontSize: 16, color: '#4ade80' }} /></InputAdornment>
                          : mcState?.error ? <InputAdornment position="end"><ErrorOutlineIcon sx={{ fontSize: 16, color: '#f87171' }} /></InputAdornment> : null,
                      }}
                    />
                  )}
                  <TextField label={t.phone} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} fullWidth size="small" sx={fieldSx} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 3, sm: 4 }, py: 2.5, borderTop: `1px solid ${borderC}`, mt: 1 }}>
                  <Button onClick={() => setStep(0)} startIcon={<ChevronLeftIcon sx={{ fontSize: '1rem !important' }} />} sx={navBtnSx}>Step 1</Button>
                  <Button variant="contained" endIcon={<ChevronRightIcon />} disabled={!step2Valid || mcBlocking || mcState === 'checking'} onClick={() => setStep(2)} sx={{ bgcolor: BRAND_MED, '&:hover': { bgcolor: BRAND }, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em', px: 3.5, py: 1, borderRadius: '6px', fontSize: '0.82rem', boxShadow: 'none' }}>Step 3</Button>
                </Box>
              </Box>
            )}

            {/* ── Step 2 — Your Info ────────────────────────────────────────── */}
            {step === 2 && (
              <Box sx={cardSx}>
                <Box sx={{ px: { xs: 3, sm: 4 }, pt: 4, pb: 3 }}>
                  <Typography variant="overline" sx={{ color: BRAND_LIGHT, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.68rem' }}>Step 3 of 3</Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: textPri, mt: 0.5, mb: 0.75, lineHeight: 1.2 }}>{t.s3title}</Typography>
                  <Typography variant="body2" sx={{ color: textSec, lineHeight: 1.65 }}>{t.s3sub}</Typography>
                </Box>

                {error && (
                  <Box sx={{ mx: { xs: 3, sm: 4 }, mb: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '6px', px: 2, py: 1.25 }}>
                    <ErrorOutlineIcon sx={{ fontSize: 15, color: '#f87171', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: '#f87171', fontSize: '0.82rem' }}>{error}</Typography>
                  </Box>
                )}

                <Box sx={{ px: { xs: 3, sm: 4 }, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label={t.name} value={form.name} onChange={e => set('name', e.target.value)} fullWidth size="small" sx={fieldSx} />
                  <TextField label={t.email} type="email" value={form.email} onChange={e => set('email', e.target.value)} fullWidth size="small" sx={fieldSx} />
                  <TextField label={t.password} type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} fullWidth size="small" sx={fieldSx}
                    InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPw(v => !v)} edge="end" size="small" sx={{ color: textSec }}>{showPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}</IconButton></InputAdornment> }}
                  />
                  <TextField
                    label={t.confirm} type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} fullWidth size="small"
                    error={!!form.confirmPassword && form.password !== form.confirmPassword}
                    helperText={form.confirmPassword && form.password !== form.confirmPassword ? t.mismatch : ''}
                    FormHelperTextProps={{ sx: { color: '#f87171' } }}
                    sx={{ ...fieldSx, '& .MuiOutlinedInput-root fieldset': { borderColor: form.confirmPassword && form.password !== form.confirmPassword ? '#f87171' : (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.16)') } }}
                    InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowConfirm(v => !v)} edge="end" size="small" sx={{ color: textSec }}>{showConfirm ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}</IconButton></InputAdornment> }}
                  />

                  <Typography variant="caption" sx={{ color: isDark ? '#4b5563' : '#9ca3af', lineHeight: 1.6, mt: -0.5 }}>
                    {t.terms}{' '}<Typography component="span" variant="caption" sx={{ color: BRAND_LIGHT, cursor: 'pointer' }}>{t.tos}</Typography>
                  </Typography>

                  <Button fullWidth variant="contained" disabled={!step3Valid || loading} onClick={handleSignup}
                    startIcon={loading ? <CircularProgress size={15} color="inherit" /> : null}
                    sx={{ bgcolor: BRAND_MED, '&:hover': { bgcolor: BRAND }, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', py: 1.25, borderRadius: '6px', boxShadow: 'none', fontSize: '0.85rem' }}>
                    {loading ? t.creating : t.create}
                  </Button>
                </Box>

                <Box sx={{ px: { xs: 3, sm: 4 }, py: 2, borderTop: `1px solid ${borderC}` }}>
                  <Button onClick={() => setStep(1)} startIcon={<ChevronLeftIcon sx={{ fontSize: '1rem !important' }} />} sx={navBtnSx}>Step 2</Button>
                </Box>
              </Box>
            )}

            {/* ── Step 3 — Success ──────────────────────────────────────────── */}
            {step === 3 && (
              <Box sx={{ ...cardSx, p: { xs: 4, sm: 5 }, textAlign: 'center' }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 3, bgcolor: 'rgba(66,165,245,0.12)', border: `1.5px solid ${BRAND_LIGHT}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: BRAND_LIGHT }} />
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: textPri, mb: 1 }}>{t.welcome}</Typography>
                <Typography variant="body2" sx={{ color: textSec, mb: 4 }}>{t.welcomeSub}</Typography>
                <Button variant="contained" endIcon={<ChevronRightIcon />} onClick={() => navigate(role === 'broker' ? '/broker/dashboard' : '/carrier/dashboard')}
                  sx={{ bgcolor: BRAND_MED, '&:hover': { bgcolor: BRAND }, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', px: 4, py: 1.25, borderRadius: '6px', boxShadow: 'none' }}>
                  {t.dashboard}
                </Button>
              </Box>
            )}

            {step === 0 && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', mt: 2.5, fontSize: '0.82rem' }}>
                Already have an account?{' '}
                <Typography component={Link} to="/login" variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700, textDecoration: 'none', fontSize: '0.82rem', '&:hover': { color: '#fff' } }}>
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
