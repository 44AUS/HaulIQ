import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { analyticsApi } from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const ChartTooltipStyle = {
  contentStyle: {
    background: '#1e1e1e',
    border: '1px solid #333',
    borderRadius: 8,
    fontSize: 12,
  },
};

export default function CarrierAnalytics() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyticsApi.summary()
      .then(data => { setSummary(data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const weeklyData = summary?.weekly_earnings || [];
  const laneData   = summary?.lane_stats || [];

  const fmt = (n) => n != null ? `$${Number(n).toLocaleString()}` : '—';
  const fmtMi = (n) => n != null ? Number(n).toLocaleString() : '—';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" fontWeight={700}>Earnings Analytics</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Your performance data
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {/* KPI cards */}
          <Grid container spacing={3}>
            {[
              { icon: AttachMoneyIcon, label: 'Total Gross', value: fmt(summary?.total_gross) },
              { icon: TrendingUpIcon,  label: 'Total Net',   value: fmt(summary?.total_net) },
              { icon: LocalShippingIcon, label: 'Total Miles', value: fmtMi(summary?.total_miles) },
              {
                icon: LocationOnIcon,
                label: 'Avg Net/Mile',
                value: summary?.avg_net_per_mile ? `$${Number(summary.avg_net_per_mile).toFixed(2)}` : '—',
              },
            ].map(({ icon: Icon, label, value }) => (
              <Grid item xs={6} md={3} key={label}>
                <Card>
                  <CardContent>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: 2,
                      bgcolor: 'action.hover',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mb: 1.5,
                    }}>
                      <Icon sx={{ fontSize: 20, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
                    <Typography variant="h4" fontWeight={800}>{value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Net earnings chart */}
          {weeklyData.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Net Earnings by Week</Typography>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="areaGross" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1565C0" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#1565C0" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="areaNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1976D2" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#1976D2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="week_label" tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip {...ChartTooltipStyle} formatter={(v, n) => [`$${Number(v).toLocaleString()}`, n === 'gross' ? 'Gross' : 'Net']} />
                    <Area type="monotone" dataKey="gross" stroke="#1565C0" strokeWidth={2} fill="url(#areaGross)" />
                    <Area type="monotone" dataKey="net" stroke="#1976D2" strokeWidth={2} fill="url(#areaNet)" strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 2, bgcolor: '#1565C0' }} />
                    <Typography variant="caption" color="text.secondary">Gross</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 2, bgcolor: '#1976D2' }} />
                    <Typography variant="caption" color="text.secondary">Net</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Miles per week */}
          {weeklyData.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Miles Driven</Typography>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="week_label" tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip {...ChartTooltipStyle} formatter={(v) => [Number(v).toLocaleString() + ' mi', 'Miles']} />
                    <Bar dataKey="miles" fill="#1565C0" fillOpacity={0.75} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Lane table */}
          {laneData.length > 0 && (
            <Card>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={600}>Top Lane Performance</Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {['Lane', 'Runs', 'Avg Net Profit', 'Avg Rate/Mile', 'Verdict'].map(h => (
                        <TableCell
                          key={h}
                          sx={{
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            color: 'secondary.main',
                            bgcolor: 'action.hover',
                          }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {laneData.map((lane, i) => (
                      <TableRow key={i} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {lane.origin} → {lane.destination}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{lane.run_count}x</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{fmt(lane.avg_net_profit)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">${Number(lane.avg_rate_per_mile || 0).toFixed(2)}/mi</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              (lane.avg_net_profit || 0) > 1000 ? 'Run it' :
                              (lane.avg_net_profit || 0) > 0 ? 'Okay' : 'Avoid'
                            }
                            size="small"
                            color={
                              (lane.avg_net_profit || 0) > 1000 ? 'success' :
                              (lane.avg_net_profit || 0) > 0 ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {weeklyData.length === 0 && laneData.length === 0 && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                <Typography variant="body1" color="text.secondary">
                  No analytics data yet. Complete loads to see your performance.
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}
