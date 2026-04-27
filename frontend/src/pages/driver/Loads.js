import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { driverApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const STATUS_CHIP = {
  dispatched:   { bg: 'var(--ion-color-light)',        color: 'var(--ion-color-medium)' },
  picked_up:    { bg: 'rgba(237,108,2,0.12)',          color: '#ed6c02' },
  in_transit:   { bg: 'rgba(2,136,209,0.12)',          color: '#0288d1' },
  delivered:    { bg: 'rgba(46,125,50,0.12)',          color: '#2e7d32' },
  pod_received: { bg: 'rgba(46,125,50,0.12)',          color: '#2e7d32' },
};

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 12px 8px 36px', outline: 'none', fontFamily: 'inherit', width: '100%', maxWidth: 400 };

export default function DriverLoads() {
  const navigate = useNavigate();
  const [loads, setLoads]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    driverApi.loads()
      .then(data => setLoads(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = loads.filter(l =>
    !search ||
    (l.origin || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.destination || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.commodity || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <IonSpinner name="crescent" />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: 'var(--ion-text-color)' }}>My Loads</h2>

      <div style={{ position: 'relative', maxWidth: 400 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <IonIcon name="search-outline" style={{ fontSize: 16, color: 'var(--ion-color-medium)' }} />
        </span>
        <input style={inputStyle} placeholder="Search by origin, destination, or commodity…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px 0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
            {loads.length === 0 ? 'No loads assigned yet.' : 'No loads match your search.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(load => {
            const status = load.tms_status || 'assigned';
            const chipCfg = STATUS_CHIP[load.tms_status] || { bg: 'var(--ion-color-light)', color: 'var(--ion-color-medium)' };
            return (
              <div
                key={load.id}
                onClick={() => navigate(`/driver/loads/${load.id}`)}
                style={{ ...cardStyle, padding: 16, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {load.origin} → {load.destination}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', display: 'block' }}>
                      {[load.commodity, load.miles ? `${load.miles.toLocaleString()} mi` : null].filter(Boolean).join(' · ')}
                    </span>
                    {load.pickup_date && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>
                        Pickup: {new Date(load.pickup_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 0, fontSize: '0.72rem', fontWeight: 600, backgroundColor: chipCfg.bg, color: chipCfg.color }}>
                      {status.replace(/_/g, ' ')}
                    </span>
                    {load.driver_pay && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: load.driver_pay_status === 'paid' ? '#2e7d32' : 'var(--ion-color-medium)' }}>
                        ${load.driver_pay.toLocaleString()} · {load.driver_pay_status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
