import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const PLAN_COLORS = { basic: '#455a64', pro: '#1565C0', elite: '#6a1b9a', admin: '#b71c1c' };

const KPI_ICON_BG = {
  success: '#2e7d32',
  primary: 'var(--ion-color-primary)',
  warning: '#e65100',
  info:    '#0288d1',
};

const cardStyle = {
  backgroundColor: 'var(--ion-card-background)',
  border: '1px solid var(--ion-border-color)',
  borderRadius: 8,
  padding: '16px',
};

function SkeletonBox({ width, height, style }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4, ...style }} />;
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <SkeletonBox width={220} height={28} style={{ marginBottom: 8 }} />
        <SkeletonBox width={300} height={16} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={cardStyle}>
            <SkeletonBox width={34} height={34} style={{ marginBottom: 12, borderRadius: 6 }} />
            <SkeletonBox width="65%" height={14} style={{ marginBottom: 8 }} />
            <SkeletonBox width="50%" height={32} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ ...cardStyle, padding: 24 }}>
            <SkeletonBox width={220} height={20} style={{ marginBottom: 20 }} />
            {[1, 2, 3].map(j => (
              <div key={j} style={{ marginBottom: 16 }}>
                <SkeletonBox width="60%" height={14} style={{ marginBottom: 6 }} />
                <SkeletonBox width="100%" height={8} style={{ borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  if (!stats) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <span style={{ color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>Failed to load stats.</span>
    </div>
  );

  const kpis = [
    { icon: 'cash-outline',        label: 'Monthly MRR',        value: `$${(stats.mrr / 1000).toFixed(1)}K`,      color: 'success' },
    { icon: 'trending-up-outline', label: 'ARR',                value: `$${(stats.arr / 1000).toFixed(1)}K`,      color: 'success' },
    { icon: 'people-outline',      label: 'Active Subscribers', value: stats.active_subscribers.toLocaleString(),  color: 'primary' },
    { icon: 'cube-outline',        label: 'Active Loads',       value: stats.active_loads.toLocaleString(),        color: 'warning' },
    { icon: 'person-outline',      label: 'Total Users',        value: stats.total_users.toLocaleString(),         color: 'info'    },
    { icon: 'car-outline',         label: 'Total Carriers',     value: stats.total_carriers.toLocaleString(),      color: 'primary' },
    { icon: 'briefcase-outline',   label: 'Total Brokers',      value: stats.total_brokers.toLocaleString(),       color: 'info'    },
    { icon: 'sparkles-outline',    label: 'New Users (30d)',    value: stats.new_users_30d.toLocaleString(),       color: 'success' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <IonIcon name="shield-outline" style={{ color: 'var(--ion-color-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>Admin Dashboard</h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Platform overview — Urload Operations</p>
        </div>
        <span style={{ backgroundColor: '#2e7d32', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 12 }}>
          All systems operational
        </span>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
        {kpis.map(({ icon, label, value, color }) => (
          <div key={label} style={cardStyle}>
            <div style={{ width: 34, height: 34, borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: KPI_ICON_BG[color] }}>
              <IonIcon name={icon} style={{ fontSize: 18, color: '#fff' }} />
            </div>
            <p style={{ margin: '0 0 2px', fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>{label}</p>
            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--ion-text-color)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Plan distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
        {[
          { title: 'Carrier Plan Distribution', data: stats.carrier_plan_distribution },
          { title: 'Broker Plan Distribution',  data: stats.broker_plan_distribution  },
        ].map(({ title, data }) => (
          <div key={title} style={{ ...cardStyle, padding: 24 }}>
            <p style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>{title}</p>
            {(!data || data.length === 0) ? (
              <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No data yet</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {data.map(d => (
                  <div key={d.plan}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--ion-text-color)' }}>{d.plan}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{d.count} users · {d.pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, backgroundColor: 'var(--ion-color-light)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${d.pct}%`, borderRadius: 4, backgroundColor: PLAN_COLORS[d.plan] || 'var(--ion-color-primary)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
