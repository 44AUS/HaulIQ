import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Chip,
  CircularProgress, Stack, Stepper, Step, StepLabel, Alert,
} from '@mui/material';
import { driverApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';


const TMS_STEPS  = ['Dispatched', 'Picked Up', 'In Transit', 'Delivered'];
const TMS_VALUES = ['dispatched', 'picked_up', 'in_transit', 'delivered'];

const NEXT_ACTION = {
  null:        { label: 'Mark Dispatched', next: 'dispatched' },
  dispatched:  { label: 'Mark Picked Up',  next: 'picked_up' },
  picked_up:   { label: 'Mark In Transit', next: 'in_transit' },
  in_transit:  { label: 'Mark Delivered',  next: 'delivered' },
  delivered:   null,
  pod_received: null,
};

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    driverApi.loads()
      .then(data => setLoads(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeLoad = loads.find(l =>
    l.tms_status && !['delivered', 'pod_received'].includes(l.tms_status)
  ) || loads.find(l => l.status === 'approved' && !l.tms_status);

  const handleAdvance = async (load) => {
    const action = NEXT_ACTION[load.tms_status || null];
    if (!action) return;
    setUpdating(load.id);
    try {
      await driverApi.updateStatus(load.id, action.next);
      const updated = await driverApi.loads();
      setLoads(Array.isArray(updated) ? updated : []);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" fontWeight={700}>My Dashboard</Typography>

      {/* Active load */}
      {activeLoad ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <IonIcon name="car-sport-outline" color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>Active Load</Typography>
              <Chip
                label={(activeLoad.tms_status || 'assigned').replace('_', ' ')}
                size="small"
                color={activeLoad.tms_status === 'in_transit' ? 'info' : 'default'}
              />
            </Box>

            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
              {activeLoad.origin} → {activeLoad.destination}
            </Typography>
            {activeLoad.commodity && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {activeLoad.commodity} · {activeLoad.miles ? `${activeLoad.miles.toLocaleString()} mi` : ''}
              </Typography>
            )}

            <Stepper
              activeStep={TMS_VALUES.indexOf(activeLoad.tms_status || '')}
              alternativeLabel
              sx={{ mb: 3 }}
            >
              {TMS_STEPS.map((label, idx) => (
                <Step key={label} completed={TMS_VALUES.indexOf(activeLoad.tms_status || '') > idx}>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 11 } }}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeLoad.carrier_visible_notes && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>Instructions from carrier:</Typography>
                <Typography variant="body2">{activeLoad.carrier_visible_notes}</Typography>
              </Alert>
            )}

            <Stack direction="row" spacing={1.5}>
              {NEXT_ACTION[activeLoad.tms_status || null] && (
                <Button
                  variant="contained"
                  onClick={() => handleAdvance(activeLoad)}
                  disabled={updating === activeLoad.id}
                  startIcon={updating === activeLoad.id ? <CircularProgress size={14} color="inherit" /> : null}
                  sx={{ fontWeight: 700 }}
                >
                  {NEXT_ACTION[activeLoad.tms_status || null].label}
                </Button>
              )}
              <Button variant="outlined" onClick={() => navigate(`/driver/loads/${activeLoad.id}`)}>
                View Details
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <IonIcon name="checkmark-circle" sx={{ fontSize: 40, color: 'success.main', mb: 1.5 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>No active loads</Typography>
            <Typography variant="body2" color="text.secondary">
              You'll see your next assigned load here when your carrier dispatches one.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Recent loads */}
      {loads.length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Recent Loads</Typography>
          <Stack spacing={1.5}>
            {loads.slice(0, 3).map(load => (
              <Card
                key={load.id}
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => navigate(`/driver/loads/${load.id}`)}
              >
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {load.origin} → {load.destination}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {load.commodity || '—'} · {load.miles ? `${load.miles.toLocaleString()} mi` : ''}
                      </Typography>
                    </Box>
                    <Chip
                      label={(load.tms_status || load.status || 'assigned').replace(/_/g, ' ')}
                      size="small"
                      color={load.tms_status === 'delivered' ? 'success' : 'default'}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
          {loads.length > 3 && (
            <Button sx={{ mt: 1 }} onClick={() => navigate('/driver/loads')}>View all loads</Button>
          )}
        </Box>
      )}
    </Box>
  );
}
