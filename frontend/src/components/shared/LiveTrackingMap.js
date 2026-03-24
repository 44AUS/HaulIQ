import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix broken default icons in CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

const CARRIER_ICON = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(34,197,94,0.3),0 2px 8px rgba(0,0,0,0.5)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const ORIGIN_ICON = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#22c55e;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const DEST_ICON = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#ef4444;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function LiveTrackingMap({ carrierLat, carrierLng, originCoords, destCoords, updatedAt }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const carrierMarkerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 18,
    }).addTo(map);

    // Origin / dest markers
    if (originCoords) L.marker([originCoords.lat, originCoords.lng], { icon: ORIGIN_ICON }).addTo(map).bindPopup('Pickup');
    if (destCoords)   L.marker([destCoords.lat,  destCoords.lng],  { icon: DEST_ICON   }).addTo(map).bindPopup('Delivery');

    // Dashed route line if both coords available
    if (originCoords && destCoords) {
      L.polyline(
        [[originCoords.lat, originCoords.lng], [destCoords.lat, destCoords.lng]],
        { color: '#4ade80', weight: 2, dashArray: '6 6', opacity: 0.5 }
      ).addTo(map);
    }

    return () => { map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update carrier marker whenever position changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || carrierLat == null || carrierLng == null) return;

    if (carrierMarkerRef.current) {
      carrierMarkerRef.current.setLatLng([carrierLat, carrierLng]);
    } else {
      carrierMarkerRef.current = L.marker([carrierLat, carrierLng], { icon: CARRIER_ICON })
        .addTo(map)
        .bindPopup('Carrier — live location');
    }

    // Fit map to show carrier + origin + dest
    const points = [[carrierLat, carrierLng]];
    if (originCoords) points.push([originCoords.lat, originCoords.lng]);
    if (destCoords)   points.push([destCoords.lat,  destCoords.lng]);
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [carrierLat, carrierLng]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative rounded-xl overflow-hidden border border-dark-400/40" style={{ height: 280 }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%', background: '#0d1117' }} />
      {updatedAt && (
        <div className="absolute bottom-2 left-2 bg-dark-900/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-dark-300 z-[400]">
          Updated {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-dark-900/80 backdrop-blur-sm rounded-lg px-2.5 py-1 z-[400]">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-emerald-400 font-medium">Live</span>
      </div>
    </div>
  );
}
