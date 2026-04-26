import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useAuth, ROLES } from '../context/AuthContext';
import AuthHeader from '../components/AuthHeader';
import WaveBg from '../components/WaveBg';
import IonIcon from '../components/IonIcon';

const BRAND     = '#1565C0';
const BRAND_MED = '#1976d2';
const BRAND_LIGHT = '#42a5f5';

const LABELS = {
  en: { title: 'Welcome back', sub: 'Sign in to your Urload account', email: 'Email', password: 'Password', signin: 'Sign In', signingIn: 'Signing in…', forgot: 'Forgot password?', noAccount: 'No account?', signupFree: 'Sign up free' },
  es: { title: 'Bienvenido',   sub: 'Inicia sesión en tu cuenta Urload', email: 'Correo', password: 'Contraseña', signin: 'Iniciar sesión', signingIn: 'Iniciando…', forgot: '¿Olvidaste tu contraseña?', noAccount: '¿Sin cuenta?', signupFree: 'Regístrate gratis' },
  fr: { title: 'Bon retour',   sub: 'Connectez-vous à votre compte Urload', email: 'E-mail', password: 'Mot de passe', signin: 'Se connecter', signingIn: 'Connexion…', forgot: 'Mot de passe oublié ?', noAccount: 'Pas de compte ?', signupFree: 'Inscription gratuite' },
};

export default function Login() {
  const [params] = useSearchParams();
  const [role]   = useState(params.get('role') || '');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [lang,     setLang]     = useState(() => localStorage.getItem('urload_lang') || 'en');
  const [mode,     setMode]     = useState(() => localStorage.getItem('urload_form_theme') || 'dark');
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setError && setError(null); }, []);

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('urload_form_theme', next);
  };

  const handleLang = (val) => { setLang(val); localStorage.setItem('urload_lang', val); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(email, password, role || undefined);
    if (ok) {
      const r = role || (email === 'admin@urload.app' ? 'admin' : 'carrier');
      if (r === ROLES.ADMIN) navigate('/admin');
      else if (r === ROLES.BROKER) navigate('/broker/dashboard');
      else navigate('/carrier/dashboard');
    }
  };

  const isDark  = mode === 'dark';
  const cardBg  = isDark ? '#111318' : '#ffffff';
  const textPri = isDark ? '#fff' : '#111318';
  const textSec = isDark ? '#8a8f9c' : '#6b7280';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)';
  const fieldBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
  const fieldBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.16)';
  const t = LABELS[lang];

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: fieldBg, border: `1px solid ${fieldBorder}`, borderRadius: 6,
    color: textPri, fontSize: '0.875rem', padding: '9px 12px',
    outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <WaveBg />
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
          <div style={{ width: '100%', maxWidth: 500 }}>

            <AuthHeader lang={lang} setLang={handleLang} mode={mode} toggleMode={toggleMode} />

            <div style={{ backgroundColor: cardBg, borderRadius: 12, border: `1px solid ${borderC}`, boxShadow: '0 24px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <div style={{ padding: '32px 32px 24px' }}>
                <h2 style={{ margin: '0 0 4px', color: textPri, fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.2 }}>{t.title}</h2>
                <p style={{ margin: 0, color: textSec, fontSize: '0.875rem', lineHeight: 1.65 }}>{t.sub}</p>
              </div>

              {error && (
                <div style={{ margin: '0 32px 16px', display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 6, padding: '10px 16px' }}>
                  <IonIcon name="alert-circle-outline" style={{ fontSize: 15, color: '#f87171', flexShrink: 0 }} />
                  <span style={{ color: '#f87171', fontSize: '0.82rem' }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ padding: '0 32px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: textSec, marginBottom: 4, fontWeight: 500 }}>{t.email}</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: textSec, marginBottom: 4, fontWeight: 500 }}>{t.password}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ ...inputStyle, paddingRight: 40 }}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSec, display: 'flex', alignItems: 'center', padding: 4 }}>
                        <IonIcon name={showPw ? 'eye-off-outline' : 'eye-outline'} style={{ fontSize: 16 }} />
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email || !password}
                    style={{ width: '100%', backgroundColor: BRAND_MED, color: '#fff', border: 'none', borderRadius: 6, padding: '10px 0', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: loading || !email || !password ? 'default' : 'pointer', opacity: loading || !email || !password ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
                  >
                    {loading ? <IonSpinner name="crescent" style={{ width: 18, height: 18, color: '#fff' }} /> : t.signin}
                    {!loading && <IonIcon name="chevron-forward-outline" style={{ fontSize: 16 }} />}
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderTop: `1px solid ${borderC}` }}>
                <Link to="/login" style={{ color: textSec, textDecoration: 'none', fontWeight: 500, fontSize: '0.8rem' }}>{t.forgot}</Link>
                <span style={{ color: textSec, fontSize: '0.8rem' }}>
                  {t.noAccount}{' '}
                  <Link to="/signup" style={{ color: BRAND_LIGHT, fontWeight: 700, textDecoration: 'none', fontSize: '0.8rem' }}>{t.signupFree}</Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
