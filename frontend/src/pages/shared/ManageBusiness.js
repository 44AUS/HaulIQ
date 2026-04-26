import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import IonIcon from '../../components/IonIcon';

const fmtDate = (iso) => {
  if (!iso) return '—';
  const utc = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  return new Date(utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };

function OverviewTab() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    company: user?.company || '', mc: user?.mc || '', dot: user?.dot || '',
    business_address: user?.business_address || '', business_city: user?.business_city || '',
    business_state: user?.business_state || '', business_zip: user?.business_zip || '',
    business_country: user?.business_country || '',
  });
  const [status, setStatus] = useState(null);
  const [saving, setSaving]  = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

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

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setStatus(null);
    try {
      const updated = await authApi.update({
        company: form.company || undefined, mc_number: form.mc || undefined, dot_number: form.dot || undefined,
        business_address: form.business_address || undefined, business_city: form.business_city || undefined,
        business_state: form.business_state || undefined, business_zip: form.business_zip || undefined,
        business_country: form.business_country || undefined,
      });
      updateUser({ company: updated.company || null, mc: updated.mc_number || null, dot: updated.dot_number || null,
        business_address: updated.business_address || null, business_city: updated.business_city || null,
        business_state: updated.business_state || null, business_zip: updated.business_zip || null,
        business_country: updated.business_country || null });
      setStatus({ type: 'success', msg: 'Business information saved.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Failed to save.' });
    } finally { setSaving(false); }
  }

  const Field = ({ label, fieldKey, placeholder }) => (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>{label}</label>
      <input value={form[fieldKey]} onChange={set(fieldKey)} placeholder={placeholder || ''} style={inputStyle} />
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 24, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {status && (
        <div style={{ padding: '10px 16px', borderRadius: 6, backgroundColor: status.type === 'success' ? 'rgba(45,211,111,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${status.type === 'success' ? 'rgba(45,211,111,0.3)' : 'rgba(248,113,113,0.3)'}`, color: status.type === 'success' ? '#2dd36f' : '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem' }}>{status.msg}</span>
          <button onClick={() => setStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 2 }}><IonIcon name="close-outline" style={{ fontSize: 16 }} /></button>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <IonIcon name="business-outline" style={{ color: 'var(--ion-color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Business Information</span>
          </div>
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Company Name" fieldKey="company" />
              {user?.role === 'carrier' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="MC Number" fieldKey="mc" placeholder="MC-000000" />
                  <Field label="DOT Number" fieldKey="dot" placeholder="DOT-000000" />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8 }}>
                <IonIcon name="location-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 18 }} />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Business Address</span>
              </div>

              <AddressAutocomplete
                value={form.business_address}
                onChange={(val) => setForm(f => ({ ...f, business_address: val }))}
                onSelect={handleAddressSelect}
                label="Street Address"
                size="small"
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="City" fieldKey="business_city" />
                <Field label="State" fieldKey="business_state" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="ZIP" fieldKey="business_zip" />
                <Field label="Country" fieldKey="business_country" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 20px', cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                  {saving ? <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} /> : <IonIcon name="save-outline" style={{ fontSize: 16 }} />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

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

export default function ManageBusiness() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <div style={{ padding: '8px 24px' }}>
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'metadata' && <MetadataTab />}
    </div>
  );
}
