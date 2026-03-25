import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES = ['places'];
const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  scrollwheel: false,
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

const CARRIER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
  <circle cx="11" cy="11" r="8" fill="#22c55e" stroke="#fff" stroke-width="3"/>
  <circle cx="11" cy="11" r="11" fill="none" stroke="rgba(34,197,94,0.3)" stroke-width="2"/>
</svg>`;

const ORIGIN_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
  <circle cx="7" cy="7" r="5" fill="#22c55e" stroke="#fff" stroke-width="2"/>
</svg>`;

const DEST_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
  <circle cx="7" cy="7" r="5" fill="#ef4444" stroke="#fff" stroke-width="2"/>
</svg>`;

function svgIcon(svg, size) {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: size,
    anchor: new window.google.maps.Point(size.width / 2, size.height / 2),
  };
}

export default function LiveTrackingMap({ carrierLat, carrierLng, originCoords, destCoords, updatedAt }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const mapRef = useRef(null);
  const [directions, setDirections] = useState(null);

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

  // Fit map to show all points
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    const bounds = new window.google.maps.LatLngBounds();
    if (carrierLat != null && carrierLng != null) bounds.extend({ lat: carrierLat, lng: carrierLng });
    if (originCoords) bounds.extend({ lat: originCoords.lat, lng: originCoords.lng });
    if (destCoords) bounds.extend({ lat: destCoords.lat, lng: destCoords.lng });
    if (!bounds.isEmpty()) map.fitBounds(bounds, 40);
  }, [isLoaded, carrierLat, carrierLng, originCoords, destCoords]);

  // Fetch driving route between origin and dest
  useEffect(() => {
    if (!isLoaded || !originCoords || !destCoords) return;
    const svc = new window.google.maps.DirectionsService();
    svc.route(
      {
        origin: new window.google.maps.LatLng(originCoords.lat, originCoords.lng),
        destination: new window.google.maps.LatLng(destCoords.lat, destCoords.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') setDirections(result);
      }
    );
  }, [isLoaded, originCoords, destCoords]);

  if (!isLoaded) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-dark-400/40" style={{ height: 280, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, border: '2px solid rgba(34,197,94,0.3)', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-dark-400/40" style={{ height: 280 }}>
      <GoogleMap
        mapContainerStyle={{ height: '100%', width: '100%' }}
        options={MAP_OPTIONS}
        zoom={5}
        onLoad={onMapLoad}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: { strokeColor: '#4ade80', strokeWeight: 2, strokeOpacity: 0.5, strokeDasharray: '6 6' },
            }}
          />
        )}
        {originCoords && (
          <Marker
            position={{ lat: originCoords.lat, lng: originCoords.lng }}
            icon={svgIcon(ORIGIN_ICON_SVG, new window.google.maps.Size(14, 14))}
            title="Pickup"
          />
        )}
        {destCoords && (
          <Marker
            position={{ lat: destCoords.lat, lng: destCoords.lng }}
            icon={svgIcon(DEST_ICON_SVG, new window.google.maps.Size(14, 14))}
            title="Delivery"
          />
        )}
        {carrierLat != null && carrierLng != null && (
          <Marker
            position={{ lat: carrierLat, lng: carrierLng }}
            icon={svgIcon(CARRIER_ICON_SVG, new window.google.maps.Size(22, 22))}
            title="Carrier — live location"
          />
        )}
      </GoogleMap>

      {updatedAt && (
        <div className="absolute bottom-2 left-2 bg-dark-900/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-dark-300 z-10">
          Updated {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-dark-900/80 backdrop-blur-sm rounded-lg px-2.5 py-1 z-10">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-emerald-400 font-medium">Live</span>
      </div>
    </div>
  );
}
