import { useState, useEffect, useCallback, useMemo } from 'react';
import { useThemeMode } from '../../context/ThemeContext';
import {
  IonSpinner, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonFooter, IonList, IonItem, IonLabel, IonInput, IonSelect,
  IonSelectOption, IonTextarea, IonNote, IonDatetime, IonSegment, IonSegmentButton, IonBadge, IonActionSheet,
} from '@ionic/react';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import { truckPostsApi, equipmentClassesApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const TABS = [
  { key: 'all',      label: 'ALL' },
  { key: 'active',   label: 'ACTIVE' },
  { key: 'expired',  label: 'EXPIRED' },
  { key: 'inactive', label: 'INACTIVE' },
];

const STATUS_CHIP = {
  active:   { label: 'Active',   ionColor: 'success' },
  expired:  { label: 'Expired',  ionColor: 'danger'  },
  inactive: { label: 'Inactive', ionColor: 'medium'  },
};

const STATUS_BAR = {
  active:   '#2dd36f',
  expired:  '#eb445a',
  inactive: '#616161',
};

const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ion-color-medium)', backgroundColor: 'var(--ion-background-color)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '0 12px', fontSize: '0.875rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', height: 64, verticalAlign: 'middle' };

function deriveStatus(post) {
  if (!post.is_active) return 'inactive';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const to = post.available_to ? new Date(post.available_to + 'T00:00:00') : null;
  if (to && to < today) return 'expired';
  return 'active';
}

const fmtDate = (s) => {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const emptyForm = () => ({
  equipment_class: '',
  equipment_type: '',
  trailer_length: '',
  weight_capacity: '',
  current_location: '',
  preferred_origin: '',
  preferred_destination: '',
  available_from: '',
  available_to: '',
  rate_expectation: '',
  notes: '',
});

export default function Equipment() {
  const { brandColor } = useThemeMode();
  const [posts,          setPosts]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [spinning,       setSpinning]       = useState(false);
  const [equipmentClasses, setEquipmentClasses] = useState([]);
  const [activeTab,      setActiveTab]      = useState('all');
  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [postSheet,      setPostSheet]      = useState(false);
  const [editPost,       setEditPost]       = useState(null);
  const [isRepost,       setIsRepost]       = useState(false);
  const [form,           setForm]           = useState({});
  const [saving,         setSaving]         = useState(false);
  const [deleteId,       setDeleteId]       = useState(null);
  const [error,          setError]          = useState('');
  const [dateModalOpen,  setDateModalOpen]  = useState(false);
  const [activeDateTab,  setActiveDateTab]  = useState('from');
  const [tempFrom,       setTempFrom]       = useState('');
  const [tempTo,         setTempTo]         = useState('');

  const fetchPosts = useCallback((spinner = false) => {
    if (spinner) setSpinning(true); else setLoading(true);
    truckPostsApi.mine()
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([]))
      .finally(() => { setLoading(false); setSpinning(false); });
  }, []);

  useEffect(() => {
    equipmentClassesApi.list().then(d => setEquipmentClasses(Array.isArray(d) ? d : [])).catch(() => {});
    fetchPosts();
  }, [fetchPosts]);

  const enriched = useMemo(() => posts.map(p => ({ ...p, _status: deriveStatus(p) })), [posts]);

  const tabItems = useMemo(() => {
    if (activeTab === 'all') return enriched;
    return enriched.filter(p => p._status === activeTab);
  }, [enriched, activeTab]);

  const tabCounts = useMemo(() => {
    const c = { all: enriched.length };
    TABS.slice(1).forEach(t => { c[t.key] = enriched.filter(p => p._status === t.key).length; });
    return c;
  }, [enriched]);

  const findClassForType = (typeName) => {
    for (const cls of equipmentClasses) {
      if (cls.equipment_types.some(t => t.name === typeName)) return cls.name;
    }
    return '';
  };

  const openCreate = () => {
    setEditPost(null); setIsRepost(false);
    setForm(emptyForm()); setError(''); setDialogOpen(true);
  };

  const openEdit = (post) => {
    setEditPost(post); setIsRepost(false);
    setForm({
      equipment_class:       findClassForType(post.equipment_type || ''),
      equipment_type:        post.equipment_type || '',
      trailer_length:        post.trailer_length ?? '',
      weight_capacity:       post.weight_capacity ?? '',
      current_location:      post.current_location || '',
      preferred_origin:      post.preferred_origin || '',
      preferred_destination: post.preferred_destination || '',
      available_from:        post.available_from || '',
      available_to:          post.available_to || '',
      rate_expectation:      post.rate_expectation ?? '',
      notes:                 post.notes || '',
    });
    setError(''); setDialogOpen(true);
  };

  const openRepost = (post) => {
    setEditPost(null); setIsRepost(true);
    setForm({
      equipment_class:       findClassForType(post.equipment_type || ''),
      equipment_type:        post.equipment_type || '',
      trailer_length:        post.trailer_length ?? '',
      weight_capacity:       post.weight_capacity ?? '',
      current_location:      post.current_location || '',
      preferred_origin:      post.preferred_origin || '',
      preferred_destination: post.preferred_destination || '',
      available_from:        '',
      available_to:          '',
      rate_expectation:      post.rate_expectation ?? '',
      notes:                 post.notes || '',
    });
    setError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.equipment_class || !form.equipment_type || !form.current_location || !form.available_from || !form.available_to) {
      setError('Equipment class, type, current location, and availability dates are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const body = {
        equipment_type:        form.equipment_type,
        current_location:      form.current_location,
        available_from:        form.available_from,
        available_to:          form.available_to,
        trailer_length:        form.trailer_length    ? parseInt(form.trailer_length, 10)    : null,
        weight_capacity:       form.weight_capacity   ? parseInt(form.weight_capacity, 10)   : null,
        preferred_origin:      form.preferred_origin  || null,
        preferred_destination: form.preferred_destination || null,
        rate_expectation:      form.rate_expectation  ? parseFloat(form.rate_expectation)    : null,
        notes:                 form.notes             || null,
      };
      if (editPost) await truckPostsApi.update(editPost.id, body);
      else          await truckPostsApi.create(body);
      setDialogOpen(false);
      fetchPosts(true);
    } catch (e) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (e, post) => {
    e.stopPropagation();
    try { await truckPostsApi.update(post.id, { is_active: !post.is_active }); fetchPosts(true); } catch (_) {}
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await truckPostsApi.remove(deleteId); setDeleteId(null); fetchPosts(true); } catch (_) {}
  };

  const setField = (field) => (e) => setForm(f => ({ ...f, [field]: e.detail?.value ?? e.target?.value ?? '' }));

  const openDatePicker = (tab) => {
    setActiveDateTab(tab);
    setTempFrom(form.available_from || '');
    setTempTo(form.available_to || '');
    setDateModalOpen(true);
  };

  const confirmDates = () => {
    const strip = (v) => v ? (v.includes('T') ? v.split('T')[0] : v) : '';
    setForm(f => ({ ...f, available_from: strip(tempFrom), available_to: strip(tempTo) }));
    setDateModalOpen(false);
  };

  const fmtDateTime = (iso) => {
    if (!iso) return 'Tap to select…';
    const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const hasTime = iso.includes('T') && !iso.endsWith('T00:00:00');
    const time = hasTime ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : null;
    return time ? `${date} · ${time}` : date;
  };

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px 6px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: 'var(--ion-card-background)', borderRadius: 6, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', flexShrink: 0 }}>
        <div>
          <h2 style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ion-text-color)', letterSpacing: '-0.01em' }}>My Equipment</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
            Post your available trucks so brokers can find and contact you.
          </p>
        </div>
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
          <IonButton fill="clear" shape="round" onClick={() => fetchPosts(true)} title="Refresh">
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
            <IonIcon name="car-sport-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)' }} />
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No trucks in this category.</p>
            {activeTab === 'all' && (
              <IonButton fill="outline" onClick={openCreate} style={{ '--color': brandColor, '--border-color': brandColor }}>
                <IonIcon slot="start" name="add-outline" /> Post Your First Truck
              </IonButton>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, minWidth: 150 }}>Equipment</th>
                <th style={{ ...thStyle, minWidth: 160 }}>Location</th>
                <th style={{ ...thStyle, minWidth: 200 }}>Available</th>
                <th style={{ ...thStyle, minWidth: 160 }}>Preferred Lane</th>
                <th style={{ ...thStyle, minWidth: 100 }}>Rate Exp.</th>
                <th style={{ ...thStyle, minWidth: 110, width: 110 }}>Status</th>
                <th style={{ ...thStyle, minWidth: 110, width: 110 }} />
              </tr>
            </thead>
            <tbody>
              {tabItems.map((post) => {
                const chip     = STATUS_CHIP[post._status] || { label: post._status, ionColor: 'medium' };
                const barColor = STATUS_BAR[post._status]  || '#9e9e9e';
                return (
                  <tr key={post.id} style={{ height: 64 }}>
                    {/* Equipment */}
                    <td style={{ ...tdStyle, minWidth: 150 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.equipment_type}</div>
                      {(post.trailer_length || post.weight_capacity) && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
                          {[post.trailer_length && `${post.trailer_length} ft`, post.weight_capacity && `${Number(post.weight_capacity).toLocaleString()} lbs`].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>

                    <td style={{ ...tdStyle, minWidth: 160 }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 160 }}>{post.current_location || '—'}</span>
                    </td>

                    {/* Available dates — accent bar */}
                    <td style={{ ...tdStyle, paddingLeft: 0, position: 'relative', minWidth: 200, whiteSpace: 'nowrap' }}>
                      <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 3, backgroundColor: barColor }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', paddingLeft: 12 }}>
                        {fmtDate(post.available_from)} — {fmtDate(post.available_to)}
                      </span>
                    </td>

                    <td style={{ ...tdStyle, minWidth: 160 }}>
                      {post.preferred_origin || post.preferred_destination ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 160 }}>
                          {[post.preferred_origin, post.preferred_destination].filter(Boolean).join(' → ')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>—</span>
                      )}
                    </td>

                    <td style={{ ...tdStyle, minWidth: 100 }}>
                      <span style={{ fontWeight: 600, color: post.rate_expectation ? '#2e7d32' : 'var(--ion-color-medium)' }}>
                        {post.rate_expectation ? `$${post.rate_expectation.toFixed(2)}/mi` : 'Negotiable'}
                      </span>
                    </td>

                    <td style={{ ...tdStyle, width: 110, minWidth: 110 }}>
                      <IonBadge
                        color={chip.ionColor}
                        onClick={e => handleToggleActive(e, post)}
                        title={post.is_active ? 'Click to deactivate' : 'Click to activate'}
                        style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {chip.label}
                      </IonBadge>
                    </td>

                    <td style={{ ...tdStyle, width: 110, minWidth: 110, paddingRight: 8 }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IonButton fill="clear" shape="round" size="small" title="Repost with new dates" onClick={() => openRepost(post)}>
                          <IonIcon slot="icon-only" name="reload-outline" />
                        </IonButton>
                        <IonButton fill="clear" shape="round" size="small" title="Edit" onClick={() => openEdit(post)}>
                          <IonIcon slot="icon-only" name="create-outline" />
                        </IonButton>
                        <IonButton fill="clear" shape="round" size="small" color="danger" title="Delete" onClick={() => setDeleteId(post.id)}>
                          <IonIcon slot="icon-only" name="trash-outline" />
                        </IonButton>
                        <IonIcon name="chevron-forward-outline" style={{ fontSize: 16, color: 'var(--ion-color-medium)' }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Post Truck button */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', flexShrink: 0 }}>
        <IonButton onClick={() => setPostSheet(true)} style={{ '--background': brandColor, '--background-activated': brandColor, '--background-hover': brandColor, '--border-color': brandColor, '--box-shadow': '0 4px 16px rgba(0,0,0,0.22)' }}>
          <IonIcon slot="start" name="add-outline" /> Post Truck
        </IonButton>
      </div>

      <IonActionSheet
        isOpen={postSheet}
        onDidDismiss={() => setPostSheet(false)}
        header="Post Equipment"
        buttons={[
          {
            text: 'Post a New Truck',
            icon: 'add-circle-outline',
            handler: () => openCreate(),
          },
          {
            text: 'Cancel',
            role: 'cancel',
            icon: 'close-outline',
          },
        ]}
      />

    </div>
    {/* Date / Time Picker Modal */}
    <IonModal isOpen={dateModalOpen} onDidDismiss={() => setDateModalOpen(false)} className="date-picker-modal">
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--ion-card-background)', '--color': 'var(--ion-text-color)' }}>
          <IonButtons slot="start">
            <IonButton fill="clear" shape="round" onClick={() => setDateModalOpen(false)}>
              <IonIcon slot="icon-only" name="close-outline" />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>Select Dates</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" shape="round" onClick={confirmDates} style={{ '--color': '#2dd36f' }}>
              <IonIcon slot="icon-only" name="checkmark-outline" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonSegment value={activeDateTab} onIonChange={e => setActiveDateTab(e.detail.value)} style={{ margin: '12px 16px' }}>
          <IonSegmentButton value="from">
            <IonLabel>
              Available From
              {tempFrom && <div style={{ fontSize: '0.65rem', marginTop: 2, opacity: 0.7 }}>{fmtDateTime(tempFrom)}</div>}
            </IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="to">
            <IonLabel>
              Available To
              {tempTo && <div style={{ fontSize: '0.65rem', marginTop: 2, opacity: 0.7 }}>{fmtDateTime(tempTo)}</div>}
            </IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {activeDateTab === 'from' ? (
          <IonDatetime
            key="picker-from"
            presentation="date-time"
            value={tempFrom || undefined}
            onIonChange={e => {
              const v = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
              setTempFrom(v);
            }}
            style={{ margin: '0 auto' }}
          />
        ) : (
          <IonDatetime
            key="picker-to"
            presentation="date-time"
            value={tempTo || undefined}
            min={tempFrom ? tempFrom.split('T')[0] : undefined}
            onIonChange={e => {
              const v = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
              setTempTo(v);
            }}
            style={{ margin: '0 auto' }}
          />
        )}
      </IonContent>
    </IonModal>

    <style>{`
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .equipment-post-modal { --border-radius: 0px; }
      @media (min-width: 768px) {
        .equipment-post-modal { --width: 560px; --max-height: 90vh; }
      }
      .date-picker-modal { --border-radius: 0px; }
      @media (min-width: 768px) {
        .date-picker-modal { --width: 420px; --max-height: 90vh; }
      }
      .alert-radio-label, .alert-checkbox-label, .alert-radio-group button, .alert-button-inner {
        color: var(--ion-text-color) !important;
      }
      .equipment-post-modal ion-list {
        box-shadow: 0 4px 24px rgba(0,0,0,0.18);
        border-radius: 6px;
      }
    `}</style>
    </div>

    {/* Create / Edit / Repost Modal */}
    <IonModal isOpen={dialogOpen} onDidDismiss={() => setDialogOpen(false)} className="equipment-post-modal">
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--ion-card-background)', '--color': 'var(--ion-text-color)' }}>
          <IonButtons slot="start">
            <IonButton fill="clear" shape="round" onClick={() => setDialogOpen(false)}>
              <IonIcon slot="icon-only" name="close-outline" />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>{isRepost ? 'Repost Truck' : editPost ? 'Edit Truck Posting' : 'Post a Truck'}</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" shape="round" onClick={handleSave} disabled={saving} style={{ '--color': '#2dd36f', opacity: saving ? 0.6 : 1 }}>
              {saving ? <IonSpinner name="crescent" style={{ width: 20, height: 20, color: '#2dd36f' }} /> : <IonIcon slot="icon-only" name="checkmark-outline" />}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {error && (
          <div style={{ margin: '12px 16px 0', padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>
        )}
        {isRepost && (
          <div style={{ margin: '12px 16px 0', padding: '10px 14px', backgroundColor: 'rgba(2,136,209,0.08)', border: '1px solid rgba(2,136,209,0.3)', borderRadius: 6, color: '#0288d1', fontSize: '0.875rem' }}>
            Same equipment and specs pre-filled — just update your availability dates.
          </div>
        )}

        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Equipment Class <span style={{ color: '#d32f2f' }}>*</span></IonLabel>
            <IonSelect
              value={form.equipment_class || ''}
              onIonChange={e => setForm(f => ({ ...f, equipment_class: e.detail.value, equipment_type: '' }))}
              placeholder="Select class"
            >
              {equipmentClasses.map(c => <IonSelectOption key={c.id} value={c.name}>{c.name}</IonSelectOption>)}
            </IonSelect>
          </IonItem>

          <IonItem style={{ opacity: form.equipment_class ? 1 : 0.4, pointerEvents: form.equipment_class ? 'auto' : 'none' }}>
            <IonLabel position="stacked">Equipment Type <span style={{ color: '#d32f2f' }}>*</span></IonLabel>
            <IonSelect
              value={form.equipment_type || ''}
              onIonChange={setField('equipment_type')}
              placeholder={form.equipment_class ? 'Select type' : 'Select a class first'}
              disabled={!form.equipment_class}
            >
              {(equipmentClasses.find(c => c.name === form.equipment_class)?.equipment_types || [])
                .map(t => <IonSelectOption key={t.id} value={t.name}>{t.name}</IonSelectOption>)}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Trailer Length (ft)</IonLabel>
            <IonInput type="number" min={0} value={form.trailer_length} onIonChange={setField('trailer_length')} placeholder="e.g. 53" />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Weight Capacity (lbs)</IonLabel>
            <IonInput type="number" min={0} value={form.weight_capacity} onIonChange={setField('weight_capacity')} placeholder="e.g. 45000" />
          </IonItem>
        </IonList>

        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Current Location <span style={{ color: '#d32f2f' }}>*</span></IonLabel>
            <AddressAutocomplete
              placeholder="e.g. Dallas, TX"
              value={form.current_location}
              onChange={({ cityState, address }) => setForm(f => ({ ...f, current_location: cityState || address || '' }))}
              style={{ border: 'none', borderRadius: 0, backgroundColor: 'transparent', padding: '10px 0', fontSize: '1rem' }}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Preferred Origin</IonLabel>
            <AddressAutocomplete
              placeholder="e.g. Chicago, IL"
              value={form.preferred_origin}
              onChange={({ cityState, address }) => setForm(f => ({ ...f, preferred_origin: cityState || address || '' }))}
              style={{ border: 'none', borderRadius: 0, backgroundColor: 'transparent', padding: '10px 0', fontSize: '1rem' }}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Preferred Destination</IonLabel>
            <AddressAutocomplete
              placeholder="e.g. Atlanta, GA"
              value={form.preferred_destination}
              onChange={({ cityState, address }) => setForm(f => ({ ...f, preferred_destination: cityState || address || '' }))}
              style={{ border: 'none', borderRadius: 0, backgroundColor: 'transparent', padding: '10px 0', fontSize: '1rem' }}
            />
          </IonItem>
        </IonList>

        <IonList inset>
          <IonItem button detail={false} onClick={() => openDatePicker('from')}>
            <IonLabel position="stacked">Available From <span style={{ color: '#d32f2f' }}>*</span></IonLabel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 0' }}>
              <span style={{ fontSize: '1rem', color: form.available_from ? 'var(--ion-text-color)' : 'var(--ion-color-medium)' }}>
                {fmtDateTime(form.available_from)}
              </span>
              <IonIcon name="calendar-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
            </div>
          </IonItem>

          <IonItem button detail={false} onClick={() => openDatePicker('to')}>
            <IonLabel position="stacked">Available To <span style={{ color: '#d32f2f' }}>*</span></IonLabel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 0' }}>
              <span style={{ fontSize: '1rem', color: form.available_to ? 'var(--ion-text-color)' : 'var(--ion-color-medium)' }}>
                {fmtDateTime(form.available_to)}
              </span>
              <IonIcon name="calendar-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
            </div>
          </IonItem>
        </IonList>

        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Rate Expectation ($/mile)</IonLabel>
            <IonInput type="number" min={0} step={0.01} value={form.rate_expectation} onIonChange={setField('rate_expectation')} placeholder="Optional — leave blank if negotiable" />
            <IonNote slot="helper">Leave blank to show as negotiable to brokers</IonNote>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Notes</IonLabel>
            <IonTextarea rows={3} value={form.notes} onIonChange={setField('notes')} placeholder="Any additional details…" autoGrow />
          </IonItem>
        </IonList>
      </IonContent>

    </IonModal>

    {/* Delete Confirm Modal */}
    <IonModal isOpen={Boolean(deleteId)} onDidDismiss={() => setDeleteId(null)} style={{ '--width': '360px', '--border-radius': '0px', '--height': 'auto' }}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Delete Posting?</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <p style={{ margin: '16px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
          This will permanently remove this truck posting. Brokers will no longer be able to find it.
        </p>
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <IonButtons slot="end" style={{ paddingRight: 8 }}>
            <IonButton onClick={() => setDeleteId(null)}>Cancel</IonButton>
            <IonButton onClick={handleDelete} fill="solid" color="danger" style={{ '--border-radius': '6px' }}>Delete</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonFooter>
    </IonModal>
    </>
  );
}
