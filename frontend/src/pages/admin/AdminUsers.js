import React, { useState, useEffect, useCallback } from 'react';
import { IonModal, IonSpinner } from '@ionic/react';
import { adminApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-color-light)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };

const PLANS = ['basic', 'pro', 'elite', 'admin'];

const ROLE_BADGE = { carrier: { border: 'var(--ion-color-primary)', color: 'var(--ion-color-primary)' }, broker: { border: '#0288d1', color: '#0288d1' }, admin: { border: '#7b1fa2', color: '#7b1fa2' } };
const PLAN_BG = { elite: '#7b1fa2', pro: '#2e7d32', admin: '#d32f2f', basic: 'var(--ion-color-medium)' };

function Avatar({ name, src, size = 32 }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#1565c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </div>
  );
}

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4 }} />;
}

function PlanModal({ user, onClose, onSaved }) {
  const [plan, setPlan] = useState(user.plan || 'basic');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.setPlan(user.id, plan);
      onSaved({ ...user, plan });
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <IonModal isOpen onDidDismiss={onClose} style={{ '--width': '360px', '--height': 'auto', '--border-radius': '12px', '--z-index': '20001' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Change Plan — {user.name}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}><IonIcon name="close-outline" style={{ fontSize: 20 }} /></button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Plan</label>
          <select value={plan} onChange={e => setPlan(e.target.value)} style={{ ...inputStyle, padding: '7px 12px' }}>
            {PLANS.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '8px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </IonModal>
  );
}

function UserDetailModal({ user, onClose, onUpdate, onDeleted }) {
  const [planOpen, setPlanOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function toggleSuspend() {
    setActioning(true);
    try {
      if (user.is_active) { await adminApi.suspend(user.id); onUpdate({ ...user, is_active: false }); }
      else { await adminApi.activate(user.id); onUpdate({ ...user, is_active: true }); }
    } catch (e) { alert(e.message); }
    finally { setActioning(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try { await adminApi.deleteUser(user.id); onDeleted(user.id); onClose(); }
    catch (e) { alert(e.message); setDeleting(false); }
  }

  const rows = [
    ['Role', user.role], ['Plan', user.plan || '—'], ['Status', user.is_active ? 'Active' : 'Suspended'],
    ['Company', user.company || '—'], ['MC Number', user.mc_number || '—'], ['State', user.business_state || '—'],
    ['Member Since', user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'],
  ];

  return (
    <>
      <IonModal isOpen onDidDismiss={onClose} style={{ '--width': '400px', '--height': 'auto', '--max-height': '90vh', '--border-radius': '12px' }}>
        <div style={{ backgroundColor: 'var(--ion-card-background)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>User Details</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}><IonIcon name="close-outline" style={{ fontSize: 20 }} /></button>
          </div>
          <div style={{ padding: 20, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--ion-border-color)' }}>
              <Avatar name={user.name} src={user.avatar_url} size={48} />
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>{user.name}</p>
                <span style={{ fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>{user.email}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rows.map(([k, v], i) => (
                <div key={k}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>{k}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--ion-text-color)' }}>{v}</span>
                  </div>
                  {i < rows.length - 1 && <div style={{ borderTop: '1px solid var(--ion-border-color)', marginTop: 12 }} />}
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ion-border-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => setPlanOpen(true)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-text-color)', fontSize: '0.875rem', fontFamily: 'inherit', cursor: 'pointer' }}>Change Plan</button>
            <button onClick={toggleSuspend} disabled={actioning} style={{ width: '100%', padding: '8px', backgroundColor: user.is_active ? '#d32f2f' : '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, cursor: actioning ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: actioning ? 0.7 : 1 }}>
              {actioning ? '…' : user.is_active ? 'Suspend' : 'Reactivate'}
            </button>
            <button onClick={() => setConfirmDelete(true)} style={{ width: '100%', padding: '8px', border: '1px solid #d32f2f', borderRadius: 6, backgroundColor: 'transparent', color: '#d32f2f', fontSize: '0.875rem', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <IonIcon name="trash-outline" style={{ fontSize: 14 }} /> Delete User
            </button>
          </div>
        </div>
      </IonModal>

      {confirmDelete && (
        <IonModal isOpen onDidDismiss={() => setConfirmDelete(false)} style={{ '--width': '360px', '--height': 'auto', '--border-radius': '12px', '--z-index': '20001' }}>
          <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Delete User?</p>
            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
              Permanently delete <strong>{user.name}</strong> ({user.email})? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '8px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-text-color)', fontSize: '0.875rem', fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '8px', backgroundColor: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </IonModal>
      )}

      {planOpen && (
        <PlanModal user={user} onClose={() => setPlanOpen(false)} onSaved={updated => { onUpdate(updated); setPlanOpen(false); }} />
      )}
    </>
  );
}

const filterBtnStyle = (active) => ({
  padding: '5px 12px', fontSize: '0.78rem', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', borderRadius: 6,
  backgroundColor: active ? 'var(--ion-color-primary)' : 'transparent',
  color: active ? '#fff' : 'var(--ion-color-primary)',
  border: '1px solid var(--ion-color-primary)',
  textTransform: 'capitalize',
});

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actioning, setActioning] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.q = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (planFilter !== 'all') params.plan = planFilter;
      const data = await adminApi.users(params);
      const list = Array.isArray(data) ? data : (data.users || []);
      setUsers(list);
      setTotal(Array.isArray(data) ? list.length : (data.total || list.length));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, planFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function updateUser(updated) {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    if (selectedUser?.id === updated.id) setSelectedUser(updated);
  }

  function removeUser(id) {
    setUsers(prev => prev.filter(u => u.id !== id));
    setTotal(t => t - 1);
  }

  async function quickSuspend(u) {
    setActioning(a => ({ ...a, [u.id]: true }));
    try { await adminApi.suspend(u.id); updateUser({ ...u, is_active: false }); }
    catch (e) { alert(e.message); }
    finally { setActioning(a => ({ ...a, [u.id]: false })); }
  }

  async function quickActivate(u) {
    setActioning(a => ({ ...a, [u.id]: true }));
    try { await adminApi.activate(u.id); updateUser({ ...u, is_active: true }); }
    catch (e) { alert(e.message); }
    finally { setActioning(a => ({ ...a, [u.id]: false })); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <IonIcon name="people-outline" style={{ color: 'var(--ion-color-primary)' }} />
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>User Management</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{total} total users</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <IonIcon name="search-outline" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--ion-color-medium)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, company…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', color: 'var(--ion-text-color)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {['all', 'carrier', 'broker', 'admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={filterBtnStyle(roleFilter === r)}>{r}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {['all', ...PLANS].map(p => (
            <button key={p} onClick={() => setPlanFilter(p)} style={filterBtnStyle(planFilter === p)}>{p}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{[...Array(7)].map((_, i) => <th key={i} style={thStyle}><SkeletonBox width={80} height={14} /></th>)}</tr></thead>
              <tbody>{[...Array(8)].map((_, i) => <tr key={i}>{[160,80,80,80,100,80,80].map((w,j) => <td key={j} style={tdStyle}><SkeletonBox width={w} height={14} /></td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>No users found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['User', 'Role', 'Plan', 'Status', 'Company', 'Joined', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const roleBadge = ROLE_BADGE[u.role] || { border: 'var(--ion-border-color)', color: 'var(--ion-color-medium)' };
                  const planBg = PLAN_BG[u.plan] || 'var(--ion-color-medium)';
                  return (
                    <tr key={u.id}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={u.name} src={u.avatar_url} size={32} />
                          <div>
                            <span style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem' }}>{u.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-block', border: `1px solid ${roleBadge.border}`, color: roleBadge.color, borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {u.plan
                          ? <span style={{ display: 'inline-block', backgroundColor: planBg, color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{u.plan}</span>
                          : <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>—</span>
                        }
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-block', backgroundColor: u.is_active ? '#2e7d32' : '#d32f2f', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={tdStyle}><span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{u.company || '—'}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {actioning[u.id] ? (
                            <IonSpinner name="crescent" style={{ width: 16, height: 16, margin: '0 4px' }} />
                          ) : !u.is_active ? (
                            <button title="Reactivate" onClick={() => quickActivate(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                              <IonIcon name="checkmark-circle-outline" style={{ fontSize: 16 }} />
                            </button>
                          ) : (
                            <button title="Suspend" onClick={() => quickSuspend(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                              <IonIcon name="person-remove-outline" style={{ fontSize: 16 }} />
                            </button>
                          )}
                          <button onClick={() => setSelectedUser(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                            <IonIcon name="ellipsis-horizontal-outline" style={{ fontSize: 16 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={updateUser}
          onDeleted={removeUser}
        />
      )}
    </div>
  );
}
