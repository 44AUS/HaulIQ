import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-color-light)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

function SkeletonBox({ height }) {
  return <div style={{ height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4, marginBottom: 8 }} />;
}

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.revenue().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[...Array(5)].map((_, i) => <SkeletonBox key={i} height={72} />)}
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <span style={{ color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>Failed to load revenue data.</span>
    </div>
  );

  const { total_mrr = 0, arr = 0, breakdown = [] } = data;
  const totalSubs = breakdown.reduce((s, p) => s + p.subscribers, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <IonIcon name="cash-outline" style={{ color: 'var(--ion-color-primary)' }} />
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>Revenue Analytics</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Subscription revenue breakdown by plan</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {[
          { label: 'Monthly MRR',        value: `$${(total_mrr / 1000).toFixed(1)}K` },
          { label: 'ARR (projected)',     value: `$${(arr / 1000).toFixed(1)}K` },
          { label: 'Active Subscribers', value: totalSubs.toLocaleString() },
          { label: 'Avg Rev / Sub',      value: totalSubs > 0 ? `$${(total_mrr / totalSubs).toFixed(2)}` : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ ...cardStyle, padding: 16 }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: 'var(--ion-color-medium)' }}>{label}</p>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--ion-text-color)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue by plan table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Revenue by Plan</span>
        </div>
        {breakdown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>No subscription data yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Plan', 'Subscribers', 'Price', 'MRR', 'MRR Share'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {breakdown.map(p => (
                  <tr key={p.plan}>
                    <td style={tdStyle}><span style={{ fontWeight: 600 }}>{p.plan}</span></td>
                    <td style={tdStyle}><span style={{ color: 'var(--ion-color-medium)' }}>{p.subscribers.toLocaleString()}</span></td>
                    <td style={tdStyle}>
                      {p.price === 0
                        ? <span style={{ color: 'var(--ion-color-medium)' }}>Free</span>
                        : <span style={{ color: 'var(--ion-color-medium)' }}>${p.price}/mo</span>
                      }
                    </td>
                    <td style={tdStyle}>
                      {p.mrr === 0
                        ? <span style={{ color: 'var(--ion-color-medium)' }}>$0</span>
                        : <span style={{ fontWeight: 700 }}>${p.mrr.toLocaleString()}</span>
                      }
                    </td>
                    <td style={{ ...tdStyle, minWidth: 160 }}>
                      {total_mrr > 0 && p.mrr > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'var(--ion-color-light)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(p.mrr / total_mrr * 100).toFixed(0)}%`, borderRadius: 3, backgroundColor: 'var(--ion-color-primary)' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', width: 32, flexShrink: 0 }}>
                            {(p.mrr / total_mrr * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: 'var(--ion-color-light)' }}>
                  <td style={tdStyle}><span style={{ fontWeight: 700 }}>Total</span></td>
                  <td style={tdStyle}><span style={{ fontWeight: 700 }}>{totalSubs.toLocaleString()}</span></td>
                  <td style={tdStyle}><span style={{ color: 'var(--ion-color-medium)' }}>—</span></td>
                  <td style={tdStyle}><span style={{ fontWeight: 800, color: 'var(--ion-color-primary)' }}>${total_mrr.toLocaleString()}</span></td>
                  <td style={tdStyle}><span style={{ color: 'var(--ion-color-medium)' }}>100%</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
