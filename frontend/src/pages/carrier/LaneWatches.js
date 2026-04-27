import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonBadge, IonRippleEffect } from '@ionic/react';
import { laneWatchesApi, equipmentTypesApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

const TABS = [
  { key: 'all',    label: 'ALL' },
  { key: 'active', label: 'ACTIVE' },
  { key: 'paused', label: 'PAUSED' },
];

const EMPTY_FORM = {
  origin_city: '', origin_state: '',
  dest_city: '',   dest_state: '',
  equipment_type: '', min_rate: '', min_rpm: '',
};

const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 400, color: 'var(--ion-color-medium)', backgroundColor: 'var(--ion-background-color)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--ion-border-color)' };
const tdStyle = { padding: '10px 12px', fontSize: '0.875rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', fontFamily: 'inherit' };
const sectionLabel = { display: 'block', marginBottom: 6, color: 'var(--ion-color-medium)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

const STATUS_CHIP = {
  active: { label: 'Active', ionColor: 'success' },
  paused: { label: 'Paused', ionColor: 'medium'  },
};

function AddWatchDrawer({ open, onClose, onSaved, equipmentTypes }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
      .then(w => { onSaved(w); setForm(EMPTY_FORM); onClose(); })
      .catch(err => setError(err.message))
      .finally(() => setSaving(false));
  };

  return createPortal(
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1200 }} />}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 340, backgroundColor: 'var(--ion-card-background)', zIndex: 1201, transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ion-text-color)' }}>New Lane Watch</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
            <IonIcon name="close-outline" style={{ fontSize: 20 }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={sectionLabel}>Origin</span>
            <div style={{ marginBottom: 8 }}>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} value={form.origin_city} onChange={e => set('origin_city', e.target.value)} placeholder="e.g. Chicago" />
              <span style={{ fontSize: '0.68rem', color: 'var(--ion-color-medium)', marginTop: 3, display: 'block' }}>Leave blank to match any city</span>
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <select style={inputStyle} value={form.origin_state} onChange={e => set('origin_state', e.target.value)}>
                <option value="">Any</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={sectionLabel}>Destination</span>
            <div style={{ marginBottom: 8 }}>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} value={form.dest_city} onChange={e => set('dest_city', e.target.value)} placeholder="e.g. Atlanta" />
              <span style={{ fontSize: '0.68rem', color: 'var(--ion-color-medium)', marginTop: 3, display: 'block' }}>Leave blank to match any city</span>
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <select style={inputStyle} value={form.dest_state} onChange={e => set('dest_state', e.target.value)}>
                <option value="">Any</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={sectionLabel}>Filters (optional)</span>
            <div style={{ marginBottom: 8 }}>
              <label style={labelStyle}>Equipment Type</label>
              <select style={inputStyle} value={form.equipment_type} onChange={e => set('equipment_type', e.target.value)}>
                <option value="">Any</option>
                {equipmentTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Min Rate</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ion-color-medium)', pointerEvents: 'none' }}>$</span>
                  <input style={{ ...inputStyle, paddingLeft: 22 }} type="number" value={form.min_rate} onChange={e => set('min_rate', e.target.value)} placeholder="2000" />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Min RPM</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ion-color-medium)', pointerEvents: 'none' }}>$</span>
                  <input style={{ ...inputStyle, paddingLeft: 22, paddingRight: 30 }} type="number" value={form.min_rpm} onChange={e => set('min_rpm', e.target.value)} placeholder="2.50" />
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.68rem', color: 'var(--ion-color-medium)', pointerEvents: 'none' }}>/mi</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ margin: '12px 20px', padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--ion-border-color)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '7px 16px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving && <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} />}
            Save Watch
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

const laneLabel = (w) => {
  const from = [w.origin_city, w.origin_state].filter(Boolean).join(', ') || 'Anywhere';
  const to   = [w.dest_city,   w.dest_state  ].filter(Boolean).join(', ') || 'Anywhere';
  return { from, to };
};

export default function LaneWatches() {
  const [watches,        setWatches]        = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [spinning,       setSpinning]       = useState(false);
  const [activeTab,      setActiveTab]      = useState('all');
  const [drawerOpen,     setDrawerOpen]     = useState(false);

  const fetchData = (showSpinner = false) => {
    if (showSpinner) setSpinning(true); else setLoading(true);
    Promise.all([laneWatchesApi.list(), equipmentTypesApi.list()])
      .then(([w, eq]) => {
        setWatches(Array.isArray(w) ? w : []);
        setEquipmentTypes(Array.isArray(eq) ? eq : []);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setSpinning(false); });
  };

  useEffect(() => { fetchData(); }, []);

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

  const tabItems = useMemo(() => {
    if (activeTab === 'active') return watches.filter(w => w.active);
    if (activeTab === 'paused') return watches.filter(w => !w.active);
    return watches;
  }, [watches, activeTab]);

  const tabCounts = useMemo(() => ({
    all:    watches.length,
    active: watches.filter(w => w.active).length,
    paused: watches.filter(w => !w.active).length,
  }), [watches]);

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px 6px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: 'var(--ion-card-background)', borderRadius: 6, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ion-text-color)', letterSpacing: '-0.01em' }}>Lane Watches</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
              {loading ? 'Loading…' : `${watches.length} watch${watches.length !== 1 ? 'es' : ''} · get notified when matching loads are posted`}
            </p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600 }}
          >
            <IonIcon name="add-outline" style={{ fontSize: 16 }} /> Add Watch
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', alignItems: 'stretch', backgroundColor: 'var(--ion-card-background)', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
          <IonSegment
            value={activeTab}
            onIonChange={e => setActiveTab(String(e.detail.value))}
            style={{ '--background': 'transparent', flex: '0 0 auto' }}
          >
            {TABS.map(tab => (
              <IonSegmentButton
                key={tab.key}
                value={tab.key}
                layout="label-only"
                style={{ '--color': 'var(--ion-color-medium)', '--color-checked': 'var(--ion-text-color)', '--indicator-color': 'var(--ion-text-color)', '--border-radius': '0', '--padding-top': '0', '--padding-bottom': '0', minHeight: 46, flexShrink: 0 }}
              >
                <IonLabel style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em' }}>
                  {tab.label}
                  <span style={{ backgroundColor: 'var(--ion-background-color)', borderRadius: 4, padding: '1px 5px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--ion-color-medium)' }}>{tabCounts[tab.key] ?? 0}</span>
                </IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 12 }}>
            <button title="Refresh" onClick={() => fetchData(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.15)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <IonIcon name="refresh-outline" style={{ fontSize: 18, animation: spinning ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <IonSpinner name="crescent" />
            </div>
          ) : tabItems.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
              <IonIcon name="notifications-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                {watches.length === 0 ? 'No lane watches yet — click Add Watch to get started.' : 'No watches in this category.'}
              </span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Lane</th>
                    <th style={thStyle}>Equipment</th>
                    <th style={thStyle}>Min Rate</th>
                    <th style={thStyle}>Min RPM</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {tabItems.map(w => {
                    const { from, to } = laneLabel(w);
                    const barColor = w.active ? '#2dd36f' : '#757575';
                    return (
                      <tr key={w.id} className="ion-activatable" style={{ height: 64, position: 'relative' }}>
                        <IonRippleEffect />
                        {/* Lane — accent bar */}
                        <td style={{ ...tdStyle, position: 'relative', paddingLeft: 20, minWidth: 200 }}>
                          <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 4, backgroundColor: barColor, borderRadius: '0 2px 2px 0' }} />
                          <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                              <IonIcon name="ellipse" style={{ fontSize: 8, color: 'var(--ion-color-primary)', flexShrink: 0 }} />
                              <div style={{ width: 1.5, flex: 1, backgroundColor: 'var(--ion-border-color)', margin: '2px 0' }} />
                              <IonIcon name="square-outline" style={{ fontSize: 8, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.6 }}>{from}</span>
                              <span style={{ fontSize: '0.82rem', color: 'var(--ion-color-medium)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.6 }}>{to}</span>
                            </div>
                          </div>
                        </td>

                        <td style={{ ...tdStyle, minWidth: 120 }}>
                          <span style={{ fontSize: '0.82rem', color: w.equipment_type ? 'var(--ion-text-color)' : 'var(--ion-color-medium)' }}>
                            {w.equipment_type || 'Any'}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, minWidth: 100 }}>
                          <span style={{ fontWeight: 600, color: w.min_rate ? '#2e7d32' : 'var(--ion-color-medium)', fontSize: '0.875rem' }}>
                            {w.min_rate ? `$${Number(w.min_rate).toLocaleString()}` : '—'}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, minWidth: 100 }}>
                          <span style={{ fontWeight: 600, color: w.min_rpm ? '#0288d1' : 'var(--ion-color-medium)', fontSize: '0.875rem' }}>
                            {w.min_rpm ? `$${w.min_rpm}/mi` : '—'}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, minWidth: 100 }}>
                          {(() => { const chip = STATUS_CHIP[w.active ? 'active' : 'paused']; return (
                            <IonBadge
                              color={chip.ionColor}
                              onClick={e => { e.stopPropagation(); handleToggle(w.id, !w.active); }}
                              title={w.active ? 'Click to pause' : 'Click to activate'}
                              style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              {chip.label}
                            </IonBadge>
                          ); })()}
                        </td>

                        <td style={{ ...tdStyle, width: 48 }}>
                          <button
                            onClick={() => handleDelete(w.id)}
                            title="Delete watch"
                            style={{ width: 32, height: 32, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(211,47,47,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <IonIcon name="trash-outline" style={{ fontSize: 15 }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>

    <AddWatchDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      onSaved={w => setWatches(prev => [w, ...prev])}
      equipmentTypes={equipmentTypes}
    />

    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
