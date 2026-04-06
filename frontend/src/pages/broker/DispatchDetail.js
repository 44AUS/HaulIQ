import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  CircularProgress, Stack, Alert, TextField, Divider, Avatar,
  Stepper, Step, StepLabel, StepButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SaveIcon from '@mui/icons-material/Save';
import AddCommentIcon from '@mui/icons-material/AddComment';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { bookingsApi, rateConfirmationApi } from '../../services/api';

const TMS_STEPS  = ['Dispatched', 'Picked Up', 'In Transit', 'Delivered', 'POD Received'];
const TMS_VALUES = ['dispatched', 'picked_up', 'in_transit', 'delivered', 'pod_received'];

// Only brokers can mark POD; everything else is driven by the carrier
const BROKER_SETTABLE = ['pod_received'];

export default function DispatchDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [checkCalls, setCheckCalls] = useState([]);
  const [callNote, setCallNote] = useState('');
  const [addingCall, setAddingCall] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [markingPOD, setMarkingPOD] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    driver_name: '', driver_phone: '', carrier_visible_notes: '', dispatch_notes: '',
  });
  const callsEndRef = useRef(null);

  const load = booking?.load;
  const tmsStep = booking?.tms_status ? TMS_VALUES.indexOf(booking.tms_status) : -1;

  const fetchAll = async () => {
    try {
      const [bk, calls] = await Promise.all([
        bookingsApi.get(bookingId),
        bookingsApi.checkCalls(bookingId),
      ]);
      setBooking(bk);
      setCheckCalls(calls);
      setDispatchForm({
        driver_name:           bk.driver_name           || '',
        driver_phone:          bk.driver_phone          || '',
        carrier_visible_notes: bk.carrier_visible_notes || '',
        dispatch_notes:        bk.dispatch_notes        || '',
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [bookingId]); // eslint-disable-line

  useEffect(() => {
    callsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [checkCalls]);

  const handleSaveDispatch = async () => {
    setSaving(true);
    try {
      await bookingsApi.dispatch(bookingId, dispatchForm);
      const bk = await bookingsApi.get(bookingId);
      setBooking(bk);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPOD = async () => {
    setMarkingPOD(true);
    try {
      await bookingsApi.tmsStatus(bookingId, 'pod_received');
      setBooking(b => ({ ...b, tms_status: 'pod_received' }));
    } catch (e) {
      alert(e.message);
    } finally {
      setMarkingPOD(false);
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

  const handleRateCon = async () => {
    setPdfLoading(true);
    try {
      await rateConfirmationApi.download(bookingId);
    } catch (e) {
      alert(e.message);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  );

  if (error || !booking) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <WarningAmberIcon sx={{ fontSize: 40, color: 'error.main', mb: 1.5 }} />
      <Typography color="text.secondary" gutterBottom>{error || 'Booking not found.'}</Typography>
      <Button variant="text" onClick={() => navigate(-1)}>Go back</Button>
    </Box>
  );

  const canDownloadRateCon = ['approved', 'in_transit', 'completed'].includes(booking.status);
  const set = (field) => (e) => setDispatchForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon />}
        variant="text"
        onClick={() => navigate('/broker/active')}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to Loads in Progress
      </Button>

      {/* Header */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {load?.origin} → {load?.destination}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Booking #{bookingId.slice(0, 8)}
                {booking.carrier_name ? ` · ${booking.carrier_name}` : ''}
                {load?.rate ? ` · $${load.rate.toLocaleString()}` : ''}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {canDownloadRateCon && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={pdfLoading ? <CircularProgress size={14} /> : <PictureAsPdfIcon />}
                  onClick={handleRateCon}
                  disabled={pdfLoading}
                >
                  Rate Confirmation
                </Button>
              )}
            </Stack>
          </Box>

          {/* TMS Stepper */}
          <Stepper activeStep={tmsStep} alternativeLabel sx={{ mb: 2 }}>
            {TMS_STEPS.map((label, idx) => (
              <Step key={label} completed={tmsStep > idx}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 11 } }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* POD action */}
          {booking.tms_status === 'delivered' && (
            <Button
              variant="contained"
              color="success"
              fullWidth
              startIcon={markingPOD ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
              onClick={handleMarkPOD}
              disabled={markingPOD}
            >
              Mark POD Received — Close Out Load
            </Button>
          )}
          {booking.tms_status === 'pod_received' && (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              <Typography variant="body2" fontWeight={600}>POD Received</Typography>
              <Typography variant="caption">Load fully closed out.</Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left — dispatch form + check calls */}
        <Grid item xs={12} lg={7}>
          <Stack spacing={3}>
            {/* Dispatch Details */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Dispatch Details</Typography>

                <Stack spacing={2}>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Driver Name"
                      value={dispatchForm.driver_name}
                      onChange={set('driver_name')}
                      size="small"
                      fullWidth
                      placeholder="Jane Smith"
                    />
                    <TextField
                      label="Driver Phone"
                      value={dispatchForm.driver_phone}
                      onChange={set('driver_phone')}
                      size="small"
                      fullWidth
                      placeholder="(555) 000-0000"
                    />
                  </Stack>

                  <TextField
                    label="Notes for Carrier"
                    value={dispatchForm.carrier_visible_notes}
                    onChange={set('carrier_visible_notes')}
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Gate code, dock instructions, appointment time..."
                    helperText="Visible to the carrier"
                  />

                  <TextField
                    label="Internal Dispatch Notes"
                    value={dispatchForm.dispatch_notes}
                    onChange={set('dispatch_notes')}
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Internal notes — not visible to the carrier"
                    helperText="Only visible to your team"
                  />
                </Stack>

                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveDispatch}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : booking.tms_status ? 'Update Dispatch' : 'Dispatch Load'}
                </Button>
              </CardContent>
            </Card>

            {/* Check Call Log */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AddCommentIcon fontSize="small" color="action" />
                  <Typography variant="subtitle1" fontWeight={600}>Check Call Log</Typography>
                  {checkCalls.length > 0 && <Chip label={checkCalls.length} size="small" />}
                </Box>

                {checkCalls.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No check calls yet.
                  </Typography>
                ) : (
                  <Stack spacing={0} sx={{ mb: 2, maxHeight: 320, overflowY: 'auto' }}>
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
          </Stack>
        </Grid>

        {/* Right — load + carrier summary */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={3}>
            {/* Load summary */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Load Summary</Typography>
                <Stack spacing={1.5}>
                  {[
                    ['Pickup',       load?.origin || '—'],
                    ['Delivery',     load?.destination || '—'],
                    ['Pickup Date',  load?.pickup_date ? new Date(load.pickup_date).toLocaleDateString() : '—'],
                    ['Delivery Date',load?.delivery_date ? new Date(load.delivery_date).toLocaleDateString() : '—'],
                    ['Miles',        load?.miles ? `${load.miles.toLocaleString()} mi` : '—'],
                    ['Equipment',    load?.load_type || '—'],
                    ['Rate',         load?.rate ? `$${load.rate.toLocaleString()}` : '—'],
                    ['Commodity',    load?.commodity || '—'],
                  ].map(([k, v]) => (
                    <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{k}</Typography>
                      <Typography variant="body2" fontWeight={600}>{v}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Carrier */}
            {booking.carrier_name && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" fontWeight={600}>Carrier</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>{booking.carrier_name}</Typography>
                  {booking.tms_status && (
                    <Chip
                      label={booking.tms_status.replace('_', ' ')}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Milestone timestamps */}
            {(booking.dispatched_at || booking.picked_up_at || booking.delivered_at || booking.pod_received_at) && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Milestone Timestamps</Typography>
                  <Stack spacing={1}>
                    {[
                      ['Dispatched',    booking.dispatched_at],
                      ['Picked Up',     booking.picked_up_at],
                      ['Delivered',     booking.delivered_at],
                      ['POD Received',  booking.pod_received_at],
                    ].filter(([, ts]) => ts).map(([label, ts]) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {new Date(ts).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
