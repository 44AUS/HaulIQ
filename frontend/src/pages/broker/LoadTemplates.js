import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonSpinner, IonModal } from '@ionic/react';
import { loadTemplatesApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

function Badge({ label, color }) {
  const colors = {
    success: { border: '#2e7d32', color: '#2e7d32' },
    info:    { border: '#0288d1', color: '#0288d1' },
    default: { border: 'var(--ion-border-color)', color: 'var(--ion-color-medium)' },
  };
  const c = colors[color] || colors.default;
  return (
    <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, border: `1px solid ${c.border}`, color: c.color }}>
      {label}
    </span>
  );
}

export default function LoadTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [renameDialog, setRenameDialog] = useState(null);
  const [renameSaving, setRenameSaving] = useState(false);

  useEffect(() => {
    loadTemplatesApi.list()
      .then(data => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load templates'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => {
    loadTemplatesApi.delete(id)
      .then(() => setTemplates(prev => prev.filter(t => t.id !== id)))
      .catch(() => {});
  };

  const handleRename = () => {
    if (!renameDialog) return;
    setRenameSaving(true);
    loadTemplatesApi.update(renameDialog.id, { name: renameDialog.name })
      .then(updated => { setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t)); setRenameDialog(null); })
      .catch(() => {})
      .finally(() => setRenameSaving(false));
  };

  const handleUseTemplate = (t) => navigate('/broker/post', { state: { template: t } });

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IonIcon name="layers-outline" style={{ color: 'var(--ion-color-primary)' }} /> Load Templates
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Re-post recurring lanes in seconds — no re-entry needed.</p>
        </div>
        <button onClick={() => navigate('/broker/post')} style={{ padding: '8px 16px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600 }}>
          Post New Load
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><IonSpinner name="crescent" /></div>
      ) : templates.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px 0', textAlign: 'center' }}>
          <IonIcon name="layers-outline" style={{ fontSize: 48, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)' }}>No templates yet</p>
          <p style={{ margin: '0 0 24px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>When posting a load, click "Save as Template" to add it here.</p>
          <button onClick={() => navigate('/broker/post')} style={{ padding: '8px 16px', border: '1px solid var(--ion-border-color)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>
            Post a Load
          </button>
        </div>
      ) : (
        <div style={cardStyle}>
          {templates.map((t, i) => (
            <div key={t.id}>
              {i > 0 && <div style={{ borderTop: '1px solid var(--ion-border-color)' }} />}
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)', display: 'block' }}>{t.name}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--ion-color-medium)', display: 'block', marginTop: 2 }}>{t.origin} → {t.destination}</span>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <Badge label={`$${(t.rate || 0).toLocaleString()}`} color="success" />
                    <Badge label={`${t.miles} mi`} color="default" />
                    {t.load_type && <Badge label={t.load_type} color="default" />}
                    {t.times_used > 0 && <Badge label={`Used ${t.times_used}×`} color="info" />}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <button onClick={() => handleUseTemplate(t)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600 }}>
                    <IonIcon name="reload-outline" style={{ fontSize: 14 }} /> Re-post
                  </button>
                  <button onClick={() => setRenameDialog({ id: t.id, name: t.name })} title="Rename" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                    <IonIcon name="create-outline" style={{ fontSize: 16 }} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                    <IonIcon name="trash-outline" style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
        Up to 50 templates. Save from any load post.
      </p>

      {/* Rename modal */}
      {renameDialog && (
        <IonModal isOpen onDidDismiss={() => setRenameDialog(null)} style={{ '--width': '360px', '--height': 'auto', '--border-radius': '12px' }}>
          <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Rename Template</span>
              <button onClick={() => setRenameDialog(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
                <IonIcon name="close-outline" style={{ fontSize: 20 }} />
              </button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Template Name</label>
              <input
                style={inputStyle}
                autoFocus
                value={renameDialog.name}
                onChange={e => setRenameDialog(d => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setRenameDialog(null)} style={{ flex: 1, padding: '8px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>Cancel</button>
              <button onClick={handleRename} disabled={renameSaving || !renameDialog.name?.trim()} style={{ flex: 1, padding: '8px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: (renameSaving || !renameDialog.name?.trim()) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: (renameSaving || !renameDialog.name?.trim()) ? 0.7 : 1 }}>
                Save
              </button>
            </div>
          </div>
        </IonModal>
      )}
    </div>
  );
}
