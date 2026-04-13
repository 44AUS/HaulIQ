import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, CircularProgress, IconButton, Button,
  Drawer, MenuItem, Select, FormControl, Tooltip, useTheme,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Checkbox,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { bookingsApi, analyticsApi, loadsApi } from '../../services/api';
import { adaptHistory, adaptLoadList } from '../../services/adapters';

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'all',         label: 'ALL' },
  { key: 'scheduled',   label: 'SCHEDULED' },
  { key: 'in_progress', label: 'IN PROGRESS' },
  { key: 'completed',   label: 'COMPLETED' },
  { key: 'canceled',    label: 'CANCELED' },
  { key: 'saved',       label: 'SAVED' },
  { key: 'archived',    label: 'ARCHIVED' },
];

// in-progress status → tab
const STATUS_TAB = {
  quoted:     'scheduled',
  booked:     'scheduled',
  in_transit: 'in_progress',
};

const STATUS_CHIP = {
  quoted:     { label: 'Pending',     color: 'default' },
  booked:     { label: 'Scheduled',   color: 'info' },
  in_transit: { label: 'In Progress', color: 'warning' },
  completed:  { label: 'Completed',   color: 'success' },
  saved:      { label: 'Saved',       color: 'primary' },
  archived:   { label: 'Archived',    color: 'default' },
};

// Left accent bar color per status
const STATUS_BAR_COLOR = {
  quoted:     '#9e9e9e', // gray   — booked/pending
  booked:     '#1565C0', // blue   — scheduled
  in_transit: '#ED6C02', // yellow/orange — in progress
  completed:  '#2e7d32', // green  — completed
  saved:      '#1565C0', // blue
  archived:   '#616161', // dark grey — archived
};

// ── Filter drawer ──────────────────────────────────────────────────────────────
const FILTER_FIELDS = [
  { key: 'equipment', label: 'Equipment Type', options: ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Lowboy', 'Box Truck'] },
  { key: 'status',    label: 'Status',         options: ['scheduled', 'in_progress', 'completed', 'saved'] },
  { key: 'broker',    label: 'Broker',         options: [] },
];

function FilterDrawer({ open, onClose, filters, onChange, onApply, onClear }) {
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1.05rem' }}>Filter</Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button size="small" onClick={onClear} sx={{ color: 'error.main', fontWeight: 700, minWidth: 0, px: 0.5, fontSize: '0.8rem' }}>CLEAR</Button>
            <Button size="small" variant="contained" onClick={onApply} sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' }, fontWeight: 700, px: 2, fontSize: '0.8rem', minWidth: 0 }}>APPLY</Button>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
          {FILTER_FIELDS.map(field => (
            <Box key={field.key} sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {field.label}
              </Typography>
              <FormControl fullWidth size="small" variant="standard">
                <Select
                  value={filters[field.key] || ''}
                  onChange={e => onChange(field.key, e.target.value)}
                  displayEmpty
                  disableUnderline={false}
                  sx={{ fontSize: '0.875rem', color: filters[field.key] ? 'text.primary' : 'text.disabled' }}
                >
                  <MenuItem value=""><em style={{ fontStyle: 'normal', color: 'inherit' }}>{field.label}</em></MenuItem>
                  {field.options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          ))}

          <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Date Range
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" type="date" value={filters.date_from || ''} onChange={e => onChange('date_from', e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ style: { fontSize: 12 } }} sx={{ flex: 1 }} />
              <TextField size="small" type="date" value={filters.date_to || ''} onChange={e => onChange('date_to', e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ style: { fontSize: 12 } }} sx={{ flex: 1 }} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LoadManager() {
  const navigate = useNavigate();
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';

  const [active,   setActive]   = useState([]);   // from inProgress
  const [history,  setHistory]  = useState([]);   // from analyticsApi.history
  const [saved,    setSaved]    = useState([]);   // from savedList
  const [archived, setArchived] = useState([]);   // from bookingsApi.my (status=archived)
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showProgress, setShowProgress] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters]   = useState({});
  const [applied, setApplied]   = useState({});
  const [spinning, setSpinning] = useState(false);
  const [hoveredRow,    setHoveredRow]    = useState(null);
  const [hoveredHeader, setHoveredHeader] = useState(false);
  const [selected,      setSelected]      = useState(new Set());

  const fetchAll = () => Promise.all([
    bookingsApi.inProgress().catch(() => []),
    analyticsApi.history().catch(() => []),
    loadsApi.savedList().catch(() => []),
    bookingsApi.my().catch(() => []),
  ]);

  const applyFetch = ([act, hist, sv, myBookings]) => {
    setActive(Array.isArray(act) ? act : []);
    setHistory(Array.isArray(hist) ? hist.map(adaptHistory) : []);
    setSaved(adaptLoadList(Array.isArray(sv) ? sv : []));
    setArchived(Array.isArray(myBookings) ? myBookings.filter(b => b.status === 'archived') : []);
  };

  const load = () => {
    setLoading(true);
    fetchAll().then(applyFetch).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => {
    setSpinning(true);
    fetchAll().then(applyFetch).finally(() => setSpinning(false));
  };

  // Normalise all items into a single shape
  const allItems = useMemo(() => {
    const f = applied;

    const applyFilter = (items) => items.filter(item => {
      if (f.equipment && !(item.equipment || '').toLowerCase().includes(f.equipment.toLowerCase())) return false;
      if (f.date_from && item.date && new Date(item.date.date) < new Date(f.date_from)) return false;
      if (f.date_to   && item.date && new Date(item.date.date) > new Date(f.date_to + 'T23:59:59')) return false;
      return true;
    });

    const fmtDateTime = (iso) => {
      if (!iso) return null;
      const d = new Date(iso);
      if (isNaN(d)) return null;
      const date = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
      return { date, time };
    };

    const activeItems = applyFilter(active.map((b, i) => ({
      _key:      b.booking_id || b.id,
      _tab:      STATUS_TAB[b.status] || 'scheduled',
      _nav:      () => navigate(`/carrier/active/${b.booking_id}`),
      rowNum:    i + 1,
      date:      fmtDateTime(b.created_at || b.booked_at || b.updated_at),
      origin:    b.origin,
      dest:      b.destination,
      equipment: b.load_type,
      miles:     b.miles,
      rate:      b.rate,
      broker:    b.broker_name,
      status:    b.status,
      chipKey:   b.status,
    })));

    const histItems = applyFilter(history.map((h, i) => ({
      _key:      h.id,
      _tab:      'completed',
      _nav:      () => {},
      rowNum:    i + 1,
      date:      h.date ? { date: h.date, time: null } : null,
      origin:    h.origin,
      dest:      h.dest,
      equipment: null,
      miles:     h.miles,
      rate:      h.rate,
      net:       h.net,
      broker:    h.broker,
      status:    'completed',
      chipKey:   'completed',
    })));

    const savedItems = applyFilter(saved.map((l, i) => ({
      _key:      l.id,
      _tab:      'saved',
      _nav:      () => navigate(`/carrier/loads/${l.id}`),
      rowNum:    i + 1,
      date:      null,
      origin:    l.origin,
      dest:      l.destination,
      equipment: l.load_type,
      miles:     l.miles,
      rate:      l.rate,
      broker:    null,
      status:    'saved',
      chipKey:   'saved',
    })));

    const archivedItems = applyFilter(archived.map((b, i) => ({
      _key:      b.id,
      _tab:      'archived',
      _nav:      () => {},
      rowNum:    i + 1,
      date:      fmtDateTime(b.created_at || b.updated_at),
      origin:    b.origin,
      dest:      b.destination,
      equipment: b.load_type,
      miles:     b.miles,
      rate:      b.rate,
      broker:    b.broker_name,
      status:    'archived',
      chipKey:   'archived',
    })));

    return [...activeItems, ...histItems, ...savedItems, ...archivedItems];
  }, [active, history, saved, archived, applied, navigate]);

  const tabItems = useMemo(() => {
    if (activeTab === 'all') return allItems.filter(i => i._tab !== 'archived');
    return allItems.filter(i => i._tab === activeTab);
  }, [allItems, activeTab]);

  const tabCounts = useMemo(() => {
    const c = {};
    TABS.forEach(t => {
      if (t.key === 'all') c.all = allItems.filter(i => i._tab !== 'archived').length;
      else c[t.key] = allItems.filter(i => i._tab === t.key).length;
    });
    return c;
  }, [allItems]);

  const handleExport = () => {
    if (!tabItems.length) return;
    const rows = [['Date', 'Origin', 'Destination', 'Equipment', 'Miles', 'Rate', 'Broker', 'Status']];
    tabItems.forEach(item => rows.push([item.date || '', item.origin || '', item.dest || '', item.equipment || '', item.miles || '', item.rate || '', item.broker || '', item.status]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `loads_${activeTab}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const tabBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const activeFg  = isDark ? '#fff' : '#000';
  const inactiveFg = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '10px' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '6px' }}>

      {/* ── Top bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', flexShrink: 0, borderRadius: '6px 6px 0 0' }}>
        <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Loads</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Button size="small" startIcon={<span style={{ fontSize: 14 }}>≡</span>} onClick={() => setShowProgress(v => !v)}
            sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: showProgress ? 'primary.main' : 'text.secondary', bgcolor: showProgress ? 'action.selected' : 'transparent', border: '1px solid', borderColor: showProgress ? 'primary.main' : tabBorder, borderRadius: 1, px: 1.5, py: 0.5, textTransform: 'uppercase', '&:hover': { bgcolor: 'action.hover' } }}>
            Show Progress
          </Button>
          <Button size="small" startIcon={<FilterListIcon sx={{ fontSize: 16 }} />} onClick={() => setFilterOpen(true)}
            sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: Object.values(applied).some(Boolean) ? 'primary.main' : 'text.secondary', border: '1px solid', borderColor: Object.values(applied).some(Boolean) ? 'primary.main' : tabBorder, borderRadius: 1, px: 1.5, py: 0.5, textTransform: 'uppercase', '&:hover': { bgcolor: 'action.hover' } }}>
            Filter
          </Button>
          <Button size="small" startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />} onClick={handleExport}
            sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: 'text.secondary', border: '1px solid', borderColor: tabBorder, borderRadius: 1, px: 1.5, py: 0.5, textTransform: 'uppercase', '&:hover': { bgcolor: 'action.hover' } }}>
            Export
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
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>{tab.label}</Typography>
              <Box sx={{ bgcolor: isDark ? '#3a3a3a' : '#4a4a4a', borderRadius: '4px', px: 0.6, py: 0.15, minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* ── Table ── */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress size={28} />
          </Box>
        ) : tabItems.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 1 }}>
            <LocalShippingIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">No loads in this category</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {/* Date header — hover shows select-all checkbox */}
                  {(() => {
                    const allKeys     = tabItems.map((item, i) => item._key || i);
                    const allSelected = allKeys.length > 0 && allKeys.every(k => selected.has(k));
                    const someSelected = !allSelected && allKeys.some(k => selected.has(k));
                    const toggleAll = () => {
                      setSelected(prev => {
                        const next = new Set(prev);
                        if (allSelected) { allKeys.forEach(k => next.delete(k)); }
                        else             { allKeys.forEach(k => next.add(k)); }
                        return next;
                      });
                    };
                    return (
                      <TableCell
                        sx={{ width: 90, minWidth: 90, bgcolor: 'action.hover', cursor: 'pointer', py: 1.25 }}
                        onMouseEnter={() => setHoveredHeader(true)}
                        onMouseLeave={() => setHoveredHeader(false)}
                        onClick={toggleAll}
                      >
                        {hoveredHeader || allSelected || someSelected ? (
                          <Checkbox
                            size="small"
                            checked={allSelected}
                            indeterminate={someSelected}
                            onChange={toggleAll}
                            onClick={e => e.stopPropagation()}
                            sx={{ p: 0.5 }}
                          />
                        ) : (
                          <Typography sx={{ textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 700, letterSpacing: 0.5, color: 'text.disabled', whiteSpace: 'nowrap' }}>
                            Date
                          </Typography>
                        )}
                      </TableCell>
                    );
                  })()}
                  {['Route', 'Equipment', 'Miles', 'Rate', ...(showProgress ? ['Progress'] : []), 'Broker', 'Status'].map(h => (
                    <TableCell key={h} sx={{ textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 700, letterSpacing: 0.5, color: 'text.disabled', bgcolor: 'action.hover', whiteSpace: 'nowrap', py: 1.25 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tabItems.map((item, idx) => {
                  const chip     = STATUS_CHIP[item.chipKey] || { label: item.status, color: 'default' };
                  const barColor = STATUS_BAR_COLOR[item.chipKey] || '#9e9e9e';
                  const rowKey   = item._key || idx;
                  const isHovered  = hoveredRow === rowKey;
                  const isSelected = selected.has(rowKey);
                  const rowSx = {
                    cursor: 'pointer',
                    height: 64,
                    '& td': { py: 0 },
                    '&:nth-of-type(odd)': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
                    bgcolor: isSelected ? 'action.selected' : undefined,
                    '&:hover': { bgcolor: 'action.selected' },
                  };
                  const toggleSelect = (e) => {
                    e.stopPropagation();
                    setSelected(prev => {
                      const next = new Set(prev);
                      next.has(rowKey) ? next.delete(rowKey) : next.add(rowKey);
                      return next;
                    });
                  };
                  return (
                    <TableRow
                      key={rowKey}
                      onClick={item._nav}
                      onMouseEnter={() => setHoveredRow(rowKey)}
                      onMouseLeave={() => setHoveredRow(null)}
                      sx={rowSx}
                    >
                      {/* Date / checkbox toggle */}
                      <TableCell sx={{ width: 90, minWidth: 90 }} onClick={isHovered ? toggleSelect : undefined}>
                        {isHovered || isSelected ? (
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={toggleSelect}
                            onClick={e => e.stopPropagation()}
                            sx={{ p: 0.5 }}
                          />
                        ) : item.date ? (
                          <Box>
                            <Typography variant="caption" fontWeight={600} display="block" sx={{ lineHeight: 1.3 }}>
                              {item.date.date}
                            </Typography>
                            {item.date.time && (
                              <Typography variant="caption" color="text.disabled" display="block" sx={{ lineHeight: 1.3 }}>
                                {item.date.time}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      {/* Route — accent bar as left border */}
                      <TableCell sx={{ whiteSpace: 'nowrap', pl: 1.5, borderLeft: `4px solid ${barColor}` }}>
                        <Typography variant="body2" fontWeight={700}>{item.origin} → {item.dest}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{item.equipment || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.miles ? `${Number(item.miles).toLocaleString()} mi` : '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {item.rate
                          ? <Typography variant="body2" fontWeight={700} color="success.main">${Number(item.rate).toLocaleString()}</Typography>
                          : <Typography variant="body2" color="text.disabled">—</Typography>}
                        {item.net != null && (
                          <Typography variant="caption" color={item.net >= 0 ? 'success.main' : 'error.main'} display="block">
                            Net {item.net >= 0 ? '+' : ''}${Number(item.net).toLocaleString()}
                          </Typography>
                        )}
                      </TableCell>
                      {showProgress && (
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {item._tab === 'in_progress' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {['D', 'P', 'T', 'Del'].map((s, i) => (
                                <Box key={s} sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: i === 0 ? 'warning.main' : 'action.disabledBackground', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography sx={{ fontSize: '0.5rem', color: '#fff', fontWeight: 700 }}>{s}</Typography>
                                </Box>
                              ))}
                            </Box>
                          ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{item.broker || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        {isSelected && (item.chipKey === 'completed' || item.chipKey === 'archived') ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
                            onClick={async e => {
                              e.stopPropagation();
                              try {
                                if (item.chipKey === 'completed') {
                                  await bookingsApi.archive(rowKey);
                                } else {
                                  await bookingsApi.destroy(rowKey);
                                }
                                setSelected(prev => { const n = new Set(prev); n.delete(rowKey); return n; });
                                refresh();
                              } catch (err) {
                                alert(err.message || 'Failed to delete');
                              }
                            }}
                            sx={{ fontSize: '0.68rem', height: 22, fontWeight: 600, px: 1, py: 0, minWidth: 0, textTransform: 'none' }}
                          >
                            {item.chipKey === 'archived' ? 'Delete' : 'Archive'}
                          </Button>
                        ) : (
                          <Chip label={chip.label} size="small" color={chip.color} variant="outlined" sx={{ fontSize: '0.68rem', height: 22, fontWeight: 600 }} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

    </Box>

    {/* ── Floating ADD ── */}
    <Box sx={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/carrier/loads')}
        sx={{ bgcolor: '#FF8C00', color: '#fff', '&:hover': { bgcolor: '#E07800' }, fontWeight: 700, px: 3.5, py: 1.25, borderRadius: 3, fontSize: '0.9rem', boxShadow: '0 4px 16px rgba(255,140,0,0.45)' }}>
        ADD
      </Button>
    </Box>

    <FilterDrawer
      open={filterOpen}
      onClose={() => setFilterOpen(false)}
      filters={filters}
      onChange={(key, val) => setFilters(f => ({ ...f, [key]: val }))}
      onApply={() => { setApplied({ ...filters }); setFilterOpen(false); }}
      onClear={() => { setFilters({}); setApplied({}); setFilterOpen(false); }}
    />

    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Box>
  );
}
