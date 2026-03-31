import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress, LinearProgress,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShieldIcon from '@mui/icons-material/Shield';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WorkIcon from '@mui/icons-material/Work';
import { adminApi } from '../../services/api';

const PLAN_COLORS = { basic: '#455a64', pro: '#1565C0', elite: '#6a1b9a', admin: '#b71c1c' };

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );

  if (!stats) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography color="text.secondary">Failed to load stats.</Typography>
    </Box>
  );

  const kpis = [
    { Icon: AttachMoneyIcon,   label: 'Monthly MRR',        value: `$${(stats.mrr / 1000).toFixed(1)}K`,     color: 'success' },
    { Icon: TrendingUpIcon,    label: 'ARR',                value: `$${(stats.arr / 1000).toFixed(1)}K`,     color: 'success' },
    { Icon: PeopleIcon,        label: 'Active Subscribers', value: stats.active_subscribers.toLocaleString(), color: 'primary' },
    { Icon: InventoryIcon,     label: 'Active Loads',       value: stats.active_loads.toLocaleString(),       color: 'warning' },
    { Icon: PeopleIcon,        label: 'Total Users',        value: stats.total_users.toLocaleString(),        color: 'info'    },
    { Icon: LocalShippingIcon, label: 'Total Carriers',     value: stats.total_carriers.toLocaleString(),     color: 'primary' },
    { Icon: WorkIcon,          label: 'Total Brokers',      value: stats.total_brokers.toLocaleString(),      color: 'info'    },
    { Icon: FiberNewIcon,      label: 'New Users (30d)',     value: stats.new_users_30d.toLocaleString(),      color: 'success' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <ShieldIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>Admin Dashboard</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">Platform overview — HaulIQ Operations</Typography>
        </Box>
        <Chip label="All systems operational" color="success" size="small" />
      </Box>

      {/* KPI grid */}
      <Grid container spacing={2}>
        {kpis.map(({ Icon, label, value, color }) => (
          <Grid item xs={6} sm={4} lg={3} key={label}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2 }}>
                <Box sx={{
                  width: 34, height: 34, borderRadius: 1.5, mb: 1.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: `${color}.main`,
                }}>
                  <Icon sx={{ fontSize: 18, color: '#fff' }} />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={0.25}>{label}</Typography>
                <Typography variant="h4" fontWeight={800}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Plan distributions */}
      <Grid container spacing={3}>
        {[
          { title: 'Carrier Plan Distribution', data: stats.carrier_plan_distribution },
          { title: 'Broker Plan Distribution',  data: stats.broker_plan_distribution  },
        ].map(({ title, data }) => (
          <Grid item xs={12} md={6} key={title}>
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2.5}>{title}</Typography>
                {(!data || data.length === 0) ? (
                  <Typography variant="body2" color="text.disabled">No data yet</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {data.map(d => (
                      <Box key={d.plan}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{d.plan}</Typography>
                          <Typography variant="body2" color="text.secondary">{d.count} users · {d.pct}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={d.pct}
                          sx={{
                            height: 8, borderRadius: 4,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': { bgcolor: PLAN_COLORS[d.plan] || 'primary.main', borderRadius: 4 },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
