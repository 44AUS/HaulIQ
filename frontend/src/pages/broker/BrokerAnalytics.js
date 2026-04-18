import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Alert, Skeleton,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material';
import { analyticsApi } from '../../services/api';
import {
import IonIcon from '../../components/IonIcon';

  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell,
} from 'recharts';

const TT = {
  contentStyle: { background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, fontSize: 12 },
};

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
      {items.map(({ icon: Icon, label, value, sub, color }) => (
        <Box key={label} sx={{ flex: '1 1 160px', minWidth: 0 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {Icon && (
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon sx={{ color: color || 'primary.main' }} />
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h4" fontWeight={800}>{value}</Typography>
                {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
              </Box>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
}

// ── Loads tab ─────────────────────────────────────────────────────────────────
function LoadsTab({ data, loading, error }) {
  if (loading) return <SkeletonCards />;
  if (error)   return <Alert severity="error">{error}</Alert>;
  if (!data)   return null;

  const fillRate = data.fill_rate ?? 0;
  const avgTime  = data.avg_time_to_fill_hours != null ? `${data.avg_time_to_fill_hours}h` : '—';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <KpiRow items={[
        { icon: VisibilityIcon,  label: 'Total Views',       value: (data.total_views || 0).toLocaleString(), sub: 'All loads',               color: 'info.main' },
        { icon: GroupIcon,       label: 'Total Bids',        value: (data.total_bids  || 0).toLocaleString(), sub: 'All loads',               color: 'warning.main' },
        { icon: TrendingUpIcon,  label: 'Fill Rate',         value: `${fillRate}%`,                           sub: 'Loads filled / posted',   color: 'success.main' },
        { icon: AccessTimeIcon,  label: 'Avg Time-to-Fill',  value: avgTime,                                  sub: 'From post to approval',   color: 'primary.main' },
      ]} />

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Views → Bids → Filled (Last 6 Weeks)</Typography>
          {data.weekly && data.weekly.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.weekly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TT} />
                <Legend />
                <Bar dataKey="views"  name="Views"  fill="#546E7A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bids"   name="Bids"   fill="#1565C0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="filled" name="Filled" fill="#2E7D32" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 5 }}>
              No load data yet. Post loads to see weekly trends.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// ── Payments tab ──────────────────────────────────────────────────────────────
function PaymentsTab({ data, loading, error }) {
  if (loading) return <SkeletonCards />;
  if (error)   return <Alert severity="error">{error}</Alert>;

  const total  = data?.total_revenue    || 0;
  const paid   = data?.total_paid       || 0;
  const unpaid = data?.total_unpaid     || 0;

  if (total === 0 && paid === 0 && unpaid === 0) return (
    <EmptyState icon={AttachMoneyIcon} title="No payment data yet" subtitle="Payment analytics will appear once loads are booked." />
  );

  const pieData = [
    { name: 'Paid',   value: paid   > 0 ? paid   : 0 },
    { name: 'Unpaid', value: unpaid > 0 ? unpaid : 0 },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <KpiRow items={[
        { label: 'Total Revenue', value: `$${Number(total).toLocaleString()}`,  color: 'primary.main' },
        { label: 'Paid Out',      value: `$${Number(paid).toLocaleString()}`,   color: 'success.main' },
        { label: 'Outstanding',   value: `$${Number(unpaid).toLocaleString()}`, color: 'warning.main' },
      ]} />

      {(paid > 0 || unpaid > 0) && (
        <Card sx={{ maxWidth: 320 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Payment Status</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={['#2E7D32', '#EF6C00'][i]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => `$${Number(v).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// ── Drivers tab (top carrier partners) ───────────────────────────────────────
function DriversTab({ data, loading, error }) {
  if (loading) return <SkeletonCards />;
  if (error)   return <Alert severity="error">{error}</Alert>;

  const carriers = data?.top_carriers || [];

  if (carriers.length === 0) return (
    <EmptyState icon={GroupIcon} title="No carrier partners yet" subtitle="Top carriers will appear here once loads are completed." />
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <KpiRow items={[
        { label: 'Unique Carriers',  value: carriers.length },
        { label: 'Top Carrier',      value: carriers[0]?.name || '—' },
        { label: 'Loads (Top)',      value: carriers[0]?.loads ?? '—' },
      ]} />

      <Card>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={600}>Top Carrier Partners</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Carrier', 'MC #', 'Loads Taken'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'secondary.main', bgcolor: 'action.hover' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {carriers.map((c, i) => (
                <TableRow key={i} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{c.mc_number || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{c.loads}x</TableCell>
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
    <EmptyState icon={UploadFileIcon} title="Imports coming soon" subtitle="CSV and load template imports will be available here." />
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function BrokerAnalytics() {
  const [searchParams] = useSearchParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const activeTab = searchParams.get('tab') || 'loads';

  useEffect(() => {
    analyticsApi.broker()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {activeTab === 'loads'    && <LoadsTab    data={data} loading={loading} error={error} />}
      {activeTab === 'payments' && <PaymentsTab data={data} loading={loading} error={error} />}
      {activeTab === 'drivers'  && <DriversTab  data={data} loading={loading} error={error} />}
      {activeTab === 'imports'  && <ImportsTab />}
    </Box>
  );
}
