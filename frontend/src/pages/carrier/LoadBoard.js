import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  InputAdornment, IconButton, Chip, Skeleton, Button, Grid, Paper,
  ToggleButtonGroup, ToggleButton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, OutlinedInput, Checkbox, ListItemText,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import BoltIcon from '@mui/icons-material/Bolt';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import TableRowsIcon from '@mui/icons-material/TableRows';
import MapIcon from '@mui/icons-material/Map';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FilterListIcon from '@mui/icons-material/FilterList';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SquareIcon from '@mui/icons-material/Square';
import StarIcon from '@mui/icons-material/Star';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { loadsApi, equipmentTypesApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import LoadCard from '../../components/carrier/LoadCard';

const SORT_OPTIONS = [
  { value: 'profit', label: 'Highest Net Profit' },
  { value: 'rate',   label: 'Highest Rate/Mile' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'miles',  label: 'Most Miles' },
];
const DEADHEAD_OPTIONS = [
  { value: '',    label: 'Any' },
  { value: '25',  label: '25 mi' },
  { value: '50',  label: '50 mi' },
  { value: '100', label: '100 mi' },
  { value: '150', label: '150 mi' },
  { value: '200', label: '200 mi' },
  { value: '300', label: '300 mi' },
];
const MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;
const MAPS_LIBS = ['places'];
const INIT = {
  origin: '', originDeadhead: '',
  dest: '', destDeadhead: '',
  equipTypes: [],
  loadSize: '',
  minLength: '', maxLength: '',
  maxWeight: '',
  dateFrom: '', dateTo: '',
  scoreFilter: 'all',
  hotOnly: false,
  sort: 'profit',
};

// ─── Map view ─────────────────────────────────────────────────────────────────
function MapView({ loads }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const noKey = !MAPS_KEY || MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: noKey ? '' : MAPS_KEY,
    libraries: MAPS_LIBS,
    preventGoogleFontsLoading: true,
  });
  const withCoords = loads.filter(l => l.pickupLat != null && l.pickupLng != null);

  if (noKey || loadError) {
    return (
      <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        height: 420, borderRadius: 2, border: '1px dashed', borderColor: 'divider', gap: 1.5 }}>
        <MapIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
        <Typography variant="h6" color="text.secondary" fontWeight={600}>Map view unavailable</Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={340}>
          Set a valid <code>REACT_APP_GOOGLE_MAPS_KEY</code> in <code>.env</code> to enable map view.
        </Typography>
      </Box>
    );
  }
  if (!isLoaded) return <Skeleton variant="rounded" height={520} sx={{ borderRadius: 2 }} />;

  return (
    <Box>
      {withCoords.length === 0 && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            No loads have geocoded coordinates — markers appear once pickup coordinates are stored.
          </Typography>
        </Box>
      )}
      <GoogleMap mapContainerStyle={{ width: '100%', height: 520, borderRadius: 8 }}
        center={{ lat: 39.5, lng: -98.35 }} zoom={4}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}>
        {withCoords.map(load => (
          <Marker key={load.id} position={{ lat: load.pickupLat, lng: load.pickupLng }}
            onClick={() => setSelected(load)} title={`${load.origin} → ${load.dest}`} />
        ))}
        {selected && (
          <InfoWindow position={{ lat: selected.pickupLat, lng: selected.pickupLng }}
            onCloseClick={() => setSelected(null)}>
            <Box sx={{ minWidth: 200, p: 0.5 }}>
              <Typography variant="body2" fontWeight={700} gutterBottom>{selected.origin} → {selected.dest}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">{selected.type} · {selected.miles} mi</Typography>
              <Typography variant="body2" fontWeight={600} color="success.main" gutterBottom>
                ${selected.rate?.toLocaleString()} · ${selected.ratePerMile}/mi
              </Typography>
              <Button size="small" variant="contained" fullWidth
                onClick={() => navigate(`/carrier/loads/${selected.id}`, { state: { from: 'Load Board' } })}
                sx={{ mt: 0.5, textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}>
                View Load
              </Button>
            </Box>
          </InfoWindow>
        )}
      </GoogleMap>
    </Box>
  );
}

// ─── Table view ───────────────────────────────────────────────────────────────
const TH = ({ children }) => (
  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.63rem',
    letterSpacing: '0.06em', whiteSpace: 'nowrap', color: 'text.secondary', py: 1.25 }}>
    {children}
  </TableCell>
);

function TableView({ loads, equipmentTypes }) {
  const navigate = useNavigate();
  const [savedIds, setSavedIds] = useState(() => new Set(loads.filter(l => l.saved).map(l => l.id)));

  const handleSave = (e, load) => {
    e.stopPropagation();
    setSavedIds(prev => { const n = new Set(prev); n.has(load.id) ? n.delete(load.id) : n.add(load.id); return n; });
    loadsApi.toggleSave(load._raw.id).catch(() =>
      setSavedIds(prev => { const n = new Set(prev); n.has(load.id) ? n.delete(load.id) : n.add(load.id); return n; })
    );
  };

  // Build abbreviation lookup from equipment types API data
  const abbrMap = {};
  equipmentTypes.forEach(t => { abbrMap[t.name] = t.abbreviation || t.name.slice(0, 3).toUpperCase(); });

  if (!loads.length) return null;
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TH>Age</TH>
            <TH>Broker</TH>
            <TH>Pickup</TH>
            <TH>Rate</TH>
            <TH>Trip</TH>
            <TH>Lane</TH>
            <TH>DH-O</TH>
            <TH>Delivery</TH>
            <TH>Equipment</TH>
            <TH></TH>
          </TableRow>
        </TableHead>
        <TableBody>
          {loads.map(load => {
            const isSaved = savedIds.has(load.id);
            const originCity = load.origin?.split(',')[0] || load.origin;
            const destCity   = load.dest?.split(',')[0]   || load.dest;
            const abbr = abbrMap[load.type] || load.type?.slice(0, 3).toUpperCase() || '—';
            const equipParts = [
              abbr,
              load.weight || null,
              load.trailerLength ? `${load.trailerLength} ft` : null,
              load.loadSize === 'partial' ? 'LTL' : 'FTL',
            ].filter(Boolean);

            return (
              <TableRow key={load.id} hover
                onClick={() => navigate(`/carrier/loads/${load.id}`, { state: { from: 'Load Board' } })}
                sx={{ cursor: 'pointer', '& td': { py: 1.25 } }}>

                {/* Age */}
                <TableCell>
                  <Typography variant="caption" color="text.secondary" noWrap>{load.posted}</Typography>
                </TableCell>

                {/* Broker */}
                <TableCell>
                  {load.broker ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 100 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.58rem', fontWeight: 700, bgcolor: 'primary.main', flexShrink: 0 }}>
                        {load.broker.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={700} noWrap display="block" sx={{ lineHeight: 1.3 }}>
                          {load.broker.name}
                        </Typography>
                        {load.broker.rating > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <StarIcon sx={{ fontSize: 9, color: 'warning.main' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                              {load.broker.rating?.toFixed(1)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                </TableCell>

                {/* Pickup */}
                <TableCell>
                  <Typography variant="caption" fontWeight={600} noWrap>{load.pickup}</Typography>
                </TableCell>

                {/* Rate */}
                <TableCell>
                  <Typography variant="body2" fontWeight={700} noWrap>${load.rate?.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    ${load.ratePerMile}/mi
                  </Typography>
                </TableCell>

                {/* Trip (miles) */}
                <TableCell>
                  <Typography variant="body2" fontWeight={600} noWrap>{load.miles} mi</Typography>
                </TableCell>

                {/* Lane */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1 }}>
                    {/* Icon track */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.25, pb: 0.25 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 8, color: 'primary.main', flexShrink: 0 }} />
                      <Box sx={{ width: '1.5px', flex: 1, bgcolor: 'divider', my: '2px' }} />
                      <SquareIcon sx={{ fontSize: 8, color: 'text.secondary', flexShrink: 0 }} />
                    </Box>
                    {/* Cities */}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={700} noWrap display="block" sx={{ lineHeight: 1.6 }}>
                        {originCity}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ lineHeight: 1.6 }}>
                        {destCity}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                {/* DH-O */}
                <TableCell>
                  <Typography variant="caption" fontWeight={600} noWrap>
                    {load.deadhead > 0 ? `${load.deadhead} mi` : '—'}
                  </Typography>
                </TableCell>

                {/* Delivery */}
                <TableCell>
                  <Typography variant="caption" fontWeight={600} noWrap>{load.delivery}</Typography>
                </TableCell>

                {/* Equipment */}
                <TableCell>
                  <Typography variant="caption" fontWeight={700} noWrap display="block">{abbr}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.6rem' }}>
                    {equipParts.slice(1).join(' · ')}
                  </Typography>
                </TableCell>

                {/* Bookmark */}
                <TableCell sx={{ pr: 1 }}>
                  <IconButton size="small" onClick={e => handleSave(e, load)}
                    sx={{ color: isSaved ? 'primary.main' : 'text.disabled' }}>
                    {isSaved ? <BookmarkIcon sx={{ fontSize: 15 }} /> : <BookmarkBorderIcon sx={{ fontSize: 15 }} />}
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Main LoadBoard ────────────────────────────────────────────────────────────
export default function LoadBoard() {
  const [pf, setPF_state] = useState(INIT);          // pending (what user is editing)
  const [appliedFilters, setAppliedFilters] = useState(INIT); // last fetched
  const [view, setView]     = useState('cards');
  const [loads, setLoads]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const autoTimer = useRef(null);

  const setPF = (key, val) => setPF_state(f => ({ ...f, [key]: val }));

  useEffect(() => {
    equipmentTypesApi.list()
      .then(d => setEquipmentTypes(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const buildParams = (f) => {
    const p = {};
    if (f.origin)          p.origin             = f.origin;
    if (f.originDeadhead)  p.max_origin_deadhead = f.originDeadhead;
    if (f.dest)            p.dest               = f.dest;
    if (f.equipTypes.length) p.load_types       = f.equipTypes.join(',');
    if (f.loadSize)        p.load_size          = f.loadSize;
    if (f.maxWeight)       p.max_weight         = f.maxWeight;
    if (f.minLength)       p.min_length         = f.minLength;
    if (f.maxLength)       p.max_length         = f.maxLength;
    if (f.dateFrom)        p.pickup_date_from   = f.dateFrom;
    if (f.dateTo)          p.pickup_date_to     = f.dateTo;
    if (f.scoreFilter !== 'all') p.profit_score = f.scoreFilter;
    if (f.hotOnly)         p.hot_only           = true;
    p.sort_by = { profit: 'profit', rate: 'rate_per_mile', recent: 'recent', miles: 'miles' }[f.sort] || 'profit';
    return p;
  };

  const fetchLoads = useCallback((f) => {
    clearTimeout(autoTimer.current);
    setLoading(true);
    setAppliedFilters(f);
    loadsApi.list(buildParams(f))
      .then(res => { setLoads(adaptLoadList(res)); setApiError(null); })
      .catch(err => setApiError(err.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchLoads(INIT); }, [fetchLoads]);

  // Auto-fetch for sort / score / hot changes
  const autoFetch = (newFilters) => {
    clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => fetchLoads(newFilters), 400);
  };

  const handleSearch = () => fetchLoads(pf);

  const handleClear = () => { setPF_state(INIT); fetchLoads(INIT); };

  const hasActive = JSON.stringify(pf) !== JSON.stringify(INIT);

  const counts = {
    green:  loads.filter(l => l.profitScore === 'green').length,
    yellow: loads.filter(l => l.profitScore === 'yellow').length,
    red:    loads.filter(l => l.profitScore === 'red').length,
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Load Board</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {loading ? 'Loading…' : `${loads.length} loads available`}
          </Typography>
        </Box>
        <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small"
          sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.75 } }}>
          <ToggleButton value="cards">
            <ViewModuleIcon sx={{ fontSize: 17, mr: 0.5 }} />
            <Typography variant="caption" fontWeight={700} sx={{ display: { xs: 'none', sm: 'inline' } }}>Cards</Typography>
          </ToggleButton>
          <ToggleButton value="table">
            <TableRowsIcon sx={{ fontSize: 17, mr: 0.5 }} />
            <Typography variant="caption" fontWeight={700} sx={{ display: { xs: 'none', sm: 'inline' } }}>Table</Typography>
          </ToggleButton>
          <ToggleButton value="map">
            <MapIcon sx={{ fontSize: 17, mr: 0.5 }} />
            <Typography variant="caption" fontWeight={700} sx={{ display: { xs: 'none', sm: 'inline' } }}>Map</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ── Filter panel ────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="subtitle2" fontWeight={700}>Filters</Typography>
          {hasActive && (
            <Button size="small" onClick={handleClear}
              sx={{ ml: 'auto', textTransform: 'none', color: 'text.secondary', fontSize: '0.78rem' }}>
              Clear all
            </Button>
          )}
        </Box>

        {/* Row 1: Origin + Destination (with deadhead) */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={7} md={4}>
            <TextField fullWidth size="small" label="Origin City / State"
              placeholder="e.g. Chicago, IL"
              value={pf.origin}
              onChange={e => setPF('origin', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                endAdornment: pf.origin ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setPF('origin', '')}><ClearIcon sx={{ fontSize: 13 }} /></IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={5} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Deadhead to pickup</InputLabel>
              <Select value={pf.originDeadhead} label="Deadhead to pickup"
                onChange={e => setPF('originDeadhead', e.target.value)}>
                {DEADHEAD_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={7} md={4}>
            <TextField fullWidth size="small" label="Destination City / State"
              placeholder="e.g. Atlanta, GA"
              value={pf.dest}
              onChange={e => setPF('dest', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                endAdornment: pf.dest ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setPF('dest', '')}><ClearIcon sx={{ fontSize: 13 }} /></IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={5} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Deadhead from delivery</InputLabel>
              <Select value={pf.destDeadhead} label="Deadhead from delivery"
                onChange={e => setPF('destDeadhead', e.target.value)}>
                {DEADHEAD_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Row 2: Equipment, Load Size, Length (min/max), Weight */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Equipment Types</InputLabel>
              <Select multiple value={pf.equipTypes}
                onChange={e => setPF('equipTypes', e.target.value)}
                input={<OutlinedInput label="Equipment Types" />}
                renderValue={sel =>
                  sel.length === 0 ? 'All Types'
                  : sel.length === 1 ? sel[0]
                  : `${sel.length} types selected`
                }>
                {equipmentTypes.map(t => (
                  <MenuItem key={t.id} value={t.name}>
                    <Checkbox checked={pf.equipTypes.includes(t.name)} size="small" sx={{ py: 0.25 }} />
                    <ListItemText primary={t.name} primaryTypographyProps={{ variant: 'body2' }} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Load Size</InputLabel>
              <Select value={pf.loadSize} label="Load Size"
                onChange={e => setPF('loadSize', e.target.value)}>
                <MenuItem value="">Full &amp; Partial</MenuItem>
                <MenuItem value="full">Full Truckload (FTL)</MenuItem>
                <MenuItem value="partial">Partial Truckload (LTL)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField fullWidth size="small" label="Min Length"
              type="number" placeholder="40"
              value={pf.minLength}
              onChange={e => setPF('minLength', e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.disabled">ft</Typography></InputAdornment> }}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField fullWidth size="small" label="Max Length"
              type="number" placeholder="53"
              value={pf.maxLength}
              onChange={e => setPF('maxLength', e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.disabled">ft</Typography></InputAdornment> }}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth size="small" label="Max Weight"
              type="number" placeholder="45000"
              value={pf.maxWeight}
              onChange={e => setPF('maxWeight', e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.disabled">lbs</Typography></InputAdornment> }}
              inputProps={{ min: 0 }}
            />
          </Grid>
        </Grid>

        {/* Row 3: Date range + Sort + Search button */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" label="Pickup From"
              type="date" value={pf.dateFrom}
              onChange={e => setPF('dateFrom', e.target.value)}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" label="Pickup To"
              type="date" value={pf.dateTo}
              onChange={e => setPF('dateTo', e.target.value)}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select value={pf.sort} label="Sort By" onChange={e => {
                const nf = { ...pf, sort: e.target.value };
                setPF_state(nf);
                autoFetch(nf);
              }}>
                {SORT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm="auto" sx={{ ml: { md: 'auto' } }}>
            <Button variant="contained" startIcon={<SearchIcon />}
              onClick={handleSearch} disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 700, px: 3, height: 40, whiteSpace: 'nowrap' }}>
              Search Loads
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Profit / Hot quick-chips ─────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
        {[
          { key: 'all',    label: `All (${loads.length})`,          color: 'default' },
          { key: 'green',  label: `High Profit (${counts.green})`,  color: 'success' },
          { key: 'yellow', label: `Marginal (${counts.yellow})`,    color: 'warning' },
          { key: 'red',    label: `Loss Risk (${counts.red})`,      color: 'error' },
        ].map(({ key, label, color }) => (
          <Chip key={key} label={label} size="small"
            color={pf.scoreFilter === key ? color : 'default'}
            variant={pf.scoreFilter === key ? 'filled' : 'outlined'}
            onClick={() => {
              const nf = { ...pf, scoreFilter: key };
              setPF_state(nf);
              autoFetch(nf);
            }}
            sx={{ cursor: 'pointer' }} />
        ))}
        <Chip icon={<BoltIcon />} label="Hot Only" size="small"
          color={pf.hotOnly ? 'error' : 'default'}
          variant={pf.hotOnly ? 'filled' : 'outlined'}
          onClick={() => {
            const nf = { ...pf, hotOnly: !pf.hotOnly };
            setPF_state(nf);
            autoFetch(nf);
          }}
          sx={{ cursor: 'pointer' }} />
        {/* Active equipment chips */}
        {pf.equipTypes.map(t => (
          <Chip key={t} label={t} size="small" color="primary" variant="outlined"
            onDelete={() => {
              const nf = { ...pf, equipTypes: pf.equipTypes.filter(x => x !== t) };
              setPF_state(nf);
              fetchLoads(nf);
            }} />
        ))}
      </Box>

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <Grid container spacing={2.5}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} xl={4} key={i}>
              <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Skeleton variant="rounded" width={100} height={21} sx={{ borderRadius: 4 }} />
                  <Skeleton variant="rounded" width={60} height={21} sx={{ borderRadius: 4 }} />
                </Box>
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width="55%" height={16} sx={{ mb: 1.5 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 1.5 }}>
                  {[1,2,3].map(j => <Skeleton key={j} variant="rounded" height={50} sx={{ borderRadius: 1.5 }} />)}
                </Box>
                <Skeleton variant="text" width="70%" height={20} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : apiError ? (
        <Box sx={{ border: '1px solid', borderColor: 'error.main', borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography color="error" gutterBottom>{apiError}</Typography>
          <Button onClick={() => fetchLoads(appliedFilters)}>Retry</Button>
        </Box>
      ) : loads.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 2,
          border: '1px dashed', borderColor: 'divider' }}>
          <LocalShippingIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>No loads match your filters</Typography>
          <Button variant="text" onClick={handleClear}>Clear filters</Button>
        </Box>
      ) : view === 'cards' ? (
        <Grid container spacing={2.5}>
          {loads.map(load => (
            <Grid item xs={12} sm={6} xl={4} key={load.id}>
              <LoadCard load={load} />
            </Grid>
          ))}
        </Grid>
      ) : view === 'table' ? (
        <TableView loads={loads} equipmentTypes={equipmentTypes} />
      ) : (
        <MapView loads={loads} />
      )}
    </Box>
  );
}
