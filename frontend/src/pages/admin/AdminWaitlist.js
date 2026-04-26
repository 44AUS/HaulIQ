import React, { useEffect, useState } from 'react';
import { IonSpinner } from '@ionic/react';
import { waitlistApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-color-light)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4 }} />;
}

function RoleBadge({ role }) {
  const isCarrier = role === 'carrier';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: `1px solid ${isCarrier ? 'var(--ion-color-primary)' : '#0288d1'}`, color: isCarrier ? 'var(--ion-color-primary)' : '#0288d1', borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
      <IonIcon name={isCarrier ? 'car-sport-outline' : 'briefcase-outline'} style={{ fontSize: 12 }} />
      {isCarrier ? 'Carrier' : 'Broker'}
    </span>
  );
}

export default function AdminWaitlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [activating, setActivating] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await waitlistApi.list());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this entry from the waitlist?')) return;
    setDeleting(id);
    try {
      await waitlistApi.remove(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      alert('Failed to delete: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleActivate = async (entry) => {
    if (!window.confirm(`Activate account for ${entry.email}? They will be able to log in immediately.`)) return;
    setActivating(entry.id);
    try {
      await waitlistApi.activate(entry.id);
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, activated: true } : e));
    } catch (e) {
      alert('Failed to activate: ' + e.message);
    } finally {
      setActivating(null);
    }
  };

  const filtered = filter === 'all' ? entries : entries.filter(e => e.role === filter);
  const carrierCount = entries.filter(e => e.role === 'carrier').length;
  const brokerCount = entries.filter(e => e.role === 'broker').length;

  const filterBtnStyle = (active) => ({
    padding: '5px 14px', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', borderRadius: 6,
    backgroundColor: active ? 'var(--ion-color-primary)' : 'transparent',
    color: active ? '#fff' : 'var(--ion-color-primary)',
    border: '1px solid var(--ion-color-primary)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <IonIcon name="people-outline" style={{ color: 'var(--ion-color-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>Waitlist</h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>People waiting for early access to HaulIQ</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-text-color)', fontSize: '0.875rem', fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} /> : <IonIcon name="refresh-outline" style={{ fontSize: 14 }} />}
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Total',    value: entries.length,  color: 'var(--ion-text-color)' },
          { label: 'Carriers', value: carrierCount,    color: 'var(--ion-color-primary)' },
          { label: 'Brokers',  value: brokerCount,     color: '#0288d1' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...cardStyle, textAlign: 'center', padding: 16 }}>
            <p style={{ margin: '0 0 4px', fontSize: '1.75rem', fontWeight: 800, color }}>{value}</p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { key: 'all',     label: `All (${entries.length})` },
          { key: 'carrier', label: `Carriers (${carrierCount})` },
          { key: 'broker',  label: `Brokers (${brokerCount})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={filterBtnStyle(filter === key)}>{label}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{[...Array(8)].map((_, i) => <th key={i} style={thStyle}><SkeletonBox width={80} height={14} /></th>)}</tr></thead>
              <tbody>{[...Array(8)].map((_, i) => <tr key={i}>{[100, 140, 80, 100, 80, 80, 80, 80].map((w, j) => <td key={j} style={tdStyle}><SkeletonBox width={w} height={14} /></td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : error ? (
          <div style={{ margin: 16, padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
              {filter === 'all' ? 'No waitlist entries yet.' : `No ${filter}s on the waitlist yet.`}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Name', 'Email', 'Role', 'Company', 'MC #', 'Joined', 'Status', ''].map((h, i) => <th key={i} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map(entry => (
                  <tr key={entry.id}>
                    <td style={tdStyle}>
                      {entry.name
                        ? <span style={{ fontWeight: 600 }}>{entry.name}</span>
                        : <span style={{ color: 'var(--ion-color-medium)', fontStyle: 'italic' }}>—</span>
                      }
                    </td>
                    <td style={tdStyle}><span style={{ fontSize: '0.78rem', color: 'var(--ion-color-medium)' }}>{entry.email}</span></td>
                    <td style={tdStyle}><RoleBadge role={entry.role} /></td>
                    <td style={tdStyle}><span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{entry.company || '—'}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{entry.mc_number || '—'}</span></td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>
                        {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: entry.activated ? '#2e7d32' : '#e65100', color: '#fff' }}>
                        {entry.activated ? 'Activated' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        {!entry.activated && (
                          <button title="Activate account" onClick={() => handleActivate(entry)} disabled={activating === entry.id}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                            {activating === entry.id ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} /> : <IonIcon name="checkmark-circle-outline" style={{ fontSize: 16 }} />}
                          </button>
                        )}
                        <button title="Remove from waitlist" onClick={() => handleDelete(entry.id)} disabled={deleting === entry.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
                          {deleting === entry.id ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} /> : <IonIcon name="trash-outline" style={{ fontSize: 16 }} />}
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
    </div>
  );
}
