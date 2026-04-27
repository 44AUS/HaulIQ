import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { IonSpinner, IonToast, IonModal } from '@ionic/react';
import { useAuth } from '../../context/AuthContext';
import { authApi, freightPaymentsApi, profileDocumentsApi } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';
import IonIcon from '../../components/IonIcon';

function resizeToDataUrl(file, size = 256) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2; const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = url;
  });
}

async function fileToPages(file) {
  if (file.type === 'application/pdf') {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve([reader.result]);
      reader.readAsDataURL(file);
    });
  }
  const dataUrl = await resizeToDataUrl(file, 1200);
  return [dataUrl];
}

const fmtDate = (iso) => {
  if (!iso) return '—';
  const utc = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  return new Date(utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const fmtFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const DOC_TYPE_LABELS = {
  insurance:            'Insurance Certificate',
  authority:            'Operating Authority (MC)',
  w9:                   'W-9 Form',
  drivers_license:      "Driver's License",
  vehicle_registration: 'Vehicle Registration',
  dot_inspection:       'DOT Inspection',
  ifta:                 'IFTA License',
  other:                'Other',
};

const cardStyle = {
  backgroundColor: 'var(--ion-card-background)',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))',
  border: '1px solid var(--ion-border-color)',
  borderRadius: 6, color: 'var(--ion-text-color)',
  fontSize: '0.875rem', padding: '9px 12px',
  outline: 'none', fontFamily: 'inherit',
};

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ setSnackbar }) {
  const { user, updateUser } = useAuth();
  const { isDark } = useThemeMode();
  const fileRef = useRef();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [payoutStatus,    setPayoutStatus]    = useState(null);
  const location = useLocation();

  const [editOpen, setEditOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '', phone: user?.phone || '',
    company: user?.company || '', mc: user?.mc || '', dot: user?.dot || '',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [passwords, setPasswords] = useState({ next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const [copied, setCopied] = useState(null);

  const copy = (val, key) => {
    navigator.clipboard.writeText(val || '').catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('payout');
    if (p === 'success') setSnackbar({ open: true, msg: 'Payout account connected!', severity: 'success' });
    else if (p === 'refresh') setSnackbar({ open: true, msg: 'Please complete payout setup.', severity: 'warning' });
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.role === 'carrier') {
      freightPaymentsApi.onboardStatus().then(d => setPayoutStatus(d)).catch(() => setPayoutStatus(null));
    }
  }, [user?.role]);

  const handleConnectPayout = async () => {
    try {
      const data = await freightPaymentsApi.onboard();
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      setSnackbar({ open: true, msg: err.message || 'Failed to start payout setup.', severity: 'error' });
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const dataUrl = await resizeToDataUrl(file, 400);
      await authApi.update({ avatar_url: dataUrl });
      updateUser({ avatar_url: dataUrl });
    } catch { alert('Failed to upload photo.'); }
    finally { setAvatarUploading(false); e.target.value = ''; }
  };

  async function saveProfile() {
    setSaving(true); setStatus(null);
    try {
      const updated = await authApi.update({
        name: profile.name || undefined, phone: profile.phone || undefined,
        company: profile.company || undefined, mc_number: profile.mc || undefined,
        dot_number: profile.dot || undefined,
      });
      updateUser({ name: updated.name, phone: updated.phone || null, company: updated.company || updated.name,
        mc: updated.mc_number || null, dot: updated.dot_number || null,
        avatar: updated.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) });
      setEditOpen(false);
    } catch (err) { setStatus({ type: 'error', msg: err.message || 'Failed to save.' }); }
    finally { setSaving(false); }
  }

  async function changePassword() {
    if (passwords.next !== passwords.confirm) { setStatus({ type: 'error', msg: 'Passwords do not match.' }); return; }
    if (passwords.next.length < 8) { setStatus({ type: 'error', msg: 'Min 8 characters.' }); return; }
    setPwSaving(true); setStatus(null);
    try {
      await authApi.update({ password: passwords.next });
      setPasswords({ next: '', confirm: '' });
      setPwOpen(false);
      setSnackbar({ open: true, msg: 'Password changed.', severity: 'success' });
    } catch (err) { setStatus({ type: 'error', msg: err.message || 'Failed.' }); }
    finally { setPwSaving(false); }
  }

  const InfoRow = ({ label, value, copyKey, showEmail }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', lineHeight: 1.3 }}>{label}</div>
        {value && <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
        {showEmail && value && (
          <button title="Send email" onClick={() => { window.location.href = `mailto:${value}`; }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-warning)', padding: 4, display: 'flex', alignItems: 'center' }}>
            <IonIcon name="mail-outline" style={{ fontSize: 16 }} />
          </button>
        )}
        {copyKey && value && (
          <button title={copied === copyKey ? 'Copied!' : 'Copy'} onClick={() => copy(value, copyKey)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === copyKey ? 'var(--ion-color-success)' : 'var(--ion-color-medium)', padding: 4, display: 'flex', alignItems: 'center' }}>
            <IonIcon name="copy-outline" style={{ fontSize: 16 }} />
          </button>
        )}
      </div>
    </div>
  );

  const AuthRow = ({ icon, iconColor, label, desc, actionLabel, onAction }) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0', gap: 16, borderBottom: '1px solid var(--ion-border-color)' }}>
      <IonIcon name={icon} style={{ fontSize: 22, color: iconColor || 'var(--ion-color-medium)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{desc}</div>}
      </div>
      <button onClick={onAction} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', color: 'var(--ion-color-success)', flexShrink: 0, fontFamily: 'inherit' }}>
        {actionLabel}
      </button>
    </div>
  );

  return (
    <div style={{ paddingTop: 16, paddingBottom: 16, display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* ── Left: Avatar ── */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <div
          onClick={() => !avatarUploading && fileRef.current.click()}
          style={{ width: 400, height: 400, borderRadius: 10, overflow: 'hidden', backgroundColor: isDark ? '#2a2a2a' : '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '4rem', fontWeight: 300, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }}>
              {user?.name?.[0] || '?'}
            </span>
          )}
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0'}
          >
            {avatarUploading ? <IonSpinner name="crescent" style={{ width: 28, height: 28, color: '#fff' }} /> : <IonIcon name="camera-outline" style={{ color: '#fff', fontSize: 28 }} />}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
      </div>

      {/* ── Right: Info sections ── */}
      <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Employee Info */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Employee Info</span>
            <button onClick={() => { setProfile({ name: user?.name || '', phone: user?.phone || '', company: user?.company || '', mc: user?.mc || '', dot: user?.dot || '' }); setStatus(null); setEditOpen(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '0.72rem', color: 'var(--ion-color-medium)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'inherit' }}>
              <IonIcon name="create-outline" style={{ fontSize: 14 }} /> Edit
            </button>
          </div>
          <div style={{ padding: '0 20px 4px' }}>
            <InfoRow label="Name"         value={user?.name}  copyKey="name" />
            <InfoRow label="Phone Number" value={user?.phone} copyKey="phone" />
            <InfoRow label="Email"        value={user?.email} copyKey="email" showEmail />
            <InfoRow label="Role"         value={user?.role} />
            {user?.mc  && <InfoRow label="MC Number"  value={user.mc}  copyKey="mc" />}
            {user?.dot && <InfoRow label="DOT Number" value={user.dot} copyKey="dot" />}
          </div>
        </div>

        {/* Authentication Methods */}
        <div style={cardStyle}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Authentication Methods</span>
          </div>
          <div style={{ padding: '0 20px 4px' }}>
            <AuthRow icon="shield-checkmark-outline" label="Two-factor authentication" desc="Adds an extra layer of security. You'll enter your password and a code sent to your mobile device." actionLabel="Enable" onAction={() => {}} />
            <AuthRow icon="lock-closed-outline" label="Password" actionLabel="Reset" onAction={() => { setStatus(null); setPasswords({ next: '', confirm: '' }); setPwOpen(true); }} />
            {user?.role === 'carrier' && (
              <AuthRow
                icon="wallet-outline"
                iconColor={payoutStatus?.connected && payoutStatus?.payouts_enabled ? '#2dd36f' : 'var(--ion-color-medium)'}
                label="Payout Account"
                desc={payoutStatus?.connected && payoutStatus?.payouts_enabled ? 'Connected via Stripe' : 'Not connected'}
                actionLabel={payoutStatus?.connected ? 'Manage' : 'Connect'}
                onAction={handleConnectPayout}
              />
            )}
          </div>
        </div>

        {/* Notes */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Notes</span>
            <button onClick={() => setNotesOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '0.72rem', color: 'var(--ion-color-medium)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'inherit' }}>
              <IonIcon name="create-outline" style={{ fontSize: 14 }} /> Edit
            </button>
          </div>
          <div style={{ padding: '0 20px 16px' }}>
            {notes ? (
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)', whiteSpace: 'pre-wrap' }}>{notes}</p>
            ) : (
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium-shade)' }}>No notes added.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Info Modal ── */}
      <IonModal isOpen={editOpen} onDidDismiss={() => setEditOpen(false)} style={{ '--width': '420px', '--height': 'auto', '--border-radius': '12px' }}>
        <div style={{ padding: 24, backgroundColor: 'var(--ion-card-background)', borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Edit Profile</h3>
          {status && (
            <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 6, backgroundColor: status.type === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(45,211,111,0.1)', border: `1px solid ${status.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(45,211,111,0.3)'}`, color: status.type === 'error' ? '#f87171' : '#2dd36f', fontSize: '0.82rem' }}>
              {status.msg}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['Full Name', 'name'], ['Phone', 'phone'], ['Company', 'company']].map(([label, key]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>{label}</label>
                <input value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            {user?.role === 'carrier' && <>
              {[['MC Number', 'mc'], ['DOT Number', 'dot']].map(([label, key]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>{label}</label>
                  <input value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
            </>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', color: 'var(--ion-text-color)', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={saveProfile} disabled={saving} style={{ backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </IonModal>

      {/* ── Change Password Modal ── */}
      <IonModal isOpen={pwOpen} onDidDismiss={() => setPwOpen(false)} style={{ '--width': '420px', '--height': 'auto', '--border-radius': '12px' }}>
        <div style={{ padding: 24, backgroundColor: 'var(--ion-card-background)', borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Reset Password</h3>
          {status && (
            <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 6, backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '0.82rem' }}>
              {status.msg}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>New Password</label>
              <input type="password" placeholder="Min. 8 characters" value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>Confirm Password</label>
              <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button onClick={() => setPwOpen(false)} style={{ background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', color: 'var(--ion-text-color)', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={changePassword} disabled={pwSaving || !passwords.next} style={{ backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: (pwSaving || !passwords.next) ? 'default' : 'pointer', fontWeight: 700, fontFamily: 'inherit', opacity: (pwSaving || !passwords.next) ? 0.7 : 1 }}>
              {pwSaving ? 'Saving…' : 'Change Password'}
            </button>
          </div>
        </div>
      </IonModal>

      {/* ── Notes Modal ── */}
      <IonModal isOpen={notesOpen} onDidDismiss={() => setNotesOpen(false)} style={{ '--width': '420px', '--height': 'auto', '--border-radius': '12px' }}>
        <div style={{ padding: 24, backgroundColor: 'var(--ion-card-background)', borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Edit Notes</h3>
          <textarea rows={4} placeholder="Add notes about yourself…" value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, resize: 'vertical', height: 'auto' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => setNotesOpen(false)} style={{ background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', color: 'var(--ion-text-color)', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={() => setNotesOpen(false)} style={{ backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Save</button>
          </div>
        </div>
      </IonModal>
    </div>
  );
}

// ── Earnings Tab ──────────────────────────────────────────────────────────────
function EarningsTab() {
  const { user } = useAuth();
  const clockedIn   = user?.clocked_in || false;
  const clockedInAt = user?.clocked_in_at;
  const lat = user?.clock_in_lat;
  const lng = user?.clock_in_lng;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 24, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={cardStyle}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <IonIcon name="time-outline" style={{ color: 'var(--ion-color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Clock-In Status</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: clockedIn ? '#2dd36f' : '#eb445a', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: clockedIn ? '#2dd36f' : '#eb445a' }}>
              {clockedIn ? 'Currently Clocked In' : 'Clocked Out'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Last Clock-In</span>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{fmtDate(clockedInAt)}</span>
            </div>
            {(lat || lng) && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IonIcon name="location-outline" style={{ fontSize: 14 }} /> Location
                </span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>
                  {lat?.toFixed(5)}, {lng?.toFixed(5)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 24, textAlign: 'center' }}>
        <IonIcon name="time-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 8px' }} />
        <div style={{ fontWeight: 600, color: 'var(--ion-color-medium)' }}>Clock-In History Coming Soon</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium-shade)', marginTop: 4 }}>Detailed earnings and shift history will appear here.</div>
      </div>
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────────────────
function DocumentsTab() {
  const { isDark } = useThemeMode();
  const fileRef = useRef();
  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType,   setDocType]   = useState('insurance');
  const [error,     setError]     = useState(null);

  const load = useCallback(() => {
    profileDocumentsApi.list()
      .then(d => setDocs(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const pages = await fileToPages(file);
      await profileDocumentsApi.upload({ file_name: file.name, doc_type: docType, pages, page_count: pages.length, file_size: file.size });
      load();
    } catch (err) { setError(err.message || 'Upload failed.'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDelete = async (id) => {
    await profileDocumentsApi.delete(id).catch(() => {});
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 24, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {error && (
        <div style={{ padding: '10px 16px', borderRadius: 6, backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 2 }}>
            <IonIcon name="close-outline" style={{ fontSize: 16 }} />
          </button>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <IonIcon name="cloud-upload-outline" style={{ color: 'var(--ion-color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Upload Document</span>
          </div>
          <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
            Upload compliance documents such as insurance certificates, operating authority, W-9, and more. Accepted: PDF, JPG, PNG.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ion-color-medium)', marginBottom: 4 }}>Document Type</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} style={{ ...inputStyle, width: 220, padding: '8px 12px' }}>
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <button
              disabled={uploading}
              onClick={() => fileRef.current.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 16px', cursor: uploading ? 'default' : 'pointer', fontWeight: 700, fontFamily: 'inherit', opacity: uploading ? 0.7 : 1, alignSelf: 'flex-end' }}
            >
              {uploading ? <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} /> : <IonIcon name="add-outline" style={{ fontSize: 16 }} />}
              {uploading ? 'Uploading…' : 'Choose File'}
            </button>
            <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--ion-border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>My Documents</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 8, borderRadius: 4, backgroundColor: 'var(--ion-color-light)', marginBottom: 8 }} />)}
          </div>
        ) : docs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <IonIcon name="document-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 8px' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No documents uploaded yet.</span>
          </div>
        ) : (
          <div>
            {docs.map((doc, i) => (
              <div key={doc.id}>
                {i > 0 && <div style={{ borderTop: '1px solid var(--ion-border-color)' }} />}
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', gap: 16, backgroundColor: 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <IonIcon name="document-outline" style={{ fontSize: 32, color: 'var(--ion-color-primary)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ backgroundColor: 'var(--ion-color-light)', borderRadius: 10, padding: '1px 8px', fontSize: '0.68rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}</span>
                      {doc.file_size && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{fmtFileSize(doc.file_size)}</span>}
                      <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{fmtDate(doc.created_at)}</span>
                    </div>
                  </div>
                  <button title="Delete" onClick={() => handleDelete(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex', alignItems: 'center' }}>
                    <IonIcon name="trash-outline" style={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Businesses Tab ────────────────────────────────────────────────────────────
function BusinessesTab() {
  const { user } = useAuth();
  const fields = [
    { label: 'Company Name',     value: user?.company },
    { label: 'Business Address', value: user?.business_address },
    { label: 'City',             value: user?.business_city },
    { label: 'State',            value: user?.business_state },
    { label: 'ZIP',              value: user?.business_zip },
    { label: 'Country',          value: user?.business_country },
    { label: 'MC Number',        value: user?.mc },
    { label: 'DOT Number',       value: user?.dot },
  ].filter(f => f.value);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 24, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={cardStyle}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <IonIcon name="business-outline" style={{ color: 'var(--ion-color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Business Information</span>
          </div>
          {fields.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No business information on file. Update your profile to add company details.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fields.map(({ label, value }, i) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{label}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{value}</span>
                  </div>
                  {i < fields.length - 1 && <div style={{ borderTop: '1px solid var(--ion-border-color)', marginTop: 12 }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 24, textAlign: 'center' }}>
        <IonIcon name="business-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 8px' }} />
        <div style={{ fontWeight: 600, color: 'var(--ion-color-medium)' }}>Multiple Businesses Coming Soon</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium-shade)', marginTop: 4 }}>You'll be able to manage multiple business entities from this tab.</div>
      </div>
    </div>
  );
}

// ── Time Off Tab ──────────────────────────────────────────────────────────────
function TimeOffTab() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 24, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={cardStyle}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <IonIcon name="umbrella-outline" style={{ color: 'var(--ion-color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Time Off</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
            Manage your availability and schedule time away. When you mark time off, your truck posts will automatically be hidden from the broker Truck Board.
          </p>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 24, textAlign: 'center' }}>
        <IonIcon name="umbrella-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 8px' }} />
        <div style={{ fontWeight: 600, color: 'var(--ion-color-medium)' }}>Time Off Scheduling Coming Soon</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium-shade)', marginTop: 4 }}>Set vacation periods, block dates, and manage availability from here.</div>
      </div>
    </div>
  );
}

// ── Metadata Tab ──────────────────────────────────────────────────────────────
function MetadataTab() {
  const { user } = useAuth();
  const rows = [
    { label: 'User ID',        value: user?.id },
    { label: 'Email',          value: user?.email },
    { label: 'Role',           value: user?.role },
    { label: 'Plan',           value: user?.plan },
    { label: 'Vetting Status', value: user?.vetting_status },
    { label: 'Vetting Score',  value: user?.vetting_score },
    { label: 'Member Since',   value: user?.joined },
    { label: 'Last Active',    value: user?.last_active_at ? fmtDate(user.last_active_at) : '—' },
    { label: 'Verified',       value: user?.is_verified ? 'Yes' : 'No' },
    { label: 'Brand Color',    value: user?.brand_color || '—' },
  ];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 24, paddingBottom: 24 }}>
      <div style={cardStyle}>
        <div style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)', marginBottom: 20 }}>Account Metadata</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map(({ label, value }, i) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', textAlign: 'right', wordBreak: 'break-all', textTransform: 'capitalize' }}>{value ?? '—'}</span>
                </div>
                {i < rows.length - 1 && <div style={{ borderTop: '1px solid var(--ion-border-color)', marginTop: 12 }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function ManageProfile() {
  const [searchParams] = useSearchParams();
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'success' });
  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 24px' }}>
      {activeTab === 'overview'   && <OverviewTab   snackbar={snackbar} setSnackbar={setSnackbar} />}
      {activeTab === 'earnings'   && <EarningsTab />}
      {activeTab === 'documents'  && <DocumentsTab />}
      {activeTab === 'businesses' && <BusinessesTab />}
      {activeTab === 'time_off'   && <TimeOffTab />}
      {activeTab === 'metadata'   && <MetadataTab />}

      <IonToast
        isOpen={snackbar.open}
        onDidDismiss={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.msg}
        duration={6000}
        color={snackbar.severity === 'success' ? 'success' : snackbar.severity === 'error' ? 'danger' : 'warning'}
        position="bottom"
      />
    </div>
  );
}
