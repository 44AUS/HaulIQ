import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon paths (broken in CRA)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (data.length === 0) return null;
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

export default function RouteMap({ origin, dest, miles }) {
  const [coords, setCoords] = useState(null); // { origin: [lat,lon], dest: [lat,lon] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!origin || !dest) return;
    setLoading(true);
    setError(null);
    Promise.all([geocode(origin), geocode(dest)])
      .then(([o, d]) => {
        if (!o || !d) { setError('Could not locate one or both cities.'); return; }
        setCoords({ origin: o, dest: d });
      })
      .catch(() => setError('Map unavailable.'))
      .finally(() => setLoading(false));
  }, [origin, dest]);

  if (loading) return (
    <div className="h-56 rounded-lg bg-dark-700/50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="h-56 rounded-lg bg-dark-700/50 flex items-center justify-center">
      <p className="text-dark-400 text-sm">{error}</p>
    </div>
  );

  const positions = [coords.origin, coords.dest];

  return (
    <div className="rounded-lg overflow-hidden border border-dark-400/30" style={{ height: 220 }}>
      <MapContainer
        center={coords.origin}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds positions={positions} />
        <Marker position={coords.origin} icon={originIcon}>
          <Popup>{origin}</Popup>
        </Marker>
        <Marker position={coords.dest} icon={destIcon}>
          <Popup>{dest}</Popup>
        </Marker>
        <Polyline
          positions={positions}
          pathOptions={{ color: '#22c55e', weight: 2.5, dashArray: '8 6', opacity: 0.85 }}
        />
      </MapContainer>
      {miles && (
        <div className="bg-dark-800/80 px-3 py-1.5 text-xs text-dark-300 text-center border-t border-dark-400/20">
          ~{parseInt(miles).toLocaleString()} loaded miles
        </div>
      )}
    </div>
  );
}
