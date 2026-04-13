import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip,
  CircularProgress, Stack, Divider,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { driverApi } from '../../services/api';

const PAY_COLOR = { paid: 'success', pending: 'warning', unpaid: 'default' };

export default function DriverEarnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driverApi.earnings()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  );

  const loads = data?.loads || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" fontWeight={700}>Earnings</Typography>

      {/* Summary cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {[
          { label: 'Paid',    value: data?.total_paid    || 0, color: 'success.main' },
          { label: 'Pending', value: data?.total_pending || 0, color: 'warning.main' },
          { label: 'Unpaid',  value: data?.total_unpaid  || 0, color: 'text.secondary' },
        ].map(({ label, value, color }) => (
          <Card key={label} variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                {label}
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color }}>
                ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Per-load breakdown */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AttachMoneyIcon fontSize="small" color="action" />
            <Typography variant="subtitle1" fontWeight={600}>Load Breakdown</Typography>
          </Box>

          {loads.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No earnings yet.</Typography>
          ) : (
            <Stack divider={<Divider />} spacing={0}>
              {loads.map((load, idx) => (
                <Box key={load.booking_id} sx={{ py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {load.origin} → {load.destination}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {load.tms_status?.replace(/_/g, ' ') || '—'}
                      {load.delivered_at ? ` · ${new Date(load.delivered_at).toLocaleDateString()}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={700}>
                      ${load.driver_pay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Chip
                      label={load.driver_pay_status}
                      size="small"
                      color={PAY_COLOR[load.driver_pay_status] || 'default'}
                      sx={{ mt: 0.25 }}
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
