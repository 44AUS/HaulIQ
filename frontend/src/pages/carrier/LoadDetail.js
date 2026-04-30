import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { GoogleMap, DirectionsRenderer, Marker, useJsApiLoader } from '@react-google-maps/api';
import { loadsApi, messagesApi, bidsApi, bookingsApi, instantBookApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';
import ProfitBadge from '../../components/shared/ProfitBadge';
import BrokerRating from '../../components/shared/BrokerRating';
import DocumentPanel from '../../components/documents/DocumentPanel';
import RateConSignature from '../../components/shared/RateConSignature';
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

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', fontFamily: 'inherit' };

function LoadHeroMap({ load }) {
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
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          }, 100);
        }
      }
    );
  }, [isLoaded, load]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!isLoaded) return (
    <div style={{ height: 420, backgroundColor: '#e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <IonSpinner name="crescent" style={{ '--color': '#22c55e' }} />
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      <GoogleMap mapContainerStyle={{ height: 420, width: '100%' }} options={MAP_OPTIONS} zoom={6} onLoad={onMapLoad}>
        {directions && (
          <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#22c55e', strokeWeight: 4, strokeOpacity: 0.9 } }} />
        )}
        {directions && <Marker position={directions.routes[0].legs[0].start_location} icon={aIcon} title={load.origin} />}
        {directions && <Marker position={directions.routes[0].legs[0].end_location} icon={bIcon} title={load.dest} />}
      </GoogleMap>
      <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
        <div style={{ padding: '6px 12px', backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb' }}>{load.origin}</span>
          </div>
        </div>
        <div style={{ flex: 1, margin: '0 8px', height: 1, backgroundColor: 'rgba(34,197,94,0.3)', borderTop: '1px dashed rgba(34,197,94,0.3)' }} />
        <div style={{ padding: '6px 12px', backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb' }}>{load.dest}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginBottom: 8 }}>
        <div style={{ position: 'absolute', top: '50%', left: CIRCLE / 2, right: CIRCLE / 2, height: 3, backgroundColor: 'var(--ion-color-light)', borderRadius: 2, transform: 'translateY(-50%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: CIRCLE / 2, right: CIRCLE / 2, height: 3, borderRadius: 2, transform: 'translateY(-50%)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--ion-color-primary)', borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
        {STEPS.map((step, i) => {
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
        {STEPS.map((step, i) => {
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

const BID_STATUS = {
  accepted: { label: 'Bid Accepted!',     bg: 'rgba(46,125,50,0.12)',  color: '#2e7d32',  border: '#2e7d32' },
  countered:{ label: 'Broker Countered',  bg: 'rgba(2,136,209,0.12)',  color: '#0288d1',  border: '#0288d1' },
  rejected: { label: 'Bid Rejected',      bg: 'rgba(211,47,47,0.12)',  color: '#d32f2f',  border: '#d32f2f' },
  pending:  { label: 'Bid Pending',        bg: 'rgba(237,108,2,0.12)',  color: '#ed6c02',  border: '#ed6c02' },
};

function LoadStatusBar({ status }) {
  const STEPS = [
    { label: 'Quote',       bg: '#9E9E9E' },
    { label: 'Scheduled',   bg: '#1976D2' },
    { label: 'In Progress', bg: '#FDD835' },
    { label: 'Completed',   bg: '#4CAF50' },
  ];
  const activeIdx = { pending: 0, instant_booked: 0, approved: 1, in_transit: 2, completed: 3 }[status] ?? 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <style>{`
        .lsb { display: flex; width: 100%; gap: 4px; }
        .lsb-step {
          flex: 1; display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 13px; font-weight: 700; white-space: nowrap;
          text-overflow: ellipsis; padding: 6px 0;
          clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%);
          user-select: none;
        }
        .lsb-step:first-child {
          clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%);
        }
        .lsb-step:last-child {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%);
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

export default function LoadDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [load, setLoad]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saved, setSaved]             = useState(false);
  const [canInstantBook, setCanInstantBook] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null);
  const [myBid, setMyBid]             = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadsApi.get(id).then(adaptLoad),
      bookingsApi.forLoad(id).catch(() => null),
      bidsApi.my().catch(() => []),
    ])
      .then(([adapted, bk, allBids]) => {
        setLoad(adapted);
        setSaved(adapted?.saved || false);
        setBookingData(bk);
        if (bk?.booking?.status) setBookingStatus(bk.booking.status);
        setMyBid(allBids.find(b => String(b.load_id) === String(adapted._raw.id)) || null);
        instantBookApi.check(adapted._raw.id)
          .then(res => setCanInstantBook(res.eligible === true))
          .catch(() => setCanInstantBook(false));
      })
      .catch(() => setLoad(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <IonSpinner name="crescent" />
    </div>
  );

  if (!load) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ margin: '0 0 16px', color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>Load not found.</p>
      <Link to="/carrier/loads" style={{ color: 'var(--ion-color-primary)', fontSize: '0.875rem', textDecoration: 'none' }}>Back to Load Board</Link>
    </div>
  );

  const booking = bookingData?.booking || null;
  const fuelCostEst  = load.fuel;
  const deadheadCost = Math.round(load.deadhead * 0.62);
  const grossRevenue = load.rate;
  const expenses     = fuelCostEst + deadheadCost + 120;
  const netProfit    = grossRevenue - expenses;

  const handleInstantBook = () => {
    bookingsApi.request({ load_id: load._raw.id, is_instant: true })
      .then(() => setBookingStatus('instant_booked'))
      .catch(err => alert(err.message));
  };

  const handleBookNow = () => {
    bookingsApi.request({ load_id: load._raw.id, is_instant: false })
      .then(() => setBookingStatus('pending'))
      .catch(err => alert(err.message));
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const brokerUserId = load._raw?.broker_user_id;
    if (!brokerUserId) return;
    messagesApi.send(load._raw.id, brokerUserId, messageText.trim()).catch(() => {});
    setMessageText('');
    setMessageOpen(false);
  };

  const activeBookingStatus = booking?.status || bookingStatus;
  const bidCfg = myBid ? (BID_STATUS[myBid.status] || BID_STATUS.pending) : null;

  // ── Tab: Overview ────────────────────────────────────────────────────────────
  const OverviewTab = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        <LoadHeroMap load={load} />
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <button
            onClick={() => { loadsApi.toggleSave(load._raw.id).catch(() => {}); setSaved(s => !s); }}
            style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: saved ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)' }}
          >
            <IonIcon name={saved ? 'bookmark' : 'bookmark-outline'} style={{ fontSize: 18 }} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', padding: 24 }}>
        {/* LEFT */}
        <div style={{ ...cardStyle, flex: '0 0 550px', minWidth: 0, padding: 20 }}>
          <LoadStepper load={load} bookingStatus={activeBookingStatus} />
          <div style={{ borderTop: '1px solid var(--ion-border-color)', margin: '16px 0' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Load #{load.id.slice(0, 8).toUpperCase()}</span>
                {load.hot && <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'rgba(211,47,47,0.12)', color: '#d32f2f' }}>Hot Load</span>}
                {load.instantBook && <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: '1px solid #2e7d32', color: '#2e7d32' }}>⚡ Instant Book</span>}
                <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: '1px solid var(--ion-color-primary)', color: 'var(--ion-color-primary)' }}>{load.type}</span>
              </div>
              <h3 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ion-text-color)' }}>{load.origin} → {load.dest}</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{load.commodity} · {load.miles} mi · Pickup {load.pickup}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {load.status === 'active'                 && <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'rgba(46,125,50,0.12)', color: '#2e7d32' }}>Active</span>}
              {load.status === 'filled'                 && <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'rgba(2,136,209,0.12)', color: '#0288d1' }}>Filled</span>}
              {activeBookingStatus === 'in_transit'     && <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>In Transit</span>}
              {activeBookingStatus === 'completed'      && <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: '1px solid #2e7d32', color: '#2e7d32' }}>Delivered</span>}
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Rate',     value: `$${(load.rate || 0).toLocaleString()}` },
              { label: 'Per Mile', value: `$${(load.ratePerMile || 0).toFixed(2)}` },
              { label: 'Miles',    value: `${load.miles} mi` },
              { label: 'Weight',   value: load.weight },
            ].map(({ label, value }) => (
              <div key={label} style={{ border: '1px solid var(--ion-border-color)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>{label}</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ion-text-color)', display: 'block', marginTop: 2 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Pickup / Delivery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: load.notes ? 16 : 0 }}>
            {[
              { label: 'Pickup',   addr: load.pickupAddress || load.origin, city: load.pickupAddress ? load.origin : null, date: load.pickup, dot: '#22c55e' },
              { label: 'Delivery', addr: load.deliveryAddress || load.dest, city: load.deliveryAddress ? load.dest : null, date: load.delivery, dot: '#ef4444' },
            ].map(({ label, addr, city, date, dot }) => (
              <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ marginTop: 4, width: 10, height: 10, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>{label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block', lineHeight: 1.3 }}>{addr}</span>
                  {city && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>{city}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <IonIcon name="calendar-outline" style={{ fontSize: 11, color: 'var(--ion-color-medium)' }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{date}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {load.notes && (
            <div style={{ border: '1px solid var(--ion-border-color)', borderRadius: 8, padding: 12, marginTop: 16 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 2 }}>Notes</span>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{load.notes}</p>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {load.broker && (
            <div style={{ ...cardStyle, padding: 20 }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', display: 'block', marginBottom: 12 }}>Broker</span>
              <BrokerRating broker={load.broker} />
            </div>
          )}

          <div style={{ ...cardStyle, padding: 20 }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', display: 'block', marginBottom: 16 }}>Book This Load</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookingStatus === 'instant_booked' && (
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.3)', borderRadius: 6 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.875rem', color: '#2e7d32' }}>Booked!</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#2e7d32' }}>This load is now assigned to you.</p>
                </div>
              )}
              {activeBookingStatus === 'pending' && (
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(237,108,2,0.08)', border: '1px solid rgba(237,108,2,0.3)', borderRadius: 6 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.875rem', color: '#ed6c02' }}>Request Sent</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#ed6c02' }}>Awaiting broker approval.</p>
                </div>
              )}
              {activeBookingStatus === 'approved' && (
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(2,136,209,0.08)', border: '1px solid rgba(2,136,209,0.3)', borderRadius: 6 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.875rem', color: '#0288d1' }}>Booking Approved</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#0288d1' }}>Your booking has been approved by the broker.</p>
                </div>
              )}
              {activeBookingStatus === 'in_transit' && (
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(237,108,2,0.08)', border: '1px solid rgba(237,108,2,0.3)', borderRadius: 6 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.875rem', color: '#ed6c02' }}>In Transit</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#ed6c02' }}>You are currently hauling this load.</p>
                </div>
              )}
              {activeBookingStatus === 'completed' && (
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.3)', borderRadius: 6 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.875rem', color: '#2e7d32' }}>Delivered</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#2e7d32' }}>This load has been delivered successfully.</p>
                </div>
              )}

              {!bookingStatus && !activeBookingStatus && (
                <>
                  {canInstantBook && (
                    <button onClick={handleInstantBook} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '1rem' }}>
                      <IonIcon name="flash-outline" style={{ fontSize: 18 }} /> Instant Book
                    </button>
                  )}
                  {load.instantBook && !canInstantBook && (
                    <button disabled style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-color-medium)', fontFamily: 'inherit', fontSize: '1rem', cursor: 'not-allowed', opacity: 0.6 }}>
                      <IonIcon name="flash-outline" style={{ fontSize: 18 }} /> Instant Book · Not on allowlist
                    </button>
                  )}
                  {load.bookNow && !canInstantBook && (
                    <button onClick={handleBookNow} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '1rem' }}>
                      <IonIcon name="calendar-outline" style={{ fontSize: 18 }} /> Book Now
                    </button>
                  )}
                  {myBid ? (
                    <div style={{ border: `1px solid ${bidCfg.border}`, borderRadius: 8, padding: '12px 14px', backgroundColor: bidCfg.bg }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: bidCfg.color }}>{bidCfg.label}</span>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>${myBid.amount.toLocaleString()}</span>
                      </div>
                      {myBid.status === 'countered' && myBid.counter_amount && (
                        <span style={{ fontSize: '0.75rem', color: '#0288d1' }}>Counter offer: <strong>${myBid.counter_amount.toLocaleString()}</strong>{myBid.counter_note && ` — "${myBid.counter_note}"`}</span>
                      )}
                    </div>
                  ) : (
                    <Link to={`/carrier/loads/${id}/bid`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', border: '1px solid var(--ion-color-primary)', borderRadius: 6, color: 'var(--ion-color-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}>
                      <IonIcon name="cash-outline" style={{ fontSize: 18 }} /> Place Bid / Counter Offer
                    </Link>
                  )}
                </>
              )}

              {!messageOpen ? (
                <button onClick={() => setMessageOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-text-color)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500 }}>
                  <IonIcon name="chatbubble-outline" style={{ fontSize: 16 }} /> Message Broker
                </button>
              ) : (
                <div style={{ border: '1px solid var(--ion-border-color)', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Message {load.broker?.name}</span>
                    <button onClick={() => setMessageOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex', borderRadius: 4 }}>
                      <IonIcon name="close-outline" style={{ fontSize: 18 }} />
                    </button>
                  </div>
                  <textarea
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 80, marginBottom: 12 }}
                    rows={3}
                    placeholder="Ask about the load, negotiate rate, etc..."
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                  />
                  <button onClick={handleSendMessage} disabled={!messageText.trim()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: messageText.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem', opacity: messageText.trim() ? 1 : 0.6 }}>
                    <IonIcon name="send-outline" style={{ fontSize: 16 }} /> Send Message
                  </button>
                </div>
              )}

              {load.broker?.warns > 0 && (
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.875rem', color: '#d32f2f' }}>Broker Warning</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#d32f2f' }}>This broker has {load.broker.warns} active warning flag{load.broker.warns > 1 ? 's' : ''}. Proceed with caution.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Tab: Payments ────────────────────────────────────────────────────────────
  const PaymentsTab = (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', padding: 24 }}>
      <div style={{ ...cardStyle, flex: 1, padding: 20 }}>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)', display: 'block', marginBottom: 16 }}>Profit Breakdown</span>
        {[
          { label: 'Gross Rate',                                                                  value: `+$${grossRevenue.toLocaleString()}`, color: '#2e7d32' },
          { label: `Fuel (~${load.miles} mi @ $${load.dieselPrice ? load.dieselPrice.toFixed(2) : '—'}/gal)`, value: `-$${fuelCostEst}`,     color: '#d32f2f' },
          { label: `Deadhead (${load.deadhead} mi)`,                                             value: `-$${deadheadCost}`,                  color: '#d32f2f' },
          { label: 'Misc / tolls',                                                               value: '-$120',                               color: '#d32f2f' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{label}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color }}>{value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Estimated Net Profit</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: netProfit > 0 ? '#2e7d32' : '#d32f2f' }}>
            {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}
          </span>
        </div>
        <div style={{ marginTop: 16 }}>
          <ProfitBadge score={load.profitScore} net={netProfit} ratePerMile={load.ratePerMile} size="lg" />
        </div>
      </div>
    </div>
  );

  // ── Tab: Documents ───────────────────────────────────────────────────────────
  const DocumentsTab = (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', padding: 24 }}>
      <div style={{ ...cardStyle, flex: 1, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <IonIcon name="document-text-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 16 }} />
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)' }}>Documents</span>
        </div>
        <DocumentPanel loadId={id} />
      </div>
      {booking && (
        <div style={{ ...cardStyle, flex: '0 0 360px', padding: 20 }}>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)', display: 'block', marginBottom: 4 }}>Rate Confirmation</span>
          <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Sign or download the rate confirmation for this load.</p>
          <RateConSignature bookingId={booking.id} role="carrier" />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {activeTab === 'overview' && <LoadStatusBar status={activeBookingStatus} />}
      <div style={{ backgroundColor: 'var(--ion-card-background)', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        {activeTab === 'overview'  && OverviewTab}
        {activeTab === 'payments'  && PaymentsTab}
        {activeTab === 'documents' && DocumentsTab}
      </div>
    </div>
  );
}
