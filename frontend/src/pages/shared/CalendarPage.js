import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import {
  Box, Typography, Chip, Skeleton, Paper, Button,
  Dialog, DialogTitle, DialogContent, IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useAuth } from '../../context/AuthContext';
import { calendarApi } from '../../services/api';

const GMAPS_LIBS = ['places'];
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const STATUS_COLORS = {
  Unassigned:    { bg: '#6366f1', light: '#e0e7ff', text: '#4338ca' },
  Pending:       { bg: '#6366f1', light: '#e0e7ff', text: '#4338ca' },
  'In Progress': { bg: '#f97316', light: '#ffedd5', text: '#c2410c' },
  Completed:     { bg: '#22c55e', light: '#dcfce7', text: '#15803d' },
};

const VIEW_OPTIONS = [
  { value: 'agenda', label: 'Agenda' },
  { value: 'month',  label: 'Month'  },
  { value: 'week',   label: 'Week'   },
  { value: 'day',    label: 'Day'    },
  { value: 'map',    label: 'Map'    },
];

function ViewButton({ active, onClick, children }) {
  return (
    <Button
      size="small"
      onClick={onClick}
      sx={{
        minWidth: 0,
        px: 2,
        py: 0.6,
        fontSize: '0.78rem',
        fontWeight: 600,
        textTransform: 'none',
        borderRadius: '20px',
        color: active ? '#fff' : 'text.secondary',
        bgcolor: active ? 'primary.main' : 'transparent',
        '&:hover': { bgcolor: active ? 'primary.dark' : 'action.hover' },
      }}
    >
      {children}
    </Button>
  );
}

function CalendarToolbar({ date, view, onNavigate, onView }) {
  const label = (() => {
    if (view === 'month' || view === 'agenda') return format(date, 'MMMM yyyy');
    if (view === 'week') {
      const start = startOfWeek(date, { locale: enUS });
      return `${format(start, 'MMM d')} – ${format(addDays(start, 6), 'MMM d, yyyy')}`;
    }
    return format(date, 'MMMM d, yyyy');
  })();

  const prev = () => {
    if (view === 'month' || view === 'agenda') onNavigate(subMonths(date, 1));
    else if (view === 'week') onNavigate(subWeeks(date, 1));
    else onNavigate(subDays(date, 1));
  };

  const next = () => {
    if (view === 'month' || view === 'agenda') onNavigate(addMonths(date, 1));
    else if (view === 'week') onNavigate(addWeeks(date, 1));
    else onNavigate(addDays(date, 1));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.25,
        borderBottom: 1,
        borderColor: 'divider',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      {/* Left: nav + label */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onNavigate(new Date())}
          sx={{
            px: 2, py: 0.5, fontSize: '0.78rem', fontWeight: 700,
            textTransform: 'none', borderRadius: '20px', mr: 1,
          }}
        >
          TODAY
        </Button>
        <IconButton size="small" onClick={prev} sx={{ color: 'text.secondary' }}>
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={next} sx={{ color: 'text.secondary' }}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
        <Typography fontWeight={700} fontSize="1rem" sx={{ ml: 1, color: 'text.primary' }}>
          {label}
        </Typography>
      </Box>

      {/* Right: view buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        {VIEW_OPTIONS.map(({ value, label: lbl }) => (
          <ViewButton key={value} active={view === value} onClick={() => onView(value)}>
            {lbl}
          </ViewButton>
        ))}
      </Box>
    </Box>
  );
}

export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mapMarker, setMapMarker] = useState(null);

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
            .map(e => ({
              ...e,
              start: new Date(e.start),
              end: e.end ? new Date(e.end) : new Date(e.start),
            }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const eventPropGetter = useCallback((event) => {
    const c = STATUS_COLORS[event.status] || STATUS_COLORS.Pending;
    return {
      style: {
        backgroundColor: c.bg,
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        fontSize: '0.73rem',
        fontWeight: 600,
        padding: '2px 8px',
        cursor: 'pointer',
      },
    };
  }, []);

  const legend = user?.role === 'broker'
    ? ['Unassigned', 'In Progress', 'Completed']
    : ['Pending', 'In Progress', 'Completed'];

  const calSx = {
    '& .rbc-calendar': { color: 'text.primary', fontFamily: 'inherit' },
    // Hide built-in toolbar (we render our own)
    '& .rbc-toolbar': { display: 'none' },
    '& .rbc-month-view, & .rbc-time-view, & .rbc-agenda-view': { border: 0 },
    '& .rbc-header': {
      borderBottom: 1, borderColor: 'divider', py: '10px',
      fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary',
      bgcolor: 'background.paper',
    },
    '& .rbc-day-bg + .rbc-day-bg': { borderLeft: 1, borderColor: 'divider' },
    '& .rbc-month-row + .rbc-month-row': { borderTop: 1, borderColor: 'divider' },
    '& .rbc-today': { bgcolor: isDark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.04)' },
    '& .rbc-off-range-bg': { bgcolor: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.025)' },
    '& .rbc-date-cell': { py: '4px', px: '8px', textAlign: 'right', fontSize: '0.8rem', color: 'text.secondary' },
    // Orange circle on today's date number
    '& .rbc-date-cell.rbc-now button': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '26px',
      height: '26px',
      borderRadius: '50%',
      bgcolor: '#f97316',
      color: '#fff !important',
      fontWeight: '800 !important',
      fontSize: '0.8rem',
    },
    '& .rbc-event': { borderRadius: '6px !important', outline: 'none !important' },
    '& .rbc-event.rbc-selected': { outline: 'none !important', filter: 'brightness(0.88)' },
    '& .rbc-show-more': {
      color: 'primary.main', fontWeight: 600, fontSize: '0.73rem',
      bgcolor: 'transparent', border: 0, cursor: 'pointer', pl: 1,
    },
    '& .rbc-time-header': { borderBottom: 1, borderColor: 'divider' },
    '& .rbc-time-content': { borderTop: 1, borderColor: 'divider' },
    '& .rbc-timeslot-group': { borderBottom: '1px solid', borderColor: 'divider' },
    '& .rbc-time-slot': { color: 'text.disabled', fontSize: '0.72rem' },
    '& .rbc-current-time-indicator': { bgcolor: '#f97316' },
    '& .rbc-allday-cell': { bgcolor: 'background.paper' },
    '& .rbc-day-slot .rbc-time-slot': { borderTop: '1px solid', borderColor: 'divider' },
    // Agenda view
    '& .rbc-agenda-view table': { width: '100%', borderCollapse: 'collapse' },
    '& .rbc-agenda-view table thead th': {
      py: '8px', px: '12px', textAlign: 'left',
      borderBottom: '1px solid', borderColor: 'divider',
      fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary',
      bgcolor: 'background.paper',
    },
    '& .rbc-agenda-view table tbody tr': {
      borderBottom: '1px solid', borderColor: 'divider',
    },
    '& .rbc-agenda-view table tbody td': { py: '10px', px: '12px', fontSize: '0.82rem' },
    '& .rbc-agenda-date-cell': { fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap' },
    '& .rbc-agenda-time-cell': { color: 'text.secondary', whiteSpace: 'nowrap' },
    '& .rbc-agenda-event-cell': { color: 'text.primary' },
    '& .rbc-agenda-empty': { py: 4, textAlign: 'center', color: 'text.secondary' },
  };

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Calendar</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            {user?.role === 'broker' ? 'All posted loads' : 'Your assigned loads'}
          </Typography>
        </Box>
        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
          {legend.map(s => {
            const c = STATUS_COLORS[s];
            return (
              <Chip key={s} label={s} size="small"
                sx={{
                  bgcolor: c.light, color: c.text,
                  fontWeight: 600, fontSize: '0.7rem',
                  border: `1px solid ${c.bg}40`, height: 24,
                }} />
            );
          })}
        </Box>
      </Box>

      {/* Calendar card */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Custom toolbar — always rendered */}
        <CalendarToolbar
          date={date}
          view={view}
          onNavigate={setDate}
          onView={setView}
        />

        {loading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 1 }} />
          </Box>
        ) : view === 'map' ? (
          <MapView
            events={events}
            mapsLoaded={mapsLoaded}
            mapMarker={mapMarker}
            setMapMarker={setMapMarker}
          />
        ) : (
          <Box sx={calSx}>
            <Calendar
              localizer={localizer}
              events={events}
              view={view}
              date={date}
              onNavigate={setDate}
              onView={setView}
              eventPropGetter={eventPropGetter}
              onSelectEvent={setSelected}
              style={{ height: 650 }}
              popup
            />
          </Box>
        )}
      </Paper>

      {/* Event detail dialog */}
      {selected && (
        <EventDialog
          event={selected}
          user={user}
          navigate={navigate}
          onClose={() => setSelected(null)}
        />
      )}
    </Box>
  );
}

function MapView({ events, mapsLoaded, mapMarker, setMapMarker }) {
  const mapEvents = events.filter(e => e.pickup_lat && e.pickup_lng);
  const center = mapEvents.length > 0
    ? { lat: mapEvents[0].pickup_lat, lng: mapEvents[0].pickup_lng }
    : { lat: 39.5, lng: -98.35 };

  if (!mapsLoaded) {
    return (
      <Box sx={{ height: 650, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">Loading map...</Typography>
      </Box>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: 650 }}
      center={center}
      zoom={mapEvents.length > 0 ? 5 : 4}
      options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
    >
      {mapEvents.map(event => {
        const c = STATUS_COLORS[event.status] || STATUS_COLORS.Pending;
        return [
          <Marker
            key={`pickup-${event.id}`}
            position={{ lat: event.pickup_lat, lng: event.pickup_lng }}
            title={`Pickup: ${event.origin}`}
            onClick={() => setMapMarker({ event, type: 'pickup' })}
            icon={{
              url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='36' viewBox='0 0 28 36'><path d='M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z' fill='${encodeURIComponent(c.bg)}'/><circle cx='14' cy='14' r='6' fill='white'/></svg>`,
              scaledSize: { width: 28, height: 36 },
              anchor: { x: 14, y: 36 },
            }}
          />,
          event.delivery_lat && event.delivery_lng ? (
            <Marker
              key={`delivery-${event.id}`}
              position={{ lat: event.delivery_lat, lng: event.delivery_lng }}
              title={`Delivery: ${event.destination}`}
              onClick={() => setMapMarker({ event, type: 'delivery' })}
              icon={{
                url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='30' viewBox='0 0 28 36'><path d='M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z' fill='white' stroke='${encodeURIComponent(c.bg)}' stroke-width='3'/><circle cx='14' cy='14' r='5' fill='${encodeURIComponent(c.bg)}'/></svg>`,
                scaledSize: { width: 24, height: 30 },
                anchor: { x: 12, y: 30 },
              }}
            />
          ) : null,
        ];
      })}
      {mapMarker && (
        <InfoWindow
          position={
            mapMarker.type === 'pickup'
              ? { lat: mapMarker.event.pickup_lat, lng: mapMarker.event.pickup_lng }
              : { lat: mapMarker.event.delivery_lat, lng: mapMarker.event.delivery_lng }
          }
          onCloseClick={() => setMapMarker(null)}
        >
          <Box sx={{ minWidth: 180, p: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              {mapMarker.type === 'pickup' ? 'Pickup' : 'Delivery'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {mapMarker.event.origin} → {mapMarker.event.destination}
            </Typography>
            {mapMarker.event.commodity && (
              <Typography variant="caption" color="text.secondary" display="block">{mapMarker.event.commodity}</Typography>
            )}
            <Typography variant="body2" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>
              ${mapMarker.event.rate?.toLocaleString()}
            </Typography>
            <Box sx={{ mt: 0.75 }}>
              <Chip
                label={mapMarker.event.status}
                size="small"
                sx={{
                  bgcolor: (STATUS_COLORS[mapMarker.event.status] || STATUS_COLORS.Pending).bg,
                  color: '#fff', fontWeight: 600, fontSize: '0.68rem', height: 20,
                }}
              />
            </Box>
          </Box>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

function EventDialog({ event, user, navigate, onClose }) {
  const c = STATUS_COLORS[event.status] || STATUS_COLORS.Pending;
  const path = user?.role === 'carrier'
    ? (event.booking_id ? `/carrier/active/${event.booking_id}` : `/carrier/loads/${event.load_id}`)
    : `/broker/loads/${event.load_id}`;

  const rows = [
    { label: 'Route', value: `${event.origin} → ${event.destination}` },
    event.commodity && { label: 'Commodity', value: event.commodity },
    { label: 'Rate', value: `$${event.rate?.toLocaleString()}`, bold: true, color: 'success.main' },
    { label: 'Pickup', value: event.start?.toLocaleDateString() },
    { label: 'Delivery', value: event.end?.toLocaleDateString() },
  ].filter(Boolean);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2, borderTop: `4px solid ${c.bg}` } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalShippingIcon sx={{ color: c.bg, fontSize: 20 }} />
        <Typography fontWeight={700} variant="subtitle1" noWrap>{event.origin} → {event.destination}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
            <Chip label={event.status} size="small"
              sx={{ bgcolor: c.light, color: c.text, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${c.bg}30` }} />
          </Box>
          {rows.map(r => (
            <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">{r.label}</Typography>
              <Typography variant="body2" fontWeight={r.bold ? 700 : 500} color={r.color || 'text.primary'}>{r.value}</Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 1.5 }}>
        <Button size="small" onClick={onClose}>Close</Button>
        <Button variant="contained" size="small" onClick={() => { navigate(path); onClose(); }}>View Load</Button>
      </Box>
    </Dialog>
  );
}
