import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonSpinner, IonModal } from '@ionic/react';
import { driversApi, messagesApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const BASE_URL = window.location.origin;

const GROUPS = [
  { key: 'admin',   label: 'Admin' },
  { key: 'level_3', label: 'Level 3' },
  { key: 'level_2', label: 'Level 2' },
  { key: 'level_1', label: 'Level 1' },
];

const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

function isOnline(lastActiveAt) {
  if (!lastActiveAt) return false;
  return (Date.now() - new Date(lastActiveAt).getTime()) < 5 * 60 * 1000;
}

function Avatar({ name }) {
  const initials = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function Drivers() {
  const navigate = useNavigate();
  const [drivers, setDrivers]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('enabled');
  const [inviteOpen, setInviteOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedToken, setCopiedToken]   = useState(null);
  const [inviteForm, setInviteForm]     = useState({ name: '', email: '', phone: '', license_number: '', driver_level: 'level_1' });
  const [inviting, setInviting]         = useState(false);
  const [inviteError, setInviteError]   = useState(null);
  const [newInvite, setNewInvite]       = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const load = () => {
    driversApi.list()
      .then(data => setDrivers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return;
    setInviting(true); setInviteError(null);
    try {
      const res = await driversApi.invite(inviteForm);
      setNewInvite(res);
      load();
      setInviteForm({ name: '', email: '', phone: '', license_number: '', driver_level: 'level_1' });
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await driversApi.remove(deleteTarget.id);
      setDrivers(d => d.filter(x => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleMessage = async (driver) => {
    try {
      const convo = await messagesApi.direct(driver.id);
      navigate(`/carrier/messages?conv=${convo.id}`);
    } catch (err) { alert(err.message); }
  };

  const copyInviteLink = (token) => {
    navigator.clipboard.writeText(`${BASE_URL}/invite/driver?token=${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const visibleDrivers = drivers.filter(d =>
    filter === 'enabled' ? d.is_active || d.invite_accepted : !d.is_active && !d.invite_accepted
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 10, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: 'var(--ion-card-background)', borderRadius: 8, width: '100%', maxWidth: 1200, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--ion-text-color)' }}>Employees</h3>
          <div style={{ display: 'flex', backgroundColor: 'var(--ion-color-light)', borderRadius: 10, padding: 3, gap: 2 }}>
            {['enabled', 'disabled'].map(v => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                style={{
                  padding: '5px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize',
                  backgroundColor: filter === v ? 'var(--ion-card-background)' : 'transparent',
                  color: filter === v ? 'var(--ion-text-color)' : 'var(--ion-color-medium)',
                  boxShadow: filter === v ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : (
            GROUPS.map(group => {
              const groupDrivers = visibleDrivers.filter(d => (d.driver_level || 'level_1') === group.key);
              return (
                <div key={group.key}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 24px', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-color-light)' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ion-color-medium)', letterSpacing: '0.04em' }}>{group.label}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ion-color-medium)' }}>{groupDrivers.length}</span>
                  </div>
                  {groupDrivers.length === 0 ? (
                    <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>None</span>
                    </div>
                  ) : (
                    groupDrivers.map(driver => {
                      const online = isOnline(driver.last_active_at);
                      return (
                        <div key={driver.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--ion-border-color)', cursor: 'pointer', gap: 12 }}>
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar name={driver.name} />
                            <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', backgroundColor: online ? '#2e7d32' : '#d32f2f', border: '2px solid var(--ion-card-background)', display: 'inline-block' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{driver.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{driver.email}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                            {driver.invite_accepted && (
                              <button onClick={() => handleMessage(driver)} title="Message" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 6, display: 'flex', borderRadius: 4 }}>
                                <IonIcon name="chatbubble-outline" style={{ fontSize: 17 }} />
                              </button>
                            )}
                            <button onClick={() => setDeleteTarget(driver)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 6, display: 'flex', borderRadius: 4 }}>
                              <IonIcon name="trash-outline" style={{ fontSize: 17 }} />
                            </button>
                          </div>
                          <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating ADD */}
      <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <button
          onClick={() => { setInviteOpen(true); setNewInvite(null); setInviteError(null); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#FF8C00', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 28px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(255,140,0,0.45)' }}
        >
          <IonIcon name="add-outline" style={{ fontSize: 18 }} /> ADD
        </button>
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <IonModal isOpen onDidDismiss={() => { setInviteOpen(false); setNewInvite(null); }} style={{ '--width': '400px', '--height': 'auto', '--border-radius': '12px' }}>
          <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Invite a Driver</span>
              <button onClick={() => { setInviteOpen(false); setNewInvite(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
                <IonIcon name="close-outline" style={{ fontSize: 20 }} />
              </button>
            </div>

            {newInvite ? (
              <div>
                <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.3)', borderRadius: 6 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.875rem', color: '#2e7d32' }}>Invite created for {newInvite.name}!</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#2e7d32' }}>Share this link with them to set up their account.</p>
                </div>
                <div style={{ backgroundColor: 'var(--ion-color-light)', borderRadius: 6, padding: 12 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 4 }}>Invite Link</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1, fontSize: '0.7rem', color: 'var(--ion-text-color)' }}>
                      {`${BASE_URL}/invite/driver?token=${newInvite.invite_token}`}
                    </span>
                    <button onClick={() => copyInviteLink(newInvite.invite_token)} title={copiedToken === newInvite.invite_token ? 'Copied!' : 'Copy link'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                      <IonIcon name="copy-outline" style={{ fontSize: 15, color: copiedToken === newInvite.invite_token ? '#2e7d32' : 'var(--ion-color-medium)' }} />
                    </button>
                  </div>
                </div>
                <button onClick={() => { setInviteOpen(false); setNewInvite(null); }} style={{ width: '100%', marginTop: 16, padding: '9px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600 }}>
                  Close
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {inviteError && (
                  <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>
                    {inviteError}
                  </div>
                )}
                {[
                  { label: 'Full Name *',          id: 'name',           type: 'text' },
                  { label: 'Email *',               id: 'email',          type: 'email' },
                  { label: 'Phone',                 id: 'phone',          type: 'text' },
                  { label: 'CDL / License Number', id: 'license_number', type: 'text' },
                ].map(({ label, id, type }) => (
                  <div key={id}>
                    <label style={labelStyle}>{label}</label>
                    <input style={inputStyle} type={type} value={inviteForm[id]} onChange={e => setInviteForm(f => ({ ...f, [id]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Access Level</label>
                  <select style={inputStyle} value={inviteForm.driver_level} onChange={e => setInviteForm(f => ({ ...f, driver_level: e.target.value }))}>
                    <option value="admin">Admin</option>
                    <option value="level_3">Level 3</option>
                    <option value="level_2">Level 2</option>
                    <option value="level_1">Level 1</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={() => setInviteOpen(false)} style={{ flex: 1, padding: '9px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviting || !inviteForm.name.trim() || !inviteForm.email.trim()}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: (inviting || !inviteForm.name.trim() || !inviteForm.email.trim()) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 700, opacity: (inviting || !inviteForm.name.trim() || !inviteForm.email.trim()) ? 0.7 : 1 }}
                  >
                    {inviting && <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} />}
                    {inviting ? 'Inviting…' : 'Send Invite'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </IonModal>
      )}

      {/* Confirm delete modal */}
      {deleteTarget && (
        <IonModal isOpen onDidDismiss={() => setDeleteTarget(null)} style={{ '--width': '360px', '--height': 'auto', '--border-radius': '12px' }}>
          <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
            <h3 style={{ margin: '0 0 12px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Remove Driver?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
              Remove <strong>{deleteTarget?.name}</strong> from your team?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '9px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', backgroundColor: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
                {deleting && <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} />}
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </IonModal>
      )}
    </div>
  );
}
