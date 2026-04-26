import { useState, useEffect } from 'react';
import { IonSpinner } from '@ionic/react';
import { freightPaymentsApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-color-light)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

const STATUS_BADGE = {
  pending:  { bg: '#e65100', color: '#fff', label: 'Pending' },
  escrowed: { bg: '#0288d1', color: '#fff', label: 'In Escrow' },
  released: { bg: '#2e7d32', color: '#fff', label: 'Released' },
  refunded: { bg: 'var(--ion-color-medium)', color: '#fff', label: 'Refunded' },
  failed:   { bg: '#d32f2f', color: '#fff', label: 'Failed' },
};

const fmt = (n) => n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4 }} />;
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setPayments(await freightPaymentsApi.adminList());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = statusFilter === 'all' ? payments : payments.filter(p => p.status === statusFilter);
  const totalVolume   = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalFees     = payments.filter(p => ['escrowed','released'].includes(p.status)).reduce((s, p) => s + (p.fee_amount || 0), 0);
  const inEscrow      = payments.filter(p => p.status === 'escrowed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalReleased = payments.filter(p => p.status === 'released').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <IonIcon name="card-outline" style={{ color: 'var(--ion-color-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>Freight Payments</h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>All escrow payments across the platform</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-text-color)', fontSize: '0.82rem', fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} /> : <IonIcon name="refresh-outline" style={{ fontSize: 14 }} />}
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Volume',     value: fmt(totalVolume),   color: 'var(--ion-text-color)' },
          { label: 'In Escrow',        value: fmt(inEscrow),      color: '#0288d1' },
          { label: 'Released',         value: fmt(totalReleased), color: '#2e7d32' },
          { label: 'Platform Revenue', value: fmt(totalFees),     color: 'var(--ion-color-primary)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...cardStyle, textAlign: 'center', padding: 16 }}>
            <p style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color }}>{value}</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600 }}>Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '7px 12px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', color: 'var(--ion-text-color)', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', minWidth: 160 }}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="escrowed">In Escrow</option>
            <option value="released">Released</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', alignSelf: 'flex-end', paddingBottom: 7 }}>
          {filtered.length} payment{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{[...Array(8)].map((_, i) => <th key={i} style={thStyle}><SkeletonBox width={80} height={14} /></th>)}</tr></thead>
              <tbody>{[...Array(8)].map((_, i) => <tr key={i}>{[140,100,100,80,80,80,80,80].map((w,j) => <td key={j} style={tdStyle}><SkeletonBox width={w} height={14} /></td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : error ? (
          <div style={{ margin: 16, padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>No payments found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Route', 'Broker', 'Carrier', 'Amount', 'Fee', 'Carrier Gets', 'Status', 'Date'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const badge = STATUS_BADGE[p.status];
                  return (
                    <tr key={p.id}>
                      <td style={tdStyle}><span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{p.load_origin || '—'} → {p.load_destination || '—'}</span></td>
                      <td style={tdStyle}>
                        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{p.broker_name || '—'}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{p.broker_email}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{p.carrier_name || '—'}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{p.carrier_email}</span>
                      </td>
                      <td style={tdStyle}><span style={{ fontWeight: 700 }}>{fmt(p.amount)}</span></td>
                      <td style={tdStyle}><span style={{ fontWeight: 600, color: 'var(--ion-color-primary)' }}>{fmt(p.fee_amount)}</span></td>
                      <td style={tdStyle}><span style={{ color: '#2e7d32' }}>{fmt(p.carrier_amount)}</span></td>
                      <td style={tdStyle}>
                        {badge && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>}
                      </td>
                      <td style={tdStyle}><span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{fmtDate(p.created_at)}</span></td>
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
