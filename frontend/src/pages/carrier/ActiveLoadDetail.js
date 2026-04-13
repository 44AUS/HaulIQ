import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  CircularProgress, Stack, Alert, TextField, Divider, Avatar,
  Stepper, Step, StepLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MessageIcon from '@mui/icons-material/Message';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NavigationIcon from '@mui/icons-material/Navigation';
import FlagIcon from '@mui/icons-material/Flag';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import AddCommentIcon from '@mui/icons-material/AddComment';
import { bookingsApi, bidsApi, freightPaymentsApi } from '../../services/api';
import RateConSignature from '../../components/shared/RateConSignature';

const RouteMap = lazy(() => import('../../components/shared/RouteMap'));

const STEP_MAP = { quoted: 0, booked: 1, in_transit: 2, delivered: 3 };
const STEPS = ['Quoted', 'Booked', 'In Transit', 'Delivered'];

const TMS_STEPS  = ['Dispatched', 'Picked Up', 'In Transit', 'Delivered', 'POD Received'];
const TMS_VALUES = ['dispatched', 'picked_up', 'in_transit', 'delivered', 'pod_received'];

function StatusTimeline({ status }) {
  const current = STEP_MAP[status] ?? 1;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {STEPS.map((step, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <Box key={step} sx={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : 'none' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: done || active ? 'primary.main' : 'action.disabledBackground',
                border: active ? '2px solid' : 'none',
                borderColor: 'primary.light',
                boxShadow: active ? '0 0 0 4px rgba(21,101,192,0.15)' : 'none',
              }}>
                {done && <CheckCircleIcon sx={{ color: 'white', fontSize: 18 }} />}
                {active && <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'white' }} />}
                {!done && !active && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.disabled' }} />}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  mt: 0.75, whiteSpace: 'nowrap',
                  fontWeight: active ? 700 : 400,
                  color: active ? 'primary.main' : done ? 'primary.light' : 'text.disabled',
                }}
              >
                {step}
              </Typography>
            </Box>
            {idx < STEPS.length - 1 && (
              <Box sx={{
                flex: 1, height: 1, mx: 1, mb: 2.5,
                bgcolor: done ? 'primary.main' : 'divider',
                borderTop: done ? 'none' : '1px dashed',
                borderColor: 'divider',
              }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function paymentStatusChip(status) {
  if (!status || status === 'unpaid') {
    return <Chip label="Unpaid" size="small" sx={{ bgcolor: 'action.disabledBackground', color: 'text.secondary' }} />;
  }
  const map = {
    pending:  { label: 'Payment Pending', color: 'default' },
    escrowed: { label: 'In Escrow',       color: 'info' },
    released: { label: 'Paid',            color: 'success' },
    failed:   { label: 'Payment Failed',  color: 'error' },
    refunded: { label: 'Refunded',        color: 'warning' },
  };
  const cfg = map[status] || { label: status, color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" variant="outlined" />;
}

export default function ActiveLoadDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [myBid, setMyBid]               = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkCalls, setCheckCalls]     = useState([]);
  const [callNote, setCallNote]         = useState('');
  const [addingCall, setAddingCall]     = useState(false);
  const callsEndRef = useRef(null);

  const load = booking?.load;

  const timelineStatus =
    booking?.status === 'pending'    ? 'quoted'     :
    booking?.status === 'in_transit' ? 'in_transit' :
    booking?.status === 'completed'  ? 'delivered'  :
    'booked';

  const tmsStep = booking?.tms_status ? TMS_VALUES.indexOf(booking.tms_status) : -1;

  useEffect(() => {
    bookingsApi.get(bookingId)
      .then(data => {
        setBooking(data);
        if (data?.load?.id) {
          bidsApi.my()
            .then(bids => setMyBid(bids.find(b => String(b.load_id) === String(data.load.id)) || null))
            .catch(() => {});
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    freightPaymentsApi.status(bookingId)
      .then(ps => setPaymentStatus(ps))
      .catch(() => {});

    bookingsApi.checkCalls(bookingId)
      .then(calls => setCheckCalls(calls))
      .catch(() => {});
  }, [bookingId]);

  useEffect(() => {
    callsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [checkCalls]);

  const handlePickup = async () => {
    setActionLoading(true);
    try {
      await bookingsApi.pickup(bookingId);
      setBooking(b => ({ ...b, status: 'in_transit' }));
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    setActionLoading(true);
    try {
      await bookingsApi.deliver(bookingId);
      setBooking(b => ({ ...b, status: 'completed' }));
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCall = async () => {
    if (!callNote.trim()) return;
    setAddingCall(true);
    try {
      await bookingsApi.addCheckCall(bookingId, callNote.trim());
      const calls = await bookingsApi.checkCalls(bookingId);
      setCheckCalls(calls);
      setCallNote('');
    } catch (e) {
      alert(e.message);
    } finally {
      setAddingCall(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );

  if (error || !booking) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <WarningAmberIcon sx={{ fontSize: 40, color: 'error.main', mb: 1.5 }} />
      <Typography color="text.secondary" gutterBottom>{error || 'Booking not found.'}</Typography>
      <Button variant="text" onClick={() => navigate(-1)}>Go back</Button>
    </Box>
  );

  const netProfit = load
    ? (load.rate || 0) - (load.fuel_cost_est || 0) - Math.round((load.deadhead_miles || 0) * 0.62) - 120
    : 0;

  const canDownloadRateCon = ['approved', 'in_transit', 'completed'].includes(booking.status);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon />}
        variant="text"
        onClick={() => navigate('/carrier/active')}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to Active Loads
      </Button>

      {/* Header */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Chip icon={<LocalShippingIcon />} label={load?.load_type?.replace('_', ' ') || 'Load'} size="small" color="primary" variant="outlined" />
                <Typography variant="caption" color="text.secondary">
                  Booking #{bookingId.slice(0, 8)}
                </Typography>
                {booking.tms_status && (
                  <Chip
                    label={TMS_STEPS[tmsStep] || booking.tms_status}
                    size="small"
                    color={booking.tms_status === 'pod_received' ? 'success' : booking.tms_status === 'delivered' ? 'success' : 'info'}
                    variant="filled"
                  />
                )}
              </Box>
              <Typography variant="h5" fontWeight={700}>
                {load?.origin} → {load?.destination}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {load?.commodity}
                {load?.weight_lbs ? ` · ${Number(load.weight_lbs).toLocaleString()} lbs` : ''}
                {load?.miles ? ` · ${load.miles} loaded miles` : ''}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {load?.broker_user_id && (
                <Button
                  component={Link}
                  to={`/carrier/messages?userId=${load.broker_user_id}`}
                  variant="outlined"
                  startIcon={<MessageIcon />}
                  size="small"
                >
                  Message Broker
                </Button>
              )}
            </Stack>
          </Box>

          <StatusTimeline status={timelineStatus} />

          {/* TMS milestone stepper — only when dispatched */}
          {booking.tms_status && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Dispatch Milestones
              </Typography>
              <Stepper activeStep={tmsStep} alternativeLabel>
                {TMS_STEPS.map(label => (
                  <Step key={label}>
                    <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 11 } }}>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          {/* Driver info — shown if broker set a driver */}
          {(booking.driver_name || booking.driver_phone) && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PersonIcon color="action" fontSize="small" />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Assigned Driver</Typography>
                <Typography variant="body2" fontWeight={600}>{booking.driver_name || '—'}</Typography>
                {booking.driver_phone && (
                  <Typography variant="caption" color="text.secondary">{booking.driver_phone}</Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Action buttons */}
          <Box sx={{ mt: 3 }}>
            {booking.status === 'approved' && (
              <Button
                onClick={handlePickup}
                disabled={actionLoading}
                variant="contained"
                fullWidth
                size="large"
                startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <NavigationIcon />}
              >
                Confirm Pickup — Mark as In Transit
              </Button>
            )}

            {booking.status === 'in_transit' && (
              <Button
                onClick={handleDeliver}
                disabled={actionLoading}
                variant="contained"
                color="success"
                fullWidth
                size="large"
                startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <FlagIcon />}
              >
                Confirm Delivery — Mark as Delivered
              </Button>
            )}

            {booking.status === 'completed' && (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                <Typography variant="body2" fontWeight={600}>Load Delivered</Typography>
                <Typography variant="caption">This load has been completed.</Typography>
              </Alert>
            )}

            {booking.status === 'pending' && (
              <Alert severity="warning" icon={<AccessTimeIcon />}>
                <Typography variant="body2" fontWeight={600}>Awaiting Broker Approval</Typography>
                <Typography variant="caption">The broker hasn't confirmed your booking request yet.</Typography>
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left — load details */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Route */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Route Details</Typography>
                <Stack spacing={2} sx={{ mb: 2 }}>
                  {[
                    { label: 'Pickup', value: load?.origin, sub: load?.pickup_date, color: 'primary.main' },
                    { label: 'Delivery', value: load?.destination, sub: load?.delivery_date, color: 'error.main' },
                  ].map(({ label, value, sub, color }) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: 1.5,
                        bgcolor: 'action.hover',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <LocationOnIcon sx={{ fontSize: 18, color }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={600}>{value}</Typography>
                        {sub && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarTodayIcon sx={{ fontSize: 10 }} color="action" />
                            <Typography variant="caption" color="text.disabled">{sub}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>

                <Grid container spacing={2} sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', mb: 2 }}>
                  {[
                    ['Loaded Miles', `${load?.miles || 0} mi`],
                    ['Deadhead', `${load?.deadhead_miles || 0} mi`],
                    ['Dimensions', load?.dimensions || '48x102'],
                  ].map(([k, v]) => (
                    <Grid item xs={4} key={k}>
                      <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block">{k}</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{v}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {load?.origin && load?.destination && (
                  <Suspense fallback={
                    <Box sx={{ height: 224, bgcolor: 'action.hover', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress size={24} />
                    </Box>
                  }>
                    <RouteMap origin={load.origin} dest={load.destination} miles={load.miles} />
                  </Suspense>
                )}
              </CardContent>
            </Card>

            {/* Profit breakdown */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Profit Breakdown</Typography>
                <Stack spacing={0}>
                  {[
                    { label: 'Gross Rate', value: `+$${(load?.rate || 0).toLocaleString()}`, color: 'success.main' },
                    { label: `Fuel (~${load?.miles || 0} mi)`, value: `-$${load?.fuel_cost_est || 0}`, color: 'error.main' },
                    { label: `Deadhead (${load?.deadhead_miles || 0} mi)`, value: `-$${Math.round((load?.deadhead_miles || 0) * 0.62)}`, color: 'error.main' },
                    { label: 'Misc / tolls', value: '-$120', color: 'error.main' },
                  ].map(({ label, value, color }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color }}>{value}</Typography>
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
                    <Typography variant="body1" fontWeight={700}>Est. Net Profit</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: netProfit > 0 ? 'success.main' : 'error.main' }}>
                      {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Notes */}
            {(booking.note || booking.broker_note || load?.notes || booking.carrier_visible_notes) && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Notes</Typography>
                  <Stack spacing={2}>
                    {load?.notes && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Load Instructions</Typography>
                        <Typography variant="body2">{load.notes}</Typography>
                      </Box>
                    )}
                    {booking.carrier_visible_notes && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Dispatch Notes</Typography>
                        <Typography variant="body2">{booking.carrier_visible_notes}</Typography>
                      </Box>
                    )}
                    {booking.note && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Your Note</Typography>
                        <Typography variant="body2">{booking.note}</Typography>
                      </Box>
                    )}
                    {booking.broker_note && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Broker Note</Typography>
                        <Typography variant="body2">{booking.broker_note}</Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Check Call Log */}
            {booking.status !== 'pending' && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AddCommentIcon fontSize="small" color="action" />
                    <Typography variant="subtitle1" fontWeight={600}>Check Call Log</Typography>
                    {checkCalls.length > 0 && (
                      <Chip label={checkCalls.length} size="small" />
                    )}
                  </Box>

                  {checkCalls.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      No check calls yet. Add a note to log transit updates.
                    </Typography>
                  ) : (
                    <Stack spacing={0} sx={{ mb: 2, maxHeight: 280, overflowY: 'auto' }}>
                      {checkCalls.map((call, idx) => (
                        <Box key={call.id}>
                          <Box sx={{ py: 1.5, display: 'flex', gap: 1.5 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: call.author_role === 'broker' ? 'primary.main' : 'secondary.main' }}>
                              {(call.author_name || '?')[0].toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                                <Typography variant="caption" fontWeight={600}>{call.author_name}</Typography>
                                <Typography variant="caption" color="text.disabled">
                                  {new Date(call.created_at).toLocaleString()}
                                </Typography>
                              </Box>
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
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Add a check call note..."
                      value={callNote}
                      onChange={e => setCallNote(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCall(); } }}
                      multiline
                      maxRows={3}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddCall}
                      disabled={!callNote.trim() || addingCall}
                      sx={{ minWidth: 80, alignSelf: 'flex-end' }}
                    >
                      {addingCall ? <CircularProgress size={16} color="inherit" /> : 'Add'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>

        {/* Right — broker + stats */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Rate summary */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Rate Summary</Typography>
                <Stack spacing={1.5}>
                  {[
                    { label: 'Agreed Rate', value: `$${(load?.rate || 0).toLocaleString()}`, color: 'primary.main' },
                    { label: 'Per Mile', value: `$${(load?.rate_per_mile || 0).toFixed(2)}` },
                    { label: 'Commodity', value: load?.commodity || '—' },
                    { label: 'Weight', value: load?.weight_lbs ? `${Number(load.weight_lbs).toLocaleString()} lbs` : '—' },
                  ].map(({ label, value, color }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600} sx={color ? { color } : {}}>{value}</Typography>
                    </Box>
                  ))}
                </Stack>
                {canDownloadRateCon && (
                  <Box sx={{ mt: 1.5 }}>
                    <RateConSignature bookingId={bookingId} role="carrier" />
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Payment status */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Payment Status</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: paymentStatus?.carrier_amount ? 1.5 : 0 }}>
                  {paymentStatusChip(paymentStatus?.status)}
                  {(!paymentStatus || paymentStatus.status === 'unpaid') && (
                    <Typography variant="caption" color="text.secondary">Awaiting broker payment</Typography>
                  )}
                  {paymentStatus?.status === 'escrowed' && (
                    <Typography variant="caption" color="info.main">Funds held in escrow</Typography>
                  )}
                  {paymentStatus?.status === 'released' && (
                    <Typography variant="caption" color="success.main">Payment released to you</Typography>
                  )}
                </Box>
                {paymentStatus?.carrier_amount && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">You receive</Typography>
                    <Typography variant="caption" fontWeight={700} color="success.main">
                      ${paymentStatus.carrier_amount?.toLocaleString()}
                    </Typography>
                  </Box>
                )}
                {paymentStatus?.released_at && (
                  <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                    Released {new Date(paymentStatus.released_at).toLocaleDateString()}
                  </Typography>
                )}
                {paymentStatus?.escrowed_at && paymentStatus?.status === 'escrowed' && (
                  <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                    Escrowed {new Date(paymentStatus.escrowed_at).toLocaleDateString()}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Broker info */}
            {load?.broker_name && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Broker</Typography>
                  <Typography variant="body2" fontWeight={600} gutterBottom>{load.broker_name}</Typography>
                  {load.broker_mc && (
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      MC# {load.broker_mc}
                    </Typography>
                  )}
                  {load.broker_email && (
                    <Button
                      component="a"
                      href={`mailto:${load.broker_email}`}
                      variant="text"
                      size="small"
                      startIcon={<EmailIcon fontSize="small" />}
                      sx={{ display: 'flex', justifyContent: 'flex-start', px: 0, mt: 1 }}
                    >
                      {load.broker_email}
                    </Button>
                  )}
                  {load.broker_phone && (
                    <Button
                      component="a"
                      href={`tel:${load.broker_phone}`}
                      variant="text"
                      size="small"
                      startIcon={<PhoneIcon fontSize="small" />}
                      sx={{ display: 'flex', justifyContent: 'flex-start', px: 0 }}
                    >
                      {load.broker_phone}
                    </Button>
                  )}
                  {load.broker_user_id && (
                    <Button
                      component={Link}
                      to={`/carrier/messages?userId=${load.broker_user_id}`}
                      variant="outlined"
                      fullWidth
                      startIcon={<MessageIcon />}
                      endIcon={<ChevronRightIcon />}
                      size="small"
                      sx={{ mt: 1.5 }}
                    >
                      Open Messages
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Bid status */}
            {myBid && (
              <Card variant="outlined" sx={{
                borderColor:
                  myBid.status === 'accepted' ? 'success.main' :
                  myBid.status === 'countered' ? 'info.main' :
                  myBid.status === 'rejected' ? 'error.main' : 'warning.main'
              }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Your Bid</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Chip
                      label={
                        myBid.status === 'accepted' ? 'Accepted' :
                        myBid.status === 'countered' ? 'Countered' :
                        myBid.status === 'rejected' ? 'Rejected' : 'Pending'
                      }
                      size="small"
                      color={
                        myBid.status === 'accepted' ? 'success' :
                        myBid.status === 'countered' ? 'info' :
                        myBid.status === 'rejected' ? 'error' : 'warning'
                      }
                    />
                    <Typography variant="body2" fontWeight={700}>${myBid.amount?.toLocaleString()}</Typography>
                  </Box>
                  {myBid.status === 'countered' && myBid.counter_amount && (
                    <Box sx={{ bgcolor: 'rgba(2,136,209,0.08)', borderRadius: 1, p: 1.5 }}>
                      <Typography variant="caption" color="info.main" display="block" gutterBottom>Broker counter offer</Typography>
                      <Typography variant="body2" fontWeight={700}>${myBid.counter_amount.toLocaleString()}</Typography>
                      {myBid.counter_note && (
                        <Typography variant="caption" color="text.secondary">"{myBid.counter_note}"</Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick actions */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Quick Actions</Typography>
                <Stack spacing={1.5}>
                  <Button
                    component={Link}
                    to="/carrier/loads"
                    variant="outlined"
                    fullWidth
                    startIcon={<InventoryIcon />}
                  >
                    Browse More Loads
                  </Button>
                  <Button
                    component={Link}
                    to="/carrier/active"
                    variant="outlined"
                    fullWidth
                    startIcon={<AttachMoneyIcon />}
                  >
                    All Active Loads
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
