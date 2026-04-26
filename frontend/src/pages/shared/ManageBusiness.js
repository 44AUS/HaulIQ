import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IonSpinner, IonToast, IonModal } from '@ionic/react';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { authApi } from '../../services/api';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import IonIcon from '../../components/IonIcon';

function resizeToDataUrl(file, size = 400) {
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

const fmtDate = (iso) => {
  if (!iso) return '—';
  const utc = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  return new Date(utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const cardStyle = {
  backgroundColor: 'var(--ion-card-background)',
  border: '1px solid var(--ion-border-color)',
  borderRadius: 10,
  overflow: 'hidden',
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
  const [logoUploading, setLogoUploading] = useState(false);
  const [copied, setCopied] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    company: user?.company || '', mc: user?.mc || '', dot: user?.dot || '',
    business_address: user?.business_address || '', business_city: user?.business_city || '',
    business_state: user?.business_state || '', business_zip: user?.business_zip || '',
    business_country: user?.business_country || '',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const copy = (val, key) => {
    navigator.clipboard.writeText(val || '').catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const dataUrl = await resizeToDataUrl(file, 400);
      await authApi.update({ logo_url: dataUrl });
      updateUser({ logo_url: dataUrl });
    } catch { alert('Failed to upload logo.'); }
    finally { setLogoUploading(false); e.target.value = ''; }
  };

  const handleAddressSelect = (place) => {
    if (!place?.address_components) return;
    const get = (type) => place.address_components.find(c => c.types.includes(type))?.long_name || '';
    const streetNum = get('street_number');
    const route = get('route');
    setForm(f => ({
      ...f,
      business_address: [streetNum, route].filter(Boolean).join(' ') || place.formatted_address || '',
      business_city:    get('locality') || get('sublocality') || '',
      business_state:   get('administrative_area_level_1') || '',
      business_zip:     get('postal_code') || '',
      business_country: get('country') || '',
    }));
  };

  const openEdit = () => {
    setForm({
      company: user?.company || '', mc: user?.mc || '', dot: user?.dot || '',
      business_address: user?.business_address || '', business_city: user?.business_city || '',
      business_state: user?.business_state || '', business_zip: user?.business_zip || '',
      business_country: user?.business_country || '',
    });
    setStatus(null);
    setEditOpen(true);
  };

  async function saveDetails() {
    setSaving(true); setStatus(null);
    try {
      const updated = await authApi.update({
        company: form.company || undefined, mc_number: form.mc || undefined, dot_number: form.dot || undefined,
        business_address: form.business_address || undefined, business_city: form.business_city || undefined,
        business_state: form.business_state || undefined, business_zip: form.business_zip || undefined,
        business_country: form.business_country || undefined,
      });
      updateUser({
        company: updated.company || null, mc: updated.mc_number || null, dot: updated.dot_number || null,
        business_address: updated.business_address || null, business_city: updated.business_city || null,
        business_state: updated.business_state || null, business_zip: updated.business_zip || null,
        business_country: updated.business_country || null,
      });
      setEditOpen(false);
      setSnackbar({ open: true, msg: 'Business details saved.', severity: 'success' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Failed to save.' });
    } finally { setSaving(false); }
  }

  const InfoRow = ({ label, value, copyKey }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--ion-border-color)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', lineHeight: 1.3 }}>{label}</div>
        {value && <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>}
      </div>
      {copyKey && value && (
        <button title={copied === copyKey ? 'Copied!' : 'Copy'} onClick={() => copy(value, copyKey)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === copyKey ? 'var(--ion-color-success)' : 'var(--ion-color-medium)', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
          <IonIcon name="copy-outline" style={{ fontSize: 16 }} />
        </button>
      )}
    </div>
  );

  const addressLine = [user?.business_city, user?.business_state, user?.business_zip].filter(Boolean).join(', ');

  return (
    <div style={{ paddingTop: 16, paddingBottom: 16, display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* ── Left: Business Logo ── */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <div
          onClick={() => !logoUploading && fileRef.current.click()}
          style={{ width: 400, height: 400, borderRadius: 10, overflow: 'hidden', backgroundColor: isDark ? '#2a2a2a' : '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
        >
          {user?.logo_url ? (
            <img src={user.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <IonIcon name="business-outline" style={{ fontSize: '6rem', color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)' }} />
          )}
          <div
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0'}
          >
            {logoUploading ? <IonSpinner name="crescent" style={{ width: 28, height: 28, color: '#fff' }} /> : <IonIcon name="camera-outline" style={{ color: '#fff', fontSize: 28 }} />}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 8, right: 8, backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)', borderRadius: 6 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex', alignItems: 'center' }}>
            <IonIcon name="ellipsis-vertical-outline" style={{ fontSize: 18 }} />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
      </div>

      {/* ── Right: Info sections ── */}
      <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Business Details */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Business Details</span>
            <button onClick={openEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '0.72rem', color: 'var(--ion-color-medium)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'inherit' }}>
              <IonIcon name="create-outline" style={{ fontSize: 14 }} /> Edit
            </button>
          </div>
          <div style={{ padding: '0 20px 4px' }}>
            <InfoRow label="Company Name"     value={user?.company}          copyKey="company" />
            <InfoRow label="MC Number"        value={user?.mc}               copyKey="mc" />
            <InfoRow label="DOT Number"       value={user?.dot}              copyKey="dot" />
            <InfoRow label="Street Address"   value={user?.business_address} copyKey="address" />
            <InfoRow label="City / State / ZIP" value={addressLine || undefined} />
            <InfoRow label="Country"          value={user?.business_country} />
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

      {/* ── Edit Business Details Modal ── */}
      <IonModal isOpen={editOpen} onDidDismiss={() => setEditOpen(false)} style={{ '--width': '480px', '--height': 'auto', '--border-radius': '12px' }}>
        <div style={{ padding: 24, backgroundColor: 'var(--ion-card-background)', borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Edit Business Details</h3>
          {status && (
            <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 6, backgroundColor: status.type === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(45,211,111,0.1)', border: `1px solid ${status.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(45,211,111,0.3)'}`, color: status.type === 'error' ? '#f87171' : '#2dd36f', fontSize: '0.82rem' }}>
              {status.msg}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>Company Name</label>
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} style={inputStyle} />
            </div>
            {user?.role === 'carrier' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['MC Number', 'mc', 'MC-000000'], ['DOT Number', 'dot', 'DOT-000000']].map(([label, key, ph]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>{label}</label>
                    <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} style={inputStyle} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
              <IonIcon name="location-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 16 }} />
              <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--ion-text-color)' }}>Business Address</span>
            </div>
            <AddressAutocomplete
              value={form.business_address}
              onChange={(val) => setForm(f => ({ ...f, business_address: val }))}
              onSelect={handleAddressSelect}
              label="Street Address"
              size="small"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['City', 'business_city'], ['State', 'business_state']].map(([label, key]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['ZIP', 'business_zip'], ['Country', 'business_country']].map(([label, key]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', color: 'var(--ion-text-color)', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={saveDetails} disabled={saving} style={{ backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </IonModal>

      {/* ── Notes Modal ── */}
      <IonModal isOpen={notesOpen} onDidDismiss={() => setNotesOpen(false)} style={{ '--width': '420px', '--height': 'auto', '--border-radius': '12px' }}>
        <div style={{ padding: 24, backgroundColor: 'var(--ion-card-background)', borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Edit Notes</h3>
          <textarea rows={4} placeholder="Add notes about this business…" value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, resize: 'vertical', height: 'auto' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => setNotesOpen(false)} style={{ background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', color: 'var(--ion-text-color)', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={() => setNotesOpen(false)} style={{ backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Save</button>
          </div>
        </div>
      </IonModal>
    </div>
  );
}

// ── Metadata Tab ──────────────────────────────────────────────────────────────
function MetadataTab() {
  const { user } = useAuth();
  const rows = [
    { label: 'Company Name',     value: user?.company },
    { label: 'MC Number',        value: user?.mc },
    { label: 'DOT Number',       value: user?.dot },
    { label: 'Business Address', value: user?.business_address },
    { label: 'City',             value: user?.business_city },
    { label: 'State',            value: user?.business_state },
    { label: 'ZIP',              value: user?.business_zip },
    { label: 'Country',          value: user?.business_country },
    { label: 'Role',             value: user?.role },
    { label: 'Plan',             value: user?.plan },
    { label: 'Member Since',     value: user?.joined ? fmtDate(user.joined) : '—' },
    { label: 'Vetting Status',   value: user?.vetting_status },
    { label: 'Vetting Score',    value: user?.vetting_score },
  ];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 24, paddingBottom: 24 }}>
      <div style={cardStyle}>
        <div style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)', marginBottom: 20 }}>Business Metadata</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map(({ label, value }, i) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', textAlign: 'right', wordBreak: 'break-all', textTransform: 'capitalize' }}>{value || '—'}</span>
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

// ── Root ──────────────────────────────────────────────────────────────────────
export default function ManageBusiness() {
  const [searchParams] = useSearchParams();
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'success' });
  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 24px' }}>
      {activeTab === 'overview' && <OverviewTab setSnackbar={setSnackbar} />}
      {activeTab === 'metadata' && <MetadataTab />}

      <IonToast
        isOpen={snackbar.open}
        onDidDismiss={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.msg}
        duration={4000}
        color={snackbar.severity === 'success' ? 'success' : snackbar.severity === 'error' ? 'danger' : 'warning'}
        position="bottom"
      />
    </div>
  );
}
