import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Alert, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BadgeIcon from '@mui/icons-material/Badge';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { analyticsApi, driversApi } from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const TT = {
  contentStyle: {
    background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, fontSize: 12,
  },
};

const fmt  = (n) => n != null ? `$${Number(n).toLocaleString()}` : '—';
const fmtN = (n) => n != null ? Number(n).toLocaleString() : '—';

function SkeletonCards() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={88} sx={{ borderRadius: 2 }} />)}
    </Box>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 8 }}>
        <Icon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
        <Typography variant="body1" fontWeight={600} color="text.secondary">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}

function KpiRow({ items }) {
  return (
    <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
      {items.map(({ icon: Icon, label, value, color }) => (
        <Box key={label} sx={{ flex: '1 1 160px', minWidth: 0 }}>
          <Card>
            <CardContent>
              {Icon && (
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.25 }}>
                  <Icon sx={{ fontSize: 18, color: color || 'primary.main' }} />
                </Box>
              )}
              <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
              <Typography variant="h4" fontWeight={800} color={color || 'text.primary'}>{value}</Typography>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
}

// ── Loads tab ─────────────────────────────────────────────────────────────────
function LoadsTab({ summary, loading, error }) {
  if (loading) return <SkeletonCards />;
  if (error)   return <Alert severity="error">{error}</Alert>;

  const weekly   = summary?.weekly_earnings || [];
  const laneData = summary?.lane_stats || [];
  const isEmpty  = weekly.length === 0 && laneData.length === 0;

  if (isEmpty) return (
    <EmptyState icon={TrendingUpIcon} title="No load analytics yet" subtitle="Complete loads to see your performance." />
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <KpiRow items={[
        { icon: AttachMoneyIcon,   label: 'Total Gross',   value: fmt(summary?.total_gross) },
        { icon: TrendingUpIcon,    label: 'Total Net',     value: fmt(summary?.total_net) },
        { icon: LocalShippingIcon, label: 'Total Miles',   value: fmtN(summary?.total_miles) },
        { icon: LocationOnIcon,    label: 'Avg Net/Mile',  value: summary?.avg_net_per_mile ? `$${Number(summary.avg_net_per_mile).toFixed(2)}` : '—' },
      ]} />

      {weekly.length > 0 && (
        <>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Net Earnings by Week</Typography>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={weekly}>
                  <defs>
                    <linearGradient id="cagGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1565C0" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#1565C0" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cagNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1976D2" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#1976D2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="week_label" tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip {...TT} formatter={(v, n) => [`$${Number(v).toLocaleString()}`, n === 'gross' ? 'Gross' : 'Net']} />
                  <Area type="monotone" dataKey="gross" stroke="#1565C0" strokeWidth={2} fill="url(#cagGross)" />
                  <Area type="monotone" dataKey="net"   stroke="#1976D2" strokeWidth={2} fill="url(#cagNet)" strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                {[['#1565C0', 'Gross'], ['#1976D2', 'Net']].map(([c, l]) => (
                  <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 2, bgcolor: c }} />
                    <Typography variant="caption" color="text.secondary">{l}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Miles Driven</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="week_label" tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} formatter={v => [Number(v).toLocaleString() + ' mi', 'Miles']} />
                  <Bar dataKey="miles" fill="#1565C0" fillOpacity={0.75} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

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
                    <TableCell key={h} sx={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.5, color: 'secondary.main', bgcolor: 'action.hover' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {laneData.map((lane, i) => (
                  <TableRow key={i} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{lane.origin} → {lane.destination}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{lane.run_count}x</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{fmt(lane.avg_net_profit)}</Typography></TableCell>
                    <TableCell><Typography variant="body2">${Number(lane.avg_rate_per_mile || 0).toFixed(2)}/mi</Typography></TableCell>
                    <TableCell>
                      <Chip
                        label={(lane.avg_net_profit || 0) > 1000 ? 'Run it' : (lane.avg_net_profit || 0) > 0 ? 'Okay' : 'Avoid'}
                        size="small"
                        color={(lane.avg_net_profit || 0) > 1000 ? 'success' : (lane.avg_net_profit || 0) > 0 ? 'warning' : 'error'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}

// ── Payments tab ──────────────────────────────────────────────────────────────
function PaymentsTab({ summary, loading, error }) {
  if (loading) return <SkeletonCards />;
  if (error)   return <Alert severity="error">{error}</Alert>;

  const gross    = summary?.total_gross || 0;
  const net      = summary?.total_net   || 0;
  const expenses = Math.max(gross - net, 0);
  const weekly   = summary?.weekly_earnings || [];

  if (gross === 0 && net === 0) return (
    <EmptyState icon={AttachMoneyIcon} title="No payment data yet" subtitle="Payment analytics will appear once you complete loads." />
  );

  const pieData  = [
    { name: 'Net Profit', value: net      > 0 ? net      : 0 },
    { name: 'Expenses',   value: expenses > 0 ? expenses : 0 },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <KpiRow items={[
        { label: 'Total Gross Revenue', value: fmt(gross),    color: 'primary.main' },
        { label: 'Total Net Profit',    value: fmt(net),      color: 'success.main' },
        { label: 'Total Expenses',      value: fmt(expenses), color: 'warning.main' },
        { label: 'Profit Margin',       value: gross > 0 ? `${((net / gross) * 100).toFixed(1)}%` : '—', color: 'info.main' },
      ]} />

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {weekly.length > 0 && (
          <Card sx={{ flex: '1 1 320px' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Gross vs Net by Week</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weekly} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="week_label" tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip {...TT} formatter={v => [`$${Number(v).toLocaleString()}`]} />
                  <Bar dataKey="gross" name="Gross" fill="#1565C0" fillOpacity={0.75} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="net"   name="Net"   fill="#2E7D32" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card sx={{ flex: '0 0 280px' }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Profit Breakdown</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={['#2E7D32', '#1565C0'][i]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => `$${Number(v).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

// ── Drivers tab ───────────────────────────────────────────────────────────────
function DriversTab() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driversApi.list()
      .then(d => setDrivers(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonCards />;

  if (drivers.length === 0) return (
    <EmptyState icon={BadgeIcon} title="No drivers yet" subtitle="Invite drivers from the My Drivers page to see analytics here." />
  );

  const active  = drivers.filter(d =>  d.invite_accepted).length;
  const pending = drivers.filter(d => !d.invite_accepted).length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <KpiRow items={[
        { label: 'Total Drivers',  value: drivers.length },
        { label: 'Active',         value: active },
        { label: 'Invite Pending', value: pending },
      ]} />

      <Card>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={600}>Driver Roster</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Driver', 'License', 'Status'].map(h => (
                  <TableCell key={h} sx={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.5, color: 'secondary.main', bgcolor: 'action.hover' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map((d, i) => (
                <TableRow key={d.id} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
                        {d.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{d.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{d.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{d.license_number || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={d.invite_accepted ? 'Active' : 'Pending'}
                      size="small"
                      color={d.invite_accepted ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

// ── Imports tab ───────────────────────────────────────────────────────────────
function ImportsTab() {
  return (
    <EmptyState icon={UploadFileIcon} title="Imports coming soon" subtitle="CSV and TMS data imports will be available here." />
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function CarrierAnalytics() {
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const activeTab = searchParams.get('tab') || 'loads';

  useEffect(() => {
    analyticsApi.summary()
      .then(data => { setSummary(data); setError(null); })
      .catch(err  => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {activeTab === 'loads'    && <LoadsTab    summary={summary} loading={loading} error={error} />}
      {activeTab === 'payments' && <PaymentsTab summary={summary} loading={loading} error={error} />}
      {activeTab === 'drivers'  && <DriversTab />}
      {activeTab === 'imports'  && <ImportsTab />}
    </Box>
  );
}
