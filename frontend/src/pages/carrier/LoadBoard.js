import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  InputAdornment, IconButton, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, OutlinedInput, Checkbox, ListItemText,
  useTheme, Drawer, Tooltip, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FilterListIcon from '@mui/icons-material/FilterList';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SquareIcon from '@mui/icons-material/Square';
import StarIcon from '@mui/icons-material/Star';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { loadsApi, equipmentTypesApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';

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
const INIT = {
  origin: '', originDeadhead: '',
  dest: '', destDeadhead: '',
  equipTypes: [],
  loadSize: '',
  minLength: '', maxLength: '',
  maxWeight: '',
  dateFrom: '', dateTo: '',
  sort: 'profit',
};
const TABS = [
  { key: 'all',         label: 'ALL' },
  { key: 'high_profit', label: 'HIGH PROFIT' },
  { key: 'marginal',    label: 'MARGINAL' },
  { key: 'loss_risk',   label: 'LOSS RISK' },
  { key: 'hot',         label: 'HOT ONLY' },
];

// ─── Table header cell ─────────────────────────────────────────────────────────
const TH = ({ children, sx: sxProp }) => (
  <TableCell
    sx={theme => ({
      fontSize: '0.78rem',
      fontWeight: '400 !important',
      textTransform: 'none !important',
      color: `${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)'} !important`,
      bgcolor: 'action.hover',
      whiteSpace: 'nowrap',
      py: 1.25,
      ...sxProp,
    })}
  >
    {children}
  </TableCell>
);

// ─── Table view ────────────────────────────────────────────────────────────────
function TableView({ loads, equipmentTypes }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [savedIds, setSavedIds] = useState(() => new Set(loads.filter(l => l.saved).map(l => l.id)));

  const handleSave = (e, load) => {
    e.stopPropagation();
    setSavedIds(prev => { const n = new Set(prev); n.has(load.id) ? n.delete(load.id) : n.add(load.id); return n; });
    loadsApi.toggleSave(load._raw.id).catch(() =>
      setSavedIds(prev => { const n = new Set(prev); n.has(load.id) ? n.delete(load.id) : n.add(load.id); return n; })
    );
  };

  const abbrMap = {};
  equipmentTypes.forEach(t => { abbrMap[t.name] = t.abbreviation || t.name.slice(0, 3).toUpperCase(); });

  const PROFIT_BAR = { green: '#2e7d32', yellow: '#ED6C02', red: '#d32f2f' };

  if (!loads.length) return null;
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow>
            <TH sx={{ width: 80, minWidth: 80 }}>Age</TH>
            <TH sx={{ minWidth: 100 }}>Broker</TH>
            <TH sx={{ minWidth: 90 }}>Pickup</TH>
            <TH sx={{ minWidth: 80 }}>Rate</TH>
            <TH sx={{ minWidth: 70 }}>Trip</TH>
            <TH sx={{ minWidth: 180 }}>Lane</TH>
            <TH sx={{ minWidth: 70 }}>DH-O</TH>
            <TH sx={{ minWidth: 90 }}>Delivery</TH>
            <TH sx={{ minWidth: 90 }}>Equipment</TH>
            <TH sx={{ minWidth: 90 }}>Net Profit</TH>
            <TH sx={{ width: 60 }}></TH>
          </TableRow>
        </TableHead>
        <TableBody>
          {loads.map(load => {
            const isSaved    = savedIds.has(load.id);
            const originCity = load.origin || '—';
            const destCity   = load.dest   || '—';
            const abbr       = abbrMap[load.type] || load.type?.slice(0, 3).toUpperCase() || '—';
            const barColor   = PROFIT_BAR[load.profitScore] || '#9e9e9e';
            const equipParts = [
              abbr,
              load.weight || null,
              load.trailerLength ? `${load.trailerLength} ft` : null,
              load.loadSize === 'partial' ? 'LTL' : 'FTL',
            ].filter(Boolean);

            return (
              <TableRow key={load.id}
                onClick={() => navigate(`/carrier/loads/${load.id}`, { state: { from: 'Load Board' } })}
                sx={{
                  cursor: 'pointer',
                  height: 64,
                  '& td': { py: 0, borderBottom: 0 },
                  '& td:not(:nth-of-type(1))': { borderBottom: '1px solid', borderBottomColor: 'divider' },
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
                }}>

                {/* Age */}
                <TableCell sx={{ width: 80, minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary" noWrap>{load.posted}</Typography>
                </TableCell>

                {/* Broker */}
                <TableCell sx={{ minWidth: 100 }}>
                  {load.broker ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
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
                <TableCell sx={{ minWidth: 90 }}>
                  <Typography variant="caption" fontWeight={600} noWrap>{load.pickup}</Typography>
                </TableCell>

                {/* Rate */}
                <TableCell sx={{ minWidth: 80 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>${load.rate?.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    ${load.ratePerMile}/mi
                  </Typography>
                </TableCell>

                {/* Trip */}
                <TableCell sx={{ minWidth: 70 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>{load.miles} mi</Typography>
                </TableCell>

                {/* Lane — accent bar + icon track */}
                <TableCell sx={{ pl: 0, position: 'relative', minWidth: 180 }}>
                  <Box sx={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 4, bgcolor: barColor, borderRadius: '0 2px 2px 0' }} />
                  <Box sx={{ pl: 2, display: 'flex', alignItems: 'stretch', gap: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.25, pb: 0.25 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 8, color: 'primary.main', flexShrink: 0 }} />
                      <Box sx={{ width: '1.5px', flex: 1, bgcolor: 'divider', my: '2px' }} />
                      <SquareIcon sx={{ fontSize: 8, color: 'text.secondary', flexShrink: 0 }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={700} noWrap display="block" sx={{ lineHeight: 1.6 }}>{originCity}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ lineHeight: 1.6 }}>{destCity}</Typography>
                    </Box>
                  </Box>
                </TableCell>

                {/* DH-O */}
                <TableCell sx={{ minWidth: 70 }}>
                  <Typography variant="caption" fontWeight={600} noWrap>
                    {load.deadhead > 0 ? `${load.deadhead} mi` : '—'}
                  </Typography>
                </TableCell>

                {/* Delivery */}
                <TableCell sx={{ minWidth: 90 }}>
                  <Typography variant="caption" fontWeight={600} noWrap>{load.delivery}</Typography>
                </TableCell>

                {/* Equipment */}
                <TableCell sx={{ minWidth: 90 }}>
                  <Typography variant="caption" fontWeight={700} noWrap display="block">{abbr}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.6rem' }}>
                    {equipParts.slice(1).join(' · ')}
                  </Typography>
                </TableCell>

                {/* Net Profit */}
                <TableCell sx={{ minWidth: 90 }}>
                  <Typography variant="body2" fontWeight={700} noWrap
                    color={load.profitScore === 'green' ? 'success.main' : load.profitScore === 'red' ? 'error.main' : 'warning.main'}>
                    ${load.netProfit?.toLocaleString()}
                  </Typography>
                </TableCell>

                {/* Bookmark + Chevron */}
                <TableCell sx={{ width: 60, pr: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton size="small" onClick={e => handleSave(e, load)}
                      sx={{ color: isSaved ? 'primary.main' : 'text.disabled' }}>
                      {isSaved ? <BookmarkIcon sx={{ fontSize: 15 }} /> : <BookmarkBorderIcon sx={{ fontSize: 15 }} />}
                    </IconButton>
                    <ChevronRightIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Filter Drawer ─────────────────────────────────────────────────────────────
function FilterDrawer({ open, onClose, pf, setPF, onApply, onClear, equipmentTypes }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 300, bgcolor: isDark ? '#1a1a1a' : '#fff', borderRadius: 0 } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1.05rem' }}>Filter</Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button size="small" onClick={onClear} sx={{ color: 'error.main', fontWeight: 700, minWidth: 0, px: 0.5, fontSize: '0.8rem' }}>CLEAR</Button>
            <Button size="small" variant="contained" onClick={onApply} sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' }, fontWeight: 700, px: 2, fontSize: '0.8rem', minWidth: 0 }}>APPLY</Button>
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>

          {/* Origin */}
          <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Origin
            </Typography>
            <TextField fullWidth size="small" placeholder="e.g. Chicago, IL" value={pf.origin}
              onChange={e => setPF('origin', e.target.value)}
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 14, color: 'text.disabled' }} /></InputAdornment>,
                endAdornment: pf.origin ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setPF('origin', '')}><ClearIcon sx={{ fontSize: 12 }} /></IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Deadhead to pickup</InputLabel>
              <Select value={pf.originDeadhead} label="Deadhead to pickup" onChange={e => setPF('originDeadhead', e.target.value)}>
                {DEADHEAD_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Destination */}
          <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Destination
            </Typography>
            <TextField fullWidth size="small" placeholder="e.g. Atlanta, GA" value={pf.dest}
              onChange={e => setPF('dest', e.target.value)}
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 14, color: 'text.disabled' }} /></InputAdornment>,
                endAdornment: pf.dest ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setPF('dest', '')}><ClearIcon sx={{ fontSize: 12 }} /></IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Deadhead from delivery</InputLabel>
              <Select value={pf.destDeadhead} label="Deadhead from delivery" onChange={e => setPF('destDeadhead', e.target.value)}>
                {DEADHEAD_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Equipment */}
          <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Equipment
            </Typography>
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
          </Box>

          {/* Load Size */}
          <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Load Size
            </Typography>
            <FormControl fullWidth size="small">
              <Select value={pf.loadSize} displayEmpty onChange={e => setPF('loadSize', e.target.value)}>
                <MenuItem value="">Full &amp; Partial</MenuItem>
                <MenuItem value="full">Full Truckload (FTL)</MenuItem>
                <MenuItem value="partial">Partial Truckload (LTL)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Weight */}
          <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Max Weight
            </Typography>
            <TextField fullWidth size="small" type="number" placeholder="45000"
              value={pf.maxWeight} onChange={e => setPF('maxWeight', e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.disabled">lbs</Typography></InputAdornment> }}
              inputProps={{ min: 0 }}
            />
          </Box>

          {/* Trailer Length */}
          <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Trailer Length
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" type="number" placeholder="Min" value={pf.minLength}
                onChange={e => setPF('minLength', e.target.value)}
                InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.disabled">ft</Typography></InputAdornment> }}
                inputProps={{ min: 0 }} sx={{ flex: 1 }} />
              <TextField size="small" type="number" placeholder="Max" value={pf.maxLength}
                onChange={e => setPF('maxLength', e.target.value)}
                InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.disabled">ft</Typography></InputAdornment> }}
                inputProps={{ min: 0 }} sx={{ flex: 1 }} />
            </Box>
          </Box>

          {/* Pickup Date */}
          <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Pickup Date
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" type="date" value={pf.dateFrom}
                onChange={e => setPF('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }} inputProps={{ style: { fontSize: 12 } }} sx={{ flex: 1 }} />
              <TextField size="small" type="date" value={pf.dateTo}
                onChange={e => setPF('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }} inputProps={{ style: { fontSize: 12 } }} sx={{ flex: 1 }} />
            </Box>
          </Box>

          {/* Sort By */}
          <Box sx={{ px: 2.5, py: 1.25 }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Sort By
            </Typography>
            <FormControl fullWidth size="small">
              <Select value={pf.sort} onChange={e => setPF('sort', e.target.value)}>
                {SORT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

        </Box>
      </Box>
    </Drawer>
  );
}

// ─── Main LoadBoard ────────────────────────────────────────────────────────────
export default function LoadBoard() {
  const [pf, setPF_state] = useState(INIT);
  const [appliedFilters, setAppliedFilters] = useState(INIT);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const autoTimer = useRef(null);

  const setPF = (key, val) => setPF_state(f => ({ ...f, [key]: val }));

  useEffect(() => {
    equipmentTypesApi.list()
      .then(d => setEquipmentTypes(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const buildParams = (f) => {
    const p = {};
    if (f.origin)            p.origin              = f.origin;
    if (f.originDeadhead)    p.max_origin_deadhead  = f.originDeadhead;
    if (f.dest)              p.dest                = f.dest;
    if (f.equipTypes.length) p.load_types          = f.equipTypes.join(',');
    if (f.loadSize)          p.load_size           = f.loadSize;
    if (f.maxWeight)         p.max_weight          = f.maxWeight;
    if (f.minLength)         p.min_length          = f.minLength;
    if (f.maxLength)         p.max_length          = f.maxLength;
    if (f.dateFrom)          p.pickup_date_from    = f.dateFrom;
    if (f.dateTo)            p.pickup_date_to      = f.dateTo;
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

  const refresh = () => {
    setSpinning(true);
    loadsApi.list(buildParams(appliedFilters))
      .then(res => { setLoads(adaptLoadList(res)); setApiError(null); })
      .catch(err => setApiError(err.message))
      .finally(() => setSpinning(false));
  };

  const hasActive = JSON.stringify(pf) !== JSON.stringify(INIT);

  const tabLoads = useMemo(() => {
    switch (activeTab) {
      case 'high_profit': return loads.filter(l => l.profitScore === 'green');
      case 'marginal':    return loads.filter(l => l.profitScore === 'yellow');
      case 'loss_risk':   return loads.filter(l => l.profitScore === 'red');
      case 'hot':         return loads.filter(l => l.hot);
      default:            return loads;
    }
  }, [loads, activeTab]);

  const tabCounts = useMemo(() => ({
    all:         loads.length,
    high_profit: loads.filter(l => l.profitScore === 'green').length,
    marginal:    loads.filter(l => l.profitScore === 'yellow').length,
    loss_risk:   loads.filter(l => l.profitScore === 'red').length,
    hot:         loads.filter(l => l.hot).length,
  }), [loads]);

  const tabBorder  = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const activeFg   = isDark ? '#fff' : '#000';
  const inactiveFg = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  return (
    <>
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '4px 6px' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', bgcolor: 'background.paper', borderRadius: '6px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

        {/* ── Top bar ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, bgcolor: 'background.paper', flexShrink: 0, borderRadius: '6px 6px 0 0' }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Load Board</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {loading ? 'Loading…' : `${tabLoads.length} loads available`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              size="small"
              startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
              onClick={() => setFilterOpen(true)}
              sx={{
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
                color: hasActive ? 'primary.main' : 'text.secondary',
                border: '1px solid',
                borderColor: hasActive ? 'primary.main' : tabBorder,
                borderRadius: 1, px: 1.5, py: 0.5, textTransform: 'uppercase',
                '&:hover': { bgcolor: 'action.hover' },
              }}>
              Filter
            </Button>
          </Box>
        </Box>

        {/* ── Tab bar ── */}
        <Box sx={{ display: 'flex', alignItems: 'stretch', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', flexShrink: 0, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count    = tabCounts[tab.key] ?? 0;
            return (
              <Box key={tab.key} onClick={() => setActiveTab(tab.key)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2.75, cursor: 'pointer', flexShrink: 0, borderBottom: isActive ? '2px solid' : '2px solid transparent', borderColor: isActive ? (isDark ? '#fff' : '#000') : 'transparent', color: isActive ? activeFg : inactiveFg, opacity: isActive ? 1 : 0.6, '&:hover': { opacity: 1, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }, transition: 'opacity 0.15s, background-color 0.15s' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>{tab.label}</Typography>
                <Box sx={{ bgcolor: 'background.default', borderRadius: '4px', px: 0.6, py: 0.15, minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{count}</Typography>
                </Box>
              </Box>
            );
          })}
          <Box sx={{ flex: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', pr: 1.5 }}>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={refresh} sx={{ color: 'text.secondary' }}>
                <RefreshIcon sx={{ fontSize: 18, animation: spinning ? 'spin 0.8s linear infinite' : 'none' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* ── Content ── */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <CircularProgress size={28} />
            </Box>
          ) : apiError ? (
            <Box sx={{ border: '1px solid', borderColor: 'error.main', borderRadius: 2, m: 2, p: 4, textAlign: 'center' }}>
              <Typography color="error" gutterBottom>{apiError}</Typography>
              <Button onClick={() => fetchLoads(appliedFilters)}>Retry</Button>
            </Box>
          ) : tabLoads.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 1 }}>
              <LocalShippingIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">No loads match your filters</Typography>
              {hasActive && (
                <Button variant="text" size="small" onClick={() => { setPF_state(INIT); fetchLoads(INIT); }}>
                  Clear filters
                </Button>
              )}
            </Box>
          ) : (
            <TableView loads={tabLoads} equipmentTypes={equipmentTypes} />
          )}
        </Box>

      </Box>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        pf={pf}
        setPF={setPF}
        onApply={() => { fetchLoads(pf); setFilterOpen(false); }}
        onClear={() => { setPF_state(INIT); fetchLoads(INIT); setFilterOpen(false); }}
        equipmentTypes={equipmentTypes}
      />
    </Box>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
