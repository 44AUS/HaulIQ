import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IonSpinner, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonFooter, IonList, IonItem, IonLabel, IonInput, IonSelect,
  IonSelectOption, IonTextarea, IonNote,
} from '@ionic/react';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import { truckPostsApi, equipmentTypesApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const TABS = [
  { key: 'all',      label: 'ALL' },
  { key: 'active',   label: 'ACTIVE' },
  { key: 'expired',  label: 'EXPIRED' },
  { key: 'inactive', label: 'INACTIVE' },
];

const STATUS_CHIP = {
  active:   { label: 'Active',   bg: '#2dd36f', color: '#fff' },
  expired:  { label: 'Expired',  bg: '#eb445a', color: '#fff' },
  inactive: { label: 'Inactive', bg: '#757575', color: '#fff' },
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

const emptyForm = (equipmentTypes) => ({
  equipment_type: equipmentTypes[0]?.name || '',
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
  const [posts,          setPosts]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [spinning,       setSpinning]       = useState(false);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [activeTab,      setActiveTab]      = useState('all');
  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [editPost,       setEditPost]       = useState(null);
  const [isRepost,       setIsRepost]       = useState(false);
  const [form,           setForm]           = useState({});
  const [saving,         setSaving]         = useState(false);
  const [deleteId,       setDeleteId]       = useState(null);
  const [error,          setError]          = useState('');

  const fetchPosts = useCallback((spinner = false) => {
    if (spinner) setSpinning(true); else setLoading(true);
    truckPostsApi.mine()
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([]))
      .finally(() => { setLoading(false); setSpinning(false); });
  }, []);

  useEffect(() => {
    equipmentTypesApi.list().then(d => setEquipmentTypes(Array.isArray(d) ? d : [])).catch(() => {});
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

  const openCreate = () => {
    setEditPost(null); setIsRepost(false);
    setForm(emptyForm(equipmentTypes)); setError(''); setDialogOpen(true);
  };

  const openEdit = (post) => {
    setEditPost(post); setIsRepost(false);
    setForm({
      equipment_type:        post.equipment_type || equipmentTypes[0]?.name || '',
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
      equipment_type:        post.equipment_type || equipmentTypes[0]?.name || '',
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
    if (!form.equipment_type || !form.current_location || !form.available_from || !form.available_to) {
      setError('Equipment type, current location, and availability dates are required.'); return;
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
      <div style={{ display: 'flex', alignItems: 'stretch', backgroundColor: 'var(--ion-card-background)', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count    = tabCounts[tab.key] ?? 0;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', cursor: 'pointer', flexShrink: 0, border: 'none', borderBottom: isActive ? '2px solid var(--ion-text-color)' : '2px solid transparent', backgroundColor: 'transparent', color: isActive ? 'var(--ion-text-color)' : 'var(--ion-color-medium)', opacity: isActive ? 1 : 0.6, fontFamily: 'inherit', transition: 'opacity 0.15s' }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>{tab.label}</span>
              <span style={{ backgroundColor: 'var(--ion-background-color)', borderRadius: 4, padding: '1px 5px', minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--ion-color-medium)', lineHeight: 1.4 }}>{count}</span>
              </span>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', paddingRight: 12 }}>
          <button title="Refresh" onClick={() => fetchPosts(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.15)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
            <IonIcon name="car-sport-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)' }} />
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No trucks in this category.</p>
            {activeTab === 'all' && (
              <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1px solid var(--ion-color-primary)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-color-primary)', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600 }}>
                <IonIcon name="add-outline" style={{ fontSize: 16 }} /> Post Your First Truck
              </button>
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
                const chip     = STATUS_CHIP[post._status] || { label: post._status, bg: '#9e9e9e', color: '#fff' };
                const barColor = STATUS_BAR[post._status]  || '#9e9e9e';
                return (
                  <tr key={post.id} style={{ height: 64 }}>
                    {/* Equipment — accent bar */}
                    <td style={{ ...tdStyle, paddingLeft: 0, position: 'relative', minWidth: 150 }}>
                      <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 4, backgroundColor: barColor, borderRadius: '0 2px 2px 0' }} />
                      <div style={{ paddingLeft: 16 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.equipment_type}</div>
                        {(post.trailer_length || post.weight_capacity) && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
                            {[post.trailer_length && `${post.trailer_length} ft`, post.weight_capacity && `${Number(post.weight_capacity).toLocaleString()} lbs`].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                    </td>

                    <td style={{ ...tdStyle, minWidth: 160 }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 160 }}>{post.current_location || '—'}</span>
                    </td>

                    <td style={{ ...tdStyle, minWidth: 200, whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>
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
                      <span
                        onClick={e => handleToggleActive(e, post)}
                        title={post.is_active ? 'Click to deactivate' : 'Click to activate'}
                        style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: chip.bg, color: chip.color, cursor: 'pointer' }}
                      >
                        {chip.label}
                      </span>
                    </td>

                    <td style={{ ...tdStyle, width: 110, minWidth: 110, paddingRight: 8 }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button title="Repost with new dates" onClick={() => openRepost(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex', borderRadius: 4 }}>
                          <IonIcon name="reload-outline" style={{ fontSize: 15 }} />
                        </button>
                        <button title="Edit" onClick={() => openEdit(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex', borderRadius: 4 }}>
                          <IonIcon name="create-outline" style={{ fontSize: 15 }} />
                        </button>
                        <button title="Delete" onClick={() => setDeleteId(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex', borderRadius: 4 }}>
                          <IonIcon name="trash-outline" style={{ fontSize: 15 }} />
                        </button>
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
        <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: '0 4px 16px rgba(0,0,0,0.22)' }}>
          <IonIcon name="add-outline" style={{ fontSize: 17 }} /> Post Truck
        </button>
      </div>

    </div>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>

    {/* Create / Edit / Repost Modal */}
    <IonModal isOpen={dialogOpen} onDidDismiss={() => setDialogOpen(false)} style={{ '--width': '560px', '--max-height': '90vh', '--border-radius': '0px' }}>
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--ion-card-background)' }}>
          <IonButtons slot="start">
            <IonButton onClick={() => setDialogOpen(false)}>
              <IonIcon name="close-outline" style={{ fontSize: 24 }} />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>{isRepost ? 'Repost Truck' : editPost ? 'Edit Truck Posting' : 'Post a Truck'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} disabled={saving} style={{ '--color': '#2dd36f' }}>
              {saving ? <IonSpinner name="crescent" style={{ width: 20, height: 20 }} /> : <IonIcon name="checkmark-outline" style={{ fontSize: 26, fontWeight: 700 }} />}
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
            <IonLabel position="stacked">Equipment Type <span style={{ color: '#d32f2f' }}>*</span></IonLabel>
            <IonSelect value={form.equipment_type || ''} onIonChange={setField('equipment_type')} placeholder="Select type">
              {equipmentTypes.map(t => <IonSelectOption key={t.id} value={t.name}>{t.name}</IonSelectOption>)}
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
            <div style={{ width: '100%', paddingBottom: 8 }}>
              <AddressAutocomplete
                placeholder="e.g. Dallas, TX"
                value={form.current_location}
                onChange={({ cityState, address }) => setForm(f => ({ ...f, current_location: cityState || address || '' }))}
              />
            </div>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Preferred Origin</IonLabel>
            <IonInput value={form.preferred_origin} onIonChange={setField('preferred_origin')} placeholder="e.g. Chicago, IL" />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Preferred Destination</IonLabel>
            <IonInput value={form.preferred_destination} onIonChange={setField('preferred_destination')} placeholder="e.g. Atlanta, GA" />
          </IonItem>
        </IonList>

        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Available From <span style={{ color: '#d32f2f' }}>*</span></IonLabel>
            <IonInput type="date" value={form.available_from} onIonChange={setField('available_from')} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Available To <span style={{ color: '#d32f2f' }}>*</span></IonLabel>
            <IonInput type="date" value={form.available_to} onIonChange={setField('available_to')} />
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
