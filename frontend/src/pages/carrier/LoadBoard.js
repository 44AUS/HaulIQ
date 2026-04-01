import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  InputAdornment, IconButton, Chip, Skeleton, Button, Grid, Paper,
  ToggleButtonGroup, ToggleButton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import BoltIcon from '@mui/icons-material/Bolt';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import TableRowsIcon from '@mui/icons-material/TableRows';
import MapIcon from '@mui/icons-material/Map';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { loadsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import LoadCard from '../../components/carrier/LoadCard';

const SORT_OPTIONS = [
  { value: 'profit', label: 'Highest Net Profit' },
  { value: 'rate',   label: 'Highest Rate/Mile' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'miles',  label: 'Most Miles' },
];

const SCORE_COLOR = { green: 'success', yellow: 'warning', red: 'error' };
const SCORE_ICONS = { green: TrendingUpIcon, yellow: RemoveIcon, red: TrendingDownIcon };

const MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;
const MAPS_LOADED_LIBS = ['places'];

// ─── Google Maps view ─────────────────────────────────────────────────────────
function MapView({ loads }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const noKey = !MAPS_KEY || MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: noKey ? '' : MAPS_KEY,
    libraries: MAPS_LOADED_LIBS,
    preventGoogleFontsLoading: true,
  });

  const withCoords = useMemo(
    () => loads.filter(l => l.pickupLat != null && l.pickupLng != null),
    [loads],
  );

  if (noKey || loadError) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: 420, borderRadius: 2, border: '1px dashed', borderColor: 'divider', gap: 1.5 }}>
        <MapIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
        <Typography variant="h6" color="text.secondary" fontWeight={600}>Map view unavailable</Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={340}>
          Add a valid Google Maps API key to <code>REACT_APP_GOOGLE_MAPS_KEY</code> in your <code>.env</code> file to enable map view.
        </Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return <Skeleton variant="rounded" height={500} sx={{ borderRadius: 2 }} />;
  }

  return (
    <Box>
      {withCoords.length === 0 && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            No loads have geocoded coordinates yet — map markers will appear once loads include pickup coordinates.
          </Typography>
        </Box>
      )}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: 500, borderRadius: 8 }}
        center={{ lat: 39.5, lng: -98.35 }}
        zoom={4}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
      >
        {withCoords.map(load => (
          <Marker
            key={load.id}
            position={{ lat: load.pickupLat, lng: load.pickupLng }}
            onClick={() => setSelected(load)}
            title={`${load.origin} → ${load.dest}`}
          />
        ))}
        {selected && (
          <InfoWindow
            position={{ lat: selected.pickupLat, lng: selected.pickupLng }}
            onCloseClick={() => setSelected(null)}
          >
            <Box sx={{ minWidth: 200, p: 0.5 }}>
              <Typography variant="body2" fontWeight={700} gutterBottom>
                {selected.origin} → {selected.dest}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {selected.type} · {selected.miles} mi
              </Typography>
              <Typography variant="body2" fontWeight={600} color="success.main" gutterBottom>
                ${selected.rate?.toLocaleString()} total · ${selected.ratePerMile}/mi
              </Typography>
              <Button
                size="small"
                variant="contained"
                fullWidth
                onClick={() => navigate(`/carrier/loads/${selected.id}`, { state: { from: 'Load Board' } })}
                sx={{ mt: 0.5, textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
              >
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
function TableView({ loads, onToggleSave }) {
  const navigate = useNavigate();
  const [savedIds, setSavedIds] = useState(() => new Set(loads.filter(l => l.saved).map(l => l.id)));

  const handleSave = (e, load) => {
    e.stopPropagation();
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(load.id)) next.delete(load.id); else next.add(load.id);
      return next;
    });
    loadsApi.toggleSave(load._raw.id).catch(() => setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(load.id)) next.delete(load.id); else next.add(load.id);
      return next;
    }));
    onToggleSave && onToggleSave(load.id);
  };

  if (loads.length === 0) return null;

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Route</TableCell>
            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Equipment</TableCell>
            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Rate</TableCell>
            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>$/mi</TableCell>
            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Net Profit</TableCell>
            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Miles</TableCell>
            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Pickup</TableCell>
            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Broker</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {loads.map(load => {
            const ProfitIcon = SCORE_ICONS[load.profitScore] || RemoveIcon;
            const isSaved = savedIds.has(load.id);
            return (
              <TableRow
                key={load.id}
                hover
                onClick={() => navigate(`/carrier/loads/${load.id}`, { state: { from: 'Load Board' } })}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 160 }}>{load.origin}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 160, display: 'block' }}>
                    → {load.dest}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={load.type} size="small" variant="outlined"
                    icon={<LocalShippingIcon sx={{ fontSize: '12px !important' }} />}
                    sx={{ fontWeight: 600, fontSize: '0.68rem', height: 21 }} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>${load.rate?.toLocaleString()}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">${load.ratePerMile}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ProfitIcon sx={{ fontSize: 14, color: `${SCORE_COLOR[load.profitScore]}.main` }} />
                    <Typography variant="body2" fontWeight={700} color={`${SCORE_COLOR[load.profitScore]}.main`}>
                      ${load.netProfit?.toLocaleString()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{load.miles} mi</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{load.pickup}</Typography>
                </TableCell>
                <TableCell>
                  {load.broker ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Avatar sx={{ width: 20, height: 20, fontSize: '0.58rem', bgcolor: 'primary.main' }}>
                        {load.broker.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </Avatar>
                      <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 100 }}>
                        {load.broker.name}
                      </Typography>
                    </Box>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={e => handleSave(e, load)}
                    sx={{ color: isSaved ? 'primary.main' : 'text.disabled' }}>
                    {isSaved ? <BookmarkIcon sx={{ fontSize: 16 }} /> : <BookmarkBorderIcon sx={{ fontSize: 16 }} />}
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
  const [search, setSearch]           = useState('');
  const [equipFilter, setEquipFilter] = useState('');
  const [sort, setSort]               = useState('profit');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [hotOnly, setHotOnly]         = useState(false);
  const [view, setView]               = useState('cards');
  const [loads, setLoads]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [apiError, setApiError]       = useState(null);

  const fetchLoads = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search)             params.search   = search;
    if (scoreFilter !== 'all') params.profit_score = scoreFilter;
    if (hotOnly)            params.hot_only = true;
    params.sort_by = { profit: 'profit', rate: 'rate_per_mile', recent: 'recent', miles: 'miles' }[sort] || 'profit';

    loadsApi.list(params)
      .then(res => { setLoads(adaptLoadList(res)); setApiError(null); })
      .catch(err => setApiError(err.message))
      .finally(() => setLoading(false));
  }, [search, sort, scoreFilter, hotOnly]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  // Derive equipment types present in current loads
  const availableTypes = useMemo(() => {
    const counts = {};
    loads.forEach(l => {
      if (l.type) counts[l.type] = (counts[l.type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [loads]);

  // Client-side equipment filter
  const filteredLoads = useMemo(() =>
    equipFilter ? loads.filter(l => l.type === equipFilter) : loads,
    [loads, equipFilter],
  );

  const counts = {
    green:  filteredLoads.filter(l => l.profitScore === 'green').length,
    yellow: filteredLoads.filter(l => l.profitScore === 'yellow').length,
    red:    filteredLoads.filter(l => l.profitScore === 'red').length,
  };

  const scoreChips = [
    { key: 'all',    label: `All (${filteredLoads.length})`,     color: 'default' },
    { key: 'green',  label: `High Profit (${counts.green})`,     color: 'success' },
    { key: 'yellow', label: `Marginal (${counts.yellow})`,       color: 'warning' },
    { key: 'red',    label: `Loss Risk (${counts.red})`,         color: 'error' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Load Board</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {filteredLoads.length} loads available
          </Typography>
        </Box>

        {/* View toggle */}
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          size="small"
          sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.75 } }}
        >
          <ToggleButton value="cards" aria-label="Card view">
            <ViewModuleIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="caption" fontWeight={700} sx={{ display: { xs: 'none', sm: 'inline' } }}>Cards</Typography>
          </ToggleButton>
          <ToggleButton value="table" aria-label="Table view">
            <TableRowsIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="caption" fontWeight={700} sx={{ display: { xs: 'none', sm: 'inline' } }}>Table</Typography>
          </ToggleButton>
          <ToggleButton value="map" aria-label="Map view">
            <MapIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="caption" fontWeight={700} sx={{ display: { xs: 'none', sm: 'inline' } }}>Map</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Search + Sort */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search origin, destination, commodity…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')} edge="end">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180, flexShrink: 0 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sort} onChange={e => setSort(e.target.value)} label="Sort By">
            {SORT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Equipment type chips — derived from actual loads */}
      {!loading && availableTypes.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          <Chip
            icon={<LocalShippingIcon sx={{ fontSize: '14px !important' }} />}
            label={`All Types (${loads.length})`}
            color={equipFilter === '' ? 'primary' : 'default'}
            variant={equipFilter === '' ? 'filled' : 'outlined'}
            onClick={() => setEquipFilter('')}
            sx={{ fontWeight: 600, cursor: 'pointer' }}
          />
          {availableTypes.map(([type, count]) => (
            <Chip
              key={type}
              label={`${type} (${count})`}
              color={equipFilter === type ? 'primary' : 'default'}
              variant={equipFilter === type ? 'filled' : 'outlined'}
              onClick={() => setEquipFilter(t => t === type ? '' : type)}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            />
          ))}
        </Box>
      )}

      {/* Profit score + hot chips */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {scoreChips.map(({ key, label, color }) => (
          <Chip
            key={key}
            label={label}
            size="small"
            color={scoreFilter === key ? color : 'default'}
            variant={scoreFilter === key ? 'filled' : 'outlined'}
            onClick={() => setScoreFilter(key)}
            sx={{ cursor: 'pointer' }}
          />
        ))}
        <Chip
          icon={<BoltIcon />}
          label="Hot Only"
          size="small"
          color={hotOnly ? 'error' : 'default'}
          variant={hotOnly ? 'filled' : 'outlined'}
          onClick={() => setHotOnly(h => !h)}
          sx={{ cursor: 'pointer' }}
        />
      </Box>

      {/* Results */}
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
          <Button onClick={fetchLoads}>Retry</Button>
        </Box>
      ) : filteredLoads.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 2,
          border: '1px dashed', borderColor: 'divider' }}>
          <LocalShippingIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>No loads match your filters</Typography>
          <Button variant="text" onClick={() => {
            setSearch(''); setEquipFilter(''); setScoreFilter('all'); setHotOnly(false);
          }}>
            Clear filters
          </Button>
        </Box>
      ) : view === 'cards' ? (
        <Grid container spacing={2.5}>
          {filteredLoads.map(load => (
            <Grid item xs={12} sm={6} xl={4} key={load.id}>
              <LoadCard load={load} />
            </Grid>
          ))}
        </Grid>
      ) : view === 'table' ? (
        <TableView loads={filteredLoads} />
      ) : (
        <MapView loads={filteredLoads} />
      )}
    </Box>
  );
}
