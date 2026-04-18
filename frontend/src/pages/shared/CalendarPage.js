import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow, TrafficLayer } from '@react-google-maps/api';
import {
  Box, Typography, Chip, Skeleton, Paper, Button, Popover,
  IconButton, Drawer, Checkbox, Avatar, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { calendarApi, driversApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';


const GMAPS_LIBS = ['places'];
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const STATUS_COLORS = {
  Unassigned:    { bg: '#9e9e9e', light: '#f5f5f5', text: '#616161' },
  Pending:       { bg: '#9e9e9e', light: '#f5f5f5', text: '#616161' },
  Scheduled:     { bg: '#2a7fff', light: '#e3f0ff', text: '#1558cc' },
  'In Progress': { bg: '#ffce00', light: '#fff8e1', text: '#000000' },
  Completed:     { bg: '#2dd36f', light: '#e6faf0', text: '#1a8c47' },
};

const VIEW_OPTIONS = [
  { value: 'month',  label: 'Month'  },
  { value: 'week',   label: 'Week'   },
  { value: 'day',    label: 'Day'    },
  { value: 'agenda', label: 'Agenda' },
  { value: 'map',    label: 'Map'    },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUS_FILTER_OPTIONS = ['All', 'Pending', 'Scheduled', 'In Progress', 'Completed'];

// ─── US Federal Holidays ──────────────────────────────────────────────────────
function nthWeekday(year, month, weekday, n) {
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d);
    if (date.getMonth() !== month) break;
    if (date.getDay() === weekday && ++count === n) return date;
  }
}
function lastWeekday(year, month, weekday) {
  let last;
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d);
    if (date.getMonth() !== month) break;
    if (date.getDay() === weekday) last = date;
  }
  return last;
}
function getHolidaysForYear(year) {
  return [
    { name: "New Year's Day",            date: new Date(year, 0, 1) },
    { name: 'Martin Luther King Jr. Day', date: nthWeekday(year, 0, 1, 3) },
    { name: "Presidents' Day",            date: nthWeekday(year, 1, 1, 3) },
    { name: 'Memorial Day',               date: lastWeekday(year, 4, 1) },
    { name: 'Juneteenth',                 date: new Date(year, 5, 19) },
    { name: 'Independence Day',           date: new Date(year, 6, 4) },
    { name: 'Labor Day',                  date: nthWeekday(year, 8, 1, 1) },
    { name: 'Columbus Day',               date: nthWeekday(year, 9, 1, 2) },
    { name: 'Veterans Day',               date: new Date(year, 10, 11) },
    { name: 'Thanksgiving Day',           date: nthWeekday(year, 10, 4, 4) },
    { name: 'Christmas Day',              date: new Date(year, 11, 25) },
  ].map(h => ({
    id: `holiday-${year}-${h.name}`,
    title: h.name,
    start: h.date,
    end: h.date,
    allDay: true,
    type: 'holiday',
  }));
}

// ─── Month Picker Popover ─────────────────────────────────────────────────────
function MonthPickerPopover({ anchorEl, open, onClose, date, onSelect }) {
  const theme = useTheme();
  const [pickerYear, setPickerYear] = useState(date.getFullYear());

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', mt: 0.5 } }}
    >
      <Box sx={{ width: 248, p: 2 }}>
        {/* Year navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <IconButton size="small" onClick={() => setPickerYear(y => y - 1)}>
            <IonIcon name="chevron-back-outline" fontSize="small" />
          </IconButton>
          <Typography fontWeight={700} fontSize="0.95rem">{pickerYear}</Typography>
          <IconButton size="small" onClick={() => setPickerYear(y => y + 1)}>
            <IonIcon name="chevron-forward-outline" fontSize="small" />
          </IconButton>
        </Box>
        {/* Month grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5 }}>
          {MONTH_NAMES.map((m, i) => {
            const isSelected = date.getMonth() === i && date.getFullYear() === pickerYear;
            return (
              <Button key={m} size="small"
                onClick={() => { onSelect(new Date(pickerYear, i, 1)); onClose(); }}
                sx={{
                  fontWeight: isSelected ? 700 : 400,
                  bgcolor: isSelected ? theme.palette.primary.main : 'transparent',
                  color: isSelected ? (theme.palette.primary.contrastText || '#fff') : 'text.primary',
                  '&:hover': { bgcolor: isSelected ? theme.palette.primary.dark : 'action.hover' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  py: 0.9,
                  minWidth: 0,
                }}>
                {m}
              </Button>
            );
          })}
        </Box>
      </Box>
    </Popover>
  );
}

// ─── Assigned Driver Dropdown ─────────────────────────────────────────────────
function AssignedDropdown({ drivers, selectedDrivers, onApply }) {
  const [anchorEl, setAnchorEl]   = useState(null);
  const [pending, setPending]     = useState([]);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => { setPending(selectedDrivers); setAnchorEl(e.currentTarget); };
  const toggleAll  = () => setPending([]);
  const toggle     = (id) => setPending(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const allSel     = pending.length === 0;

  const label = selectedDrivers.length === 0 ? 'Assigned'
    : selectedDrivers.length === 1
      ? (drivers.find(d => d.id === selectedDrivers[0])?.full_name || drivers.find(d => d.id === selectedDrivers[0])?.email || 'Driver')
      : `${selectedDrivers.length} Drivers`;

  return (
    <>
      <Button size="small" endIcon={<IonIcon name="chevron-down-outline" sx={{ fontSize: 15 }} />}
        onClick={handleOpen}
        sx={{
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          bgcolor: selectedDrivers.length > 0 ? 'primary.main' : 'background.default',
          color: '#fff',
          borderRadius: '8px', px: 1.5, py: 0.55,
          boxShadow: '0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12)',
          '&:hover': { bgcolor: selectedDrivers.length > 0 ? 'primary.dark' : 'background.paper', color: selectedDrivers.length > 0 ? '#fff' : 'text.primary' },
        }}>
        {label}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', mt: 0.5, width: 220 } }}
      >
        <Box sx={{ py: 0.5 }}>
          {/* All option */}
          <Box onClick={toggleAll}
            sx={{ px: 2, py: 0.9, display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer',
              bgcolor: allSel ? 'action.selected' : 'transparent', '&:hover': { bgcolor: 'action.hover' } }}>
            <Checkbox size="small" checked={allSel} onChange={toggleAll} onClick={e => e.stopPropagation()} sx={{ p: 0 }} />
            <Typography variant="body2" fontWeight={allSel ? 700 : 400}>All</Typography>
          </Box>
          {/* Driver list */}
          <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {drivers.map(d => {
              const checked = pending.includes(d.id);
              const name = d.full_name || d.email || `Driver ${d.id}`;
              return (
                <Box key={d.id} onClick={() => toggle(d.id)}
                  sx={{ px: 2, py: 0.9, display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' } }}>
                  <Checkbox size="small" checked={checked} onChange={() => toggle(d.id)} onClick={e => e.stopPropagation()} sx={{ p: 0 }} />
                  <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', bgcolor: 'primary.main', flexShrink: 0 }}>
                    {name[0]?.toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" noWrap>{name}</Typography>
                </Box>
              );
            })}
            {drivers.length === 0 && (
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="caption" color="text.disabled">No drivers assigned</Typography>
              </Box>
            )}
          </Box>
          {/* Apply */}
          <Box sx={{ px: 2, pt: 1, pb: 1.5, borderTop: 1, borderColor: 'divider', mt: 0.5 }}>
            <Button variant="contained" size="small" fullWidth
              onClick={() => { onApply(pending); setAnchorEl(null); }}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', py: 0.75 }}>
              Apply
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}

// ─── Filter Drawer ─────────────────────────────────────────────────────────────
function CalendarFilterDrawer({ open, onClose, filters, onChange, onApply, onClear }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: 280, bgcolor: isDark ? '#1a1a1a' : '#fff', borderRadius: 0 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1.05rem' }}>Filter</Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button size="small" onClick={onClear} sx={{ color: 'error.main', fontWeight: 700, minWidth: 0, px: 0.5, fontSize: '0.8rem' }}>CLEAR</Button>
            <Button size="small" variant="contained" onClick={onApply}
              sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' }, fontWeight: 700, px: 2, fontSize: '0.8rem', minWidth: 0 }}>
              APPLY
            </Button>
          </Box>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
          <Box sx={{ px: 2.5, py: 1.25 }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 1, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {STATUS_FILTER_OPTIONS.map(s => (
                <Box key={s} onClick={() => onChange('status', s)}
                  sx={{ px: 1.5, py: 0.75, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                    bgcolor: filters.status === s ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' } }}>
                  <Checkbox size="small" checked={filters.status === s} sx={{ p: 0 }} readOnly />
                  <Typography variant="body2" fontWeight={filters.status === s ? 700 : 400}>{s}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

// ─── MUI Month Grid ───────────────────────────────────────────────────────────
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVT_H   = 20; // event bar height px
const EVT_GAP = 3;  // gap between bars
const DAY_NUM_H = 34; // space reserved for day number

function processWeekSpans(week, allEvents) {
  const weekStart = new Date(week[0]); weekStart.setHours(0, 0, 0, 0);
  const weekEnd   = new Date(week[6]); weekEnd.setHours(23, 59, 59, 999);

  const overlapping = allEvents
    .filter(evt => {
      const s = new Date(evt.start); s.setHours(0, 0, 0, 0);
      const e = new Date(evt.end || evt.start); e.setHours(23, 59, 59, 999);
      return s <= weekEnd && e >= weekStart;
    })
    .sort((a, b) => {
      const diff = new Date(a.start) - new Date(b.start);
      if (diff !== 0) return diff;
      // longer events first within same start day
      return (new Date(b.end || b.start) - new Date(b.start)) -
             (new Date(a.end || a.start) - new Date(a.start));
    });

  const slotRanges = [];

  return overlapping.map(evt => {
    const s = new Date(evt.start); s.setHours(0, 0, 0, 0);
    const e = new Date(evt.end || evt.start); e.setHours(23, 59, 59, 999);

    const colStart = s < weekStart ? 0 : (() => {
      const idx = week.findIndex(d => {
        const wd = new Date(d); wd.setHours(0, 0, 0, 0);
        return wd.getTime() === s.getTime();
      });
      return idx === -1 ? 0 : idx;
    })();

    const colEnd = e > weekEnd ? 6 : (() => {
      let last = colStart;
      for (let i = 0; i < 7; i++) {
        const wd = new Date(week[i]); wd.setHours(0, 0, 0, 0);
        if (wd <= e) last = i;
      }
      return last;
    })();

    // Assign lowest non-conflicting slot
    let slot = 0;
    while (true) {
      const ranges = slotRanges[slot] || [];
      if (!ranges.some(r => !(r.colEnd < colStart || r.colStart > colEnd))) break;
      slot++;
    }
    if (!slotRanges[slot]) slotRanges[slot] = [];
    slotRanges[slot].push({ colStart, colEnd });

    return { evt, colStart, colEnd, slot, startsThisWeek: s >= weekStart, endsThisWeek: e <= weekEnd };
  });
}

function MonthGrid({ date, allEvents, onSelectEvent, onDayClick }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const year  = date.getFullYear();
  const month = date.getMonth();

  const weeks = useMemo(() => {
    const first = new Date(year, month, 1);
    const cur = new Date(first);
    cur.setDate(cur.getDate() - cur.getDay());
    const rows = [];
    for (let w = 0; w < 6; w++) {
      rows.push(Array.from({ length: 7 }, () => {
        const d = new Date(cur);
        cur.setDate(cur.getDate() + 1);
        return d;
      }));
    }
    return rows;
  }, [year, month]);

  const today = new Date();
  const isToday = d =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth()    === today.getMonth()    &&
    d.getDate()     === today.getDate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 920 }}>
      {/* Day-of-week header */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        {DAY_HEADERS.map(h => (
          <Box key={h} sx={{ py: 1.25, textAlign: 'center' }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
              {h}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Week rows */}
      <Box sx={{ flex: 1, display: 'grid', gridTemplateRows: 'repeat(6, 1fr)' }}>
        {weeks.map((week, wi) => {
          const spans = processWeekSpans(week, allEvents);
          const maxSlot = spans.length > 0 ? Math.max(...spans.map(s => s.slot)) : -1;
          const eventsAreaH = maxSlot >= 0 ? DAY_NUM_H + (maxSlot + 1) * (EVT_H + EVT_GAP) : DAY_NUM_H;

          return (
            <Box key={wi} sx={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              borderBottom: wi < 5 ? 1 : 0,
              borderColor: 'divider',
            }}>
              {/* Day cells — just backgrounds, borders, and day numbers */}
              {week.map((day, di) => {
                const inMonth   = day.getMonth() === month;
                const todayCell = isToday(day);
                return (
                  <Box key={di} sx={{
                    pt: '6px', px: '8px',
                    pb: `${Math.max(eventsAreaH - DAY_NUM_H + 8, 8)}px`,
                    borderRight: di < 6 ? 1 : 0,
                    borderColor: 'divider',
                    bgcolor: !inMonth ? (isDark ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.025)') : 'transparent',
                    minHeight: 100,
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Box onClick={() => onDayClick(day)} sx={{
                        width: 26, height: 26,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%', cursor: 'pointer',
                        bgcolor: todayCell ? theme.palette.primary.main : 'transparent',
                        '&:hover': { bgcolor: todayCell ? theme.palette.primary.dark : 'action.hover' },
                        transition: 'background-color 0.15s',
                      }}>
                        <Typography sx={{
                          fontSize: '0.8rem',
                          fontWeight: todayCell ? 800 : inMonth ? 500 : 400,
                          color: todayCell ? (theme.palette.primary.contrastText || '#fff') : inMonth ? 'text.primary' : 'text.disabled',
                          lineHeight: 1, userSelect: 'none',
                        }}>
                          {day.getDate()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}

              {/* Spanning event bars */}
              {spans.map(({ evt, colStart, colEnd, slot, startsThisWeek, endsThisWeek }) => {
                const isHoliday = evt.type === 'holiday';
                const statusColor = STATUS_COLORS[evt.status] || STATUS_COLORS.Pending;
                const bg = isHoliday ? theme.palette.primary.main : statusColor.bg;
                const textColor = isHoliday ? (theme.palette.primary.contrastText || '#fff') : statusColor.text;
                const top     = DAY_NUM_H + slot * (EVT_H + EVT_GAP);
                const lPad    = startsThisWeek ? 3 : 0;
                const rPad    = endsThisWeek   ? 3 : 0;
                const rLeft   = startsThisWeek ? 4 : 0;
                const rRight  = endsThisWeek   ? 4 : 0;

                return (
                  <Box key={`${evt.id}-w${wi}`}
                    onClick={() => !isHoliday && onSelectEvent(evt)}
                    sx={{
                      position: 'absolute',
                      top,
                      left:  `calc(${colStart * (100 / 7)}% + ${lPad}px)`,
                      width: `calc(${(colEnd - colStart + 1) * (100 / 7)}% - ${lPad + rPad}px)`,
                      height: EVT_H,
                      bgcolor: bg,
                      color: textColor,
                      borderRadius: `${rLeft}px ${rRight}px ${rRight}px ${rLeft}px`,
                      fontSize: '0.68rem', fontWeight: 600,
                      px: 0.75,
                      display: 'flex', alignItems: 'center',
                      overflow: 'hidden', whiteSpace: 'nowrap',
                      cursor: isHoliday ? 'default' : 'pointer',
                      opacity: isHoliday ? 0.82 : 1,
                      zIndex: 1,
                      transition: 'filter 0.1s',
                      '&:hover': !isHoliday ? { filter: 'brightness(0.88)' } : {},
                    }}>
                    {(startsThisWeek || colStart === 0) && evt.title}
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}


// ─── Map Layers Panel ─────────────────────────────────────────────────────────
const MAP_LAYERS = [
  { key: 'satellite', label: 'Satellite', Icon: SatelliteAltIcon },
  { key: 'traffic',   label: 'Live Traffic', Icon: TrafficIcon },
];

function MapLayersPanel({ pending, onToggle, onApply, isDark }) {
  const bg       = isDark ? '#2a2a2a' : '#ffffff';
  const divider  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textCol  = isDark ? '#ffffff' : '#0D1B2A';
  const iconCol  = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';
  const hoverBg  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const chkColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';

  return (
    <Box sx={{
      position: 'absolute', top: 'calc(44px + 10px)', left: 10, zIndex: 10,
      width: 260, bgcolor: bg, borderRadius: '10px',
      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.55)' : '0 4px 24px rgba(0,0,0,0.18)',
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2, pb: 1.5 }}>
        <Typography sx={{ color: textCol, fontWeight: 700, fontSize: '1.1rem' }}>Layers</Typography>
        <Button variant="contained" size="small" onClick={onApply}
          sx={{ bgcolor: '#2dd36f', '&:hover': { bgcolor: '#27bc61' }, fontWeight: 700, fontSize: '0.78rem', px: 2, py: 0.5, borderRadius: '6px', letterSpacing: '0.04em' }}>
          APPLY
        </Button>
      </Box>
      {/* Layer rows */}
      {MAP_LAYERS.map(({ key, label, Icon }, i) => (
        <Box key={key} onClick={() => onToggle(key)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.6,
            borderTop: i > 0 ? `1px solid ${divider}` : 'none',
            cursor: 'pointer', '&:hover': { bgcolor: hoverBg },
          }}>
          <Checkbox
            checked={pending[key]}
            onChange={() => onToggle(key)}
            onClick={e => e.stopPropagation()}
            sx={{
              p: 0, color: chkColor,
              '&.Mui-checked': { color: '#2dd36f' },
              '& .MuiSvgIcon-root': { fontSize: 22 },
            }}
          />
          <Typography sx={{ color: textCol, fontWeight: 500, fontSize: '1rem', flex: 1 }}>{label}</Typography>
          <Icon sx={{ color: iconCol, fontSize: 22 }} />
        </Box>
      ))}
      <Box sx={{ height: 6 }} />
    </Box>
  );
}

// ─── Map View ─────────────────────────────────────────────────────────────────
function MapView({ events, mapsLoaded, mapMarker, setMapMarker }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [layersOpen, setLayersOpen] = useState(false);
  const [pending, setPending]       = useState({ satellite: false, traffic: false });
  const [applied, setApplied]       = useState({ satellite: false, traffic: false });

  const mapEvents = events.filter(e => e.pickup_lat && e.pickup_lng);
  const center = mapEvents.length > 0
    ? { lat: mapEvents[0].pickup_lat, lng: mapEvents[0].pickup_lng }
    : { lat: 39.5, lng: -98.35 };

  const handleToggle = (key) => setPending(p => ({ ...p, [key]: !p[key] }));
  const handleApply  = () => { setApplied({ ...pending }); setLayersOpen(false); };

  if (!mapsLoaded) {
    return (
      <Box sx={{ height: 920, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">Loading map...</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ position: 'relative', width: '100%', height: 920 }}>
      {/* ── Layers tab button ── */}
      <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <Box
          onClick={() => { setPending({ ...applied }); setLayersOpen(o => !o); }}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            px: 2, height: 38, borderRadius: '8px',
            bgcolor: isDark ? (layersOpen ? '#333' : '#2a2a2a') : (layersOpen ? '#f0f0f0' : '#ffffff'),
            boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 10px rgba(0,0,0,0.16)',
            cursor: 'pointer',
            '&:hover': { bgcolor: isDark ? '#333' : '#f5f5f5' },
            transition: 'background-color 0.15s',
            userSelect: 'none',
          }}>
          <IonIcon name="layers-outline" sx={{ fontSize: 17, color: layersOpen ? '#2dd36f' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)') }} />
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: layersOpen ? '#2dd36f' : (isDark ? '#fff' : '#0D1B2A') }}>
            Layers
          </Typography>
        </Box>
      </Box>

      {/* ── Layers panel dropdown ── */}
      {layersOpen && (
        <MapLayersPanel pending={pending} onToggle={handleToggle} onApply={handleApply} isDark={isDark} />
      )}

      {/* ── Click-away to close ── */}
      {layersOpen && (
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 9 }} onClick={() => setLayersOpen(false)} />
      )}

      <GoogleMap
        mapContainerStyle={{ width: '100%', height: 920 }}
        center={center}
        zoom={mapEvents.length > 0 ? 5 : 4}
        mapTypeId={applied.satellite ? 'hybrid' : 'roadmap'}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}>
        {applied.traffic && <TrafficLayer />}
        {mapEvents.map(event => {
          const c = STATUS_COLORS[event.status] || STATUS_COLORS.Pending;
          return [
            <Marker key={`pickup-${event.id}`}
              position={{ lat: event.pickup_lat, lng: event.pickup_lng }}
              onClick={() => setMapMarker({ event, type: 'pickup' })}
              icon={{ url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='36' viewBox='0 0 28 36'><path d='M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z' fill='${encodeURIComponent(c.bg)}'/><circle cx='14' cy='14' r='6' fill='white'/></svg>`, scaledSize: { width: 28, height: 36 }, anchor: { x: 14, y: 36 } }}
            />,
            event.delivery_lat && event.delivery_lng ? (
              <Marker key={`delivery-${event.id}`}
                position={{ lat: event.delivery_lat, lng: event.delivery_lng }}
                onClick={() => setMapMarker({ event, type: 'delivery' })}
                icon={{ url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='30' viewBox='0 0 28 36'><path d='M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z' fill='white' stroke='${encodeURIComponent(c.bg)}' stroke-width='3'/><circle cx='14' cy='14' r='5' fill='${encodeURIComponent(c.bg)}'/></svg>`, scaledSize: { width: 24, height: 30 }, anchor: { x: 12, y: 30 } }}
              />
            ) : null,
          ];
        })}
        {mapMarker && (
          <InfoWindow
            position={mapMarker.type === 'pickup'
              ? { lat: mapMarker.event.pickup_lat, lng: mapMarker.event.pickup_lng }
              : { lat: mapMarker.event.delivery_lat, lng: mapMarker.event.delivery_lng }}
            onCloseClick={() => setMapMarker(null)}>
            <Box sx={{ minWidth: 180, p: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                {mapMarker.type === 'pickup' ? 'Pickup' : 'Delivery'}
              </Typography>
              <Typography variant="body2" fontWeight={600}>{mapMarker.event.origin} → {mapMarker.event.destination}</Typography>
              <Typography variant="body2" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>
                ${mapMarker.event.rate?.toLocaleString()}
              </Typography>
              <Box sx={{ mt: 0.75 }}>
                <Chip label={mapMarker.event.status} size="small"
                  sx={{ bgcolor: (STATUS_COLORS[mapMarker.event.status] || STATUS_COLORS.Pending).bg, color: '#fff', fontWeight: 600, fontSize: '0.68rem', height: 20 }} />
              </Box>
            </Box>
          </InfoWindow>
        )}
      </GoogleMap>
    </Box>
  );
}

// ─── Main CalendarPage ────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const theme      = useTheme();
  const isDark     = theme.palette.mode === 'dark';

  const [view, setView]           = useState('month');
  const [date, setDate]           = useState(new Date());
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [mapMarker, setMapMarker] = useState(null);
  const [drivers, setDrivers]     = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters]     = useState({ status: 'All' });
  const [appliedFilters, setAppliedFilters] = useState({ status: 'All' });

  // Month picker popover
  const [pickerAnchor, setPickerAnchor] = useState(null);
  const pickerOpen = Boolean(pickerAnchor);

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
    libraries: GMAPS_LIBS,
  });

  const loadEvents = useCallback(() => {
    setLoading(true);
    calendarApi.events()
      .then(data => {
        setEvents(
          (Array.isArray(data) ? data : [])
            .filter(e => e.start)
            .map(e => ({ ...e, start: new Date(e.start), end: e.end ? new Date(e.end) : new Date(e.start) }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    if (user?.role === 'carrier') {
      driversApi.list().then(d => setDrivers(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }, [user?.role]);

  // Holidays
  const holidays = useMemo(() => {
    const y = date.getFullYear();
    return [y - 1, y, y + 1, y + 2].flatMap(getHolidaysForYear);
  }, [date.getFullYear()]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter events by driver + status
  const filteredEvents = useMemo(() => {
    let evts = events;
    if (selectedDrivers.length > 0) {
      evts = evts.filter(e => selectedDrivers.includes(e.driver_id));
    }
    if (appliedFilters.status && appliedFilters.status !== 'All') {
      evts = evts.filter(e => e.status === appliedFilters.status);
    }
    return evts;
  }, [events, selectedDrivers, appliedFilters]);

  const allEvents = useMemo(() => [...filteredEvents, ...holidays], [filteredEvents, holidays]);

  // Monthly paid revenue
  const monthRevenue = useMemo(() => {
    const y = date.getFullYear();
    const m = date.getMonth();
    return filteredEvents
      .filter(e => {
        const s = new Date(e.start);
        return s.getFullYear() === y && s.getMonth() === m && e.status === 'Completed';
      })
      .reduce((sum, e) => sum + (Number(e.rate) || 0), 0);
  }, [filteredEvents, date]);

  const handleEventClick = useCallback((event) => {
    if (event.type === 'holiday') return;
    const path = user?.role === 'carrier'
      ? (event.booking_id ? `/carrier/active/${event.booking_id}` : `/carrier/loads/${event.load_id}`)
      : `/broker/loads/${event.load_id}`;
    navigate(path);
  }, [user?.role, navigate]);

  const handleDayClick = useCallback((day) => {
    setDate(day);
    setView('day');
  }, []);

  const prev = () => {
    if (view === 'month' || view === 'agenda') setDate(d => subMonths(d, 1));
    else if (view === 'week') setDate(d => subWeeks(d, 1));
    else setDate(d => subDays(d, 1));
  };
  const next = () => {
    if (view === 'month' || view === 'agenda') setDate(d => addMonths(d, 1));
    else if (view === 'week') setDate(d => addWeeks(d, 1));
    else setDate(d => addDays(d, 1));
  };

  const eventPropGetter = useCallback((event) => {
    if (event.type === 'holiday') {
      return { style: { backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText || '#fff', border: 'none', borderRadius: 6, fontSize: '0.73rem', fontWeight: 600, padding: '2px 8px', cursor: 'default', opacity: 0.85 } };
    }
    const c = STATUS_COLORS[event.status] || STATUS_COLORS.Pending;
    return { style: { backgroundColor: c.bg, color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.73rem', fontWeight: 600, padding: '2px 8px', cursor: 'pointer' } };
  }, [theme.palette.primary.main, theme.palette.primary.contrastText]);

  const calSx = {
    '& .rbc-calendar': { color: 'text.primary', fontFamily: 'inherit' },
    '& .rbc-toolbar': { display: 'none' },
    '& .rbc-month-view, & .rbc-time-view, & .rbc-agenda-view': { border: 0 },
    '& .rbc-header': { borderBottom: 1, borderColor: 'divider', py: '10px', fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary', bgcolor: 'background.paper' },
    '& .rbc-day-bg + .rbc-day-bg': { borderLeft: 1, borderColor: 'divider' },
    '& .rbc-month-row + .rbc-month-row': { borderTop: 1, borderColor: 'divider' },
    '& .rbc-today': { bgcolor: isDark ? `${theme.palette.primary.main}14` : `${theme.palette.primary.main}0a` },
    '& .rbc-off-range-bg': { bgcolor: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.025)' },
    '& .rbc-date-cell': { py: '4px', px: '8px', textAlign: 'right', fontSize: '0.8rem', color: 'text.secondary' },
    '& .rbc-date-cell.rbc-now button': { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', bgcolor: theme.palette.primary.main, color: '#fff !important', fontWeight: '800 !important', fontSize: '0.8rem' },
    '& .rbc-event': { borderRadius: '6px !important', outline: 'none !important' },
    '& .rbc-event.rbc-selected': { outline: 'none !important', filter: 'brightness(0.88)' },
    '& .rbc-show-more': { color: 'primary.main', fontWeight: 600, fontSize: '0.73rem', bgcolor: 'transparent', border: 0, cursor: 'pointer', pl: 1 },
    '& .rbc-time-header': { borderBottom: 1, borderColor: 'divider' },
    '& .rbc-time-content': { borderTop: 1, borderColor: 'divider' },
    '& .rbc-timeslot-group': { borderBottom: '1px solid', borderColor: 'divider' },
    '& .rbc-time-slot': { color: 'text.disabled', fontSize: '0.72rem' },
    '& .rbc-current-time-indicator': { bgcolor: theme.palette.primary.main },
    '& .rbc-allday-cell': { bgcolor: 'background.paper' },
    '& .rbc-day-slot .rbc-time-slot': { borderTop: '1px solid', borderColor: 'divider' },
    '& .rbc-agenda-view table': { width: '100%', borderCollapse: 'collapse' },
    '& .rbc-agenda-view table thead th': { py: '8px', px: '12px', textAlign: 'left', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', bgcolor: 'background.paper' },
    '& .rbc-agenda-view table tbody tr': { borderBottom: '1px solid', borderColor: 'divider' },
    '& .rbc-agenda-view table tbody td': { py: '10px', px: '12px', fontSize: '0.82rem' },
    '& .rbc-agenda-date-cell': { fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap' },
    '& .rbc-agenda-time-cell': { color: 'text.secondary', whiteSpace: 'nowrap' },
    '& .rbc-agenda-event-cell': { color: 'text.primary' },
    '& .rbc-agenda-empty': { py: 4, textAlign: 'center', color: 'text.secondary' },
  };

  const hasFilter = appliedFilters.status !== 'All';

  return (
    <Box sx={{ p: '4px 6px', position: 'relative' }}>
      <Paper elevation={0} sx={{ borderRadius: '6px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', border: 'none' }}>

        {/* ── Row 1: Month picker + View toggle (left) | Filter (right) ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5 }}>
          {/* Left: month picker + view toggle side by side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              onClick={e => setPickerAnchor(e.currentTarget)}
              endIcon={<IonIcon name="chevron-down-outline" sx={{ fontSize: 16 }} />}
              sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'none', color: 'text.primary', px: 1, py: 0.5, borderRadius: '8px', '&:hover': { bgcolor: 'action.hover' } }}>
              {MONTH_FULL[date.getMonth()]} {date.getFullYear()}
            </Button>
            <MonthPickerPopover
              anchorEl={pickerAnchor}
              open={pickerOpen}
              onClose={() => setPickerAnchor(null)}
              date={date}
              onSelect={d => { setDate(d); setView('month'); }}
            />

            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, v) => v && setView(v)}
              size="small"
              sx={{
                bgcolor: 'background.default',
                borderRadius: '10px',
                p: '3px',
                gap: '2px',
                '& .MuiToggleButtonGroup-grouped': {
                  border: '0 !important',
                  borderRadius: '8px !important',
                  mx: 0,
                },
                '& .MuiToggleButton-root': {
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 2,
                  py: 0.55,
                  color: 'rgba(255,255,255,0.55)',
                  '&.Mui-selected': {
                    bgcolor: 'background.paper',
                    color: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    '&:hover': { bgcolor: 'background.paper' },
                  },
                  '&:hover': { bgcolor: 'transparent', color: '#fff' },
                },
              }}
            >
              {VIEW_OPTIONS.map(({ value, label }) => (
                <ToggleButton key={value} value={value} disableRipple>{label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Right: filter button */}
          <Button size="small" startIcon={<IonIcon name="funnel-outline" sx={{ fontSize: 15 }} />}
            onClick={() => setFilterOpen(true)}
            sx={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
              bgcolor: hasFilter ? 'primary.main' : 'background.default',
              color: '#fff',
              borderRadius: '8px', px: 1.5, py: 0.55, textTransform: 'uppercase',
              boxShadow: '0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12)',
              '&:hover': { bgcolor: hasFilter ? 'primary.dark' : 'background.paper', color: hasFilter ? '#fff' : 'text.primary' },
            }}>
            Filter
          </Button>
        </Box>

        {/* ── Row 2: Nav arrows + Assigned + Revenue ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
          {/* Left: arrows + assigned */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={prev} sx={{ color: '#fff' }}>
              <IonIcon name="chevron-back-outline" fontSize="small" />
            </IconButton>
            <Button size="small" onClick={() => setDate(new Date())}
              sx={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'none', color: '#fff', px: 1.5, py: 0.5, borderRadius: '8px', minWidth: 0, '&:hover': { bgcolor: 'action.hover' } }}>
              Today
            </Button>
            <IconButton size="small" onClick={next} sx={{ color: '#fff' }}>
              <IonIcon name="chevron-forward-outline" fontSize="small" />
            </IconButton>
            {user?.role === 'carrier' && (
              <AssignedDropdown
                drivers={drivers}
                selectedDrivers={selectedDrivers}
                onApply={setSelectedDrivers}
              />
            )}
          </Box>

          {/* Right: revenue */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
              {MONTH_FULL[date.getMonth()]}
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#2dd36f', lineHeight: 1.2 }}>
              ${monthRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>

        {/* ── Calendar content ── */}
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={650} sx={{ borderRadius: 1 }} />
          </Box>
        ) : view === 'map' ? (
          <MapView events={filteredEvents} mapsLoaded={mapsLoaded} mapMarker={mapMarker} setMapMarker={setMapMarker} />
        ) : view === 'month' ? (
          <MonthGrid date={date} allEvents={allEvents} onSelectEvent={handleEventClick} onDayClick={handleDayClick} />
        ) : (
          <Box sx={calSx}>
            <Calendar
              localizer={localizer}
              events={allEvents}
              view={view}
              date={date}
              onNavigate={setDate}
              onView={setView}
              eventPropGetter={eventPropGetter}
              onSelectEvent={handleEventClick}
              style={{ height: 920 }}
              popup
            />
          </Box>
        )}
      </Paper>

      <CalendarFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
        onApply={() => { setAppliedFilters({ ...filters }); setFilterOpen(false); }}
        onClear={() => { setFilters({ status: 'All' }); setAppliedFilters({ status: 'All' }); setFilterOpen(false); }}
      />

      {/* ── Find Loads FAB (carrier only) ── */}
      {user?.role === 'carrier' && (
        <Box sx={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <Button variant="contained" startIcon={<IonIcon name="search-outline" sx={{ fontSize: 17 }} />} onClick={() => navigate('/carrier/loads')}
            sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' }, fontWeight: 700, px: 2.5, py: 0.9, borderRadius: '8px', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}>
            Find Loads
          </Button>
        </Box>
      )}
    </Box>
  );
}
