import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadsApi, bookingsApi, analyticsApi, brokersApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  Box, Typography, Button, Card, CardContent, Table, TableHead,
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
  const [brokerProfile, setBrokerProfile] = useState(null);

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

    if (user?.id) {
      brokersApi.get(user.id)
        .then(data => setBrokerProfile(data))
        .catch(() => setBrokerProfile(null));
    }
  }, [user?.id]);

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

      {/* Stats — 4 equal columns, no MUI Grid negative margins */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
        {stats.map(({ icon, label, value }) => (
          <Card key={label}>
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
        ))}
      </Box>

      {/* Chart + Rating — equal 50/50 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
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

        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Your Broker Rating
            </Typography>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" fontWeight={900}>
                {brokerProfile?.avg_rating > 0 ? brokerProfile.avg_rating.toFixed(1) : '—'}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, my: 1 }}>
                {[1,2,3,4,5].map(i => (
                  <StarBorderIcon key={i} sx={{ fontSize: 18, color: brokerProfile?.avg_rating >= i ? 'warning.main' : 'text.disabled' }} />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {brokerProfile?.reviews_count > 0
                  ? `Based on ${brokerProfile.reviews_count} carrier review${brokerProfile.reviews_count !== 1 ? 's' : ''}`
                  : 'No carrier reviews yet'}
              </Typography>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            {[
              ['Avg Payment Days', brokerProfile?.avg_payment_days ? `${Math.round(brokerProfile.avg_payment_days)} days` : '—'],
              ['Pay Speed', brokerProfile?.pay_speed ? brokerProfile.pay_speed.replace('_', ' ') : '—'],
              ['Total Reviews', brokerProfile?.reviews_count > 0 ? brokerProfile.reviews_count : '—'],
            ].map(([k, v]) => (
              <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                <Typography variant="body2" color="text.secondary">{k}</Typography>
                <Typography variant="body2" fontWeight={600} color="primary.main">{v}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>

      {/* Recent Loads */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>My Recent Loads</Typography>
          <Button component={Link} to="/broker/loads" variant="text" endIcon={<ArrowForwardIcon />} size="small">
            Manage all
          </Button>
        </Box>

        {loads.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <InventoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No loads posted yet.</Typography>
            <Button component={Link} to="/broker/post" variant="text" size="small">Post your first load</Button>
          </Paper>
        ) : (
          <Card>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    {['Load #', 'Route', 'Type', 'Rate', 'Pickup', 'Views', 'Bids', 'Status'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentLoads.map((load, idx) => (
                    <TableRow key={load.id} sx={{ bgcolor: idx % 2 === 1 ? 'action.hover' : 'inherit' }}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                        {String(load._raw?.id || load.id).slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography
                          component={Link}
                          to={`/broker/loads/${load._raw?.id || load.id}`}
                          state={{ from: 'Dashboard' }}
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {load.origin} → {load.dest}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{load.type}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>${(load.rate || 0).toLocaleString()}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{load.pickup}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <VisibilityIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">{load.viewCount || 0}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <GroupIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">—</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{statusChip(load.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Card>
        )}
      </Box>
    </Box>
  );
}
