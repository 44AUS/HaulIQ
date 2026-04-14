import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Chip,
  CircularProgress, Stack, Alert, TextField, Divider, Avatar,
  Stepper, Step, StepLabel, Grid, Paper,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MessageIcon from '@mui/icons-material/Message';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NavigationIcon from '@mui/icons-material/Navigation';
import FlagIcon from '@mui/icons-material/Flag';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import AddCommentIcon from '@mui/icons-material/AddComment';
import PlaceIcon from '@mui/icons-material/Place';
import { GoogleMap, DirectionsRenderer, Marker, useJsApiLoader } from '@react-google-maps/api';
import { bookingsApi, freightPaymentsApi } from '../../services/api';
import RateConSignature from '../../components/shared/RateConSignature';

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

const A_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z" fill="#22c55e"/><circle cx="16" cy="16" r="8" fill="white"/><text x="16" y="20" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="10" fill="#22c55e">A</text></svg>`;
const B_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z" fill="#ef4444"/><circle cx="16" cy="16" r="8" fill="white"/><text x="16" y="20" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="10" fill="#ef4444">B</text></svg>`;

function LoadHeroMap({ origin, dest }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '', libraries: LIBRARIES });
  const [directions, setDirections] = useState(null);
  const mapRef = useRef(null);
  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

  useEffect(() => {
    if (!isLoaded || !origin || !dest) return;
    new window.google.maps.DirectionsService().route(
      { origin, destination: dest, travelMode: window.google.maps.TravelMode.DRIVING },
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
  }, [isLoaded, origin, dest]);

  const aIcon = isLoaded ? { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(A_ICON_SVG)}`, scaledSize: new window.google.maps.Size(32, 40), anchor: new window.google.maps.Point(16, 40) } : undefined;
  const bIcon = isLoaded ? { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(B_ICON_SVG)}`, scaledSize: new window.google.maps.Size(32, 40), anchor: new window.google.maps.Point(16, 40) } : undefined;

  if (!isLoaded) return <Box sx={{ height: 420, bgcolor: '#e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={28} /></Box>;

  return (
    <Box sx={{ position: 'relative' }}>
      <GoogleMap mapContainerStyle={{ height: 420, width: '100%' }} options={MAP_OPTIONS} zoom={6} onLoad={onMapLoad}>
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#22c55e', strokeWeight: 4, strokeOpacity: 0.9 } }} />}
        {directions && <Marker position={directions.routes[0].legs[0].start_location} icon={aIcon} />}
        {directions && <Marker position={directions.routes[0].legs[0].end_location} icon={bIcon} />}
      </GoogleMap>
      <Box sx={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
        <Paper sx={{ px: 1.5, py: 0.75, bgcolor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
            <Typography variant="caption" fontWeight={600} sx={{ color: '#e5e7eb' }}>{origin}</Typography>
          </Box>
        </Paper>
        <Box sx={{ flex: 1, mx: 1, height: 1, bgcolor: 'rgba(34,197,94,0.3)' }} />
        <Paper sx={{ px: 1.5, py: 0.75, bgcolor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
            <Typography variant="caption" fontWeight={600} sx={{ color: '#e5e7eb' }}>{dest}</Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

const TMS_STEPS  = ['Dispatched', 'Picked Up', 'In Transit', 'Delivered', 'POD Received'];
const TMS_VALUES = ['dispatched', 'picked_up', 'in_transit', 'delivered', 'pod_received'];

// ── Progress stepper (matches LoadDetail style) ───────────────────────────────
const BOOKING_STEPS = [
  { key: 'quoted',     label: 'Quoted',     icon: <PlaceIcon sx={{ fontSize: 16 }} /> },
  { key: 'booked',     label: 'Booked',     icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
  { key: 'in_transit', label: 'In Transit', icon: <NavigationIcon sx={{ fontSize: 16 }} /> },
  { key: 'delivered',  label: 'Delivered',  icon: <LocalShippingIcon sx={{ fontSize: 16 }} /> },
];

function stepIndex(status) {
  if (status === 'completed')              return 3;
  if (status === 'in_transit')             return 2;
  if (status === 'approved' || status === 'booked') return 1;
  return 0;
}

function BookingStepper({ status }) {
  const active = stepIndex(status);
  const CIRCLE = 32;
  return (
    <Box sx={{ py: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', mb: 1 }}>
        <Box sx={{ position: 'absolute', top: '50%', left: CIRCLE / 2, right: CIRCLE / 2, height: 3, bgcolor: 'action.selected', borderRadius: 2, transform: 'translateY(-50%)' }} />
        <Box sx={{ position: 'absolute', top: '50%', left: CIRCLE / 2, right: CIRCLE / 2, height: 3, borderRadius: 2, transform: 'translateY(-50%)', '&::after': { content: '""', position: 'absolute', top: 0, left: 0, height: '100%', width: `${(active / (BOOKING_STEPS.length - 1)) * 100}%`, bgcolor: 'primary.main', borderRadius: 2, transition: 'width 0.5s ease' } }} />
        {BOOKING_STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <Box key={step.key} sx={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              <Box sx={{ width: CIRCLE, height: CIRCLE, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: done || current ? 'primary.main' : 'background.paper', border: '2.5px solid', borderColor: done || current ? 'primary.main' : 'action.disabled', color: done || current ? '#fff' : 'text.disabled', transition: 'all 0.3s ease', boxShadow: current ? '0 0 0 5px rgba(25,118,210,0.15)' : 'none' }}>
                {done ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : current ? step.icon : <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'action.disabled' }} />}
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex' }}>
        {BOOKING_STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <Box key={step.key} sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: current ? 700 : done ? 500 : 400, color: current ? 'primary.main' : done ? 'text.primary' : 'text.disabled', letterSpacing: current ? 0.3 : 0 }}>
                {step.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function paymentStatusChip(status) {
  if (!status || status === 'unpaid') return <Chip label="Unpaid" size="small" sx={{ bgcolor: 'action.disabledBackground', color: 'text.secondary' }} />;
  const map = { pending: { label: 'Payment Pending', color: 'default' }, escrowed: { label: 'In Escrow', color: 'info' }, released: { label: 'Paid', color: 'success' }, failed: { label: 'Payment Failed', color: 'error' }, refunded: { label: 'Refunded', color: 'warning' } };
  const cfg = map[status] || { label: status, color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

const CARD_SX = { elevation: 0, sx: { boxShadow: '0 4px 24px rgba(0,0,0,0.18)', borderRadius: '8px' } };

import DocumentPanel from '../../components/documents/DocumentPanel';

export default function ActiveLoadDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [booking, setBooking]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [actionLoading, setActionLoading]   = useState(false);
  const [paymentStatus, setPaymentStatus]   = useState(null);
  const [checkCalls, setCheckCalls]         = useState([]);
  const [callNote, setCallNote]             = useState('');
  const [addingCall, setAddingCall]         = useState(false);
  const callsEndRef = useRef(null);

  const load = booking?.load;
  const tmsStep = booking?.tms_status ? TMS_VALUES.indexOf(booking.tms_status) : -1;

  useEffect(() => {
    bookingsApi.get(bookingId)
      .then(data => { setBooking(data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    freightPaymentsApi.status(bookingId).then(ps => setPaymentStatus(ps)).catch(() => {});
    bookingsApi.checkCalls(bookingId).then(calls => setCheckCalls(calls)).catch(() => {});
  }, [bookingId]);

  useEffect(() => { callsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [checkCalls]);

  const handlePickup = async () => {
    setActionLoading(true);
    try { await bookingsApi.pickup(bookingId); setBooking(b => ({ ...b, status: 'in_transit' })); }
    catch (e) { alert(e.message); } finally { setActionLoading(false); }
  };

  const handleDeliver = async () => {
    setActionLoading(true);
    try { await bookingsApi.deliver(bookingId); setBooking(b => ({ ...b, status: 'completed' })); }
    catch (e) { alert(e.message); } finally { setActionLoading(false); }
  };

  const handleAddCall = async () => {
    if (!callNote.trim()) return;
    setAddingCall(true);
    try {
      await bookingsApi.addCheckCall(bookingId, callNote.trim());
      const calls = await bookingsApi.checkCalls(bookingId);
      setCheckCalls(calls);
      setCallNote('');
    } catch (e) { alert(e.message); } finally { setAddingCall(false); }
  };

  const netProfit = load ? (load.rate || 0) - (load.fuel_cost_est || 0) - Math.round((load.deadhead_miles || 0) * 0.62) - 120 : 0;
  const canDownloadRateCon = ['approved', 'in_transit', 'completed'].includes(booking?.status);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  if (error || !booking) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <WarningAmberIcon sx={{ fontSize: 40, color: 'error.main', mb: 1.5 }} />
      <Typography color="text.secondary" gutterBottom>{error || 'Booking not found.'}</Typography>
      <Button variant="text" onClick={() => navigate('/carrier/job-manager')}>Go back</Button>
    </Box>
  );

  // ── Tab: Overview ────────────────────────────────────────────────────────
  const OverviewTab = (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mx: { xs: -2, sm: -3, lg: -4 }, mt: { xs: -2, sm: -3, lg: -4 }, mb: 3, overflow: 'hidden', position: 'relative' }}>
        {load?.origin && load?.destination
          ? <LoadHeroMap origin={load.origin} dest={load.destination} />
          : <Box sx={{ height: 420, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LocalShippingIcon sx={{ fontSize: 48, color: 'text.disabled' }} /></Box>
        }
      </Box>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexDirection: { xs: 'column', lg: 'row' } }}>
        <Card {...CARD_SX} sx={{ ...CARD_SX.sx, flex: '0 0 550px', minWidth: 0 }}>
          <CardContent sx={{ pt: 2.5 }}>
            <BookingStepper status={booking.status} />
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">Booking #{bookingId.slice(0, 8)}</Typography>
                {load?.load_type && <Chip icon={<LocalShippingIcon />} label={load.load_type.replace('_', ' ')} size="small" color="primary" variant="outlined" />}
                {booking.tms_status && <Chip label={TMS_STEPS[tmsStep] || booking.tms_status} size="small" color={tmsStep >= 3 ? 'success' : 'info'} />}
              </Box>
              <Typography variant="h6" fontWeight={700}>{load?.origin} → {load?.destination}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {load?.commodity}{load?.weight_lbs ? ` · ${Number(load.weight_lbs).toLocaleString()} lbs` : ''}{load?.miles ? ` · ${load.miles} loaded miles` : ''}
              </Typography>
            </Box>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {[{ label: 'Rate', value: `$${(load?.rate || 0).toLocaleString()}` }, { label: 'Per Mile', value: load?.rate && load?.miles ? `$${(load.rate / load.miles).toFixed(2)}` : '—' }, { label: 'Miles', value: load?.miles ? `${load.miles} mi` : '—' }, { label: 'Weight', value: load?.weight_lbs ? `${Number(load.weight_lbs).toLocaleString()} lbs` : '—' }].map(({ label, value }) => (
                <Grid item xs={6} key={label}><Paper variant="outlined" sx={{ p: 1.25, textAlign: 'center', borderRadius: 2 }}><Typography variant="caption" color="text.secondary" display="block">{label}</Typography><Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, mt: 0.25 }}>{value}</Typography></Paper></Grid>
              ))}
            </Grid>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {[{ label: 'Pickup', addr: load?.origin, date: load?.pickup_date, dot: '#22c55e' }, { label: 'Delivery', addr: load?.destination, date: load?.delivery_date, dot: '#ef4444' }].map(({ label, addr, date, dot }) => (
                <Grid item xs={12} key={label}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ mt: 0.5, width: 10, height: 10, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>{addr || '—'}</Typography>
                      {date && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}><CalendarTodayIcon sx={{ fontSize: 11, color: 'text.disabled' }} /><Typography variant="caption" color="text.disabled">{date}</Typography></Box>}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
            {booking.tms_status && (
              <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Dispatch Milestones</Typography>
                <Stepper activeStep={tmsStep} alternativeLabel>
                  {TMS_STEPS.map(label => <Step key={label}><StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 11 } }}>{label}</StepLabel></Step>)}
                </Stepper>
              </Box>
            )}
            {(booking.driver_name || booking.driver_phone) && (
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <PersonIcon color="action" fontSize="small" />
                <Box><Typography variant="caption" color="text.secondary" display="block">Assigned Driver</Typography><Typography variant="body2" fontWeight={600}>{booking.driver_name || '—'}</Typography>{booking.driver_phone && <Typography variant="caption" color="text.secondary">{booking.driver_phone}</Typography>}</Box>
              </Box>
            )}
            {(load?.notes || booking.carrier_visible_notes || booking.note || booking.broker_note) && (
              <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Notes</Typography>
                <Stack spacing={1.5}>
                  {load?.notes && <Box><Typography variant="caption" color="text.secondary" display="block">Load Instructions</Typography><Typography variant="body2">{load.notes}</Typography></Box>}
                  {booking.carrier_visible_notes && <Box><Typography variant="caption" color="text.secondary" display="block">Dispatch Notes</Typography><Typography variant="body2">{booking.carrier_visible_notes}</Typography></Box>}
                  {booking.note && <Box><Typography variant="caption" color="text.secondary" display="block">Your Note</Typography><Typography variant="body2">{booking.note}</Typography></Box>}
                  {booking.broker_note && <Box><Typography variant="caption" color="text.secondary" display="block">Broker Note</Typography><Typography variant="body2">{booking.broker_note}</Typography></Box>}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card {...CARD_SX} sx={CARD_SX.sx}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Load Status</Typography>
              <Stack spacing={1.5}>
                {booking.status === 'pending' && <Alert severity="warning" icon={<AccessTimeIcon />}><Typography variant="body2" fontWeight={600}>Awaiting Broker Approval</Typography><Typography variant="caption">The broker hasn't confirmed your booking yet.</Typography></Alert>}
                {booking.status === 'approved' && <Button onClick={handlePickup} disabled={actionLoading} variant="contained" fullWidth size="large" startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <NavigationIcon />}>Confirm Pickup — Mark as In Transit</Button>}
                {booking.status === 'in_transit' && <Button onClick={handleDeliver} disabled={actionLoading} variant="contained" color="success" fullWidth size="large" startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <FlagIcon />}>Confirm Delivery — Mark as Delivered</Button>}
                {booking.status === 'completed' && <Alert severity="success" icon={<CheckCircleIcon />}><Typography variant="body2" fontWeight={600}>Load Delivered</Typography><Typography variant="caption">This load has been completed.</Typography></Alert>}
                {load?.broker_user_id && <Button component={Link} to={`/carrier/messages?userId=${load.broker_user_id}`} variant="outlined" fullWidth startIcon={<MessageIcon />}>Message Broker</Button>}
                {load?.broker_name && (
                  <Box sx={{ pt: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Broker</Typography>
                    <Typography variant="body2" fontWeight={600}>{load.broker_name}</Typography>
                    {load.broker_mc && <Typography variant="caption" color="text.secondary">MC# {load.broker_mc}</Typography>}
                    {load.broker_email && <Button component="a" href={`mailto:${load.broker_email}`} variant="text" size="small" startIcon={<EmailIcon fontSize="small" />} sx={{ display: 'flex', justifyContent: 'flex-start', px: 0 }}>{load.broker_email}</Button>}
                    {load.broker_phone && <Button component="a" href={`tel:${load.broker_phone}`} variant="text" size="small" startIcon={<PhoneIcon fontSize="small" />} sx={{ display: 'flex', justifyContent: 'flex-start', px: 0 }}>{load.broker_phone}</Button>}
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
          {booking.status !== 'pending' && (
            <Card {...CARD_SX} sx={CARD_SX.sx}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AddCommentIcon fontSize="small" color="action" />
                  <Typography variant="subtitle1" fontWeight={600}>Check Call Log</Typography>
                  {checkCalls.length > 0 && <Chip label={checkCalls.length} size="small" />}
                </Box>
                {checkCalls.length === 0 ? <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No check calls yet.</Typography> : (
                  <Stack spacing={0} sx={{ mb: 2, maxHeight: 280, overflowY: 'auto' }}>
                    {checkCalls.map((call, idx) => (
                      <Box key={call.id}>
                        <Box sx={{ py: 1.5, display: 'flex', gap: 1.5 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: call.author_role === 'broker' ? 'primary.main' : 'secondary.main' }}>{(call.author_name || '?')[0].toUpperCase()}</Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}><Typography variant="caption" fontWeight={600}>{call.author_name}</Typography><Typography variant="caption" color="text.disabled">{new Date(call.created_at).toLocaleString()}</Typography></Box>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{call.note}</Typography>
                          </Box>
                        </Box>
                        {idx < checkCalls.length - 1 && <Divider />}
                      </Box>
                    ))}
                    <div ref={callsEndRef} />
                  </Stack>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField size="small" fullWidth placeholder="Add a check call note..." value={callNote} onChange={e => setCallNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCall(); } }} multiline maxRows={3} />
                  <Button variant="contained" onClick={handleAddCall} disabled={!callNote.trim() || addingCall} sx={{ minWidth: 80, alignSelf: 'flex-end' }}>{addingCall ? <CircularProgress size={16} color="inherit" /> : 'Add'}</Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );

  // ── Tab: Payments ─────────────────────────────────────────────────────────
  const PaymentsTab = (
    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
      <Card {...CARD_SX} sx={{ ...CARD_SX.sx, flex: 1 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Profit Breakdown</Typography>
          <Stack spacing={0}>
            {[{ label: 'Gross Rate', value: `+$${(load?.rate || 0).toLocaleString()}`, color: 'success.main' }, { label: `Fuel (~${load?.miles || 0} mi)`, value: `-$${load?.fuel_cost_est || 0}`, color: 'error.main' }, { label: `Deadhead (${load?.deadhead_miles || 0} mi)`, value: `-$${Math.round((load?.deadhead_miles || 0) * 0.62)}`, color: 'error.main' }, { label: 'Misc / tolls', value: '-$120', color: 'error.main' }].map(({ label, value, color }) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color }}>{value}</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
              <Typography variant="body1" fontWeight={700}>Est. Net Profit</Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: netProfit > 0 ? 'success.main' : 'error.main' }}>{netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      <Card {...CARD_SX} sx={{ ...CARD_SX.sx, flex: '0 0 320px' }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Payment Status</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: paymentStatus?.carrier_amount ? 1.5 : 0 }}>
            {paymentStatusChip(paymentStatus?.status)}
            {(!paymentStatus || paymentStatus.status === 'unpaid') && <Typography variant="caption" color="text.secondary">Awaiting broker payment</Typography>}
            {paymentStatus?.status === 'escrowed' && <Typography variant="caption" color="info.main">Funds held in escrow</Typography>}
            {paymentStatus?.status === 'released' && <Typography variant="caption" color="success.main">Payment released to you</Typography>}
          </Box>
          {paymentStatus?.carrier_amount && <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="caption" color="text.secondary">You receive</Typography><Typography variant="caption" fontWeight={700} color="success.main">${paymentStatus.carrier_amount?.toLocaleString()}</Typography></Box>}
          {paymentStatus?.released_at && <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>Released {new Date(paymentStatus.released_at).toLocaleDateString()}</Typography>}
          {paymentStatus?.escrowed_at && paymentStatus?.status === 'escrowed' && <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>Escrowed {new Date(paymentStatus.escrowed_at).toLocaleDateString()}</Typography>}
        </CardContent>
      </Card>
    </Box>
  );

  // ── Tab: Documents ────────────────────────────────────────────────────────
  const DocumentsTab = (
    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
      <Card {...CARD_SX} sx={{ ...CARD_SX.sx, flex: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <AddCommentIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>Documents</Typography>
          </Box>
          <DocumentPanel loadId={load?.id} bookingId={bookingId} />
        </CardContent>
      </Card>
      {canDownloadRateCon && (
        <Card {...CARD_SX} sx={{ ...CARD_SX.sx, flex: '0 0 360px' }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Rate Confirmation</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Sign or download the rate confirmation for this load.</Typography>
            <RateConSignature bookingId={bookingId} role="carrier" />
          </CardContent>
        </Card>
      )}
    </Box>
  );

  return (
    <Box>
      {activeTab === 'overview'  && OverviewTab}
      {activeTab === 'payments'  && PaymentsTab}
      {activeTab === 'documents' && DocumentsTab}
    </Box>
  );
}
