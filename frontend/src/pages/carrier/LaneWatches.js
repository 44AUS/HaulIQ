import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  IonSpinner, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonContent, IonInput, IonSelect, IonSelectOption,
  IonSegment, IonSegmentButton, IonLabel, IonBadge, IonButton,
  IonRippleEffect, IonActionSheet, IonPopover, IonList, IonItem,
} from '@ionic/react';
import { laneWatchesApi, equipmentTypesApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';
import { useThemeMode } from '../../context/ThemeContext';

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
function RippleTd({ style, children, ...props }) {
  return <td className="ion-activatable" style={{ ...style, position: 'relative', overflow: 'hidden' }} {...props}><IonRippleEffect />{children}</td>;
}

const STATUS_CHIP = {
  active: { label: 'Active', ionColor: 'success' },
  paused: { label: 'Paused', ionColor: 'medium'  },
};

const laneLabel = (w) => {
  const from = [w.origin_city, w.origin_state].filter(Boolean).join(', ') || 'Anywhere';
  const to   = [w.dest_city,   w.dest_state  ].filter(Boolean).join(', ') || 'Anywhere';
  return { from, to };
};

export default function LaneWatches() {
  const { brandColor } = useThemeMode();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [watches,        setWatches]        = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [spinning,       setSpinning]       = useState(false);
  const [activeTab,      setActiveTab]      = useState('all');
  const [modalOpen,      setModalOpen]      = useState(false);
  const [findLoadsSheet, setFindLoadsSheet] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [tabDropdownOpen, setTabDropdownOpen] = useState(false);

  const [form,   setForm]   = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 640); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);

  const openModal = () => { setForm(EMPTY_FORM); setError(null); setModalOpen(true); };

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openModal();
      setSearchParams({}, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      .then(w => { setWatches(prev => [w, ...prev]); setModalOpen(false); })
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
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', alignItems: 'stretch', backgroundColor: 'var(--ion-card-background)', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
          {isMobile ? (
            <>
              <div id="lw-tab-dropdown-trigger" onClick={() => setTabDropdownOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 46, cursor: 'pointer', flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ion-text-color)' }}>{TABS.find(t => t.key === activeTab)?.label}</span>
                <span style={{ backgroundColor: 'var(--ion-background-color)', borderRadius: 4, padding: '1px 5px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--ion-color-medium)' }}>{tabCounts[activeTab] ?? 0}</span>
                <IonIcon name="chevron-down-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)', marginLeft: 2 }} />
              </div>
              <IonPopover isOpen={tabDropdownOpen} onDidDismiss={() => setTabDropdownOpen(false)} trigger="lw-tab-dropdown-trigger" style={{ '--width': '200px', '--border-radius': '10px' }}>
                <IonList lines="none">
                  {TABS.map(tab => (
                    <IonItem key={tab.key} button detail={false} onClick={() => { setActiveTab(tab.key); setTabDropdownOpen(false); }} style={{ '--background': tab.key === activeTab ? 'var(--ion-color-step-100)' : 'transparent', '--padding-start': '16px', '--padding-end': '16px' }}>
                      <IonLabel style={{ fontSize: '0.875rem', fontWeight: tab.key === activeTab ? 700 : 500 }}>{tab.label}</IonLabel>
                      <span slot="end" style={{ backgroundColor: 'var(--ion-background-color)', borderRadius: 4, padding: '1px 5px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--ion-color-medium)' }}>{tabCounts[tab.key] ?? 0}</span>
                    </IonItem>
                  ))}
                </IonList>
              </IonPopover>
            </>
          ) : (
            <IonSegment scrollable={true} value={activeTab} onIonChange={e => setActiveTab(String(e.detail.value))} style={{ '--background': 'transparent', flex: 1 }}>
              {TABS.map(tab => (
                <IonSegmentButton key={tab.key} value={tab.key} layout="label-only" style={{ '--color': 'var(--ion-color-medium)', '--color-checked': 'var(--ion-text-color)', '--indicator-color': 'var(--ion-text-color)', '--border-radius': '0', '--padding-top': '0', '--padding-bottom': '0', minHeight: 46, flexShrink: 0 }}>
                  <IonLabel style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    {tab.label}
                    <span style={{ backgroundColor: 'var(--ion-background-color)', borderRadius: 4, padding: '1px 5px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--ion-color-medium)' }}>{tabCounts[tab.key] ?? 0}</span>
                  </IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>
          )}
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 12, flexShrink: 0 }}>
            <IonButton fill="clear" shape="round" color="medium" onClick={() => fetchData(true)} title="Refresh">
              <IonIcon slot="icon-only" name="refresh-outline" style={{ animation: spinning ? 'spin 0.8s linear infinite' : 'none' }} />
            </IonButton>
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
                {watches.length === 0 ? 'No lane watches yet — use Find to add one.' : 'No watches in this category.'}
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
                      <tr key={w.id} style={{ height: 64 }}>
                        <RippleTd style={{ ...tdStyle, position: 'relative', paddingLeft: 20, minWidth: 200 }}>
                          <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 3, backgroundColor: barColor }} />
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
                        </RippleTd>

                        <RippleTd style={{ ...tdStyle, minWidth: 120 }}>
                          <span style={{ fontSize: '0.82rem', color: w.equipment_type ? 'var(--ion-text-color)' : 'var(--ion-color-medium)' }}>
                            {w.equipment_type || 'Any'}
                          </span>
                        </RippleTd>

                        <RippleTd style={{ ...tdStyle, minWidth: 100 }}>
                          <span style={{ fontWeight: 600, color: w.min_rate ? 'var(--ion-color-success)' : 'var(--ion-color-medium)', fontSize: '0.875rem' }}>
                            {w.min_rate ? `$${Number(w.min_rate).toLocaleString()}` : '—'}
                          </span>
                        </RippleTd>

                        <RippleTd style={{ ...tdStyle, minWidth: 100 }}>
                          <span style={{ fontWeight: 600, color: w.min_rpm ? '#0288d1' : 'var(--ion-color-medium)', fontSize: '0.875rem' }}>
                            {w.min_rpm ? `$${w.min_rpm}/mi` : '—'}
                          </span>
                        </RippleTd>

                        <RippleTd style={{ ...tdStyle, minWidth: 100 }}>
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
                        </RippleTd>

                        <RippleTd style={{ ...tdStyle, width: 48 }}>
                          <IonButton fill="clear" shape="round" color="danger" onClick={() => handleDelete(w.id)} title="Delete watch">
                            <IonIcon slot="icon-only" name="trash-outline" />
                          </IonButton>
                        </RippleTd>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', flexShrink: 0 }}>
        <IonButton onClick={() => setFindLoadsSheet(true)} style={{ '--background': brandColor, '--background-activated': brandColor, '--background-hover': brandColor, '--border-color': brandColor, '--box-shadow': '0 4px 16px rgba(0,0,0,0.22)' }}>
          <IonIcon slot="start" name="add-outline" /> Find
        </IonButton>
      </div>
    </div>

    {/* Add Lane Watch Modal */}
    <IonModal isOpen={modalOpen} onDidDismiss={() => setModalOpen(false)} className="lane-watch-modal">
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--ion-card-background)', '--color': 'var(--ion-text-color)' }}>
          <IonButtons slot="start">
            <IonButton fill="clear" shape="round" onClick={() => setModalOpen(false)}>
              <IonIcon slot="icon-only" name="close-outline" style={{ color: 'var(--ion-text-color)' }} />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>New Lane Watch</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" shape="round" onClick={handleCreate} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
              {saving
                ? <IonSpinner name="crescent" style={{ width: 20, height: 20, color: 'var(--ion-color-success)' }} />
                : <IonIcon slot="icon-only" name="checkmark-outline" style={{ color: 'var(--ion-color-success)' }} />}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {error && (
          <div style={{ margin: '12px 16px 0', padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>

          {/* Lane card */}
          <div style={{ backgroundColor: 'var(--ion-card-background)', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ion-text-color)' }}>Lane</span>

            <IonInput
              fill="outline"
              label="Origin City"
              labelPlacement="stacked"
              value={form.origin_city}
              onIonInput={e => set('origin_city', e.detail.value ?? '')}
              placeholder="e.g. Chicago"
              style={{ '--highlight-color-focused': 'var(--ion-color-success)' }}
            />
            <IonSelect
              fill="outline"
              label="Origin State"
              labelPlacement="stacked"
              value={form.origin_state}
              onIonChange={e => set('origin_state', e.detail.value)}
              placeholder="Any"
              style={{ '--highlight-color-focused': 'var(--ion-color-success)' }}
            >
              <IonSelectOption value="">Any</IonSelectOption>
              {US_STATES.map(s => <IonSelectOption key={s} value={s}>{s}</IonSelectOption>)}
            </IonSelect>

            <IonInput
              fill="outline"
              label="Destination City"
              labelPlacement="stacked"
              value={form.dest_city}
              onIonInput={e => set('dest_city', e.detail.value ?? '')}
              placeholder="e.g. Atlanta"
              style={{ '--highlight-color-focused': 'var(--ion-color-success)' }}
            />
            <IonSelect
              fill="outline"
              label="Destination State"
              labelPlacement="stacked"
              value={form.dest_state}
              onIonChange={e => set('dest_state', e.detail.value)}
              placeholder="Any"
              style={{ '--highlight-color-focused': 'var(--ion-color-success)' }}
            >
              <IonSelectOption value="">Any</IonSelectOption>
              {US_STATES.map(s => <IonSelectOption key={s} value={s}>{s}</IonSelectOption>)}
            </IonSelect>
          </div>

          {/* Filters card */}
          <div style={{ backgroundColor: 'var(--ion-card-background)', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ion-text-color)' }}>Filters</span>

            <IonSelect
              fill="outline"
              label="Equipment Type"
              labelPlacement="stacked"
              value={form.equipment_type}
              onIonChange={e => set('equipment_type', e.detail.value)}
              placeholder="Any"
              style={{ '--highlight-color-focused': 'var(--ion-color-success)' }}
            >
              <IonSelectOption value="">Any</IonSelectOption>
              {equipmentTypes.map(t => <IonSelectOption key={t.id} value={t.name}>{t.name}</IonSelectOption>)}
            </IonSelect>

            <IonInput
              fill="outline"
              label="Min Rate ($)"
              labelPlacement="stacked"
              type="number"
              min={0}
              value={form.min_rate}
              onIonInput={e => set('min_rate', e.detail.value ?? '')}
              placeholder="e.g. 2000"
              style={{ '--highlight-color-focused': 'var(--ion-color-success)' }}
            />

            <IonInput
              fill="outline"
              label="Min RPM ($/mile)"
              labelPlacement="stacked"
              type="number"
              min={0}
              step={0.01}
              value={form.min_rpm}
              onIonInput={e => set('min_rpm', e.detail.value ?? '')}
              placeholder="e.g. 2.50"
              style={{ '--highlight-color-focused': 'var(--ion-color-success)' }}
            />
          </div>

        </div>
      </IonContent>
    </IonModal>

    <IonActionSheet
      mode="ios"
      translucent={false}
      cssClass="find-loads-sheet"
      isOpen={findLoadsSheet}
      onDidDismiss={() => setFindLoadsSheet(false)}
      buttons={[
        { text: 'What are these and how are they different?', cssClass: 'what-are-these-things-btn' },
        { text: 'What are these and how are they different?', cssClass: 'what-are-these-things-btn' },
        { text: 'Post a Truck', icon: 'add-circle-outline', handler: () => navigate('/carrier/equipment?action=post') },
        { text: 'Add Lane Watch', icon: 'eye-outline', handler: () => openModal() },
        { text: 'Browse Load Board', icon: 'albums-outline', handler: () => navigate('/carrier/loads') },
        { text: 'Cancel', role: 'cancel', icon: 'close-outline' },
      ]}
    />

    <style>{`
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .lane-watch-modal { --border-radius: 0px; }
      @media (min-width: 768px) {
        .lane-watch-modal { --width: 560px; --max-height: 90vh; }
      }
    `}</style>
    </>
  );
}
