import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { loadsApi, bidsApi, bookingsApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, CircularProgress,
  Paper, Alert, Divider, Stack,
} from '@mui/material';
import { GoogleMap, DirectionsRenderer, Marker, useJsApiLoader } from '@react-google-maps/api';
import DescriptionIcon from '@mui/icons-material/Description';
import DocumentPanel from '../../components/documents/DocumentPanel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import NavigationIcon from '@mui/icons-material/Navigation';
import PlaceIcon from '@mui/icons-material/Place';

const LIBRARIES = ['places'];

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  scrollwheel: false,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1a1f2e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1f2e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#374151' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2937' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d1d5db' }] },
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

const CARRIER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="9" fill="#f59e0b" stroke="white" stroke-width="3"/>
  <circle cx="12" cy="12" r="13" fill="none" stroke="rgba(245,158,11,0.3)" stroke-width="2"/>
</svg>`;

// ─── Hero map component ────────────────────────────────────────────────────────
function LoadHeroMap({ load, carrierLocation }) {
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
          // Fit bounds to route + carrier if present
          setTimeout(() => {
            const map = mapRef.current;
            if (!map) return;
            const bounds = new window.google.maps.LatLngBounds();
            result.routes[0].legs[0].steps.forEach(step => bounds.extend(step.start_location));
            bounds.extend(result.routes[0].legs[0].end_location);
            if (carrierLocation?.lat) bounds.extend({ lat: carrierLocation.lat, lng: carrierLocation.lng });
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          }, 100);
        }
      }
    );
  }, [isLoaded, load, carrierLocation]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const carrierIcon = isLoaded ? {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(CARRIER_SVG)}`,
    scaledSize: new window.google.maps.Size(24, 24),
    anchor: new window.google.maps.Point(12, 12),
  } : undefined;

  if (!isLoaded) {
    return (
      <Box sx={{ height: 320, bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={28} sx={{ color: '#22c55e' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={{ height: 320, width: '100%' }}
        options={MAP_OPTIONS}
        zoom={6}
        onLoad={onMapLoad}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: { strokeColor: '#22c55e', strokeWeight: 4, strokeOpacity: 0.9 },
            }}
          />
        )}
        {/* A marker — pickup */}
        {directions && (
          <Marker
            position={directions.routes[0].legs[0].start_location}
            icon={aIcon}
            title={load.origin}
          />
        )}
        {/* B marker — delivery */}
        {directions && (
          <Marker
            position={directions.routes[0].legs[0].end_location}
            icon={bIcon}
            title={load.dest}
          />
        )}
        {/* Carrier live location */}
        {carrierLocation?.lat && carrierLocation?.lng && (
          <Marker
            position={{ lat: carrierLocation.lat, lng: carrierLocation.lng }}
            icon={carrierIcon}
            title="Carrier location"
          />
        )}
      </GoogleMap>

      {/* Route overlay */}
      <Box sx={{
        position: 'absolute', bottom: 12, left: 12, right: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        <Paper sx={{ px: 1.5, py: 0.75, bgcolor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
            <Typography variant="caption" fontWeight={600} sx={{ color: '#e5e7eb' }}>{load.origin}</Typography>
          </Box>
        </Paper>
        <Box sx={{ flex: 1, mx: 1, height: 1, bgcolor: 'rgba(34,197,94,0.3)', borderStyle: 'dashed' }} />
        <Paper sx={{ px: 1.5, py: 0.75, bgcolor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
            <Typography variant="caption" fontWeight={600} sx={{ color: '#e5e7eb' }}>{load.dest}</Typography>
          </Box>
        </Paper>
      </Box>

      {/* Carrier badge */}
      {carrierLocation?.lat && (
        <Box sx={{
          position: 'absolute', top: 12, right: 12,
          display: 'flex', alignItems: 'center', gap: 0.75,
          bgcolor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(245,158,11,0.4)', borderRadius: 1.5, px: 1.25, py: 0.75,
        }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#f59e0b', animation: 'pulse 2s infinite' }} />
          <Typography variant="caption" fontWeight={600} sx={{ color: '#fbbf24' }}>Carrier On Route</Typography>
        </Box>
      )}
    </Box>
  );
}

// ─── Stepper ───────────────────────────────────────────────────────────────────
const STEPS = [
  { key: 'posted',     label: 'Posted',     icon: <PlaceIcon sx={{ fontSize: 16 }} /> },
  { key: 'booked',     label: 'Booked',     icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
  { key: 'in_transit', label: 'In Transit', icon: <NavigationIcon sx={{ fontSize: 16 }} /> },
  { key: 'delivered',  label: 'Delivered',  icon: <LocalShippingIcon sx={{ fontSize: 16 }} /> },
];

function stepIndex(loadStatus, bookingStatus) {
  if (bookingStatus === 'completed') return 3;
  if (bookingStatus === 'in_transit') return 2;
  if (bookingStatus === 'approved' || bookingStatus === 'pending') return 1;
  if (loadStatus === 'filled') return 3; // fallback
  return 0;
}

function LoadStepper({ load, bookingStatus }) {
  const active = stepIndex(load.status, bookingStatus);

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        {/* Track line */}
        <Box sx={{
          position: 'absolute', top: '50%', left: 16, right: 16,
          height: 3, bgcolor: 'action.selected', borderRadius: 2,
          transform: 'translateY(-50%)',
          '&::after': {
            content: '""', position: 'absolute', top: 0, left: 0, height: '100%',
            width: `${(active / (STEPS.length - 1)) * 100}%`,
            bgcolor: 'primary.main', borderRadius: 2,
            transition: 'width 0.4s ease',
          },
        }} />

        {STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <Box key={step.key} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: done || current ? 'primary.main' : 'background.paper',
                border: '3px solid',
                borderColor: done || current ? 'primary.main' : 'action.selected',
                color: done || current ? 'primary.contrastText' : 'text.disabled',
                transition: 'all 0.3s ease',
                boxShadow: current ? '0 0 0 4px rgba(25,118,210,0.2)' : 'none',
              }}>
                {done ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : (current ? step.icon : <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />)}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  mt: 0.75, fontWeight: current ? 700 : done ? 500 : 400,
                  color: done || current ? 'text.primary' : 'text.disabled',
                  textAlign: 'center', lineHeight: 1.2,
                }}
              >
                {step.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── Bid chips ─────────────────────────────────────────────────────────────────
function bidStatusChip(status) {
  const map = {
    pending:   { label: 'Pending',   color: 'warning' },
    accepted:  { label: 'Accepted',  color: 'success' },
    rejected:  { label: 'Rejected',  color: 'error' },
    countered: { label: 'Countered', color: 'info' },
    withdrawn: { label: 'Withdrawn', color: 'default' },
  };
  const cfg = map[status] || map.pending;
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function BrokerLoadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [load, setLoad]           = useState(null);
  const [bids, setBids]           = useState([]);
  const [bookingData, setBooking] = useState(null); // { booking, location }
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError]         = useState(null);

  useEffect(() => {
    Promise.all([
      loadsApi.get(id).then(adaptLoad),
      bidsApi.forLoad(id).catch(() => []),
      bookingsApi.forLoad(id).catch(() => null),
    ])
      .then(([l, b, bk]) => {
        setLoad(l);
        setBids(Array.isArray(b) ? b : []);
        setBooking(bk);
      })
      .catch(() => setError('Load not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAcceptBid = (bidId) => {
    setActionLoading(bidId);
    bidsApi.accept(bidId)
      .then(() => setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'accepted' } : b)))
      .catch(err => alert(err.message))
      .finally(() => setActionLoading(null));
  };

  const handleRejectBid = (bidId) => {
    setActionLoading(bidId + '_reject');
    bidsApi.reject(bidId)
      .then(() => setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'rejected' } : b)))
      .catch(err => alert(err.message))
      .finally(() => setActionLoading(null));
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );

  if (error || !load) return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Alert severity="error" sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}>{error || 'Load not found'}</Alert>
      <Button variant="outlined" onClick={() => navigate(-1)}>Go back</Button>
    </Box>
  );

  const booking = bookingData?.booking || null;
  const carrierLocation = bookingData?.location || null;
  const bookingStatus = booking?.status || null;
  const pendingBids = bids.filter(b => b.status === 'pending');

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Back button */}
      <Box sx={{ px: { xs: 0, sm: 0 }, pt: 0, pb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} variant="text" onClick={() => navigate(-1)} sx={{ pl: 0 }}>
          Back to Manage Loads
        </Button>
      </Box>

      {/* ── Hero card: map + stepper + header ── */}
      <Card sx={{ overflow: 'hidden', mb: 3 }}>
        {/* Map */}
        <LoadHeroMap load={load} carrierLocation={carrierLocation} />

        <CardContent sx={{ pt: 2.5 }}>
          {/* Stepper */}
          <LoadStepper load={load} bookingStatus={bookingStatus} />

          <Divider sx={{ my: 2 }} />

          {/* Load headline */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                Load #{load.id.slice(0, 8).toUpperCase()}
                {booking && <> · Carrier: <strong>{booking.carrier_name}</strong>{booking.carrier_mc ? ` (MC-${booking.carrier_mc})` : ''}</>}
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {load.origin} → {load.dest}
              </Typography>
              <Typography variant="body2" color="text.secondary">{load.type} · {load.miles} mi · Pickup {load.pickup}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {load.status === 'active' && <Chip label="Active" color="success" size="small" />}
              {load.status === 'filled' && <Chip label="Filled" color="info" size="small" />}
              {load.status === 'expired' && <Chip label="Expired" color="error" size="small" />}
              {bookingStatus === 'in_transit' && (
                <Chip
                  icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#f59e0b !important' }} />}
                  label="In Transit"
                  size="small"
                  sx={{ bgcolor: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
                />
              )}
              {bookingStatus === 'completed' && <Chip label="Delivered" color="success" size="small" variant="outlined" />}
            </Box>
          </Box>

          {/* Stats row */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {[
              { label: 'Rate', value: `$${(load.rate || 0).toLocaleString()}`, icon: <AttachMoneyIcon sx={{ fontSize: 14 }} /> },
              { label: 'Per Mile', value: `$${(load.ratePerMile || 0).toFixed(2)}` },
              { label: 'Views', value: load.viewCount || 0, icon: <VisibilityIcon sx={{ fontSize: 14 }} /> },
              { label: 'Bids', value: bids.length, icon: <GroupIcon sx={{ fontSize: 14 }} /> },
            ].map(({ label, value, icon }) => (
              <Grid item xs={6} sm={3} key={label}>
                <Paper variant="outlined" sx={{ p: 1.25, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4 }}>
                    {icon}{label}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, mt: 0.25 }}>{value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Pickup / Delivery detail row */}
          <Grid container spacing={2}>
            {[
              {
                label: 'Pickup',
                addr: load.pickupAddress || load.origin,
                city: load.pickupAddress ? load.origin : null,
                date: load.pickup,
                color: 'success.main',
                dot: '#22c55e',
              },
              {
                label: 'Delivery',
                addr: load.deliveryAddress || load.dest,
                city: load.deliveryAddress ? load.dest : null,
                date: load.delivery,
                color: 'error.main',
                dot: '#ef4444',
              },
            ].map(({ label, addr, city, date, color, dot }) => (
              <Grid item xs={12} sm={6} key={label}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Box sx={{ mt: 0.5, width: 10, height: 10, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>{addr}</Typography>
                    {city && <Typography variant="caption" color="text.secondary">{city}</Typography>}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      <CalendarTodayIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.disabled">{date}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Carrier location link */}
          {carrierLocation && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 1.5 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                  <Typography variant="caption" color="text.secondary">
                    Last location update · {booking?.carrier_name}
                  </Typography>
                </Box>
                {booking && (
                  <Button
                    component={Link}
                    to={`/broker/track/${booking.id}`}
                    variant="text"
                    size="small"
                    startIcon={<NavigationIcon sx={{ fontSize: 14 }} />}
                    sx={{ py: 0 }}
                  >
                    Full Tracking
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {load.notes && (
            <Paper variant="outlined" sx={{ p: 1.5, mt: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>Notes</Typography>
              <Typography variant="body2">{load.notes}</Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* ── Bids ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <GroupIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>Bids</Typography>
            {pendingBids.length > 0 && <Chip label={`${pendingBids.length} pending`} size="small" color="warning" />}
          </Box>

          {bids.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>No bids yet</Typography>
          ) : (
            <Stack spacing={1.5}>
              {bids.map(bid => (
                <Paper key={bid.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography
                          component={Link}
                          to={`/carrier-profile/${bid.carrier_id}`}
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {bid.carrier_name || 'Carrier'}
                        </Typography>
                        {bid.carrier_mc && <Typography variant="caption" color="text.secondary">MC-{bid.carrier_mc}</Typography>}
                        {bidStatusChip(bid.status)}
                      </Box>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        ${(bid.amount || 0).toLocaleString()}
                      </Typography>
                      {bid.note && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                          "{bid.note}"
                        </Typography>
                      )}
                      {bid.counter_amount && (
                        <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5 }}>
                          Counter offer: ${bid.counter_amount.toLocaleString()}
                          {bid.counter_note && ` — ${bid.counter_note}`}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      <Button
                        component={Link}
                        to="/broker/messages"
                        variant="text"
                        size="small"
                        sx={{ minWidth: 0, px: 1 }}
                        title="Message carrier"
                      >
                        <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
                      </Button>
                      {bid.status === 'pending' && load.status === 'active' && (
                        <>
                          <Button
                            size="small" variant="outlined" color="success"
                            startIcon={actionLoading === bid.id ? <CircularProgress size={12} color="inherit" /> : <CheckCircleIcon />}
                            onClick={() => handleAcceptBid(bid.id)}
                            disabled={!!actionLoading}
                          >
                            Accept
                          </Button>
                          <Button
                            size="small" variant="outlined" color="error"
                            startIcon={actionLoading === bid.id + '_reject' ? <CircularProgress size={12} color="inherit" /> : <CancelIcon />}
                            onClick={() => handleRejectBid(bid.id)}
                            disabled={!!actionLoading}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* ── Documents ── */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <DescriptionIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>Documents & Load Messages</Typography>
          </Box>
          <DocumentPanel loadId={id} />
        </CardContent>
      </Card>

    </Box>
  );
}
