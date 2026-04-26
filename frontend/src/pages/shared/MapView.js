import { useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import IonIcon from '../../components/IonIcon';

const LIBRARIES = ['places'];
const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  scrollwheel: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1a1f2e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1f2e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#374151' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ],
};

const CARRIER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#22c55e" stroke="#fff" stroke-width="3"/><circle cx="12" cy="12" r="12" fill="none" stroke="rgba(34,197,94,0.25)" stroke-width="2"/></svg>`;

export default function MapView() {
  const { lat, lng, city, name } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  const decodedCity = city ? decodeURIComponent(city) : null;
  const decodedName = name ? decodeURIComponent(name) : 'Carrier';

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <span style={{ color: 'var(--ion-color-medium)' }}>Invalid location coordinates.</span>
      </div>
    );
  }

  const center = { lat: parsedLat, lng: parsedLng };
  const carrierIcon = isLoaded ? {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(CARRIER_ICON_SVG)}`,
    scaledSize: new window.google.maps.Size(24, 24),
    anchor: new window.google.maps.Point(12, 12),
  } : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-primary)', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit', alignSelf: 'flex-start', padding: '4px 0' }}>
        <IonIcon name="arrow-back-outline" style={{ fontSize: 18 }} /> Back
      </button>

      <div style={{ padding: '12px 16px', border: '1px solid var(--ion-border-color)', borderRadius: 8, backgroundColor: 'var(--ion-card-background)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(46,125,50,0.12)', border: '1px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IonIcon name="location-outline" style={{ fontSize: 18, color: '#22c55e' }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{decodedName}</div>
          {decodedCity && <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>Currently near {decodedCity}</div>}
        </div>
      </div>

      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ion-border-color)', height: 'calc(100vh - 220px)', minHeight: 400 }}>
        {isLoaded ? (
          <GoogleMap mapContainerStyle={{ height: '100%', width: '100%' }} center={center} zoom={14} options={MAP_OPTIONS} onLoad={onMapLoad}>
            <Marker position={center} icon={carrierIcon} title={decodedName} />
          </GoogleMap>
        ) : (
          <div style={{ height: '100%', backgroundColor: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>Loading map…</span>
          </div>
        )}
      </div>
    </div>
  );
}
