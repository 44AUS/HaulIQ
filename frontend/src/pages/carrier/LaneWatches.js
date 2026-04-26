import { useState, useEffect } from 'react';
import { IonSpinner } from '@ionic/react';
import { laneWatchesApi, equipmentTypesApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

const EMPTY_FORM = {
  origin_city: '', origin_state: '',
  dest_city: '',   dest_state: '',
  equipment_type: '', min_rate: '', min_rpm: '',
};

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

function Toggle({ checked, onChange }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 36, height: 20, flexShrink: 0, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ position: 'absolute', inset: 0, backgroundColor: checked ? '#2e7d32' : 'var(--ion-color-medium)', borderRadius: 20, transition: 'background 0.2s' }}>
        <span style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', backgroundColor: '#fff', top: 3, left: checked ? 19 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </span>
    </label>
  );
}

export default function LaneWatches() {
  const [watches, setWatches]         = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);

  useEffect(() => {
    Promise.all([laneWatchesApi.list(), equipmentTypesApi.list()])
      .then(([w, eq]) => {
        setWatches(Array.isArray(w) ? w : []);
        setEquipmentTypes(Array.isArray(eq) ? eq : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = () => {
    setSaving(true);
    setError(null);
    laneWatchesApi.create({
      origin_city:    form.origin_city.trim() || null,
      origin_state:   form.origin_state || null,
      dest_city:      form.dest_city.trim() || null,
      dest_state:     form.dest_state || null,
      equipment_type: form.equipment_type || null,
      min_rate:       form.min_rate ? parseFloat(form.min_rate) : null,
      min_rpm:        form.min_rpm  ? parseFloat(form.min_rpm)  : null,
    })
      .then(w => { setWatches(prev => [w, ...prev]); setShowForm(false); setForm(EMPTY_FORM); })
      .catch(err => setError(err.message))
      .finally(() => setSaving(false));
  };

  const handleToggle = (id, active) => {
    laneWatchesApi.update(id, { active })
      .then(updated => setWatches(prev => prev.map(w => w.id === id ? updated : w)))
      .catch(() => {});
  };

  const handleDelete = (id) => {
    laneWatchesApi.delete(id)
      .then(() => setWatches(prev => prev.filter(w => w.id !== id)))
      .catch(() => {});
  };

  const laneLabel = (w) => {
    const from = [w.origin_city, w.origin_state].filter(Boolean).join(', ') || 'Anywhere';
    const to   = [w.dest_city,   w.dest_state  ].filter(Boolean).join(', ') || 'Anywhere';
    return `${from} → ${to}`;
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--ion-text-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IonIcon name="bookmark" style={{ color: 'var(--ion-color-primary)' }} /> Lane Watchlist
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
            Get notified instantly when matching loads are posted.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600 }}
        >
          <IonIcon name="add-outline" style={{ fontSize: 16 }} /> Add Watch
        </button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
          <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>New Lane Watch</p>

          <p style={{ margin: '0 0 8px', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ion-color-medium)' }}>Origin</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Origin City</label>
              <input style={inputStyle} value={form.origin_city} onChange={e => set('origin_city', e.target.value)} placeholder="e.g. Chicago" />
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', marginTop: 2, display: 'block' }}>Leave blank to match any city</span>
            </div>
            <div style={{ width: 120 }}>
              <label style={labelStyle}>Origin State</label>
              <select style={inputStyle} value={form.origin_state} onChange={e => set('origin_state', e.target.value)}>
                <option value="">Any</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <p style={{ margin: '0 0 8px', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ion-color-medium)' }}>Destination</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Destination City</label>
              <input style={inputStyle} value={form.dest_city} onChange={e => set('dest_city', e.target.value)} placeholder="e.g. Atlanta" />
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', marginTop: 2, display: 'block' }}>Leave blank to match any city</span>
            </div>
            <div style={{ width: 120 }}>
              <label style={labelStyle}>Dest State</label>
              <select style={inputStyle} value={form.dest_state} onChange={e => set('dest_state', e.target.value)}>
                <option value="">Any</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <p style={{ margin: '0 0 8px', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ion-color-medium)' }}>Filters (optional)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Equipment Type</label>
              <select style={inputStyle} value={form.equipment_type} onChange={e => set('equipment_type', e.target.value)}>
                <option value="">Any</option>
                {equipmentTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Min Rate</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ion-color-medium)', pointerEvents: 'none' }}>$</span>
                <input style={{ ...inputStyle, paddingLeft: 22 }} type="number" value={form.min_rate} onChange={e => set('min_rate', e.target.value)} placeholder="2000" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Min RPM</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ion-color-medium)', pointerEvents: 'none' }}>$</span>
                <input style={{ ...inputStyle, paddingLeft: 22, paddingRight: 32 }} type="number" value={form.min_rpm} onChange={e => set('min_rpm', e.target.value)} placeholder="2.50" />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', color: 'var(--ion-color-medium)', pointerEvents: 'none' }}>/mi</span>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowForm(false); setError(null); }} style={{ padding: '6px 14px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving && <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} />}
              Save Watch
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <IonSpinner name="crescent" />
        </div>
      ) : watches.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px 0', textAlign: 'center' }}>
          <IonIcon name="notifications-outline" style={{ fontSize: 48, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '1.1rem', color: 'var(--ion-text-color)' }}>No lane watches yet</p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
            Add a watch above and we'll notify you the moment a matching load is posted.
          </p>
        </div>
      ) : (
        <div style={cardStyle}>
          {watches.map((w, i) => (
            <div key={w.id}>
              {i > 0 && <div style={{ borderTop: '1px solid var(--ion-border-color)' }} />}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)', display: 'block' }}>{laneLabel(w)}</span>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {w.equipment_type && (
                      <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, border: '1px solid var(--ion-border-color)', color: 'var(--ion-color-medium)' }}>{w.equipment_type}</span>
                    )}
                    {w.min_rate && (
                      <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, border: '1px solid #2e7d32', color: '#2e7d32' }}>≥ ${w.min_rate.toLocaleString()}</span>
                    )}
                    {w.min_rpm && (
                      <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, border: '1px solid #0288d1', color: '#0288d1' }}>≥ ${w.min_rpm}/mi</span>
                    )}
                    {!w.equipment_type && !w.min_rate && !w.min_rpm && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>All loads</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Toggle checked={w.active} onChange={e => handleToggle(w.id, e.target.checked)} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IonIcon name={w.active ? 'notifications-outline' : 'notifications-off-outline'} style={{ fontSize: 14, color: w.active ? '#2e7d32' : 'var(--ion-color-medium)' }} />
                    <span style={{ fontSize: '0.75rem', color: w.active ? '#2e7d32' : 'var(--ion-color-medium)' }}>{w.active ? 'Active' : 'Paused'}</span>
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(w.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 6, display: 'flex', borderRadius: 4 }}
                >
                  <IonIcon name="trash-outline" style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
        Up to 20 lane watches. Notifications appear in your bell icon.
      </p>
    </div>
  );
}
