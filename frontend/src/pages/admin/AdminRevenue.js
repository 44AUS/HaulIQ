import React from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  Table, TableHead, TableBody, TableRow, TableCell,
  LinearProgress,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { ADMIN_STATS } from '../../data/sampleData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PLAN_REVENUE = [
  { plan: 'Carrier Basic', subs: 680,  price: 0,   mrr: 0 },
  { plan: 'Carrier Pro',   subs: 420,  price: 49,  mrr: 20580 },
  { plan: 'Carrier Elite', subs: 184,  price: 99,  mrr: 18216 },
  { plan: 'Broker Basic',  subs: 420,  price: 0,   mrr: 0 },
  { plan: 'Broker Pro',    subs: 248,  price: 79,  mrr: 19592 },
  { plan: 'Broker Elite',  subs: 136,  price: 149, mrr: 20264 },
];

const ChartTooltipStyle = {
  contentStyle: { background: '#1e1e2e', border: '1px solid #333', borderRadius: 8, fontSize: 12 },
};

export default function AdminRevenue() {
  const totalMRR = PLAN_REVENUE.reduce((s, p) => s + p.mrr, 0);
  const arr = totalMRR * 12;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <AttachMoneyIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Revenue Analytics</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">Subscription revenue breakdown and growth trends</Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2}>
        {[
          { label: 'MRR',              value: `$${(totalMRR / 1000).toFixed(1)}K`, change: '+12.4%' },
          { label: 'ARR (projected)',  value: `$${(arr / 1000).toFixed(0)}K`,      change: '+12.4%' },
          { label: 'Avg Revenue/User', value: '$37.5',                              change: '+4.2%' },
          { label: 'LTV (est.)',       value: '$2,250',                             change: '+8.1%' },
        ].map(({ label, value, change }) => (
          <Grid item xs={6} sm={3} key={label}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: 'success.main' }}>
                    <ArrowUpwardIcon sx={{ fontSize: 11 }} />
                    <Typography variant="caption" fontWeight={700} color="success.main">{change}</Typography>
                  </Box>
                </Box>
                <Typography variant="h4" fontWeight={800}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* MRR trend chart */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2.5}>MRR Trend</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ADMIN_STATS.revenueByMonth}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1565C0" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1565C0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...ChartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'MRR']} />
              <Area type="monotone" dataKey="mrr" stroke="#1565C0" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by plan table */}
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700}>Revenue by Plan</Typography>
        </Box>
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
              {PLAN_REVENUE.map(p => (
                <TableRow key={p.plan} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{p.plan}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{p.subs.toLocaleString()}</Typography>
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
                    {p.mrr > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat((p.mrr / totalMRR * 100).toFixed(0))}
                          sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ width: 32, flexShrink: 0 }}>
                          {(p.mrr / totalMRR * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell><Typography variant="body2" fontWeight={700}>Total</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight={700}>{PLAN_REVENUE.reduce((s, p) => s + p.subs, 0).toLocaleString()}</Typography></TableCell>
                <TableCell><Typography variant="body2" color="text.secondary">—</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight={800} color="primary.main">${totalMRR.toLocaleString()}</Typography></TableCell>
                <TableCell><Typography variant="body2" color="text.secondary">100%</Typography></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
