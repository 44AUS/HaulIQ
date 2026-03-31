import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  CircularProgress, IconButton, TextField, Alert, Stack, Paper, Divider,
} from '@mui/material';
import { GoogleMap, DirectionsRenderer, Marker, useJsApiLoader } from '@react-google-maps/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MessageIcon from '@mui/icons-material/Message';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BoltIcon from '@mui/icons-material/Bolt';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlaceIcon from '@mui/icons-material/Place';
import NavigationIcon from '@mui/icons-material/Navigation';
import DescriptionIcon from '@mui/icons-material/Description';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { loadsApi, messagesApi, bidsApi, bookingsApi, instantBookApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';
import ProfitBadge from '../../components/shared/ProfitBadge';
import BrokerRating from '../../components/shared/BrokerRating';
import DocumentPanel from '../../components/documents/DocumentPanel';

const LIBRARIES = ['places'];

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  scrollwheel: false,
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
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

function LoadHeroMap({ load }) {
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
          setTimeout(() => {
            const map = mapRef.current;
            if (!map) return;
            const bounds = new window.google.maps.LatLngBounds();
            result.routes[0].legs[0].steps.forEach(step => bounds.extend(step.start_location));
            bounds.extend(result.routes[0].legs[0].end_location);
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          }, 100);
        }
      }
    );
  }, [isLoaded, load]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!isLoaded) {
    return (
      <Box sx={{ height: 420, bgcolor: '#e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={28} sx={{ color: '#22c55e' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={{ height: 420, width: '100%' }}
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
        {directions && (
          <Marker position={directions.routes[0].legs[0].start_location} icon={aIcon} title={load.origin} />
        )}
        {directions && (
          <Marker position={directions.routes[0].legs[0].end_location} icon={bIcon} title={load.dest} />
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
  if (loadStatus === 'filled') return 3;
  return 0;
}

function LoadStepper({ load, bookingStatus }) {
  const active = stepIndex(load.status, bookingStatus);
  const CIRCLE = 32;

  return (
    <Box sx={{ py: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', mb: 1 }}>
        <Box sx={{
          position: 'absolute', top: '50%', left: CIRCLE / 2, right: CIRCLE / 2,
          height: 3, bgcolor: 'action.selected', borderRadius: 2, transform: 'translateY(-50%)',
        }} />
        <Box sx={{
          position: 'absolute', top: '50%', left: CIRCLE / 2, right: CIRCLE / 2,
          height: 3, borderRadius: 2, transform: 'translateY(-50%)',
          '&::after': {
            content: '""', position: 'absolute', top: 0, left: 0, height: '100%',
            width: `${(active / (STEPS.length - 1)) * 100}%`,
            bgcolor: 'primary.main', borderRadius: 2, transition: 'width 0.5s ease',
          },
        }} />
        {STEPS.map((step, i) => {
          const done    = i < active;
          const current = i === active;
          return (
            <Box key={step.key} sx={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              <Box sx={{
                width: CIRCLE, height: CIRCLE, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: done ? 'primary.main' : current ? 'primary.main' : 'background.paper',
                border: '2.5px solid',
                borderColor: done || current ? 'primary.main' : 'action.disabled',
                color: done || current ? '#fff' : 'text.disabled',
                transition: 'all 0.3s ease',
                boxShadow: current ? '0 0 0 5px rgba(25,118,210,0.15)' : 'none',
              }}>
                {done ? <CheckCircleIcon sx={{ fontSize: 16 }} />
                  : current ? step.icon
                  : <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'action.disabled' }} />}
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex' }}>
        {STEPS.map((step, i) => {
          const done    = i < active;
          const current = i === active;
          return (
            <Box key={step.key} sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="caption" sx={{
                fontSize: '0.7rem',
                fontWeight: current ? 700 : done ? 500 : 400,
                color: current ? 'primary.main' : done ? 'text.primary' : 'text.disabled',
                letterSpacing: current ? 0.3 : 0,
              }}>
                {step.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function LoadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const fromLabel = state?.from || 'Load Board';

  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [canInstantBook, setCanInstantBook] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null);
  const [myBid, setMyBid] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadsApi.get(id).then(adaptLoad),
      bookingsApi.forLoad(id).catch(() => null),
      bidsApi.my().catch(() => []),
    ])
      .then(([adapted, bk, allBids]) => {
        setLoad(adapted);
        setSaved(adapted?.saved || false);
        setBookingData(bk);
        if (bk?.booking?.status) setBookingStatus(bk.booking.status);
        setMyBid(allBids.find(b => String(b.load_id) === String(adapted._raw.id)) || null);
        instantBookApi.check(adapted._raw.id)
          .then(res => setCanInstantBook(res.eligible === true))
          .catch(() => setCanInstantBook(false));
      })
      .catch(() => setLoad(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );

  if (!load) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography color="text.secondary" gutterBottom>Load not found.</Typography>
      <Button component={Link} to="/carrier/loads" variant="text">Back to Load Board</Button>
    </Box>
  );

  const booking = bookingData?.booking || null;
  const fuelCostEst = load.fuel;
  const deadheadCost = Math.round(load.deadhead * 0.62);
  const grossRevenue = load.rate;
  const expenses = fuelCostEst + deadheadCost + 120;
  const netProfit = grossRevenue - expenses;

  const handleInstantBook = () => {
    bookingsApi.request({ load_id: load._raw.id, is_instant: true })
      .then(() => setBookingStatus('instant_booked'))
      .catch(err => alert(err.message));
  };

  const handleBookNow = () => {
    bookingsApi.request({ load_id: load._raw.id, is_instant: false })
      .then(() => setBookingStatus('pending'))
      .catch(err => alert(err.message));
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const brokerUserId = load._raw?.broker_user_id;
    if (!brokerUserId) return;
    messagesApi.send(load._raw.id, brokerUserId, messageText.trim()).catch(() => {});
    setMessageText('');
    setMessageOpen(false);
  };

  const getBidStatusColor = (status) => {
    if (status === 'accepted') return 'success';
    if (status === 'countered') return 'info';
    if (status === 'rejected') return 'error';
    return 'warning';
  };

  const getBidStatusLabel = (status) => {
    if (status === 'accepted') return 'Bid Accepted!';
    if (status === 'countered') return 'Broker Countered';
    if (status === 'rejected') return 'Bid Rejected';
    return 'Bid Pending';
  };

  const activeBookingStatus = booking?.status || bookingStatus;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Full-bleed map ── */}
      <Box sx={{ mx: { xs: -2, sm: -3, lg: -4 }, mt: { xs: -2, sm: -3, lg: -4 }, mb: 3, overflow: 'hidden', position: 'relative' }}>
        <LoadHeroMap load={load} />

        {/* Floating back button */}
        <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
              color: 'text.primary', fontWeight: 600, fontSize: '0.8rem',
              px: 1.75, py: 0.75, borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              border: '1px solid rgba(0,0,0,0.08)',
              '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
            }}
          >
            {fromLabel}
          </Button>
        </Box>

        {/* Save bookmark over map */}
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <IconButton
            onClick={() => { loadsApi.toggleSave(load._raw.id).catch(() => {}); setSaved(s => !s); }}
            sx={{
              bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              border: '1px solid rgba(0,0,0,0.08)',
              color: saved ? 'primary.main' : 'text.secondary',
              '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
            }}
          >
            {saved ? <BookmarkAddedIcon /> : <BookmarkIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* ── Two-column content ── */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexDirection: { xs: 'column', lg: 'row' } }}>

        {/* ── LEFT: Trip info ── */}
        <Card sx={{ flex: '0 0 550px', minWidth: 0 }}>
          <CardContent sx={{ pt: 2.5 }}>
            <LoadStepper load={load} bookingStatus={activeBookingStatus} />
            <Divider sx={{ my: 2 }} />

            {/* Load headline */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    Load #{load.id.slice(0, 8).toUpperCase()}
                  </Typography>
                  {load.hot && <Chip label="Hot Load" size="small" color="error" />}
                  {load.instantBook && <Chip icon={<BoltIcon />} label="Instant Book" size="small" color="success" variant="outlined" />}
                  <Chip icon={<LocalShippingIcon />} label={load.type} size="small" color="primary" variant="outlined" />
                </Box>
                <Typography variant="h6" fontWeight={700}>{load.origin} → {load.dest}</Typography>
                <Typography variant="body2" color="text.secondary">{load.commodity} · {load.miles} mi · Pickup {load.pickup}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {load.status === 'active' && <Chip label="Active" color="success" size="small" />}
                {load.status === 'filled' && <Chip label="Filled" color="info" size="small" />}
                {activeBookingStatus === 'in_transit' && (
                  <Chip
                    icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#f59e0b !important' }} />}
                    label="In Transit" size="small"
                    sx={{ bgcolor: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
                  />
                )}
                {activeBookingStatus === 'completed' && <Chip label="Delivered" color="success" size="small" variant="outlined" />}
              </Box>
            </Box>

            {/* Stats */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {[
                { label: 'Rate',     value: `$${(load.rate || 0).toLocaleString()}` },
                { label: 'Per Mile', value: `$${(load.ratePerMile || 0).toFixed(2)}` },
                { label: 'Miles',    value: `${load.miles} mi` },
                { label: 'Weight',   value: load.weight },
              ].map(({ label, value }) => (
                <Grid item xs={6} key={label}>
                  <Paper variant="outlined" sx={{ p: 1.25, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, mt: 0.25 }}>{value}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Pickup / Delivery */}
            <Grid container spacing={2}>
              {[
                { label: 'Pickup',   addr: load.pickupAddress || load.origin,   city: load.pickupAddress ? load.origin : null,   date: load.pickup,   dot: '#22c55e' },
                { label: 'Delivery', addr: load.deliveryAddress || load.dest,   city: load.deliveryAddress ? load.dest : null,   date: load.delivery, dot: '#ef4444' },
              ].map(({ label, addr, city, date, dot }) => (
                <Grid item xs={12} key={label}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ mt: 0.5, width: 10, height: 10, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>{addr}</Typography>
                      {city && <Typography variant="caption" color="text.secondary" display="block">{city}</Typography>}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                        <CalendarTodayIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.disabled">{date}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {load.notes && (
              <Paper variant="outlined" sx={{ p: 1.5, mt: 2, borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>Notes</Typography>
                <Typography variant="body2">{load.notes}</Typography>
              </Paper>
            )}
          </CardContent>
        </Card>

        {/* ── RIGHT: Actions + Profit + Documents ── */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Broker */}
          {load.broker && (
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Broker</Typography>
                <BrokerRating broker={load.broker} />
              </CardContent>
            </Card>
          )}

          {/* Booking CTAs */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Book This Load</Typography>
              <Stack spacing={1.5}>
                {bookingStatus === 'instant_booked' && (
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    <Typography variant="body2" fontWeight={600}>Booked!</Typography>
                    <Typography variant="caption">This load is now assigned to you.</Typography>
                  </Alert>
                )}
                {activeBookingStatus === 'pending' && (
                  <Alert severity="warning" icon={<AccessTimeIcon />}>
                    <Typography variant="body2" fontWeight={600}>Request Sent</Typography>
                    <Typography variant="caption">Awaiting broker approval.</Typography>
                  </Alert>
                )}
                {activeBookingStatus === 'approved' && (
                  <Alert severity="info" icon={<CheckCircleIcon />}>
                    <Typography variant="body2" fontWeight={600}>Booking Approved</Typography>
                    <Typography variant="caption">Your booking has been approved by the broker.</Typography>
                  </Alert>
                )}
                {activeBookingStatus === 'in_transit' && (
                  <Alert severity="warning" icon={<NavigationIcon />}>
                    <Typography variant="body2" fontWeight={600}>In Transit</Typography>
                    <Typography variant="caption">You are currently hauling this load.</Typography>
                  </Alert>
                )}
                {activeBookingStatus === 'completed' && (
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    <Typography variant="body2" fontWeight={600}>Delivered</Typography>
                    <Typography variant="caption">This load has been delivered successfully.</Typography>
                  </Alert>
                )}

                {!bookingStatus && !activeBookingStatus && (
                  <>
                    {canInstantBook && (
                      <Button onClick={handleInstantBook} variant="contained" color="success" fullWidth startIcon={<BoltIcon />} size="large">
                        Instant Book
                      </Button>
                    )}
                    {load.instantBook && !canInstantBook && (
                      <Button variant="outlined" disabled fullWidth startIcon={<BoltIcon />}>
                        Instant Book · Not on allowlist
                      </Button>
                    )}
                    {load.bookNow && !canInstantBook && (
                      <Button onClick={handleBookNow} variant="contained" fullWidth startIcon={<EventAvailableIcon />} size="large">
                        Book Now
                      </Button>
                    )}
                    {myBid ? (
                      <Card variant="outlined" sx={{
                        borderColor:
                          myBid.status === 'accepted' ? 'success.main' :
                          myBid.status === 'countered' ? 'info.main' :
                          myBid.status === 'rejected' ? 'error.main' : 'warning.main'
                      }}>
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Chip label={getBidStatusLabel(myBid.status)} size="small" color={getBidStatusColor(myBid.status)} />
                            <Typography variant="body2" fontWeight={700}>${myBid.amount.toLocaleString()}</Typography>
                          </Box>
                          {myBid.status === 'countered' && myBid.counter_amount && (
                            <Typography variant="caption" color="info.main">
                              Counter offer: <strong>${myBid.counter_amount.toLocaleString()}</strong>
                              {myBid.counter_note && ` — "${myBid.counter_note}"`}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Button component={Link} to={`/carrier/loads/${id}/bid`} variant="outlined" fullWidth startIcon={<AttachMoneyIcon />} size="large">
                        Place Bid / Counter Offer
                      </Button>
                    )}
                  </>
                )}

                {/* Message Broker */}
                {!messageOpen ? (
                  <Button onClick={() => setMessageOpen(true)} variant="outlined" fullWidth startIcon={<MessageIcon />}>
                    Message Broker
                  </Button>
                ) : (
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="body2" fontWeight={600}>Message {load.broker?.name}</Typography>
                        <IconButton size="small" onClick={() => setMessageOpen(false)}><CloseIcon fontSize="small" /></IconButton>
                      </Box>
                      <TextField fullWidth multiline rows={3} size="small"
                        placeholder="Ask about the load, negotiate rate, etc..."
                        value={messageText} onChange={e => setMessageText(e.target.value)} sx={{ mb: 1.5 }} />
                      <Button onClick={handleSendMessage} disabled={!messageText.trim()} variant="contained" fullWidth startIcon={<SendIcon />}>
                        Send Message
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {load.broker?.warns > 0 && (
                  <Alert severity="error" icon={<WarningAmberIcon />}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>Broker Warning</Typography>
                    <Typography variant="caption">
                      This broker has {load.broker.warns} active warning flag{load.broker.warns > 1 ? 's' : ''}. Proceed with caution.
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Profit Breakdown */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Profit Breakdown</Typography>
              <Stack spacing={0}>
                {[
                  { label: 'Gross Rate', value: `+$${grossRevenue.toLocaleString()}`, color: 'success.main' },
                  { label: `Fuel (~${load.miles} mi @ $${load.dieselPrice ? load.dieselPrice.toFixed(2) : '—'}/gal)`, value: `-$${fuelCostEst}`, color: 'error.main' },
                  { label: `Deadhead (${load.deadhead} mi)`, value: `-$${deadheadCost}`, color: 'error.main' },
                  { label: 'Misc / tolls', value: '-$120', color: 'error.main' },
                ].map(({ label, value, color }) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color }}>{value}</Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2 }}>
                  <Typography variant="body1" fontWeight={700}>Estimated Net Profit</Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: netProfit > 0 ? 'success.main' : 'error.main' }}>
                    {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ mt: 2 }}>
                <ProfitBadge score={load.profitScore} net={netProfit} ratePerMile={load.ratePerMile} size="lg" />
              </Box>
            </CardContent>
          </Card>

          {/* Documents */}
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
      </Box>
    </Box>
  );
}
