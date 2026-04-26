import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadsApi, analyticsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import LoadCard from '../../components/carrier/LoadCard';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import IonIcon from '../../components/IonIcon';

const cardStyle = {
  backgroundColor: 'var(--ion-card-background)',
  border: '1px solid var(--ion-border-color)',
  borderRadius: 8,
};

const StatCard = ({ icon, label, value, sub }) => (
  <div style={cardStyle}>
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'var(--ion-color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IonIcon name={icon} style={{ fontSize: 20, color: 'var(--ion-color-primary)' }} />
        </div>
      </div>
      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ion-color-medium)' }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ion-text-color)', margin: '4px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{sub}</div>}
    </div>
  </div>
);

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

    analyticsApi.summary().then(data => setSummary(data)).catch(() => setSummary(null));
  }, []);

  const weeklyData = (summary?.weekly_earnings || []).slice(-6);
  const chartData = weeklyData.map(w => ({ week: w.week_label, net: w.net }));
  const fmt = (n) => n != null ? `$${Number(n).toLocaleString()}` : '—';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: 'var(--ion-text-color)' }}>
            Good morning, {user?.name?.split(' ')[0]}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Here's your profit snapshot for today</p>
        </div>
        <Link to="/carrier/loads" style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--ion-color-primary)', color: '#fff', textDecoration: 'none', borderRadius: 6, padding: '9px 16px', fontWeight: 700, fontSize: '0.875rem' }}>
          <IonIcon name="car-sport-outline" style={{ fontSize: 18 }} /> Browse Loads
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <StatCard icon="cash-outline" label="Total Net" value={fmt(summary?.total_net)} sub="All time" />
        </div>
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <StatCard icon="trending-up-outline" label="Avg Rate/Mile" value={summary?.avg_rate_per_mile ? `$${Number(summary.avg_rate_per_mile).toFixed(2)}` : '—'} sub="All time" />
        </div>
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <StatCard icon="cube-outline" label="Loads Completed" value={summary?.total_loads ?? '—'} sub="All time" />
        </div>
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <StatCard icon="location-outline" label="Avg Deadhead" value={summary?.avg_deadhead_miles ? `${Math.round(summary.avg_deadhead_miles)} mi` : '—'} sub="Per load" />
        </div>
      </div>

      {/* Earnings chart + Brain insight */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, flex: 1, minWidth: 0 }}>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Earnings Trend</span>
              <Link to="/carrier/analytics" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--ion-color-primary)', textDecoration: 'none' }}>
                Full analytics <IonIcon name="arrow-forward-outline" style={{ fontSize: 14 }} />
              </Link>
            </div>
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
                  <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Net']} />
                  <Area type="monotone" dataKey="net" stroke="#1565C0" strokeWidth={2} fill="url(#netGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Complete loads to see your earnings trend</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ ...cardStyle, flex: 1, minWidth: 0, borderColor: 'var(--ion-color-primary-shade)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <IonIcon name="bulb-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 20 }} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Earnings Brain</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', textAlign: 'center' }}>Insights load on the Brain page</span>
            </div>
            <Link to="/carrier/brain" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'var(--ion-color-primary)', color: '#fff', textDecoration: 'none', borderRadius: 6, padding: '9px 0', fontWeight: 700, fontSize: '0.875rem', marginTop: 16 }}>
              See all insights <IonIcon name="arrow-forward-outline" style={{ fontSize: 14 }} />
            </Link>
          </div>
        </div>
      </div>

      {/* Hot Loads */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IonIcon name="flash-outline" style={{ color: 'var(--ion-color-danger)' }} />
          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Hot Loads Right Now</span>
        </div>
        <Link to="/carrier/loads" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--ion-color-primary)', textDecoration: 'none' }}>
          View all <IonIcon name="arrow-forward-outline" style={{ fontSize: 14 }} />
        </Link>
      </div>
      {hotLoads.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px 24px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No hot loads right now — check back soon</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {hotLoads.map(load => (
            <LoadCard key={load.id} load={load} />
          ))}
        </div>
      )}
    </div>
  );
}
