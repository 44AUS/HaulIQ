import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, CircularProgress, IconButton, Button,
  Drawer, MenuItem, Select, FormControl,
  TextField, Tooltip, useTheme,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HomeIcon from '@mui/icons-material/Home';
import { bookingsApi, loadsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';

// ── Status config ──────────────────────────────────────────────────────────────
const TMS_STATUS_MAP = {
  dispatched:  { tab: 'scheduled',   label: 'Scheduled',  chipColor: 'info' },
  picked_up:   { tab: 'in_progress', label: 'In Progress', chipColor: 'warning' },
  in_transit:  { tab: 'in_progress', label: 'In Progress', chipColor: 'warning' },
  delivered:   { tab: 'completed',   label: 'Completed',  chipColor: 'success' },
  pod_received:{ tab: 'completed',   label: 'Completed',  chipColor: 'success' },
};

const BOOKING_STATUS_MAP = {
  pending:    { tab: 'scheduled',   label: 'Pending',   chipColor: 'default' },
  approved:   { tab: 'scheduled',   label: 'Scheduled', chipColor: 'info' },
  in_transit: { tab: 'in_progress', label: 'In Progress', chipColor: 'warning' },
  delivered:  { tab: 'completed',   label: 'Completed', chipColor: 'success' },
  cancelled:  { tab: 'canceled',    label: 'Canceled',  chipColor: 'error' },
  rejected:   { tab: 'canceled',    label: 'Rejected',  chipColor: 'error' },
};

const TABS = [
  { key: 'all',         label: 'ALL' },
  { key: 'scheduled',   label: 'SCHEDULED' },
  { key: 'in_progress', label: 'IN PROGRESS' },
  { key: 'completed',   label: 'COMPLETED' },
  { key: 'canceled',    label: 'CANCELED' },
  { key: 'saved',       label: 'SAVED' },
  { key: 'archived',    label: 'ARCHIVED' },
];

function getBookingTab(booking) {
  if (booking.tms_status && TMS_STATUS_MAP[booking.tms_status]) {
    return TMS_STATUS_MAP[booking.tms_status].tab;
  }
  if (booking.status && BOOKING_STATUS_MAP[booking.status]) {
    return BOOKING_STATUS_MAP[booking.status].tab;
  }
  return 'scheduled';
}

function getBookingChipLabel(booking) {
  if (booking.tms_status && TMS_STATUS_MAP[booking.tms_status]) {
    return TMS_STATUS_MAP[booking.tms_status].label;
  }
  if (booking.status && BOOKING_STATUS_MAP[booking.status]) {
    return BOOKING_STATUS_MAP[booking.status].label;
  }
  return 'Unknown';
}

function getBookingChipColor(booking) {
  if (booking.tms_status && TMS_STATUS_MAP[booking.tms_status]) {
    return TMS_STATUS_MAP[booking.tms_status].chipColor;
  }
  if (booking.status && BOOKING_STATUS_MAP[booking.status]) {
    return BOOKING_STATUS_MAP[booking.status].chipColor;
  }
  return 'default';
}

// ── Filter drawer ──────────────────────────────────────────────────────────────
const FILTER_FIELDS = [
  { key: 'equipment',      label: 'Equipment Type',   options: ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Lowboy', 'Box Truck'] },
  { key: 'tms_status',     label: 'TMS Status',       options: ['dispatched', 'picked_up', 'in_transit', 'delivered', 'pod_received'] },
  { key: 'pay_status',     label: 'Payment Status',   options: ['unpaid', 'pending', 'paid'] },
  { key: 'has_driver',     label: 'Driver Assigned',  options: ['Yes', 'No'] },
  { key: 'repeat',         label: 'Repeat Lane',      options: ['Yes', 'No'] },
  { key: 'online_booking', label: 'Online Booking',   options: ['Yes', 'No'] },
];

function FilterDrawer({ open, onClose, filters, onChange, onApply, onClear }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 300,
          bgcolor: isDark ? '#1a1a1a' : '#fff',
          borderRadius: 0,
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider',
        }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1.05rem' }}>Filter</Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              size="small"
              onClick={onClear}
              sx={{ color: 'error.main', fontWeight: 700, minWidth: 0, px: 0.5, fontSize: '0.8rem' }}
            >
              CLEAR
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={onApply}
              sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' }, fontWeight: 700, px: 2, fontSize: '0.8rem', minWidth: 0 }}
            >
              APPLY
            </Button>
          </Box>
        </Box>

        {/* Filter fields */}
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
                  {field.options.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ))}

          {/* Date Range */}
          <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Date Range
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small" type="date" placeholder="From"
                value={filters.date_from || ''}
                onChange={e => onChange('date_from', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ style: { fontSize: 12 } }}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small" type="date" placeholder="To"
                value={filters.date_to || ''}
                onChange={e => onChange('date_to', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ style: { fontSize: 12 } }}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

// ── Row component ─────────────────────────────────────────────────────────────
function LoadRow({ item, onClick, showProgress }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const isSaved   = item._type === 'saved';
  const origin    = item.origin || item.load?.origin || '—';
  const dest      = item.destination || item.load?.destination || '—';
  const commodity = item.commodity || item.load?.commodity || '';
  const equipment = item.load_type || item.load?.load_type || '';
  const rate      = item.rate || item.load?.rate || null;
  const driverPay = item.driver_pay || null;
  const createdAt = item.created_at || item.load?.created_at || null;
  const rowNum    = item._rowNum;

  const label     = isSaved ? 'Saved' : getBookingChipLabel(item);
  const chipColor = isSaved ? 'primary' : getBookingChipColor(item);

  const date = createdAt ? new Date(createdAt) : null;
  const dateStr  = date ? `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(2)}` : '—';
  const timeStr  = date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'stretch',
        borderBottom: 1, borderColor: 'divider',
        cursor: 'pointer',
        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)' },
        transition: 'background 0.1s',
      }}
    >
      {/* Date column */}
      <Box sx={{ width: 70, flexShrink: 0, px: 1.5, py: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', lineHeight: 1.4 }}>{dateStr}</Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', lineHeight: 1.4 }}>{timeStr}</Typography>
      </Box>

      {/* Left accent bar */}
      <Box sx={{ width: 3, bgcolor: chipColor === 'success' ? 'success.main' : chipColor === 'warning' ? 'warning.main' : chipColor === 'error' ? 'error.main' : chipColor === 'info' ? 'info.main' : 'primary.main', flexShrink: 0, my: 0.5 }} />

      {/* Main content */}
      <Box sx={{ flex: 1, px: 2, py: 1.5, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {rowNum ? `${rowNum} - ` : ''}{origin} → {dest}
          </Typography>
          <LocalShippingIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
          <HomeIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
        </Box>
        <Typography variant="caption" color="text.secondary" noWrap>
          {[commodity, equipment].filter(Boolean).join(' · ')}
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          {rate ? (
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
              ${Number(rate).toLocaleString()} {driverPay ? `· Driver: $${Number(driverPay).toLocaleString()}` : ''} due
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>No rate set</Typography>
          )}
        </Box>

        {/* Progress bar — shown when showProgress is on */}
        {showProgress && !isSaved && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {['Dispatched', 'Picked Up', 'In Transit', 'Delivered'].map((step, idx) => {
              const tmsVals = ['dispatched', 'picked_up', 'in_transit', 'delivered'];
              const cur = tmsVals.indexOf(item.tms_status || '');
              const done = cur > idx;
              const active = cur === idx;
              return (
                <Box key={step} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: idx === 0 ? 0 : 24, height: 2, bgcolor: done ? 'success.main' : 'action.disabledBackground', display: idx === 0 ? 'none' : 'block' }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: done || active ? 'success.main' : 'action.disabledBackground' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.55rem', color: active ? 'success.main' : 'text.disabled', whiteSpace: 'nowrap', mt: 0.25 }}>{step}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Right: chip + arrow */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1.5, flexShrink: 0 }}>
        <Chip
          label={label}
          size="small"
          color={chipColor}
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: '0.7rem', height: 24 }}
        />
        <ChevronRightIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
      </Box>
    </Box>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LoadManager() {
  const navigate   = useNavigate();
  const theme      = useTheme();
  const isDark     = theme.palette.mode === 'dark';

  const [bookings, setBookings]       = useState([]);
  const [savedLoads, setSavedLoads]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('all');
  const [showProgress, setShowProgress] = useState(false);
  const [filterOpen, setFilterOpen]   = useState(false);
  const [filters, setFilters]         = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const [spinning, setSpinning]       = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      bookingsApi.my().catch(() => []),
      loadsApi.savedList().catch(() => []),
    ]).then(([bks, saved]) => {
      setBookings(Array.isArray(bks) ? bks : []);
      const adapted = adaptLoadList(Array.isArray(saved) ? saved : []);
      setSavedLoads(adapted.map(l => ({ ...l, _type: 'saved' })));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const refresh = () => {
    setSpinning(true);
    Promise.all([
      bookingsApi.my().catch(() => []),
      loadsApi.savedList().catch(() => []),
    ]).then(([bks, saved]) => {
      setBookings(Array.isArray(bks) ? bks : []);
      const adapted = adaptLoadList(Array.isArray(saved) ? saved : []);
      setSavedLoads(adapted.map(l => ({ ...l, _type: 'saved' })));
    }).finally(() => setSpinning(false));
  };

  // Merge bookings + saved, apply filters
  const allItems = useMemo(() => {
    const bkItems = bookings.map((b, i) => ({ ...b, _rowNum: i + 1 }));
    const svItems = savedLoads.map((l, i) => ({ ...l, _rowNum: i + 1 }));
    const f = appliedFilters;

    const filterItem = (item) => {
      if (f.equipment && !((item.load_type || item.load?.load_type || '').toLowerCase().includes(f.equipment.toLowerCase()))) return false;
      if (f.tms_status && item.tms_status !== f.tms_status) return false;
      if (f.pay_status && item.driver_pay_status !== f.pay_status) return false;
      if (f.has_driver === 'Yes' && !item.assigned_driver_id) return false;
      if (f.has_driver === 'No'  &&  item.assigned_driver_id) return false;
      if (f.date_from) {
        const d = new Date(item.created_at || item.load?.created_at || 0);
        if (d < new Date(f.date_from)) return false;
      }
      if (f.date_to) {
        const d = new Date(item.created_at || item.load?.created_at || 0);
        if (d > new Date(f.date_to + 'T23:59:59')) return false;
      }
      return true;
    };

    return [...bkItems.filter(filterItem), ...svItems.filter(filterItem)];
  }, [bookings, savedLoads, appliedFilters]);

  const tabItems = useMemo(() => {
    if (activeTab === 'all')      return allItems;
    if (activeTab === 'saved')    return allItems.filter(i => i._type === 'saved');
    if (activeTab === 'archived') return [];
    return allItems.filter(i => i._type !== 'saved' && getBookingTab(i) === activeTab);
  }, [allItems, activeTab]);

  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach(t => {
      if (t.key === 'all')      counts.all      = allItems.length;
      else if (t.key === 'saved')    counts.saved    = allItems.filter(i => i._type === 'saved').length;
      else if (t.key === 'archived') counts.archived = 0;
      else counts[t.key] = allItems.filter(i => i._type !== 'saved' && getBookingTab(i) === t.key).length;
    });
    return counts;
  }, [allItems]);

  const handleExport = () => {
    if (!tabItems.length) return;
    const rows = [['Date', 'Origin', 'Destination', 'Equipment', 'Rate', 'Status']];
    tabItems.forEach(item => {
      rows.push([
        item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
        item.origin || item.load?.origin || '',
        item.destination || item.load?.destination || '',
        item.load_type || item.load?.load_type || '',
        item.rate || item.load?.rate || '',
        item._type === 'saved' ? 'Saved' : getBookingChipLabel(item),
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loads_${activeTab}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRowClick = (item) => {
    if (item._type === 'saved') {
      navigate(`/carrier/loads/${item.id}`);
    } else {
      navigate(`/carrier/active/${item.id}`);
    }
  };

  const tabBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const headerBg = isDark ? '#0d0d0d' : '#fff';
  const activeFg = isDark ? '#fff' : '#000';
  const inactiveFg = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>

      {/* ── Top bar ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 1.5, bgcolor: headerBg,
        borderBottom: 1, borderColor: 'divider', flexShrink: 0,
      }}>
        <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Loads</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Button
            size="small"
            startIcon={<span style={{ fontSize: 14 }}>≡</span>}
            onClick={() => setShowProgress(v => !v)}
            sx={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
              color: showProgress ? 'primary.main' : 'text.secondary',
              bgcolor: showProgress ? 'action.selected' : 'transparent',
              border: '1px solid',
              borderColor: showProgress ? 'primary.main' : tabBorder,
              borderRadius: 1, px: 1.5, py: 0.5, textTransform: 'uppercase',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Show Progress
          </Button>
          <Button
            size="small"
            startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
            onClick={() => setFilterOpen(true)}
            sx={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
              color: Object.keys(appliedFilters).some(k => appliedFilters[k]) ? 'primary.main' : 'text.secondary',
              border: '1px solid',
              borderColor: Object.keys(appliedFilters).some(k => appliedFilters[k]) ? 'primary.main' : tabBorder,
              borderRadius: 1, px: 1.5, py: 0.5, textTransform: 'uppercase',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Filter
          </Button>
          <Button
            size="small"
            startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleExport}
            sx={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
              color: 'text.secondary', border: '1px solid', borderColor: tabBorder,
              borderRadius: 1, px: 1.5, py: 0.5, textTransform: 'uppercase',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* ── Tab bar ── */}
      <Box sx={{
        display: 'flex', alignItems: 'stretch',
        bgcolor: headerBg, borderBottom: 1, borderColor: 'divider',
        flexShrink: 0, overflowX: 'auto',
        '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const count  = tabCounts[tab.key] ?? 0;
          return (
            <Box
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                px: 2.5, py: 1.5, cursor: 'pointer', flexShrink: 0,
                borderBottom: active ? '2px solid' : '2px solid transparent',
                borderColor: active ? (isDark ? '#fff' : '#000') : 'transparent',
                color: active ? activeFg : inactiveFg,
                '&:hover': { color: active ? activeFg : (isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)') },
                transition: 'color 0.15s',
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>
                {tab.label}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: active ? activeFg : inactiveFg, opacity: active ? 1 : 0.65 }}>
                {count}
              </Typography>
            </Box>
          );
        })}

        <Box sx={{ flex: 1 }} />

        {/* Refresh */}
        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1.5 }}>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={refresh} sx={{ color: 'text.secondary' }}>
              <RefreshIcon sx={{ fontSize: 18, animation: spinning ? 'spin 0.8s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Column headers ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        px: 1.5, py: 0.75,
        bgcolor: isDark ? '#0a0a0a' : '#f0f0f0',
        borderBottom: 1, borderColor: 'divider', flexShrink: 0,
      }}>
        <Typography variant="caption" sx={{ width: 70, color: 'text.disabled', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Created
        </Typography>
        <Typography variant="caption" sx={{ flex: 1, pl: 2.5, color: 'text.disabled', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Load # · Route
        </Typography>
        <Typography variant="caption" sx={{ pr: 4, color: 'text.disabled', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Status
        </Typography>
      </Box>

      {/* ── Rows ── */}
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
          tabItems.map((item, idx) => (
            <LoadRow
              key={item.id || idx}
              item={item}
              onClick={() => handleRowClick(item)}
              showProgress={showProgress}
            />
          ))
        )}
      </Box>

      {/* ── Floating ADD button ── */}
      <Box sx={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/carrier/loads')}
          sx={{
            bgcolor: '#FF8C00', color: '#fff',
            '&:hover': { bgcolor: '#E07800' },
            fontWeight: 700, px: 3.5, py: 1.25,
            borderRadius: 3, fontSize: '0.9rem',
            boxShadow: '0 4px 16px rgba(255,140,0,0.45)',
          }}
        >
          ADD
        </Button>
      </Box>

      {/* ── Filter drawer ── */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={(key, val) => setFilters(f => ({ ...f, [key]: val }))}
        onApply={() => { setAppliedFilters({ ...filters }); setFilterOpen(false); }}
        onClear={() => { setFilters({}); setAppliedFilters({}); setFilterOpen(false); }}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Box>
  );
}
