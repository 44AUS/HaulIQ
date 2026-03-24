import React from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ShieldIcon from '@mui/icons-material/Shield';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { ADMIN_STATS } from '../../data/sampleData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PIE_COLORS = ['#455a64', '#1565C0', '#6a1b9a'];

const ChartTooltipStyle = {
  contentStyle: { background: '#1e1e2e', border: '1px solid #333', borderRadius: 8, fontSize: 12 },
};

export default function AdminOverview() {
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

      {/* KPI cards */}
      <Grid container spacing={2}>
        {[
          { Icon: AttachMoneyIcon, label: 'Monthly MRR',        value: `$${(ADMIN_STATS.mrr / 1000).toFixed(1)}K`,          change: `+${ADMIN_STATS.mrrGrowth}%`,  color: 'success' },
          { Icon: PeopleIcon,      label: 'Active Subscribers', value: ADMIN_STATS.activeSubscribers.toLocaleString(), change: `+${ADMIN_STATS.subGrowth}%`,  color: 'primary' },
          { Icon: InventoryIcon,   label: 'Total Loads Posted', value: ADMIN_STATS.totalLoads.toLocaleString(),       change: '+5.2%',                         color: 'warning' },
          { Icon: TrendingUpIcon,  label: 'Total Users',        value: ADMIN_STATS.totalUsers.toLocaleString(),       change: '+14.1%',                        color: 'success' },
        ].map(({ Icon, label, value, change, color }) => (
          <Grid item xs={6} lg={3} key={label}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 36, height: 36, borderRadius: 1.5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: `${color}.main`, opacity: 0.9,
                    }}
                  >
                    <Icon sx={{ fontSize: 20, color: '#fff' }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: 'success.main' }}>
                    <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                    <Typography variant="caption" fontWeight={700} color="success.main">{change}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={0.5}>{label}</Typography>
                <Typography variant="h4" fontWeight={800}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Chart + distribution */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2.5}>MRR Growth</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={ADMIN_STATS.revenueByMonth}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1565C0" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1565C0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip {...ChartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'MRR']} />
                  <Area type="monotone" dataKey="mrr" stroke="#1565C0" strokeWidth={2.5} fill="url(#mrrGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={2}>Carrier Plan Distribution</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
                {ADMIN_STATS.carrierDist.map((d, i) => (
                  <Box key={d.plan}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">{d.plan}</Typography>
                      <Typography variant="caption" fontWeight={700}>{d.count} ({d.pct}%)</Typography>
                    </Box>
                    <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', borderRadius: 4, bgcolor: PIE_COLORS[i], width: `${d.pct}%`, transition: 'width 0.6s' }} />
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Broker Plan Distribution</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {ADMIN_STATS.brokerDist.map((d, i) => (
                    <Box key={d.plan}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{d.plan}</Typography>
                        <Typography variant="caption" fontWeight={700}>{d.count} ({d.pct}%)</Typography>
                      </Box>
                      <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', borderRadius: 4, bgcolor: PIE_COLORS[i], width: `${d.pct}%`, transition: 'width 0.6s' }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick alerts */}
      <Grid container spacing={2}>
        {[
          { label: 'New Users Today',     value: '14', Icon: FiberNewIcon,    color: 'success' },
          { label: 'Loads Pending Review', value: '7',  Icon: AssignmentIcon,  color: 'warning' },
          { label: 'Support Tickets',     value: '3',  Icon: SupportAgentIcon, color: 'info' },
        ].map(({ label, value, Icon, color }) => (
          <Grid item xs={12} sm={4} key={label}>
            <Card variant="outlined" sx={{ borderColor: `${color}.main` }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40, height: 40, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: `${color}.dark`, flexShrink: 0,
                  }}
                >
                  <Icon sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="h5" fontWeight={800}>{value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
