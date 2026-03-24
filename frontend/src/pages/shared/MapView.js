import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography color="text.secondary">Invalid location coordinates.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back
      </Button>

      <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36, height: 36, borderRadius: '50%',
            bgcolor: 'rgba(46,125,50,0.12)', border: 1, borderColor: 'success.main',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <LocationOnIcon sx={{ fontSize: 18, color: 'success.main' }} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={700}>{decodedName}</Typography>
          {decodedCity && (
            <Typography variant="caption" color="text.secondary">Currently near {decodedCity}</Typography>
          )}
        </Box>
      </Paper>

      <Box
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider',
          height: 'calc(100vh - 220px)',
          minHeight: 400,
        }}
      >
        <div ref={containerRef} style={{ height: '100%', width: '100%', background: '#0d1117' }} />
      </Box>
    </Box>
  );
}
