import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Grid, TextField, FormControl,
  InputLabel, Select, MenuItem, Switch, FormControlLabel, Chip,
  IconButton, Alert, CircularProgress, Divider, InputAdornment,
} from '@mui/material';
import { laneWatchesApi, equipmentTypesApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';


const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

const EMPTY_FORM = {
  origin_city: '', origin_state: '',
  dest_city: '',   dest_state: '',
  equipment_type: '', min_rate: '', min_rpm: '',
};

export default function LaneWatches() {
  const [watches, setWatches] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    Promise.all([laneWatchesApi.list(), equipmentTypesApi.list()])
      .then(([w, eq]) => {
        setWatches(Array.isArray(w) ? w : []);
        setEquipmentTypes(Array.isArray(eq) ? eq : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = () => {
    setSaving(true);
    setError(null);
    const payload = {
      origin_city:    form.origin_city.trim() || null,
      origin_state:   form.origin_state || null,
      dest_city:      form.dest_city.trim() || null,
      dest_state:     form.dest_state || null,
      equipment_type: form.equipment_type || null,
      min_rate:       form.min_rate ? parseFloat(form.min_rate) : null,
      min_rpm:        form.min_rpm  ? parseFloat(form.min_rpm)  : null,
    };
    laneWatchesApi.create(payload)
      .then(w => {
        setWatches(prev => [w, ...prev]);
        setShowForm(false);
        setForm(EMPTY_FORM);
      })
      .catch(err => setError(err.message))
      .finally(() => setSaving(false));
  };

  const handleToggle = (id, active) => {
    laneWatchesApi.update(id, { active })
      .then(updated => setWatches(prev => prev.map(w => w.id === id ? updated : w)))
      .catch(() => {});
  };

  const handleDelete = (id) => {
    laneWatchesApi.delete(id)
      .then(() => setWatches(prev => prev.filter(w => w.id !== id)))
      .catch(() => {});
  };

  const laneLabel = (w) => {
    const from = [w.origin_city, w.origin_state].filter(Boolean).join(', ') || 'Anywhere';
    const to   = [w.dest_city,   w.dest_state  ].filter(Boolean).join(', ') || 'Anywhere';
    return `${from} → ${to}`;
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IonIcon name="bookmark" color="primary" /> Lane Watchlist
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Get notified instantly when matching loads are posted.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<IonIcon name="add-outline" />} onClick={() => setShowForm(v => !v)} size="small">
          Add Watch
        </Button>
      </Box>

      {showForm && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>New Lane Watch</Typography>
          <Grid container spacing={2}>

            {/* Origin row */}
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Origin
              </Typography>
            </Grid>
            <Grid item xs={12} sm={7}>
              <TextField
                fullWidth size="small" label="Origin City"
                value={form.origin_city} onChange={e => set('origin_city', e.target.value)}
                placeholder="e.g. Chicago"
                helperText="Leave blank to match any city"
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth size="small">
                <InputLabel>Origin State</InputLabel>
                <Select value={form.origin_state} label="Origin State" onChange={e => set('origin_state', e.target.value)}>
                  <MenuItem value=""><em>Any</em></MenuItem>
                  {US_STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {/* Destination row */}
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Destination
              </Typography>
            </Grid>
            <Grid item xs={12} sm={7}>
              <TextField
                fullWidth size="small" label="Destination City"
                value={form.dest_city} onChange={e => set('dest_city', e.target.value)}
                placeholder="e.g. Atlanta"
                helperText="Leave blank to match any city"
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth size="small">
                <InputLabel>Dest State</InputLabel>
                <Select value={form.dest_state} label="Dest State" onChange={e => set('dest_state', e.target.value)}>
                  <MenuItem value=""><em>Any</em></MenuItem>
                  {US_STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {/* Filters row */}
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Filters (optional)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Equipment Type</InputLabel>
                <Select value={form.equipment_type} label="Equipment Type" onChange={e => set('equipment_type', e.target.value)}>
                  <MenuItem value=""><em>Any</em></MenuItem>
                  {equipmentTypes.map(t => <MenuItem key={t.id} value={t.name}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth size="small" label="Min Rate" type="number"
                value={form.min_rate} onChange={e => set('min_rate', e.target.value)}
                placeholder="e.g. 2000"
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth size="small" label="Min RPM" type="number"
                value={form.min_rpm} onChange={e => set('min_rpm', e.target.value)}
                placeholder="e.g. 2.50"
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, endAdornment: <InputAdornment position="end">/mi</InputAdornment> }}
              />
            </Grid>
          </Grid>

          {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => { setShowForm(false); setError(null); }}>Cancel</Button>
            <Button
              size="small" variant="contained"
              onClick={handleCreate}
              disabled={saving}
              endIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            >
              Save Watch
            </Button>
          </Box>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : watches.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
          <IonIcon name="notifications-outline" sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>No lane watches yet</Typography>
          <Typography variant="body2" color="text.secondary">
            Add a watch above and we'll notify you the moment a matching load is posted.
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined">
          {watches.map((w, i) => (
            <Box key={w.id}>
              {i > 0 && <Divider />}
              <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography variant="subtitle2" fontWeight={700}>{laneLabel(w)}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                    {w.equipment_type && (
                      <Chip label={w.equipment_type} size="small" variant="outlined" />
                    )}
                    {w.min_rate && (
                      <Chip label={`≥ $${w.min_rate.toLocaleString()}`} size="small" variant="outlined" color="success" />
                    )}
                    {w.min_rpm && (
                      <Chip label={`≥ $${w.min_rpm}/mi`} size="small" variant="outlined" color="info" />
                    )}
                    {!w.equipment_type && !w.min_rate && !w.min_rpm && (
                      <Typography variant="caption" color="text.disabled">All loads</Typography>
                    )}
                  </Box>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={w.active}
                      onChange={e => handleToggle(w.id, e.target.checked)}
                      color="success"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {w.active
                        ? <IonIcon name="notifications-outline" fontSize="small" color="success" />
                        : <IonIcon name="notifications-off-outline" fontSize="small" color="disabled" />}
                      <Typography variant="caption" color={w.active ? 'success.main' : 'text.disabled'}>
                        {w.active ? 'Active' : 'Paused'}
                      </Typography>
                    </Box>
                  }
                  sx={{ mr: 0 }}
                />

                <IconButton
                  size="small"
                  onClick={() => handleDelete(w.id)}
                  sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                >
                  <IonIcon name="trash-outline" fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        Up to 20 lane watches. Notifications appear in your bell icon.
      </Typography>
    </Box>
  );
}
