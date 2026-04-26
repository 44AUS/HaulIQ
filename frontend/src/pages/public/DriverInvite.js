import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import IonIcon from '../../components/IonIcon';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  backgroundColor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.16)',
  borderRadius: 6, color: '#111', fontSize: '0.875rem', padding: '9px 12px',
  outline: 'none', fontFamily: 'inherit',
};

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
    setSubmitting(true); setSubmitError(null);
    try {
      const res = await fetch(`${API}/api/driver-invite/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to accept invite');
      localStorage.setItem('urload_token', data.access_token);
      setDone(true);
      setTimeout(() => navigate('/driver/dashboard'), 1500);
    } catch (err) { setSubmitError(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', padding: 16 }}>
      <div style={{ maxWidth: 440, width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IonIcon name="car-sport-outline" style={{ fontSize: 30, color: '#fff' }} />
          </div>
        </div>

        {loadingInfo && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <IonSpinner name="crescent" />
          </div>
        )}

        {!loadingInfo && infoError && (
          <div style={{ padding: '10px 16px', borderRadius: 6, backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '0.875rem' }}>{infoError}</div>
        )}

        {!loadingInfo && !infoError && inviteInfo && !done && (
          <>
            <h2 style={{ margin: '0 0 8px', textAlign: 'center', fontWeight: 800, fontSize: '1.25rem' }}>You're invited!</h2>
            <p style={{ margin: '0 0 24px', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
              <strong>{inviteInfo.carrier_name}</strong> has invited you to join HaulIQ as a driver.
              Set your password to activate your account.
            </p>

            <div style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 6, padding: '12px 16px', marginBottom: 24 }}>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Name</div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8 }}>{inviteInfo.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Email</div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inviteInfo.email}</div>
            </div>

            {submitError && (
              <div style={{ padding: '10px 16px', borderRadius: 6, backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '0.875rem', marginBottom: 16 }}>{submitError}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required style={{ ...inputStyle, paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 4 }}>
                    <IonIcon name={showPw ? 'eye-off-outline' : 'eye-outline'} style={{ fontSize: 16 }} />
                  </button>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 3 }}>Minimum 6 characters</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>Confirm Password</label>
                <input type={showPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={inputStyle} />
              </div>
              <button type="submit" disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', backgroundColor: '#1565C0', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 0', cursor: submitting ? 'default' : 'pointer', fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit', marginTop: 4, opacity: submitting ? 0.7 : 1 }}>
                {submitting && <IonSpinner name="crescent" style={{ width: 16, height: 16, color: '#fff' }} />}
                {submitting ? 'Activating…' : 'Activate Account'}
              </button>
            </form>
          </>
        )}

        {done && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <IonIcon name="checkmark-circle" style={{ fontSize: 48, color: '#2dd36f', display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Account activated!</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Redirecting to your dashboard…</div>
          </div>
        )}
      </div>
    </div>
  );
}
