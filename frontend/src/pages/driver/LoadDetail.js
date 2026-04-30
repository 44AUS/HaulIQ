import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { driverApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const TMS_STEPS  = ['Dispatched', 'Picked Up', 'In Transit', 'Delivered'];
const TMS_VALUES = ['dispatched', 'picked_up', 'in_transit', 'delivered'];

const NEXT_ACTION = {
  null:       { label: 'Mark Dispatched', value: 'dispatched' },
  dispatched: { label: 'Mark Picked Up',  value: 'picked_up' },
  picked_up:  { label: 'Mark In Transit', value: 'in_transit' },
  in_transit: { label: 'Mark Delivered',  value: 'delivered' },
};

const PAY_STATUS = {
  paid:    { bg: 'rgba(46,125,50,0.12)',  color: '#2e7d32' },
  pending: { bg: 'rgba(237,108,2,0.12)',  color: '#ed6c02' },
  unpaid:  { bg: 'var(--ion-color-light)', color: 'var(--ion-color-medium)' },
};

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };

function TmsStepper({ activeStep }) {
  const total = TMS_STEPS.length;
  const pct = activeStep < 0 ? 0 : Math.round((activeStep / (total - 1)) * 100);
  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      <div style={{ position: 'absolute', top: 13, left: '12.5%', right: '12.5%', height: 3, backgroundColor: 'var(--ion-color-light)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, backgroundColor: 'var(--ion-color-primary)', borderRadius: 2, transition: 'width 0.4s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        {TMS_STEPS.map((label, idx) => {
          const done = activeStep > idx;
          const active = activeStep === idx;
          return (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${100 / total}%` }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: done || active ? 'var(--ion-color-primary)' : 'var(--ion-color-light)', border: `2px solid ${done || active ? 'var(--ion-color-primary)' : 'var(--ion-border-color)'}`, marginBottom: 6 }}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: active ? '#fff' : 'var(--ion-color-medium)' }} />
                )}
              </div>
              <span style={{ fontSize: '0.68rem', color: done || active ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', fontWeight: active ? 700 : 500, textAlign: 'center' }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DriverLoadDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetch_ = () => {
    driverApi.loadDetail(bookingId)
      .then(setBooking)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch_(); }, [bookingId]); // eslint-disable-line

  const handleAdvance = async () => {
    const action = NEXT_ACTION[booking.tms_status || null];
    if (!action) return;
    setUpdating(true);
    try {
      await driverApi.updateStatus(bookingId, action.value);
      fetch_();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <IonSpinner name="crescent" />
    </div>
  );
  if (error || !booking) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <IonIcon name="warning-outline" style={{ fontSize: 40, color: '#d32f2f', marginBottom: 12 }} />
      <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{error || 'Load not found.'}</p>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--ion-color-primary)', cursor: 'pointer', fontSize: '0.875rem' }}>Go back</button>
    </div>
  );

  const load = booking.load || {};
  const tmsStep = TMS_VALUES.indexOf(booking.tms_status || '');
  const nextAction = NEXT_ACTION[booking.tms_status || null];
  const isDelivered = ['delivered', 'pod_received'].includes(booking.tms_status);
  const payCfg = PAY_STATUS[booking.driver_pay_status] || PAY_STATUS.unpaid;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', backgroundColor: 'var(--ion-card-background)', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      <button onClick={() => navigate('/driver/loads')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--ion-color-primary)', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
        <IonIcon name="arrow-back-outline" style={{ fontSize: 16 }} />
        Back to Loads
      </button>

      {/* Header */}
      <div style={{ ...cardStyle, padding: 20 }}>
        <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--ion-text-color)', display: 'block' }}>
          {load.origin} → {load.destination}
        </span>
        <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', display: 'block', marginTop: 4, marginBottom: 20 }}>
          {[load.commodity, load.miles ? `${load.miles.toLocaleString()} mi` : null, load.load_type].filter(Boolean).join(' · ')}
        </span>

        <TmsStepper activeStep={tmsStep} />

        {isDelivered ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', backgroundColor: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.25)', borderRadius: 8 }}>
            <IonIcon name="checkmark-circle" style={{ fontSize: 18, color: '#2e7d32', flexShrink: 0, marginTop: 1 }} />
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#2e7d32', display: 'block' }}>Load delivered</span>
              {booking.tms_status === 'pod_received' && (
                <span style={{ fontSize: '0.75rem', color: '#2e7d32' }}>POD confirmed by carrier.</span>
              )}
            </div>
          </div>
        ) : nextAction ? (
          <button
            onClick={handleAdvance}
            disabled={updating}
            style={{ width: '100%', padding: '14px 0', borderRadius: 8, border: 'none', backgroundColor: 'var(--ion-color-primary)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {updating && <IonSpinner name="crescent" style={{ width: 16, height: 16, color: '#fff' }} />}
            {updating ? 'Updating…' : nextAction.label}
          </button>
        ) : null}
      </div>

      {/* Instructions */}
      {booking.carrier_visible_notes && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', backgroundColor: 'rgba(2,136,209,0.08)', border: '1px solid rgba(2,136,209,0.25)', borderRadius: 8 }}>
          <IonIcon name="information-circle-outline" style={{ fontSize: 18, color: '#0288d1', flexShrink: 0, marginTop: 1 }} />
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0288d1', display: 'block', marginBottom: 2 }}>Carrier instructions:</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{booking.carrier_visible_notes}</span>
          </div>
        </div>
      )}

      {/* Load details */}
      <div style={{ ...cardStyle, padding: 20 }}>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)', display: 'block', marginBottom: 14 }}>Load Details</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Pickup',        load.pickup_address || load.origin       || '—'],
            ['Delivery',      load.delivery_address || load.destination || '—'],
            ['Pickup Date',   load.pickup_date   ? new Date(load.pickup_date).toLocaleDateString()   : '—'],
            ['Delivery Date', load.delivery_date ? new Date(load.delivery_date).toLocaleDateString() : '—'],
            ['Commodity',     load.commodity  || '—'],
            ['Equipment',     load.load_type  || '—'],
            ['Weight',        load.weight_lbs ? `${load.weight_lbs.toLocaleString()} lbs` : '—'],
            ['Miles',         load.miles      ? `${load.miles.toLocaleString()} mi`       : '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{k}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pay */}
      {booking.driver_pay && (
        <div style={{ ...cardStyle, padding: 20 }}>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)', display: 'block', marginBottom: 14 }}>Your Pay</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--ion-text-color)' }}>
              ${booking.driver_pay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, backgroundColor: payCfg.bg, color: payCfg.color }}>
              {booking.driver_pay_status}
            </span>
          </div>
        </div>
      )}

      {/* Timestamps */}
      {(booking.dispatched_at || booking.picked_up_at || booking.delivered_at) && (
        <div style={{ ...cardStyle, padding: 20 }}>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)', display: 'block', marginBottom: 14 }}>Timestamps</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Dispatched', booking.dispatched_at],
              ['Picked Up',  booking.picked_up_at],
              ['In Transit', booking.in_transit_at],
              ['Delivered',  booking.delivered_at],
            ].filter(([, ts]) => ts).map(([label, ts]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{label}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{new Date(ts).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
