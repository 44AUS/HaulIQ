import { useState, useEffect, useCallback } from 'react';
import { IonModal, IonSpinner } from '@ionic/react';
import { equipmentClassesApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

function SkeletonBox({ height }) {
  return <div style={{ height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4, marginBottom: 8 }} />;
}

function ClassModal({ open, cls, onClose, onSaved }) {
  const editing = Boolean(cls?.id);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) { setName(cls?.name || ''); setError(null); }
  }, [open, cls]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim() };
      editing ? await equipmentClassesApi.adminUpdate(cls.id, payload) : await equipmentClassesApi.adminCreate(payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonModal isOpen={open} onDidDismiss={onClose} style={{ '--width': '400px', '--height': 'auto', '--border-radius': '12px' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
        <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>
          {editing ? 'Edit Equipment Class' : 'New Equipment Class'}
        </p>
        {error && <div style={{ marginBottom: 12, padding: '8px 12px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.82rem' }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Class Name *</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Flatbed, Dry Van, Refrigerated" />
          <span style={{ fontSize: '0.7rem', color: 'var(--ion-color-medium)', display: 'block', marginTop: 4 }}>Groups related equipment types so users can search by class</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '7px 14px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '7px 14px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Class'}
          </button>
        </div>
      </div>
    </IonModal>
  );
}

export default function AdminEquipmentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    equipmentClassesApi.adminList()
      .then(setClasses)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (cls) => { setEditingClass(cls); setDialogOpen(true); };
  const handleNew  = ()    => { setEditingClass(null); setDialogOpen(true); };

  const handleDelete = async (cls) => {
    if (!window.confirm(`Delete "${cls.name}"? Equipment types in this class will be unassigned.`)) return;
    try { await equipmentClassesApi.adminDelete(cls.id); load(); }
    catch (e) { alert(e.message || 'Delete failed'); }
  };

  const handleToggle = async (cls) => {
    try { await equipmentClassesApi.adminUpdate(cls.id, { is_active: !cls.is_active }); load(); }
    catch (e) { alert(e.message || 'Update failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>Equipment Classes</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Group equipment types into searchable classes (e.g. Flatbed, Refrigerated)</p>
        </div>
        <button onClick={handleNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
          <IonIcon name="add-outline" style={{ fontSize: 16 }} /> Add Class
        </button>
      </div>

      {error && <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>}

      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 16 }}>{[1,2,3].map(i => <SkeletonBox key={i} height={72} />)}</div>
        ) : classes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <IonIcon name="grid-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
            <p style={{ margin: '0 0 12px', color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>No equipment classes yet.</p>
            <button onClick={handleNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-text-color)', fontSize: '0.82rem', fontFamily: 'inherit', cursor: 'pointer' }}>
              <IonIcon name="add-outline" /> Add First Class
            </button>
          </div>
        ) : (
          <div>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-color-light)' }}>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)' }}>Class Name</span>
              <span style={{ width: 140, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)' }}>Types</span>
              <span style={{ width: 80, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)' }}>Status</span>
              <span style={{ width: 120 }} />
            </div>
            {classes.map((cls, i) => (
              <div key={cls.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: i < classes.length - 1 ? '1px solid var(--ion-border-color)' : 'none', opacity: cls.is_active ? 1 : 0.5 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IonIcon name="grid-outline" style={{ fontSize: 16, color: 'var(--ion-color-primary)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{cls.name}</span>
                </div>
                <div style={{ width: 140, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {cls.equipment_types?.length > 0 ? (
                    <>
                      {cls.equipment_types.slice(0, 3).map(t => (
                        <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid var(--ion-border-color)', borderRadius: 10, padding: '1px 7px', fontSize: '0.65rem', color: 'var(--ion-text-color)' }}>
                          <IonIcon name="car-sport-outline" style={{ fontSize: 10 }} />{t.abbreviation || t.name}
                        </span>
                      ))}
                      {cls.equipment_types.length > 3 && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>+{cls.equipment_types.length - 3} more</span>}
                    </>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>No types</span>
                  )}
                </div>
                <div style={{ width: 80 }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600, backgroundColor: cls.is_active ? '#2e7d32' : 'var(--ion-color-medium)', color: '#fff' }}>
                    {cls.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div style={{ width: 120, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <label title={cls.is_active ? 'Hide' : 'Show'} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={cls.is_active} onChange={() => handleToggle(cls)} style={{ accentColor: 'var(--ion-color-primary)', width: 16, height: 16, cursor: 'pointer' }} />
                  </label>
                  <button title="Edit" onClick={() => handleEdit(cls)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                    <IonIcon name="create-outline" style={{ fontSize: 16 }} />
                  </button>
                  <button title="Delete" onClick={() => handleDelete(cls)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                    <IonIcon name="trash-outline" style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ClassModal open={dialogOpen} cls={editingClass} onClose={() => setDialogOpen(false)} onSaved={load} />
    </div>
  );
}
