import React, { useEffect, useState } from 'react';
import { IonModal, IonSpinner } from '@ionic/react';
import { contactApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-color-light)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4 }} />;
}

function MessageModal({ msg, onClose, onMarkRead, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onDelete(msg.id);
    onClose();
  }

  return (
    <IonModal isOpen onDidDismiss={onClose} style={{ '--width': '520px', '--height': 'auto', '--max-height': '90vh', '--border-radius': '12px' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>{msg.subject}</p>
            <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{msg.name} · {msg.email}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
            <IonIcon name="close-outline" style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 16 }}>
            {new Date(msg.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
          <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--ion-text-color)' }}>{msg.message}</p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 20px', borderTop: '1px solid var(--ion-border-color)' }}>
          {!msg.read && (
            <button onClick={() => { onMarkRead(msg.id); onClose(); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-text-color)', fontSize: '0.82rem', fontFamily: 'inherit', cursor: 'pointer' }}>
              <IonIcon name="mail-open-outline" style={{ fontSize: 14 }} /> Mark as Read
            </button>
          )}
          <button onClick={handleDelete} disabled={deleting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #d32f2f', borderRadius: 6, backgroundColor: 'transparent', color: '#d32f2f', fontSize: '0.82rem', fontFamily: 'inherit', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
            <IonIcon name="trash-outline" style={{ fontSize: 14 }} /> {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <button onClick={onClose}
            style={{ padding: '7px 14px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </IonModal>
  );
}

export default function AdminContacts() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setMessages(await contactApi.list());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await contactApi.markRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await contactApi.remove(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const unread = messages.filter(m => !m.read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <IonIcon name="mail-outline" style={{ color: 'var(--ion-color-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>Contact Messages</h2>
            {unread > 0 && (
              <span style={{ backgroundColor: 'var(--ion-color-primary)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>{unread} unread</span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{messages.length} total message{messages.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-text-color)', fontSize: '0.82rem', fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} /> : <IonIcon name="refresh-outline" style={{ fontSize: 14 }} />}
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Total',  value: messages.length,                     color: 'var(--ion-text-color)' },
          { label: 'Unread', value: unread,                               color: 'var(--ion-color-primary)' },
          { label: 'Read',   value: messages.filter(m => m.read).length, color: '#2e7d32' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...cardStyle, textAlign: 'center', padding: 16 }}>
            <p style={{ margin: '0 0 4px', fontSize: '1.75rem', fontWeight: 800, color }}>{value}</p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{[...Array(6)].map((_, i) => <th key={i} style={thStyle}><SkeletonBox width={80} height={14} /></th>)}</tr></thead>
              <tbody>{[...Array(6)].map((_, i) => <tr key={i}>{[120, 160, 140, 80, 90, 70].map((w, j) => <td key={j} style={tdStyle}><SkeletonBox width={w} height={14} /></td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : error ? (
          <div style={{ margin: 16, padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No contact messages yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Name', 'Email', 'Subject', 'Status', 'Received', ''].map((h, i) => <th key={i} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.id} onClick={() => { setSelected(m); if (!m.read) handleMarkRead(m.id); }}
                    style={{ cursor: 'pointer', backgroundColor: m.read ? 'transparent' : 'rgba(var(--ion-color-primary-rgb), 0.04)' }}>
                    <td style={tdStyle}><span style={{ fontWeight: m.read ? 400 : 700 }}>{m.name}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{m.email}</span></td>
                    <td style={tdStyle}><span style={{ display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</span></td>
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: m.read ? '1px solid var(--ion-border-color)' : 'none', backgroundColor: m.read ? 'transparent' : 'var(--ion-color-primary)', color: m.read ? 'var(--ion-color-medium)' : '#fff' }}>
                        {m.read ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>
                        {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        {!m.read && (
                          <button title="Mark as read" onClick={() => handleMarkRead(m.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                            <IonIcon name="mail-open-outline" style={{ fontSize: 15 }} />
                          </button>
                        )}
                        <button title="Delete" onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                          {deleting === m.id ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} /> : <IonIcon name="trash-outline" style={{ fontSize: 15 }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <MessageModal
          msg={selected}
          onClose={() => setSelected(null)}
          onMarkRead={handleMarkRead}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
