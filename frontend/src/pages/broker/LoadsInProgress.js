import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { bookingsApi } from '../../services/api';
import DispatcherTable from '../../components/broker/DispatcherTable';
import DispatchModal from '../../components/broker/DispatchModal';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import IonIcon from '../../components/IonIcon';

const LIBRARIES = ['places'];

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  scrollwheel: true,
};

const MARKER_COLOR = {
  in_transit: '#22c55e',
  booked:     '#3b82f6',
  available:  '#f97316',
};

const STATUS_CONFIG = {
  booked:     { label: 'Booked',         bg: '#0288d1', color: '#fff' },
  in_transit: { label: 'In Transit',     bg: '#2e7d32', color: '#fff' },
  delivered:  { label: 'Delivered',      bg: 'var(--ion-color-medium)', color: '#fff' },
  available:  { label: 'No Carrier Yet', bg: 'var(--ion-color-medium)', color: '#fff' },
};

const TIMELINE_STEPS = ['Quoted', 'Booked', 'In Transit', 'Delivered'];
const STATUS_STEP = { quoted: 0, booked: 1, in_transit: 2, delivered: 3, available: -1 };

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-color-light)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4 }} />;
}

// ─── Status Timeline
function StatusTimeline({ status }) {
  const current = STATUS_STEP[status] ?? -1;
  if (current < 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: 16 }}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done   = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: done || active ? '#2e7d32' : 'var(--ion-color-light)',
                border: active ? '2px solid #4caf50' : 'none',
                outline: active ? '2px solid rgba(46,125,50,0.25)' : 'none',
              }}>
                {done && <IonIcon name="checkmark-circle" style={{ fontSize: 14, color: 'white' }} />}
                {active && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'white' }} />}
              </div>
              <span style={{
                marginTop: 4, whiteSpace: 'nowrap', fontSize: '0.65rem',
                color: active ? '#2e7d32' : done ? '#66bb6a' : 'var(--ion-color-medium)',
                fontWeight: active ? 700 : 400,
              }}>
                {step}
              </span>
            </div>
            {idx < TIMELINE_STEPS.length - 1 && (
              <div style={{
                flex: 1, marginLeft: 4, marginRight: 4, marginBottom: 16, height: 0,
                borderTop: done ? '2px solid #2e7d32' : '2px dashed var(--ion-border-color)',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Card View
function BrokerLoadCard({ load }) {
  const cfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.available;
  const loadId = load.load_id || load.id;

  return (
    <Link to={`/broker/loads/${loadId}`} state={{ from: 'Loads in Progress' }} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div style={{ ...cardStyle, padding: 16, height: '100%', boxSizing: 'border-box', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>Load #{load.id.slice(0, 8).toUpperCase()}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{load.load_type}</span>
          </div>
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <IonIcon name="location-outline" style={{ fontSize: 11 }} /> Origin
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{load.origin}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IonIcon name="arrow-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--ion-color-medium)' }}>{load.miles}mi</span>
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <IonIcon name="location-outline" style={{ fontSize: 11 }} /> Dest
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{load.destination}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
            <IonIcon name="calendar-outline" style={{ fontSize: 12 }} /> Pickup: <span style={{ fontWeight: 500 }}>{load.pickup_date}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
            <IonIcon name="calendar-outline" style={{ fontSize: 12 }} /> Drop: <span style={{ fontWeight: 500 }}>{load.delivery_date}</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Rate',     value: `$${(load.rate || 0).toLocaleString()}` },
            { label: 'Miles',    value: load.miles },
            { label: 'Per Mile', value: `$${(load.rate_per_mile || 0).toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: 8, border: '1px solid var(--ion-border-color)', borderRadius: 6, textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--ion-color-medium)', display: 'block' }}>{label}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '8px 12px', border: '1px solid var(--ion-border-color)', borderRadius: 6, marginBottom: 12 }}>
          {load.carrier_id ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon name="person-outline" style={{ fontSize: 15, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-color-primary)' }}>{load.carrier_name}</span>
                {load.carrier_mc && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', marginLeft: 8 }}>MC-{load.carrier_mc}</span>}
              </div>
              <Link
                to={`/broker/messages?userId=${load.carrier_id}`}
                onClick={e => e.stopPropagation()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--ion-color-primary)', textDecoration: 'none', flexShrink: 0 }}
              >
                <IonIcon name="chatbubble-outline" style={{ fontSize: 13 }} /> Message
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon name="alert-circle-outline" style={{ fontSize: 15, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', fontStyle: 'italic' }}>Awaiting carrier assignment</span>
            </div>
          )}
        </div>

        {load.commodity && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
              <IonIcon name="cube-outline" style={{ fontSize: 12 }} /> {load.commodity}
            </span>
            {load.weight_lbs && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
                <IonIcon name="scale-outline" style={{ fontSize: 12 }} /> {Number(load.weight_lbs).toLocaleString()} lbs
              </span>
            )}
          </div>
        )}

        {load.status === 'available' && (
          <div style={{ padding: '8px 12px', border: '1px solid var(--ion-border-color)', borderRadius: 6, marginTop: 8 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>No carrier assigned — load is still open on the board.</span>
          </div>
        )}

        <StatusTimeline status={load.status} />

        {(load.status === 'in_transit' || load.status === 'booked') && load.booking_id && (
          <Link
            to={`/broker/track/${load.booking_id}`}
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, padding: '8px 0', width: '100%', borderRadius: 6, textDecoration: 'none', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, backgroundColor: load.status === 'in_transit' ? '#2e7d32' : 'transparent', color: load.status === 'in_transit' ? '#fff' : 'var(--ion-text-color)', border: load.status === 'in_transit' ? 'none' : '1px solid var(--ion-border-color)' }}
          >
            <IonIcon name="navigate-outline" style={{ fontSize: 16 }} />
            {load.status === 'in_transit' ? 'Track Live Location' : 'View Tracking'}
          </Link>
        )}
      </div>
    </Link>
  );
}

// ─── Table View
function TableView({ loads }) {
  return (
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>{['Load #', 'Route', 'Status', 'Carrier', 'Rate', 'Pickup', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loads.length === 0 ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '40px 0', color: 'var(--ion-color-medium)' }}>No loads found</td></tr>
            ) : loads.map((load, idx) => {
              const cfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.available;
              const loadId = load.load_id || load.id;
              return (
                <tr key={load.id} style={{ backgroundColor: idx % 2 === 1 ? 'var(--ion-color-light)' : 'transparent' }}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ion-color-medium)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                    {String(load.id).slice(0, 8).toUpperCase()}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    <Link to={`/broker/loads/${loadId}`} state={{ from: 'Loads in Progress' }} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-color-primary)', textDecoration: 'none' }}>
                      {load.origin} → {load.destination}
                    </Link>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    {load.carrier_name ? (
                      <Link to={`/c/${load.carrier_id?.slice(0, 8)}`} state={{ carrierId: load.carrier_id }} style={{ fontSize: '0.875rem', color: 'var(--ion-color-primary)', textDecoration: 'none' }}>{load.carrier_name}</Link>
                    ) : (
                      <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>${(load.rate || 0).toLocaleString()}</td>
                  <td style={{ ...tdStyle, color: 'var(--ion-color-medium)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{load.pickup_date}</td>
                  <td style={tdStyle}>
                    {(load.status === 'in_transit' || load.status === 'booked') && load.booking_id && (
                      <Link
                        to={`/broker/track/${load.booking_id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: `1px solid ${load.status === 'in_transit' ? '#2e7d32' : 'var(--ion-border-color)'}`, borderRadius: 6, color: load.status === 'in_transit' ? '#2e7d32' : 'var(--ion-text-color)', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        <IonIcon name="navigate-outline" style={{ fontSize: 13 }} /> Track
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Map View
function makeMarkerSvg(color) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="14" cy="14" r="5" fill="white"/>
    </svg>`
  )}`;
}

function LoadsMap({ loads, stats }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const mapRef = useRef(null);
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [geocodedCoords, setGeocodedCoords] = useState({});

  const activLoads = loads.filter(l => l.status !== 'delivered');

  useEffect(() => {
    if (!isLoaded) return;
    const geocoder = new window.google.maps.Geocoder();
    activLoads.forEach(load => {
      if (load.pickup_lat && load.pickup_lng) return;
      if (!load.origin) return;
      geocoder.geocode({ address: load.origin + ', USA' }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          setGeocodedCoords(prev => ({ ...prev, [load.id]: { lat: loc.lat(), lng: loc.lng() } }));
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, loads]);

  const getCoords = (load) => {
    if (load.pickup_lat && load.pickup_lng) return { lat: Number(load.pickup_lat), lng: Number(load.pickup_lng) };
    return geocodedCoords[load.id] || null;
  };

  const mappable = activLoads.filter(l => getCoords(l) !== null);

  const fitBounds = useCallback((map) => {
    if (mappable.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    mappable.forEach(l => bounds.extend(getCoords(l)));
    map.fitBounds(bounds, 60);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappable]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    fitBounds(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapRef.current && mappable.length > 0) fitBounds(mapRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocodedCoords]);

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 600 }}>
        <IonSpinner name="crescent" />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: 'calc(100vh - 200px)', minHeight: 500 }}
        zoom={5}
        center={{ lat: 39.5, lng: -98.35 }}
        options={MAP_OPTIONS}
        onLoad={onMapLoad}
      >
        {mappable.map(load => {
          const pos = getCoords(load);
          const color = MARKER_COLOR[load.status] || MARKER_COLOR.available;
          const icon = {
            url: makeMarkerSvg(color),
            scaledSize: new window.google.maps.Size(28, 36),
            anchor: new window.google.maps.Point(14, 36),
          };
          return <Marker key={load.id} position={pos} icon={icon} onClick={() => setSelectedLoad(load)} />;
        })}

        {selectedLoad && (() => {
          const pos = getCoords(selectedLoad);
          if (!pos) return null;
          return (
            <InfoWindow position={pos} onCloseClick={() => setSelectedLoad(null)} options={{ pixelOffset: new window.google.maps.Size(0, -36) }}>
              <div style={{ minWidth: 200, maxWidth: 260, padding: 4 }}>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: 2 }}>
                  Load #{selectedLoad.id.slice(0, 8).toUpperCase()}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', display: 'block', marginBottom: 4 }}>
                  {selectedLoad.origin} → {selectedLoad.destination}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>
                  {selectedLoad.load_type} · ${(selectedLoad.rate || 0).toLocaleString()}
                </span>
                {selectedLoad.carrier_name && (
                  <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>Carrier: {selectedLoad.carrier_name}</span>
                )}
                <Link
                  to={`/broker/loads/${selectedLoad.load_id || selectedLoad.id}`}
                  state={{ from: 'Loads in Progress' }}
                  style={{ display: 'block', marginTop: 8, padding: '4px 0', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.7rem', color: '#374151', textDecoration: 'none', fontWeight: 600 }}
                >
                  View Load
                </Link>
              </div>
            </InfoWindow>
          );
        })()}
      </GoogleMap>

      {/* Stats overlay */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stats.map(({ label, value, dot }) => (
          <div key={label} style={{ ...cardStyle, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 120, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--ion-color-medium)', display: 'block', lineHeight: 1 }}>{label}</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ion-text-color)', lineHeight: 1.2 }}>{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend overlay */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 10 }}>
        <div style={{ ...cardStyle, padding: '8px 12px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          {[
            { color: MARKER_COLOR.in_transit, label: 'In Transit' },
            { color: MARKER_COLOR.booked,     label: 'Booked' },
            { color: MARKER_COLOR.available,  label: 'No Carrier' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-text-color)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page
export default function BrokerLoadsInProgress() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
  const [view, setView] = useState(isMobile ? 'cards' : 'table');
  const [dispatcherRows, setDispatcherRows] = useState([]);
  const [dispatcherLoading, setDispatcherLoading] = useState(false);
  const [dispatchTarget, setDispatchTarget] = useState(null);

  useEffect(() => {
    bookingsApi.brokerActive()
      .then(data => setLoads(Array.isArray(data) ? data : []))
      .catch(() => setLoads([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (view !== 'dispatcher') return;
    setDispatcherLoading(true);
    bookingsApi.dispatcher()
      .then(data => setDispatcherRows(Array.isArray(data) ? data : []))
      .catch(() => setDispatcherRows([]))
      .finally(() => setDispatcherLoading(false));
  }, [view]);

  const handleDispatched = async () => {
    const data = await bookingsApi.dispatcher().catch(() => []);
    setDispatcherRows(Array.isArray(data) ? data : []);
  };

  const handleMarkPOD = async (row) => {
    try {
      await bookingsApi.tmsStatus(row.booking_id, 'pod_received');
      handleDispatched();
    } catch (e) {
      alert(e.message);
    }
  };

  const inTransitCount = loads.filter(l => l.status === 'in_transit').length;
  const bookedCount    = loads.filter(l => l.status === 'booked').length;
  const availableCount = loads.filter(l => l.status === 'available').length;

  const mapStats = [
    { label: 'In Transit', value: inTransitCount, dot: MARKER_COLOR.in_transit },
    { label: 'Booked',     value: bookedCount,    dot: MARKER_COLOR.booked },
    { label: 'No Carrier', value: availableCount, dot: MARKER_COLOR.available },
  ];

  const viewBtnStyle = (active) => ({
    padding: '6px 10px', border: 'none', background: active ? 'var(--ion-color-primary)' : 'transparent',
    color: active ? '#fff' : 'var(--ion-text-color)', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IonIcon name="analytics-outline" style={{ color: 'var(--ion-color-primary)' }} />
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>Loads in Progress</h2>
          <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--ion-color-primary)', color: '#fff' }}>{loads.length}</span>
        </div>

        <div style={{ display: 'flex', border: '1px solid var(--ion-border-color)', borderRadius: 6, overflow: 'hidden' }}>
          {[
            { key: 'cards',      icon: 'grid-outline',      title: 'Card view' },
            { key: 'table',      icon: 'list-outline',      title: 'List view' },
            { key: 'map',        icon: 'map-outline',       title: 'Map view' },
            { key: 'dispatcher', icon: 'clipboard-outline', title: 'Dispatcher board' },
          ].map(({ key, icon, title }, idx) => (
            <button
              key={key}
              title={title}
              onClick={() => setView(key)}
              style={{ ...viewBtnStyle(view === key), borderLeft: idx > 0 ? '1px solid var(--ion-border-color)' : 'none', borderRadius: 0 }}
            >
              <IonIcon name={icon} style={{ fontSize: 18 }} />
            </button>
          ))}
        </div>
      </div>

      {/* Stats — hidden on map view */}
      {view !== 'map' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'In Transit', value: inTransitCount, color: '#2e7d32' },
            { label: 'Booked',     value: bookedCount,    color: '#0288d1' },
            { label: 'Not Filled', value: availableCount, color: 'var(--ion-color-medium)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>{label}</span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color, display: 'block' }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ ...cardStyle, padding: 16 }}>
              <SkeletonBox width="60%" height={20} />
              <div style={{ height: 8 }} />
              <SkeletonBox width="80%" height={16} />
              <div style={{ height: 6 }} />
              <SkeletonBox width="50%" height={16} />
            </div>
          ))}
        </div>
      ) : loads.length === 0 ? (
        <div style={{ ...cardStyle, padding: '64px 0', textAlign: 'center' }}>
          <IonIcon name="analytics-outline" style={{ fontSize: 48, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)' }}>No active loads</p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Post a load to see it tracked here.</p>
        </div>
      ) : view === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {loads.filter(l => l.status !== 'delivered').map(load => <BrokerLoadCard key={load.id} load={load} />)}
        </div>
      ) : view === 'table' ? (
        <TableView loads={loads.filter(l => l.status !== 'delivered')} />
      ) : view === 'map' ? (
        <LoadsMap loads={loads} stats={mapStats} />
      ) : (
        <DispatcherTable
          rows={dispatcherRows}
          loading={dispatcherLoading}
          onDispatch={row => setDispatchTarget(row)}
          onMarkPOD={handleMarkPOD}
        />
      )}

      <DispatchModal
        open={Boolean(dispatchTarget)}
        onClose={() => setDispatchTarget(null)}
        booking={dispatchTarget}
        onDispatched={handleDispatched}
      />
    </div>
  );
}
