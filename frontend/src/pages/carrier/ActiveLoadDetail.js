import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { GoogleMap, DirectionsRenderer, Marker, useJsApiLoader } from '@react-google-maps/api';
import { bookingsApi, freightPaymentsApi } from '../../services/api';
import RateConSignature from '../../components/shared/RateConSignature';
import DocumentPanel from '../../components/documents/DocumentPanel';
import IonIcon from '../../components/IonIcon';

const LIBRARIES = ['places'];
const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  scrollwheel: false,
  styles: [
    { featureType: 'poi',     stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ],
};

const A_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z" fill="#22c55e"/><circle cx="16" cy="16" r="8" fill="white"/><text x="16" y="20" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="10" fill="#22c55e">A</text></svg>`;
const B_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z" fill="#ef4444"/><circle cx="16" cy="16" r="8" fill="white"/><text x="16" y="20" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="10" fill="#ef4444">B</text></svg>`;

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', fontFamily: 'inherit' };

function LoadHeroMap({ origin, dest }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '', libraries: LIBRARIES });
  const [directions, setDirections] = useState(null);
  const mapRef = useRef(null);
  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

  useEffect(() => {
    if (!isLoaded || !origin || !dest) return;
    new window.google.maps.DirectionsService().route(
      { origin, destination: dest, travelMode: window.google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
          setTimeout(() => {
            const map = mapRef.current;
            if (!map) return;
            const bounds = new window.google.maps.LatLngBounds();
            result.routes[0].legs[0].steps.forEach(step => bounds.extend(step.start_location));
            bounds.extend(result.routes[0].legs[0].end_location);
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          }, 100);
        }
      }
    );
  }, [isLoaded, origin, dest]);

  const aIcon = isLoaded ? { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(A_ICON_SVG)}`, scaledSize: new window.google.maps.Size(32, 40), anchor: new window.google.maps.Point(16, 40) } : undefined;
  const bIcon = isLoaded ? { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(B_ICON_SVG)}`, scaledSize: new window.google.maps.Size(32, 40), anchor: new window.google.maps.Point(16, 40) } : undefined;

  if (!isLoaded) return (
    <div style={{ height: 420, backgroundColor: '#e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <IonSpinner name="crescent" />
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      <GoogleMap mapContainerStyle={{ height: 420, width: '100%' }} options={MAP_OPTIONS} zoom={6} onLoad={onMapLoad}>
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#22c55e', strokeWeight: 4, strokeOpacity: 0.9 } }} />}
        {directions && <Marker position={directions.routes[0].legs[0].start_location} icon={aIcon} />}
        {directions && <Marker position={directions.routes[0].legs[0].end_location} icon={bIcon} />}
      </GoogleMap>
      <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
        <div style={{ padding: '6px 12px', backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb' }}>{origin}</span>
          </div>
        </div>
        <div style={{ flex: 1, margin: '0 8px', height: 1, backgroundColor: 'rgba(34,197,94,0.3)' }} />
        <div style={{ padding: '6px 12px', backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb' }}>{dest}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const TMS_STEPS  = ['Dispatched', 'Picked Up', 'In Transit', 'Delivered', 'POD Received'];
const TMS_VALUES = ['dispatched', 'picked_up', 'in_transit', 'delivered', 'pod_received'];

const BOOKING_STEPS = [
  { key: 'quoted',     label: 'Quoted',     iconName: 'location-outline' },
  { key: 'booked',     label: 'Booked',     iconName: 'checkmark-circle' },
  { key: 'in_transit', label: 'In Transit', iconName: 'navigate-outline' },
  { key: 'delivered',  label: 'Delivered',  iconName: 'car-sport-outline' },
];

function stepIndex(status) {
  if (status === 'completed')                        return 3;
  if (status === 'in_transit')                       return 2;
  if (status === 'approved' || status === 'booked')  return 1;
  return 0;
}

function BookingStepper({ status }) {
  const active = stepIndex(status);
  const CIRCLE = 32;
  const pct = (active / (BOOKING_STEPS.length - 1)) * 100;

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginBottom: 8 }}>
        {/* Track background */}
        <div style={{ position: 'absolute', top: '50%', left: CIRCLE / 2, right: CIRCLE / 2, height: 3, backgroundColor: 'var(--ion-color-light)', borderRadius: 2, transform: 'translateY(-50%)' }} />
        {/* Track fill */}
        <div style={{ position: 'absolute', top: '50%', left: CIRCLE / 2, right: CIRCLE / 2, height: 3, borderRadius: 2, transform: 'translateY(-50%)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--ion-color-primary)', borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
        {BOOKING_STEPS.map((step, i) => {
          const done    = i < active;
          const current = i === active;
          return (
            <div key={step.key} style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ width: CIRCLE, height: CIRCLE, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: done || current ? 'var(--ion-color-primary)' : 'var(--ion-card-background)', border: `2.5px solid ${done || current ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)'}`, color: done || current ? '#fff' : 'var(--ion-color-medium)', transition: 'all 0.3s ease', boxShadow: current ? '0 0 0 5px rgba(25,118,210,0.15)' : 'none' }}>
                {done
                  ? <IonIcon name="checkmark-circle" style={{ fontSize: 16 }} />
                  : current
                  ? <IonIcon name={step.iconName} style={{ fontSize: 16 }} />
                  : <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--ion-color-medium)' }} />}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex' }}>
        {BOOKING_STEPS.map((step, i) => {
          const done    = i < active;
          const current = i === active;
          return (
            <div key={step.key} style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: current ? 700 : done ? 500 : 400, color: current ? 'var(--ion-color-primary)' : done ? 'var(--ion-text-color)' : 'var(--ion-color-medium)', letterSpacing: current ? '0.3px' : 0 }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TmsStepper({ tmsStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {TMS_STEPS.map((step, idx) => {
        const done   = idx < tmsStep;
        const active = idx === tmsStep;
        return (
          <div key={step} style={{ display: 'contents' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: done || active ? 'var(--ion-color-primary)' : 'var(--ion-color-light)', border: active ? '2px solid var(--ion-color-primary)' : 'none' }}>
                {done && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span style={{ marginTop: 4, fontSize: '0.6rem', color: active ? 'var(--ion-color-primary)' : done ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>{step}</span>
            </div>
            {idx < TMS_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, margin: '0 4px 16px', backgroundColor: done ? 'var(--ion-color-primary)' : 'var(--ion-border-color)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const PAYMENT_STATUS = {
  pending:  { label: 'Payment Pending', bg: 'var(--ion-color-light)',            color: 'var(--ion-color-medium)' },
  escrowed: { label: 'In Escrow',       bg: 'rgba(2,136,209,0.12)',              color: '#0288d1' },
  released: { label: 'Paid',            bg: 'rgba(46,125,50,0.12)',              color: '#2e7d32' },
  failed:   { label: 'Payment Failed',  bg: 'rgba(211,47,47,0.12)',              color: '#d32f2f' },
  refunded: { label: 'Refunded',        bg: 'rgba(237,108,2,0.12)',              color: '#ed6c02' },
  unpaid:   { label: 'Unpaid',          bg: 'var(--ion-color-light)',            color: 'var(--ion-color-medium)' },
};

function PaymentStatusBadge({ status }) {
  const cfg = PAYMENT_STATUS[status || 'unpaid'] || PAYMENT_STATUS.unpaid;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function CallAvatar({ name, role }) {
  const bg = role === 'broker' ? 'var(--ion-color-primary)' : '#7c4dff';
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>{(name || '?')[0].toUpperCase()}</span>
    </div>
  );
}

export default function ActiveLoadDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [booking, setBooking]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkCalls, setCheckCalls]       = useState([]);
  const [callNote, setCallNote]           = useState('');
  const [addingCall, setAddingCall]       = useState(false);
  const callsEndRef = useRef(null);

  const load    = booking?.load;
  const tmsStep = booking?.tms_status ? TMS_VALUES.indexOf(booking.tms_status) : -1;

  useEffect(() => {
    bookingsApi.get(bookingId)
      .then(data => setBooking(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    freightPaymentsApi.status(bookingId).then(ps => setPaymentStatus(ps)).catch(() => {});
    bookingsApi.checkCalls(bookingId).then(calls => setCheckCalls(calls)).catch(() => {});
  }, [bookingId]);

  useEffect(() => { callsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [checkCalls]);

  const handlePickup = async () => {
    setActionLoading(true);
    try { await bookingsApi.pickup(bookingId); setBooking(b => ({ ...b, status: 'in_transit' })); }
    catch (e) { alert(e.message); } finally { setActionLoading(false); }
  };

  const handleDeliver = async () => {
    setActionLoading(true);
    try { await bookingsApi.deliver(bookingId); setBooking(b => ({ ...b, status: 'completed' })); }
    catch (e) { alert(e.message); } finally { setActionLoading(false); }
  };

  const handleAddCall = async () => {
    if (!callNote.trim()) return;
    setAddingCall(true);
    try {
      await bookingsApi.addCheckCall(bookingId, callNote.trim());
      const calls = await bookingsApi.checkCalls(bookingId);
      setCheckCalls(calls);
      setCallNote('');
    } catch (e) { alert(e.message); } finally { setAddingCall(false); }
  };

  const netProfit = load ? (load.rate || 0) - (load.fuel_cost_est || 0) - Math.round((load.deadhead_miles || 0) * 0.62) - 120 : 0;
  const canDownloadRateCon = ['approved', 'in_transit', 'completed'].includes(booking?.status);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <IonSpinner name="crescent" />
    </div>
  );

  if (error || !booking) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <IonIcon name="warning-outline" style={{ fontSize: 40, color: '#d32f2f', display: 'block', margin: '0 auto 12px' }} />
      <p style={{ margin: '0 0 16px', color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>{error || 'Booking not found.'}</p>
      <button onClick={() => navigate('/carrier/job-manager')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }}>Go back</button>
    </div>
  );

  // ── Tab: Overview ────────────────────────────────────────────────────────────
  const OverviewTab = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ margin: '-24px -24px 24px', overflow: 'hidden', position: 'relative' }}>
        {load?.origin && load?.destination
          ? <LoadHeroMap origin={load.origin} dest={load.destination} />
          : <div style={{ height: 420, backgroundColor: 'var(--ion-color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IonIcon name="car-sport-outline" style={{ fontSize: 48, color: 'var(--ion-color-medium)' }} /></div>
        }
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, flex: '0 0 550px', minWidth: 0, padding: 20 }}>
          <BookingStepper status={booking.status} />
          <div style={{ borderTop: '1px solid var(--ion-border-color)', margin: '16px 0' }} />
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Booking #{bookingId.slice(0, 8)}</span>
              {load?.load_type && <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: '1px solid var(--ion-color-primary)', color: 'var(--ion-color-primary)' }}>{load.load_type.replace('_', ' ')}</span>}
              {booking.tms_status && <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, backgroundColor: tmsStep >= 3 ? 'rgba(46,125,50,0.12)' : 'rgba(2,136,209,0.12)', color: tmsStep >= 3 ? '#2e7d32' : '#0288d1' }}>{TMS_STEPS[tmsStep] || booking.tms_status}</span>}
            </div>
            <h3 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ion-text-color)' }}>{load?.origin} → {load?.destination}</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
              {load?.commodity}{load?.weight_lbs ? ` · ${Number(load.weight_lbs).toLocaleString()} lbs` : ''}{load?.miles ? ` · ${load.miles} loaded miles` : ''}
            </p>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Rate',     value: `$${(load?.rate || 0).toLocaleString()}` },
              { label: 'Per Mile', value: load?.rate && load?.miles ? `$${(load.rate / load.miles).toFixed(2)}` : '—' },
              { label: 'Miles',    value: load?.miles ? `${load.miles} mi` : '—' },
              { label: 'Weight',   value: load?.weight_lbs ? `${Number(load.weight_lbs).toLocaleString()} lbs` : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ border: '1px solid var(--ion-border-color)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>{label}</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ion-text-color)', display: 'block', marginTop: 2 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Pickup / Delivery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {[{ label: 'Pickup', addr: load?.origin, date: load?.pickup_date, dot: '#22c55e' }, { label: 'Delivery', addr: load?.destination, date: load?.delivery_date, dot: '#ef4444' }].map(({ label, addr, date, dot }) => (
              <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ marginTop: 4, width: 10, height: 10, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>{label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block', lineHeight: 1.3 }}>{addr || '—'}</span>
                  {date && <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><IonIcon name="calendar-outline" style={{ fontSize: 11, color: 'var(--ion-color-medium)' }} /><span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{date}</span></span>}
                </div>
              </div>
            ))}
          </div>

          {/* TMS Stepper */}
          {booking.tms_status && (
            <div style={{ paddingTop: 16, borderTop: '1px solid var(--ion-border-color)', marginBottom: 16 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 8 }}>Dispatch Milestones</span>
              <TmsStepper tmsStep={tmsStep} />
            </div>
          )}

          {/* Driver */}
          {(booking.driver_name || booking.driver_phone) && (
            <div style={{ padding: 12, backgroundColor: 'var(--ion-color-light)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <IonIcon name="person-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>Assigned Driver</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block' }}>{booking.driver_name || '—'}</span>
                {booking.driver_phone && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{booking.driver_phone}</span>}
              </div>
            </div>
          )}

          {/* Notes */}
          {(load?.notes || booking.carrier_visible_notes || booking.note || booking.broker_note) && (
            <div style={{ paddingTop: 16, borderTop: '1px solid var(--ion-border-color)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Notes</span>
              {load?.notes && <div><span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>Load Instructions</span><p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{load.notes}</p></div>}
              {booking.carrier_visible_notes && <div><span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>Dispatch Notes</span><p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{booking.carrier_visible_notes}</p></div>}
              {booking.note && <div><span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>Your Note</span><p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{booking.note}</p></div>}
              {booking.broker_note && <div><span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>Broker Note</span><p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{booking.broker_note}</p></div>}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Load Status card */}
          <div style={{ ...cardStyle, padding: 20 }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', display: 'block', marginBottom: 16 }}>Load Status</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {booking.status === 'pending' && (
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(237,108,2,0.08)', border: '1px solid rgba(237,108,2,0.3)', borderRadius: 6 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.875rem', color: '#ed6c02' }}>Awaiting Broker Approval</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#ed6c02' }}>The broker hasn't confirmed your booking yet.</p>
                </div>
              )}
              {booking.status === 'approved' && (
                <button onClick={handlePickup} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '1rem', opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? <IonSpinner name="crescent" style={{ width: 16, height: 16, color: '#fff' }} /> : <IonIcon name="navigate-outline" style={{ fontSize: 16 }} />}
                  Confirm Pickup — Mark as In Transit
                </button>
              )}
              {booking.status === 'in_transit' && (
                <button onClick={handleDeliver} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '1rem', opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? <IonSpinner name="crescent" style={{ width: 16, height: 16, color: '#fff' }} /> : <IonIcon name="flag-outline" style={{ fontSize: 16 }} />}
                  Confirm Delivery — Mark as Delivered
                </button>
              )}
              {booking.status === 'completed' && (
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.3)', borderRadius: 6 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.875rem', color: '#2e7d32' }}>Load Delivered</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#2e7d32' }}>This load has been completed.</p>
                </div>
              )}
              {load?.broker_user_id && (
                <Link to={`/carrier/messages?userId=${load.broker_user_id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', border: '1px solid var(--ion-color-primary)', borderRadius: 6, color: 'var(--ion-color-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                  <IonIcon name="chatbubble-outline" style={{ fontSize: 16 }} /> Message Broker
                </Link>
              )}
              {load?.broker_name && (
                <div style={{ paddingTop: 8 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 4 }}>Broker</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block' }}>{load.broker_name}</span>
                  {load.broker_mc && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>MC# {load.broker_mc}</span>}
                  {load.broker_email && <a href={`mailto:${load.broker_email}`} style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: 'var(--ion-color-primary)', fontSize: '0.875rem', textDecoration: 'none' }}><IonIcon name="mail-outline" style={{ fontSize: 14 }} />{load.broker_email}</a>}
                  {load.broker_phone && <a href={`tel:${load.broker_phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: 'var(--ion-color-primary)', fontSize: '0.875rem', textDecoration: 'none' }}><IonIcon name="call-outline" style={{ fontSize: 14 }} />{load.broker_phone}</a>}
                </div>
              )}
            </div>
          </div>

          {/* Check call log */}
          {booking.status !== 'pending' && (
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <IonIcon name="chatbox-outline" style={{ fontSize: 16, color: 'var(--ion-color-medium)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)' }}>Check Call Log</span>
                {checkCalls.length > 0 && <span style={{ padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: 'var(--ion-color-light)', color: 'var(--ion-text-color)' }}>{checkCalls.length}</span>}
              </div>
              {checkCalls.length === 0
                ? <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No check calls yet.</p>
                : (
                  <div style={{ marginBottom: 16, maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {checkCalls.map((call, idx) => (
                      <div key={call.id}>
                        <div style={{ padding: '12px 0', display: 'flex', gap: 12 }}>
                          <CallAvatar name={call.author_name} role={call.author_role} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{call.author_name}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{new Date(call.created_at).toLocaleString()}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-text-color)', wordBreak: 'break-word' }}>{call.note}</p>
                          </div>
                        </div>
                        {idx < checkCalls.length - 1 && <div style={{ borderTop: '1px solid var(--ion-border-color)' }} />}
                      </div>
                    ))}
                    <div ref={callsEndRef} />
                  </div>
                )
              }
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 40, maxHeight: 80, flex: 1 }}
                  rows={1}
                  placeholder="Add a check call note..."
                  value={callNote}
                  onChange={e => setCallNote(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCall(); } }}
                />
                <button onClick={handleAddCall} disabled={!callNote.trim() || addingCall} style={{ padding: '8px 16px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: (!callNote.trim() || addingCall) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem', opacity: (!callNote.trim() || addingCall) ? 0.7 : 1, alignSelf: 'flex-end', minWidth: 60 }}>
                  {addingCall ? <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} /> : 'Add'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Tab: Payments ────────────────────────────────────────────────────────────
  const PaymentsTab = (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ ...cardStyle, flex: 1, padding: 20 }}>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)', display: 'block', marginBottom: 16 }}>Profit Breakdown</span>
        {[
          { label: 'Gross Rate',                                       value: `+$${(load?.rate || 0).toLocaleString()}`,                color: '#2e7d32' },
          { label: `Fuel (~${load?.miles || 0} mi)`,                   value: `-$${load?.fuel_cost_est || 0}`,                          color: '#d32f2f' },
          { label: `Deadhead (${load?.deadhead_miles || 0} mi)`,       value: `-$${Math.round((load?.deadhead_miles || 0) * 0.62)}`,    color: '#d32f2f' },
          { label: 'Misc / tolls',                                     value: '-$120',                                                  color: '#d32f2f' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{label}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color }}>{value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Est. Net Profit</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: netProfit > 0 ? '#2e7d32' : '#d32f2f' }}>{netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ ...cardStyle, flex: '0 0 320px', padding: 20 }}>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)', display: 'block', marginBottom: 16 }}>Payment Status</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: paymentStatus?.carrier_amount ? 12 : 0 }}>
          <PaymentStatusBadge status={paymentStatus?.status} />
          {(!paymentStatus || paymentStatus.status === 'unpaid') && <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>Awaiting broker payment</span>}
          {paymentStatus?.status === 'escrowed' && <span style={{ fontSize: '0.75rem', color: '#0288d1' }}>Funds held in escrow</span>}
          {paymentStatus?.status === 'released' && <span style={{ fontSize: '0.75rem', color: '#2e7d32' }}>Payment released to you</span>}
        </div>
        {paymentStatus?.carrier_amount && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>You receive</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2e7d32' }}>${paymentStatus.carrier_amount?.toLocaleString()}</span>
          </div>
        )}
        {paymentStatus?.released_at && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginTop: 4 }}>Released {new Date(paymentStatus.released_at).toLocaleDateString()}</span>}
        {paymentStatus?.escrowed_at && paymentStatus?.status === 'escrowed' && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginTop: 4 }}>Escrowed {new Date(paymentStatus.escrowed_at).toLocaleDateString()}</span>}
      </div>
    </div>
  );

  // ── Tab: Documents ───────────────────────────────────────────────────────────
  const DocumentsTab = (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ ...cardStyle, flex: 1, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <IonIcon name="chatbox-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 16 }} />
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)' }}>Documents</span>
        </div>
        <DocumentPanel loadId={load?.id} bookingId={bookingId} />
      </div>
      {canDownloadRateCon && (
        <div style={{ ...cardStyle, flex: '0 0 360px', padding: 20 }}>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)', display: 'block', marginBottom: 4 }}>Rate Confirmation</span>
          <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Sign or download the rate confirmation for this load.</p>
          <RateConSignature bookingId={bookingId} role="carrier" />
        </div>
      )}
    </div>
  );

  return (
    <div>
      {activeTab === 'overview'  && OverviewTab}
      {activeTab === 'payments'  && PaymentsTab}
      {activeTab === 'documents' && DocumentsTab}
    </div>
  );
}
