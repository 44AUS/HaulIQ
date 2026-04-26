import React, { useState, useEffect, useCallback } from 'react';
import { IonSpinner } from '@ionic/react';
import { adminApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-background-color)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

const STATUS_COLORS = {
  active:    { bg: '#2e7d32', color: '#fff' },
  booked:    { bg: '#0288d1', color: '#fff' },
  completed: { bg: 'var(--ion-color-medium)', color: '#fff' },
  removed:   { bg: '#d32f2f', color: '#fff' },
  expired:   { bg: '#e65100', color: '#fff' },
};

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4 }} />;
}

const filterBtnStyle = (active, color) => {
  const colors = { red: '#d32f2f', blue: '#0288d1', primary: 'var(--ion-color-primary)' };
  const c = colors[color] || colors.primary;
  return { padding: '5px 12px', fontSize: '0.78rem', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', borderRadius: 6, border: `1px solid ${c}`, backgroundColor: active ? c : 'transparent', color: active ? '#fff' : c };
};

export default function AdminLoads() {
  const [loads, setLoads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [removing, setRemoving] = useState({});

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await adminApi.loads(params);
      const list = Array.isArray(data) ? data : (data.loads || []);
      setLoads(list);
      setTotal(Array.isArray(data) ? list.length : (data.total || list.length));
    } catch {
      setLoads([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const filtered = loads.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (l.origin || '').toLowerCase().includes(q) || (l.destination || '').toLowerCase().includes(q) || (l.commodity || '').toLowerCase().includes(q);
  });

  async function handleRemove(load) {
    if (!window.confirm(`Remove load ${load.origin} → ${load.destination}? This cannot be undone.`)) return;
    setRemoving(r => ({ ...r, [load.id]: true }));
    try {
      await adminApi.removeLoad(load.id);
      setLoads(prev => prev.map(l => l.id === load.id ? { ...l, status: 'removed' } : l));
    } catch (e) {
      alert(e.message);
    } finally {
      setRemoving(r => ({ ...r, [load.id]: false }));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <IonIcon name="cube-outline" style={{ color: 'var(--ion-color-primary)' }} />
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>Load Moderation</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{total} total loads on platform</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <IonIcon name="search-outline" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--ion-color-medium)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by origin, destination, commodity…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', color: 'var(--ion-text-color)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All', color: 'primary' },
            { key: 'active', label: 'Active', color: 'primary' },
            { key: 'booked', label: 'Booked', color: 'blue' },
            { key: 'completed', label: 'Completed', color: 'primary' },
            { key: 'removed', label: 'Removed', color: 'red' },
          ].map(({ key, label, color }) => (
            <button key={key} onClick={() => setStatusFilter(key)} style={filterBtnStyle(statusFilter === key, color)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{[...Array(8)].map((_, i) => <th key={i} style={thStyle}><SkeletonBox width={80} height={14} /></th>)}</tr></thead>
              <tbody>{[...Array(8)].map((_, i) => <tr key={i}>{[140,100,80,80,80,80,80,40].map((w,j) => <td key={j} style={tdStyle}><SkeletonBox width={w} height={14} /></td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>No loads found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Route', 'Type', 'Rate', 'Miles', 'Pickup', 'Status', 'Posted', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map(load => {
                  const sc = STATUS_COLORS[load.status];
                  return (
                    <tr key={load.id}>
                      <td style={tdStyle}><span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{load.origin} → {load.destination}</span></td>
                      <td style={tdStyle}><span style={{ color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{(load.load_type || '').replace(/_/g, ' ')}</span></td>
                      <td style={tdStyle}><span style={{ fontWeight: 700 }}>${load.rate?.toLocaleString() ?? '—'}</span></td>
                      <td style={tdStyle}><span style={{ color: 'var(--ion-color-medium)' }}>{load.miles?.toLocaleString() ?? '—'}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{load.pickup_date || '—'}</span></td>
                      <td style={tdStyle}>
                        {sc && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', backgroundColor: sc.bg, color: sc.color }}>{load.status}</span>}
                      </td>
                      <td style={tdStyle}><span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{load.posted_at ? new Date(load.posted_at).toLocaleDateString() : '—'}</span></td>
                      <td style={tdStyle}>
                        {load.status !== 'removed' && (
                          removing[load.id] ? (
                            <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
                          ) : (
                            <button title="Remove load" onClick={() => handleRemove(load)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                              <IonIcon name="trash-outline" style={{ fontSize: 16 }} />
                            </button>
                          )
                        )}
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
  );
}
