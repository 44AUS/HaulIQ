import { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import {
  Box, Typography, Card, CardContent, Grid, Alert,
  Table, TableHead, TableRow, TableCell, TableBody, Skeleton,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function BrokerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyticsApi.broker()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const kpiDefs = [
    { icon: <VisibilityIcon color="info" />, label: 'Total Views', sub: 'All loads' },
    { icon: <GroupIcon color="warning" />, label: 'Total Bids', sub: 'All loads' },
    { icon: <TrendingUpIcon color="success" />, label: 'Fill Rate', sub: 'Loads filled / posted' },
    { icon: <AccessTimeIcon color="primary" />, label: 'Avg Time-to-Fill', sub: 'From post to approval' },
  ];

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChartIcon color="primary" /> Broker Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Performance metrics for your load board activity
        </Typography>
      </Box>
      <Grid container spacing={3}>
        {[1,2,3,4].map(i => (
          <Grid item xs={6} md={3} key={i}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="rounded" width={44} height={44} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="60%" />
                  <Skeleton width="40%" height={32} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  if (error) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BarChartIcon color="primary" /> Broker Analytics
      </Typography>
      <Alert severity="error">{error}</Alert>
    </Box>
  );

  const fillRate = data.fill_rate ?? 0;
  const avgTime = data.avg_time_to_fill_hours != null ? `${data.avg_time_to_fill_hours}h` : '—';

  const kpis = [
    { ...kpiDefs[0], value: (data.total_views || 0).toLocaleString() },
    { ...kpiDefs[1], value: (data.total_bids  || 0).toLocaleString() },
    { ...kpiDefs[2], value: `${fillRate}%` },
    { ...kpiDefs[3], value: avgTime },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChartIcon color="primary" /> Broker Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Performance metrics for your load board activity
        </Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={3}>
        {kpis.map(({ icon, label, value, sub }) => (
          <Grid item xs={6} md={3} key={label}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {icon}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="h4" fontWeight={800}>{value}</Typography>
                  <Typography variant="caption" color="text.disabled">{sub}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Chart */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Views → Bids → Filled (Last 6 Weeks)
          </Typography>
          {data.weekly && data.weekly.length > 0 ? (
            <Box>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.weekly} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views"  name="Views"  fill="#546E7A" radius={[4,4,0,0]} />
                  <Bar dataKey="bids"   name="Bids"   fill="#1565C0" radius={[4,4,0,0]} />
                  <Bar dataKey="filled" name="Filled" fill="#2E7D32" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 5 }}>
              No load data yet. Post loads to see weekly trends.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Top Carriers */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Top Carrier Partners</Typography>
        <Card>
          {data.top_carriers && data.top_carriers.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    {['Carrier', 'MC #', 'Loads Taken'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.top_carriers.map((c, i) => (
                    <TableRow key={i} sx={{ bgcolor: i % 2 === 1 ? 'action.hover' : 'inherit' }}>
                      <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{c.mc_number || '—'}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{c.loads}x</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <CardContent>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                No completed bookings yet.
              </Typography>
            </CardContent>
          )}
        </Card>
      </Box>
    </Box>
  );
}
