import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { driverApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const TMS_STEPS  = ['Dispatched', 'Picked Up', 'In Transit', 'Delivered'];
const TMS_VALUES = ['dispatched', 'picked_up', 'in_transit', 'delivered'];

const NEXT_ACTION = {
  null:        { label: 'Mark Dispatched', next: 'dispatched' },
  dispatched:  { label: 'Mark Picked Up',  next: 'picked_up' },
  picked_up:   { label: 'Mark In Transit', next: 'in_transit' },
  in_transit:  { label: 'Mark Delivered',  next: 'delivered' },
  delivered:   null,
  pod_received: null,
};

const cardStyle = {
  backgroundColor: 'var(--ion-card-background)',
  border: '1px solid var(--ion-border-color)',
  borderRadius: 8,
};

function StatusBadge({ status }) {
  const label = (status || 'assigned').replace(/_/g, ' ');
  const isDelivered = status === 'delivered';
  return (
    <span style={{ backgroundColor: isDelivered ? 'rgba(45,211,111,0.12)' : 'var(--ion-color-light)', color: isDelivered ? '#2dd36f' : 'var(--ion-text-color)', borderRadius: 10, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>
      {label}
    </span>
  );
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    driverApi.loads()
      .then(data => setLoads(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeLoad = loads.find(l =>
    l.tms_status && !['delivered', 'pod_received'].includes(l.tms_status)
  ) || loads.find(l => l.status === 'approved' && !l.tms_status);

  const handleAdvance = async (load) => {
    const action = NEXT_ACTION[load.tms_status || null];
    if (!action) return;
    setUpdating(load.id);
    try {
      await driverApi.updateStatus(load.id, action.next);
      const updated = await driverApi.loads();
      setLoads(Array.isArray(updated) ? updated : []);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <IonSpinner name="crescent" />
    </div>
  );

  const activeStepIdx = TMS_VALUES.indexOf(activeLoad?.tms_status || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: 'var(--ion-text-color)' }}>My Dashboard</h2>

      {/* Active load */}
      {activeLoad ? (
        <div style={cardStyle}>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <IonIcon name="car-sport-outline" style={{ color: 'var(--ion-color-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Active Load</span>
              <span style={{ backgroundColor: activeLoad.tms_status === 'in_transit' ? 'rgba(56,128,255,0.12)' : 'var(--ion-color-light)', color: activeLoad.tms_status === 'in_transit' ? '#3880ff' : 'var(--ion-text-color)', borderRadius: 10, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>
                {(activeLoad.tms_status || 'assigned').replace('_', ' ')}
              </span>
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--ion-text-color)', marginBottom: 4 }}>
              {activeLoad.origin} → {activeLoad.destination}
            </div>
            {activeLoad.commodity && (
              <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                {activeLoad.commodity} · {activeLoad.miles ? `${activeLoad.miles.toLocaleString()} mi` : ''}
              </p>
            )}

            {/* Progress stepper */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
              {TMS_STEPS.map((label, idx) => {
                const completed = activeStepIdx > idx;
                const active    = activeStepIdx === idx;
                return (
                  <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {idx > 0 && (
                      <div style={{ position: 'absolute', top: 11, right: '50%', left: '-50%', height: 2, backgroundColor: completed ? 'var(--ion-color-primary)' : 'var(--ion-border-color)', zIndex: 0 }} />
                    )}
                    <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: completed ? 'var(--ion-color-primary)' : active ? 'var(--ion-color-primary)' : 'var(--ion-border-color)', border: `2px solid ${completed || active ? 'var(--ion-color-primary)' : 'var(--ion-border-color)'}`, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {completed && <IonIcon name="checkmark-outline" style={{ fontSize: 12, color: '#fff' }} />}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', marginTop: 4, textAlign: 'center' }}>{label}</div>
                  </div>
                );
              })}
            </div>

            {activeLoad.carrier_visible_notes && (
              <div style={{ padding: '10px 14px', borderRadius: 6, backgroundColor: 'rgba(56,128,255,0.08)', border: '1px solid rgba(56,128,255,0.2)', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', marginBottom: 4 }}>Instructions from carrier:</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{activeLoad.carrier_visible_notes}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              {NEXT_ACTION[activeLoad.tms_status || null] && (
                <button
                  onClick={() => handleAdvance(activeLoad)}
                  disabled={updating === activeLoad.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 16px', cursor: updating === activeLoad.id ? 'default' : 'pointer', fontWeight: 700, fontFamily: 'inherit', opacity: updating === activeLoad.id ? 0.7 : 1 }}
                >
                  {updating === activeLoad.id && <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} />}
                  {NEXT_ACTION[activeLoad.tms_status || null].label}
                </button>
              )}
              <button onClick={() => navigate(`/driver/loads/${activeLoad.id}`)} style={{ backgroundColor: 'transparent', color: 'var(--ion-color-primary)', border: '1px solid var(--ion-color-primary)', borderRadius: 6, padding: '9px 16px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                View Details
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: '48px 24px', textAlign: 'center' }}>
          <IonIcon name="checkmark-circle" style={{ fontSize: 40, color: 'var(--ion-color-success)', display: 'block', margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)', marginBottom: 4 }}>No active loads</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>You'll see your next assigned load here when your carrier dispatches one.</div>
        </div>
      )}

      {/* Recent loads */}
      {loads.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)', marginBottom: 12 }}>Recent Loads</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loads.slice(0, 3).map(load => (
              <div key={load.id} onClick={() => navigate(`/driver/loads/${load.id}`)} style={{ ...cardStyle, cursor: 'pointer', padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>
                      {load.origin} → {load.destination}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', marginTop: 2 }}>
                      {load.commodity || '—'} · {load.miles ? `${load.miles.toLocaleString()} mi` : ''}
                    </div>
                  </div>
                  <StatusBadge status={load.tms_status || load.status} />
                </div>
              </div>
            ))}
          </div>
          {loads.length > 3 && (
            <button onClick={() => navigate('/driver/loads')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-primary)', fontWeight: 600, fontSize: '0.875rem', marginTop: 8, fontFamily: 'inherit', padding: '4px 0' }}>
              View all loads
            </button>
          )}
        </div>
      )}
    </div>
  );
}
