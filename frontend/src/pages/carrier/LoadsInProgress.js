import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InventoryIcon from '@mui/icons-material/Inventory';
import ScaleIcon from '@mui/icons-material/Scale';
import ActivityIcon from '@mui/icons-material/Timeline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { bookingsApi } from '../../services/api';

const STATUS_CONFIG = {
  quoted:     { label: 'Awaiting Response', color: 'warning' },
  booked:     { label: 'Booked',            color: 'info' },
  in_transit: { label: 'In Transit',        color: 'success' },
  delivered:  { label: 'Delivered',         color: 'default' },
};

const TIMELINE_STEPS = ['Quoted', 'Booked', 'In Transit', 'Delivered'];
const STATUS_STEP = { quoted: 0, booked: 1, in_transit: 2, delivered: 3 };

function StatusTimeline({ status }) {
  const current = STATUS_STEP[status] ?? 0;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 2 }}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={step}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: done || active ? 'primary.main' : 'action.disabledBackground',
                border: active ? '2px solid' : 'none',
                borderColor: 'primary.light',
                boxShadow: active ? '0 0 0 3px rgba(21,101,192,0.15)' : 'none',
              }}>
                {done && (
                  <Box component="svg" sx={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </Box>
                )}
                {active && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  whiteSpace: 'nowrap',
                  fontSize: '0.6rem',
                  color: active ? 'primary.main' : done ? 'primary.light' : 'text.disabled',
                  fontWeight: active ? 700 : 400,
                }}
              >
                {step}
              </Typography>
            </Box>
            {idx < TIMELINE_STEPS.length - 1 && (
              <Box sx={{
                flex: 1,
                height: 1,
                mx: 0.5,
                mb: 2,
                bgcolor: done ? 'primary.main' : 'divider',
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

function LoadProgressCard({ load, onClick }) {
  const cfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.quoted;

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: 'pointer',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)', transition: 'all 0.2s' },
        transition: 'all 0.2s',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Load #{load.id.slice(0, 8)}</Typography>
            <Typography variant="body2" fontWeight={600}>{load.load_type}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={cfg.label} size="small" color={cfg.color} />
            <ChevronRightIcon fontSize="small" color="action" />
          </Box>
        </Box>

        {/* Route */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <LocationOnIcon sx={{ fontSize: 10 }} color="action" />
              <Typography variant="caption" color="text.secondary">Origin</Typography>
            </Box>
            <Typography variant="body2" fontWeight={600} noWrap>{load.origin}</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ArrowForwardIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">{load.miles}mi</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mb: 0.5 }}>
              <LocationOnIcon sx={{ fontSize: 10 }} color="action" />
              <Typography variant="caption" color="text.secondary">Dest</Typography>
            </Box>
            <Typography variant="body2" fontWeight={600} noWrap>{load.destination}</Typography>
          </Box>
        </Box>

        {/* Dates */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 10 }} color="action" />
            <Typography variant="caption" color="text.secondary">
              Pickup: <Box component="span" sx={{ color: 'text.primary' }}>{load.pickup_date}</Box>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 10 }} color="action" />
            <Typography variant="caption" color="text.secondary">
              Drop: <Box component="span" sx={{ color: 'text.primary' }}>{load.delivery_date}</Box>
            </Typography>
          </Box>
        </Box>

        {/* Stats grid */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {[
            { label: 'Rate', value: `$${(load.rate || 0).toLocaleString()}`, color: 'text.primary' },
            { label: 'Net Profit', value: `$${(load.net_profit_est || 0).toLocaleString()}`, color: 'primary.main' },
            { label: 'Per Mile', value: `$${(load.rate_per_mile || 0).toFixed(2)}`, color: 'text.primary' },
          ].map(({ label, value, color }) => (
            <Grid item xs={4} key={label}>
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 1.5, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color }}>{value}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Meta */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
          {load.commodity && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <InventoryIcon sx={{ fontSize: 10 }} color="action" />
              <Typography variant="caption" color="text.secondary">{load.commodity}</Typography>
            </Box>
          )}
          {load.weight_lbs && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScaleIcon sx={{ fontSize: 10 }} color="action" />
              <Typography variant="caption" color="text.secondary">{Number(load.weight_lbs).toLocaleString()} lbs</Typography>
            </Box>
          )}
          {load.broker_name && (
            <Typography variant="caption" color="text.disabled">{load.broker_name}</Typography>
          )}
        </Box>

        <StatusTimeline status={load.status} />

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
          Tap to view details & update status
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function CarrierLoadsInProgress() {
  const navigate = useNavigate();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi.inProgress()
      .then(data => setLoads(Array.isArray(data) ? data : []))
      .catch(() => setLoads([]))
      .finally(() => setLoading(false));
  }, []);

  const inTransitCount = loads.filter(l => l.status === 'in_transit').length;
  const bookedCount    = loads.filter(l => l.status === 'booked' || l.status === 'in_transit').length;
  const quotedCount    = loads.filter(l => l.status === 'quoted').length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ActivityIcon sx={{ color: 'primary.main', fontSize: 26 }} />
        <Typography variant="h5" fontWeight={700}>Loads in Progress</Typography>
        <Chip label={loads.length} size="small" color="primary" variant="outlined" />
      </Box>

      {/* Summary stats */}
      <Grid container spacing={3}>
        {[
          { label: 'In Transit', value: inTransitCount, color: 'success.main' },
          { label: 'Booked', value: bookedCount, color: 'info.main' },
          { label: 'Pending Response', value: quotedCount, color: 'warning.main' },
        ].map(({ label, value, color }) => (
          <Grid item xs={4} key={label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : loads.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <ActivityIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body1" fontWeight={600} gutterBottom>No active loads</Typography>
            <Typography variant="body2" color="text.secondary">
              Book a load from the Load Board to see it here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {loads.map(load => (
            <Grid item xs={12} md={6} key={load.id}>
              <LoadProgressCard
                load={load}
                onClick={() => navigate(`/carrier/active/${load.booking_id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
