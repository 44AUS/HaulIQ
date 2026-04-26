import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import AuthHeader from '../components/AuthHeader';
import WaveBg from '../components/WaveBg';
import IonIcon from '../components/IonIcon';

const GOOGLE_LIBRARIES = ['places'];

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
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', company: '', mc: '',
    businessAddress: '', businessCity: '', businessState: '', businessZip: '', businessCountry: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mcState, setMcState] = useState(null);
  const mcTimerRef = useRef(null);
  const autocompleteRef = useRef(null);

  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
    libraries: GOOGLE_LIBRARIES,
  });
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
  const fieldBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
  const fieldBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.16)';
  const t = LABELS[lang];

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: fieldBg, border: `1px solid ${fieldBorder}`, borderRadius: 6,
    color: textPri, fontSize: '0.875rem', padding: '9px 12px',
    outline: 'none', fontFamily: 'inherit',
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

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.address_components) return;
    const get = (type) => place.address_components.find(c => c.types.includes(type))?.long_name || '';
    const getShort = (type) => place.address_components.find(c => c.types.includes(type))?.short_name || '';
    const streetNum = get('street_number');
    const route = get('route');
    setForm(f => ({
      ...f,
      businessAddress: [streetNum, route].filter(Boolean).join(' '),
      businessCity:    get('locality') || get('sublocality') || get('postal_town'),
      businessState:   get('administrative_area_level_1'),
      businessZip:     get('postal_code'),
      businessCountry: getShort('country'),
    }));
  };

  const mcBlocking = form.mc && mcState && mcState !== 'checking' && !mcState?.valid;
  const step2Valid = form.company && form.phone && form.businessAddress &&
    (role !== 'carrier' || (form.mc && mcState?.valid));
  const step3Valid = form.name && form.email && form.password && form.password === form.confirmPassword;

  const handleSignup = async () => {
    if (form.password !== form.confirmPassword) return;
    const result = await signup({
      ...form,
      mc: form.mc,
      role,
      plan: 'basic',
      business_address: form.businessAddress,
      business_city:    form.businessCity,
      business_state:   form.businessState,
      business_zip:     form.businessZip,
      business_country: form.businessCountry,
    });
    if (result) setStep(3);
  };

  const rowUnsel = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.1)';
  const rowUnselBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const rowHoverBorder = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.25)';
  const checkUnsel = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
  const iconUnsel = isDark ? '#555' : '#aaa';

  const cardStyle = {
    backgroundColor: cardBg, borderRadius: 12,
    border: `1px solid ${borderC}`,
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  };

  const btnPrimary = {
    backgroundColor: BRAND_MED, color: '#fff', border: 'none', borderRadius: 6,
    padding: '10px 24px', fontWeight: 700, fontSize: '0.82rem',
    letterSpacing: '0.07em', textTransform: 'uppercase', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
  };

  const btnNav = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: textSec, fontWeight: 600, fontSize: '0.82rem', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
  };

  const px = window.innerWidth < 480 ? 24 : 32;

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <WaveBg />
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
          <div style={{ width: '100%', maxWidth: 500 }}>

            <AuthHeader lang={lang} setLang={handleLang} mode={mode} toggleMode={toggleMode} />

            {/* ── Step 0 — Select Role ── */}
            {step === 0 && (
              <div style={cardStyle}>
                <div style={{ backgroundColor: BRAND_MED, padding: '7px 0', textAlign: 'center', borderBottom: `1px solid ${borderC}` }}>
                  <span style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                    Free to Start &nbsp;&bull;&nbsp; No Payment Method Required &nbsp;&bull;&nbsp; Cancel Anytime
                  </span>
                </div>
                <div style={{ padding: `32px ${px}px 24px` }}>
                  <div style={{ color: BRAND_LIGHT, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.68rem', textTransform: 'uppercase', marginBottom: 4 }}>Step 1 of 3</div>
                  <h2 style={{ margin: '0 0 6px', color: textPri, fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.2 }}>{t.s1title}</h2>
                  <p style={{ margin: 0, color: textSec, fontSize: '0.875rem', lineHeight: 1.65 }}>{t.s1sub}</p>
                </div>

                <div style={{ padding: `0 ${px}px 8px` }}>
                  {[
                    { r: 'carrier', title: t.carrier, desc: t.carrierDesc, icon: 'car-sport-outline' },
                    { r: 'broker',  title: t.broker,  desc: t.brokerDesc,  icon: 'briefcase-outline' },
                  ].map(opt => {
                    const selected = role === opt.r;
                    return (
                      <div
                        key={opt.r}
                        onClick={() => setRole(opt.r)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16,
                          padding: '14px 16px', marginBottom: 12, borderRadius: 8, cursor: 'pointer',
                          border: `1px solid ${selected ? BRAND_LIGHT : rowUnsel}`,
                          backgroundColor: selected ? 'rgba(66,165,245,0.08)' : rowUnselBg,
                        }}
                      >
                        <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, border: `2px solid ${selected ? BRAND_LIGHT : checkUnsel}`, backgroundColor: selected ? BRAND_LIGHT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selected && <IonIcon name="checkmark-outline" style={{ fontSize: 13, color: '#fff' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: textPri, fontWeight: 700, lineHeight: 1.3, fontSize: '0.95rem' }}>{opt.title}</div>
                          <div style={{ color: textSec, marginTop: 2, lineHeight: 1.5, fontSize: '0.8rem' }}>{opt.desc}</div>
                        </div>
                        <IonIcon name={opt.icon} style={{ fontSize: 26, color: selected ? BRAND_LIGHT : iconUnsel, flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `16px ${px}px 20px`, borderTop: `1px solid ${borderC}`, marginTop: 8 }}>
                  <Link to="/login" style={{ ...btnNav, textDecoration: 'none', color: textSec }}>
                    <IonIcon name="chevron-back-outline" style={{ fontSize: 16 }} /> {t.login}
                  </Link>
                  <button disabled={!role} onClick={() => setStep(1)} style={{ ...btnPrimary, opacity: !role ? 0.5 : 1, cursor: !role ? 'default' : 'pointer' }}>
                    Step 2 <IonIcon name="chevron-forward-outline" style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 1 — Business Info ── */}
            {step === 1 && (
              <div style={cardStyle}>
                <div style={{ padding: `32px ${px}px 24px` }}>
                  <div style={{ color: BRAND_LIGHT, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.68rem', textTransform: 'uppercase', marginBottom: 4 }}>Step 2 of 3</div>
                  <h2 style={{ margin: '0 0 6px', color: textPri, fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.2 }}>{t.s2title}</h2>
                  <p style={{ margin: 0, color: textSec, fontSize: '0.875rem', lineHeight: 1.65 }}>{t.s2sub}</p>
                </div>

                <div style={{ padding: `0 ${px}px 16px`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: textSec, marginBottom: 4, fontWeight: 500 }}>{role === 'broker' ? t.brokerage : t.company}</label>
                    <input value={form.company} onChange={e => set('company', e.target.value)} style={inputStyle} />
                  </div>
                  {role === 'carrier' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: textSec, marginBottom: 4, fontWeight: 500 }}>MC Number * (required)</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          value={form.mc}
                          onChange={e => handleMcChange(e.target.value)}
                          style={{ ...inputStyle, paddingRight: 36, borderColor: mcState?.valid ? '#4ade80' : mcState?.error ? '#f87171' : fieldBorder }}
                        />
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                          {mcState === 'checking' && <IonSpinner name="crescent" style={{ width: 14, height: 14, color: textSec }} />}
                          {mcState?.valid && <IonIcon name="checkmark-outline" style={{ fontSize: 16, color: '#4ade80' }} />}
                          {mcState?.error && <IonIcon name="alert-circle-outline" style={{ fontSize: 16, color: '#f87171' }} />}
                        </span>
                      </div>
                      {mcState === 'checking' && <div style={{ fontSize: '0.75rem', color: textSec, marginTop: 3 }}>Verifying…</div>}
                      {mcState?.valid && <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: 3 }}>✓ {mcState.legal_name}</div>}
                      {mcState?.error && <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: 3 }}>{mcState.error}</div>}
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: textSec, marginBottom: 4, fontWeight: 500 }}>{t.phone}</label>
                    <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: textSec, marginBottom: 4, fontWeight: 500 }}>Business Address *</label>
                    {mapsLoaded ? (
                      <Autocomplete
                        onLoad={ref => { autocompleteRef.current = ref; }}
                        onPlaceChanged={handlePlaceSelect}
                        options={{ types: ['address'], componentRestrictions: { country: ['us', 'ca', 'mx'] } }}
                      >
                        <input
                          placeholder="Start typing your address…"
                          defaultValue={form.businessAddress ? `${form.businessAddress}, ${form.businessCity}, ${form.businessState} ${form.businessZip}`.trim().replace(/^,\s*/, '') : ''}
                          style={inputStyle}
                        />
                      </Autocomplete>
                    ) : (
                      <input value={form.businessAddress} onChange={e => set('businessAddress', e.target.value)} style={inputStyle} />
                    )}
                    {form.businessCity && (
                      <div style={{ fontSize: '0.75rem', color: textSec, marginTop: 3 }}>
                        {[form.businessCity, form.businessState, form.businessZip, form.businessCountry].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `16px ${px}px 20px`, borderTop: `1px solid ${borderC}`, marginTop: 8 }}>
                  <button onClick={() => setStep(0)} style={btnNav}>
                    <IonIcon name="chevron-back-outline" style={{ fontSize: 16 }} /> Step 1
                  </button>
                  <button
                    disabled={!step2Valid || mcBlocking || mcState === 'checking'}
                    onClick={() => setStep(2)}
                    style={{ ...btnPrimary, opacity: (!step2Valid || mcBlocking || mcState === 'checking') ? 0.5 : 1, cursor: (!step2Valid || mcBlocking || mcState === 'checking') ? 'default' : 'pointer' }}
                  >
                    Step 3 <IonIcon name="chevron-forward-outline" style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2 — Your Info ── */}
            {step === 2 && (
              <div style={cardStyle}>
                <div style={{ padding: `32px ${px}px 24px` }}>
                  <div style={{ color: BRAND_LIGHT, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.68rem', textTransform: 'uppercase', marginBottom: 4 }}>Step 3 of 3</div>
                  <h2 style={{ margin: '0 0 6px', color: textPri, fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.2 }}>{t.s3title}</h2>
                  <p style={{ margin: 0, color: textSec, fontSize: '0.875rem', lineHeight: 1.65 }}>{t.s3sub}</p>
                </div>

                {error && (
                  <div style={{ margin: `0 ${px}px 16px`, display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 6, padding: '10px 16px' }}>
                    <IonIcon name="alert-circle-outline" style={{ fontSize: 15, color: '#f87171', flexShrink: 0 }} />
                    <span style={{ color: '#f87171', fontSize: '0.82rem' }}>{error}</span>
                  </div>
                )}

                <div style={{ padding: `0 ${px}px 16px`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: textSec, marginBottom: 4, fontWeight: 500 }}>{t.name}</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: textSec, marginBottom: 4, fontWeight: 500 }}>{t.email}</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: textSec, marginBottom: 4, fontWeight: 500 }}>{t.password}</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} style={{ ...inputStyle, paddingRight: 40 }} />
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSec, display: 'flex', alignItems: 'center', padding: 4 }}>
                        <IonIcon name={showPw ? 'eye-off-outline' : 'eye-outline'} style={{ fontSize: 16 }} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: textSec, marginBottom: 4, fontWeight: 500 }}>{t.confirm}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={e => set('confirmPassword', e.target.value)}
                        style={{ ...inputStyle, paddingRight: 40, borderColor: form.confirmPassword && form.password !== form.confirmPassword ? '#f87171' : fieldBorder }}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSec, display: 'flex', alignItems: 'center', padding: 4 }}>
                        <IonIcon name={showConfirm ? 'eye-off-outline' : 'eye-outline'} style={{ fontSize: 16 }} />
                      </button>
                    </div>
                    {form.confirmPassword && form.password !== form.confirmPassword && (
                      <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: 3 }}>{t.mismatch}</div>
                    )}
                  </div>

                  <p style={{ margin: 0, color: isDark ? '#4b5563' : '#9ca3af', fontSize: '0.75rem', lineHeight: 1.6 }}>
                    {t.terms}{' '}<span style={{ color: BRAND_LIGHT, cursor: 'pointer' }}>{t.tos}</span>
                  </p>

                  <button
                    disabled={!step3Valid || loading}
                    onClick={handleSignup}
                    style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: '0.85rem', opacity: (!step3Valid || loading) ? 0.5 : 1, cursor: (!step3Valid || loading) ? 'default' : 'pointer' }}
                  >
                    {loading ? <IonSpinner name="crescent" style={{ width: 15, height: 15, color: '#fff' }} /> : null}
                    {loading ? t.creating : t.create}
                  </button>
                </div>

                <div style={{ padding: `16px ${px}px 20px`, borderTop: `1px solid ${borderC}` }}>
                  <button onClick={() => setStep(1)} style={btnNav}>
                    <IonIcon name="chevron-back-outline" style={{ fontSize: 16 }} /> Step 2
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3 — Success ── */}
            {step === 3 && (
              <div style={{ ...cardStyle, padding: `${px + 8}px ${px}px`, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 24px', backgroundColor: 'rgba(66,165,245,0.12)', border: `1.5px solid ${BRAND_LIGHT}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IonIcon name="checkmark-circle" style={{ fontSize: 32, color: BRAND_LIGHT }} />
                </div>
                <h2 style={{ margin: '0 0 8px', color: textPri, fontWeight: 800, fontSize: '1.25rem' }}>{t.welcome}</h2>
                <p style={{ margin: '0 0 32px', color: textSec, fontSize: '0.875rem' }}>{t.welcomeSub}</p>
                <button onClick={() => navigate(role === 'broker' ? '/broker/dashboard' : '/carrier/dashboard')} style={{ ...btnPrimary, margin: '0 auto' }}>
                  {t.dashboard} <IonIcon name="chevron-forward-outline" style={{ fontSize: 16 }} />
                </button>
              </div>
            )}

            {step === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 20, fontSize: '0.82rem' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700, textDecoration: 'none', fontSize: '0.82rem' }}>
                  Sign in
                </Link>
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
