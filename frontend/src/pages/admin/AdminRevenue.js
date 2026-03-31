import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  Table, TableHead, TableBody, TableRow, TableCell,
  LinearProgress, Skeleton,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { adminApi } from '../../services/api';

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.revenue()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2 }} />
      ))}
    </Box>
  );

  if (!data) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography color="text.secondary">Failed to load revenue data.</Typography>
    </Box>
  );

  const { total_mrr = 0, arr = 0, breakdown = [] } = data;
  const totalSubs = breakdown.reduce((s, p) => s + p.subscribers, 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <AttachMoneyIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Revenue Analytics</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">Subscription revenue breakdown by plan</Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2}>
        {[
          { label: 'Monthly MRR',   value: `$${(total_mrr / 1000).toFixed(1)}K` },
          { label: 'ARR (projected)', value: `$${(arr / 1000).toFixed(1)}K` },
          { label: 'Active Subscribers', value: totalSubs.toLocaleString() },
          { label: 'Avg Rev / Sub', value: totalSubs > 0 ? `$${(total_mrr / totalSubs).toFixed(2)}` : '—' },
        ].map(({ label, value }) => (
          <Grid item xs={6} sm={3} key={label}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" mb={0.5}>{label}</Typography>
                <Typography variant="h4" fontWeight={800}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Revenue by plan table */}
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700}>Revenue by Plan</Typography>
        </Box>
        {breakdown.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No subscription data yet.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  {['Plan', 'Subscribers', 'Price', 'MRR', 'MRR Share'].map(h => (
                    <TableCell
                      key={h}
                      sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'secondary.main' }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {breakdown.map(p => (
                  <TableRow key={p.plan} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{p.plan}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{p.subscribers.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      {p.price === 0
                        ? <Typography variant="body2" color="text.disabled">Free</Typography>
                        : <Typography variant="body2" color="text.secondary">${p.price}/mo</Typography>
                      }
                    </TableCell>
                    <TableCell>
                      {p.mrr === 0
                        ? <Typography variant="body2" color="text.disabled">$0</Typography>
                        : <Typography variant="body2" fontWeight={700}>${p.mrr.toLocaleString()}</Typography>
                      }
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      {total_mrr > 0 && p.mrr > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={parseFloat((p.mrr / total_mrr * 100).toFixed(0))}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ width: 32, flexShrink: 0 }}>
                            {(p.mrr / total_mrr * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell><Typography variant="body2" fontWeight={700}>Total</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700}>{totalSubs.toLocaleString()}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">—</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={800} color="primary.main">${total_mrr.toLocaleString()}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">100%</Typography></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>
    </Box>
  );
}
