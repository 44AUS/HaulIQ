import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { IonSpinner, IonInput, IonButton } from '@ionic/react';
import { useAuth, ROLES } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import AuthHeader from '../components/AuthHeader';
import IonIcon from '../components/IonIcon';
import mapVector from '../assets/map_vector.svg';

const LABELS = {
  en: { title: 'Welcome back', sub: 'Sign in to your HaulIQ account', email: 'Email', password: 'Password', signin: 'Sign In', signingIn: 'Signing in…', forgot: 'Forgot password?', noAccount: 'No account?', signupFree: 'Sign up free' },
  es: { title: 'Bienvenido',   sub: 'Inicia sesión en tu cuenta HaulIQ', email: 'Correo', password: 'Contraseña', signin: 'Iniciar sesión', signingIn: 'Iniciando…', forgot: '¿Olvidaste tu contraseña?', noAccount: '¿Sin cuenta?', signupFree: 'Regístrate gratis' },
  fr: { title: 'Bon retour',   sub: 'Connectez-vous à votre compte HaulIQ', email: 'E-mail', password: 'Mot de passe', signin: 'Se connecter', signingIn: 'Connexion…', forgot: 'Mot de passe oublié ?', noAccount: 'Pas de compte ?', signupFree: 'Inscription gratuite' },
};

export default function Login() {
  const [params] = useSearchParams();
  const [role]   = useState(params.get('role') || '');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [lang,     setLang]     = useState(() => localStorage.getItem('urload_lang') || 'en');
  const { login, loading, error, setError } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setError && setError(null); }, []);

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

  const t = LABELS[lang];

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>

      {/* ── Background ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(145deg, #020d1f 0%, #041529 40%, #051c38 70%, #030f22 100%)', overflow: 'hidden' }}>
        <img
          src={mapVector}
          alt=""
          aria-hidden="true"
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120%', height: '120%', objectFit: 'cover', filter: 'sepia(1) saturate(8) hue-rotate(195deg) brightness(0.65)', opacity: 0.22, pointerEvents: 'none', userSelect: 'none' }}
        />
        <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(25,118,210,0.28) 0%, rgba(13,71,161,0.12) 45%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -120, right: -120, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(66,165,245,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,192,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to top, rgba(2,9,20,0.7) 0%, transparent 100%)', pointerEvents: 'none' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
          <div style={{ width: '100%', maxWidth: 500 }}>

            <AuthHeader lang={lang} setLang={handleLang} mode={mode} toggleMode={toggleTheme} />

            <div style={{ backgroundColor: 'var(--ion-card-background)', borderRadius: 14, boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 24px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              <div style={{ padding: '32px 32px 24px' }}>
                <h2 style={{ margin: '0 0 4px', color: 'var(--ion-text-color)', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.2 }}>{t.title}</h2>
                <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '0.875rem', lineHeight: 1.65 }}>{t.sub}</p>
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
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>{t.email}</label>
                    <IonInput
                      fill="outline"
                      type="email"
                      value={email}
                      onIonChange={e => setEmail(e.detail.value ?? '')}
                      required
                      style={{ '--border-radius': '6px', '--highlight-color-focused': 'var(--ion-color-primary)', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>{t.password}</label>
                    <IonInput
                      fill="outline"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onIonChange={e => setPassword(e.detail.value ?? '')}
                      required
                      style={{ '--border-radius': '6px', '--highlight-color-focused': 'var(--ion-color-primary)', fontSize: '0.875rem' }}
                    >
                      <button slot="end" type="button" onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', padding: 4 }}>
                        <IonIcon name={showPw ? 'eye-off-outline' : 'eye-outline'} style={{ fontSize: 16 }} />
                      </button>
                    </IonInput>
                  </div>
                  <IonButton
                    type="submit"
                    expand="block"
                    color="primary"
                    disabled={loading || !email || !password}
                    style={{ '--border-radius': '6px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}
                  >
                    {loading
                      ? <IonSpinner slot="start" name="crescent" style={{ width: 18, height: 18 }} />
                      : <IonIcon slot="end" name="chevron-forward-outline" />
                    }
                    {loading ? t.signingIn : t.signin}
                  </IonButton>
                </div>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderTop: '1px solid var(--ion-border-color)' }}>
                <Link to="/login" style={{ color: 'var(--ion-color-medium)', textDecoration: 'none', fontWeight: 500, fontSize: '0.8rem' }}>{t.forgot}</Link>
                <span style={{ color: 'var(--ion-color-medium)', fontSize: '0.8rem' }}>
                  {t.noAccount}{' '}
                  <Link to="/signup" style={{ color: 'var(--ion-color-primary)', fontWeight: 700, textDecoration: 'none', fontSize: '0.8rem' }}>{t.signupFree}</Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
