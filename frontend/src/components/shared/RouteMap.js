import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

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

const DIR_RENDERER_OPTIONS = {
  suppressMarkers: false,
  polylineOptions: { strokeColor: '#22c55e', strokeWeight: 3, strokeOpacity: 0.85 },
};

/**
 * Google Maps route map.
 * Props: origin (string city/state), dest (string city/state), miles (number)
 * If pickupLat/pickupLng/deliveryLat/deliveryLng provided, uses coords directly.
 */
export default function RouteMap({ origin, dest, miles, pickupLat, pickupLng, deliveryLat, deliveryLng }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const [directions, setDirections] = useState(null);
  const [error, setError] = useState(null);

  const fetchRoute = useCallback(() => {
    if (!isLoaded || (!origin && !pickupLat) || (!dest && !deliveryLat)) return;

    const svc = new window.google.maps.DirectionsService();
    const fromArg = pickupLat && pickupLng
      ? new window.google.maps.LatLng(pickupLat, pickupLng)
      : origin;
    const toArg = deliveryLat && deliveryLng
      ? new window.google.maps.LatLng(deliveryLat, deliveryLng)
      : dest;

    svc.route(
      {
        origin: fromArg,
        destination: toArg,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
          setError(null);
        } else {
          setError('Route unavailable');
        }
      }
    );
  }, [isLoaded, origin, dest, pickupLat, pickupLng, deliveryLat, deliveryLng]);

  useEffect(() => { fetchRoute(); }, [fetchRoute]);

  if (!isLoaded || (!directions && !error)) {
    return (
      <div style={{ height: 220, borderRadius: 8, background: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, border: '2px solid rgba(34,197,94,0.3)', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: 220, borderRadius: 8, background: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#6b7280', fontSize: 14 }}>{error}</span>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(75,85,99,0.3)' }}>
      <GoogleMap
        mapContainerStyle={{ height: 220, width: '100%' }}
        options={MAP_OPTIONS}
        zoom={5}
      >
        {directions && (
          <DirectionsRenderer directions={directions} options={DIR_RENDERER_OPTIONS} />
        )}
      </GoogleMap>
      {miles && (
        <div style={{ background: 'rgba(26,31,46,0.9)', padding: '6px 12px', fontSize: 12, color: '#9ca3af', textAlign: 'center', borderTop: '1px solid rgba(75,85,99,0.2)' }}>
          ~{parseInt(miles).toLocaleString()} loaded miles
        </div>
      )}
    </div>
  );
}
