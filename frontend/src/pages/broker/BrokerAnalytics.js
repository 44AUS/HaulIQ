import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { analyticsApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell,
} from 'recharts';

const TT = {
  contentStyle: { background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, fontSize: 12 },
};

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-background-color)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

function SkeletonBox({ height }) {
  return <div style={{ height, backgroundColor: 'var(--ion-color-light)', borderRadius: 8, marginBottom: 12 }} />;
}

function SkeletonCards() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[...Array(4)].map((_, i) => <SkeletonBox key={i} height={88} />)}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ ...cardStyle, padding: '64px 0', textAlign: 'center' }}>
      <IonIcon name={icon} style={{ fontSize: 48, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
      <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{title}</p>
      {subtitle && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{subtitle}</p>}
    </div>
  );
}

function KpiRow({ items }) {
  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      {items.map(({ icon, label, value, sub, color }) => (
        <div key={label} style={{ ...cardStyle, flex: '1 1 160px', minWidth: 0, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          {icon && (
            <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'var(--ion-color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IonIcon name={icon} style={{ color: color || 'var(--ion-color-primary)', fontSize: 20 }} />
            </div>
          )}
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '0.78rem', color: 'var(--ion-color-medium)' }}>{label}</p>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--ion-text-color)', lineHeight: 1 }}>{value}</p>
            {sub && <p style={{ margin: '2px 0 0', fontSize: '0.65rem', color: 'var(--ion-color-medium)' }}>{sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadsTab({ data, loading, error }) {
  if (loading) return <SkeletonCards />;
  if (error) return <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>;
  if (!data) return null;

  const fillRate = data.fill_rate ?? 0;
  const avgTime  = data.avg_time_to_fill_hours != null ? `${data.avg_time_to_fill_hours}h` : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <KpiRow items={[
        { icon: 'eye-outline',         label: 'Total Views',      value: (data.total_views || 0).toLocaleString(), sub: 'All loads',             color: '#0288d1' },
        { icon: 'people-outline',      label: 'Total Bids',       value: (data.total_bids  || 0).toLocaleString(), sub: 'All loads',             color: '#ed6c02' },
        { icon: 'trending-up-outline', label: 'Fill Rate',        value: `${fillRate}%`,                           sub: 'Loads filled / posted', color: '#2e7d32' },
        { icon: 'time-outline',        label: 'Avg Time-to-Fill', value: avgTime,                                  sub: 'From post to approval', color: 'var(--ion-color-primary)' },
      ]} />

      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Views → Bids → Filled (Last 6 Weeks)</p>
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
          <p style={{ textAlign: 'center', color: 'var(--ion-color-medium)', fontSize: '0.875rem', padding: '40px 0' }}>
            No load data yet. Post loads to see weekly trends.
          </p>
        )}
      </div>
    </div>
  );
}

function PaymentsTab({ data, loading, error }) {
  if (loading) return <SkeletonCards />;
  if (error) return <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>;

  const total  = data?.total_revenue || 0;
  const paid   = data?.total_paid    || 0;
  const unpaid = data?.total_unpaid  || 0;

  if (total === 0 && paid === 0 && unpaid === 0) return (
    <EmptyState icon="cash-outline" title="No payment data yet" subtitle="Payment analytics will appear once loads are booked." />
  );

  const pieData = [
    { name: 'Paid',   value: paid   > 0 ? paid   : 0 },
    { name: 'Unpaid', value: unpaid > 0 ? unpaid : 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <KpiRow items={[
        { label: 'Total Revenue', value: `$${Number(total).toLocaleString()}`,  color: 'var(--ion-color-primary)' },
        { label: 'Paid Out',      value: `$${Number(paid).toLocaleString()}`,   color: '#2e7d32' },
        { label: 'Outstanding',   value: `$${Number(unpaid).toLocaleString()}`, color: '#ed6c02' },
      ]} />

      {(paid > 0 || unpaid > 0) && (
        <div style={{ ...cardStyle, padding: 20, maxWidth: 320 }}>
          <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Payment Status</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={entry.name} fill={['#2E7D32', '#EF6C00'][i]} />)}
              </Pie>
              <Tooltip formatter={v => `$${Number(v).toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function DriversTab({ data, loading, error }) {
  if (loading) return <SkeletonCards />;
  if (error) return <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>;

  const carriers = data?.top_carriers || [];
  if (carriers.length === 0) return (
    <EmptyState icon="people-outline" title="No carrier partners yet" subtitle="Top carriers will appear here once loads are completed." />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <KpiRow items={[
        { label: 'Unique Carriers', value: carriers.length },
        { label: 'Top Carrier',     value: carriers[0]?.name || '—' },
        { label: 'Loads (Top)',     value: carriers[0]?.loads ?? '—' },
      ]} />

      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Top Carrier Partners</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Carrier', 'MC #', 'Loads Taken'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {carriers.map((c, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 1 ? 'var(--ion-color-light)' : 'transparent' }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ ...tdStyle, color: 'var(--ion-color-medium)' }}>{c.mc_number || '—'}</td>
                  <td style={{ ...tdStyle, color: 'var(--ion-color-medium)' }}>{c.loads}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ImportsTab() {
  return <EmptyState icon="cloud-upload-outline" title="Imports coming soon" subtitle="CSV and load template imports will be available here." />;
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {activeTab === 'loads'    && <LoadsTab    data={data} loading={loading} error={error} />}
      {activeTab === 'payments' && <PaymentsTab data={data} loading={loading} error={error} />}
      {activeTab === 'drivers'  && <DriversTab  data={data} loading={loading} error={error} />}
      {activeTab === 'imports'  && <ImportsTab />}
    </div>
  );
}
