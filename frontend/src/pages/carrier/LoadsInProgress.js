import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { bookingsApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const STATUS_CONFIG = {
  quoted:     { label: 'Awaiting Response', bg: 'rgba(237,108,2,0.12)',  color: '#ed6c02' },
  booked:     { label: 'Booked',            bg: 'rgba(2,136,209,0.12)',  color: '#0288d1' },
  in_transit: { label: 'In Transit',        bg: 'rgba(46,125,50,0.12)',  color: '#2e7d32' },
  delivered:  { label: 'Delivered',         bg: 'var(--ion-color-light)', color: 'var(--ion-color-medium)' },
};

const TIMELINE_STEPS = ['Quoted', 'Booked', 'In Transit', 'Delivered'];
const STATUS_STEP = { quoted: 0, booked: 1, in_transit: 2, delivered: 3 };

function StatusTimeline({ status }) {
  const current = STATUS_STEP[status] ?? 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: 16 }}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done   = idx < current;
        const active = idx === current;
        return (
          <div key={step} style={{ display: 'contents' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: done || active ? 'var(--ion-color-primary)' : 'var(--ion-color-light)',
                border: active ? '2px solid var(--ion-color-primary)' : 'none',
                boxShadow: active ? '0 0 0 3px rgba(21,101,192,0.15)' : 'none',
              }}>
                {done && (
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {active && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'white', display: 'inline-block' }} />}
              </div>
              <span style={{
                marginTop: 4,
                whiteSpace: 'nowrap',
                fontSize: '0.6rem',
                color: active ? 'var(--ion-color-primary)' : done ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)',
                fontWeight: active ? 700 : 400,
              }}>
                {step}
              </span>
            </div>
            {idx < TIMELINE_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, margin: '0 4px 16px', backgroundColor: done ? 'var(--ion-color-primary)' : 'var(--ion-border-color)', borderTop: done ? 'none' : '1px dashed var(--ion-border-color)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LoadProgressCard({ load, onClick }) {
  const cfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.quoted;
  return (
    <div onClick={onClick} style={{ backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8, padding: 16, cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>Load #{load.id.slice(0, 8)}</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block' }}>{load.load_type}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
          <IonIcon name="chevron-forward-outline" style={{ fontSize: 16, color: 'var(--ion-color-medium)' }} />
        </div>
      </div>

      {/* Route */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <IonIcon name="location-outline" style={{ fontSize: 10, color: 'var(--ion-color-medium)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Origin</span>
          </span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{load.origin}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <IonIcon name="arrow-forward-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{load.miles}mi</span>
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginBottom: 4 }}>
            <IonIcon name="location-outline" style={{ fontSize: 10, color: 'var(--ion-color-medium)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Dest</span>
          </span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{load.destination}</span>
        </div>
      </div>

      {/* Dates */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <IonIcon name="calendar-outline" style={{ fontSize: 10, color: 'var(--ion-color-medium)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Pickup: <strong style={{ color: 'var(--ion-text-color)' }}>{load.pickup_date}</strong></span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <IonIcon name="calendar-outline" style={{ fontSize: 10, color: 'var(--ion-color-medium)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Drop: <strong style={{ color: 'var(--ion-text-color)' }}>{load.delivery_date}</strong></span>
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Rate',       value: `$${(load.rate || 0).toLocaleString()}`,          color: 'var(--ion-text-color)' },
          { label: 'Net Profit', value: `$${(load.net_profit_est || 0).toLocaleString()}`, color: 'var(--ion-color-primary)' },
          { label: 'Per Mile',   value: `$${(load.rate_per_mile || 0).toFixed(2)}`,       color: 'var(--ion-text-color)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: 'var(--ion-color-light)', borderRadius: 6, padding: '10px 8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>{label}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color, display: 'block', marginTop: 2 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 4 }}>
        {load.commodity && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IonIcon name="cube-outline" style={{ fontSize: 10, color: 'var(--ion-color-medium)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{load.commodity}</span>
          </span>
        )}
        {load.weight_lbs && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IonIcon name="scale-outline" style={{ fontSize: 10, color: 'var(--ion-color-medium)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{Number(load.weight_lbs).toLocaleString()} lbs</span>
          </span>
        )}
        {load.broker_name && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{load.broker_name}</span>}
      </div>

      <StatusTimeline status={load.status} />

      <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', textAlign: 'right', marginTop: 8 }}>
        Tap to view details & update status
      </span>
    </div>
  );
}

export default function CarrierLoadsInProgress() {
  const navigate = useNavigate();
  const [loads, setLoads]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi.inProgress()
      .then(data => setLoads(Array.isArray(data) ? data : []))
      .catch(() => setLoads([]))
      .finally(() => setLoading(false));
  }, []);

  const inTransitCount = loads.filter(l => l.status === 'in_transit').length;
  const bookedCount    = loads.filter(l => l.status === 'booked' || l.status === 'in_transit').length;
  const quotedCount    = loads.filter(l => l.status === 'quoted').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <IonIcon name="analytics-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 26 }} />
        <h2 style={{ margin: 0, fontWeight: 700, color: 'var(--ion-text-color)' }}>Loads in Progress</h2>
        <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, border: '1px solid var(--ion-color-primary)', color: 'var(--ion-color-primary)' }}>{loads.length}</span>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'In Transit',       value: inTransitCount, color: '#2e7d32' },
          { label: 'Booked',           value: bookedCount,    color: '#0288d1' },
          { label: 'Pending Response', value: quotedCount,    color: '#ed6c02' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: '1 1 180px', minWidth: 0, backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{label}</p>
            <span style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['60%', 20], ['80%', 16], ['50%', 16]].map(([w, h], j) => (
                <div key={j} style={{ width: w, height: h, backgroundColor: 'var(--ion-color-light)', borderRadius: 4 }} />
              ))}
            </div>
          ))}
        </div>
      ) : loads.length === 0 ? (
        <div style={{ backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8, padding: '64px 0', textAlign: 'center' }}>
          <IonIcon name="analytics-outline" style={{ fontSize: 48, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)' }}>No active loads</p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Book a load from the Load Board to see it here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {loads.map(load => (
            <LoadProgressCard
              key={load.id}
              load={load}
              onClick={() => navigate(`/carrier/active/${load.booking_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
