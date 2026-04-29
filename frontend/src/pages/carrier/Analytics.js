import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { analyticsApi, driversApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const TT = {
  contentStyle: {
    background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, fontSize: 12,
  },
};

const cardStyle = { backgroundColor: 'var(--ion-card-background)', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' };
const thStyle   = { padding: '10px 12px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ion-color-medium)', backgroundColor: 'var(--ion-background-color)', whiteSpace: 'nowrap' };
const tdStyle   = { padding: '12px', fontSize: '0.875rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)' };

const fmt  = (n) => n != null ? `$${Number(n).toLocaleString()}` : '—';
const fmtN = (n) => n != null ? Number(n).toLocaleString() : '—';

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4 }} />;
}

function SkeletonCards() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonBox width="40%" height={20} />
          <SkeletonBox width="60%" height={40} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ ...cardStyle, padding: '64px 20px', textAlign: 'center' }}>
      <IonIcon name={icon} style={{ fontSize: 48, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
      <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)' }}>{title}</p>
      {subtitle && <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{subtitle}</p>}
    </div>
  );
}

function KpiRow({ items }) {
  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      {items.map(({ icon, label, value, color }) => (
        <div key={label} style={{ ...cardStyle, flex: '1 1 160px', minWidth: 0, padding: 16 }}>
          {icon && (
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'var(--ion-color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <IonIcon name={icon} style={{ fontSize: 18, color: color || 'var(--ion-color-primary)' }} />
            </div>
          )}
          <p style={{ margin: '0 0 2px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{label}</p>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: color || 'var(--ion-text-color)', display: 'block' }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

const VERDICT = {
  'Run it': { bg: 'rgba(46,125,50,0.12)',  color: '#2e7d32' },
  'Okay':   { bg: 'rgba(237,108,2,0.12)',  color: '#ed6c02' },
  'Avoid':  { bg: 'rgba(211,47,47,0.12)',  color: '#d32f2f' },
};

function LoadsTab({ summary, loading, error }) {
  if (loading) return <SkeletonCards />;
  if (error)   return <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>;

  const weekly   = summary?.weekly_earnings || [];
  const laneData = summary?.lane_stats || [];
  const isEmpty  = weekly.length === 0 && laneData.length === 0;

  if (isEmpty) return (
    <EmptyState icon="trending-up-outline" title="No load analytics yet" subtitle="Complete loads to see your performance." />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <KpiRow items={[
        { icon: 'cash-outline',        label: 'Total Gross',  value: fmt(summary?.total_gross) },
        { icon: 'trending-up-outline', label: 'Total Net',    value: fmt(summary?.total_net) },
        { icon: 'cube-outline',        label: 'Total Miles',  value: fmtN(summary?.total_miles) },
        { icon: 'location-outline',    label: 'Avg Net/Mile', value: summary?.avg_net_per_mile ? `$${Number(summary.avg_net_per_mile).toFixed(2)}` : '—' },
      ]} />

      {weekly.length > 0 && (
        <>
          <div style={cardStyle}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)' }}>Net Earnings by Week</span>
            </div>
            <div style={{ padding: 16 }}>
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
              <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                {[['#1565C0', 'Gross'], ['#1976D2', 'Net']].map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 2, backgroundColor: c }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)' }}>Miles Driven</span>
            </div>
            <div style={{ padding: 16 }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="week_label" tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9e9e9e', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} formatter={v => [Number(v).toLocaleString() + ' mi', 'Miles']} />
                  <Bar dataKey="miles" fill="#1565C0" fillOpacity={0.75} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {laneData.length > 0 && (
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)' }}>Top Lane Performance</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Lane', 'Runs', 'Avg Net Profit', 'Avg Rate/Mile', 'Verdict'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {laneData.map((lane, i) => {
                  const profit = lane.avg_net_profit || 0;
                  const verdict = profit > 1000 ? 'Run it' : profit > 0 ? 'Okay' : 'Avoid';
                  const vStyle = VERDICT[verdict];
                  return (
                    <tr key={i}>
                      <td style={tdStyle}><strong>{lane.origin} → {lane.destination}</strong></td>
                      <td style={tdStyle}>{lane.run_count}x</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{fmt(lane.avg_net_profit)}</td>
                      <td style={tdStyle}>${Number(lane.avg_rate_per_mile || 0).toFixed(2)}/mi</td>
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, backgroundColor: vStyle.bg, color: vStyle.color }}>
                          {verdict}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentsTab({ summary, loading, error }) {
  if (loading) return <SkeletonCards />;
  if (error)   return <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>;

  const gross    = summary?.total_gross || 0;
  const net      = summary?.total_net   || 0;
  const expenses = Math.max(gross - net, 0);
  const weekly   = summary?.weekly_earnings || [];

  if (gross === 0 && net === 0) return (
    <EmptyState icon="cash-outline" title="No payment data yet" subtitle="Payment analytics will appear once you complete loads." />
  );

  const pieData = [
    { name: 'Net Profit', value: net      > 0 ? net      : 0 },
    { name: 'Expenses',   value: expenses > 0 ? expenses : 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <KpiRow items={[
        { label: 'Total Gross Revenue', value: fmt(gross),    color: 'var(--ion-color-primary)' },
        { label: 'Total Net Profit',    value: fmt(net),      color: '#2e7d32' },
        { label: 'Total Expenses',      value: fmt(expenses), color: '#ed6c02' },
        { label: 'Profit Margin',       value: gross > 0 ? `${((net / gross) * 100).toFixed(1)}%` : '—', color: '#0288d1' },
      ]} />

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {weekly.length > 0 && (
          <div style={{ ...cardStyle, flex: '1 1 320px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)' }}>Gross vs Net by Week</span>
            </div>
            <div style={{ padding: 16 }}>
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
            </div>
          </div>
        )}

        <div style={{ ...cardStyle, flex: '0 0 280px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)' }}>Profit Breakdown</span>
          </div>
          <div style={{ padding: 16 }}>
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
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

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
    <EmptyState icon="id-card-outline" title="No drivers yet" subtitle="Invite drivers from the My Drivers page to see analytics here." />
  );

  const active  = drivers.filter(d =>  d.invite_accepted).length;
  const pending = drivers.filter(d => !d.invite_accepted).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <KpiRow items={[
        { label: 'Total Drivers',  value: drivers.length },
        { label: 'Active',         value: active },
        { label: 'Invite Pending', value: pending },
      ]} />

      <div style={cardStyle}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)' }}>Driver Roster</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Driver', 'License', 'Status'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={d.name} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{d.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{d.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--ion-color-medium)' }}>{d.license_number || '—'}</td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600,
                      border: `1px solid ${d.invite_accepted ? '#2e7d32' : '#ed6c02'}`,
                      color: d.invite_accepted ? '#2e7d32' : '#ed6c02',
                    }}>
                      {d.invite_accepted ? 'Active' : 'Pending'}
                    </span>
                  </td>
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
  return (
    <EmptyState icon="cloud-upload-outline" title="Imports coming soon" subtitle="CSV and TMS data imports will be available here." />
  );
}

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
    <div style={{ padding: 10, overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
        {activeTab === 'loads'    && <LoadsTab    summary={summary} loading={loading} error={error} />}
        {activeTab === 'payments' && <PaymentsTab summary={summary} loading={loading} error={error} />}
        {activeTab === 'drivers'  && <DriversTab />}
        {activeTab === 'imports'  && <ImportsTab />}
      </div>
    </div>
  );
}
