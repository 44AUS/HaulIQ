import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../../services/api';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress, Paper,
  Button, ToggleButtonGroup, ToggleButton, Table, TableHead, TableRow,
  TableCell, TableBody,
} from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ListIcon from '@mui/icons-material/List';
import MapIcon from '@mui/icons-material/Map';
import PlaceIcon from '@mui/icons-material/Place';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import AlertCircleIcon from '@mui/icons-material/ErrorOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import InventoryIcon from '@mui/icons-material/Inventory';
import ScaleIcon from '@mui/icons-material/Scale';
import ActivityIcon from '@mui/icons-material/Timeline';
import NavigationIcon from '@mui/icons-material/Navigation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const LIBRARIES = ['places'];

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  scrollwheel: true,
};

const MARKER_COLOR = {
  in_transit: '#22c55e',
  booked:     '#3b82f6',
  available:  '#f97316',
};

const STATUS_CONFIG = {
  booked:     { label: 'Booked',         color: 'info' },
  in_transit: { label: 'In Transit',     color: 'success' },
  delivered:  { label: 'Delivered',      color: 'default' },
  available:  { label: 'No Carrier Yet', color: 'default' },
};

const TIMELINE_STEPS = ['Quoted', 'Booked', 'In Transit', 'Delivered'];
const STATUS_STEP = { quoted: 0, booked: 1, in_transit: 2, delivered: 3, available: -1 };

// ─── Status Timeline ────────────────────────────────────────────────────────
function StatusTimeline({ status }) {
  const current = STATUS_STEP[status] ?? -1;
  if (current < 0) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 2 }}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done   = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={step}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: done || active ? 'success.main' : 'action.disabledBackground',
                border: active ? '2px solid' : 'none',
                borderColor: 'success.light',
                outline: active ? '2px solid rgba(46,125,50,0.25)' : 'none',
              }}>
                {done && <CheckCircleIcon sx={{ fontSize: 14, color: 'white' }} />}
                {active && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />}
              </Box>
              <Typography variant="caption" sx={{
                mt: 0.5, whiteSpace: 'nowrap', fontSize: '0.65rem',
                color: active ? 'success.main' : done ? 'success.light' : 'text.disabled',
                fontWeight: active ? 700 : 400,
              }}>
                {step}
              </Typography>
            </Box>
            {idx < TIMELINE_STEPS.length - 1 && (
              <Box sx={{
                flex: 1, mx: 0.5, mb: 2,
                height: 0,
                borderTop: done ? '2px solid' : '2px dashed',
                borderColor: done ? 'success.main' : 'divider',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
}

// ─── Card View ───────────────────────────────────────────────────────────────
function BrokerLoadCard({ load }) {
  const cfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.available;
  const loadId = load.load_id || load.id;

  return (
    <Card
      variant="outlined"
      component={Link}
      to={`/broker/loads/${loadId}`}
      state={{ from: 'Loads in Progress' }}
      sx={{
        height: '100%',
        textDecoration: 'none',
        display: 'block',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        '&:hover': { boxShadow: 4, borderColor: 'primary.main' },
        cursor: 'pointer',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Load #{load.id.slice(0, 8)}</Typography>
            <Typography variant="subtitle2" fontWeight={600}>{load.load_type}</Typography>
          </Box>
          <Chip label={cfg.label} size="small" color={cfg.color} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PlaceIcon sx={{ fontSize: 11 }} /> Origin
            </Typography>
            <Typography variant="body2" fontWeight={600} noWrap>{load.origin}</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">{load.miles}mi</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
              <PlaceIcon sx={{ fontSize: 11 }} /> Dest
            </Typography>
            <Typography variant="body2" fontWeight={600} noWrap>{load.destination}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Pickup: <span style={{ fontWeight: 500 }}>{load.pickup_date}</span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Drop: <span style={{ fontWeight: 500 }}>{load.delivery_date}</span>
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {[
            { label: 'Rate',     value: `$${(load.rate || 0).toLocaleString()}` },
            { label: 'Miles',    value: load.miles },
            { label: 'Per Mile', value: `$${(load.rate_per_mile || 0).toFixed(2)}` },
          ].map(({ label, value }) => (
            <Grid item xs={4} key={label}>
              <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
                <Typography variant="body2" fontWeight={700}>{value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper variant="outlined" sx={{ px: 1.5, py: 1, mb: 1.5 }}>
          {load.carrier_id ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ fontSize: 15, color: 'text.secondary', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  component={Link}
                  to={`/c/${load.carrier_id?.slice(0, 8)}`}
                  state={{ carrierId: load.carrier_id }}
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {load.carrier_name}
                </Typography>
                {load.carrier_mc && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>MC-{load.carrier_mc}</Typography>
                )}
              </Box>
              <Button
                component={Link}
                to={`/broker/messages?userId=${load.carrier_id}`}
                variant="text"
                size="small"
                startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 13 }} />}
                sx={{ fontSize: '0.7rem', flexShrink: 0 }}
              >
                Message
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AlertCircleIcon sx={{ fontSize: 15, color: 'text.disabled', flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Awaiting carrier assignment
              </Typography>
            </Box>
          )}
        </Paper>

        {load.commodity && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <InventoryIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">{load.commodity}</Typography>
            </Box>
            {load.weight_lbs && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ScaleIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">{Number(load.weight_lbs).toLocaleString()} lbs</Typography>
              </Box>
            )}
          </Box>
        )}

        {load.status === 'available' && (
          <Paper variant="outlined" sx={{ px: 1.5, py: 1, mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              No carrier assigned — load is still open on the board.
            </Typography>
          </Paper>
        )}

        <StatusTimeline status={load.status} />

        {(load.status === 'in_transit' || load.status === 'booked') && load.booking_id && (
          <Button
            component={Link}
            to={`/broker/track/${load.booking_id}`}
            variant={load.status === 'in_transit' ? 'contained' : 'outlined'}
            color={load.status === 'in_transit' ? 'success' : 'inherit'}
            fullWidth
            startIcon={<NavigationIcon />}
            sx={{ mt: 2 }}
          >
            {load.status === 'in_transit' ? 'Track Live Location' : 'View Tracking'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Table View ──────────────────────────────────────────────────────────────
function TableView({ loads }) {
  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              {['Load #', 'Route', 'Status', 'Carrier', 'Rate', 'Pickup', 'Actions'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>No loads found</TableCell>
              </TableRow>
            ) : loads.map((load, idx) => {
              const cfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.available;
              const loadId = load.load_id || load.id;
              return (
                <TableRow key={load.id} sx={{ bgcolor: idx % 2 === 1 ? 'action.hover' : 'inherit' }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                    {String(load.id).slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography
                      component={Link}
                      to={`/broker/loads/${loadId}`}
                      state={{ from: 'Loads in Progress' }}
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {load.origin} → {load.destination}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={cfg.label} size="small" color={cfg.color} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {load.carrier_name ? (
                      <Typography
                        component={Link}
                        to={`/c/${load.carrier_id?.slice(0, 8)}`}
                        state={{ carrierId: load.carrier_id }}
                        variant="body2"
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {load.carrier_name}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>Unassigned</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>${(load.rate || 0).toLocaleString()}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{load.pickup_date}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {(load.status === 'in_transit' || load.status === 'booked') && load.booking_id && (
                        <Button
                          component={Link}
                          to={`/broker/track/${load.booking_id}`}
                          variant="outlined"
                          size="small"
                          startIcon={<NavigationIcon sx={{ fontSize: 13 }} />}
                          color={load.status === 'in_transit' ? 'success' : 'inherit'}
                          sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                        >
                          Track
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}

// ─── Map View ────────────────────────────────────────────────────────────────
function makeMarkerSvg(color) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="14" cy="14" r="5" fill="white"/>
    </svg>`
  )}`;
}

function LoadsMap({ loads, stats }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const mapRef = useRef(null);
  const [selectedLoad, setSelectedLoad] = useState(null);
  // geocodedCoords: { [loadId]: { lat, lng } } for loads without stored coords
  const [geocodedCoords, setGeocodedCoords] = useState({});

  const activLoads = loads.filter(l => l.status !== 'delivered');

  // Geocode any loads that are missing pickup coordinates
  useEffect(() => {
    if (!isLoaded) return;
    const geocoder = new window.google.maps.Geocoder();
    activLoads.forEach(load => {
      if (load.pickup_lat && load.pickup_lng) return;
      if (!load.origin) return;
      geocoder.geocode({ address: load.origin + ', USA' }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          setGeocodedCoords(prev => ({
            ...prev,
            [load.id]: { lat: loc.lat(), lng: loc.lng() },
          }));
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, loads]);

  const getCoords = (load) => {
    if (load.pickup_lat && load.pickup_lng) {
      return { lat: Number(load.pickup_lat), lng: Number(load.pickup_lng) };
    }
    return geocodedCoords[load.id] || null;
  };

  const mappable = activLoads.filter(l => getCoords(l) !== null);

  const fitBounds = useCallback((map) => {
    if (mappable.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    mappable.forEach(l => bounds.extend(getCoords(l)));
    map.fitBounds(bounds, 60);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappable]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    fitBounds(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fit when geocoding resolves new coords
  useEffect(() => {
    if (mapRef.current && mappable.length > 0) fitBounds(mapRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocodedCoords]);

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 600 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: 'calc(100vh - 200px)', minHeight: 500 }}
        zoom={5}
        center={{ lat: 39.5, lng: -98.35 }}
        options={MAP_OPTIONS}
        onLoad={onMapLoad}
      >
        {mappable.map(load => {
          const pos = getCoords(load);
          const color = MARKER_COLOR[load.status] || MARKER_COLOR.available;
          const icon = {
            url: makeMarkerSvg(color),
            scaledSize: new window.google.maps.Size(28, 36),
            anchor: new window.google.maps.Point(14, 36),
          };
          return (
            <Marker
              key={load.id}
              position={pos}
              icon={icon}
              onClick={() => setSelectedLoad(load)}
            />
          );
        })}

        {selectedLoad && (() => {
          const pos = getCoords(selectedLoad);
          if (!pos) return null;
          return (
            <InfoWindow
              position={pos}
              onCloseClick={() => setSelectedLoad(null)}
              options={{ pixelOffset: new window.google.maps.Size(0, -36) }}
            >
              <Box sx={{ minWidth: 200, maxWidth: 260, p: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.25 }}>
                  Load #{selectedLoad.id.slice(0, 8).toUpperCase()}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#111827', mb: 0.5 }}>
                  {selectedLoad.origin} → {selectedLoad.destination}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                  {selectedLoad.load_type} · ${(selectedLoad.rate || 0).toLocaleString()}
                </Typography>
                {selectedLoad.carrier_name && (
                  <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                    Carrier: {selectedLoad.carrier_name}
                  </Typography>
                )}
                <Button
                  component={Link}
                  to={`/broker/loads/${selectedLoad.load_id || selectedLoad.id}`}
                  state={{ from: 'Loads in Progress' }}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1, fontSize: '0.7rem', width: '100%' }}
                >
                  View Load
                </Button>
              </Box>
            </InfoWindow>
          );
        })()}
      </GoogleMap>

      {/* Stats overlay — top-left corner */}
      <Box sx={{
        position: 'absolute', top: 12, left: 12, zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        {stats.map(({ label, value, color, dot }) => (
          <Paper key={label} elevation={3} sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>{label}</Typography>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color, lineHeight: 1.2 }}>{value}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Legend overlay — bottom-left */}
      <Box sx={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 10,
      }}>
        <Paper elevation={3} sx={{ px: 1.5, py: 1, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { color: MARKER_COLOR.in_transit, label: 'In Transit' },
            { color: MARKER_COLOR.booked,     label: 'Booked' },
            { color: MARKER_COLOR.available,  label: 'No Carrier' },
          ].map(({ color, label }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, border: '2px solid white', boxShadow: 1 }} />
              <Typography variant="caption">{label}</Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    </Box>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function BrokerLoadsInProgress() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('cards');

  useEffect(() => {
    bookingsApi.brokerActive()
      .then(data => setLoads(Array.isArray(data) ? data : []))
      .catch(() => setLoads([]))
      .finally(() => setLoading(false));
  }, []);

  const inTransitCount = loads.filter(l => l.status === 'in_transit').length;
  const bookedCount    = loads.filter(l => l.status === 'booked').length;
  const availableCount = loads.filter(l => l.status === 'available').length;

  const mapStats = [
    { label: 'In Transit', value: inTransitCount, color: 'success.main', dot: MARKER_COLOR.in_transit },
    { label: 'Booked',     value: bookedCount,    color: 'info.main',    dot: MARKER_COLOR.booked },
    { label: 'No Carrier', value: availableCount, color: 'text.secondary', dot: MARKER_COLOR.available },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ActivityIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Loads in Progress</Typography>
          <Chip label={loads.length} size="small" color="primary" />
        </Box>

        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          size="small"
        >
          <ToggleButton value="cards" title="Card view">
            <ViewModuleIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
          <ToggleButton value="table" title="List view">
            <ListIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
          <ToggleButton value="map" title="Map view">
            <MapIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Stats — hidden on map view (shown as overlay instead) */}
      {view !== 'map' && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: 'In Transit', value: inTransitCount, color: 'success.main' },
            { label: 'Booked',     value: bookedCount,    color: 'info.main' },
            { label: 'Not Filled', value: availableCount, color: 'text.secondary' },
          ].map(({ label, value, color }) => (
            <Grid item xs={4} key={label}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: '16px !important' }}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : loads.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
          <ActivityIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>No active loads</Typography>
          <Typography variant="body2" color="text.secondary">Post a load to see it tracked here.</Typography>
        </Paper>
      ) : view === 'cards' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {loads.filter(l => l.status !== 'delivered').map(load => <BrokerLoadCard key={load.id} load={load} />)}
        </Box>
      ) : view === 'table' ? (
        <TableView loads={loads.filter(l => l.status !== 'delivered')} />
      ) : (
        <LoadsMap loads={loads} stats={mapStats} />
      )}
    </Box>
  );
}
