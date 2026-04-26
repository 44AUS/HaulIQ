import { useState, useEffect, useCallback } from 'react';
import { IonModal } from '@ionic/react';
import { equipmentTypesApi, equipmentClassesApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

function SkeletonBox({ height }) {
  return <div style={{ height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4, marginBottom: 8 }} />;
}

function TypeModal({ open, type, onClose, onSaved }) {
  const editing = Boolean(type?.id);
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [classId, setClassId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    equipmentClassesApi.adminList().then(setClasses).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) { setName(type?.name || ''); setAbbreviation(type?.abbreviation || ''); setClassId(type?.class_id || ''); setError(null); }
  }, [open, type]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), abbreviation: abbreviation.trim() || null, class_id: classId || null };
      editing ? await equipmentTypesApi.adminUpdate(type.id, payload) : await equipmentTypesApi.adminCreate(payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonModal isOpen={open} onDidDismiss={onClose} style={{ '--width': '420px', '--height': 'auto', '--border-radius': '12px' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
        <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>
          {editing ? 'Edit Equipment Type' : 'New Equipment Type'}
        </p>
        {error && <div style={{ marginBottom: 12, padding: '8px 12px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.82rem' }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dry Van" />
          </div>
          <div>
            <label style={labelStyle}>Abbreviation</label>
            <input style={inputStyle} value={abbreviation} onChange={e => setAbbreviation(e.target.value)} placeholder="e.g. DV" maxLength={20} />
          </div>
          <div>
            <label style={labelStyle}>Equipment Class (optional)</label>
            <select style={{ ...inputStyle, padding: '7px 12px' }} value={classId} onChange={e => setClassId(e.target.value)}>
              <option value="">No class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '7px 14px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '7px 14px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </IonModal>
  );
}

export default function AdminEquipmentTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    equipmentTypesApi.adminList()
      .then(setTypes)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (type) => { setEditingType(type); setDialogOpen(true); };
  const handleNew  = ()      => { setEditingType(null); setDialogOpen(true); };

  const handleDelete = async (type) => {
    if (!window.confirm(`Delete "${type.name}"? This cannot be undone.`)) return;
    try { await equipmentTypesApi.adminDelete(type.id); load(); }
    catch (e) { alert(e.message || 'Delete failed'); }
  };

  const handleToggle = async (type) => {
    try { await equipmentTypesApi.adminUpdate(type.id, { is_active: !type.is_active }); load(); }
    catch (e) { alert(e.message || 'Update failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>Equipment Types</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Manage equipment types used across truck postings and load postings</p>
        </div>
        <button onClick={handleNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
          <IonIcon name="add-outline" style={{ fontSize: 16 }} /> Add Type
        </button>
      </div>

      {error && <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>}

      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 16 }}>{[1,2,3,4].map(i => <SkeletonBox key={i} height={52} />)}</div>
        ) : types.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <IonIcon name="car-sport-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
            <p style={{ margin: '0 0 12px', color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>No equipment types yet.</p>
            <button onClick={handleNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-text-color)', fontSize: '0.82rem', fontFamily: 'inherit', cursor: 'pointer' }}>
              <IonIcon name="add-outline" /> Add First Type
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-color-light)' }}>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)' }}>Name</span>
              <span style={{ width: 60, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)' }}>Abbr.</span>
              <span style={{ width: 120, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)' }}>Class</span>
              <span style={{ width: 80, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)' }}>Status</span>
              <span style={{ width: 100 }} />
            </div>
            {types.map((type, i) => (
              <div key={type.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: i < types.length - 1 ? '1px solid var(--ion-border-color)' : 'none', opacity: type.is_active ? 1 : 0.5 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IonIcon name="car-sport-outline" style={{ fontSize: 16, color: 'var(--ion-color-medium)' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{type.name}</span>
                </div>
                <span style={{ width: 60, fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>{type.abbreviation || '—'}</span>
                <div style={{ width: 120 }}>
                  {type.class_name
                    ? <span style={{ display: 'inline-block', border: '1px solid var(--ion-color-primary)', color: 'var(--ion-color-primary)', borderRadius: 10, padding: '1px 8px', fontSize: '0.65rem', fontWeight: 600 }}>{type.class_name}</span>
                    : <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>—</span>}
                </div>
                <div style={{ width: 80 }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600, backgroundColor: type.is_active ? '#2e7d32' : 'var(--ion-color-medium)', color: '#fff' }}>
                    {type.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div style={{ width: 100, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <label title={type.is_active ? 'Hide' : 'Show'} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={type.is_active} onChange={() => handleToggle(type)} style={{ accentColor: 'var(--ion-color-primary)', width: 16, height: 16, cursor: 'pointer' }} />
                  </label>
                  <button title="Edit" onClick={() => handleEdit(type)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                    <IonIcon name="create-outline" style={{ fontSize: 16 }} />
                  </button>
                  <button title="Delete" onClick={() => handleDelete(type)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                    <IonIcon name="trash-outline" style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TypeModal open={dialogOpen} type={editingType} onClose={() => setDialogOpen(false)} onSaved={load} />
    </div>
  );
}
