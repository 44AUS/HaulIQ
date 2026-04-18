import { useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
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

const CARRIER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="8" fill="#22c55e" stroke="#fff" stroke-width="3"/>
  <circle cx="12" cy="12" r="12" fill="none" stroke="rgba(34,197,94,0.25)" stroke-width="2"/>
</svg>`;

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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography color="text.secondary">Invalid location coordinates.</Typography>
      </Box>
    );
  }

  const center = { lat: parsedLat, lng: parsedLng };
  const carrierIcon = isLoaded ? {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(CARRIER_ICON_SVG)}`,
    scaledSize: new window.google.maps.Size(24, 24),
    anchor: new window.google.maps.Point(12, 12),
  } : undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Button
        variant="text"
        startIcon={<IonIcon name="arrow-back-outline" />}
        onClick={() => navigate(-1)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back
      </Button>

      <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '50%',
          bgcolor: 'rgba(46,125,50,0.12)', border: 1, borderColor: 'success.main',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IonIcon name="location-outline" sx={{ fontSize: 18, color: 'success.main' }} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={700}>{decodedName}</Typography>
          {decodedCity && (
            <Typography variant="caption" color="text.secondary">Currently near {decodedCity}</Typography>
          )}
        </Box>
      </Paper>

      <Box sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', height: 'calc(100vh - 220px)', minHeight: 400 }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ height: '100%', width: '100%' }}
            center={center}
            zoom={14}
            options={MAP_OPTIONS}
            onLoad={onMapLoad}
          >
            <Marker position={center} icon={carrierIcon} title={decodedName} />
          </GoogleMap>
        ) : (
          <Box sx={{ height: '100%', bgcolor: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary" variant="body2">Loading map…</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
