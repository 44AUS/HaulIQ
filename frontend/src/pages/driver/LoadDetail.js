import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Chip,
  CircularProgress, Stack, Alert, Stepper, Step, StepLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { driverApi } from '../../services/api';

const TMS_STEPS  = ['Dispatched', 'Picked Up', 'In Transit', 'Delivered'];
const TMS_VALUES = ['dispatched', 'picked_up', 'in_transit', 'delivered'];

const NEXT_ACTION = {
  null:       { label: 'Mark Dispatched', value: 'dispatched' },
  dispatched: { label: 'Mark Picked Up',  value: 'picked_up' },
  picked_up:  { label: 'Mark In Transit', value: 'in_transit' },
  in_transit: { label: 'Mark Delivered',  value: 'delivered' },
};

export default function DriverLoadDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetch_ = () => {
    driverApi.loadDetail(bookingId)
      .then(setBooking)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch_(); }, [bookingId]); // eslint-disable-line

  const handleAdvance = async () => {
    const action = NEXT_ACTION[booking.tms_status || null];
    if (!action) return;
    setUpdating(true);
    try {
      await driverApi.updateStatus(bookingId, action.value);
      fetch_();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  );
  if (error || !booking) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <WarningAmberIcon sx={{ fontSize: 40, color: 'error.main', mb: 1.5 }} />
      <Typography color="text.secondary">{error || 'Load not found.'}</Typography>
      <Button variant="text" onClick={() => navigate(-1)}>Go back</Button>
    </Box>
  );

  const load = booking.load || {};
  const tmsStep = TMS_VALUES.indexOf(booking.tms_status || '');
  const nextAction = NEXT_ACTION[booking.tms_status || null];
  const isDelivered = ['delivered', 'pod_received'].includes(booking.tms_status);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Button startIcon={<ArrowBackIcon />} variant="text" onClick={() => navigate('/driver/loads')} sx={{ alignSelf: 'flex-start' }}>
        Back to Loads
      </Button>

      {/* Header */}
      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight={700}>
            {load.origin} → {load.destination}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            {[load.commodity, load.miles ? `${load.miles.toLocaleString()} mi` : null, load.load_type].filter(Boolean).join(' · ')}
          </Typography>

          <Stepper activeStep={tmsStep} alternativeLabel sx={{ mb: 2 }}>
            {TMS_STEPS.map((label, idx) => (
              <Step key={label} completed={tmsStep > idx}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 11 } }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {isDelivered ? (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              <Typography variant="body2" fontWeight={600}>Load delivered</Typography>
              {booking.tms_status === 'pod_received' && (
                <Typography variant="caption">POD confirmed by carrier.</Typography>
              )}
            </Alert>
          ) : nextAction ? (
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleAdvance}
              disabled={updating}
              startIcon={updating ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ fontWeight: 700 }}
            >
              {updating ? 'Updating…' : nextAction.label}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* Instructions */}
      {booking.carrier_visible_notes && (
        <Alert severity="info">
          <Typography variant="body2" fontWeight={600} gutterBottom>Carrier instructions:</Typography>
          <Typography variant="body2">{booking.carrier_visible_notes}</Typography>
        </Alert>
      )}

      {/* Load details */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>Load Details</Typography>
          <Stack spacing={1.25}>
            {[
              ['Pickup',        load.pickup_address || load.origin  || '—'],
              ['Delivery',      load.delivery_address || load.destination || '—'],
              ['Pickup Date',   load.pickup_date   ? new Date(load.pickup_date).toLocaleDateString()   : '—'],
              ['Delivery Date', load.delivery_date ? new Date(load.delivery_date).toLocaleDateString() : '—'],
              ['Commodity',     load.commodity  || '—'],
              ['Equipment',     load.load_type  || '—'],
              ['Weight',        load.weight_lbs ? `${load.weight_lbs.toLocaleString()} lbs` : '—'],
              ['Miles',         load.miles      ? `${load.miles.toLocaleString()} mi`       : '—'],
            ].map(([k, v]) => (
              <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{k}</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', maxWidth: '60%' }}>{v}</Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Pay */}
      {booking.driver_pay && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Your Pay</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" fontWeight={800}>${booking.driver_pay.toLocaleString()}</Typography>
              <Chip
                label={booking.driver_pay_status}
                size="small"
                color={booking.driver_pay_status === 'paid' ? 'success' : booking.driver_pay_status === 'pending' ? 'warning' : 'default'}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      {(booking.dispatched_at || booking.picked_up_at || booking.delivered_at) && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Timestamps</Typography>
            <Stack spacing={1}>
              {[
                ['Dispatched', booking.dispatched_at],
                ['Picked Up',  booking.picked_up_at],
                ['In Transit', booking.in_transit_at],
                ['Delivered',  booking.delivered_at],
              ].filter(([, ts]) => ts).map(([label, ts]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={600}>{new Date(ts).toLocaleString()}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
