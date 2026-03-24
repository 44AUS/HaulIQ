import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

const CARRIER_ICON = L.divIcon({
  className: '',
  html: `<div style="width:22px;height:22px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(34,197,94,0.25),0 2px 10px rgba(0,0,0,0.5)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function MapView() {
  const { lat, lng, city, name } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  const decodedCity = city ? decodeURIComponent(city) : null;
  const decodedName = name ? decodeURIComponent(name) : 'Carrier';

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (isNaN(parsedLat) || isNaN(parsedLng)) return;

    const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([parsedLat, parsedLng], { icon: CARRIER_ICON }).addTo(map);
    marker.bindPopup(
      `<div style="font-family:sans-serif;padding:2px 4px">
        <strong style="color:#22c55e">${decodedName}</strong>
        ${decodedCity ? `<br><span style="color:#9ca3af;font-size:12px">${decodedCity}</span>` : ''}
      </div>`,
      { className: 'dark-popup' }
    ).openPopup();

    map.setView([parsedLat, parsedLng], 14);

    return () => { map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return (
      <div className="flex items-center justify-center py-20 text-dark-400">
        Invalid location coordinates.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-dark-300 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="glass rounded-xl p-4 border border-dark-400/40 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <MapPin size={15} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{decodedName}</p>
          {decodedCity && <p className="text-dark-400 text-xs">Currently near {decodedCity}</p>}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-dark-400/40" style={{ height: 'calc(100vh - 220px)', minHeight: 400 }}>
        <div ref={containerRef} style={{ height: '100%', width: '100%', background: '#0d1117' }} />
      </div>
    </div>
  );
}
