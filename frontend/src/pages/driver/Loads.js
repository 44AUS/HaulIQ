import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, CircularProgress,
  Stack, TextField, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { driverApi } from '../../services/api';

const STATUS_COLORS = {
  dispatched:   'default',
  picked_up:    'warning',
  in_transit:   'info',
  delivered:    'success',
  pod_received: 'success',
};

export default function DriverLoads() {
  const navigate = useNavigate();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    driverApi.loads()
      .then(data => setLoads(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = loads.filter(l =>
    !search ||
    (l.origin || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.destination || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.commodity || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" fontWeight={700}>My Loads</Typography>

      <TextField
        size="small"
        placeholder="Search by origin, destination, or commodity…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        sx={{ maxWidth: 400 }}
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">
              {loads.length === 0 ? 'No loads assigned yet.' : 'No loads match your search.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map(load => (
            <Card
              key={load.id}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, transition: 'background 0.15s' }}
              onClick={() => navigate(`/driver/loads/${load.id}`)}
            >
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" fontWeight={700} noWrap>
                      {load.origin} → {load.destination}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[load.commodity, load.miles ? `${load.miles.toLocaleString()} mi` : null]
                        .filter(Boolean).join(' · ')}
                    </Typography>
                    {load.pickup_date && (
                      <Typography variant="caption" color="text.disabled">
                        Pickup: {new Date(load.pickup_date).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Chip
                      label={(load.tms_status || 'assigned').replace(/_/g, ' ')}
                      size="small"
                      color={STATUS_COLORS[load.tms_status] || 'default'}
                    />
                    {load.driver_pay && (
                      <Typography variant="caption" fontWeight={700} color={load.driver_pay_status === 'paid' ? 'success.main' : 'text.secondary'}>
                        ${load.driver_pay.toLocaleString()} · {load.driver_pay_status}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
