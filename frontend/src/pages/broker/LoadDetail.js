import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { IonSpinner, IonModal } from '@ionic/react';
import { loadsApi, bidsApi, bookingsApi, loadTemplatesApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';
import { GoogleMap, DirectionsRenderer, Marker, useJsApiLoader } from '@react-google-maps/api';
import DocumentPanel from '../../components/documents/DocumentPanel';
import IonIcon from '../../components/IonIcon';

const LIBRARIES = ['places'];

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  scrollwheel: false,
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ],
};

const A_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
  <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z" fill="#22c55e"/>
  <circle cx="16" cy="16" r="8" fill="white"/>
  <text x="16" y="20" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="10" fill="#22c55e">A</text>
</svg>`;

const B_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
  <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z" fill="#ef4444"/>
  <circle cx="16" cy="16" r="8" fill="white"/>
  <text x="16" y="20" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="10" fill="#ef4444">B</text>
</svg>`;

const CARRIER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="9" fill="#f59e0b" stroke="white" stroke-width="3"/>
  <circle cx="12" cy="12" r="13" fill="none" stroke="rgba(245,158,11,0.3)" stroke-width="2"/>
</svg>`;

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

// ─── Hero map ─────────────────────────────────────────────────────────────────
function LoadHeroMap({ load, carrierLocation }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const mapRef = useRef(null);
  const [directions, setDirections] = useState(null);

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const fromArg = load.pickupLat && load.pickupLng
      ? new window.google.maps.LatLng(load.pickupLat, load.pickupLng)
      : load.origin;
    const toArg = load.deliveryLat && load.deliveryLng
      ? new window.google.maps.LatLng(load.deliveryLat, load.deliveryLng)
      : load.dest;

    new window.google.maps.DirectionsService().route(
      { origin: fromArg, destination: toArg, travelMode: window.google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
          setTimeout(() => {
            const map = mapRef.current;
            if (!map) return;
            const bounds = new window.google.maps.LatLngBounds();
            result.routes[0].legs[0].steps.forEach(step => bounds.extend(step.start_location));
            bounds.extend(result.routes[0].legs[0].end_location);
            if (carrierLocation?.lat) bounds.extend({ lat: carrierLocation.lat, lng: carrierLocation.lng });
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          }, 100);
        }
      }
    );
  }, [isLoaded, load, carrierLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const aIcon = isLoaded ? {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(A_ICON_SVG)}`,
    scaledSize: new window.google.maps.Size(32, 40),
    anchor: new window.google.maps.Point(16, 40),
  } : undefined;

  const bIcon = isLoaded ? {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(B_ICON_SVG)}`,
    scaledSize: new window.google.maps.Size(32, 40),
    anchor: new window.google.maps.Point(16, 40),
  } : undefined;

  const carrierIcon = isLoaded ? {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(CARRIER_SVG)}`,
    scaledSize: new window.google.maps.Size(24, 24),
    anchor: new window.google.maps.Point(12, 12),
  } : undefined;

  if (!isLoaded) {
    return (
      <div style={{ height: 420, backgroundColor: '#e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IonSpinner name="crescent" style={{ color: '#22c55e' }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={{ height: 420, width: '100%' }}
        options={MAP_OPTIONS}
        zoom={6}
        onLoad={onMapLoad}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: { strokeColor: '#22c55e', strokeWeight: 4, strokeOpacity: 0.9 },
            }}
          />
        )}
        {directions && (
          <Marker position={directions.routes[0].legs[0].start_location} icon={aIcon} title={load.origin} />
        )}
        {directions && (
          <Marker position={directions.routes[0].legs[0].end_location} icon={bIcon} title={load.dest} />
        )}
        {carrierLocation?.lat && carrierLocation?.lng && (
          <Marker position={{ lat: carrierLocation.lat, lng: carrierLocation.lng }} icon={carrierIcon} title="Carrier location" />
        )}
      </GoogleMap>

      {/* Route overlay */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
        <div style={{ padding: '6px 12px', backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb' }}>{load.origin}</span>
          </span>
        </div>
        <div style={{ flex: 1, margin: '0 8px', height: 1, backgroundColor: 'rgba(34,197,94,0.3)', borderTop: '1px dashed rgba(34,197,94,0.3)' }} />
        <div style={{ padding: '6px 12px', backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb' }}>{load.dest}</span>
          </span>
        </div>
      </div>

      {/* Carrier badge */}
      {carrierLocation?.lat && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 6, padding: '6px 10px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fbbf24' }}>Carrier On Route</span>
        </div>
      )}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
const STEPS = [
  { key: 'posted',     label: 'Posted',     iconName: 'location-outline' },
  { key: 'booked',     label: 'Booked',     iconName: 'checkmark-circle' },
  { key: 'in_transit', label: 'In Transit', iconName: 'navigate-outline' },
  { key: 'delivered',  label: 'Delivered',  iconName: 'car-sport-outline' },
];

function stepIndex(loadStatus, bookingStatus) {
  if (bookingStatus === 'completed') return 3;
  if (bookingStatus === 'in_transit') return 2;
  if (bookingStatus === 'approved' || bookingStatus === 'pending') return 1;
  if (loadStatus === 'filled') return 3;
  return 0;
}

function LoadStepper({ load, bookingStatus }) {
  const active = stepIndex(load.status, bookingStatus);
  const CIRCLE = 32;
  const pct = (active / (STEPS.length - 1)) * 100;

  return (
    <div style={{ padding: '12px 0' }}>
      {/* Circles row */}
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginBottom: 8 }}>
        {/* Background track */}
        <div style={{ position: 'absolute', top: '50%', left: CIRCLE / 2, right: CIRCLE / 2, height: 3, backgroundColor: 'var(--ion-color-light)', borderRadius: 2, transform: 'translateY(-50%)' }} />
        {/* Filled progress */}
        <div style={{ position: 'absolute', top: '50%', left: CIRCLE / 2, right: CIRCLE / 2, height: 3, borderRadius: 2, transform: 'translateY(-50%)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--ion-color-primary)', borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
        {STEPS.map((step, i) => {
          const done    = i < active;
          const current = i === active;
          return (
            <div key={step.key} style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: CIRCLE, height: CIRCLE, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: done || current ? 'var(--ion-color-primary)' : 'var(--ion-card-background)',
                border: `2.5px solid ${done || current ? 'var(--ion-color-primary)' : 'var(--ion-color-light)'}`,
                color: done || current ? '#fff' : 'var(--ion-color-medium)',
                boxShadow: current ? '0 0 0 5px rgba(var(--ion-color-primary-rgb),0.15)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                {done
                  ? <IonIcon name="checkmark-circle" style={{ fontSize: 16 }} />
                  : current
                    ? <IonIcon name={step.iconName} style={{ fontSize: 16 }} />
                    : <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--ion-color-medium)', display: 'inline-block' }} />
                }
              </div>
            </div>
          );
        })}
      </div>
      {/* Labels row */}
      <div style={{ display: 'flex' }}>
        {STEPS.map((step, i) => {
          const done    = i < active;
          const current = i === active;
          return (
            <div key={step.key} style={{ flex: 1, textAlign: 'center' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: current ? 700 : done ? 500 : 400,
                color: current ? 'var(--ion-color-primary)' : done ? 'var(--ion-text-color)' : 'var(--ion-color-medium)',
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bid status badge ─────────────────────────────────────────────────────────
const BID_STATUS = {
  pending:   { bg: 'rgba(237,108,2,0.12)',  color: '#ed6c02', label: 'Pending' },
  accepted:  { bg: 'rgba(46,125,50,0.12)',  color: '#2e7d32', label: 'Accepted' },
  rejected:  { bg: 'rgba(211,47,47,0.12)',  color: '#d32f2f', label: 'Rejected' },
  countered: { bg: 'rgba(2,136,209,0.12)',  color: '#0288d1', label: 'Countered' },
  withdrawn: { bg: 'rgba(117,117,117,0.12)', color: '#757575', label: 'Withdrawn' },
};

function bidStatusChip(status) {
  const s = BID_STATUS[status] || BID_STATUS.pending;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function LoadStatusBar({ status }) {
  const STEPS = [
    { label: 'Quote',       bg: '#9E9E9E' },
    { label: 'Scheduled',   bg: '#1976D2' },
    { label: 'In Progress', bg: '#FDD835' },
    { label: 'Completed',   bg: '#4CAF50' },
  ];
  const activeIdx = { pending: 0, instant_booked: 0, approved: 1, in_transit: 2, completed: 3 }[status] ?? 0;
  return (
    <div style={{ padding: '16px 24px 0' }}>
      <style>{`
        .lsb { display: flex; width: 100%; }
        .lsb-step {
          flex: 1; display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 13px; font-weight: 700; white-space: nowrap;
          text-overflow: ellipsis; padding: 6px 0;
          clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%);
          margin-left: -14px; user-select: none;
        }
        .lsb-step:first-child {
          clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%);
          margin-left: 0;
        }
        .lsb-step:last-child {
          clip-path: polygon(14px 0, 100% 0, 100% 100%, 14px 100%, 0 50%);
        }
      `}</style>
      <div className="lsb">
        {STEPS.map((step, i) => (
          <div key={step.label} className="lsb-step" style={{
            backgroundColor: step.bg,
            zIndex: STEPS.length - i,
            opacity: i > activeIdx ? 0.45 : 1,
            textShadow: step.bg === '#FDD835' ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
          }}>
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BrokerLoadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const fromLabel = state?.from || 'Back';

  const [load, setLoad]           = useState(null);
  const [bids, setBids]           = useState([]);
  const [bookingData, setBooking] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError]         = useState(null);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [templateName, setTemplateName]     = useState('');
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateSaved, setTemplateSaved]   = useState(false);

  useEffect(() => {
    Promise.all([
      loadsApi.get(id).then(adaptLoad),
      bidsApi.forLoad(id).catch(() => []),
      bookingsApi.forLoad(id).catch(() => null),
    ])
      .then(([l, b, bk]) => {
        setLoad(l);
        setBids(Array.isArray(b) ? b : []);
        setBooking(bk);
      })
      .catch(() => setError('Load not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAcceptBid = (bidId) => {
    setActionLoading(bidId);
    bidsApi.accept(bidId)
      .then(() => setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'accepted' } : b)))
      .catch(err => alert(err.message))
      .finally(() => setActionLoading(null));
  };

  const handleRejectBid = (bidId) => {
    setActionLoading(bidId + '_reject');
    bidsApi.reject(bidId)
      .then(() => setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'rejected' } : b)))
      .catch(err => alert(err.message))
      .finally(() => setActionLoading(null));
  };

  const handleSaveTemplate = () => {
    if (!load || !templateName.trim()) return;
    setTemplateSaving(true);
    const raw = load._raw || {};
    loadTemplatesApi.create({
      name: templateName.trim(),
      origin: load.origin,
      origin_state: raw.origin_state || null,
      destination: load.dest,
      dest_state: raw.dest_state || null,
      miles: load.miles || 0,
      deadhead_miles: load.deadhead || 0,
      pickup_address: load.pickupAddress || null,
      delivery_address: load.deliveryAddress || null,
      pickup_lat: load.pickupLat || null,
      pickup_lng: load.pickupLng || null,
      delivery_lat: load.deliveryLat || null,
      delivery_lng: load.deliveryLng || null,
      load_type: raw.load_type || null,
      load_size: raw.load_size || null,
      trailer_length_ft: raw.trailer_length_ft || null,
      weight_lbs: raw.weight_lbs || null,
      commodity: load.commodity || null,
      dimensions: load.dims || null,
      rate: load.rate || 0,
      notes: load.notes || null,
      instant_book: load.instantBook || false,
    })
      .then(() => { setTemplateSaved(true); setTemplateDialog(false); })
      .catch(err => alert(err.message))
      .finally(() => setTemplateSaving(false));
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <IonSpinner name="crescent" />
    </div>
  );

  if (error || !load) return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto 16px' }}>
        {error || 'Load not found'}
      </div>
      <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', border: '1px solid var(--ion-border-color)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>
        Go back
      </button>
    </div>
  );

  const booking = bookingData?.booking || null;
  const carrierLocation = bookingData?.location || null;
  const bookingStatus = booking?.status || null;
  const pendingBids = bids.filter(b => b.status === 'pending');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', backgroundColor: 'var(--ion-card-background)', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Full-bleed map */}
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        <LoadHeroMap load={load} carrierLocation={carrierLocation} />

        {/* Floating back button */}
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit', color: '#1a1a1a', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
          >
            <IonIcon name="arrow-back-outline" style={{ fontSize: 16 }} /> {fromLabel}
          </button>
        </div>
      </div>

      <LoadStatusBar status={bookingStatus} />

      {/* Two-column content */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', padding: 24 }}>

        {/* LEFT: Trip info */}
        <div style={{ ...cardStyle, flex: '0 0 550px', minWidth: 0, maxWidth: '100%' }}>
          <div style={{ padding: '20px 20px 16px' }}>
            <LoadStepper load={load} bookingStatus={bookingStatus} />

            <div style={{ borderTop: '1px solid var(--ion-border-color)', margin: '16px 0' }} />

            {/* Load headline */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 2 }}>
                  Load #{load.id.slice(0, 8).toUpperCase()}
                  {booking && <> · Carrier: <strong>{booking.carrier_name}</strong>{booking.carrier_mc ? ` (MC-${booking.carrier_mc})` : ''}</>}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ion-text-color)', display: 'block' }}>{load.origin} → {load.dest}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', display: 'block' }}>{load.type} · {load.miles} mi · Pickup {load.pickup}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {load.status === 'active' && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: 'rgba(46,125,50,0.12)', color: '#2e7d32' }}>Active</span>}
                {load.status === 'filled' && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: 'rgba(2,136,209,0.12)', color: '#0288d1' }}>Filled</span>}
                {load.status === 'expired' && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: 'rgba(211,47,47,0.12)', color: '#d32f2f' }}>Expired</span>}
                {bookingStatus === 'in_transit' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} /> In Transit
                  </span>
                )}
                {bookingStatus === 'completed' && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, border: '1px solid #2e7d32', color: '#2e7d32' }}>Delivered</span>}
                <button
                  onClick={() => { setTemplateDialog(true); setTemplateName(`${load.origin} → ${load.dest}`); setTemplateSaved(false); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', border: '1px solid var(--ion-border-color)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}
                >
                  <IonIcon name="layers-outline" style={{ fontSize: 12 }} /> {templateSaved ? 'Saved!' : 'Save as Template'}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, borderTop: '1px solid var(--ion-border-color)', borderBottom: '1px solid var(--ion-border-color)', padding: '12px 0' }}>
              {[
                { label: 'Rate',     value: `$${(load.rate || 0).toLocaleString()}` },
                { label: 'Per Mile', value: `$${(load.ratePerMile || 0).toFixed(2)}/mi` },
                { label: 'Views',    value: load.viewCount || 0 },
                { label: 'Bids',     value: bids.length, highlight: bids.length > 0 },
              ].map(({ label, value, highlight }, idx, arr) => (
                <div key={label} style={{ flex: 1, textAlign: 'center', borderRight: idx < arr.length - 1 ? '1px solid var(--ion-border-color)' : 'none' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>{label}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: highlight ? '#ed6c02' : 'var(--ion-text-color)', display: 'block', marginTop: 2 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Pickup / Delivery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Pickup',   addr: load.pickupAddress || load.origin,   city: load.pickupAddress ? load.origin : null,   date: load.pickup,   dot: '#22c55e' },
                { label: 'Delivery', addr: load.deliveryAddress || load.dest,   city: load.deliveryAddress ? load.dest : null,   date: load.delivery, dot: '#ef4444' },
              ].map(({ label, addr, city, date, dot }) => (
                <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ marginTop: 4, width: 10, height: 10, borderRadius: '50%', backgroundColor: dot, flexShrink: 0, display: 'inline-block' }} />
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>{label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block' }}>{addr}</span>
                    {city && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>{city}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <IonIcon name="calendar-outline" style={{ fontSize: 11, color: 'var(--ion-color-medium)' }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{date}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Carrier location link */}
            {carrierLocation && (
              <div style={{ marginTop: 16 }}>
                <div style={{ borderTop: '1px solid var(--ion-border-color)', marginBottom: 12 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Last location update · {booking?.carrier_name}</span>
                  </span>
                  {booking && (
                    <Link
                      to={`/broker/track/${booking.id}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ion-color-primary)', textDecoration: 'none', fontSize: '0.82rem' }}
                    >
                      <IonIcon name="navigate-outline" style={{ fontSize: 14 }} /> Full Tracking
                    </Link>
                  )}
                </div>
              </div>
            )}

            {load.notes && (
              <div style={{ marginTop: 16, padding: '12px', border: '1px solid var(--ion-border-color)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 4 }}>Notes</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{load.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Bids + Documents */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Bids */}
          <div style={cardStyle}>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <IonIcon name="people-outline" style={{ color: 'var(--ion-color-primary)' }} />
                <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Bids</span>
                {pendingBids.length > 0 && (
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: 'rgba(237,108,2,0.12)', color: '#ed6c02' }}>
                    {pendingBids.length} pending
                  </span>
                )}
              </div>
              {bids.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ion-color-medium)', fontSize: '0.875rem', margin: 0 }}>No bids yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bids.map(bid => (
                    <div key={bid.id} style={{ padding: 16, border: '1px solid var(--ion-border-color)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <Link
                              to={`/c/${bid.carrier_id?.slice(0, 8)}`}
                              state={{ carrierId: bid.carrier_id }}
                              style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-color-primary)', textDecoration: 'none' }}
                            >
                              {bid.carrier_name || 'Carrier'}
                            </Link>
                            {bid.carrier_mc && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>MC-{bid.carrier_mc}</span>}
                            {bidStatusChip(bid.status)}
                          </div>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ion-color-primary)', display: 'block' }}>${(bid.amount || 0).toLocaleString()}</span>
                          {bid.note && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontStyle: 'italic', display: 'block', marginTop: 4 }}>
                              "{bid.note}"
                            </span>
                          )}
                          {bid.counter_amount && (
                            <span style={{ fontSize: '0.72rem', color: '#0288d1', display: 'block', marginTop: 4 }}>
                              Counter offer: ${bid.counter_amount.toLocaleString()}{bid.counter_note && ` — ${bid.counter_note}`}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <Link to="/broker/messages" title="Message carrier" style={{ display: 'flex', alignItems: 'center', padding: 4, color: 'var(--ion-color-medium)', textDecoration: 'none' }}>
                            <IonIcon name="chatbubble-outline" style={{ fontSize: 16 }} />
                          </Link>
                          {bid.status === 'pending' && load.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleAcceptBid(bid.id)}
                                disabled={!!actionLoading}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid #2e7d32', borderRadius: 6, background: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontFamily: 'inherit', color: '#2e7d32', opacity: actionLoading ? 0.6 : 1 }}
                              >
                                {actionLoading === bid.id ? <IonSpinner name="crescent" style={{ width: 12, height: 12 }} /> : <IonIcon name="checkmark-circle" style={{ fontSize: 14 }} />}
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectBid(bid.id)}
                                disabled={!!actionLoading}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid #d32f2f', borderRadius: 6, background: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontFamily: 'inherit', color: '#d32f2f', opacity: actionLoading ? 0.6 : 1 }}
                              >
                                {actionLoading === bid.id + '_reject' ? <IonSpinner name="crescent" style={{ width: 12, height: 12 }} /> : <IonIcon name="close-circle-outline" style={{ fontSize: 14 }} />}
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div style={cardStyle}>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <IonIcon name="document-text-outline" style={{ color: 'var(--ion-color-primary)' }} />
                <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Documents & Load Messages</span>
              </div>
              <DocumentPanel loadId={id} />
            </div>
          </div>

        </div>
      </div>

      {/* Save as Template modal */}
      {templateDialog && (
        <IonModal isOpen onDidDismiss={() => setTemplateDialog(false)} style={{ '--width': '400px', '--height': 'auto', '--border-radius': '12px' }}>
          <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <IonIcon name="layers-outline" style={{ color: 'var(--ion-color-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Save as Template</span>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
              Give this lane a name so you can re-post it instantly next time.
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Template Name</label>
              <input
                autoFocus
                style={inputStyle}
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="e.g. Chicago → Atlanta weekly"
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setTemplateDialog(false)} style={{ flex: 1, padding: '8px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={templateSaving || !templateName.trim()}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: (templateSaving || !templateName.trim()) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: (templateSaving || !templateName.trim()) ? 0.7 : 1 }}
              >
                {templateSaving && <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} />}
                Save Template
              </button>
            </div>
          </div>
        </IonModal>
      )}
    </div>
  );
}
