import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { loadsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import { getDrivingMilesByCoords, getDrivingMiles } from '../../services/routing';
import {
  Box, Typography, Button, Card, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Grid, Alert,
  CircularProgress, ToggleButtonGroup, ToggleButton, InputAdornment,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import InventoryIcon from '@mui/icons-material/Inventory';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

const STATUS_OPTS = ['all', 'active', 'filled', 'expired'];
const EQUIPMENT = ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Lowboy', 'Tanker', 'Box Truck'];
const DIMS = ['48x102', '53x102', '40x96', '28x102'];

function statusChip(status) {
  if (status === 'active') return <Chip label="Active" size="small" color="success" />;
  if (status === 'filled') return <Chip label="Filled" size="small" color="info" />;
  return <Chip label="Expired" size="small" color="error" />;
}

function EditModal({ load, onClose, onSaved }) {
  const raw = load._raw;
  const [form, setForm] = useState({
    originCity:      raw.origin || '',
    destCity:        raw.destination || '',
    pickupAddress:   raw.pickup_address || '',
    deliveryAddress: raw.delivery_address || '',
    pickupLat:       raw.pickup_lat || null,
    pickupLng:       raw.pickup_lng || null,
    deliveryLat:     raw.delivery_lat || null,
    deliveryLng:     raw.delivery_lng || null,
    miles:           raw.miles || '',
    deadhead:        raw.deadhead_miles || '',
    pickup:          raw.pickup_date || '',
    delivery:        raw.delivery_date || '',
    equipment:       raw.load_type || 'Dry Van',
    weight:          raw.weight_lbs || '',
    commodity:       raw.commodity || '',
    dims:            raw.dimensions || '48x102',
    rate:            raw.rate || '',
    notes:           raw.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [calcingMiles, setCalcingMiles] = useState(false);
  const milesTimer = useRef(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
      originCity:    cityState || address || f.originCity,
      pickupLat:     lat ?? null,
      pickupLng:     lng ?? null,
    }));
  };

  const handleDelivery = ({ address, cityState, lat, lng }) => {
    setForm(f => ({
      ...f,
      deliveryAddress: address || f.deliveryAddress,
      destCity:        cityState || address || f.destCity,
      deliveryLat:     lat ?? null,
      deliveryLng:     lng ?? null,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    loadsApi.update(raw.id, {
      origin:           form.originCity,
      destination:      form.destCity,
      miles:            parseInt(form.miles) || undefined,
      deadhead_miles:   parseInt(form.deadhead) || 0,
      load_type:        form.equipment,
      weight_lbs:       form.weight ? parseInt(form.weight) : null,
      commodity:        form.commodity || null,
      dimensions:       form.dims,
      pickup_date:      form.pickup || undefined,
      delivery_date:    form.delivery || undefined,
      rate:             parseFloat(form.rate) || undefined,
      notes:            form.notes || null,
      pickup_address:   form.pickupAddress || null,
      delivery_address: form.deliveryAddress || null,
      pickup_lat:       form.pickupLat || null,
      pickup_lng:       form.pickupLng || null,
      delivery_lat:     form.deliveryLat || null,
      delivery_lng:     form.deliveryLng || null,
    })
      .then(() => { onSaved(); onClose(); })
      .catch(err => { setError(err.message); setSaving(false); });
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Edit Load
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSave}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <AddressAutocomplete
                label="Pickup Address *"
                value={form.pickupAddress || form.originCity}
                onChange={handlePickup}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <AddressAutocomplete
                label="Delivery Address *"
                value={form.deliveryAddress || form.destCity}
                onChange={handleDelivery}
                required
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Loaded Miles" required type="number"
                value={form.miles} onChange={e => set('miles', e.target.value)}
                InputProps={{ endAdornment: calcingMiles ? <InputAdornment position="end"><CircularProgress size={14} /></InputAdornment> : null }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Deadhead Miles" type="number"
                value={form.deadhead} onChange={e => set('deadhead', e.target.value)} />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Pickup Date" required type="date"
                value={form.pickup} onChange={e => set('pickup', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Delivery Date" required type="date"
                value={form.delivery} onChange={e => set('delivery', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>

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
                value={form.weight} onChange={e => set('weight', e.target.value)} />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Commodity"
                value={form.commodity} onChange={e => set('commodity', e.target.value)} />
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

          <TextField fullWidth size="small" label="Rate (All-In) $" required type="number"
            value={form.rate} onChange={e => set('rate', e.target.value)} />

          <TextField fullWidth size="small" label="Notes" multiline rows={3}
            value={form.notes} onChange={e => set('notes', e.target.value)} />

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default function ManageLoads() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [editingLoad, setEditingLoad] = useState(null);

  const fetchLoads = useCallback(() => {
    setLoading(true);
    loadsApi.posted()
      .then(res => {
        const adapted = adaptLoadList(res);
        setLoads(adapted.map(l => ({ ...l, status: l.status === 'removed' ? 'expired' : l.status })));
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const handleDelete = (load) => {
    loadsApi.delete(load._raw.id)
      .then(() => fetchLoads())
      .catch(err => alert(err.message));
  };

  const filtered = filter === 'all' ? loads : loads.filter(l => l.status === filter);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InventoryIcon color="primary" /> Manage Loads
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {loads.filter(l => l.status === 'active').length} active loads
          </Typography>
        </Box>
        <Button component={Link} to="/broker/post" variant="contained" startIcon={<AddCircleOutlineIcon />}>
          Post New Load
        </Button>
      </Box>

      {/* Filter chips */}
      <Box>
        <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small">
          {STATUS_OPTS.map(s => (
            <ToggleButton key={s} value={s} sx={{ textTransform: 'capitalize', px: 2 }}>
              {s}{s !== 'all' && ` (${loads.filter(l => l.status === s).length})`}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  {['Route', 'Type', 'Rate', 'Pickup', 'Views', 'Bids', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No loads found
                    </TableCell>
                  </TableRow>
                ) : filtered.map((load, idx) => (
                  <TableRow key={load.id} sx={{ bgcolor: idx % 2 === 1 ? 'action.hover' : 'inherit' }}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography
                        component={Link}
                        to={`/broker/loads/${load._raw.id}`}
                        state={{ from: 'Manage Loads' }}
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {load.origin} → {load.dest}
                        <Box component="span" sx={{ ml: 1, fontSize: '0.65rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.05em' }}>
                          {String(load._raw.id).slice(0, 8).toUpperCase()}
                        </Box>
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{load.type}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>${(load.rate || 0).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{load.pickup}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <VisibilityIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{load.viewCount || 0}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <GroupIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">—</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{statusChip(load.status)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {load.status === 'active' && (
                          <IconButton size="small" onClick={() => setEditingLoad(load)} title="Edit load">
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                        <IconButton size="small" onClick={() => handleDelete(load)} color="error">
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}

      {editingLoad && (
        <EditModal
          load={editingLoad}
          onClose={() => setEditingLoad(null)}
          onSaved={fetchLoads}
        />
      )}
    </Box>
  );
}
