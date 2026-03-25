import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadsApi, bookingsApi, analyticsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  Box, Typography, Button, Card, CardContent, Grid, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, Paper, Divider,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InventoryIcon from '@mui/icons-material/Inventory';

function statusChip(status) {
  if (status === 'active')  return <Chip label="Active"  size="small" color="success" />;
  if (status === 'filled')  return <Chip label="Filled"  size="small" color="info" />;
  return <Chip label="Expired" size="small" color="error" />;
}

export default function BrokerDashboard() {
  const { user } = useAuth();
  const [loads, setLoads] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [brokerAnalytics, setBrokerAnalytics] = useState(null);

  useEffect(() => {
    loadsApi.posted()
      .then(res => {
        const adapted = adaptLoadList(res);
        setLoads(adapted.map(l => ({ ...l, status: l.status === 'removed' ? 'expired' : l.status })));
      })
      .catch(() => setLoads([]));

    bookingsApi.pending()
      .then(data => setPendingCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setPendingCount(0));

    analyticsApi.broker()
      .then(data => setBrokerAnalytics(data))
      .catch(() => setBrokerAnalytics(null));
  }, []);

  const recentLoads = loads.slice(0, 4);

  const stats = [
    {
      icon: <LocalShippingIcon sx={{ color: 'primary.main' }} />,
      label: 'Active Loads',
      value: loads.filter(l => l.status === 'active').length,
      bg: 'primary.main',
    },
    {
      icon: <VisibilityIcon sx={{ color: 'info.main' }} />,
      label: 'Total Views',
      value: brokerAnalytics ? brokerAnalytics.total_views : loads.reduce((s, l) => s + (l.viewCount || 0), 0),
      bg: 'info.main',
    },
    {
      icon: <GroupIcon sx={{ color: 'warning.main' }} />,
      label: 'Pending Bookings',
      value: pendingCount,
      bg: 'warning.main',
    },
    {
      icon: <TrendingUpIcon sx={{ color: 'success.main' }} />,
      label: 'Fill Rate',
      value: loads.length ? `${Math.round((loads.filter(l => l.status === 'filled').length / loads.length) * 100)}%` : '—',
      bg: 'success.main',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Welcome, {user?.name?.split(' ')[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Your freight brokerage performance overview
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/broker/post"
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
        >
          Post a Load
        </Button>
      </Box>

      {/* All content in one Grid so every row shares the same spacing and aligns */}
      <Grid container spacing={3}>
        {/* Stat cards */}
        {stats.map(({ icon, label, value }) => (
          <Grid item xs={6} md={3} key={label}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: 2,
                  bgcolor: 'action.selected',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {icon}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="h4" fontWeight={800}>{value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Chart — equal width with Rating */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Load Views (Last 6 Weeks)
              </Typography>
              {brokerAnalytics?.weekly?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={brokerAnalytics.weekly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#1565C0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <Typography variant="body2" color="text.secondary">Post loads to see view data</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Broker Rating — equal width with Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Your Broker Rating
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" fontWeight={900}>—</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, my: 1 }}>
                  {[1,2,3,4,5].map(i => <StarBorderIcon key={i} sx={{ fontSize: 18, color: 'text.disabled' }} />)}
                </Box>
                <Typography variant="caption" color="text.secondary">Based on carrier reviews</Typography>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              {[['Payment Speed', '—'], ['Response Rate', '—'], ['Load Accuracy', '—']].map(([k, v]) => (
                <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">{k}</Typography>
                  <Typography variant="body2" fontWeight={600} color="primary.main">{v}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Loads — full width */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>My Recent Loads</Typography>
            <Button
              component={Link}
              to="/broker/loads"
              variant="text"
              endIcon={<ArrowForwardIcon />}
              size="small"
            >
              Manage all
            </Button>
          </Box>

          {loads.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <InventoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                No loads posted yet.
              </Typography>
              <Button component={Link} to="/broker/post" variant="text" size="small">
                Post your first load
              </Button>
            </Paper>
          ) : (
            <Card>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      {['Route', 'Type', 'Rate', 'Views', 'Status', 'Posted'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentLoads.map((load, idx) => (
                      <TableRow key={load.id} sx={{ bgcolor: idx % 2 === 1 ? 'action.hover' : 'inherit' }}>
                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{load.origin} → {load.dest}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{load.type}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>${(load.rate || 0).toLocaleString()}</TableCell>
                        <TableCell>{load.viewCount || 0}</TableCell>
                        <TableCell>{statusChip(load.status)}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{load.posted}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
