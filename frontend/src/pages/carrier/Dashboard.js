import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Grid
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BoltIcon from '@mui/icons-material/Bolt';
import { useAuth } from '../../context/AuthContext';
import { loadsApi, analyticsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import LoadCard from '../../components/carrier/LoadCard';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const StatCard = ({ icon: Icon, label, value, sub, color = 'primary' }) => {


  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: 'action.hover',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon sx={{ fontSize: 20, color: 'primary.main' }} />
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ my: 0.5 }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default function CarrierDashboard() {
  const { user } = useAuth();
  const [hotLoads, setHotLoads] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadsApi.list({ per_page: 3, sort_by: 'recent', hot_only: true })
      .then(res => setHotLoads(adaptLoadList(res)))
      .catch(() => {
        loadsApi.list({ per_page: 3, sort_by: 'recent' })
          .then(res => setHotLoads(adaptLoadList(res)))
          .catch(() => setHotLoads([]));
      });

    analyticsApi.summary()
      .then(data => setSummary(data))
      .catch(() => setSummary(null));
  }, []);

  const weeklyData = (summary?.weekly_earnings || []).slice(-6);
  const chartData = weeklyData.map(w => ({ week: w.week_label, net: w.net }));

  const fmt = (n) => n != null ? `$${Number(n).toLocaleString()}` : '—';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Good morning, {user?.name?.split(' ')[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Here's your profit snapshot for today
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/carrier/loads"
          variant="contained"
          startIcon={<LocalShippingIcon />}
        >
          Browse Loads
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard icon={AttachMoneyIcon} label="Total Net" value={fmt(summary?.total_net)} sub="All time" color="primary" />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={TrendingUpIcon}
            label="Avg Rate/Mile"
            value={summary?.avg_rate_per_mile ? `$${Number(summary.avg_rate_per_mile).toFixed(2)}` : '—'}
            sub="All time"
            color="blue"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard icon={LocalShippingIcon} label="Loads Completed" value={summary?.total_loads ?? '—'} sub="All time" color="warning" />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={LocationOnIcon}
            label="Avg Deadhead"
            value={summary?.avg_deadhead_miles ? `${Math.round(summary.avg_deadhead_miles)} mi` : '—'}
            sub="Per load"
            color="primary"
          />
        </Grid>
      </Grid>

      {/* Earnings chart + Brain insight */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Earnings Trend</Typography>
                <Button
                  component={Link}
                  to="/carrier/analytics"
                  variant="text"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Full analytics
                </Button>
              </Box>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1565C0" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#1565C0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Net']}
                    />
                    <Area type="monotone" dataKey="net" stroke="#1565C0" strokeWidth={2} fill="url(#netGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
                  <Typography variant="body2" color="text.secondary">
                    Complete loads to see your earnings trend
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Brain insight card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '1px solid', borderColor: 'primary.dark', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PsychologyIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={600}>Earnings Brain</Typography>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Insights load on the Brain page
                </Typography>
              </Box>
              <Button
                component={Link}
                to="/carrier/brain"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                fullWidth
                sx={{ mt: 2 }}
              >
                See all insights
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Hot Loads */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BoltIcon sx={{ color: 'error.main' }} />
          <Typography variant="subtitle1" fontWeight={600}>Hot Loads Right Now</Typography>
        </Box>
        <Button
          component={Link}
          to="/carrier/loads"
          variant="text"
          size="small"
          endIcon={<ArrowForwardIcon />}
          sx={{ fontSize: '0.75rem' }}
        >
          View all
        </Button>
      </Box>
      {hotLoads.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary">
              No hot loads right now — check back soon
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {hotLoads.map(load => (
            <Grid item xs={12} sm={6} md={4} key={load.id}>
              <LoadCard load={load} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
