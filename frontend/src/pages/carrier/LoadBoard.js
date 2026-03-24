import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  InputAdornment, IconButton, Chip, CircularProgress, Button, Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import BoltIcon from '@mui/icons-material/Bolt';
import { loadsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import LoadCard from '../../components/carrier/LoadCard';

const TYPES = ['All Types', 'Dry Van', 'Reefer', 'Flatbed'];
const SORT_OPTIONS = [
  { value: 'profit', label: 'Highest Net Profit' },
  { value: 'rate', label: 'Highest Rate/Mile' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'miles', label: 'Most Miles' },
];

export default function LoadBoard() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All Types');
  const [sort, setSort] = useState('profit');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [hotOnly, setHotOnly] = useState(false);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (type !== 'All Types') params.load_type = { 'Dry Van': 'dry_van', 'Reefer': 'reefer', 'Flatbed': 'flatbed' }[type];
    if (scoreFilter !== 'all') params.profit_score = scoreFilter;
    if (hotOnly) params.hot_only = true;
    params.sort_by = { profit: 'profit', rate: 'rate_per_mile', recent: 'recent', miles: 'miles' }[sort] || 'profit';

    loadsApi.list(params)
      .then(res => { setLoads(adaptLoadList(res)); setApiError(null); })
      .catch(err => setApiError(err.message))
      .finally(() => setLoading(false));
  }, [search, type, sort, scoreFilter, hotOnly]);

  const counts = {
    green: loads.filter(l => l.profitScore === 'green').length,
    yellow: loads.filter(l => l.profitScore === 'yellow').length,
    red: loads.filter(l => l.profitScore === 'red').length,
  };

  const scoreFilters = [
    { key: 'all', label: `All Loads (${loads.length})`, color: 'default' },
    { key: 'green', label: `High Profit (${counts.green})`, color: 'success' },
    { key: 'yellow', label: `Marginal (${counts.yellow})`, color: 'warning' },
    { key: 'red', label: `Loss Risk (${counts.red})`, color: 'error' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" fontWeight={700}>Load Board</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {loads.length} loads available · Sorted by profitability
        </Typography>
      </Box>

      {/* Profit score quick-filter chips */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {scoreFilters.map(({ key, label, color }) => (
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
          onClick={() => setHotOnly(!hotOnly)}
          sx={{ cursor: 'pointer' }}
        />
      </Box>

      {/* Search + filter bar */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search origin, destination, commodity..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')} edge="end">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Type</InputLabel>
            <Select value={type} onChange={e => setType(e.target.value)} label="Type">
              {TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sort} onChange={e => setSort(e.target.value)} label="Sort By">
              {SORT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : apiError ? (
        <Box sx={{ border: '1px solid', borderColor: 'error.main', borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography color="error">{apiError}</Typography>
        </Box>
      ) : loads.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No loads match your filters
          </Typography>
          <Button
            variant="text"
            onClick={() => { setSearch(''); setType('All Types'); setScoreFilter('all'); setHotOnly(false); }}
          >
            Clear filters
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {loads.map(load => (
            <Grid item xs={12} sm={6} xl={4} key={load.id}>
              <LoadCard load={load} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
