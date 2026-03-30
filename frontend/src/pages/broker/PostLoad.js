import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadsApi } from '../../services/api';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import { getDrivingMilesByCoords, getDrivingMiles } from '../../services/routing';
import {
  Box, Typography, Button, Paper, Grid, TextField, FormControl,
  InputLabel, Select, MenuItem, InputAdornment, CircularProgress, Alert,
  FormControlLabel, Switch,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BoltIcon from '@mui/icons-material/Bolt';

const EQUIPMENT = ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Lowboy', 'Tanker', 'Box Truck'];
const DIMS = ['48x102', '53x102', '40x96', '28x102'];

export default function PostLoad() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    // City/state display values (for origin/destination fields)
    originCity: '', destCity: '',
    // Full addresses + coords
    pickupAddress: '', deliveryAddress: '',
    pickupLat: null, pickupLng: null,
    deliveryLat: null, deliveryLng: null,
    // Rest of form
    pickup: '', delivery: '',
    equipment: 'Dry Van', weight: '', dims: '48x102',
    commodity: '', rate: '', miles: '', deadhead: '', notes: '',
    instantBook: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [posted, setPosted] = useState(false);
  const [calcingMiles, setCalcingMiles] = useState(false);
  const milesTimer = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-calculate miles when both addresses are set
  useEffect(() => {
    clearTimeout(milesTimer.current);
    const { pickupLat, pickupLng, deliveryLat, deliveryLng, originCity, destCity } = form;
    const hasCoords = pickupLat && pickupLng && deliveryLat && deliveryLng;
    const hasCities = originCity?.includes(',') && destCity?.includes(',');
    if (!hasCoords && !hasCities) return;

    milesTimer.current = setTimeout(() => {
      setCalcingMiles(true);
      const promise = hasCoords
        ? getDrivingMilesByCoords(pickupLat, pickupLng, deliveryLat, deliveryLng)
        : getDrivingMiles(originCity, destCity);
      promise
        .then(miles => { if (miles) set('miles', String(miles)); })
        .finally(() => setCalcingMiles(false));
    }, 600);
    return () => clearTimeout(milesTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pickupLat, form.pickupLng, form.deliveryLat, form.deliveryLng, form.originCity, form.destCity]);

  const handlePickup = ({ address, cityState, lat, lng }) => {
    setForm(f => ({
      ...f,
      pickupAddress: address || f.pickupAddress,
      originCity: cityState || address || f.originCity,
      pickupLat: lat ?? null,
      pickupLng: lng ?? null,
    }));
  };

  const handleDelivery = ({ address, cityState, lat, lng }) => {
    setForm(f => ({
      ...f,
      deliveryAddress: address || f.deliveryAddress,
      destCity: cityState || address || f.destCity,
      deliveryLat: lat ?? null,
      deliveryLng: lng ?? null,
    }));
  };

  const handlePost = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    loadsApi.post({
      origin:           form.originCity,
      destination:      form.destCity,
      origin_state:     form.originCity.split(', ')[1] || null,
      dest_state:       form.destCity.split(', ')[1] || null,
      miles:            parseInt(form.miles) || 0,
      deadhead_miles:   parseInt(form.deadhead) || 0,
      load_type:        form.equipment,
      weight_lbs:       form.weight ? parseInt(form.weight) : null,
      commodity:        form.commodity || null,
      pickup_date:      form.pickup,
      delivery_date:    form.delivery,
      rate:             parseFloat(form.rate),
      notes:            form.notes || null,
      pickup_address:   form.pickupAddress || null,
      delivery_address: form.deliveryAddress || null,
      pickup_lat:       form.pickupLat || null,
      pickup_lng:       form.pickupLng || null,
      delivery_lat:     form.deliveryLat || null,
      delivery_lng:     form.deliveryLng || null,
      instant_book:     form.instantBook,
    })
      .then(() => setPosted(true))
      .catch(err => { setError(err.message); setSubmitting(false); });
  };

  if (posted) return (
    <Box sx={{ maxWidth: 480, mx: 'auto', textAlign: 'center', py: 10 }}>
      <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Load Posted!</Typography>
      <Typography variant="body2" color="text.secondary">
        Your load is now live on the board. Carriers will see it immediately.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
        <Button variant="outlined" onClick={() => {
          setPosted(false);
          setForm({
            originCity: '', destCity: '', pickupAddress: '', deliveryAddress: '',
            pickupLat: null, pickupLng: null, deliveryLat: null, deliveryLng: null,
            pickup: '', delivery: '', equipment: 'Dry Van', weight: '', dims: '48x102',
            commodity: '', rate: '', miles: '', deadhead: '', notes: '',
            instantBook: false,
          });
        }}>
          Post Another
        </Button>
        <Button variant="contained" onClick={() => navigate('/broker/loads')}>
          View Loads
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddCircleOutlineIcon color="primary" /> Post a Load
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Fill out the details and your load will be live instantly
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box component="form" onSubmit={handlePost} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Pickup / Delivery full addresses */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <AddressAutocomplete
                label="Pickup Address *"
                placeholder="123 Main St, Chicago, IL"
                value={form.pickupAddress}
                onChange={handlePickup}
                required
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Full address — hidden from carriers until booked
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <AddressAutocomplete
                label="Delivery Address *"
                placeholder="456 Oak Ave, Atlanta, GA"
                value={form.deliveryAddress}
                onChange={handleDelivery}
                required
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Full address — hidden from carriers until booked
              </Typography>
            </Grid>
          </Grid>

          {/* Miles */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Loaded Miles" required
                type="number" value={form.miles}
                onChange={e => set('miles', e.target.value)}
                placeholder={calcingMiles ? 'Calculating…' : '716'}
                InputProps={{
                  endAdornment: calcingMiles ? (
                    <InputAdornment position="end"><CircularProgress size={14} /></InputAdornment>
                  ) : null,
                }}
                helperText={form.miles && !calcingMiles ? 'Auto-calculated · edit if needed' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Deadhead Miles" type="number"
                value={form.deadhead} onChange={e => set('deadhead', e.target.value)} placeholder="0" />
            </Grid>
          </Grid>

          {/* Dates */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Pickup Date" required
                type="date" value={form.pickup} onChange={e => set('pickup', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Delivery Date" required
                type="date" value={form.delivery} onChange={e => set('delivery', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>

          {/* Equipment */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Equipment Type</InputLabel>
                <Select value={form.equipment} label="Equipment Type" onChange={e => set('equipment', e.target.value)}>
                  {EQUIPMENT.map(eq => <MenuItem key={eq} value={eq}>{eq}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Weight (lbs)" type="number"
                value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="42000" />
            </Grid>
          </Grid>

          {/* Commodity + Dims */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Commodity"
                value={form.commodity} onChange={e => set('commodity', e.target.value)} placeholder="General Freight" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Dimensions</InputLabel>
                <Select value={form.dims} label="Dimensions" onChange={e => set('dims', e.target.value)}>
                  {DIMS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Rate */}
          <Box>
            <TextField
              fullWidth size="small" label="Rate (All-In)" required
              type="number" value={form.rate} onChange={e => set('rate', e.target.value)}
              placeholder="2500"
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              helperText={
                form.rate
                  ? `Market context: avg for similar loads is ~$2.80–3.20/mi${parseFloat(form.rate) < 1500 ? ' — May appear in "Worst Loads" feed' : ''}`
                  : ''
              }
              FormHelperTextProps={{ sx: { color: parseFloat(form.rate) < 1500 ? 'warning.main' : 'text.secondary' } }}
            />
          </Box>

          {/* Instant Book */}
          <Box sx={{ border: '1px solid', borderColor: form.instantBook ? 'success.main' : 'divider', borderRadius: 2, p: 2 }}>
            <FormControlLabel
              control={<Switch checked={form.instantBook} onChange={e => set('instantBook', e.target.checked)} color="success" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <BoltIcon fontSize="small" sx={{ color: form.instantBook ? 'success.main' : 'text.disabled' }} />
                  <Typography variant="body2" fontWeight={600}>Enable Instant Book</Typography>
                </Box>
              }
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, ml: 4.5 }}>
              Carriers on your Instant Book allowlist can book this load immediately without approval.
            </Typography>
          </Box>

          {/* Notes */}
          <TextField fullWidth size="small" label="Special Instructions" multiline rows={3}
            value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Any special requirements, hazmat info, contact details..." />

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
            endIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon />}
            sx={{ py: 1.5 }}
          >
            {submitting ? 'Posting...' : 'Post Load Live'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
