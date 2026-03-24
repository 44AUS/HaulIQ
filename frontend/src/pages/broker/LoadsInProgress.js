import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../../services/api';
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress, Paper,
  Divider, Button,
} from '@mui/material';
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

const STATUS_CONFIG = {
  booked:     { label: 'Booked',         color: 'info' },
  in_transit: { label: 'In Transit',     color: 'success' },
  delivered:  { label: 'Delivered',      color: 'default' },
  available:  { label: 'No Carrier Yet', color: 'default' },
};

const TIMELINE_STEPS = ['Quoted', 'Booked', 'In Transit', 'Delivered'];
const STATUS_STEP = { quoted: 0, booked: 1, in_transit: 2, delivered: 3, available: -1 };

function StatusTimeline({ status }) {
  const current = STATUS_STEP[status] ?? -1;
  if (current < 0) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 2 }}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done   = idx < current;
        const active = idx === current;
        const future = idx > current;
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
                flex: 1, height: 1, mx: 0.5, mb: 2,
                bgcolor: done ? 'success.main' : 'divider',
                borderTop: done ? 'none' : '1px dashed',
                borderColor: 'divider',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
}

function BrokerLoadCard({ load }) {
  const cfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.available;

  return (
    <Card variant="outlined">
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Load #{load.id.slice(0, 8)}</Typography>
            <Typography variant="subtitle2" fontWeight={600}>{load.load_type}</Typography>
          </Box>
          <Chip label={cfg.label} size="small" color={cfg.color} />
        </Box>

        {/* Route */}
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

        {/* Dates */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Pickup: <span style={{ color: 'inherit', fontWeight: 500 }}>{load.pickup_date}</span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Drop: <span style={{ fontWeight: 500 }}>{load.delivery_date}</span>
            </Typography>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {[
            { label: 'Rate', value: `$${(load.rate || 0).toLocaleString()}` },
            { label: 'Miles', value: load.miles },
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

        {/* Carrier */}
        <Paper variant="outlined" sx={{ px: 1.5, py: 1, mb: 1.5 }}>
          {load.carrier_id ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ fontSize: 15, color: 'text.secondary', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  component={Link}
                  to={`/carrier-profile/${load.carrier_id}`}
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

        {/* Commodity */}
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

export default function BrokerLoadsInProgress() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi.brokerActive()
      .then(data => setLoads(Array.isArray(data) ? data : []))
      .catch(() => setLoads([]))
      .finally(() => setLoading(false));
  }, []);

  const inTransitCount = loads.filter(l => l.status === 'in_transit').length;
  const bookedCount    = loads.filter(l => l.status === 'booked').length;
  const availableCount = loads.filter(l => l.status === 'available').length;

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <ActivityIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Loads in Progress</Typography>
        <Chip label={loads.length} size="small" color="primary" />
      </Box>

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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : loads.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
          <ActivityIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>No active loads</Typography>
          <Typography variant="body2" color="text.secondary">Post a load to see it tracked here.</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loads.map(load => <BrokerLoadCard key={load.id} load={load} />)}
        </Box>
      )}
    </Box>
  );
}
